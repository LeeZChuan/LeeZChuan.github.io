---
title: ChatGPT 官方技术文章整理与解读
description: 按时间线梳理 OpenAI 从 2025.06 到 2026.06 之间关于 ChatGPT agent、GPT-5、GPT-5.5、Apps SDK、Atlas、Model Spec、prompt injection、安全、记忆、健康、金融和深度研究的官方技术分享
date: 2026-06-02
tags: [ChatGPT, OpenAI, ai, Agent, Apps SDK]
---


> ChatGPT 这一年到底在变什么？是模型更强了，还是产品正在变成一个能记住上下文、连接工具、主动行动、同时被安全边界约束的系统？

本文按时间顺序整理。官方入口在这里：

- [OpenAI News](https://openai.com/news/)
- [OpenAI Research](https://openai.com/research/)
- [ChatGPT Release Notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- [OpenAI Model Spec](https://model-spec.openai.com/)
- [OpenAI Developers](https://developers.openai.com/)

说明一下时间：本文整理范围从 `2025.06.02` 写到 `2026.06.02`。文中日期以各官方页面标注的发布日或文内 changelog 为准；部分能力（如 [Introducing deep research](https://openai.com/index/introducing-deep-research/)）会在同一篇文章顶部持续追加更新，而不是另发一篇。

我当前核对到的近期材料里，和 ChatGPT 模型与产品技术演进最相关的包括 [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)（2026.04.23）、[GPT-5.5 Instant](https://openai.com/index/gpt-5-5-instant/)（2026.05.05）和 [A new personal finance experience in ChatGPT](https://openai.com/index/personal-finance-chatgpt/)（2026.05.15）。

## 2025.06：连接器、项目和记忆让 ChatGPT 开始接近工作台

近一年可以从 6 月的 release notes 开始看：

- 2025.06.03：[ChatGPT Release Notes: memory expands to free users](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- 2025.06.04：[ChatGPT Release Notes: connectors and custom MCP connectors](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- 2025.06.10：[OpenAI o3-pro in ChatGPT](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- 2025.06.12：[Projects and Custom GPT model support](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- 背景材料：[Memory and new controls for ChatGPT](https://openai.com/index/memory-and-new-controls-for-chatgpt)

这些更新单看都不算惊天动地，但放在一起就很清楚：ChatGPT 不再只是一个临时对话框，而是在变成一个带上下文、文件、项目、工具和长期偏好的工作空间。

6 月比较关键的点有三个。

第一是 memory 向免费用户扩展（2025.06.03 起逐步 rollout）。免费档拿到的是**轻量版** memory：除用户主动保存的 memory 外，还可引用**近期对话**做短期连续性；Plus/Pro 则仍是更长期的理解与偏好记忆。用户可在 Settings > Personalization 里关闭 Memory 或「Reference chat history」。这背后是上下文工程：不是每次都从零开始，而是把已保存偏好、近期任务和当前问题连起来。

第二是 deep research 的 connectors 和自定义 MCP connector。官方在 release notes 中提到，deep research 可以接 Google Drive、SharePoint、Dropbox、Box、Outlook、Gmail、Google Calendar、Linear、GitHub、HubSpot、Teams 等数据源，也可以通过 Model Context Protocol 接入自定义系统。

第三是 Projects 加入 deep research、voice、项目内记忆和移动端文件能力。这意味着 ChatGPT 的工作单位开始从“单个聊天”变成“一个持续项目”。

我理解这一阶段的重点是：

- 记忆解决“我是谁、我偏好什么、我之前做过什么”。
- 项目解决“这件事属于哪个上下文”。
- 连接器解决“我的真实资料在哪里”。
- MCP 解决“外部系统怎么标准化接入”。

这和 coding agent 里的 `CLAUDE.md`、项目说明、工具配置很像。不同的是，ChatGPT 面向更广泛用户，所以它要把这些工程能力包装成更低门槛的产品入口。

## 2025.07：ChatGPT agent 把 deep research 和 Operator 合在一起

7 月最重要的是 ChatGPT agent：

- 2025.07.17：[Introducing ChatGPT agent: bridging research and action](https://openai.com/index/introducing-chatgpt-agent/)
- 2025.07.17：[ChatGPT agent System Card](https://openai.com/index/chatgpt-agent-system-card/)
- 2025.07.29：[Introducing study mode](https://openai.com/index/chatgpt-study-mode/)
- 背景材料：[Introducing deep research](https://openai.com/index/introducing-deep-research/)

ChatGPT agent 的定位很直接：把 deep research 的多步研究能力、Operator 的可视浏览器操作能力、受限 terminal、文件分析、表格和幻灯片生成、外部应用连接合在一个 agentic model 里。

这件事的意义不只是“ChatGPT 可以帮你点网页”。更关键的是，ChatGPT 开始拥有一组可组合的行动工具：

- 浏览网页。
- 搜索和读取资料。
- 分析上传文件。
- 运行代码和处理数据。
- 编辑电子表格。
- 连接第三方数据源。
- 在需要时请求用户确认。

这就从问答进入了 agentic workflow。

但 System Card 同时说明了另一面：工具越多，风险越高。官方在 Preparedness Framework 下把 ChatGPT agent 按 **High Biological and Chemical（生物与化学）能力** 对待，并启用对应护栏——不是说它已能直接帮新手制造严重危害，而是当模型具备研究、浏览、代码执行和外部数据访问时，产品不能只靠“模型自己别乱来”。

我会把 ChatGPT agent 理解成这一年 ChatGPT 技术路线的拐点：

> ChatGPT 从“回答问题的模型”变成了“带工具、带环境、带安全策略的行动系统”。

同月发布的 study mode 则是另一个方向。它不是让模型更主动完成任务，而是让模型更克制。官方说 study mode 当前由自定义系统指令驱动，目标是通过苏格拉底式提问、认知负荷控制、自我反思和知识检查来帮助学习。

这很有意思。ChatGPT agent 代表“替你做事”，study mode 代表“陪你理解”。两者看似相反，其实都说明 ChatGPT 的关键不只是模型能力，而是不同任务模式下的行为设计。

## 2025.08：GPT-5 把模型选择变成实时路由问题

8 月的核心是 GPT-5：

- 2025.08.07：[Introducing GPT-5](https://openai.com/index/introducing-gpt-5/)
- 2025.08.07：[GPT-5 and the new era of work](https://openai.com/index/gpt-5-new-era-of-work/)
- 2025.08.12：[ChatGPT Release Notes: GPT-5 updates](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)

GPT-5 不是简单多一个模型名称。官方强调它是一个 unified system：普通问题走快速模型，困难问题走 thinking 模型，中间由实时 router 根据对话类型、复杂度、工具需求和用户意图决定。

这对 ChatGPT 产品很关键。以前用户需要自己在模型列表里做选择：

- 这个问题要不要用推理模型？
- 要不要牺牲速度换准确性？
- 需要工具吗？
- 达到用量限制后怎么办？

GPT-5 之后，ChatGPT 开始把一部分选择藏到系统里，让用户体验更像“一个 ChatGPT”，而不是“一堆模型”。这其实是产品层的技术抽象：用户不一定关心模型编排，但系统必须在背后完成编排。

我觉得 GPT-5 的几个关键词是：

- router：什么时候快答，什么时候深想。
- tool needs：是否需要调用工具。
- instruction following：更稳定地遵循用户偏好和自定义指令。
- hallucination reduction：减少真实任务里的错误。
- sycophancy reduction：减少过度迎合。

放到工程实践里，这说明“模型能力”越来越像一个系统变量，而不是单个 checkpoint 的能力。一个 ChatGPT 回答的质量，取决于：

- 当前模型族。
- 路由策略。
- 是否启用搜索、文件、代码、应用。
- 用户记忆和项目上下文。
- 安全分类器和产品层拦截。
- 默认语气和人格设置。

这也是为什么用户感觉“ChatGPT 变了”时，原因不一定只是模型换了。路由、上下文、工具、系统指令和产品策略都可能影响最终体验。

## 2025.09：Model Spec 和使用研究把“行为”摆到台面上

9 月有两类文章值得放在一起看：

- 2025.09.12：[OpenAI Model Spec](https://model-spec.openai.com/2025-09-12.html)
- 2025.09.15：[How people are using ChatGPT](https://openai.com/index/how-people-are-using-chatgpt/)
- 2025.09.25：[Introducing ChatGPT Pulse](https://openai.com/index/introducing-chatgpt-pulse/)

Model Spec 是 OpenAI 对“模型应该如何行为”的公开说明。它讨论的是目标、权衡、指令层级、用户和开发者的关系、工具输出、未受信任数据、自治行动边界等问题。

我认为它是理解 ChatGPT 的基础文档之一，因为 ChatGPT 的复杂度已经超过“给一个 prompt，生成一段回答”。当模型面对这些输入时，会有天然冲突：

- 系统安全规则。
- 开发者设定。
- 用户请求。
- 工具返回内容。
- 网页、邮件、文档里的不可信文本。
- 用户长期记忆。

Model Spec 的核心价值是把这些冲突显式化。尤其是 chain of command，它告诉模型不同来源的指令谁优先。到了 agent 和 Atlas 这种场景，这个问题会变成安全核心：网页里的文字不能随便覆盖用户目标，工具输出也不能随便变成新的最高指令。

同月的 [How people are using ChatGPT](https://openai.com/index/how-people-are-using-chatgpt/) 则从使用数据看 ChatGPT。官方基于隐私保护的自动分析研究了 150 万段对话，提到截至 2025 年中 ChatGPT 每周活跃用户达到 7 亿，并把使用分成 Asking、Doing、Expressing 三类。

这个研究给我的启发是：ChatGPT 的大多数价值不只来自“完成任务”，还来自 decision support。很多用户不是让它直接生成最终产物，而是在问：

- 我该怎么理解这个问题？
- 有哪些路径可以选？
- 这个方案有什么风险？
- 我下一步应该做什么？

所以 ChatGPT 的产品形态会自然向“持续助手”演进，而不是停在“生成器”。

Pulse 就是这个方向的尝试。它把 ChatGPT 从被动问答推向主动建议：根据聊天、记忆、反馈和连接应用，在第二天给用户一组个性化更新。这个产品听起来很生活化，但技术含义很强：ChatGPT 开始做异步研究、主题筛选、个性化排序和安全过滤。

我会把 9 月总结成一句话：

> ChatGPT 不只在学习怎么回答，也在学习什么时候该主动、什么时候该克制、哪些上下文可信、哪些指令不能听。

## 2025.10：Apps SDK 和 Atlas 让 ChatGPT 进入应用和浏览器

10 月是生态和浏览器的月份：

- 2025.10.06：[Introducing apps in ChatGPT and the new Apps SDK](https://openai.com/index/introducing-apps-in-chatgpt/)
- 2025.10.21：[Introducing ChatGPT Atlas](https://openai.com/index/introducing-chatgpt-atlas/)
- 2025.10.27：[Strengthening ChatGPT's responses in sensitive conversations](https://openai.com/index/strengthening-chatgpt-responses-in-sensitive-conversations/)

Apps SDK 的价值在于：第三方应用不只是“被 ChatGPT 调用的 API”，而是可以把交互界面放进 ChatGPT 对话里。官方说明 Apps SDK 基于 MCP，扩展后让开发者同时定义应用逻辑和界面。

这说明 ChatGPT 的生态方向不是传统插件市场的简单复制。更像是：

- ChatGPT 负责自然语言入口和上下文理解。
- App 负责领域工具、业务数据和交互 UI。
- MCP 负责工具和数据连接标准。
- ChatGPT 对话本身变成应用运行环境的一部分。

这里有一个很实际的产品判断：很多任务不适合纯文本完成。订酒店、做设计、找房、听课、生成演示文稿，都需要地图、列表、播放器、画布、表单或预览。Apps SDK 的意义就是把“对话”和“界面”合起来。

Atlas 则更激进。它把 ChatGPT 放进浏览器，让 ChatGPT 能理解当前页面、结合浏览器记忆、并在 agent mode 下直接在用户浏览上下文里行动。

如果说 ChatGPT agent 在**虚拟计算机**里跑任务，Atlas 则更接近“ChatGPT 嵌在你的浏览器里工作”。这带来的能力很明显：

- 不用复制粘贴网页内容。
- 页面上下文可以直接进入对话。
- 浏览器记忆可以记录你访问过的主题。
- agent mode 可以在浏览器里打开标签、点击、填写、规划。

但风险也随之上升。浏览器里有登录态、邮件、支付、内部系统、云文档。agent 如果被网页或邮件里的恶意指令诱导，影响范围会比普通聊天大很多。

同月的敏感对话文章则说明 ChatGPT 在心理健康、自伤风险、情感依赖等场景中做了专门改进。官方提到和 170 多位心理健康专家合作，训练模型更好地识别 distress、降级风险并引导用户寻求现实支持。

把这三件事放在一起看，10 月的关键词是“场景化”：

- 应用场景需要 App 和 UI。
- 浏览场景需要页面上下文和浏览器记忆。
- 高风险对话需要专门的行为规范、评测和产品干预。

## 2025.11：GPT-5.1 和群聊说明 ChatGPT 也在调“相处方式”

11 月的文章更偏体验，但仍然有技术含义：

- 2025.11.12：[GPT-5.1: A smarter, more conversational ChatGPT](https://openai.com/index/gpt-5-1/)
- 2025.11.13：[Introducing group chats in ChatGPT](https://openai.com/index/group-chats-in-chatgpt/)

GPT-5.1 的重点不是单纯 benchmark，而是 communication style。官方把 GPT-5.1 Instant 描述为更温暖、更会对话、更能遵循指令；GPT-5.1 Thinking 则在简单任务上更快，在复杂任务上更持久。

这说明 ChatGPT 团队把“好用”拆成了两个维度：

- intelligence：会不会做。
- interaction quality：相处起来是否自然、清楚、可控。

这其实很重要。用户每天使用 ChatGPT 时，感知到的质量不只是答案对不对，还包括：

- 是否啰嗦。
- 是否过度迎合。
- 是否抓住重点。
- 是否能根据任务调整语气。
- 是否知道什么时候多想一会儿。
- 是否能在群体场景里保持边界。

群聊则把 ChatGPT 放进多人协作场景。官方强调群聊和个人私聊分开，个人 memory 不会共享，也不会从群聊创建新的个人记忆。这里的产品设计很值得注意：多人场景里的上下文不是简单合并。

如果把个人记忆直接带入群聊，会有隐私问题。如果群聊自动写入个人记忆，也会污染个人上下文。ChatGPT 团队选择把它隔离开，说明 memory 已经不只是“更个性化”的功能，而是一种需要权限、作用域和边界的状态系统。

## 2025.12：GPT-5.2、青少年保护和 Atlas 安全把边界继续加厚

12 月非常密集：

- 2025.12.11：[Introducing GPT-5.2](https://openai.com/index/introducing-gpt-5-2/)
- 2025.12.18：[Updating our Model Spec with teen protections](https://openai.com/index/updating-model-spec-with-teen-protections/)
- 2025.12.22：[Continuously hardening ChatGPT Atlas against prompt injection attacks](https://openai.com/index/hardening-atlas-against-prompt-injection/)

GPT-5.2 官方定位是面向 professional work 和 long-running agents。它强调长上下文理解、agentic tool-calling、视觉、复杂多步任务、电子表格、演示文稿、代码和专业知识工作。

我觉得 GPT-5.2 的重点是从“聊天模型”走向“工作模型”：

- 能处理更长材料。
- 能做更复杂的知识工作。
- 能更稳定地调用工具。
- 能生成更完整的工作产物。
- 能在 ChatGPT 里支持更深的 Thinking 和 Pro 模式。

它也继续把安全嵌进模型发布里。官方提到 GPT-5.2 延续 GPT-5 的 safe completion 思路，并在敏感对话、未成年人保护和年龄预测上继续投入。

Model Spec 的青少年保护更新，则把 U18 Principles 写进模型行为目标里。这个方向不只是内容过滤，而是在定义 teen 用户应该获得什么样的帮助：更强护栏、更安全替代方案、更鼓励现实世界支持。

Atlas prompt injection hardening 这篇是我认为最值得技术团队读的安全文章之一。它讲的是浏览器 agent 的开放难题：攻击者不一定攻击浏览器漏洞，而是把恶意指令写进网页、邮件、附件、共享文档，让 agent 在处理内容时偏离用户目标。

这类风险和传统安全不一样。传统浏览器主要防代码执行、跨站脚本、权限滥用；agent 浏览器还要防“文本里的恶意指令”。官方提到用自动化 red teaming 和强化学习持续寻找真实 agent exploit，然后用快速响应循环加固防御。

我对这篇的理解是：

> agent 越接近真实工作环境，prompt injection 就越像新一代社会工程攻击。

所以防御不能只靠一个模型判断。需要多层：

- 指令层级训练。
- 安全监控。
- URL 和数据外传保护。
- 敏感动作确认。
- 登录态控制。
- 企业策略。
- 用户可理解的风险提示。

## 2026.01：Health 把高敏感领域做成隔离空间

1 月最值得放进来的 ChatGPT 产品技术文章是：

- 2026.01.07：[Introducing ChatGPT Health](https://openai.com/index/introducing-chatgpt-health/)

Health 的思路不是让普通 ChatGPT 顺手回答健康问题，而是把健康做成一个独立空间。官方说明 Health 有单独加密与隔离、健康对话不用于训练 foundation models、健康文件和连接应用与普通聊天分开；Health 有**独立 memory**，且健康信息**不会回流**到普通聊天。必要时，普通聊天里的非健康上下文（例如你刚搬家）可被用于让 Health 对话更相关，但反向不行。

这和群聊的 memory 隔离很像，但敏感度更高。健康信息不能和普通聊天随便混在一起，因为它涉及：

- 医疗记录。
- 健康应用数据。
- 长期症状和习惯。
- 高风险建议。
- 隐私和合规预期。

我觉得 Health 的工程启发是：不是所有上下文都应该进入同一个 memory 系统。

不同领域需要不同作用域：

- 普通偏好可以跨聊天。
- 项目资料应该留在项目里。
- 群聊上下文不应泄露给个人记忆。
- 健康和金融这类敏感数据应该在专用空间里处理。

这其实是 ChatGPT 产品架构的一个大方向：用“空间”给上下文分区，用权限和数据控制决定哪些信息可以被模型看到。

## 2026.02：deep research 升级和 Lockdown Mode 说明安全成为功能的一部分

2 月有两条关键更新：

- 2026.02.10：[Introducing deep research](https://openai.com/index/introducing-deep-research/) 文内 **February 10, 2026 update**（非独立新文）
- 2026.02.13：[Introducing Lockdown Mode and Elevated Risk labels in ChatGPT](https://openai.com/index/introducing-lockdown-mode-and-elevated-risk-labels-in-chatgpt/)

deep research 首发于 2025.02.02；2026.02.10 在原文顶部追加的更新很关键：引擎切到 **GPT-5.2**，可连接任意 MCP 或 app、把 web search 限制在可信站点、实时查看进度，并可在中途打断后补充来源或 follow-up prompt。

这说明 deep research 从“自动生成一份长报告”变成更可控的研究 harness：

- 数据源可指定。
- 可信站点可限制。
- 过程可观察。
- 中途可干预。
- 结果仍然需要引用和审查。

这对真实工作很重要。研究任务最怕的不是模型不努力，而是它在不可靠来源上努力，最后产出一份看起来很完整但来源质量不够的报告。

Lockdown Mode 和 Elevated Risk labels 则说明安全开始成为 ChatGPT 的显式产品能力。Lockdown Mode 面向极少数高敏感用户（如高管、安全团队），通过**确定性**限制浏览、部分工具与外部交互来降低 prompt injection 导致的数据外传风险；首发面向 **Enterprise、Edu、Healthcare、Teachers** 等工作区，由管理员按角色开启，消费者版计划后续开放。Elevated Risk labels 则把部分网络相关能力的风险提示标准化，覆盖 ChatGPT、Atlas 和 Codex。

我觉得这个方向很务实。随着 ChatGPT 能看网页、连应用、用工具、访问文件，安全不能只隐藏在后台。用户和组织需要知道：

- 哪些功能风险更高。
- 哪些能力会连接外部系统。
- 什么时候应该少给权限。
- 什么时候应该关闭高风险工具。
- 企业管理员如何制定策略。

安全提示不是产品摩擦，而是 agent 产品的一部分。

## 2026.03：Instruction Hierarchy 把 prompt injection 防御往模型训练里推

3 月的文章和前面的 Atlas 安全直接相连：

- 2026.03.10：[Improving instruction hierarchy in frontier LLMs](https://openai.com/index/instruction-hierarchy-challenge/)

这篇介绍 IH-Challenge，用来训练模型更稳定地区分不同来源指令的可信度。官方说，模型会同时收到系统消息、开发者目标、用户请求、网页内容、工具输出等输入。安全问题常常出在模型把不可信内容当成了更高优先级指令。

在普通聊天里，这可能只是答错。在 agent 场景里，这会变成真实风险：

- 网页要求模型忽略用户目标。
- 邮件诱导模型转发敏感信息。
- 工具输出伪装成系统指令。
- 文档要求模型泄露上下文。

Instruction hierarchy 的意义是把“谁说的话算数”训练进模型行为里。它不是全部防线，但它是底层能力。如果模型不能识别指令来源和权限层级，产品层再多确认弹窗也很难稳。

我会把它和 Model Spec、Atlas hardening、Lockdown Mode 放在同一条线上：

- Model Spec 定义行为原则。
- Instruction hierarchy 训练模型遵守指令层级。
- Atlas hardening 发现真实攻击路径。
- Lockdown Mode 和风险标签给用户和组织控制面。

这就是 ChatGPT agent 安全的系统化过程。

## 2026.04–05：GPT-5.5 与默认 Instant 升级

4–5 月是模型层非常关键的两步：

- 2026.04.23：[Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)（Thinking 等深推理能力）
- 2026.05.05：[GPT-5.5 Instant: smarter, clearer, and more personalized](https://openai.com/index/gpt-5-5-instant/)（替换 GPT-5.3 Instant 成为全员默认）

[GPT-5.5](https://openai.com/index/introducing-gpt-5-5/) 延续了 GPT-5.2 面向专业知识工作与长任务的方向。Help Center 也说明 ChatGPT 仍是 **Instant / Thinking 自动切换** 的统一体验：复杂问题可从 Instant 切到 Thinking。2026.02.13 起，旧版 GPT-5（Instant/Thinking）已退役，历史对话会跑在 GPT-5.5 等价能力上。

这里我关注的不是模型名字本身，而是它对 ChatGPT 产品形态的影响。模型越能处理复杂材料，ChatGPT 越容易承接这些任务：

- 长文档分析。
- 多步骤研究。
- 代码和数据处理。
- 高质量写作和改写。
- 多模态输入理解。
- 需要持续推理的专业工作。

[GPT-5.5 Instant](https://openai.com/index/gpt-5-5-instant/) 则说明另一条线：默认交互不能只追求最强推理，也要追求响应速度、对话感、事实性和个性化（含 memory sources、past chats、Gmail 等，按地区与套餐逐步开放）。模型层继续拆成 **Instant（日常默认）** 与 **Thinking/Pro（深推理）**，由系统在背后路由，而不是让用户每次手动选一堆模型名。

## 2026.05：金融空间说明 ChatGPT 正在进入高上下文、高敏感任务

5 月的 personal finance 是非常值得关注的产品技术文章：

- 2026.05.15：[A new personal finance experience in ChatGPT](https://openai.com/index/personal-finance-chatgpt/)
- 2026.05.05：[New ways to buy ChatGPT ads](https://openai.com/index/new-ways-to-buy-chatgpt-ads/)

个人金融体验的重点不是“ChatGPT 会给理财建议”。官方明确说它不是专业金融建议替代品，目前以 **美国 Pro 用户 preview** 形式 rollout（通过侧边栏 Finances 或 `@Finances` 入口，账户连接走 Plaid）。更重要的是它展示了 ChatGPT 如何处理高上下文、高敏感、强个性化的任务。

这个体验允许用户连接金融账户，ChatGPT 可以访问余额、交易、投资和负债，用来生成仪表盘和回答问题。但它不能看到完整账号，也不能更改账户。用户可以断开连接，断开后同步账户数据会在 **30 天内** 从 OpenAI 系统删除；同时还有 **Financial memories**（专用于金融对话的记忆，可在 Finances 页面管理）。金融对话的训练策略遵循你在 ChatGPT 全局 Data controls 中的设置，而不是与 Health 一样默认完全排除 foundation model 训练。

这和 Health 非常像：

- 都是专门空间。
- 都处理敏感数据。
- 都需要独立记忆。
- 都要求明确数据控制。
- 都强调不是专业服务替代品。
- 都需要专家评测和质量基准。

官方还提到 personal finance 默认使用 GPT-5.5 Thinking，并建立内部 benchmark，让 50 多位金融专业人士评估复杂个人金融任务的响应质量。

这给我的启发是：未来 ChatGPT 的能力扩展不会只是“接更多 app”。真正困难的是每个高价值领域都要有自己的上下文、权限、记忆、评测和免责声明。

广告文章也值得顺手提一下。它不是技术模型文章，但说明 ChatGPT 商业化会继续强调广告和回答分离、广告主不能看到聊天或个人详情、只获得聚合表现信息。对于一个以对话为入口的产品来说，这类边界设计会直接影响用户信任。

## 按技术方向再压缩一下

如果按主题压缩（这些阶段在时间上会有重叠，安全与合规几乎贯穿全年），OpenAI 这一年关于 ChatGPT 的技术分享大概经历了几个方向：

第一阶段是把上下文接进来。代表是 memory、Projects、connectors、MCP。重点是让 ChatGPT 不再从零开始回答，而是能引用用户偏好、项目资料和外部系统。

第二阶段是把行动能力合起来。代表是 ChatGPT agent。重点是把 deep research、Operator、terminal、文件、表格、应用连接和用户确认组合成一个 agentic system。

第三阶段是把模型选择抽象掉。代表是 GPT-5、GPT-5.1、GPT-5.2、GPT-5.5。重点是统一系统、实时路由、adaptive reasoning、Thinking/Pro/Instant 模式和更强的专业工作能力。

第四阶段是把 ChatGPT 变成应用平台。代表是 Apps SDK 和 Atlas。重点是 ChatGPT 不只是对话入口，还可以承载第三方 UI、工具逻辑和浏览器上下文。

第五阶段是把主动性做出来。代表是 2025.09 的 Pulse 与 2026.02 的 deep research 升级。重点是异步研究、主动推荐、可信来源、可观察进度和中途干预。

第六阶段是把敏感领域隔离出来。代表是 Health 和 personal finance。重点是专用空间、独立记忆、数据控制、专家评测和领域边界。

第七阶段是把安全系统化。代表是 Model Spec、Instruction Hierarchy、Atlas prompt injection hardening、Lockdown Mode、Elevated Risk labels、青少年保护和敏感对话更新。重点是指令层级、未受信任数据、prompt injection、防数据外传、用户控制和高风险人群保护。

这条线串起来以后，我对 ChatGPT 这一年的关键词会从“更聪明的聊天机器人”改成：

> 带记忆、工具、应用、浏览器、领域空间和安全边界的个人智能系统。

## 我现在会怎么理解 ChatGPT 的使用方式

结合这些官方文章，我会把使用 ChatGPT 的习惯整理成这份清单：

1. 普通问题可以直接问，但复杂工作应该放进项目或专用空间。
2. 需要长期连续性的任务，要让 ChatGPT 有明确上下文，而不是每次重新解释。
3. deep research 这类任务要控制来源，尤其是行业、法律、金融、学术场景。
4. 连接 app 或 MCP 时，要先想清楚 ChatGPT 需要哪些数据，不需要的不要授权。
5. agent mode 适合可验证的多步任务，不适合无边界地“随便帮我处理所有事情”。
6. Atlas 里的 agent 要特别注意登录态、邮件、文档和支付网站。
7. 健康、金融、青少年和心理健康相关场景，要使用官方专门体验（注意地区与套餐限制）或更保守的边界。
8. 看到 Elevated Risk 或确认提示时，不要机械批准，要检查它是不是在做你真正想做的事。
9. 对重要结论保留人工复核，尤其是金融、医疗、法律、职业和安全决策。
10. 把 ChatGPT 当成能连接工具的工作伙伴，而不是永远可靠的自动执行器。

## 总结

回头看 2025.06 到 2026.06 这段官方文章，ChatGPT 的演进不是简单从 GPT-4o 到 GPT-5.5，也不是多了几个功能按钮。

更准确地说，它在从一个通用聊天产品，变成一个有状态、有工具、有生态、有浏览器、有专用空间、有安全策略的 agentic product。

模型仍然是核心，但真正让 ChatGPT 可用的是一整套系统：

- 记忆和上下文。
- 项目和空间。
- MCP 和 Apps SDK。
- deep research 和 agent。
- Atlas 浏览器上下文。
- GPT-5 系列的实时路由和 adaptive reasoning。
- Model Spec 和 instruction hierarchy。
- prompt injection 防御。
- Lockdown Mode、风险标签和企业控制。
- Health、Finance 这种领域隔离。

所以我现在看 ChatGPT 团队这一年的技术分享，最大的感受是：他们不是只在训练一个更会说话的模型，而是在搭一个能进入真实生活和真实工作的系统。

这个系统越有用，就越需要边界。越能记住你，就越需要作用域。越能替你行动，就越需要确认和审计。越能连接外部世界，就越需要识别不可信指令。

最终问题不再是“ChatGPT 能不能回答我”，而是：

> ChatGPT 能不能在正确的上下文里，用正确的工具，按正确的边界，完成正确的事情。

这也是我读完这些官方文章后最明确的结论：ChatGPT 的下一阶段，不是单纯拼模型智商，而是拼模型、产品、工具、数据、安全和用户控制之间的协同。
