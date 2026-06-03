---
title: 从 Matt Pocock 的 AI Skills 看工程化 Agent 工作流
description: 读 AIHero 的 skills changelog 和 mattpocock/skills 仓库后，整理什么是 AI Skill，以及如何在 Codex、Cursor、Claude 中把它用成稳定的工程流程
date: 2026-06-03
tags: [AI辅助编程, Codex, Cursor, Claude Code, Agent, Skills]
---

最近看到 AIHero 上 Matt Pocock 写的一篇文章：[Skills changelog: ubiquitous-language -> grill-with-docs](https://www.aihero.dev/skills-changelog-ubiquitous-language-grill-with-docs)。

这篇文章表面上是在讲他的 `mattpocock/skills` 仓库做了哪些更新，但真正有价值的地方不是“又多了几个提示词”，而是它把 AI coding agent 的使用方式拉回了工程基本功：

- 先对齐需求，再动手写代码；
- 用统一语言减少沟通成本；
- 用 PRD 和 issue 拆小任务；
- 用 TDD 和诊断流程建立反馈闭环；
- 用 ADR 和上下文文档记录关键决策；
- 让 agent 反复执行稳定流程，而不是每次靠临场发挥。

我会把这类 Skill 理解成“给 AI 工具用的工作手册”。它不是一句魔法咒语，而是一套可复用的流程说明：什么时候触发、先读什么文档、如何提问、如何验证、最后产出什么。

## 一句话理解这篇文章

Matt Pocock 的核心观点很简单：

> AI 工具越强，工程纪律越重要。

如果只是让 agent “帮我实现这个功能”，它很容易进入一种看似高效、实际失控的状态：代码写得很快，但需求没对齐；改动很多，但没有验证；一次性生成一大坨代码，出了问题也不好定位。

所以他把常见工程动作做成 Skill，例如：

| 场景 | Skill 的作用 |
| --- | --- |
| 需求不清楚 | 让 agent 先追问，把决策树问清楚 |
| 术语混乱 | 建立 `CONTEXT.md`，让人和 agent 使用同一套业务语言 |
| 方案太粗 | 生成 PRD，再拆成垂直切片的 issue |
| 代码坏了 | 按“复现 -> 最小化 -> 假设 -> 加仪表 -> 修复 -> 回归测试”诊断 |
| 没有反馈 | 用 TDD 先写失败测试，再实现，再重构 |
| 架构变差 | 定期让 agent 从上下文和 ADR 中找重构机会 |

这和普通提示词最大的区别是：普通提示词像“临时吩咐一句”，Skill 像“团队流程规范”。前者适合一次性任务，后者适合反复使用。

## 这次 changelog 讲了什么

原文里有几个值得记录的变化。

第一，`ubiquitous-language` 被 `grill-with-docs` 替代。

`ubiquitous language` 来自领域驱动设计，意思是团队、业务专家和代码都使用同一套语言。比如不要一会儿叫“课程章节”，一会儿叫“section”，一会儿叫“模块”；同一个概念应该有稳定名称。

新的 `grill-with-docs` 更进一步：它不只是建立术语表，还会在你准备做改动前“拷问”你的计划，把模糊点问清楚，并把沉淀下来的业务语言、架构决策写进 `CONTEXT.md` 和 ADR。

第二，`to-prd` 不再负责访谈用户。

这其实是一个很好的拆分。访谈、追问、对齐决策，应该交给 `grill-me` 或 `grill-with-docs`。当上下文已经足够清楚时，`to-prd` 再把现有讨论整理成 PRD。也就是说：

```text
grill-with-docs：把问题问清楚
to-prd：把已清楚的上下文写成产品需求
to-issues：把需求拆成可独立实现的任务
tdd / diagnose：进入实现和验证
```

第三，`to-issues` 变得更通用。

它不只支持 GitHub issue，也可以面向 Linear 或本地 Markdown 文件。这一点对个人项目很实用：不是每个想法都值得立刻进入团队 issue 系统，先写到本地 `.scratch` 或 `docs/agents` 里也可以。

第四，新增或强化了 `setup-matt-pocock-skills`。

这个 Skill 的定位是每个仓库跑一次，用来告诉其他 Skill：当前项目用 GitHub、Linear 还是本地文件做 issue；有哪些 triage label；`CONTEXT.md` 和 ADR 放在哪里。它解决的是“同一个 Skill 到不同仓库里如何适配”的问题。

## 他把 Skills 分成了哪几类

仓库里的分类很有参考价值，因为它不是按“炫不炫”分类，而是按使用频率和工程位置分类。

| Category | 适合怎么理解 | 我建议怎么用 |
| --- | --- | --- |
| Productivity Skills | 通用工作流，不限于代码 | 适合写作、开会、方案讨论、交接，例如 `grill-me`、`handoff`、`write-a-skill` |
| Engineering Skills | 主力技能，每天写代码会用 | 重点学习，适合真实工程任务，例如 `diagnose`、`grill-with-docs`、`tdd`、`to-prd`、`to-issues` |
| Misc Skills | 偶尔使用，还没确定长期位置 | 不必全装，用到再看，例如 pre-commit、脚手架、迁移工具 |
| Deprecated | 被替换或淘汰的旧技能 | 只用于理解历史，不建议新项目继续采用 |
| Personal Skills | 作者个人工作流 | 可以借鉴思路，但不要原样照搬到团队流程里 |

我自己的判断是：初学者不要一上来全装。先把 Engineering 里的核心链路跑通，比收藏几十个 Skill 更有价值。

## 最值得先学的 6 个 Skill

如果只选一小组，我建议从这 6 个开始。

| Skill | 什么时候用 | 产出 |
| --- | --- | --- |
| `grill-me` | 你只有一个粗糙想法，还没想清楚取舍 | 一组被追问后的明确决策 |
| `grill-with-docs` | 要改真实代码库，而且业务术语或架构决策很重要 | 更新后的 `CONTEXT.md`、ADR、清晰方案 |
| `to-prd` | 讨论已经清楚，需要整理成需求文档 | PRD 或 issue |
| `to-issues` | PRD 太大，需要拆成可做的小任务 | 垂直切片 issue |
| `tdd` | 要实现功能或修 bug，需要稳定反馈 | 失败测试、实现、重构后的代码 |
| `diagnose` | bug 很绕，不能靠猜 | 复现、最小化、假设、验证和回归测试 |

这 6 个串起来，就是一个很完整的 AI 工程工作流：

```text
想法 -> 追问 -> 文档化 -> 拆任务 -> 小步实现 -> 诊断和验证
```

## 在 Codex 中怎么用

Codex 现在已经支持 Skill 这种形态。官方的理解是：Skill 把指令、资源和可选脚本打包起来，让 Codex 能稳定执行某类任务。OpenAI 也维护了一个 [openai/skills](https://github.com/openai/skills) 技能目录。

在 Codex 里，我会这样落地：

1. 安装现成 Skill。

```bash
npx skills@latest add mattpocock/skills
```

安装时选择你真正会用的 Skill，不要为了“看起来完整”全部安装。第一次建议选：

```text
setup-matt-pocock-skills
grill-with-docs
to-prd
to-issues
tdd
diagnose
handoff
```

2. 在项目里先跑一次设置。

```text
/setup-matt-pocock-skills
```

它会帮你配置 issue tracker、triage label、领域文档路径等。对 Codex 来说，这一步的意义是让后面的 Skill 不再猜项目结构。

3. 日常使用时直接点名 Skill。

例如：

```text
使用 /grill-with-docs，帮我梳理这个“通知服务 SSE 设计”的改造方案。
先阅读当前仓库上下文，再追问我关键决策，不要立刻写代码。
```

或者：

```text
使用 /diagnose 诊断当前接口偶发 500 的问题。
要求先复现，再最小化，再提出假设，不要直接改代码。
```

4. 把团队自己的流程写成项目 Skill。

如果你的团队有固定规范，比如“前端改动必须跑 Playwright 截图验证”“后端接口必须补 OpenAPI 文档”，就不要每次手写提示词。可以写成：

```text
.codex/skills/frontend-visual-qa/SKILL.md
.codex/skills/api-contract-review/SKILL.md
```

这样它就变成项目资产，而不是某个人聊天记录里的经验。

## 在 Claude Code 中怎么用

Claude Code 对 Skill 的支持更接近 Matt Pocock 原始仓库的使用方式。很多 Skill 本来就来自他的 `.claude` 目录，也可以配合 `CLAUDE.md` 使用。

推荐做法是：

1. 用安装器安装。

```bash
npx skills@latest add mattpocock/skills
```

2. 项目根目录保留 `CLAUDE.md`。

`CLAUDE.md` 适合放项目级约定，例如：

- 常用命令；
- 测试方式；
- 不允许随便改的目录；
- 业务术语入口；
- ADR 和上下文文档位置；
- 什么时候必须先计划，什么时候可以直接执行。

3. 用 slash command 调用 Skill。

例如：

```text
/grill-with-docs 我想重构支付回调处理，请先对齐领域术语和边界。
```

```text
/to-issues 把刚才的 PRD 拆成 5 个以内的垂直切片任务。
```

Claude Code 里我最看重的是 `CLAUDE.md + Skill` 的组合：`CLAUDE.md` 负责“这个项目的长期背景”，Skill 负责“这次任务的执行流程”。

## 在 Cursor 中怎么用

Cursor 的形态稍微不同。它更像 IDE 里的 AI 编辑器，核心机制通常是 rules、项目上下文和对话，而不是完全等价的 Skill 目录。

所以在 Cursor 中，我建议把这些 Skill 转换成三类资产。

第一类是项目规则，放进 `.cursor/rules`。

例如可以做一个 `diagnose.mdc`：

```text
当用户要求 debug、diagnose、排查 bug 或性能问题时：
1. 先复现问题。
2. 再缩小到最小失败场景。
3. 提出 1-3 个假设。
4. 用日志、测试或断点验证假设。
5. 修复后必须补回归测试。
```

第二类是可复制的提示模板。

例如你可以在项目里建：

```text
docs/agents/prompts/grill-with-docs.md
docs/agents/prompts/to-prd.md
docs/agents/prompts/to-issues.md
```

使用 Cursor 时，把模板内容贴给 Agent，或者让 Cursor 读取这些文件再执行。

第三类是项目上下文文档。

Cursor 很适合边看代码边改，但它也需要稳定上下文。建议保留：

```text
CONTEXT.md
docs/adr/
docs/agents/
```

然后在 Cursor 里明确说：

```text
请先阅读 CONTEXT.md 和 docs/adr，再按 docs/agents/prompts/diagnose.md 的流程排查这个 bug。
```

也就是说，Cursor 里未必追求“安装同名 Skill”，而是把 Skill 的流程变成 rules、prompt template 和上下文文档。

## 我建议的个人实践路线

如果你刚开始用 Codex、Cursor 或 Claude，不要急着搭一套很复杂的 agent 系统。可以按四步来。

第一步，只建立一个 `CONTEXT.md`。

写清楚项目是什么、核心业务概念是什么、哪些术语不要混用。这个文件越简洁越好。它不是项目百科，而是给 agent 用的领域语言入口。

第二步，只引入两个 Skill。

先用：

```text
grill-with-docs
diagnose
```

一个解决“做之前没想清楚”，一个解决“坏了以后乱猜”。

第三步，再加入需求拆解。

当你发现一个需求经常聊着聊着变大，就加入：

```text
to-prd
to-issues
```

这样可以把一个模糊想法拆成更小、更容易验证的任务。

第四步，把你自己的高频动作写成 Skill。

比如你的个人博客里可能有固定流程：

```text
阅读外部文章 -> 归纳观点 -> 结合个人实践 -> 写成 Markdown -> 检查 frontmatter -> 构建验证
```

这就可以写成一个 `blog-research-writeup` Skill。以后再看到好文章，就不用每次重新解释你的写作风格和发布流程。

## 我的结论

Matt Pocock 这套 Skill 最值得学习的，不是某一个具体命令，而是背后的工程观：

> 把 AI 当成会执行流程的工程伙伴，而不是随叫随到的代码生成器。

当我们把需求澄清、领域语言、PRD、issue、TDD、诊断、ADR 这些动作做成 Skill，AI 工具就不再只是“写代码更快”，而是开始帮助我们把工程流程变得更稳定。

对个人开发者来说，这能减少重复解释。对团队来说，这能把经验沉淀成共享资产。对大型代码库来说，这能让 agent 更少误解上下文，更容易沿着正确边界做小步改动。

我会把这套方法总结成一句话：

```text
不要只收藏提示词，要沉淀可复用的工程流程。
```

## 参考资料

- [AIHero: Skills changelog: ubiquitous-language -> grill-with-docs](https://www.aihero.dev/skills-changelog-ubiquitous-language-grill-with-docs)
- [mattpocock/skills: Skills for Real Engineers](https://github.com/mattpocock/skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills)
- [openai/skills](https://github.com/openai/skills)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Cursor Rules](https://docs.cursor.com/context/rules)
