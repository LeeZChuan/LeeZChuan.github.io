# Step 3: 工具编排与执行

> 来源: `restored-src/src/Tool.ts` + `restored-src/src/services/tools/toolOrchestration.ts` + `restored-src/src/services/tools/toolExecution.ts` + `restored-src/src/hooks/useCanUseTool.tsx`

---

## 1. 工具定义接口

每个工具是一个实现 `Tool` 接口的对象:

```typescript
type Tool = {
  name: string                         // 工具唯一标识名
  description: string                  // 给 LLM 看的工具说明
  inputSchema: ZodSchema               // 输入参数 zod schema (自动生成 JSON Schema)
  call(input, toolUseContext): AsyncGenerator<ToolProgress | ToolResult>
  isReadOnly(input): boolean           // 是否只读 (决定并发策略)
  isConcurrencySafe?(input): boolean   // 是否并发安全
  userFacingName?(input): string       // 展示给用户的操作名称
  prompt: string                       // 注入 systemPrompt 的工具说明文本
  maxResultSizeChars?: number          // 结果大小限制 (超限触发微压缩)
  backfillObservableInput?(input): void // 在 yield 前补充可观测字段 (SDK 输出用)
}
```

### 内置工具分类 (src/tools/)

| 类别 | 工具 | 只读 |
|------|------|------|
| 文件操作 | FileReadTool, FileWriteTool, FileEditTool | 读✅ 写❌ |
| 搜索 | GlobTool, GrepTool | ✅ |
| 执行 | BashTool, PowerShellTool | ❌ |
| 网络 | WebFetchTool, WebSearchTool | ✅ |
| Agent | AgentTool (子 Agent) | ❌ |
| 任务管理 | TaskCreateTool, TaskGetTool, TodoWriteTool | 部分 |
| MCP | MCPTool (动态接入外部工具) | 依协议 |
| 问询 | AskUserQuestionTool | ❌ (需用户交互) |

---

## 2. 权限控制层 (canUseTool)

每次工具调用前，必须通过 `canUseTool()` 检查:

```
canUseTool(tool, input, toolUseContext, assistantMessage, toolUseID, forceDecision)
  │
  ├─ 返回 { behavior: 'allow' }         → 直接执行
  ├─ 返回 { behavior: 'deny', reason }  → 拒绝，注入错误 tool_result
  └─ 返回 { behavior: 'ask', ... }      → 暂停，向用户展示 PermissionRequest UI
```

### 权限模式 (PermissionMode)

| 模式 | 描述 |
|------|------|
| `default` | 危险操作询问用户 |
| `acceptEdits` | 自动允许文件编辑，其他询问 |
| `bypassPermissions` | 全部自动允许 (--dangerously-skip-permissions) |
| `plan` | 只读模式，不执行写入操作 |

### 权限规则匹配 (PermissionRule)

支持声明式权限规则，可在 CLAUDE.md 或配置中预授权:
```
allow: bash(git commit*)   # 允许所有 git commit 命令
deny: bash(rm -rf*)        # 拒绝危险删除
allow: Read(**)            # 允许所有文件读取
```

---

## 3. 工具编排策略 (toolOrchestration.ts)

### 分批执行: 读写分离

`partitionToolCalls()` 将 LLM 一次性返回的多个 tool_use 分为批次:

```
LLM 返回 [ReadFile(a), ReadFile(b), WriteFile(c), ReadFile(d)]
                │
        partitionToolCalls()
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 批次1         批次2        批次3
[ReadFile(a)  [WriteFile(c) [ReadFile(d)
 ReadFile(b)]  ]            ]
 (并发)        (串行)        (并发)
```

判断逻辑:
1. 工具是否 `isReadOnly(input)` → 可并发
2. 工具是否 `isConcurrencySafe(input)` → 明确声明并发安全也可并发
3. 其他 → 串行

### 并发执行路径

```typescript
// 只读批次: 全部并发 (Promise.all 等价)
for await (const update of runToolsConcurrently(blocks, ...)) {
  yield update
}

// 写入批次: 逐个串行
for await (const update of runToolsSerially(blocks, ...)) {
  yield update
}
```

