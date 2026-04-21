# Step 2: Prompt 工程体系

> 来源: `restored-src/src/constants/prompts.ts` + `restored-src/src/context.ts` + `restored-src/src/utils/queryContext.ts` + `restored-src/src/utils/systemPrompt.ts`

---

## 1. 三层 Prompt 结构

Claude Code 将 Prompt 拆分为三个独立关注点分别构建，最终合并传入 API:

```
┌─────────────────────────────────────────────────────────┐
│                     LLM API 调用                         │
│                                                          │
│  system: [ ...systemPrompt, ...systemContext ]           │
│                                                          │
│  messages: [                                             │
│    { role: 'user',      content: [userContext, ...] },   │  ← 首条消息前缀注入
│    { role: 'assistant', content: [...] },                │
│    ...历史消息                                            │
│  ]                                                       │
└─────────────────────────────────────────────────────────┘
```

| 层 | 内容 | 变化频率 | 缓存友好 |
|----|------|---------|---------|
| `systemPrompt` | 角色定义、行为规范、工具使用指南 | 低 (配置驱动) | ✅ 可全局缓存 |
| `systemContext` | MCP 服务器指令、动态工具说明 | 中 | 部分缓存 |
| `userContext` | git 状态、当前日期、CLAUDE.md、环境信息 | 高 (每次会话) | ❌ 不缓存 |

---

## 2. systemPrompt 构建 -- Section 组装模式

`prompts.ts` 中的 `getSystemPrompt()` 将系统提示词拆成多个 **section**，每个 section 是独立函数返回的字符串块:

```
getSystemPrompt()
  │
  ├─ getSimpleIntroSection()         # 角色定位 + 行为约束概述
  ├─ getSimpleSystemSection()        # 系统级规则 (工具使用、标签说明、安全提示)
  ├─ getSimpleDoingTasksSection()    # 任务执行规范 (代码风格、不过度设计等)
  ├─ getActionsSection()             # 高风险操作谨慎原则
  ├─ getUsingYourToolsSection()      # 工具优先级指南 (优先专用工具而非 Bash)
  ├─ getMemorySection()              # 记忆/MEMORY.md 使用说明
  ├─ getMcpInstructionsSection()     # 已连接 MCP 服务器的使用说明
  ├─ getLanguageSection()            # 语言偏好设置
  ├─ getOutputStyleSection()         # 输出格式偏好
  └─ [SYSTEM_PROMPT_DYNAMIC_BOUNDARY] # 分隔符: 静态内容 / 动态内容分界线
```

### 关键设计: 静态/动态分界线

```typescript
export const SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'
```

分界线前的内容跨组织可全局缓存 (`scope: 'global'`)，分界线后为用户/会话相关内容不缓存。这是 Anthropic Prompt Cache 的核心优化手段。

---

## 3. systemPrompt 优先级与覆盖机制

`buildEffectiveSystemPrompt()` 按优先级选择最终使用的系统提示词:

```
优先级 (高 → 低):
  1. overrideSystemPrompt  (loop 模式等特殊场景，完全替换)
  2. 协调者模式 Prompt     (COORDINATOR_MODE env 激活)
  3. Agent 自定义 Prompt   (mainThreadAgentDefinition 提供)
       ├─ 普通 Agent: 替换 default
       └─ Proactive Agent: 追加到 default 之后
  4. customSystemPrompt    (调用方通过 --system-prompt 传入)
  5. defaultSystemPrompt   (getSystemPrompt() 构建的标准提示)

  + appendSystemPrompt 始终追加在末尾 (除 override 模式)
```

---

## 4. userContext 构建 -- 动态环境注入

`getUserContext()` 收集运行时环境信息，作为**首条 user 消息的前缀**注入:

```typescript
// 来自 context.ts
const userContext = {
  // git 状态快照 (分支、最近 5 条 commit、未暂存文件)
  gitStatus: await getGitStatus(),

  // 当前工作目录
  cwd: getCwd(),

  // 当前本地时间
  localTime: getLocalISODate(),

  // CLAUDE.md 项目规则文件内容 (多目录合并)
  claudeMdContent: await getClaudeMds(),

  // MEMORY.md 记忆文件内容
  memoryContent: await getMemoryFiles(),
}
```

注入方式: `prependUserContext(messages, userContext)` 将 userContext 以 `<userContext>` XML 标签格式插入第一条 user 消息的 content 开头。

---

## 5. 记忆系统 (MEMORY.md / CLAUDE.md)

### CLAUDE.md -- 项目规则

- 自动扫描 cwd 及父目录中的 `CLAUDE.md` 文件
- 内容注入 systemPrompt (静态配置文件视为 system-level 规则)
- 支持 `@path/to/other.md` 语法包含外部文件

### MEMORY.md -- 用户记忆

- 存储在 `~/.claude/MEMORY.md` (用户级) 和项目级
- 通过 `memdir` 模块扫描并注入 userContext
- Agent 可通过写工具更新 MEMORY.md，实现跨会话记忆持久化

### 嵌套记忆触发 (Nested Memory Attachment)

```
用户消息中提到特定路径/关键词
  → nestedMemoryAttachmentTriggers 检测
  → 异步加载对应的 MEMORY.md 子文件
  → 作为 attachment 消息注入对话
```

---

## 6. 关键设计原则

### 原则 1: Section 化 Prompt 管理

将系统提示词拆成独立 section 函数，每个函数只负责一个关注点。好处:
- 条件开关方便 (feature flag / 模型类型 / 工具集)
- 独立测试
- 按需组合

### 原则 2: 动态边界 + 缓存分层

```
[静态部分: 角色/规范/工具说明] → scope: 'global' 缓存
─────────── DYNAMIC_BOUNDARY ───────────
[动态部分: MCP 指令/用户偏好] → 用户级缓存
─────────── userContext 注入 ────────────
[运行时: git状态/时间/目录]   → 不缓存
```

### 原则 3: 自定义覆盖分层

提供三个扩展点，互不干扰:
- `customSystemPrompt`: 完全自定义主提示词
- `appendSystemPrompt`: 在任何提示词末尾追加额外指令
- CLAUDE.md: 项目级规则，通过文件系统声明

### 原则 4: XML 标签语义化

系统中大量使用 XML 标签传递结构化信息:
```xml
<userContext>...</userContext>       <!-- 环境上下文 -->
<system-reminder>...</system-reminder>  <!-- 系统提醒注入 -->
<tool-stdout>...</tool-stdout>       <!-- 工具标准输出 -->
<tool-stderr>...</tool-stderr>       <!-- 工具错误输出 -->
```
LLM 被明确告知这些标签的含义，避免将系统注入内容误解为用户指令。

---

## 7. Prompt 工程 Checklist

基于 Claude Code 实践，构建 Agent Prompt 时应考虑:

- [ ] **角色定位**: 明确 Agent 的能力边界和行为模式
- [ ] **工具使用规范**: 告知 LLM 何时用哪个工具，优先级如何
- [ ] **安全约束**: 高风险操作需确认，注入检测
- [ ] **任务规范**: 最小化原则 (不过度设计、不过度注释)
- [ ] **记忆指南**: 如何读写持久化记忆
- [ ] **环境注入**: 当前时间、目录、git 状态等运行时信息
- [ ] **静/动分离**: 静态指令放前面以充分利用缓存
- [ ] **语言/格式**: 输出语言偏好、格式规范
