---
name: Claude Code 上下文管理系统 — Agent 工作记忆完全指南
description: Claude Code 上下文管理系统 — Agent 工作记忆完全指南
---


# Claude Code 上下文管理系统 — Agent 工作记忆完全指南

> **用途说明**：本文档可直接作为 Prompt 注入，用于理解、复现或扩展 Claude Code 的上下文管理机制。覆盖从源码提炼的完整设计，包括四级压缩策略、提示工程、响应式恢复路径和最佳实践。

---

## 一、核心约束：上下文窗口是有限的工作记忆

大语言模型的所有推理都发生在上下文窗口内。Agent 的工作记忆——对话历史、工具调用结果、中间推理——全部写在这块有限的"白板"上。当白板满了，必须有策略地擦除旧内容。

### 有效窗口公式

```
有效窗口 = 模型上下文窗口 - 预留输出令牌
预留输出令牌 = min(模型最大输出令牌, 20,000)
```

**为何预留 20,000 token？** AutoCompact 需要调用 LLM 生成摘要，摘要消耗输出 token。若不预留，压缩操作本身会因输出空间不足而失败——即"压缩悖论"。

**具体示例**（200,000 token 模型窗口，max_output=16,384）：
- 预留空间 = min(16,384, 20,000) = 16,384
- 有效窗口 = 200,000 - 16,384 = **183,616 token**

### 四级告警阈值（基于有效窗口）

| 区间 | 利用率 | 状态 | 触发行为 |
|------|--------|------|----------|
| 安全区 | 0% – 85% | 正常 | 无干预 |
| 警告区 | 85% – 90% | WARNING | UI 黄色提示，建议手动 /compact |
| 危险区 | 90% – 95% | AUTOCOMPACT | 自动压缩触发（`AUTOCOMPACT_BUFFER_TOKENS = 13,000`） |
| 阻塞区 | 95% – 100% | BLOCKING | 拒绝新请求（`MANUAL_COMPACT_BUFFER_TOKENS = 3,000`） |

相关常量（`autoCompact.ts`）：
```
AUTOCOMPACT_BUFFER_TOKENS   = 13,000   // 自动压缩触发预留
WARNING_THRESHOLD_BUFFER    = 20,000   // 警告触发预留
ERROR_THRESHOLD_BUFFER      = 20,000   // 错误触发预留
MANUAL_COMPACT_BUFFER       =  3,000   // 手动压缩最小余量
```

---

## 二、四级渐进式压缩策略

从零成本到高成本依次递进，前一级不足时才激活下一级：

```
Level 1: Snip        → 零 LLM，标记清除，成本 ≈ 0
Level 2: MicroCompact → 零 LLM，时间触发/缓存感知，成本极低
Level 3: Collapse    → 部分 LLM，主动重构，成本中等（ant-only 实验功能）
Level 4: AutoCompact → 完整 LLM，全对话摘要，成本最高
```

### Level 1 — Snip（裁剪）

**触发方式**：用户手动或自动标记特定消息。

**机制**：将旧工具调用结果的内容替换为占位符字符串，保留消息结构完整性：
```
[Old tool result content cleared]
```

**为何不删除消息而是替换？** 删除会破坏消息链连续性——后续消息可能引用了前面的 `tool_use_id`。占位符既释放空间，又保持 API 消息结构合法。

已释放的 token 数量会传递给 `shouldAutoCompact()`，用于更精确地判断是否需要更高级别压缩（`snipTokensFreed` 参数）。

---

### Level 2 — MicroCompact（微压缩）

**触发方式**：每轮对话前自动执行，分两条路径：

#### 路径 A：时间触发型（`maybeTimeBasedMicrocompact`）
当距上次助手消息时间间隔超过阈值（默认 60 分钟），认为服务端 Prompt Cache 已过期，在发请求前主动清空旧工具结果：

```typescript
// timeBasedMCConfig.ts 默认配置
{
  enabled: false,           // GrowthBook 远端开关
  gapThresholdMinutes: 60,  // 触发阈值（1h = 服务端缓存 TTL）
  keepRecent: 5,            // 保留最近 N 条工具结果
}
```

清空策略：保留最近 `keepRecent` 个可压缩工具结果，其余全替换为 `[Old tool result content cleared]`。

**可压缩工具类型**（`COMPACTABLE_TOOLS`）：
`Read, Bash/Shell, Grep, Glob, WebSearch, WebFetch, FileEdit, FileWrite`

