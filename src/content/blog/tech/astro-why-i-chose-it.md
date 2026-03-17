---
title: 为什么我选择 Astro 作为博客框架
description: 在 Next.js、Remix、SvelteKit 等众多框架中，我最终选择了 Astro。聊聊选择的理由，以及 Astro 的核心概念。
date: 2024-02-08
tags: [Astro, 技术选型, Web开发]
---

在搭建这个博客之前，我认真考虑了几个框架：Next.js、Remix、SvelteKit、Nuxt。最终选择了 Astro。

这篇文章聊聊为什么。

## 博客的核心需求

博客是典型的**内容驱动型网站**。它的特点是：

- 内容静态，不需要实时更新
- 读多写少（甚至只读）
- SEO 很重要
- 加载速度直接影响体验

有了这些前提，框架的选择就清晰很多了。

## Astro 的核心设计

Astro 的核心理念是 **"Content-first"**（内容优先）。它默认生成没有 JavaScript 的静态 HTML，只在明确需要交互的地方才注入 JS。

这个设计叫做 **Islands Architecture**（孤岛架构）：

```
┌─────────────────────────────────┐
│           Static HTML           │  ← 绝大部分内容
│  ┌──────────┐  ┌─────────────┐  │
│  │  Island  │  │   Island    │  │  ← 只有"岛屿"是交互的
│  │ (React)  │  │  (Vue/etc)  │  │
│  └──────────┘  └─────────────┘  │
└─────────────────────────────────┘
```

每个 Island 可以独立水合（Hydrate），而且支持懒加载：

```astro
<ReactComponent client:visible />
```

`client:visible` 意味着只有当组件进入视口才加载 JS。这对性能非常友好。

## 与 Next.js 的对比

| 特性 | Astro | Next.js |
|------|-------|---------|
| 默认 JS 大小 | ~0kb | ~100kb+ |
| 构建产物 | 纯 HTML/CSS | JS Bundle |
| 框架绑定 | 无（可混用） | React |
| 适用场景 | 内容站 | Web App |

对于博客这种场景，Astro 完胜。

## MDX 支持

Astro 的 MDX 集成非常流畅。可以在 Markdown 中直接使用组件：

```mdx
import Chart from '../components/Chart.astro'

## 数据可视化

<Chart data={[1, 2, 3]} />

普通的 Markdown 内容继续...
```

这让写作变得非常灵活。

## 结论

如果你要构建：
- **博客 / 文档站** → Astro
- **复杂 Web 应用** → Next.js / Remix
- **偏 Vue 生态** → Nuxt

对我这个用例，Astro 是正确的选择。
