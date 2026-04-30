---
title: NotebookLM、Codex 与 Cursor 的研究整理工作流
description: 从官方文档和社区实践出发，整理 NotebookLM 如何配合 Codex、Cursor 完成资料研究、文章写作和本地项目更新
date: 2026-04-30
tags: [NotebookLM, Codex, Cursor, AI工具, 信息整理]
---

最近看到一篇 Substack 文章：[Claude Code + NotebookLM + Obsidian: The Research Stack Nobody's Using](https://substack.com/home/post/p-189067354)。文章标题很直接：把 Claude Code、NotebookLM 和 Obsidian 组合成一套研究工作流。

我这次没有照搬 Obsidian 这条线，而是按自己的博客和代码仓库习惯重新整理了一版：

- 用 NotebookLM 做资料阅读、归纳和展示；
- 用 Codex 把研究结果落到本地仓库；
- 用 Cursor 做人工参与更强的编辑、润色和局部修改。

这篇文章不是 NotebookLM 百科，也不是“AI 工具清单”。更准确地说，它是我查官方文档、看最近半年社区讨论之后，对这套工作流的一次整理和实践设计。

## 我的结论

先说结论。

NotebookLM 不应该被理解成“另一个 ChatGPT”。它更像一个资料研究台：你把 PDF、网页、YouTube、Markdown、Google Docs 放进去，它围绕这些资料回答问题，并尽量给出引用依据。

Codex 和 Cursor 也不是 NotebookLM 的替代品。它们更适合处理本地项目：

- 读取仓库文件；
- 修改 Markdown 或代码；
- 执行命令；
- 检查 diff；
- 做 review。

所以我认为比较合理的分工是：

```text
NotebookLM：理解资料、提炼结论、生成展示材料
Codex：把结论写进本地项目，并做构建和 review
Cursor：人工参与式编辑，适合边看上下文边改文章
```

这套流程的核心不是全自动，而是把“资料研究”和“项目落地”分开。

## 为什么我会关注 NotebookLM

以前写技术文章，我经常用 ChatGPT 或 Claude 做辅助。但这类通用聊天工具有一个问题：资料一多，就要不断复制粘贴，而且模型回答时不一定清楚告诉你依据来自哪里。

NotebookLM 的价值在于，它让资料先进入一个 notebook。之后你提问时，回答会围绕这些 sources 展开。

这里有几个基础概念：

| 概念 | 我的理解 |
| --- | --- |
| Notebook | 一个研究主题，例如“NotebookLM + Codex + Cursor 工作流” |
| Source | 放进 notebook 的资料，例如官方文档、网页、PDF、Markdown |
| Citation | 回答中的引用依据，用来追溯结论来自哪份 source |
| Studio | NotebookLM 里生成报告、思维导图、音频、视频、幻灯片等内容的区域 |

对不熟悉 LLM 的人来说，可以先把 NotebookLM 想成一个“带 AI 的资料文件夹”。区别是它不仅能存资料，还能帮你问答、总结和生成结构化输出。

## 最近半年我看到的变化

我重新查了一遍官方资料和社区讨论，NotebookLM 这半年比较明显的变化有三点。

### Deep Research 开始进入 NotebookLM

Google 在 2025 年 11 月发布 NotebookLM Deep Research。官方描述里，它可以根据你的问题制定研究计划、浏览大量网页、整理成带来源的报告，并把报告和 sources 加入 notebook。

这点很关键。以前 NotebookLM 更像“读你给它的资料”，现在它开始接近“先帮你找资料，再帮你整理资料”。

适合的用法不是直接问：

```text
帮我总结 NotebookLM。
```

而是这样问：

```text
请研究最近半年 NotebookLM 与 AI coding agent 的结合方式。
要求：
1. 优先查官方文档、工程博客和高质量技术讨论
2. 区分官方能力、第三方工具和个人经验
3. 输出适合写中文技术博客的结构
4. 每条结论附上来源
```

### 社区开始重视结构化提问

最近 NotebookLM 社区里有一个很常见的提醒：不要只问“帮我总结这些资料”。这种问法往往会得到很浅的摘要。

我更推荐先让 NotebookLM 建一个主题索引：

```text
请只基于当前 sources，列出这批资料覆盖的主要主题。
要求：
1. 每个主题用一句话解释
2. 合并重复主题
3. 标出哪些主题适合展开成博客小节
4. 不要引入 sources 之外的信息
```

然后再追问某个主题：

```text
请展开“NotebookLM 和 coding agent 如何协作”这个主题。
目标读者：没有使用过 NotebookLM，也不了解 LLM。
要求：
1. 先解释概念
2. 再给具体步骤
3. 命令放进 bash 代码块
4. 区分官方功能和第三方非官方方案
```

这类提问方式比“总结一下”更适合写文章，因为它能先得到结构，再逐段补充内容。

### MCP 和自动化很热，但不适合第一步

最近不少技术帖子在讨论 NotebookLM MCP、Claude Code/Cursor 直连 NotebookLM、浏览器自动化批量上传资料。

我查完后的判断是：这些方向有价值，但不适合作为新手第一步。

原因很简单：

- 个人版 NotebookLM 主要是网页产品，并不是一个可以直接拿 API key 调用的消费级 API；
- NotebookLM Enterprise API 已经出现在 Google Cloud 文档里，但它面向企业和 Cloud 场景，而且文档标注为 Pre-GA；
- 第三方 MCP/CLI 往往依赖浏览器会话、cookie 或页面结构，稳定性和安全性都需要自己承担。

所以我现在更倾向于先用“文件流”：

```text
本地资料 -> NotebookLM 研究 -> 导出/复制结果 -> Codex/Cursor 写回本地项目
```

等这个流程稳定之后，再考虑 MCP 或 API 自动化。

## 安装和会员选择

### NotebookLM

NotebookLM 不需要安装桌面软件，直接访问：

```text
https://notebooklm.google.com/
```

需要 Google 账号。如果使用的是 Workspace 账号，还要看组织管理员是否开启 NotebookLM。中国大陆访问情况也会受到网络和地区可用性的影响。

官方额度会变，下面是我在 2026-04-30 查阅官方帮助页时整理的信息：

| 版本 | 更适合谁 | 关键额度 |
| --- | --- | --- |
| Standard | 个人轻量使用 | 100 个 notebooks、每个 50 个 sources、每天 50 次 chat |
| Google AI Plus | 入门付费用户 | 200 个 notebooks、每个 100 个 sources、每天 200 次 chat |
| Google AI Pro | 高频研究和写作 | 500 个 notebooks、每个 300 个 sources、每天 500 次 chat |
| Google AI Ultra | 重度生成展示材料 | 500 个 notebooks、每个 600 个 sources、每天 5K 次 chat |
| Google Cloud / Workspace | 公司、学校、企业资料 | 更强调权限、数据保护、审计和企业合规 |

如果只是个人博客写作，我会先从 Standard 或 Google AI Pro 开始。只有当一个主题需要大量 sources，或者频繁生成 audio overview、video overview、slide deck、infographic 时，再考虑更高版本。

### Codex

Codex 是 OpenAI 的 coding agent。OpenAI 官方帮助页说明，Codex 包含在 ChatGPT Plus、Pro、Business、Enterprise/Edu 计划中；Free 和 Go 计划可能有阶段性额度，具体以账号页面为准。

安装：

```bash
# npm 安装
npm install -g @openai/codex

# macOS 也可以用 Homebrew
brew install --cask codex

# 登录
codex login

# 进入项目
cd /path/to/your/repo
codex
```

我在这个博客仓库里更常用的是非交互模式：

```bash
codex exec -C . "读取某个 Markdown 文件，按当前博客格式修改文章"
```

以及 review：

```bash
codex review --uncommitted "检查事实、命令、链接和文章结构"
```

### Cursor

Cursor 桌面端从官网下载安装：

```text
https://cursor.com/
```

Cursor Agent CLI 安装：

```bash
curl https://cursor.com/install -fsS | bash

# 如果 zsh 找不到 cursor-agent，把本地 bin 加到 PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

cursor-agent --version
cursor-agent login
```

Cursor 官方价格页当前显示：

| 版本 | 更适合谁 |
| --- | --- |
| Hobby | 免费试用，少量 Agent 和 Tab 使用 |
| Pro | 日常个人开发，官方价格页显示 $20/月 |
| Pro+ | 更高模型用量，官方价格页显示 $60/月 |
| Ultra | 高频 Agent 用户，官方价格页显示 $200/月 |
| Teams / Enterprise | 团队账单、权限、隐私模式、SSO、审计 |

我的使用习惯是：大段自动修改交给 Codex，编辑器内的局部重写和人工判断交给 Cursor。

## NotebookLM 的实际使用方式

### 第一步：一个主题一个 notebook

我不建议把所有资料都放进一个 notebook。NotebookLM 的回答依赖当前 notebook 的 sources，主题越混杂，回答越容易变浅。

例如这篇文章对应的 notebook 可以叫：

```text
NotebookLM + Codex + Cursor 工作流
```

里面只放和这个主题有关的资料：

- NotebookLM 官方帮助页；
- Google Cloud NotebookLM Enterprise API 文档；
- OpenAI Codex 文档；
- Cursor CLI 和 pricing 页面；
- Substack 原文链接；
- 最近半年社区讨论；
- 自己从博客仓库里导出的文章风格说明。

### 第二步：先放官方资料，再放社区讨论

NotebookLM 支持多种 sources，包括：

- PDF；
- Markdown；
- 文本；
- Google Docs；
- Google Slides；
- Google Sheets；
- 网站 URL；
- YouTube 视频；
- 音频文件；
- 图片；
- Microsoft Word 等文档。

我的顺序是：

1. 先加官方文档，因为安装命令、会员额度、API 状态必须以官方为准。
2. 再加社区帖子，用来观察真实使用方式和近期热点。
3. 最后加自己的项目资料，让 NotebookLM 知道文章最终要写成什么风格。

这里有一个重要边界：NotebookLM 导入资料后，不等于本地文件会自动同步。官方文档也提醒，导出到 Docs 或 Sheets 后再修改，不会同步回 NotebookLM。

所以长期资料最好仍然保存在 Git 或 Google Drive 里，NotebookLM 只是研究层。

### 第三步：不要从“总结”开始

我现在更倾向于这样问：

```text
请只基于当前 sources，整理这批资料里最值得写进技术博客的 8 个主题。
每个主题包含：
1. 一句话说明
2. 对新手读者的价值
3. 需要引用的 source
4. 是否适合展开为独立章节
```

得到主题后，再让它生成文章结构：

```text
请把上面的主题整理成一篇中文技术博客大纲。
要求：
1. 读者是不熟悉 LLM 和 NotebookLM 的开发者
2. 先解释概念，再进入命令
3. 不要写成 FAQ
4. 文章要像个人实践复盘，而不是产品说明书
```

这一步很关键。NotebookLM 生成的内容很容易变成“问答式说明”，所以 prompt 里要提前告诉它不要写成 FAQ。

### 第四步：生成展示材料

NotebookLM 的 Studio 可以生成：

- Notes；
- Audio Overviews；
- Video Overviews；
- Mind maps；
- Reports；
- Data Tables；
- Flashcards / Quizzes；
- Slide Decks；
- Infographics。

对博客写作来说，我会按这个顺序用：

1. 先生成 briefing document；
2. 再生成 mind map 看结构；
3. 对关键问题继续追问；
4. 把稳定答案保存成 note；
5. 需要分享时再生成 slide deck 或 infographic。

也就是说，我不会直接把 NotebookLM 的报告当最终稿。它更适合做“研究底稿”。

## Codex 在这套流程里的位置

NotebookLM 负责研究，Codex 负责落地。

比如这个博客仓库的 AI 文章都在：

```text
src/content/blog/tech/ai/
```

我会先建一个研究目录：

```bash
mkdir -p research/notebooklm/sources
mkdir -p research/notebooklm/outputs
mkdir -p research/notebooklm/prompts
```

这个目录不一定要提交到 Git，它只是中间资料。

### 生成给 NotebookLM 上传的本地资料包

先让 Codex 读已有文章，整理出写作风格：

```bash
codex exec -C . -o research/notebooklm/sources/blog-style.md "请阅读 src/content/blog/tech/ai 下已有文章，整理这些文章的 frontmatter、标题层级、写作语气、常见结构，输出成给 NotebookLM 使用的 Markdown 资料包。不要修改文件。"
```

再生成研究问题：

```bash
codex exec -C . -o research/notebooklm/sources/research-questions.md "请为 NotebookLM + Codex + Cursor 这个主题生成研究问题。要求覆盖基础概念、安装、会员、官方 API、第三方 MCP、具体命令、风险和最佳实践。"
```

然后把这两个 Markdown 上传到 NotebookLM。这样 NotebookLM 不只知道外部资料，也知道这篇文章应该写成当前博客的风格。

### 把 NotebookLM 输出写回文章

假设从 NotebookLM 复制出的报告放在：

```text
research/notebooklm/outputs/notebooklm-report.md
```

可以让 Codex 写入正式文章：

```bash
codex exec -C . "读取 research/notebooklm/outputs/notebooklm-report.md，更新 src/content/blog/tech/ai/notebooklm-codex-cursor-workflow.md。要求：写成个人技术实践复盘，不要写成 AI 问答话术；保留 frontmatter；所有命令放进 bash 代码块；区分官方 API 和第三方工具。"
```

改完后检查：

```bash
git diff -- src/content/blog/tech/ai/notebooklm-codex-cursor-workflow.md
npm run build
codex review --uncommitted "检查文章是否存在事实错误、命令错误、链接错误，以及是否仍然像 AI 问答话术。"
```

这里的 `codex review` 很适合做第二遍检查，尤其是看命令是否可复制、引用是否合理、文章有没有明显跳跃。

## Cursor 在这套流程里的位置

Cursor 更适合人工编辑，而不是完全自动生成。

我会在这些场景用 Cursor：

- 选中一段 NotebookLM 输出，让它改成自己的博客语气；
- 对某一节做局部重写；
- 检查一段命令前后的解释是否清楚；
- 调整标题层级；
- 删除像 AI 生成内容的重复句式。

打开项目：

```bash
cursor .
```

在 Cursor 里可以这样引用文件：

```text
@research/notebooklm/outputs/notebooklm-report.md
@src/content/blog/tech/ai/notebooklm-codex-cursor-workflow.md

请只修改“NotebookLM 的实际使用方式”这一节。
要求：
1. 写成个人实践复盘
2. 删除像 FAQ 或客服说明的话术
3. 保留命令和官方边界
4. 不要修改 frontmatter
```

如果用 Cursor Agent CLI，可以先只让它给建议：

```bash
cursor-agent -p "读取 src/content/blog/tech/ai/notebooklm-codex-cursor-workflow.md，指出哪些段落像 AI 问答话术，并给出修改建议，不要直接改文件。" --output-format text
```

需要直接修改时，先看工作区状态：

```bash
git status --short
cursor-agent "请把 src/content/blog/tech/ai/notebooklm-codex-cursor-workflow.md 改成个人技术实践复盘风格，保留命令和来源链接。"
```

我更推荐在交互模式里确认它的修改，而不是一开始就让脚本模式强制写文件。

## 官方 API 的边界

这部分容易混淆，所以单独写清楚。

### 个人版 NotebookLM 不是普通 API 产品

对个人用户来说，NotebookLM 主要是网页产品。你可以上传资料、导入 URL、生成报告和展示材料，但它不是一个像 OpenAI API 那样直接拿 key 调用的消费级 API。

所以个人写作场景里，我不建议一上来就追求“全自动 API 化”。稳定方案仍然是：

```text
Codex/Cursor 整理资料包
        ↓
手动上传 NotebookLM
        ↓
NotebookLM 生成报告
        ↓
复制/导出到本地 Markdown
        ↓
Codex/Cursor 写回文章
```

### NotebookLM Enterprise API 面向企业场景

Google Cloud 文档已经提供 NotebookLM Enterprise API，可以做：

- 创建 notebook；
- 获取 notebook；
- 列出最近访问的 notebooks；
- 批量删除 notebook；
- 分享 notebook；
- 批量添加 sources；
- 上传文件 source；
- 获取或删除 source；
- 生成 audio overview。

但它属于 Google Cloud / Gemini Enterprise / NotebookLM Enterprise 场景，而且文档标注为 Pre-GA。对个人博客写作来说，这不是第一优先级。

示例：创建 notebook。

```bash
export PROJECT_NUMBER="你的 Google Cloud project number"
export LOCATION="global"
export ENDPOINT_LOCATION="global"
export NOTEBOOK_TITLE="NotebookLM Codex Cursor Workflow"

curl -X POST \
  -H "Authorization:Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://${ENDPOINT_LOCATION}-discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_NUMBER}/locations/${LOCATION}/notebooks" \
  -d "{
    \"title\": \"${NOTEBOOK_TITLE}\"
  }"
```

示例：上传 Markdown 文件作为 source。

```bash
export NOTEBOOK_ID="你的 notebook id"
export FILE_PATH="research/notebooklm/sources/blog-style.md"
export FILE_DISPLAY_NAME="blog-style.md"

curl -X POST --data-binary "@${FILE_PATH}" \
  -H "Authorization:Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-Upload-File-Name: ${FILE_DISPLAY_NAME}" \
  -H "X-Goog-Upload-Protocol: raw" \
  -H "Content-Type: text/markdown" \
  "https://${ENDPOINT_LOCATION}-discoveryengine.googleapis.com/upload/v1alpha/projects/${PROJECT_NUMBER}/locations/${LOCATION}/notebooks/${NOTEBOOK_ID}/sources:uploadFile"
```

如果 source 来自 Google Docs 或 Google Slides，还需要：

```bash
gcloud auth login --enable-gdrive-access
```

## 第三方 MCP 和自动化的取舍

社区里已经有人在做 NotebookLM MCP、Claude Code/Cursor 插件、浏览器自动化工具。这类工具的目标是减少手动上传和复制。

但我现在不会把它作为主流程，原因有四个：

| 风险 | 说明 |
| --- | --- |
| 稳定性 | 可能依赖页面结构、浏览器会话或第三方包 |
| 安全性 | Google 账号、cookie、公司资料都需要谨慎 |
| 维护成本 | NotebookLM 页面或权限变化后，工具可能失效 |
| 新手成本 | 还没理解 NotebookLM，就先调 MCP，排错会很困难 |

所以我的顺序是：

1. 先掌握手动文件流；
2. 再用 Codex/Cursor 固化本地 Markdown 输出；
3. 最后再研究 MCP 或 Enterprise API。

这个顺序看起来不够酷，但更稳定。

## 我会采用的完整流程

如果我要长期用这套方法写技术文章，我会这样做。

### 轻量写作流程

适合个人博客。

```bash
mkdir -p research/notebooklm/sources research/notebooklm/outputs

codex exec -C . -o research/notebooklm/sources/blog-style.md "梳理当前仓库 AI 博客文章结构和写作风格，输出给 NotebookLM 使用的资料包。不要修改文件。"
```

然后在 NotebookLM 里：

1. 新建 notebook；
2. 上传 `blog-style.md`；
3. 添加官方文档 URL；
4. 用 Deep Research 补充最近资料；
5. 生成 briefing document；
6. 复制到 `research/notebooklm/outputs/notebooklm-report.md`。

最后回到本地：

```bash
codex exec -C . "根据 research/notebooklm/outputs/notebooklm-report.md 写成一篇中文技术博客，放到 src/content/blog/tech/ai/。要求写成个人实践复盘，不要写成 FAQ。"
npm run build
```

### 长期资料库流程

适合持续维护某个主题。

```text
原始资料：Git / Google Drive / PDF / 网页
研究层：NotebookLM
归档层：research/notebooklm/outputs/*.md
发布层：src/content/blog/tech/ai/*.md
检查层：git diff + npm run build + codex review
```

检查命令：

```bash
git status --short
git diff -- src/content/blog/tech/ai/
npm run build
codex review --uncommitted "检查文章事实、命令、链接和表达是否像个人实践复盘。"
```

### 团队或企业资料流程

如果资料涉及公司内部知识库、客户资料或合规要求，我不会用个人账号加第三方自动化工具硬做。

更合理的是：

- 使用 Google Workspace 管理权限；
- 评估 Google Cloud / NotebookLM Enterprise；
- 明确数据处理政策；
- 避免把敏感资料交给第三方浏览器自动化工具。

## 写作上的取舍

整理这类工具文章时，很容易写成产品说明书：先解释概念，再列功能，再放命令，最后总结一句“建议使用”。信息是全的，但读起来没有实践感。

所以这篇文章我刻意避开几个写法：

1. 不把 NotebookLM 写成完整百科；
2. 不把 Codex 和 Cursor 写成命令清单；
3. 不把社区 MCP 玩法包装成成熟方案；
4. 不用“你应该这样做”的口吻替代实际判断；
5. 不把官方 API 和个人网页产品混在一起讲。

我更关心的是这几个问题：

- 为什么 NotebookLM 适合做研究层；
- 为什么 Codex/Cursor 更适合做落地层；
- 个人用户先跑通哪条最稳定的流程；
- 哪些自动化方案看起来很酷，但暂时不适合新手；
- 最后如何把研究结果变成可维护的本地文章。

这比简单罗列功能更接近我想要的技术博客。

## 结论

NotebookLM 对我来说不是写作替代品，而是研究层。它负责把资料变成可以追问、可以引用、可以展示的研究底稿。

Codex 和 Cursor 则负责把研究底稿变成真正可维护的项目内容：

- 写进 Markdown；
- 保留 frontmatter；
- 运行构建；
- 检查 diff；
- 做 review；
- 最终发布到博客。

如果刚开始接触 LLM 和 NotebookLM，我建议不要一上来研究 MCP 或 Enterprise API。先把最朴素的文件流跑通：

```text
资料 -> NotebookLM -> Markdown 输出 -> Codex/Cursor -> 本地文章
```

这个流程跑顺之后，再考虑自动化，才不会被工具本身拖住。

## 资料来源

- [Substack: Claude Code + NotebookLM + Obsidian: The Research Stack Nobody's Using](https://substack.com/home/post/p-189067354)
- [NotebookLM Help: Learn about NotebookLM](https://support.google.com/notebooklm/answer/16164461?co=GENIE.Platform%3DDesktop&hl=en)
- [NotebookLM Help: Create a notebook](https://support.google.com/notebooklm/answer/16206563?hl=en)
- [NotebookLM Help: Upgrade NotebookLM](https://support.google.com/notebooklm/answer/16213268?hl=en)
- [Google Blog: NotebookLM adds Deep Research and support for more source types](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/)
- [Google Cloud: NotebookLM Enterprise overview](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/overview)
- [Google Cloud: Create and manage notebooks API](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks)
- [Google Cloud: Add and manage data sources API](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks-sources)
- [OpenAI Help: Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540)
- [OpenAI Codex GitHub repository](https://github.com/openai/codex)
- [Cursor CLI](https://cursor.com/cli)
- [Cursor Pricing](https://cursor.com/pricing)
- [Reddit: Stop asking NotebookLM to summarize your sources](https://www.reddit.com/r/notebooklm/comments/1rse4wp/title_stop_asking_notebooklm_to_summarize_your/)
- [Reddit: NotebookLM with Deep Research structured prompt discussion](https://www.reddit.com/r/notebooklm/comments/1pee6t1/notebooklm_with_deep_research_it_is_now_better_to/)
- [Reddit: NotebookLM + Claude Code plugin discussion](https://www.reddit.com/r/notebooklm/comments/1r605ja/notebooklm_claude_code_built_a_plugin_that/)