#### 路径 B：缓存编辑型（`cachedMicrocompactPath`）
通过 API 层的 `cache_edits` 机制删除工具结果，**无需修改本地消息内容**，不破坏现有缓存前缀（cache prefix），实现无损优化：

```typescript
// 不修改本地 messages，只在 API 请求中附加 cache_edits 指令
return {
  messages,  // 原封不动
  compactionInfo: {
    pendingCacheEdits: {
      trigger: 'auto',
      deletedToolIds: toolsToDelete,
      baselineCacheDeletedTokens: baseline,
    }
  }
}
```

**两条路径的选择逻辑**：
1. 先检查时间触发（缓存已冷，走路径 A 直接修改内容）
2. 再检查缓存编辑是否启用（缓存还热，走路径 B 无损删除）
3. 均不满足则不压缩，交给 AutoCompact 处理

---

### Level 3 — Collapse（上下文折叠）

**触发时机**：上下文利用率达到 90% 时开始提交（commit）压缩；95% 时阻止新 spawn。

**与 AutoCompact 的关键区别**：

| 特性 | Collapse | AutoCompact |
|------|----------|-------------|
| 触发时机 | 90% 主动 | 超阈值被动 |
| 压缩粒度 | 选择性重构消息组 | 全对话摘要 |
| 信息保留 | 更多原始细节 | 仅保留摘要 |
| 对 Fork 影响 | 95% 阻止新 spawn | 不影响 spawn |
| 互斥关系 | **优先级高于 AutoCompact** | 被 Collapse 抑制 |

当 Collapse 启用时，`shouldAutoCompact()` 直接返回 `false`，因为两者在 ~93% 临界点会产生竞争（Collapse 应获得优先权）。

**注意**：Collapse 为 `feature('CONTEXT_COLLAPSE')` ant-only 实验功能，外部版本不可用。

---

### Level 4 — AutoCompact（自动压缩）

**触发条件**：token 用量超过 `getAutoCompactThreshold(model)`，且未被 Collapse 抑制。

**完整执行流程**（`compactConversation`）：

```
1. 执行 PreCompact Hooks（用户可注入自定义压缩指令）
2. 构建压缩 Prompt（三种模板之一）
3. 通过 forked agent 或流式 API 生成摘要
   ↓ 若返回 Prompt-Too-Long
   → 丢弃最旧 API 轮次组，重试（最多 3 次）
4. 清空 readFileState 和 loadedNestedMemoryPaths 缓存
5. 并行生成压缩后附件：
   - 最近读取的文件（最多 5 个，每个 ≤5,000 token）
   - 异步 Agent 状态附件
   - 计划文件（Plan Mode）
   - 已调用的 Skills（最多 25,000 token 预算）
   - 工具/MCP 指令 Delta 附件（重新公告变化量）
6. 执行 SessionStart Hooks
7. 构建 CompactionResult（boundaryMarker + summaryMessages + attachments + hookResults）
8. 执行 PostCompact Hooks
9. runPostCompactCleanup（清理各类缓存和追踪状态）
```

**压缩后上下文重建顺序**（`buildPostCompactMessages`）：
```
CompactBoundaryMessage → summaryMessages → messagesToKeep → attachments → hookResults
```

**压缩后 token 预算常量**（`compact.ts`）：
```
POST_COMPACT_MAX_FILES_TO_RESTORE  =  5        // 最多恢复文件数
POST_COMPACT_TOKEN_BUDGET          = 50,000    // 文件恢复总预算
POST_COMPACT_MAX_TOKENS_PER_FILE   =  5,000    // 单文件 token 上限
POST_COMPACT_MAX_TOKENS_PER_SKILL  =  5,000    // 单 Skill token 上限
POST_COMPACT_SKILLS_TOKEN_BUDGET   = 25,000    // Skills 独立预算
```

---

## 三、断路器模式（Circuit Breaker）

```
MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3
```

连续 3 次 AutoCompact 失败后，系统**不再尝试**自动压缩，直接跳过。成功时计数器重置为 0。

**真实数据支撑**：引入前观察到 1,279 个会话出现 50+ 次连续失败（最高 3,272 次），每天浪费约 250,000 次 API 调用。引入断路器后彻底消除。

