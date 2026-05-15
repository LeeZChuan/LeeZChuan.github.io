---
title: wiki 做索引，代码做真相：AI 工程化方案设计
description: 基于近一年 AI coding agent、上下文工程、MCP、Spec-Driven Development 和代码索引实践，整理大型代码库中 wiki、RAG、Spec、Agent 与验证闭环的落地方案
date: 2026-05-11
tags: [AI辅助编程, Agent, RAG, 工程化, 上下文工程]
---

最近看到一句话：

```text
wiki 做索引，代码做真相。
wiki 用来降低定位成本，最终判断必须回到当前代码片段。
```

这句话我认为非常关键。它把 AI 编程里最容易混淆的两类上下文拆开了：

- wiki、RAG、DeepWiki、代码搜索、历史 PR 这些东西，是**定位系统**；
- 当前分支上的源码、测试、类型、schema、配置和运行结果，才是**事实系统**。

如果把 wiki 当真理，AI 会越来越像一个“熟悉旧项目的同事”：说得很流畅，但可能基于过期知识做判断。如果只让 AI 读代码，又会在大型项目里消耗大量时间定位入口。更合理的方案是：先用 wiki 和索引把问题缩小，再让 agent 回到当前代码片段做最终判断。

## 我的结论

近一年 AI 工程化的主线已经从“提示词技巧”转向“上下文工程 + 工程闭环”。

更具体地说，不是让模型一次性吞下全量代码库，而是搭一套上下文供应链：

```text
需求
  -> 业务索引
  -> repo/module 索引
  -> 代码搜索与历史搜索
  -> 当前代码片段
  -> Change Spec
  -> Agent 实现
  -> 自动验证
  -> 失败复盘与索引更新
```

这里每一层都只解决一个问题：

| 层级 | 解决什么问题 | 不能做什么 |
| --- | --- | --- |
| wiki | 快速知道项目地图、模块边界、常见入口 | 不能替代当前代码 |
| RAG / 代码搜索 | 从自然语言定位候选文件、函数、PR、提交 | 不能直接给最终实现结论 |
| 当前代码片段 | 判断真实接口、类型、调用链、边界条件 | 不能承担长期记忆 |
| Change Spec | 记录本次任务的目标、范围、契约、文件和验证 | 不能变成大而全的项目文档 |
| Agent | 在受控上下文里修改代码 | 不能绕过验证和审查 |
| Harness | 用构建、测试、lint、e2e、日志验证产出 | 不能只靠人工看 diff |

所以这句话的完整含义应该是：

```text
wiki 负责让 AI 更快找到正确战场；
代码负责让 AI 不在错误战场上自信输出；
Spec 负责让 AI 在多轮任务中不忘边界；
Harness 负责让 AI 的输出可验证、可回滚、可审计。
```

## 最近资料给出的信号

我按 2025 年下半年到 2026 年上半年的资料重新看了一遍，趋势比较一致。

### Anthropic：上下文是有限预算

