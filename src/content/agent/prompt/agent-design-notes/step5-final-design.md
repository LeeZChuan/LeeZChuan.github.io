# 通用 Agent 对话循环设计文档

> 基于 Claude Code 源码分析提炼，适用于构建具备自主工具调用能力的对话 Agent

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户 / 外部调用方                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 提交消息 (prompt + 结构化数据 + 意图)
┌──────────────────────────▼──────────────────────────────────────┐
│                      AgentSession (会话层)                        │
│                                                                   │
│  持有: 消息历史 | 中断控制 | 用量统计 | 权限拒绝记录 | 文件状态缓存    │
│  职责: 会话生命周期管理，跨多轮 submitMessage() 保持状态             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ query(messages, systemPrompt, tools)
┌──────────────────────────▼──────────────────────────────────────┐
│                      AgentLoop (循环层)                            │
│                                                                   │
│  while(true) {                                                    │
│    1. 预处理上下文 (压缩/裁剪)                                       │
│    2. 调用 LLM → 获得助手响应                                        │
│    3. 解析 tool_use blocks                                         │
│    4. 执行工具 → 获得 tool_result                                   │
│    5. 将结果拼回消息历史                                             │
│    6. 判断退出 or 继续                                              │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼───────┐  ┌──────▼────────┐
│  Prompt 构建  │  │   工具编排执行   │  │  上下文管理    │
│  (三层结构)   │  │  (权限+并发)    │  │  (压缩+裁剪)  │
└──────────────┘  └────────────────┘  └───────────────┘
```

---

## 二、核心数据流

### 2.1 输入处理流程

```
用户输入 (文本 + 结构化数据 + 意图)
  │
  ├─ 预处理 processUserInput()
  │   ├─ 识别并执行 slash 命令 (/clear, /compact 等)
  │   ├─ 处理图片、文件附件
  │   └─ 检查是否需要调用 LLM (shouldQuery)
  │
  ├─ 构建 systemPrompt
  │   ├─ [静态] 角色定义 + 行为规范 + 工具使用说明
  │   ├─ [动态] 运行时上下文注入 (环境信息、记忆文件)
  │   └─ [追加] 调用方自定义指令 (appendSystemPrompt)
  │
  └─ 进入 AgentLoop
```

### 2.2 单轮 AgentLoop 数据流

```
messages (当前历史) + systemPrompt
  │
  ├─ [预处理] 上下文压缩 (如需要)
  │
  ├─ LLM API 调用
  │   └─ 流式返回 AssistantMessage
  │       ├─ TextBlock         → 直接输出给用户
  │       ├─ ThinkingBlock     → 内部推理 (可选展示)
  │       └─ ToolUseBlock[]    → 需要执行的工具调用列表
  │
  ├─ 工具执行 (若有 ToolUseBlock)
  │   ├─ 权限检查 canUseTool()
  │   ├─ 并发/串行调度
  │   └─ 收集 tool_result[]
  │
  ├─ 拼接: messages += [AssistantMessage, UserMessage(tool_results)]
  │
  └─ 判断:
      ├─ 无 ToolUseBlock → 退出循环，返回最终回复
      └─ 有 ToolUseBlock → 继续下一轮
```

---

## 三、Prompt 工程设计

### 3.1 三层 Prompt 结构

```
Layer 1 -- systemPrompt (LLM API system 字段)
  ┌──────────────────────────────────────────┐
  │ [可缓存: 静态内容]                         │
  │  角色定位 + 行为规范 + 安全约束             │
  │  工具使用指南 + 特定领域知识                │
  │  ─────────── 动态分界线 ──────────────    │
  │ [动态内容]                                 │
  │  MCP 工具说明 + 记忆文件 + 用户偏好         │
  └──────────────────────────────────────────┘

Layer 2 -- userContext (注入第一条 user 消息前)
  ┌──────────────────────────────────────────┐
  │  当前时间 + 工作目录 + 环境变量             │
  │  运行时状态快照 (git status 等)             │
  │  用户提供的结构化数据 (本次调用专用)         │
  └──────────────────────────────────────────┘

Layer 3 -- appendSystemPrompt (追加在末尾)
  ┌──────────────────────────────────────────┐
  │  调用方动态追加的特定指令                   │
  │  (不覆盖主 prompt，仅补充)                 │
  └──────────────────────────────────────────┘
```

### 3.2 面向结构化数据的 Prompt 模板

当用户提供结构化数据时，推荐在 `userContext` 层注入:

```xml
<userContext>
  <currentTime>2026-04-21T10:30:00+08:00</currentTime>
  <userIntent>用户意图描述</userIntent>
  <structuredData>
    <!-- 用户提供的结构化数据 (JSON / 表格 / 列表等) -->
    {
      "field1": "value1",
      "records": [...]
    }
  </structuredData>
  <constraints>
    <!-- 本次任务的约束条件 -->
  </constraints>
</userContext>
```

### 3.3 系统提示词 Section 组织

```
# 角色定位
你是一个...Agent，帮助用户完成...任务。

# 行为规范
- 在给出最终回答前，先分析用户提供的数据
- 对于不确定的信息，主动询问而非猜测
- ...

# 工具使用指南
当需要...时，使用 XXXTool 而非直接在回复中处理。
...

# 数据处理规则
用户会提供结构化数据，处理时应注意:
- ...

────── 动态内容分界 ──────

# 当前上下文
(动态注入: 会话状态、记忆内容等)
```

---

## 四、工具系统设计

### 4.1 最小工具定义

```typescript
type Tool = {
  name: string           // 唯一标识，LLM 通过此名调用
  description: string    // 告诉 LLM 此工具的用途和使用时机
  inputSchema: ZodSchema // 参数定义 (自动生成 JSON Schema 给 LLM)
  
  call(input, context): AsyncGenerator<ProgressEvent | ToolResult>
  
  isReadOnly(input): boolean  // true 可并发，false 串行
}
```

### 4.2 权限控制接口

```typescript
type PermissionResult =
  | { behavior: 'allow' }
  | { behavior: 'deny'; reason: string }
  | { behavior: 'ask'; prompt: string; onDecision: (allowed: boolean) => void }

async function canUseTool(tool, input, context): Promise<PermissionResult>
```

### 4.3 工具执行策略

```
LLM 返回多个 tool_use:
  │
  partition(toolUses, isReadOnly)
  │
  ├─ 只读批次 → Promise.all 并发执行
  └─ 写入批次 → 顺序串行执行
```

### 4.4 错误处理原则

工具执行失败时**不抛异常**，返回 `is_error: true` 的 tool_result:

```json
{
  "type": "tool_result",
  "tool_use_id": "xxx",
  "is_error": true,
  "content": "执行失败原因描述，LLM 可据此调整策略"
}
```

---

## 五、上下文管理策略

### 5.1 压缩触发阈值设计

```
Token 占用率:
  < 60%   → 正常运行
  60-80%  → 显示警告提示
  80-95%  → 触发自动压缩
  > 95%   → 硬性阻止，必须先压缩
```

### 5.2 压缩优先级

```
优先使用低成本方案:
  1. Snip 裁剪 (零成本: 直接删除旧消息段)
  2. 微压缩 (低成本: 只压缩过大的单条工具结果)
  3. 全量摘要 (高成本: 调用 LLM 生成对话摘要)
```

### 5.3 compact_boundary 模式

```
历史消息 [m1...mN] + compact_boundary + 摘要 + [新消息]

优点:
  - LLM 只看摘要和新消息，节省 token
  - UI 仍可展示完整历史 (REPL scrollback)
  - 会话可从边界恢复 (/resume)
```

---

## 六、完整实现伪代码

```typescript
class AgentSession {
  private messages: Message[] = []
  private abortController = new AbortController()

  async *submitMessage(userPrompt: string, structuredData?: unknown) {
    // 1. 构建系统提示词
    const systemPrompt = buildSystemPrompt({
      roleDefinition: ROLE_PROMPT,
      toolGuide: TOOL_GUIDE_PROMPT,
      memoryContent: await loadMemory(),
    })

    // 2. 构建用户上下文
    const userContext = {
      currentTime: new Date().toISOString(),
      structuredData: structuredData,
      userIntent: extractIntent(userPrompt),
    }

    // 3. 处理用户输入
    const userMessage = createUserMessage(userPrompt, userContext)
    this.messages.push(userMessage)

    // 4. 进入 Agent 循环
    yield* this.agentLoop(systemPrompt)
  }

  private async *agentLoop(systemPrompt: string) {
    let turnCount = 0
    const MAX_TURNS = 20

    while (true) {
      // 上下文预处理
      const messagesForLLM = await this.preprocessContext(this.messages)

      // 调用 LLM
      const assistantMsg = await callLLM({
        system: systemPrompt,
        messages: messagesForLLM,
        tools: this.tools,
        signal: this.abortController.signal,
      })

      this.messages.push(assistantMsg)
      yield assistantMsg  // 流式输出给调用方

      // 解析工具调用
      const toolUseBlocks = extractToolUseBlocks(assistantMsg)

      if (toolUseBlocks.length === 0) {
        // 无工具调用 → 自然结束
        yield { type: 'result', subtype: 'success' }
        return
      }

      // 执行工具
      const toolResults = await this.executeTools(toolUseBlocks)
      const toolResultMsg = createUserMessage(toolResults)
      this.messages.push(toolResultMsg)
      yield toolResultMsg

      // 检查退出条件
      turnCount++
      if (turnCount >= MAX_TURNS) {
        yield { type: 'result', subtype: 'error_max_turns' }
        return
      }
    }
  }

  private async executeTools(toolUseBlocks: ToolUseBlock[]) {
    const results = []
    const { readOnly, writeOps } = partition(toolUseBlocks, isReadOnly)

    // 只读工具并发
    const readResults = await Promise.all(
      readOnly.map(block => this.executeOneTool(block))
    )
    results.push(...readResults)

    // 写入工具串行
    for (const block of writeOps) {
      results.push(await this.executeOneTool(block))
    }

    return results
  }

  private async executeOneTool(toolUseBlock: ToolUseBlock) {
    const tool = findTool(toolUseBlock.name, this.tools)
    const permission = await canUseTool(tool, toolUseBlock.input)

    if (permission.behavior === 'deny') {
      return { tool_use_id: toolUseBlock.id, is_error: true, content: permission.reason }
    }

    try {
      const result = await tool.call(toolUseBlock.input)
      return { tool_use_id: toolUseBlock.id, is_error: false, content: result }
    } catch (err) {
      return { tool_use_id: toolUseBlock.id, is_error: true, content: String(err) }
    }
  }
}
```

---

## 七、面向本次需求的设计建议

### 场景: 用户提供结构化数据 + 意图，Agent 完成对话任务

#### 推荐实现方案

**1. 数据注入策略**

将结构化数据通过 `userContext` XML 标签注入，而非直接放入用户消息主体:
```
systemPrompt 声明如何使用 <structuredData> 标签
userContext 注入实际数据
用户消息只包含意图描述
```

**2. 意图解析工具**

为 Agent 提供专用工具处理结构化数据分析:
- `QueryDataTool`: 在结构化数据上执行查询
- `SummarizeDataTool`: 对数据进行统计摘要
- `ValidateDataTool`: 验证数据格式与业务规则

**3. 对话状态管理**

对于多轮对话场景，推荐维护一个轻量级 session 状态:
```typescript
type SessionState = {
  structuredData: unknown        // 本次提供的数据
  userIntent: string             // 解析出的用户意图
  completedSteps: string[]       // 已完成的处理步骤
  pendingQuestions: string[]     // 待用户确认的问题
}
```

**4. Prompt 工程要点**

```
系统提示词必须包含:
  ✅ 说明何时直接回答 vs 何时使用工具
  ✅ 说明如何解读 <structuredData> 标签
  ✅ 说明不确定时应 AskUser 而非猜测
  ✅ 说明输出格式要求 (markdown / JSON / 自然语言)
  ✅ 说明任务完成的判断标准
```

**5. 最简可用架构**

```
用户调用: session.submitMessage(intent, structuredData)
            ↓
        systemPrompt (意图理解 + 数据处理规范)
            ↓
        userContext (注入数据 + 运行时环境)
            ↓
        AgentLoop (LLM 推理 + 工具执行)
            ↓
        流式输出 (进度 + 最终回复)
```

---

## 八、关键设计决策总结

| 决策 | Claude Code 做法 | 通用建议 |
|------|----------------|---------|
| 消息历史 | 全量持久化，压缩时保留边界 | 维护完整历史，LLM 只看压缩视图 |
| 工具权限 | 前置检查，支持交互授权 | 最小权限原则，危险操作需确认 |
| 错误处理 | 工具错误作为 tool_result 返回 | 让 LLM 看到错误并自主恢复 |
| 并发策略 | 只读并发，写入串行 | 按副作用判断，宁可保守串行 |
| 上下文管理 | 多层压缩，compact_boundary | 设计恢复点，分层处理不同粒度 |
| Prompt 结构 | Section 化 + 静态/动态分离 | 关注点分离，充分利用缓存 |
| 子 Agent | AgentTool fork + 共享 cache | 复杂任务分解为子 Agent |
| 流式输出 | AsyncGenerator 全链路 | 渐进式输出，早期返回进度事件 |