**状态转移**：
```
CLOSED（正常）→ 失败时 HALF_OPEN → 连续 3 次失败 OPEN（熔断）
OPEN 状态：跳过所有自动压缩尝试
任何成功：恢复 CLOSED 并重置计数器
```

---

## 四、响应式压缩（Reactive Compact）

当 API 返回 `Prompt Too Long` 错误（413）时，`query.ts` 中的主循环触发三级恢复策略：

```
Stage 1: Context Collapse Drain（低成本）
  → 调用 contextCollapse.recoverFromOverflow()
  → 释放已提交（committed）的压缩组
  → 若成功释放 > 0，以 reason='collapse_drain_retry' 重试

Stage 2: Reactive Compact（中成本）
  → 调用 reactiveCompact.tryReactiveCompact()
  → 生成全对话 LLM 摘要
  → hasAttemptedReactiveCompact 标记防止无限循环
  → 若成功，以 reason='reactive_compact_retry' 重试

Stage 3: 放弃，向用户返回错误
  → 输出 prompt_too_long 错误信息
  → 不触发 Stop Hooks（防止"错误→钩子注入→更多token→再次错误"死循环）
```

**注意**：Reactive Compact 为 `feature('REACTIVE_COMPACT')` ant-only 功能；外部版本退化为 AutoCompact + 错误提示。

---

## 五、压缩提示工程（Prompt Engineering）

### 三种压缩 Prompt 模板

| 模板 | 使用场景 | 摘要范围 |
|------|----------|----------|
| `BASE_COMPACT_PROMPT` | 全量压缩（常规 AutoCompact） | 整个对话历史 |
| `PARTIAL_COMPACT_PROMPT`（from 方向） | 局部压缩-后半段 | 从指定消息到末尾 |
| `PARTIAL_COMPACT_UP_TO_PROMPT`（up_to 方向） | 局部压缩-前半段 | 从开头到指定消息 |

每个模板都包含：
1. **防工具调用前导**（`NO_TOOLS_PREAMBLE`）：强制模型以纯文本回复，禁止调用任何工具
2. **摘要指令正文**：9 个结构化章节的详细要求
3. **防工具调用收尾**（`NO_TOOLS_TRAILER`）：再次强调不得调用工具

**为何强制禁止工具调用？** 压缩运行在 forked agent（`maxTurns: 1`）中，一次被拒绝的工具调用意味着无输出，压缩彻底失败。

### 双阶段输出结构（关键设计）

压缩 Prompt 要求 LLM 输出两个 XML 块：

```xml
<analysis>
  思维草稿本：分析对话结构、识别关键决策、确保覆盖完整性
  （此块在最终上下文中被丢弃，不消耗 token）
</analysis>

<summary>
  1. 主要请求与意图
  2. 关键技术概念
  3. 涉及的文件与代码片段
  4. 遇到的错误与修复方案
  5. 问题解决过程
  6. 所有用户消息（非工具结果）
  7. 待完成任务
  8. 当前工作内容
  9. 可选下一步（含原始引用防止漂移）
</summary>
```

`formatCompactSummary()` 后处理：
1. 正则剥离 `<analysis>...</analysis>` 全部内容
2. 提取 `<summary>` 内容，格式化为普通文本
3. 清理多余空行

**设计精髓**：`<analysis>` 充当 Chain-of-Thought 提升摘要质量，但不进入最终上下文——"思考是过程，摘要是结果"，过程不计费，结果才计入上下文。

### CompactBoundaryMessage（压缩边界标记）

每次压缩完成后在消息流中插入边界标记，携带元数据：

```typescript
{
  type: 'system',
  compactMetadata: {
    trigger: 'auto' | 'manual',
    preCompactTokenCount: number,
    lastPreCompactUuid: string,      // 关联压缩前最后一条消息
    preCompactDiscoveredTools: [],   // 已加载的 deferred tool 名称
    preservedSegment?: {             // 局部压缩时的保留段信息
      headUuid, anchorUuid, tailUuid
    }
  }
}
```

边界标记使后续压缩能准确识别"已被摘要过的内容范围"，`getMessagesAfterCompactBoundary()` 基于此向 API 只发送边界之后的消息。

---

## 六、Session Memory Compact（实验性）

**触发条件**：`ENABLE_CLAUDE_CODE_SM_COMPACT` 环境变量或 GrowthBook `tengu_sm_compact` 开关。