Anthropic 在 2025 年 9 月发布的 [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 里，把重点从 prompt engineering 推到了 context engineering。

它的核心判断是：上下文不是仓库，而是有限注意力预算。更好的 agent 不是拿到最多上下文，而是拿到最小、最高信号的上下文。

这和“wiki 做索引”高度一致。wiki 最好只提供路径、术语、入口、依赖关系、风险提示，而不是把所有实现细节都塞进主上下文。

Anthropic 还提到 Claude Code 的混合策略：`CLAUDE.md` 这类项目说明可以预置进上下文，而代码文件通过 glob、grep、bash 等工具按需读取。这说明更成熟的 coding agent 也不是纯 RAG，而是“少量长期说明 + 即时检索当前代码”。

### Anthropic：长任务需要 harness

Anthropic 在 2025 年 11 月的 [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 里强调，长时间 agent 任务不能只靠 compaction。

它们的方案里有几个很工程化的点：

- 初始化阶段先建立环境、特性列表和进度文件；
- 后续 agent 每次只做增量进展；
- 每个 session 结束时留下结构化记录；
- 用端到端测试工具模拟真实用户路径；
- 让代码库保持可以继续工作的干净状态。

这说明 AI 工程化真正的难点不是“生成代码”，而是“让连续多轮生成不会丢状态、不会误判完成、不会把项目弄乱”。

### OpenAI：Codex 的高价值场景是理解、迁移、测试和小步任务

OpenAI 在 [How OpenAI uses Codex](https://openai.com/business/guides-and-resources/how-openai-uses-codex/) 里总结的内部使用方式也很接近工程闭环：用 Codex 理解复杂系统、跨文件重构、性能优化、补测试、处理低到中等复杂度任务。

其中很值得参考的是它的最佳实践：

- 大改动先用 Ask Mode 做计划，再进入 Code Mode；
- prompt 像 GitHub Issue 一样写清楚路径、组件名、diff、文档片段；
- 用 `AGENTS.md` 存放命名约定、业务规则、已知坑和依赖信息；
- 持续改进 agent 的开发环境，让构建和测试能在 agent 环境里跑起来。

这本质上也是“索引 + 事实 + 验证”：`AGENTS.md` 不是事实全集，而是长期规则；具体实现仍然回到代码和测试。

OpenAI 在 2026 年 5 月的 [Running Codex safely at OpenAI](https://openai.com/index/running-codex-safely/) 里进一步强调了边界：sandbox、approval、网络策略、身份凭据、规则和 OpenTelemetry 日志。这说明企业级 AI coding agent 还必须有权限边界和审计。

### GitHub Copilot：任务要像 Issue 一样可验收

GitHub Copilot cloud agent 的 [best practices](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results) 里也明确建议：任务要清晰、范围明确、有验收标准，最好说明哪些文件需要修改。它还支持仓库级 custom instructions、`AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 和 MCP。

这里的重点不是某个工具，而是任务表达方式正在标准化：

```text
自然语言需求 -> issue / spec -> agent plan -> PR -> review / test
```

如果需求本身没有边界，wiki 再完整也会让 agent 在错误范围里工作。

### Cursor：索引、规则和记忆都在做上下文分层

Cursor 的 [Codebase Indexing](https://docs.cursor.com/context/codebase-indexing) 文档说明，它通过对文件做 embedding 来提升代码问答质量，并支持增量索引、多根工作区和 PR 搜索。Cursor 的 [Rules](https://docs.cursor.com/en/context) 和 [Memories](https://docs.cursor.com/en/context/memories) 则分别解决长期规则和跨 session 记忆问题。

这个方向和我的判断一致：

- 索引用来提高定位速度；
- rules 用来提供稳定行为约束；
- memories 用来保存已经确认过的项目事实或偏好；
- 具体修改仍然要以当前文件为准。

### Sourcegraph：企业级代码库需要共享代码智能层

Sourcegraph 在 2026 年 2 月发布 [Sourcegraph 7.0](https://sourcegraph.com/blog/a-new-era-for-sourcegraph-the-intelligence-layer-for-ai-coding-agents-and-developers)，把自己定位成 developer 和 AI agent 共享的 code intelligence layer。

它强调的问题很现实：大型企业代码库里，agent 和人一样会遇到跨 repo 依赖、历史上下文、架构决策的问题。如果没有可靠的代码智能层，agent 很容易给出浅层上下文和误导性建议。

这说明“wiki 做索引”不能只靠一份 Markdown。大型团队最终需要的是：

- 语义搜索；
- 精确代码搜索；
- 跨 repo 依赖；
- 历史 PR / commit；
- 架构决策记录；
- 可被 MCP 或 API 调用的统一入口。

### MCP：工具、资源和安全边界正在标准化

[Model Context Protocol 2025-06-18 specification](https://modelcontextprotocol.io/specification/2025-06-18) 把 agent 接入外部系统的方式分成 Resources、Prompts、Tools，并强调用户同意、数据隐私、工具安全和访问控制。

这对工程化很重要。因为一旦 agent 需要访问代码搜索、CI、日志、监控、文档、需求系统，就不能靠随手写脚本。更好的方式是把这些能力做成少数高质量 MCP 工具：

- `search_code`：返回候选文件、函数、调用关系和片段；
- `read_current_code`：读取当前分支上的精确代码；
- `search_pr_history`：查历史 PR 和相关决策；
- `run_validation`：运行受控验证命令；
- `query_logs`：按 trace、request、error 查询日志；
- `get_contract`：读取 API、schema、proto、OpenAPI 或 GraphQL 契约。

工具返回也要克制。Anthropic 在 [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) 里特别强调：工具不要只是包一层 API，应该面向 agent 的任务设计；返回要高信号、低 token、语义清晰，并通过 eval 验证工具是否真的好用。

### DeepWiki / Context7：索引和外部文档正在产品化

[DeepWiki](https://deepwiki.com/) 这类产品把 GitHub repo 自动生成可问答 wiki。公开页面里可以看到它会显示最后索引时间、相关源文件和 sources，例如 [modelcontextprotocol/typescript-sdk 的 DeepWiki 页面](https://deepwiki.com/modelcontextprotocol/typescript-sdk) 会把 wiki 内容关联到 README、CLAUDE.md、docs 和 package 文件。

这正好说明 wiki 的正确形态：不是孤立文档，而是带来源链接的代码索引。

[Context7](https://context7.com/docs) 则解决另一个常见问题：库和框架 API 的训练数据过期。它把最新、版本相关的文档拉进 agent 上下文，降低“模型凭旧 API 写代码”的概率。

我的判断是：

- repo wiki 解决“这个项目怎么组织”；
- code search 解决“当前代码在哪里”；
- Context7 这类工具解决“外部库当前 API 怎么用”；
- 最终实现仍然要受当前项目代码、lockfile、类型系统和测试约束。

### Spec-Driven Development：Spec 开始变成 agent 的任务状态

Microsoft 开发者博客在 2025 年 9 月的 [Diving Into Spec-Driven Development With GitHub Spec Kit](https://developer.microsoft.com/blog/spec-driven-development-spec-kit) 里提到，如果不先决定要构建什么、为什么构建，代码库会变成事实上的 specification，而且很难维护、演进和调试。

GitHub 的 [Spec Kit](https://github.github.com/spec-kit/index.html) 在 2026 年已经把这种流程工具化：先写 spec，再 plan，再拆 tasks，再 implement，并支持多种 AI coding agent。

这对“wiki 做索引，代码做真相”的补充是：代码是真相，但需求目标不能只存在代码里。需求、验收标准、任务边界应该存在 Change Spec 里；代码负责证明当前实现是什么，Spec 负责说明本次要把它改成什么。

## 我的方案设计

我会把 AI 工程化系统拆成 6 层。

```text
L1 入口层：需求、Issue、PRD、故障描述
L2 索引层：repo wiki、业务地图、模块索引、历史 PR
L3 证据层：当前源码、测试、类型、schema、配置、日志
L4 任务层：Change Spec、Contract、Validation Plan
L5 执行层：Agent、Sub-agent、MCP tools、权限边界
L6 反馈层：CI、E2E、监控、review、失败案例库
```

这 6 层的原则是：

```text
索引层只负责缩小范围；
证据层负责判断真实状态；
任务层负责保存本次目标；
执行层负责受控修改；
反馈层负责证明改动可用。
```

## wiki 应该怎么写

我不建议把 wiki 写成百科全书。更好的 wiki 是路由表。

每个 repo 一份 `repo-index.md`：

```md
# Repo Index

## 这个 repo 负责什么
一句话说明业务边界。

## 入口
| 入口类型 | 路径 | 说明 |
| --- | --- | --- |
| Web route | apps/web/src/app/order | 订单页面入口 |
| API | services/order/src/routes | 订单服务 HTTP 入口 |
| Job | services/order/src/jobs | 异步任务入口 |

## 核心模块
| 模块 | 路径 | 责任 | 常见修改点 |
| --- | --- | --- | --- |

## 外部依赖
| 依赖 | 类型 | 来源 | 风险 |
| --- | --- | --- | --- |

## 验证命令
| 场景 | 命令 |
| --- | --- |

## 注意
- wiki 只用于定位。
- 最终实现必须回到当前源码、测试、schema 和配置。
```

每个模块一份 `module-index.md`：

```md
# Module Index

## 模块职责

## 关键文件
| 文件 | 作用 | 什么时候读 |
| --- | --- | --- |

## 调用链
用户入口 -> API -> service -> repository -> schema

## 契约
- Request:
- Response:
- Error:
- Permission:

## 常见坑
- 这里记录稳定且长期有效的坑，不记录容易过期的实现细节。

## 必须回读的源码
- 修改前必须读：
- 测试前必须读：
```

注意，wiki 中最好放“该去哪里看”，少放“代码现在怎么写”。后者越详细，越容易过期。

## RAG 和代码搜索怎么设计

索引层不要只有 embedding。工程项目需要混合检索。

| 检索方式 | 适合场景 | 输出 |
| --- | --- | --- |
| 关键词搜索 | 找 API 名、错误码、配置项、组件名 | 精确文件和行 |
| 语义搜索 | 需求描述和代码命名不一致 | 候选模块 |
| 结构搜索 | 找函数、类、接口、调用关系 | 符号关系 |
| 历史搜索 | 查为什么这么改、之前踩过什么坑 | PR、commit、ADR |
| 文档搜索 | 查业务术语、外部 API、平台规则 | 文档片段和来源 |

返回给 agent 的结果要短，最好是这种格式：

```json
{
  "query": "订单详情页状态展示",
  "candidates": [
    {
      "path": "apps/web/src/app/order/detail/page.tsx",
      "reason": "页面入口",
      "must_read": true
    },
    {
      "path": "services/order/src/order.service.ts",
      "reason": "状态计算逻辑",
      "must_read": true
    }
  ],
  "next_step": "read_current_code on must_read files"
}
```

这类输出的重点不是替 agent 判断结论，而是指导下一步读取当前代码。

## Change Spec 应该怎么接住任务

AI 工程化里，Spec 不是传统重文档，而是 agent 的任务状态。

我建议每个中等以上任务都先生成一份轻量 Change Spec：

```md
# Change Spec

## Goal
本次要被验收的目标。

## Scope
- In:
- Out:

## Entry Points
- User flow:
- Frontend:
- Backend:
- Data:
- Config:

## Current Evidence
当前代码如何工作。必须引用文件、函数、schema 或测试。

## Target Behavior
目标行为，包括异常、权限、兼容和边界。

## Contract
- Request:
- Response:
- Error:
- Permission:

## Files
- Must change:
- Likely change:
- Read only:

## Validation
- Unit:
- Integration:
- E2E:
- Manual:

## Open Questions
- [ ] 
```

关键要求只有一个：`Current Evidence` 不能来自 wiki，必须来自当前源码、测试、schema 或配置。

## Agent 工作流

一个比较稳的单任务流程是：

```text
1. 读需求
2. 查 wiki / index，定位候选 repo 和模块
3. 用代码搜索确认入口
4. 回读当前关键源码
5. 写 Change Spec
6. 确认 contract 和 scope
7. 小步实现
8. 运行验证
9. 根据失败日志修复
10. 输出改动、验证和风险
```

多 agent 只在责任边界清楚时使用：

| Agent | 责任 | 产出 |
| --- | --- | --- |
| Explorer | 定位入口和调用链 | 候选文件、证据、风险 |
| Contract Agent | 梳理 API/schema/权限 | contract spec |
| Frontend Agent | 修改 UI、状态、交互 | 前端 diff 和测试 |
| Backend Agent | 修改接口、service、数据层 | 后端 diff 和测试 |
| Validation Agent | 跑测试和复现路径 | 失败日志、最小复现 |

不要让多个 agent 同时研究同一片代码。这样看起来并发，实际会制造重复上下文和冲突结论。

## MCP 工具设计

如果团队要做平台，不建议一开始就做几十个 MCP 工具。先做少数高价值工具。

```text
code.search
  输入：自然语言、关键词、文件类型、repo
  输出：候选文件、函数、原因、置信度

code.read
  输入：repo、path、line range
  输出：当前分支上的代码片段

history.search
  输入：关键词、文件、模块
  输出：相关 PR、commit、ADR、时间

contract.get
  输入：API、schema、proto、GraphQL operation
  输出：当前契约和来源文件

validation.run
  输入：验证场景
  输出：命令、结果、最小失败日志

observability.query
  输入：traceId、errorCode、service、time range
  输出：相关日志摘要和跳转链接
```

工具设计原则：

- 少而清晰，避免功能重叠；
- 默认返回摘要，不返回大段日志；
- 每条结论带来源；
- 对破坏性操作要求审批；
- 工具结果要能被自动评估。

## 落地路线

我会分 5 个阶段落地。

### 第一阶段：先补规则，不做平台

目标是让 agent 每次都按同一套工程流程工作。

交付物：

- `AGENTS.md` 或项目规则；
- 代码风格、测试命令、目录说明；
- “wiki 只做索引，代码才是真相”的强约束；
- 禁止跳过测试、禁止无关重构、禁止扩大 scope。

### 第二阶段：给核心 repo 做轻量索引

目标是减少 agent 找入口的成本。

交付物：

- repo index；
- module index；
- API / route / job / schema 映射表；
- 常见验证命令；
- 高风险模块清单。

### 第三阶段：引入 Change Spec

目标是让任务状态不依赖聊天记录。

交付物：

- Change Spec 模板；
- contract 模板；
- validation plan 模板；
- compact 或切 session 时只交接 spec。

### 第四阶段：建设验证 harness

目标是让 AI 产出可验证。

交付物：

- 常用验证命令；
- 测试数据；
- e2e 或接口回归入口；
- 失败日志压缩规则；
- CI 中的 AI 产物检查。

### 第五阶段：把高频能力 MCP 化

目标是把人工反复做的检索、验证、日志查询变成 agent 可调用工具。

交付物：

- code search MCP；
- contract MCP；
- validation MCP；
- log / trace MCP；
- 审批、权限和审计策略。

## 衡量指标

不要只看“AI 写了多少代码”。更应该看这些指标：

| 指标 | 说明 |
| --- | --- |
| 定位时间 | 从需求到关键文件的时间是否下降 |
| 首次可用率 | agent 第一次提交后能否通过基础验证 |
| 返工率 | PR review 后需要大改的比例 |
| 测试覆盖变化 | AI 是否补上关键路径测试 |
| 上下文浪费 | 主会话里是否塞入大量无关搜索结果 |
| 误用旧知识次数 | 是否因旧 wiki、旧 API、旧 schema 产生错误 |
| 回滚率 | AI 相关改动上线后是否更容易回滚 |
| 审计完整度 | 能否解释 agent 做了什么、为什么做 |

## 常见误区

### 把 wiki 写成第二套代码

越详细的实现说明越容易过期。wiki 应该记录入口、边界、风险和来源，不应该复制代码逻辑。

### 把 RAG 当事实来源

RAG 命中的内容可能来自旧分支、旧文档、旧 PR。它只能给候选，不给裁决。

### 让主 agent 背所有上下文

搜索结果、日志、历史 PR 用完就压缩。主上下文只保留决策信息和 Change Spec。

### 过早多 agent

没有 contract 和责任边界时，多 agent 会制造更多合并冲突和上下文噪音。

### 没有验证闭环

AI 代码最大的风险不是写不出来，而是看起来合理。没有构建、测试、lint、e2e、日志回放，就不应该认为完成。

## 我会采用的最终原则

如果把这套方案压缩成几条规则，我会这样写：

1. **先定位，再实现。**
   任何中大型需求都先定位代码图谱，不直接动手改。

2. **wiki 指路，不下结论。**
   wiki、RAG、历史 PR 只负责缩小范围，最终判断回到当前代码。

3. **Spec 保存任务状态。**
   目标、范围、契约、文件和验证必须进入 Change Spec。

4. **工具返回高信号。**
   MCP 和搜索工具宁愿返回少量候选，也不要返回一堆低价值上下文。

5. **Agent 小步前进。**
   每次只做清楚边界内的改动，避免一次性跨太多模块。

6. **验证优先级高于生成速度。**
   没有验证的 AI 代码只是草稿，不是交付物。

7. **安全边界必须显式。**
   文件写入、网络、凭据、部署、数据库、生产日志都要有权限和审计。

8. **失败案例要反哺索引和规则。**
   每次 AI 失败都要判断原因：索引缺失、wiki 过期、spec 不清、工具噪音、验证不足，还是权限边界问题。

## 参考资料

- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Writing effective tools for AI agents - Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Effective harnesses for long-running agents - Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [How OpenAI uses Codex - OpenAI](https://openai.com/business/guides-and-resources/how-openai-uses-codex/)
- [Running Codex safely at OpenAI - OpenAI](https://openai.com/index/running-codex-safely/)
- [Best practices for using GitHub Copilot to work on tasks - GitHub Docs](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results)
- [Cursor Codebase Indexing](https://docs.cursor.com/context/codebase-indexing)
- [Cursor Rules](https://docs.cursor.com/en/context)
- [Cursor Memories](https://docs.cursor.com/en/context/memories)
- [Sourcegraph 7.0: intelligence layer for AI coding agents and developers](https://sourcegraph.com/blog/a-new-era-for-sourcegraph-the-intelligence-layer-for-ai-coding-agents-and-developers)
- [Model Context Protocol Specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)
- [Model Context Protocol Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [DeepWiki](https://deepwiki.com/)
- [DeepWiki: modelcontextprotocol/typescript-sdk](https://deepwiki.com/modelcontextprotocol/typescript-sdk)
- [Context7 Docs](https://context7.com/docs)
- [GitHub Spec Kit Documentation](https://github.github.com/spec-kit/index.html)
- [Diving Into Spec-Driven Development With GitHub Spec Kit - Microsoft for Developers](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
