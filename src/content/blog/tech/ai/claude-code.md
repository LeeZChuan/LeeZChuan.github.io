---
title: Claude Code 官方文章重要整理
description: 阅读cc官方文章
date: 2026-04-03
tags: [Claude Code, ai, AI辅助编程]
---

文章链接:https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

## Context engineering for long-horizon tasks
## 针对长期任务的上下文工程

- 方案1: Compaction  压实
- 方案2: Structured note-taking  结构化笔记
- 方案3: Sub-agent architectures  子代理架构

```
The choice between these approaches depends on task characteristics. For example:
选择哪种方法取决于任务的特点。例如：

Compaction maintains conversational flow for tasks requiring extensive back-and-forth;
压缩功能可以保持需要大量来回沟通的任务的对话流畅性；
Note-taking excels for iterative development with clear milestones;
记笔记对于设定明确里程碑的迭代开发非常有效；
Multi-agent architectures handle complex research and analysis where parallel exploration pays dividends.
多智能体架构能够处理复杂的研究和分析，并行探索能够带来丰厚的回报。
Even as models continue to improve, the challenge of maintaining coherence across extended interactions will remain central to building more effective agents.
即使模型不断改进，在长时间的交互中保持一致性的挑战仍然是构建更有效智能体的核心。
```


文章链接:https://www.anthropic.com/engineering/writing-tools-for-agents

## 开发过程中如何减少大模型的幻觉

1. Principles for writing effective tools 编写有效工具的原则:

- 工具越多并不总是能带来更好的结果。我们观察到的一个常见错误是，一些工具仅仅封装了现有的软件功能或 API 接口——无论这些工具是否适合智能体。这是因为智能体与传统软件有着不同的“可操作性”——也就是说，它们感知使用这些工具可以采取的潜在行动的方式不同。

2. Namespacing your tools  为工具命名:我们发现，选择基于前缀还是基于后缀的命名空间会对工具使用评估产生显著影响。这种影响因语言学习模块 (LLM) 而异，我们建议您根据自身评估结果选择合适的命名方案。

3. Returning meaningful context from your tools 从您的工具中返回有意义的上下文:同样，工具实现应注意仅向代理返回高信号信息。它们应优先考虑上下文相关性而非灵活性，并避免使用底层技术标识符（例如： uuid 、 256px_image_url 、 mime_type ）。像 name 、 image_url 和 file_type 这样的字段更有可能直接影响代理的后续操作和响应。与处理晦涩难懂的标识符相比，智能体处理自然语言名称、术语或标识符的效果往往要好得多。我们发现，仅仅将任意字母数字 UUID 解析为语义更清晰、更易于理解的语言（甚至是 0 索引的 ID 方案），就能显著提高 Claude 在检索任务中的准确率，因为它能减少幻觉的产生。