**机制**：利用持久化 Session Memory 文件作为摘要内容，**无需调用 LLM**，同时保留最近若干消息：

```
trySessionMemoryCompaction() 流程：
1. 检查 Session Memory 文件是否存在且有内容
2. 找到 lastSummarizedMessageId 的位置（已被 SM 处理的边界）
3. calculateMessagesToKeepIndex()：从边界向前扩展，直到满足：
   - minTokens = 10,000  （最小保留 token）
   - minTextBlockMessages = 5  （最小保留含文本的消息数）
   - maxTokens = 40,000  （硬上限）
4. adjustIndexToPreserveAPIInvariants()：确保不拆分 tool_use/tool_result 对
5. 构建 CompactionResult（SM 内容作摘要 + 最近消息保留）
6. 若压缩后 token 数仍超阈值，放弃 SM 压缩，回退 AutoCompact
```

**优先级**：SM Compact 先于普通 AutoCompact 尝试（`autoCompactIfNeeded` 中优先调用）。

---

## 七、主循环中的压缩调用顺序

每轮 `query()` 执行时的上下文管理时序：

```
1. microcompactMessages()           ← 轻量清理工具结果（每轮前置）
   ├─ maybeTimeBasedMicrocompact()  ← 缓存过期时清空旧结果
   └─ cachedMicrocompactPath()      ← 缓存热时通过 cache_edits 无损删除

2. shouldAutoCompact() → autoCompactIfNeeded()   ← 超阈值时压缩
   ├─ trySessionMemoryCompaction()  ← 优先使用 SM（实验性）
   └─ compactConversation()         ← 兜底 LLM 全量摘要

3. 调用 API（callModel）

4. 收到响应后，若返回 Prompt-Too-Long：
   ├─ contextCollapse.recoverFromOverflow()  ← 折叠释放（Stage 1）
   ├─ reactiveCompact.tryReactiveCompact()  ← 响应式摘要（Stage 2）
   └─ 返回 prompt_too_long 错误（Stage 3）
```

---

## 八、设计反模式与最佳实践

### 反模式

| 反模式 | 后果 | 正确做法 |
|--------|------|----------|
| 等到 95% 才压缩 | 自动压缩摘要质量差，可能丢失关键细节 | 在 70-80% 时手动 `/compact` 并附注保留重点 |
| 压缩后立即重新加载所有文件 | 立即再次触发压缩，形成"压缩-膨胀-压缩"循环 | 只重新加载当前任务需要的文件（5 个 / 50K token 限制） |
| 不加断路器的压缩重试 | API 不稳定时死循环，每天浪费数十万次调用 | 连续 3 次失败后熔断 |
| 直接截断消息（删除最旧的） | 不可逆地丢失语义信息 | 用摘要替代，保留关键意图 |
| 在 PreCompact Hook 中注入大量文本 | 压缩请求本身触发 PTL 错误 | Hook 指令保持简洁，重点明确 |

### 最佳实践

**1. 主动压缩 > 被动压缩**
```
# 在工作关键节点手动触发，附带保留重点
/compact 保留所有数据库 schema 定义及其变更原因
```

**2. 分阶段工作模式**
- 研究阶段（读文件、理解结构）→ 完成后 /compact
- 规划阶段（制定方案）→ 完成后 /compact
- 实施阶段（修改代码）→ 完成后 /compact

**3. 与 Snip 协作**
读取大文件分析完成后，立即用 Snip 清除工具结果，再在更高利用率时 /compact，双重节省 token。

**4. 记忆系统补充上下文**
重要决策让 Agent 保存到 CLAUDE.md / Session Memory。压缩后 Agent 可通过读取记忆文件恢复关键上下文，而无需依赖摘要的完整性。

**5. PreCompact Hook 定制摘要方向**
```yaml
# .claude/hooks/pre_compact.sh 示例指令
customInstructions: |
  特别保留以下内容：
  - 所有 API 端点的接口定义及变更理由
  - 数据库 schema 的字段设计决策
  - 已决定不做的方案（及原因）
```

---

## 九、为自己的 Agent 系统复用的核心设计

如果你要为自己的 Agent 系统设计上下文管理，以下是最值得复用的决策：

