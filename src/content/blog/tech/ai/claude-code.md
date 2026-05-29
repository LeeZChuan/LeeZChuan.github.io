---
title: Claude Code 官方技术文章整理与解读
description: 按时间线梳理 Anthropic Engineering 从 2024.09 到 2026.05.30 之间关于 Contextual Retrieval、Agent、Claude Code、MCP、上下文工程、长任务、安全沙箱与评测体系的技术文章
date: 2026-05-30
tags: [Claude Code, ai, AI辅助编程, Agent, MCP]
---


> 如何让 Claude Code 这类 coding agent 在真实工程里长时间、可验证、低风险地工作？

本文按时间顺序整理。官方入口在这里：

- [Anthropic Engineering](https://www.anthropic.com/engineering/)
- [Claude Code: Best practices for agentic coding](https://code.claude.com/docs/en/best-practices)

说明一下时间：本文整理范围从 `2024.09` 写到 `2026.05.30`。我当前核对到的官方 Engineering 页面中，和 Claude Code / agent 工程最相关的最新文章是 2026.05.25 发布的 [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude)。

## 2024.09：Contextual Retrieval 先解决“知识怎么进上下文”

在 Claude Code 成为热门工具之前，Anthropic 已经在讲一个很底层的问题：

- 2024.09.19：[Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

这篇文章讨论的是 RAG，也就是外部知识检索。它的核心问题很朴素：如果我们把文档切成很多小 chunk，再用向量检索召回，chunk 很容易丢失原文里的上下文。

举个例子，一个 chunk 里只写着“收入增长 3%”，模型可能不知道这是哪家公司、哪个季度、哪个地区、和什么指标相比。检索系统把这段找回来了，但它本身缺少足够语义，模型就容易误解。

Contextual Retrieval 的做法，是在每个 chunk 前补充一段上下文说明，让它带着“来自哪里、在讲什么、和整篇文档什么关系”一起进入检索索引。官方把它和 BM25、向量检索、reranking 结合，用来提升召回质量。

这篇放在 Claude Code 时间线前面很重要，因为 coding agent 面对大型代码库时，本质上也在做类似的事情：

- 当前文件只是局部上下文。
- 函数调用链、业务约定、历史决策在别处。
- 如果只检索到一小段代码，模型可能不知道它在系统里的位置。
- 检索结果如果没有上下文说明，就容易引发错误修改。

所以我会把 Contextual Retrieval 理解成 Claude Code 上下文工程的前置思想：不是简单把资料塞给模型，而是让每段资料带着足够背景进入模型。

对应到代码库实践，可以这样做：

- 给关键目录写简短说明，告诉 agent 每层负责什么。
- 在 `CLAUDE.md` 里放项目结构、命名约定和常用命令。
- 对复杂业务模块维护 `README` 或 `SPEC`，让检索到的代码有背景。
- 不要只让 agent 看报错行，还要让它看调用链、测试用例和业务入口。

我理解的重点是：检索不是搜索结果越多越好，而是召回的信息要能被模型正确放回原来的语境里。

## 2024.12：Building effective agents 给出 agent 设计的基线

第二篇应该补进来的文章是：

- 2024.12.19：[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

这篇是 Anthropic 关于 agent 设计最经典的文章之一。它的价值在于没有一上来鼓励大家搭复杂框架，而是先区分了 workflow 和 agent。

我对它的理解是：

- Workflow 更像预先写好的流程，步骤明确，控制逻辑固定。
- Agent 更像模型自己决定下一步，能根据环境反馈调整路径。

官方给出的建议非常务实：能用简单 workflow 解决的问题，不要硬上复杂 agent。只有当任务需要动态判断、工具选择、反复迭代和环境反馈时，agent 才真正有价值。

这对 Claude Code 很关键。很多时候我们以为自己需要“全自动 agent”，但真实需求可能只是：

- 固定脚本跑一次。
- 按模板生成一份文件。
- 根据明确规则修改一批代码。
- 执行一个已知的发布流程。

这些更适合 workflow。Claude Code 真正发挥价值的场景，是任务路径不完全确定，比如：

- 线上 bug 排查。
- 大型代码库改造。
- 测试失败后不断缩小范围。
- 需要读代码、做假设、验证、再调整方案。
- 多个工具之间需要动态选择。

这篇文章还总结了几种常见 agent/workflow 模式，比如 prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer。后面 Anthropic 关于 long-running harness、多 agent、planner/generator/evaluator 的文章，其实都能在这里找到早期影子。

我觉得它给 Claude Code 用户的提醒是：不要为了“agent 感”而复杂化任务。先问自己三个问题：

1. 这个任务路径是否固定？
2. 是否需要模型根据中间结果重新规划？
3. 是否有明确验证信号？

如果路径固定，用脚本或 workflow 更稳。如果路径不固定，但验证信号清晰，Claude Code 才更像合适的工具。

## 2025.01：先把 coding agent 当成一个系统，而不是一个模型

第一篇值得作为起点的文章是：

- 2025.01.06：[Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet](https://www.anthropic.com/engineering/swe-bench-sonnet)

这篇文章表面上讲的是 Claude 3.5 Sonnet 在 SWE-bench Verified 上的表现，但我觉得它真正重要的地方在于：官方把 SWE-bench 的结果放在了一个 agent scaffold 里讨论。

也就是说，编码能力不是单独由模型决定的。一个 coding agent 的效果至少取决于这些部分：

- 模型本身能不能理解代码和任务。
- Prompt 是否把目标、边界和验证方式说清楚。
- 工具是否足够好用，比如搜索、读文件、编辑、跑测试。
- 环境是否能反馈真实结果，而不是只让模型在脑子里猜。
- 是否有稳定的 edit-test-debug 循环。

这对 Claude Code 的理解很关键。Claude Code 不是“更会写代码的聊天框”，而是模型、命令行、文件系统、编辑器、测试环境和权限控制组合成的工程系统。

所以我现在用 Claude Code 时，会尽量避免只说“帮我修一下”。更稳定的方式是：

```text
先阅读相关代码，说明现有实现。
再复现或定位问题。
给出修改计划，确认影响范围。
完成后运行测试或构建。
最后说明改动文件、验证结果和剩余风险。
```

这里的重点不是 prompt 写得多漂亮，而是给 agent 一个可以闭环的工作环境。

## 2025.03：让 agent 在复杂工具调用前停下来想一想

接下来是：

- 2025.03.20：[The "think" tool: Enabling Claude to stop and think in complex tool use situations](https://www.anthropic.com/engineering/claude-think-tool)

这篇文章讨论的是一个很简单但很有启发的工具：`think`。它不是查资料、改文件或调用 API，而是给模型一个明确的中间空间，让它在复杂工具调用之间停下来整理。

我对这篇的理解是：很多 agent 错误不是因为模型完全不会，而是因为它太快进入行动了。

典型问题包括：

- 前一个工具返回的信息还没消化，就急着调用下一个工具。
- 多个约束之间有冲突，但模型没有显式整理。
- 已经发现某条路径不对，却继续沿着惯性往下做。

虽然现在 Claude 的 extended thinking 和 Claude Code 自身的执行模式已经比当时成熟很多，但这篇文章仍然有价值。它提醒我：长任务里需要给 agent 留出“整理状态”的步骤。

在实际编码任务里，这可以转化为很朴素的要求：

```text
先总结你已经确认的事实、还不确定的点、下一步要验证的假设，再继续修改代码。
```

这比让模型连续跑很多命令更稳。

## 2025.04：Claude Code 的官方最佳实践开始成型

这一篇是 Claude Code 用户最应该先读的：

- 2025.04.18：[Claude Code: Best practices for agentic coding](https://code.claude.com/docs/en/best-practices)

这篇文章的内容很像 Claude Code 的使用说明书，但我觉得它更像一组工程习惯。

官方反复强调几件事：

- 让 Claude 先探索代码库，不要一上来就改。
- 给它明确的测试、lint、build 或运行命令。
- 使用 `CLAUDE.md` 保存项目约定。
- 用 `/clear` 管理上下文，不要把失败历史无限堆在一个会话里。
- 对复杂任务用 planning、subagent、并行会话或 git worktree。

这其实是在把人类工程师的工作方式迁移给 agent。一个靠谱开发者接手项目，不会第一分钟就大面积重构；他会先看目录结构、读关键模块、跑测试、确认失败点，再开始改。

Claude Code 也是一样。它越像一个真实工程师，越需要真实工程流程约束。

## 2025.06：多 agent 适合“广度探索”，但不是银弹

6 月有两篇和 agent 协作有关的文章：

- 2025.06.13：[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- 2025.06.26：[Desktop Extensions: One-click MCP server installation for Claude Desktop](https://www.anthropic.com/engineering/desktop-extensions)

多 agent 研究系统这篇，不是专门写 Claude Code，但对理解 coding agent 很有帮助。

官方的判断很实用：多 agent 更适合广度优先的问题，比如研究、资料搜集、并行比较、复杂问题拆解。它能突破单个上下文窗口的限制，也能让多个子任务并行推进。但代价是 token 成本、协调成本和合并成本都会上升。

放到编码里，我会这样理解：

- 如果任务可以拆成互不干扰的小块，多 agent 有价值。
- 如果任务强耦合，比如一个核心架构调整，多 agent 可能制造冲突。
- 如果没有测试，多 agent 只会更快地产生更多不可验证的改动。

Desktop Extensions 那篇则是 MCP 生态的一个产品化信号：外部工具、数据源和本地能力会越来越容易接入 Claude。工具越容易接入，越需要认真设计工具边界，否则 agent 会被一堆低质量工具干扰。

## 2025.09：上下文工程和工具设计成为 Claude Code 的核心主题

9 月连续几篇文章非常关键：

- 2025.09.11：[Writing effective tools for agents — with agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- 2025.09.17：[A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues)
- 2025.09.29：[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

我原来的摘记主要来自其中两篇。现在重新看，我会把它们合在一起理解：Claude Code 的稳定性来自“上下文”和“工具”两件事。

### 工具不是 API 的简单包装

[Writing effective tools for agents — with agents](https://www.anthropic.com/engineering/writing-tools-for-agents) 这篇里有一个观点很重要：工具不是越多越好，工具也不是把已有 API 包一层就结束。

传统 API 是写给程序员或程序调用的，agent 工具是写给模型理解和行动的。工具名、参数名、返回值、错误信息都会影响模型下一步怎么做。

我之前摘过其中一个点：工具返回内容要有意义，避免把底层技术标识符直接扔给模型。比如 UUID、`mime_type`、底层状态码，并不一定能帮助模型判断下一步。

更适合 agent 的返回应该是这种风格：

```json
{
  "file_name": "Q3 revenue forecast.xlsx",
  "file_type": "spreadsheet",
  "summary": "Contains quarterly revenue forecast by region.",
  "next_action_hint": "Use the spreadsheet reader if you need row-level details."
}
```

这不是说不能返回底层字段，而是要把“模型下一步行动需要什么”放在第一位。

### 上下文不是越多越好

[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 这篇则把问题推进到上下文管理。

我原来记录了长期任务的三种方式：

- Compaction：压缩历史上下文，保持对话连续性。
- Structured note-taking：把关键信息写成结构化笔记或文件。
- Sub-agent architectures：把任务分给多个 agent，用独立上下文并行探索。

现在我会补一句：这三种方式都在解决同一个问题，即上下文窗口会退化。

长上下文里会出现几个典型问题：

- 早期约束被模型忽略。
- 无关工具输出污染判断。
- 失败路径一直留在会话里，影响后续推理。
- 模型看似记得很多，实际抓不住当前最重要的信息。

所以长任务不能只依赖聊天历史。更好的方式是把关键状态外置：

- 用 `CLAUDE.md` 放项目约定。
- 用 `SPEC.md` 放需求和边界。
- 用 `PROGRESS.md` 放进度和已知问题。
- 用测试和 git commit 作为真实状态记录。

我理解的上下文工程，不是“把更多资料塞给模型”，而是帮 agent 整理工作台。

### 质量问题也可能来自系统层

[A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues) 这篇提醒了另一个事实：用户感知到的“模型变笨”，不一定只是模型能力下降。

路由、采样、硬件实现、推理参数、系统提示和产品层逻辑，都可能影响最后表现。对 Claude Code 用户来说，这意味着反馈要尽量可复现：

- 任务是什么？
- 输入上下文是什么？
- 期望行为是什么？
- 实际失败在哪里？
- 是否能用最小仓库或最小命令复现？

这比只说“最近变差了”更能帮助定位问题。

## 2025.10：从技巧走向可复用能力和安全边界

10 月的两篇文章把 Claude Code 往生产环境又推了一步：

- 2025.10.16：[Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- 2025.10.20：[Beyond permission prompts: making Claude Code more secure and autonomous](https://www.anthropic.com/engineering/claude-code-sandboxing)

Agent Skills 这篇我很喜欢，因为它解决的是一个日常痛点：团队经验怎么给 agent 复用？

如果每次都把团队规范、脚本说明、业务流程、检查清单塞进 prompt，迟早会把上下文撑爆。Skills 的思路是把这些东西组织成可发现、可加载的文件夹，让 agent 在需要时再读取。

这其实很适合团队内部沉淀：

- 发布流程 skill。
- 代码审查 skill。
- 性能排查 skill。
- 前端页面验收 skill。
- 某个业务域的调试 skill。

另一篇 sandboxing 则是安全方向的关键文章。Claude Code 要更自治，就不能只靠用户逐个点权限确认。

权限弹窗的问题是：用户会疲劳。弹窗越多，人越容易机械批准。真正稳的安全应该把边界做在环境里：

- 文件系统边界。
- 网络访问边界。
- 凭证隔离。
- devcontainer 或 sandbox。
- 对高风险命令保持人工确认。

这也是我现在对 Claude Code 的安全理解：不是相信模型永远不会犯错，而是让它即使犯错，也够不到不该碰的东西。

## 2025.11：MCP、代码执行和长任务 harness 开始连成体系

11 月的文章密度很高，基本是在回答“工具多了、任务长了以后怎么办”：

- 2025.11.04：[Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)
- 2025.11.24：[Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use)
- 2025.11.26：[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### MCP 不是把所有工具都塞进上下文

MCP 很容易让人兴奋，因为它让 Claude 能接外部工具、数据库、浏览器、设计稿、内部系统。但工具一多，马上会有两个问题：

- 工具定义本身占上下文。
- 工具返回的大量中间结果会污染上下文。

[Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) 的思路是：不要让模型直接看所有中间数据，而是让它写代码调用工具、过滤数据、汇总结果，再把真正重要的信息带回上下文。

比如分析 10000 行日志，不应该把日志全文丢给模型。更好的方式是让 Claude 写脚本统计异常、聚合错误类型、抽样关键片段，然后再基于摘要判断。

[Introducing advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) 则进一步把工具使用产品化：

- Tool Search：按需找工具，而不是一次加载所有工具。
- Programmatic Tool Calling：用代码批量调用和组合工具。
- Tool Use Examples：给模型具体使用示例，而不只是 schema。

这对 Claude Code 的启发是：工具生态越大，越不能粗暴堆工具；要让工具可搜索、可学习、可组合、可验证。

### 长任务需要 harness，而不是一个无限会话

[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 是我认为最值得反复读的一篇。

长任务失败常见有两种：

- 上下文越来越乱，agent 接不上之前的状态。
- agent 过早认为完成，但实际还有很多边角没处理。

官方给出的方向是 harness：用外部结构管理长任务。

一个典型结构可以是：

- initializer agent：初始化项目、梳理任务、建立进度文件。
- feature list：把需求拆成可验证的小项。
- progress file：记录已经完成什么、还剩什么、遇到什么问题。
- git history：每轮完成后留下提交点。
- test/browser harness：用测试、构建、浏览器截图验证结果。

这让我意识到：Claude Code 长任务的关键不是“让一个会话跑更久”，而是让任务可以被接力。

## 2026.01：评测方式开始变化，AI 也改变了技术评价

2026 年初，两篇文章从评测角度切入：

- 2026.01.09：[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- 2026.01.21：[Designing AI-resistant technical evaluations](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)

Agent eval 和普通大模型评测不一样。普通评测可能看一次回答对不对，agent 评测要看一整段过程：

- 它有没有正确使用工具？
- 它有没有根据工具结果调整计划？
- 它有没有改变环境状态？
- 最终结果是不是可运行、可验证？
- 它有没有引入新的风险？

这对团队落地 Claude Code 很重要。不要只看官方 benchmark，也不要只凭感觉说“这个模型更聪明”。更可靠的是建立自己的小型 eval：

- 选 10-30 个真实历史 bug 或需求。
- 给每个任务准备验收标准。
- 固定测试命令和检查方式。
- 记录成功率、耗时、人工介入点和失败类型。
- 模型或工具升级后重跑。

另一篇 AI-resistant technical evaluations 则说明 Claude Code 已经强到会改变技术面试和 take-home。未来评估工程师，不能只评估“能不能写出代码”，还要评估：

- 能不能定义问题。
- 能不能设计验证。
- 能不能审查 AI 生成结果。
- 能不能发现隐藏风险。
- 能不能把 AI 纳入工程流程。

这也是我觉得很现实的一点：AI 编程不会让工程能力不重要，它会让工程判断更重要。

## 2026.02：并行 Claude Code 写编译器，重点其实是协作机制

2 月这篇很吸引眼球：

- 2026.02.05：[Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- 2026.02.05：[Quantifying infrastructure noise in agentic coding evals](https://www.anthropic.com/engineering/infrastructure-noise)

第一篇讲的是用一组并行 Claude Code agents 写一个 Rust C compiler。数字很夸张：多个 agents、近 2000 个 Claude Code sessions、约 10 万行 Rust。

但我觉得这篇最重要的不是“AI 能写编译器”，而是它暴露了并行 coding agent 的真实工程问题：

- 多个 agent 会争抢同一块代码。
- 没有测试就无法判断谁改对了。
- 合并冲突和重复实现会快速增加。
- 每个 session 都像新来的工程师，需要清晰上下文。
- 测试输出太吵，agent 也会被噪音拖慢。

这篇给我的启发是：日常项目没必要一上来模仿 16 个 agents。更实际的方式是用少量并行角色：

- 一个实现功能。
- 一个补测试或复现 bug。
- 一个做 code review 或安全审查。

第二篇 infrastructure noise 则提醒我们，agentic coding eval 是端到端系统测试。CPU、内存、容器、超时、网络都会影响分数。小幅 leaderboard 差距未必代表模型真实能力差距。

这也支持前面的结论：团队应该建立自己的任务集和验证环境。

## 2026.03：长时间应用开发和 auto mode 继续推进自治能力

3 月两篇继续沿着“更长、更自动、更安全”的方向走：

- 2026.03.24：[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- 2026.03.25：[How we built Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)

长时间应用开发这篇进一步拆分了 agent 角色：planner、generator、evaluator。这里有一个很朴素但很重要的经验：写代码的 agent 不应该完全负责评价自己。

人类开发也一样。开发者写完代码后，还需要测试、review、验收。agent 如果自己写、自己评，很容易过早满意。

所以复杂任务里可以考虑这种分工：

- planner：拆需求、定边界。
- generator：实现功能。
- evaluator：独立检查功能、体验和风险。

auto mode 这篇则回到 Claude Code 的权限问题。官方发现用户会批准大量权限请求，长期会产生审批疲劳。auto mode 的方向是用分类器放行常规开发动作，同时拦截高风险动作。

这不是说可以无脑跳过权限，而是说明安全策略在分层：

- 常规低风险动作自动化，减少摩擦。
- 高风险动作分类器拦截。
- 真正关键的保护依然要靠 sandbox 和环境边界。

我对 auto mode 的理解是：它解决的是“开发体验”，不是替代安全隔离。

## 2026.04：Managed Agents 和质量复盘说明产品层也会影响能力

4 月两篇值得放在一起看：

- 2026.04.08：[Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- 2026.04.23：[An update on recent Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem)

Managed Agents 这篇讲的是把 agent 的几个部分拆开：

- brain：模型和推理。
- hands：执行环境、工具、文件系统。
- session：会话状态。
- event log：操作记录。
- sandbox：安全边界。

我理解这是一种更产品化的 agent 架构。早期我们把 agent 看成一个会话，但真正要规模化，就要拆成可恢复、可审计、可隔离的系统组件。

Claude Code 质量报告复盘则很现实。官方提到一些产品层变化会影响用户感知，比如 reasoning effort、thinking history、system prompt verbosity 等。

这说明 Claude Code 的效果不是模型一个变量决定的。即使模型没换，产品默认值、系统提示、上下文处理策略变了，用户也会感觉“变聪明”或“变笨”。

对使用者来说，最好的应对仍然是可复现任务和稳定验证。对团队来说，则是建立自己的回归任务集。

## 2026.05：containment 成为强 agent 的安全底座

本文整理到 2026.05.30，当前我核对到的最新相关官方文章是：

- 2026.05.25：[How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude)

这篇文章把 claude.ai、Claude Code、Claude Cowork 放在一起讲安全隔离。它的核心观点很直接：agent 越强，潜在 blast radius 越大，所以不能只盯着模型行为，还要限制它能接触到什么。

官方把风险大致分成几类：

- 用户误用或恶意使用。
- 模型自己走出预期路径。
- 外部攻击，比如 prompt injection、恶意文件、工具输出污染。

防御也分层：

- 行为层：提示、分类器、人工确认。
- 环境层：容器、VM、文件系统边界、网络 egress 控制、凭证隔离。

我觉得这篇对 Claude Code 用户特别重要。Claude Code 跑在本机，有 shell、文件系统和网络能力，这也是它强大的原因。但能力越大，越要注意边界。

我会把个人实践收敛成几条：

- 不要在真实主目录里随便开启危险权限。
- 高风险任务使用临时 worktree、devcontainer 或 sandbox。
- 密钥不要放在 agent 容易读取的位置。
- 部署、数据库迁移、删除、force push 这类操作保留人工确认。
- 外部仓库、陌生脚本、项目级配置要按不可信输入处理。

这篇也让我重新理解安全：不是让 Claude 永远正确，而是让它即使被诱导或犯错，也只能在有限范围内行动。

## 按技术方向再压缩一下

如果按时间看，Anthropic 这一年多的文章大概经历了几个阶段。

第一阶段是先解决“知识和任务如何进入模型”。代表文章是 Contextual Retrieval 和 Building effective agents。重点是检索上下文、workflow/agent 边界、简单优先和可验证反馈。

第二阶段是证明 coding agent 能做事。代表文章是 SWE-bench 和 Claude Code best practices。重点是模型能力、工具脚手架、代码编辑和测试闭环。

第三阶段是让 agent 做得更稳。代表文章是 think tool、tools for agents、context engineering。重点是工具接口、上下文管理、减少幻觉和减少错误行动。

第四阶段是让 agent 做得更久。代表文章是 MCP code execution、advanced tool use、long-running harness。重点是工具规模化、代码执行、外部状态、任务接力。

第五阶段是让 agent 做得更多。代表文章是 multi-agent research system、parallel Claudes building compiler、managed agents。重点是多 agent 协作、角色拆分、长周期执行。

第六阶段是让 agent 进入生产。代表文章是 evals、infrastructure noise、quality postmortem、auto mode、sandboxing、containment。重点是评测、复盘、安全边界和产品质量。

这条线串起来以后，我对 Claude Code 的关键词会从“AI 写代码”改成：

> 可验证的自治工程循环。

模型负责推理和行动，但工程系统要负责上下文、工具、验证、安全和复盘。

## 我现在会怎么用 Claude Code

结合这些官方文章，我会把自己的使用习惯整理成这份清单：

1. 先让 Claude 读代码、复述现状，再让它动手。
2. 每个任务都给验证方式，比如 test、build、lint、curl、浏览器检查。
3. 长任务不要靠聊天历史，使用 `SPEC.md`、`PROGRESS.md`、任务清单和 git commit。
4. 给检索到的代码和文档补背景，不要只给孤立片段。
5. 工具要少而清晰，返回结果要高信号，不要把底层噪音丢给模型。
6. 大量数据交给脚本处理，模型只看摘要和关键样本。
7. 复杂任务可以拆成 planner、implementer、reviewer 或 tester。
8. 多轮失败后整理已知信息并开新上下文，不要在坏上下文里硬拧。
9. 高风险操作用 sandbox、worktree、容器和 scoped token 降低影响范围。
10. 团队落地要维护自己的小型 eval，不要只看官方 benchmark。
11. 关注官方 postmortem，因为 Claude Code 的质量也受产品层和基础设施影响。

## 总结

回头看 2024.09 到 2026.05.30 这段官方文章，Claude Code 背后的技术演进并不是从“不会写代码”到“会写代码”这么简单。

更准确地说，它是从“如何把知识正确放进上下文”“如何设计有效 agent”开始，一步步走向一个 agentic engineering system。

这个系统里，模型只是核心之一。真正让它可用的是一整套工程设施：上下文管理、工具设计、MCP、长任务 harness、多 agent 协作、评测体系、权限控制、沙箱和 containment。

所以我原来那句“开发过程中如何减少大模型幻觉”，现在可以改得更准确一点：

> 幻觉不是只靠 prompt 减少的，而是通过上下文控制、工具接口、验证闭环和安全边界一起降低的。

这也是我读完这些官方文章后最大的收获：Claude Code 的价值不只是帮我们更快写代码，而是逼着我们重新设计“人、AI、工具、测试和安全边界”之间的协作方式。
