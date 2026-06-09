---
title: "前端流程自动化提效实践：本地反馈回路"
description: "整理前端本地开发阶段的自动化方案，包括构建工具、lint、git hook、接口代码生成、mock 和组件工作台。"
date: 2026-06-04 21:20:00
tags: ["计算机技术", "Web前端", "前端工程化", "提效"]
---

前端提效最容易做错的一点，是一开始就把注意力放在“工具清单”上。更稳的做法是先问：开发者改完一行代码后，需要多久知道这次改动有没有问题？

这篇只讲本地反馈回路，也就是代码还没有进入 CI 之前，开发者电脑上应该自动完成哪些事情。整体方案地图和学习路径可以参考[前篇](/blog/front-end-workflow-automation-2026-map)。

## 项目入口：从 CRA 思维切到框架或现代构建工具

2021 年前后，React 项目常见入口是 create-react-app，再用 craco 覆盖默认 webpack 配置。今天这个路线不再适合作为新项目默认选项。React 官方已经在 2025 年宣布不再建议新项目使用 CRA，并推荐优先选择框架；如果确实要自建，则可以从 Vite、Parcel、Rsbuild 等构建工具开始。

我现在会按下面方式选：

| 场景 | 优先方案 | 说明 |
| --- | --- | --- |
| 业务需要路由、数据加载、SSR/SSG、部署约定 | Next.js、Remix、React Router framework mode、Nuxt | 让框架接管“应用级重复问题” |
| 中后台 SPA、内部系统、可纯客户端部署 | Vite、Rsbuild | 启动快，约定少，便于接入已有体系 |
| 旧 webpack 项目构建过慢 | Rspack 或 Rsbuild 分阶段替换 | Rspack 强调 webpack 兼容，迁移风险相对可控 |
| 组件库、工具库 | Vite library mode、Rslib、tsup | 输出 ESM/CJS/types，重点是包产物正确 |

Vite 的优势是开发态反馈快。官方文档提到，它用原生 ESM 提供 dev server，并通过快速 HMR 减少每次保存后的等待。Rspack/Rsbuild 则更偏“用 Rust 工具链解决大型 webpack 项目的构建性能问题”。

## 代码风格：ESLint + Prettier 仍稳，Biome/Oxlint 适合性能敏感仓库

原文里讲了 ESLint 和 lint-staged，这条线现在仍然成立。区别是今天多了两类选择：

| 方案 | 特点 | 适合场景 |
| --- | --- | --- |
| ESLint + Prettier | 生态最成熟，规则、插件、团队经验最多 | 大多数 React/Vue/Node 项目 |
| ESLint flat config | 新版 ESLint 配置方式，适合新项目逐步采用 | 需要升级 ESLint 配置体系 |
| Biome | formatter + linter 一体化，速度快，配置少 | 规则诉求不复杂、希望减少工具数量 |
| Oxlint | 高性能 JS/TS linter，强调大仓库和 CI 性能 | ESLint 运行时间已经明显影响反馈 |

我的建议是：新项目如果没有特殊规则，先用框架推荐的 ESLint/Prettier 或 Biome；已有项目不要为了追新立刻替换全套 lint，先在 CI 里量化耗时。如果 lint 已经是 CI 的主要耗时，再考虑 Biome/Oxlint 的替换或并行使用。

## Git hook：只放快任务

Git hook 的定位是“把低成本错误挡在本地”，不是把 CI 搬到本地。一个合理的 pre-commit 应该尽量在几秒内结束。

成熟组合仍然是：

- Husky 或 Lefthook 管理 git hook。
- lint-staged 只处理 staged files。
- commitlint 检查 commit message。
- prettier/eslint/biome 执行自动修复。

Lefthook 的优势是配置里天然支持并行任务，适合大仓库或多语言仓库。Husky 的优势是 Node 项目里足够普及，文档和团队经验更多。

一个本地 hook 的合理边界：

| hook | 适合放 | 不适合放 |
| --- | --- | --- |
| pre-commit | staged 文件格式化、轻量 lint、简单静态检查 | 全量构建、全量测试、E2E |
| commit-msg | commitlint | 业务逻辑校验 |
| pre-push | 快速 typecheck、关键单测 | 大量浏览器测试、发布动作 |

如果 hook 太慢，团队成员迟早会用 `--no-verify` 绕过去。真正重的任务应该放 CI，并把 CI 结果做成 PR 必经检查。

## 接口契约：不要手写会漂移的类型

前后端协作里，最常见的浪费不是“写请求函数”，而是接口变更后前端类型、mock、调用代码没有同步。