### 必须实现
1. **有效窗口公式**：预留输出 token，避免压缩悖论
2. **分级阈值**：警告、压缩、阻塞三个触发点，而非单一截断
3. **断路器**：连续 N 次失败后停止重试（推荐 N=3）
4. **双阶段摘要 Prompt**：`<analysis>` 草稿本（丢弃）+ `<summary>` 正文（保留）
5. **压缩边界标记**：记录压缩位置，避免重复压缩已摘要内容

### 视资源决定
6. **Micro-Compact**：每轮前清理旧工具结果，零 LLM 成本
7. **时间触发清理**：缓存过期时主动收缩 prompt
8. **压缩后内容恢复**：自动重注入最近文件/关键 context（需要 token 预算控制）
9. **响应式压缩**：PTL 错误触发的自动恢复（需要 forked agent 能力）

### 可选扩展
10. **Session Memory**：持久化工作记忆，跨压缩边界保留关键信息
11. **Context Collapse**：主动重构而非被动摘要（适合超长 agentic 任务）
12. **缓存感知压缩**：识别缓存冷热状态，选择不同压缩路径

---

## 附录：核心逻辑设计指南（可复用 Prompt）

> 以下每个模块描述一个独立可复用的逻辑单元，后续在设计实现类似系统时可直接引用对应章节作为设计约束。

---

### A. 有效窗口与阈值计算

**设计约束**：
- 有效窗口不等于模型标称的 context window。必须从中扣除"压缩操作本身所需的输出空间"，否则压缩时模型无法输出摘要（压缩悖论）。
- 预留量取 `min(模型最大输出 token, 20000)`，而非直接使用最大输出值，防止模型切换时预留过大。

**实现逻辑**：
```
effective_window = context_window - min(max_output_tokens, 20000)
autocompact_threshold = effective_window - 13000   // 留安全 buffer
warning_threshold    = effective_window - 20000
blocking_limit       = effective_window -  3000
```

**关键判断**：所有"是否压缩"的决策都应基于 `effective_window`，而非裸的 `context_window`。环境变量 / 配置项应当允许覆盖窗口大小（用于测试），但不能超过模型实际限制。

---

### B. 工具结果内容清除（Micro-Compact 核心）

**设计约束**：
- 永远不要删除消息，只替换内容为占位符。删除会破坏 `tool_use_id` 引用链，导致 API 返回 invalid_request。
- 只清除**工具结果**（tool_result），不清除助手推理文本。工具结果体积大、价值随时间快速衰减；助手推理包含决策链，价值更高。
- 清除前必须保留最近 N 条（N ≥ 1），避免模型完全失去当前操作上下文。N=0 会导致 `slice(-0)` 返回全集，是边界 bug。

**可清除工具类型**（按价值衰减速度排序，越靠前越应优先清除）：
```
Shell/Bash, FileRead, Grep, Glob, WebSearch, WebFetch, FileEdit, FileWrite
```

**不应清除**：助手 text 块、thinking 块、tool_use 块（只清除对应的 tool_result）。

**占位符标准文本**：
```
[Old tool result content cleared]
```

---

### C. 时间触发清理（缓存感知）

**设计约束**：
- 判断"距上次助手消息时间是否超过缓存 TTL"，若超过则在发 API 请求前主动清理旧工具结果。
- 触发阈值设为缓存 TTL（默认 60 分钟），确保清理的是真正已失效的缓存内容，不造成误杀。
- 时间触发路径不应与缓存编辑路径（cache_edits）共存：缓存已过期意味着缓存是冷的，此时内容清除直接改写 prompt 没有负面影响；而缓存编辑路径假设缓存是热的。
- 触发后必须重置 Micro-Compact 状态（`resetMicrocompactState()`），防止旧的工具 ID 注册表残留导致后续 cache_edits 引用不存在的 entry。

**触发前置条件检查**：
```
1. 功能开关已启用
2. 请求来源为主线程（子 Agent 生命周期短，时间触发无意义）
3. 存在至少一条历史助手消息（有时间基准）
4. 时间差 >= threshold，且为有限数（NaN/Infinity 视为不触发）
```

---

### D. 断路器模式

**设计约束**：
- 上下文压缩是可失败操作，失败时不能无限重试（尤其是压缩请求本身也会消耗大量 token）。
- 状态机：`CLOSED`（正常）→ 失败时递增计数 → 达到阈值进入 `OPEN`（熔断）→ 成功时归零回 `CLOSED`。
- 阈值推荐为 3。数据支撑：引入前 1,279 个会话出现 50+ 次连续失败，每天浪费 ~250K API 调用。
- 失败计数器必须随会话状态向上层透传（不能用模块级全局变量单独管理），确保 "某次成功" 能从调用方重置计数。
- 用户手动触发的压缩（`/compact`）不受断路器限制，断路器只保护自动路径。