---

## 4. 流式工具执行 (StreamingToolExecutor)

普通模式: 等 LLM 全部输出完毕后再批量执行工具
流式模式: LLM 每产出一个 `tool_use` block 时**立即**启动工具执行

```
LLM 流式输出:
  → tool_use block A (input 完整)
        └─ StreamingToolExecutor.addTool(A) → 后台立即开始执行 A
  → tool_use block B (input 完整)
        └─ StreamingToolExecutor.addTool(B) → 后台立即开始执行 B
  → 流式结束

外层循环:
  → streamingToolExecutor.getCompletedResults()
        └─ 已完成的工具结果立即 yield 出去
```

好处: 工具执行时间与 LLM 输出时间重叠，总延迟降低。

---

## 5. 工具执行完整流程 (toolExecution.ts)

```
runToolUse(toolUse, assistantMessages, canUseTool, toolUseContext)
  │
  ├─ 1. findToolByName() 查找工具定义
  ├─ 2. inputSchema.safeParse(toolUse.input) 验证输入
  ├─ 3. canUseTool() 权限检查
  │     ├─ deny → createUserMessage({ is_error: true, content: deniedReason })
  │     └─ allow → 继续
  ├─ 4. tool.call(input, toolUseContext) 执行工具
  │     └─ AsyncGenerator: 先 yield ProgressMessage, 最后 yield ToolResult
  ├─ 5. 格式化结果为 tool_result ContentBlock
  │     ├─ 成功: { type: 'tool_result', content: result, is_error: false }
  │     └─ 失败: { type: 'tool_result', content: errorMsg, is_error: true }
  └─ 6. createUserMessage({ content: [tool_result_block] })
```

### 特殊处理: 结果大小限制

```
if (result.length > tool.maxResultSizeChars) {
  // 截断并提示 LLM 结果已被截断，可用更精确的工具获取子集
  result = result.slice(0, maxResultSizeChars) + '\n[Output truncated...]'
}
```

---

## 6. 子 Agent 工具 (AgentTool)

AgentTool 是一个特殊工具，调用时会**fork 一个完整的子 Agent**:

```
主 Agent 调用 AgentTool(prompt, tools, maxTurns)
  │
  └─ forkSubagent()
       ├─ 创建独立的 query() 循环
       ├─ 继承父 Agent 的 systemPrompt (共享 prompt cache)
       ├─ 使用独立的 abortController (可独立中断)
       ├─ 将子 Agent 的最终输出作为 tool_result 返回给主 Agent
       └─ 子 Agent 的消息历史持久化到独立的 sidechain transcript
```

支持嵌套: 子 Agent 可以再调用 AgentTool 创建孙 Agent。

---

## 7. MCP 工具动态接入

通过 Model Context Protocol，外部工具可动态注册:

```
MCP Server 连接
  → 自动发现工具列表 (tools/list)
  → 包装为 MCPTool 对象注入 tools 数组
  → LLM 可调用外部服务的工具 (数据库查询、API 调用等)
  → 调用时通过 MCP 协议转发 (tools/call)
```

---

## 8. 工具设计模式总结

### 模式 1: 工具即接口

工具的 `prompt` 字段是给 LLM 的说明，`inputSchema` 是机器可解析的接口规范。二者共同决定 LLM 如何、何时调用工具。

### 模式 2: 权限前置

工具执行前必须过权限关卡，权限决策与工具执行解耦，支持交互式授权 (弹框) 和规则式授权 (预配置)。

### 模式 3: 进度流

工具通过 `AsyncGenerator` 分离 **进度通知** 和 **最终结果**:
```
yield { type: 'progress', data: '正在读取文件...' }
yield { type: 'progress', data: '已读取 50%...' }
yield { type: 'result',   data: fileContent }      // 最后一个
```

### 模式 4: 错误即结果

工具失败不抛异常，而是返回带 `is_error: true` 的 `tool_result`。LLM 可看到错误信息并自主决定如何重试或调整策略。