REST 项目可以优先看：

- [OpenAPI Generator](https://openapi-generator.tech/)：覆盖语言多，适合作为通用生成器。
- [Orval](https://orval.dev/)：更贴近前端 TypeScript 场景，可从 OpenAPI 生成 models、请求函数、React Query/Vue Query/SWR hooks，也能生成 MSW mock。
- [openapi-typescript](https://openapi-ts.dev/)：如果只想生成类型，可以更轻量。

GraphQL 项目可以看：

- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)：根据 schema 和 operations 生成类型、hooks、resolver 类型。

这类工具最好放在 `npm scripts` 里，并在 CI 检查生成结果是否被提交。否则本地生成一套、CI 构建又生成一套，很容易出现“本地能跑，线上类型不一致”的问题。

## Mock：优先靠近网络边界

不要把 mock 写进业务 service 里，例如：

```ts
export async function getUser() {
  if (import.meta.env.DEV) {
    return mockUser;
  }

  return request('/api/user');
}
```

这种写法短期方便，长期会污染业务逻辑，也容易把 mock 带到生产路径。更稳的方式是把 mock 放在网络边界：

- 浏览器开发态用 MSW service worker 拦截请求。
- Node 测试环境用 MSW Node server 复用同一套 handlers。
- 复杂场景可以用本地 mock server，保持和真实 API 一样的 HTTP 行为。

MSW 的价值在于它拦截真实发生的网络请求，而不是替换业务函数。这样组件、请求层、缓存层仍然走真实链路，测试和开发环境更接近生产。

## 组件工作台：Storybook 不只是文档

Storybook 的价值不只是“展示组件”，而是把组件状态变成可重复访问的样本。

一个成熟的 Storybook 用法通常包括：

- 每个基础组件至少有默认态、禁用态、加载态、错误态、空态。
- 表单组件覆盖校验错误、异步提交、只读态。
- 业务组件用 MSW 提供接口数据。
- 主题、语言、权限、视口通过 decorators 或 globals 切换。
- stories 后续可以喂给视觉回归测试和组件测试。

当组件状态沉淀成 stories 后，Chromatic 可以把每个 story 自动变成视觉测试样本，在 PR 里提示视觉变化。Storybook 官方文档也把 visual testing 和 component testing 放进了测试体系，而不是单纯把它当文档站。

## 推荐的本地 scripts

一个前端项目可以先从这些 scripts 开始，不必一步到位：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:run": "vitest run",
    "codegen": "orval --config orval.config.ts",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

如果使用 Biome，可以把 `lint` 和 `format` 收敛为：

```json
{
  "scripts": {
    "check": "biome check .",
    "check:write": "biome check --write ."
  }
}
```

## 本地阶段的成熟度检查

可以用下面的问题检查当前项目还缺什么：

1. 新同事 clone 仓库后，是否只需要一条命令就能启动？
2. Node、包管理器、lockfile 是否固定？
3. 保存文件后，页面反馈是否足够快？
4. 提交前是否只检查本次暂存文件？
5. 接口类型、请求函数、mock 是否来自同一个契约来源？
6. 组件复杂状态是否能在 Storybook 里复现？
7. hook 失败时，错误信息是否足够直接？

如果这些问题都能回答“是”，本地反馈回路基本就稳定了。接下来才值得继续投入 CI、E2E、视觉回归、发布和依赖治理。

## 参考资料

- React 官方：[Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- React 官方：[Creating a React App](https://react.dev/learn/start-a-new-react-project)
- Vite 官方：[Why Vite](https://vite.dev/guide/why.html)
- Rspack 官方：[Introduction](https://rspack.dev/guide/start/introduction)
- Rsbuild 官方：[Announcing Rsbuild 2.0](https://www.rsbuild.dev/blog/v2-0)
- Biome 官方：[Biome, toolchain of the web](https://biomejs.dev/)
- Oxlint 官方：[Oxlint](https://oxc.rs/docs/guide/usage/linter)
- Lefthook 官方：[What is Lefthook?](https://lefthook.dev/)
- Orval 官方：[Overview](https://orval.dev/docs)
- OpenAPI Generator 官方：[TypeScript generator](https://openapi-generator.tech/docs/generators/typescript/)
- MSW 官方：[Mock Service Worker](https://github.com/mswjs)
- Storybook 官方：[Visual tests](https://storybook.js.org/docs/8/writing-tests/visual-testing)
- Chromatic 官方：[Automate visual tests with CI](https://www.chromatic.com/docs/ci/)