**状态传递接口**：
```typescript
// 每次调用返回最新失败计数，调用方负责存储和传入
autoCompactIfNeeded(messages, ctx, params, tracking?: {
  consecutiveFailures?: number  // 传入上次的值
}): Promise<{
  wasCompacted: boolean
  consecutiveFailures?: number  // 返回更新后的值
}>
```

---

### E. 压缩摘要 Prompt 结构

**设计约束**：
- 摘要生成必须在**受限环境**中执行（单轮、禁止工具调用）。若允许工具调用，模型可能在摘要过程中产生新历史，形成递归问题。
- Prompt 必须在**开头和结尾**都声明"禁止工具调用"，并说明违反的后果（工具调用被拒绝 → 无输出 → 任务失败）。这是因为新版模型（如带 adaptive thinking 的版本）在 tool schema 存在时更倾向发起工具调用。

**双阶段输出结构**（核心设计）：
```
<analysis>
  思维草稿：分析对话结构 → 识别用户意图 → 确认关键决策 → 核查覆盖完整性
  （此块在最终上下文中被完全剥离，不消耗 token）
</analysis>

<summary>
  结构化摘要正文：9 个固定章节
  （此块进入新的上下文窗口）
</summary>
```

**9 个标准章节**（顺序有意义，越靠前优先级越高）：
1. 主要请求与意图（用户的核心目标）
2. 关键技术概念（涉及的技术栈、框架）
3. 涉及的文件与代码片段（含变更原因）
4. 遇到的错误与修复方案
5. 问题解决过程（推理链路）
6. 所有用户消息（非工具结果，保留原文）
7. 待完成任务
8. 当前工作内容（最近在做什么，精确到代码位置）
9. 可选下一步（**必须包含原文引用**，防止任务漂移）

**摘要后处理**（`formatCompactSummary` 逻辑）：
```
1. 正则剥离 <analysis>...</analysis>（含跨行内容）
2. 提取 <summary>...</summary> 内文本
3. 若无 <summary> 标签，保留全文（容错）
4. 合并多余空行
```

**三种 Prompt 变体选择**：
```
BASE（全量）：范围 = 从对话开始到当前全部消息
PARTIAL from：范围 = 从指定 pivotIndex 到末尾（前半段已被摘要过）
PARTIAL up_to：范围 = 从开头到 pivotIndex（保留后半段原文）
```

---

### F. 压缩边界标记（Compact Boundary）

**设计约束**：
- 每次压缩完成后必须在消息流中插入一条边界标记消息，标记"此处发生了压缩"。
- 边界标记的作用：后续向 API 发请求时，通过 `getMessagesAfterCompactBoundary()` 过滤掉边界前的所有消息，只发送摘要 + 边界后的内容，避免将已摘要的内容重复发送。
- 标记必须携带足够元数据，使后续分析和压缩判断有据可查：

```
{
  trigger: 'auto' | 'manual',          // 触发来源
  preCompactTokenCount: number,         // 压缩前 token 数
  logicalParentUuid: string,            // 压缩前最后一条消息的 ID（维护消息链连续性）
  preCompactDiscoveredTools: string[],  // 已加载的延迟工具名（压缩不清除已注册工具）
  preservedSegment?: {                  // 局部压缩时：被保留段的首/锚/尾消息 ID
    headUuid, anchorUuid, tailUuid
  }
}
```

**多次压缩叠加**：当会话被多次压缩时，只有最新的边界标记有效（`getMessagesAfterCompactBoundary` 取最后一个）。旧边界标记不删除，保留审计轨迹。

---

### G. 压缩后上下文恢复（Post-Compact Restore）

**设计约束**：
- 压缩后模型"忘记"了所有之前读取的文件。若不主动恢复，模型需要重新读取文件才能继续工作，浪费 token 且打断工作流。
- 恢复内容必须有严格 token 预算上限，防止"恢复即触发下次压缩"的恶性循环。

