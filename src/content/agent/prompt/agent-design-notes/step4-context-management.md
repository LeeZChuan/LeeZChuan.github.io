# Step 4: 上下文与 Token 管理

> 来源: `restored-src/src/services/compact/` + `restored-src/src/query/tokenBudget.ts` + `restored-src/src/utils/tokens.ts`

---

## 1. 上下文压力来源

随着对话轮次增加，消息历史会不断增长，面临三类上下文压力:

```
[完整消息历史]
  │
  ├─ 工具结果过大 (单条 ReadFile 返回数万行代码)
  ├─ 历史消息积累 (多轮工具调用后历史消息数量大)
  └─ 接近上下文窗口上限 (200k tokens)
```

Claude Code 设计了多层防御机制，依次作用:

```
每次进入 queryLoop 迭代:
  │
  ├─ Layer 1: applyToolResultBudget()   -- 工具结果预算限制
  ├─ Layer 2: snipCompactIfNeeded()     -- Snip 裁剪 (历史消息段移除)
  ├─ Layer 3: microcompact()            -- 微压缩 (单条过大工具结果)
  ├─ Layer 4: applyCollapsesIfNeeded()  -- 折叠压缩 (上下文折叠)
  └─ Layer 5: autocompact()             -- 自动压缩 (整体摘要)
```

---

## 2. Layer 1: 工具结果预算 (applyToolResultBudget)

**触发条件**: 工具结果内容总量超出每条消息的预算上限。

**处理方式**: 对超大 tool_result 进行截断，替换为指向外部存储的引用标记:
```
原始: { type: 'tool_result', content: '...10万字的文件内容...' }
替换: { type: 'tool_result', content: '[Content stored externally, ref: abc123]' }
```

替换记录持久化到 `contentReplacementState`，跨 turn 复用，避免重复截断。

---

## 3. Layer 2: Snip 裁剪 (snipCompactIfNeeded)

**触发条件**: 消息历史中存在 "snip 标记" (特殊系统消息)，标记两端的老消息可被移除。

**处理方式**:
- 在消息历史中定位 snip 边界
- 移除边界前的消息段 (保留边界后的"受保护尾部")
- 产生 `snip_boundary` 系统消息作为占位符

**设计目的**: 对于确定不再需要的早期消息，直接删除而非摘要，节省 Token 成本。

---

## 4. Layer 3: 微压缩 (microCompact)

**触发条件**: 单个工具结果超过阈值 (`tool.maxResultSizeChars`)。

**处理方式**: 调用 LLM 对过大的工具结果进行压缩摘要:
```
原始 tool_result: FileRead 返回 50,000 tokens 的代码文件
  │
  └─ microcompact() → 调用 LLM 提取关键信息
       → 压缩后: 500 tokens 的关键内容摘要
       → 产生 microcompact_boundary 消息标记压缩位置
```

**缓存微压缩 (CACHED_MICROCOMPACT)**: 对已压缩过的 tool_result 跨会话缓存，避免重复压缩相同内容。

---

## 5. Layer 5: 自动压缩 (autoCompact) -- 最重要

**触发条件**: 上下文 token 数接近窗口上限时自动触发。

```
calculateTokenWarningState(tokenCount, model)
  │
  ├─ isAtWarningLimit    → 显示警告
  ├─ isAtSoftLimit       → 触发 autoCompact 尝试
  └─ isAtBlockingLimit   → 硬性阻止，必须先压缩
```

### 压缩流程

```
autoCompact(messages, toolUseContext, ...)
  │
  ├─ 1. 检查 token 计数是否达到阈值
  ├─ 2. fork 一个压缩 Agent (querySource: 'compact')
  │     └─ 调用 LLM 对完整对话历史生成摘要
  ├─ 3. 生成摘要消息 (summaryMessages)
  │     └─ 包含对话主要内容、已完成任务、待完成任务等
  ├─ 4. 产生 compact_boundary 系统消息
  │     └─ 携带 compactMetadata: { preservedSegment, summaryTokens, ... }
  └─ 5. 返回 postCompactMessages = [compact_boundary, summaryMessages, ...]
```

### compact_boundary 标记的作用

```
[消息历史]
  msg1, msg2, msg3, ..., msg50
  [compact_boundary: { tailUuid: msg50 }]   ← 边界标记
  [摘要消息]
  msg51, msg52, ...

下次 queryLoop 调用:
  getMessagesAfterCompactBoundary(messages)
  → 只取 compact_boundary 之后的消息
  → msg1~msg50 对 LLM 不可见，节省 token
  → msg1~msg50 在 UI 中仍可滚动查看 (REPL 保留完整历史)
```

---

## 6. Token 预算系统 (tokenBudget)

### 思考预算 (Thinking Budget)

对于支持 extended thinking 的模型，query loop 自动管理 thinking token 预算:

```typescript
// 每个 turn 分配一定的 thinking 预算
const thinkingBudget = getCurrentTurnTokenBudget()

// 超出预算时: 继续但减少下轮 thinking 预算 (budget_continuation)
if (usedTokens > budgetTokens) {
  incrementBudgetContinuationCount()
}
```

### 任务预算 (taskBudget)

对于长时运行的 Agent 任务，支持设置总 token 预算:
```typescript
taskBudget: { total: 1_000_000 }  // 最多消耗 100万 tokens
```

每次压缩后，`taskBudgetRemaining` 减去本轮消耗，传给下次 API 调用。

---

## 7. 上下文窗口状态机

```
Token 用量状态:
  Normal (< 60%) → 无任何干预
     │
     ▼
  Warning (60-80%) → 显示 TokenWarning 提示
     │
     ▼
  SoftLimit (80-95%) → 触发 autoCompact (如果启用)
     │ (若 autoCompact 失败或禁用)
     ▼
  BlockingLimit (> 95%) → 拒绝新请求，强制用户手动 /compact
```

---

## 8. 会话恢复与边界对齐

`compact_boundary` 消息在持久化和恢复时起关键作用:

```
会话恢复 (/resume):
  1. 读取 transcript 文件
  2. 找到最后一个 compact_boundary
  3. 只加载 compact_boundary 之后的消息
  4. 这样恢复后 token 数不会太大

边界持久化时序:
  compact_boundary 产生时 → 先写入边界前的历史 (防进程崩溃丢失)
                         → 再继续新的对话
```

---

## 9. 设计模式总结

### 模式 1: 分层防御

上下文管理不依赖单一机制，而是 5 层机制按顺序叠加，每层处理不同粒度的问题。

### 模式 2: 对 UI 透明

压缩只影响传给 LLM 的消息视图 (`messagesForQuery`)，不影响 UI 显示。UI 通过 `projectSnippedView()` 根据 compact_boundary 标记重建视图。

### 模式 3: fork 模式压缩

压缩操作本身也是一次 Agent 调用 (但 `querySource: 'compact'`)，继承父 Agent 的 systemPrompt (共享 prompt cache)，节省重复 tokenize 的成本。

### 模式 4: 边界标记即恢复点

`compact_boundary` 兼具三种功能:
1. 运行时: 告知 queryLoop 只取边界后的消息
2. 持久化: 标记可安全恢复的断点
3. SDK 事件: 通知外部客户端发生了压缩
