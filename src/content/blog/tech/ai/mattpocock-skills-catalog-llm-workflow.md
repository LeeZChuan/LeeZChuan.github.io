---
title: mattpocock/skills 技能库逐条整理：含义、用途与 LLM 对话用法
description: 系统整理 Matt Pocock 的 Skills for Real Engineers：每个 Skill 解决什么问题、适合什么时候用，以及如何在 Codex、Cursor、Claude 与普通 LLM 对话中融入这些工程流程
date: 2026-06-03
tags: [AI辅助编程, Codex, Cursor, Claude Code, Agent, Skills, 工程效率]
---

上一篇文章我整理了 AIHero 的 [Skills changelog: ubiquitous-language -> grill-with-docs](https://www.aihero.dev/skills-changelog-ubiquitous-language-grill-with-docs)。这篇继续往下走，专门整理 Matt Pocock 的 [mattpocock/skills](https://github.com/mattpocock/skills) 技能库。

这套技能库的名字叫 **Skills For Real Engineers**。它不是“神奇提示词合集”，更像一组给 AI agent 使用的工程工作流：

- 开工前追问需求；
- 把业务术语写进上下文；
- 把想法变成 PRD；
- 把 PRD 拆成垂直切片 issue；
- 用 TDD 小步实现；
- 用诊断循环排查 bug；
- 定期从架构层面审视代码库。

换句话说，它想解决的问题不是“让 AI 多写点代码”，而是“让 AI 按工程师认可的方式工作”。README 用四个常见翻车模式串起来：需求没对齐、术语太啰嗦、缺少测试反馈、架构熵增太快——上文列出的 skill 基本一一对应这些痛点。

> 说明：本文按 2026-06-03 我核对到的 [mattpocock/skills](https://github.com/mattpocock/skills) README、`skills/*/SKILL.md` 与 AIHero changelog 整理。仓库变化很快，使用前建议再看一次 README 的 Reference 小节。

## 先理解：Skill 到底是什么

在 Codex、Claude Code、Cursor 这类工具里，Skill 可以理解成一份可复用的任务说明书。

普通提示词通常是这样：

```text
帮我修一下这个 bug。
```

Skill 化之后会变成：

```text
使用 /diagnose。
先建立可重复运行的反馈回路，再复现，提出可证伪假设，用 instrument 验证，最后修复并补回归测试。
不要在没有证据的情况下直接改代码。
```

差别在于：前者只说“目标”，后者规定“过程”。而 AI 编程最容易翻车的地方，往往不是目标不知道，而是过程太随意。

我会把 Skill 分成三种用法：

| 用法 | 适合工具 | 例子 |
| --- | --- | --- |
| 安装成 slash command | Claude Code、Codex | `/tdd`、`/diagnose`、`/grill-with-docs` |
| 改写成项目规则 | Cursor | `.cursor/rules/diagnose.mdc` |
| 当作对话流程手动提示 | 任意 LLM | “请按 grill-me 的方式先追问我，不要直接给方案” |

所以，即使你不用 Claude Code，也能学这套方法。关键不是斜杠命令，而是把这些流程融入你和 LLM 的对话。

## 快速安装方式

官方 README 推荐用 skills.sh 安装：

```bash
npx skills@latest add mattpocock/skills
```

安装器会让你勾选要装到哪些 agent 上的技能，**务必勾选 `/setup-matt-pocock-skills`**。第一次在目标仓库里使用时，再运行：

```text
/setup-matt-pocock-skills
```

它会让 agent 帮你确认几件事：

- issue tracker 用 GitHub、GitLab、本地 Markdown（`.scratch/`），还是其他系统（Jira、Linear 等，以自由文本描述工作流）；
- triage 的五个状态角色（`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`）如何映射到你仓库里的 label；
- 领域文档是单上下文（根目录 `CONTEXT.md` + `docs/adr/`）还是多上下文（`CONTEXT-MAP.md`），并写入 `docs/agents/` 下的说明文件。

这一步很重要，因为后面的 `to-prd`、`to-issues`、`triage`、`diagnose`、`tdd`、`zoom-out` 等技能会读取这些配置。没有项目上下文，Skill 很容易变成泛泛而谈。

## 推荐学习顺序

不要一开始全装全用。更合理的顺序是：

```text
setup-matt-pocock-skills
-> grill-with-docs
-> to-prd
-> to-issues
-> tdd
-> diagnose
-> zoom-out
-> improve-codebase-architecture
```

如果你只想先试两个，我建议：

```text
grill-with-docs + diagnose
```

一个解决“开工前没想清楚”，一个解决“出问题后乱猜”。

## Engineering Skills：主力工程技能

这一组是最值得认真学的，适合真实项目中的日常代码工作。

### 1. setup-matt-pocock-skills

**含义**：初始化当前仓库的 agent 技能配置。

**用途**：告诉其他 Skill 这个项目怎么管理 issue、有哪些 triage label、领域文档和 ADR 放在哪里。

**适合什么时候用**：

- 第一次在项目中安装这套 skills；
- 换了 issue tracker；
- 团队调整了 triage label；
- agent 不知道 `CONTEXT.md` 或 ADR 在哪里。

**对话中怎么说**：

```text
使用 /setup-matt-pocock-skills 初始化这个仓库。
请先检查 AGENTS.md、CLAUDE.md、CONTEXT.md、docs/adr 和 docs/agents 是否存在，
然后告诉我你准备写入哪些配置，确认后再修改文件。
```

**产出**：`AGENTS.md` 或 `CLAUDE.md` 里的 `## Agent skills` 块，以及 `docs/agents/issue-tracker.md`、`triage-labels.md`、`domain.md`。

### 2. grill-with-docs

**含义**：带文档沉淀能力的需求追问和领域语言对齐。官方定位与 `/grill-me` 同源，额外会把术语和架构决策写进项目文档。

**用途**：在动手前，让 agent 先“拷问”你的方案，找出含糊概念、边界条件、命名不一致和架构决策，并把重要结论写进 `CONTEXT.md` 或 ADR。

**适合什么时候用**：

- 需求还没讲清楚；
- 业务术语容易混乱；
- 你准备改一个已有系统；
- 这个改动会影响模块边界或长期维护。

**对话中怎么说**：

```text
使用 /grill-with-docs。
我想给博客增加一个 AI 文章专题页。
请先阅读现有内容结构和路由，再追问我需求边界。
不要马上写代码。需要沉淀的术语和架构决策，请建议写入 CONTEXT.md 或 ADR。
```

**产出**：明确的需求边界、统一术语、可能更新的 `CONTEXT.md` 和 ADR。

### 3. to-prd

**含义**：把当前已经讨论清楚的上下文整理成 PRD，并发布到项目配置的 issue tracker。

**用途**：综合口头讨论、聊天记录和代码库理解，写成 PRD。它**不会**再采访用户，但会先探索仓库、梳理测试切入点（优先用已有接缝、尽量高层），并与你确认这些接缝是否符合预期，再按模板写出 PRD。

**适合什么时候用**：

- 已经通过 `grill-with-docs` 把问题问清楚；
- 需要把想法变成正式需求；
- 后续要拆 issue、排期或交给别的 agent 继续做。

**对话中怎么说**：

```text
使用 /to-prd。
基于刚才已经确认的需求，生成一份 PRD。
请包括 Problem Statement、Solution、User Stories、Implementation/Testing Decisions、Out of Scope。
发布到 issue tracker 时打上 ready-for-agent 标签，不要再重新发散需求。
```

**产出**：PRD（发布为 issue 或本地 Markdown 任务），并标记为 agent 可领取。

### 4. to-issues

**含义**：把 PRD 或计划拆成可独立领取的垂直切片 issue。

**用途**：避免 agent 一次性吞下一个大需求。每个 issue 都应该尽量独立、有明确验收标准、能被测试验证。

**适合什么时候用**：

- PRD 太大；
- 想让 agent 分多轮实现；
- 团队需要任务拆分；
- 你想控制每次改动的范围。

**对话中怎么说**：

```text
使用 /to-issues。
请把这份 PRD 拆成 5 个以内的垂直切片任务。
每个 issue 都要包含背景、实现范围、非范围、验收标准和建议测试。
不要按技术层拆成“先写数据库、再写接口、再写页面”，要按用户可验证的结果拆。
```

**产出**：一组 GitHub/Linear/local Markdown issue。

### 5. tdd

**含义**：让 agent 按 Red -> Green -> Refactor 的测试驱动开发节奏工作。

**用途**：先写失败测试，再写最小实现让测试通过，最后重构。它能减少“AI 写了很多代码但没验证”的问题。

**适合什么时候用**：

- 修 bug；
- 加功能；
- 改核心逻辑；
- 项目已有测试体系；
- 你希望 agent 小步前进。

**对话中怎么说**：

```text
使用 /tdd 实现这个 issue。
请先找现有测试风格，然后写一个失败测试。
测试失败后再写最小实现。
通过后只做必要重构，并说明跑了哪些测试。
```

**产出**：失败测试、实现代码、通过的测试结果、必要重构。

### 6. diagnose

**含义**：结构化诊断 bug 或性能问题。

**用途**：避免 agent 看到报错就乱改。官方循环是：**建立反馈回路 → 复现 → 提出可证伪假设 → instrument 验证 → 修复并写回归测试 → 清理与复盘**。其中「建立反馈回路」是核心——没有可重复、可自动化的 pass/fail 信号，后面几步都很难可靠。

**适合什么时候用**：

- bug 难复现；
- 性能退化；
- 测试偶发失败；
- 线上接口偶发 500；
- 你不确定根因在哪里。

**对话中怎么说**：

```text
使用 /diagnose。
这个接口偶发返回 500。
请先建立可重复运行的反馈回路（失败测试、curl 脚本、最小 harness 等），再复现。
提出 3–5 个可证伪假设，每次 instrument 只改一个变量。
修复前先写回归测试，最后清理调试日志并说明根因。
```

**产出**：反馈回路、复现证据、假设与 instrument 结果、修复、回归测试、必要时对架构改进的建议。

### 7. triage

**含义**：按固定状态机处理 issue tracker 上的工单。

**用途**：给 issue 打**类别**（`bug` / `enhancement`）和**状态**（五个 canonical 角色，映射到你在 setup 里配置的 label），必要时复现 bug、跑 `grill-with-docs` 补全信息，并为 `ready-for-agent` 写 agent brief。它依赖 `/setup-matt-pocock-skills` 中的 triage 配置。

**适合什么时候用**：

- issue 多了以后需要分拣；
- 需要把工单推进到 `ready-for-agent` 或 `ready-for-human`；
- 团队想让 agent 帮忙整理 issue 上下文，而不是直接写代码。

**对话中怎么说**：

```text
使用 /triage，列出需要我关注的未分拣和 needs-triage 工单。
对 #42 给出 bug/enhancement 分类和状态建议；若信息不足先 needs-info，不要直接实现。
```

**产出**：分类与状态 label、triage 备注或 agent brief、必要时写入 `.out-of-scope/` 的拒绝记录。

### 8. zoom-out

**含义**：让 agent 从局部代码跳出来，用系统视角解释当前模块。

**用途**：当你或 agent 陷在某个文件里时，要求它解释这个文件在整个系统中的角色、依赖关系和设计意图。

**适合什么时候用**：

- 接手陌生代码；
- 开始重构前；
- agent 对局部代码理解太机械；
- 你想知道某个模块为什么这样写。

**对话中怎么说**：

```text
使用 /zoom-out。
请从整个系统角度解释 src/lib/posts.ts 的作用。
说明它和内容目录、路由生成、Markdown 渲染之间的关系。
不要先给修改建议，先讲清楚上下文。
```

**产出**：系统级解释、模块关系图、潜在风险点。

### 9. improve-codebase-architecture

**含义**：从架构角度寻找代码库的“加深”机会。

**用途**：识别浅模块、重复概念、边界混乱、接口不清晰等问题，并提出小步可执行的改进建议。

**适合什么时候用**：

- 项目越来越难改；
- agent 连续生成代码后结构变乱；
- 模块职责开始重叠；
- 想做架构体检，但不想大重构。

**对话中怎么说**：

```text
使用 /improve-codebase-architecture。
请阅读 CONTEXT.md、docs/adr 和主要模块。
找出 3 个最值得改进的架构问题。
每个问题都要说明症状、原因、风险、建议的小步改法和验证方式。
不要直接大规模重构。
```

**产出**：架构问题清单、优先级、重构建议、验证路径。

### 10. prototype

**含义**：做一次性原型，不以生产质量为目标。

**用途**：在正式实现前快速探索设计。可以是**可运行的终端原型**（验证状态机、业务规则），也可以是**同一 route 下可切换的多种 UI 方案**。强调“扔掉原型”，避免把探索代码直接合进生产系统。

**适合什么时候用**：

- 状态机还没想清楚；
- UI 方向有多个版本；
- 需要快速比较交互方案；
- 想先验证想法，不想污染正式代码。

**对话中怎么说**：

```text
使用 /prototype。
我想探索博客首页的 AI 专题入口。
请做 3 个明显不同的 UI 方向，放在一个临时 route 中切换预览。
这不是生产代码，目标是帮助我比较设计方向。
```

**产出**：一次性原型、可运行 demo、方案比较。

## Productivity Skills：通用效率技能

这一组不只服务写代码，也适合写作、开会、研究和任务交接。

### 11. grill-me

**含义**：纯追问，不绑定代码库。

**用途**：让 LLM 像一个严格的技术合伙人一样追问你的计划，直到关键分支都清楚。

**适合什么时候用**：

- 写文章前梳理观点；
- 做产品方案；
- 准备技术分享；
- 还没有进入代码实现。

**对话中怎么说**：

```text
使用 grill-me 的方式。
我想写一篇关于 AI Skills 的博客。
请连续追问我关键决策：目标读者、文章边界、案例、结论、反例。
在我回答完之前，不要帮我写正文。
```

### 12. caveman

**含义**：极度压缩表达，只保留技术准确性。

**用途**：减少 agent 输出废话，官方说明大约可节省 ~75% token。适合你已经知道背景，只想要高密度信息。

**适合什么时候用**：

- review diff；
- 长上下文快满了；
- 只想看结论；
- agent 输出太啰嗦。

**对话中怎么说**：

```text
进入 caveman 模式。
只给事实、结论和下一步。
不要解释背景，不要客套。
```

### 13. handoff

**含义**：把当前对话整理成可交接文档。

**用途**：当一个 agent 会话快结束，或者你要换 Codex/Cursor/Claude 继续做时，把当前状态、已做决策、未完成事项、风险和下一步整理出来。

**适合什么时候用**：

- 长任务中途暂停；
- 换工具继续；
- 让另一个 agent 接手；
- 准备发给同事。

**对话中怎么说**：

```text
使用 /handoff。
请把当前任务整理成交接文档：
目标、已经完成的改动、关键决策、未完成事项、风险、建议下一步、相关文件。
```

### 14. write-a-skill

**含义**：帮助你把自己的经验写成 Skill。

**用途**：当你发现某类任务反复出现，就把流程写成 `SKILL.md`，让 agent 以后稳定复用。

**适合什么时候用**：

- 你有固定博客写作流程；
- 团队有固定代码 review 规范；
- 项目有固定发布流程；
- 你想把“每次都要解释”的东西沉淀下来。

**对话中怎么说**：

```text
使用 /write-a-skill。
我想创建一个 blog-research-writeup skill。
用途是：阅读外部文章、整理观点、结合个人实践、写成我博客的 Markdown 格式。
请先问我触发场景、输入、输出、流程和验收标准，再生成 SKILL.md。
```

## Misc Skills：偶尔使用的工具型技能

这一组不是每天都用，但在特定场景下很实用。

### 15. git-guardrails-claude-code

**含义**：给 Claude Code 配置 Git 安全护栏。

**用途**：阻止危险 git 命令，比如误 push、`reset --hard`、`clean` 等。适合对 agent 自主执行命令有顾虑的项目。

**对话中怎么说**：

```text
使用 git-guardrails-claude-code。
请配置 Claude Code hooks，阻止危险 git 操作。
配置前先告诉我会拦截哪些命令。
```

### 16. setup-pre-commit

**含义**：配置 pre-commit 检查。

**用途**：安装 Husky、lint-staged、Prettier、类型检查和测试等提交前校验，具体取决于项目技术栈。

**对话中怎么说**：

```text
使用 /setup-pre-commit。
请先识别当前项目的包管理器、lint、format、test 命令。
然后提出 pre-commit 配置方案，确认后再修改。
```

### 17. scaffold-exercises

**含义**：生成练习题目录结构。

**用途**：适合教程、课程、代码练习项目。它可以创建 section、problem、solution、explainer 等结构。

**对话中怎么说**：

```text
使用 /scaffold-exercises。
请为 TypeScript 类型体操课程生成 5 个练习目录。
每个练习包含 problem、solution 和 explainer。
```

### 18. migrate-to-shoehorn

**含义**：把测试里的 `as` 类型断言迁移到 `@total-typescript/shoehorn`。

**用途**：这是很具体的 TypeScript 测试迁移工具。只有你使用相关测试风格时才需要。

**对话中怎么说**：

```text
使用 /migrate-to-shoehorn。
请扫描测试文件，把不安全的 as 类型断言迁移到 @total-typescript/shoehorn。
先列出影响文件，再执行迁移。
```

## 仓库里还有哪些非主线 Skill

[mattpocock/skills](https://github.com/mattpocock/skills) 除了 README 列出的 18 个活跃 skill，还在子目录里放了其他内容。安装器默认**不会**把它们装进插件：

| 目录 | 代表 Skill | 状态 | 我的建议 |
| --- | --- | --- | --- |
| `skills/deprecated/` | `ubiquitous-language`、`qa`、`design-an-interface`、`request-refactor-plan` | 作者标明不再使用 | `ubiquitous-language` 能力已由 `grill-with-docs` 吸收；其余优先用 `tdd`、`diagnose`、`improve-codebase-architecture` |
| `skills/in-progress/` | `review`、`teach`、`writing-beats`、`writing-fragments`、`writing-shape` | 开发中，README 未收录 | `review` 从 Standards + Spec 两轴看 diff；写作类适合借鉴结构，别当工程主线 |
| `skills/personal/` | `edit-article`、`obsidian-vault` | 作者个人环境 | 可以学习 SKILL 写法，不建议照搬 |

changelog 里还提到过、但当前仓库已找不到独立目录的 `domain-model`，理解成并入 `grill-with-docs` 的历史路线即可。

我的原则是：

```text
主力工程流程用 README Reference 里的活跃 skills；
deprecated 用来理解演进；
in-progress / personal 用来借鉴思路；
团队规范最好自己改写成项目内 skill。
```

## 如何融入日常 LLM 对话

如果你没有安装这些 Skill，也可以直接把它们当作“对话动作”来用。

### 方式一：显式点名流程

```text
请按 /diagnose 的方式处理这个问题：
1. 先建立可重复运行的反馈回路。
2. 再复现并确认症状与用户描述一致。
3. 提出 3–5 个可证伪假设。
4. 用 instrument 逐项验证（一次只改一个变量）。
5. 写回归测试 → 修复 → 清理调试痕迹。
```

适合普通 ChatGPT、Claude、Gemini、Cursor Chat。

### 方式二：先声明角色，再限制动作

```text
你现在不是代码生成器，而是需求澄清助手。
请按 grill-me 的方式追问我。
在需求边界、目标用户、非目标、验收标准没有明确前，不要给实现方案。
```

适合需求早期。

### 方式三：把 Skill 写入项目规则

例如在 Cursor 里写一个 `.cursor/rules/tdd.mdc`：

```text
当用户要求实现功能或修复 bug，并且项目已有测试时：
1. 先阅读现有测试风格。
2. 先写失败测试。
3. 只写让测试通过的最小实现。
4. 测试通过后再重构。
5. 最终说明运行过哪些测试。
```

这样你不用每次复制提示词，Cursor 的 agent 会在合适场景看到这条规则。

### 方式四：把 Skill 串成完整工作流

真实项目不要让 agent 从想法直接跳到代码。可以这样串：

```text
/grill-with-docs
-> /to-prd
-> /to-issues
-> /tdd
-> /diagnose
-> /handoff
```

对应到人话就是：

```text
先问清楚 -> 写成需求 -> 拆小任务 -> 小步实现 -> 出问题就诊断 -> 最后交接
```

## 使用案例一：写一篇技术博客

目标：看完一篇英文技术文章，写成中文博客。

可以这样和 LLM 对话：

```text
请按 grill-me 的方式先追问我，不要直接写文章。
主题是：mattpocock/skills 如何帮助工程师使用 AI agent。
请确认：
1. 目标读者是谁；
2. 文章要解决什么问题；
3. 哪些 skills 必须解释；
4. 是否需要 Codex/Cursor/Claude 的落地方式；
5. 最后要不要给使用案例。
```

等问题问清楚后：

```text
请把刚才讨论的内容整理成 PRD 风格的文章大纲。
包括标题、核心观点、章节结构、案例和参考资料。
```

最后再说：

```text
请按这个大纲写成 Markdown 博客。
保持浅显易懂，避免堆砌术语。
每个 skill 都要解释：含义、用途、适合场景、对话示例。
```

这个流程其实是 `grill-me -> to-prd -> 写作执行`。

## 使用案例二：实现一个新功能

目标：给博客增加一个“AI 专题”页面。

推荐对话：

```text
使用 /grill-with-docs。
我想给博客增加一个 AI 专题页。
请先阅读当前路由、内容目录和首页结构。
然后追问我页面目标、筛选规则、展示字段、移动端表现和 SEO 要求。
不要马上写代码。
```

确认后：

```text
使用 /to-prd，把刚才确认的内容整理成 PRD。
```

再拆任务：

```text
使用 /to-issues，把 PRD 拆成 3 个垂直切片：
1. 内容筛选和数据结构；
2. 页面路由和列表展示；
3. SEO、空状态和构建验证。
```

实现时：

```text
使用 /tdd 实现第一个 issue。
先补数据筛选测试，再写实现。
```

这个流程能避免 agent 一口气改首页、路由、样式、SEO，最后很难 review。

## 使用案例三：排查线上 bug

目标：某个接口偶发 500。

推荐对话：

```text
使用 /diagnose。
问题：/api/report 偶发 500。
请按以下顺序：
1. 先建立反馈回路（失败测试或 curl 脚本），不要先改代码；
2. 复现并确认症状；
3. 提出 3–5 个可证伪假设，列出预测；
4. 用 instrument 验证，一次只改一个变量；
5. 有正确测试接缝时，先写失败回归测试再修复；
6. 清理 [DEBUG-...] 日志，说明根因。
```

如果 agent 急着改代码，可以立刻打断：

```text
停止实现。
你还没有证明根因。
请回到 diagnose 流程，先给出证据。
```

这句话很重要。Skill 不是装上就一定执行完美，你仍然要监督它是否遵守流程。

## 使用案例四：代码库越来越乱

目标：做一次小型架构体检。

推荐对话：

```text
使用 /improve-codebase-architecture。
请阅读 CONTEXT.md、docs/adr 和 src/lib、src/app 的核心文件。
找出 3 个最影响长期维护的问题。
每个问题请按：
症状 -> 影响 -> 可能原因 -> 小步改进方案 -> 验证方式
来输出。
不要直接修改代码。
```

如果需要进一步理解某个模块：

```text
使用 /zoom-out。
请解释 src/lib/posts.ts 在整个博客系统中的位置，
包括它和 Markdown、frontmatter、静态路由、SEO 文件生成之间的关系。
```

这个组合适合定期运行，不一定要马上重构。很多时候，先把架构问题说清楚，本身就已经很有价值。

## 我的使用建议

第一，不要把 Skill 当成万能插件。它本质上是流程说明，执行质量仍然取决于模型、上下文、工具权限和你的监督。

第二，优先学主流程，而不是收藏所有 Skill。对大多数工程师来说，先掌握：

```text
grill-with-docs
to-prd
to-issues
tdd
diagnose
handoff
```

已经能覆盖大部分场景。

第三，把团队自己的经验写成 Skill。Matt Pocock 的仓库最好当模板，不要原样照搬所有流程。比如你的博客项目可以沉淀：

```text
blog-research-writeup
markdown-frontmatter-check
nextjs-static-blog-build-verify
```

第四，对第三方 Skill 保持安全意识。安装前读一下 `SKILL.md`，看它是否会要求执行命令、修改 Git、访问外部服务或写入敏感文件。Skill 是给 agent 的指令，指令本身也需要 review。

## 总结

Matt Pocock 这套 skills 最值得学的地方，是它把 AI 编程重新拉回工程纪律：

- 不清楚就先追问；
- 有共识就写文档；
- 任务太大就拆小；
- 写代码要有测试；
- 修 bug 要有证据；
- 架构变差要定期回头看；
- 会话结束要能交接。

我会把它总结成一句话：

```text
Skill 不是让 LLM 更像魔法师，而是让 LLM 更像守流程的工程师。
```

当你和 LLM 对话时，不要只说“帮我做”。更好的说法是：

```text
请按某个工程流程帮我做，并且在流程没完成前不要跳步。
```

这才是 `mattpocock/skills` 真正值得借鉴的地方。

## 参考资料

- [mattpocock/skills: Skills For Real Engineers](https://github.com/mattpocock/skills)
- [AIHero: AI Skills for Real Engineers](https://www.aihero.dev/skills)
- [AIHero: Skills changelog: ubiquitous-language -> grill-with-docs](https://www.aihero.dev/skills-changelog-ubiquitous-language-grill-with-docs)
- [skills.sh: mattpocock/skills](https://www.skills.sh/mattpocock/skills)
- [setup-matt-pocock-skills on skills.re](https://skills.re/skills/mattpocock/skills/setup-matt-pocock-skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Cursor Rules](https://docs.cursor.com/context/rules)