**恢复优先级与预算分配**：
```
总预算上限：50,000 token

文件恢复（最多 5 个，按最近使用时间排序）：
  ├─ 单文件上限：5,000 token（超出则截断，保留文件头部——头部通常是接口/类型定义）
  └─ 跳过：已在保留消息中出现过的文件、计划文件、记忆文件

Skill 恢复（最多 25,000 token 独立预算）：
  ├─ 按调用时间倒序（最近调用优先）
  ├─ 单 Skill 上限：5,000 token（超出则截断，附截断标记提示模型可 Read 全文）
  └─ 超出预算的 Skill 直接丢弃

计划文件（Plan Mode）：无上限，全量注入

工具/MCP 指令：Delta 模式——只重新公告"相比保留消息段新增的部分"，避免重复
```

**去重逻辑**：若文件已出现在 `messagesToKeep`（局部压缩保留的尾部消息）的 `tool_result` 中，跳过恢复，不重复注入。

---

### H. API 侧 Prompt-Too-Long 恢复

**设计约束**：
- 压缩请求本身也可能触发 Prompt-Too-Long（待压缩的消息本身就超过上下文）。此时不能直接报错，需要有恢复路径。
- 恢复策略：按 API 轮次（同一 `message.id` 的消息为同一轮）分组，每次丢弃最旧的若干组，重试，最多 3 次。
- 每次丢弃量的计算：若 API 错误包含明确的 token gap 信息，按 gap 精确计算需要丢弃的轮数；否则回退到丢弃 20% 的组数（容错）。
- 丢弃后若剩余组首条消息为 assistant，需要在最前面插入一条合成 user 消息作为对话起点（API 要求首条必须是 user role）。
- 丢弃前必须剥离上一次重试时插入的合成 user 标记，防止标记被分到 group 0 导致每次只丢标记、没有实质进展（死循环 bug）。

**消息分组逻辑**（`groupMessagesByApiRound`）：
```
以"新的 assistant message.id 出现"为边界进行分组。
同一 API 响应中的流式分块共享 message.id，不产生分组边界。
tool_result 消息跟随其对应的 tool_use 处于同一组（不跨组切割配对）。
```

---

### I. 主循环中的调用顺序约束

实现上下文管理时，各模块的调用顺序不可随意调整：

```
【每轮 API 调用前】
Step 1: Micro-Compact（清理旧工具结果）
  ↓ 优先检查时间触发（缓存冷 → 直接改写内容）
  ↓ 再检查缓存编辑路径（缓存热 → cache_edits 无损删除）
  ↓ 均无触发则跳过

Step 2: Auto-Compact 判断（检查 token 是否超阈值）
  ↓ 未超阈值：直接进入 Step 3
  ↓ 超阈值：
    ├─ 先尝试 Session Memory Compact（无 LLM 调用，优先级最高）
    └─ 再尝试 LLM AutoCompact（调用 compactConversation）
       └─ 压缩成功后执行 runPostCompactCleanup()

Step 3: 发送 API 请求

【收到 API 响应后，若返回 PTL 错误】
Step 4: 响应式恢复（Reactive Compact）
  ↓ 先尝试 Context Collapse Drain（轻量，不调 LLM）
  ↓ 再尝试 Reactive Compact（调 LLM 生成摘要，单次机会）
  ↓ 均失败：向用户返回错误，不触发 Stop Hooks
```

**关键约束**：Step 4 的 Reactive Compact 只能执行一次（`hasAttemptedReactiveCompact` 标记）。若允许多次，会形成"压缩后仍 PTL → 再压缩 → 仍 PTL"的无限循环。Stop Hooks 不能在 PTL 错误后执行，因为 Stop Hooks 可能注入额外 token，使下一次重试更容易 PTL。

---

### J. 子 Agent 隔离约束

**设计约束**：
- 子 Agent（forked agent、session_memory、compact 自身）运行在同一进程中，与主线程共享模块级状态。
- **绝对不能**在子 Agent 压缩时重置主线程状态（如 `getUserContext` 缓存、`getMemoryFiles` 缓存、`contextCollapse` store）。
- 判断是否为主线程的标准：`querySource` 为 `undefined`、以 `repl_main_thread` 为前缀、或为 `sdk`。
- 子 Agent 本身（`querySource = 'session_memory'` 或 `'compact'`）永远不触发 Auto-Compact（递归保护）。
- Micro-Compact 的缓存编辑路径只注册**主线程**的工具结果，防止子 Agent 的工具 ID 污染主线程的删除队列。
