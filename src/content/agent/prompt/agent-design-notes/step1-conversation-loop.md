# Step 1: 对话循环核心架构

> 来源: `restored-src/src/QueryEngine.ts` + `restored-src/src/query.ts`

---

## 1. 整体架构分层

```
┌────────────────────────────────────────┐
│           外部调用方 (CLI / SDK)          │
└──────────────────┬─────────────────────┘
                   │  submitMessage(prompt)
┌──────────────────▼─────────────────────┐
│            QueryEngine                  │  会话生命周期层
│   - 持有 mutableMessages (消息历史)       │
│   - 持有 abortController               │
│   - 持有 totalUsage / permissionDenials│
└──────────────────┬─────────────────────┘
                   │  query(messages, systemPrompt, ...)
┌──────────────────▼─────────────────────┐
│         query() / queryLoop()           │  核心对话循环层
│   - while(true) 驱动 Agent 推理          │
│   - 每轮: LLM → 解析 → 执行工具 → 继续    │
└──────────────────┬─────────────────────┘
                   │  callModel(messages, systemPrompt, tools)
┌──────────────────▼─────────────────────┐
│         LLM API (Anthropic claude.ts)   │  模型调用层
│   - 流式返回 assistant message           │
│   - 可能包含 tool_use blocks             │
└────────────────────────────────────────┘
```

---

## 2. QueryEngine: 会话生命周期管理

### 核心职责

一个 `QueryEngine` 实例对应**一次完整会话**，跨多轮 `submitMessage()` 保持状态。

### 关键成员变量

```typescript
class QueryEngine {
  private mutableMessages: Message[]      // 完整消息历史
  private abortController: AbortController // 中断控制
  private permissionDenials: SDKPermissionDenial[] // 权限拒绝记录
  private totalUsage: NonNullableUsage    // 累计 token 用量
  private readFileState: FileStateCache   // 文件读取缓存
  private discoveredSkillNames: Set<string> // 本轮已发现的技能
  private loadedNestedMemoryPaths: Set<string> // 已加载的 MEMORY 文件路径
}
```

### submitMessage() 流程

```
submitMessage(prompt)
  │
  ├─ 1. 重置 discoveredSkillNames (turn-scoped 技能追踪)
  ├─ 2. fetchSystemPromptParts() → defaultSystemPrompt + userContext + systemContext
  ├─ 3. 组装 systemPrompt = [customPrompt or defaultSystemPrompt] + [memoryMechanics] + [appendPrompt]
  ├─ 4. processUserInput(prompt) → 处理 slash 命令、附件、图片等
  ├─ 5. 将新消息 push 到 mutableMessages
  ├─ 6. 持久化 transcript (recordTranscript)
  ├─ 7. yield buildSystemInitMessage() → SDK 初始化事件
  ├─ 8. for await (query(messages, systemPrompt, ...)) → 主循环
  │     └─ 按消息类型分发处理 (assistant / user / stream_event / attachment / system)
  └─ 9. yield result (success / error_max_turns / error_max_budget_usd / error_during_execution)
```

### 输出消息类型 (SDKMessage)

| 类型 | 触发时机 |
|------|---------|
| `system/init` | 每次 submitMessage 开始时，携带工具列表、模型、权限模式 |
| `assistant` | LLM 返回的文字/思考/工具调用块 |
| `user` | 工具执行结果回填、用户消息 replay |
| `stream_event` | 流式传输的原始 API 事件 |
| `result/success` | 对话正常结束 |
| `result/error_max_turns` | 达到最大轮数 |
| `result/error_max_budget_usd` | 超出费用预算 |
| `result/error_during_execution` | 执行中出现错误 |

---

## 3. query() / queryLoop(): 核心对话循环

### 循环状态 (State)

```typescript
type State = {
  messages: Message[]           // 当前消息列表 (每轮可能经过压缩)
  toolUseContext: ToolUseContext // 工具执行上下文
  autoCompactTracking: ...      // 自动压缩追踪状态
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<...> | undefined
  stopHookActive: boolean | undefined
  turnCount: number             // 当前轮次计数
  transition: Continue | undefined // 上一次迭代的继续原因
}
```

### 单轮迭代流程

```
while (true) {
  │
  ├─ 1. 预处理消息
  │     ├─ applyToolResultBudget()  — 裁剪过大的工具结果
  │     ├─ snipCompactIfNeeded()    — 移除旧消息段
  │     ├─ microcompact()           — 压缩单条超大工具结果
  │     ├─ applyCollapsesIfNeeded() — 折叠上下文
  │     └─ autocompact()            — 整体摘要压缩
  │
  ├─ 2. 调用 LLM (callModel)
  │     └─ 流式返回 → 收集 assistantMessages + toolUseBlocks
  │
  ├─ 3. 判断是否需要执行工具
  │     └─ if toolUseBlocks.length > 0: needsFollowUp = true
  │
  ├─ 4. 执行工具 (runTools)
  │     ├─ 只读工具: 并发执行
  │     └─ 写入工具: 串行执行
  │
  ├─ 5. 将工具结果 (toolResults) 拼入消息
  │
  ├─ 6. 判断退出条件
  │     ├─ needsFollowUp == false → return { reason: 'end_turn' }
  │     ├─ turnCount >= maxTurns  → yield max_turns_reached attachment → return
  │     └─ aborted               → return { reason: 'aborted' }
  │
  └─ 7. state = { ...state, messages: updatedMessages, turnCount: turnCount + 1 }
         continue (下一轮)
}
```

### 退出信号

| 退出原因 | 描述 |
|---------|------|
| `end_turn` | LLM 返回纯文本，没有 tool_use，自然结束 |
| `max_turns` | 达到 maxTurns 限制 |
| `aborted` | 外部调用 abortController.abort() |
| `blocking_limit` | 上下文超出硬性限制且无法压缩 |
| `stop_hook_exit` | Stop hooks 触发退出 |

---

## 4. 消息类型系统

```
Message
  ├─ UserMessage       { role: 'user', content, toolUseResult?, isMeta? }
  ├─ AssistantMessage  { role: 'assistant', content: ContentBlock[] }
  │     ContentBlock: TextBlock | ToolUseBlock | ThinkingBlock | RedactedThinkingBlock
  ├─ SystemMessage     { subtype: 'compact_boundary' | 'api_error' | 'local_command' | ... }
  ├─ ProgressMessage   { subtype, toolUseID, data }
  ├─ AttachmentMessage { attachment: { type, ... } }
  └─ TombstoneMessage  { message: AssistantMessage }  // 流式回退时清除孤立消息
```

---

## 5. 关键设计模式

### AsyncGenerator 流式输出

整个调用链从 `submitMessage()` 到 `queryLoop()` 全部采用 `AsyncGenerator`，通过 `yield` 向上层推送事件流，实现:
- 流式响应 (LLM 边生成边输出)
- 工具执行进度通知
- 消息类型路由 (外层按类型分发处理)

### 双层消息数组

- `messages` (局部快照): 每次进入 queryLoop 时的快照，传给 LLM
- `mutableMessages` (持久历史): QueryEngine 持有，跨 turn 累积

### Turn vs 会话

- **Turn**: 一次 `while` 循环迭代 = 一次 LLM 调用 + 工具执行
- **会话**: 一个 `QueryEngine` 实例的生命周期，包含多次 `submitMessage()`
- 每次 `submitMessage()` 内部可以有多个 Turn (Agent 自主执行工具直到任务完成)
