---
title: AI Agent 平台开发的 React 技术栈整理
description: 从 Web 端和桌面端两条路线，梳理 2026 年构建 AI Agent 平台所需要的 React 技术栈、核心库、协议和架构方向
date: 2026-06-30
model: Claude claude-4.6-opus
tags: [AI, Agent, React, 技术栈, 桌面开发]
---

这篇文章整理截至 2026 年 6 月，使用 React 技术栈构建 AI Agent 平台所涉及的技术选型。分为两条路线：

- **路线一：Web 端** — 基于浏览器的 Agent 平台，常见形态是 SaaS 产品、Agent 工作台、聊天式交互界面。
- **路线二：桌面端** — 使用前端技术栈开发本地桌面应用，常见形态是 AI IDE、本地终端、Agent 工作站。

两条路线共享大量前端基础设施，差异主要在运行时容器和系统能力接入层。

此外，本文还补充了一条参考路线——以 Claude Code 为代表的 **CLI 终端型 Agent**，它使用 React + Ink 在终端中渲染 UI，是 React 技术栈在 Agent 领域的一个独特应用方向。

---

## 共享基础层

无论走哪条路线，以下技术栈是通用的。

### 语言与类型系统

- **TypeScript** — Agent 应用涉及大量结构化数据（工具定义、消息格式、Schema 校验），TypeScript 的类型系统在这个场景下收益很高。Claude Code 全量使用 TypeScript strict mode，其约 51 万行代码库中静态类型与运行时校验形成双层保障。
- **Zod（当前 v4）** — 运行时 Schema 校验。在 Agent 系统中，Zod 的角色不限于表单验证——它用于校验每一个工具的输入参数、LLM 返回的结构化输出、API 响应、Agent 消息格式。Vercel AI SDK、Claude Code、以及多数 Agent 框架都将 Zod 作为 Schema 层。Claude Code 的做法是：每个工具（约 40 个）必须定义自己的 `inputSchema`（Zod Schema），工具系统在执行前对输入做运行时校验，不通过则不执行。

### UI 组件与样式

**Web / 桌面 GUI 方向：**

- **shadcn/ui** — 基于 Radix UI 的组件集合，代码直接复制到项目中，可完全定制。目前在 Agent 类产品中使用率很高。
- **Tailwind CSS v4** — 实用类优先的 CSS 框架，与 shadcn/ui 配合使用。
- **Radix UI** — 无样式、可访问的底层组件原语，shadcn/ui 构建在其之上。

**CLI 终端方向：React + Ink**

- **Ink** — React 的终端渲染适配器（当前 v4），由 Vadim Demedes 维护。它将 React 的 Virtual DOM diff 结果翻译为 ANSI 转义序列（光标定位、颜色控制、清屏），输出到终端。开发者可以用 JSX 编写终端界面，使用 `useState`、`useEffect` 等标准 React Hooks 管理状态。
- Ink 提供一组终端原语组件：`<Box>`（Flexbox 布局）、`<Text>`（文本与颜色）、`<Newline>`、`<Spacer>` 等，布局模型类似 CSS Flexbox，支持 `flexDirection`、`padding`、`margin`、`borderStyle` 等属性。
- 社区组件生态：`ink-text-input`（文本输入）、`ink-select-input`（列表选择）、`ink-spinner`（加载动画）、`ink-table`（表格）、`ink-syntax-highlight`（代码高亮）等。
- Claude Code 使用 React 18 + Ink 4 构建了完整的终端交互界面，包括用户输入区、流式消息渲染、工具调用进度展示、权限确认弹窗、多 Agent 状态面板。其 `main.tsx` 是整个调用栈的入口，使用 Commander.js 解析 CLI 参数后挂载 Ink 渲染器。
- 这种方案的核心收益：终端 UI 可测试、可组合，React 开发者无需学习新的 UI 范式。代价是在 CLI 工具中引入了 React 依赖树。

### 状态管理

Agent 应用的状态管理需要处理流式响应、多会话、工具调用等异步场景，常用方案：

- **Zustand** — 轻量、无样板代码，支持 persist 中间件（持久化）、devtools。在 Electron 场景下比 Redux 更稳定（能正确处理窗口重载）。assistant-ui 内部也使用 Zustand 管理状态。
- **Jotai** — 原子化状态管理，适合组件级别的细粒度订阅，避免全局 store 带来的不必要重渲染。
- **TanStack Query** — 服务端状态缓存和同步，用于管理 API 请求、会话列表等服务端数据。
- **ai-sdk-zustand** — Vercel AI SDK 的全局状态替代方案，将 `useChat` 的状态提升为 Zustand store，解决 prop drilling 问题。

### Agent 通信协议

2026 年 Agent 生态中有三个关键协议，解决不同层面的问题：

**MCP（Model Context Protocol）**

Anthropic 发起的开源协议，定义 Agent 与外部工具/数据源之间的标准接口。基于 JSON-RPC，采用 Client-Server 架构。

- Server 暴露三类能力：Tools（可执行动作）、Resources（只读数据）、Prompts（可复用模板）
- 在 React 应用中通常通过后端代理集成：前端 → Next.js API Route / Express → MCP Client → MCP Server
- 相关库：`@modelcontextprotocol/sdk`、`use-mcp`（React hooks）
- Vercel AI SDK v7 新增 MCP Apps 支持，MCP Server 可以在沙箱 iframe 中渲染 UI

**AG-UI（Agent-User Interaction Protocol）**

CopilotKit 发起的开源协议，标准化 Agent 后端与前端 UI 之间的实时通信。

- 基于事件流，定义了约 16 种事件类型：`RUN_STARTED`、`TEXT_MESSAGE_CONTENT`（Token 流式输出）、`TOOL_CALL_START/END`（工具执行进度）、`STATE_DELTA`（状态增量同步）、`AGENT_HANDOFF`（Agent 切换）等
- 传输层无关，通常用 SSE 或 WebSocket 实现
- 框架无关：可以连接 LangGraph、CrewAI、OpenAI、Mastra 等不同后端
- React 集成主要通过 CopilotKit

**A2A（Agent-to-Agent Protocol）**

Google 发起的协议，解决多 Agent 之间的协作通信。Agent 通过 Agent Card 声明自身能力，其他 Agent 可以发现并调用。

三个协议的关系：MCP 负责工具接入，A2A 负责 Agent 间通信，AG-UI 负责 Agent 到用户界面的交互。

---

## 路线一：Web 端 Agent 平台

Web 端是目前 Agent 平台的主流形态，技术栈相对成熟。

### 框架层

**Next.js（当前版本 16.x）**

- App Router + React Server Components（RSC）用于服务端渲染和流式传输
- Server Actions 可以直接在组件中调用服务端逻辑，减少 API 路由样板代码
- `create-next-app` 自 16.2 起默认生成 `AGENTS.md` 文件
- 支持 Partial Pre-rendering、Streaming、Edge Functions

**TanStack Start**

- TanStack 生态的全栈框架，类型安全更强
- RSC 支持尚未完全 production-ready
- 适合不需要 RSC 的场景

### AI SDK 与 Agent 编排

**Vercel AI SDK（当前版本 v7）**

截至 2026 年 6 月周下载量超过 1600 万，是 TypeScript AI 应用的标准 SDK。

核心能力：
- 流式输出、工具调用、结构化输出
- Agent 原语：`ToolLoopAgent`（简单循环 Agent）、`WorkflowAgent`（持久化、可恢复的工作流 Agent）
- `HarnessAgent`：统一接口运行 Claude Code、Codex 等外部 Agent 工具
- 提供商抽象：OpenAI、Anthropic、Google 等多提供商切换
- React Hooks：`useChat`、`useCompletion`
- MCP Apps 支持
- 实验性实时语音支持（WebSocket）
- AI Elements：20+ 预构建 React 组件（消息线程、推理面板、语音界面）

**LangGraph**

用于需要持久化、有状态图结构的复杂 Agent 工作流：长时间运行的任务、Human-in-the-loop 检查点、崩溃后恢复。在简单的循环式 Agent 满足不了需求时再引入。

**CopilotKit**

完整的 Agent 框架，提供 Agent 感知的 Chat UI、Generative UI、应用状态与 Agent 状态的双向同步、Human-in-the-loop 流程。原生支持 AG-UI 协议。适合需要 Agent 与应用深度集成的场景。

### Chat UI 组件库

Agent 平台通常需要聊天界面来展示对话、工具调用、流式响应等，以下是主要选项：

**assistant-ui**

- 目前 React 生态中采用率最高的 AI Chat UI 库，月下载量超过 20 万
- Radix 风格的可组合原语：`Thread`、`Message`、`Composer`、`ThreadList`、`ActionBar`
- 内建流式渲染、自动滚动、Markdown、代码高亮、文件附件、键盘快捷键、无障碍支持
- Generative UI：将工具调用渲染为 React 组件
- 集成适配器：Vercel AI SDK、LangGraph、AG-UI、A2A、Google ADK
- 基于 shadcn/ui 的默认主题，CLI 可复制到项目中完全定制

**CopilotKit UI**

- CopilotKit 框架自带的 UI 组件
- 提供 `CopilotChat`（预构建聊天界面）和 Headless 模式
- 与 AG-UI 协议原生集成

**Vercel AI SDK + AI Elements**

- Vercel 官方提供的 AI UI 组件库
- 基于 shadcn/ui 构建，包含消息线程、推理面板、语音界面等组件
- `streamUI` 函数支持将 RSC 流式传输到客户端

**Deep Chat**

- 框架无关的 Web Component
- 内建多个 LLM 提供商的连接器
- 适合快速原型或非 React 项目

### 后端与数据层

- **Postgres + pgvector** — 同时承载结构化数据和向量检索，在不需要专用向量数据库的阶段足够用
- **Convex** — 响应式后端，查询自动同步到 React 组件，内建向量搜索和 Agent 工作流支持
- **OpenRouter** — 模型网关，路由到不同的 LLM 提供商，避免厂商锁定

### 可观测性

Agent 应用的调试和监控需要 LLM 原生的 tracing 工具：

- **Langfuse** — 开源，支持自部署
- **LangSmith** — LangChain 生态的 tracing 平台
- **Arize Phoenix** — 开源 LLM 可观测性平台

### 安全

- **OPA（Open Policy Agent）** — 用于工具调用的授权控制
- 沙箱运行环境（如 K8s Agent Sandbox、Vercel AI SDK v7 的 sandbox 支持）

---

## 路线二：桌面端 Agent 平台

使用前端技术栈构建桌面应用，常见场景是 AI IDE、本地 Agent 终端、代码编辑器。这条路线的核心决策是选择运行时容器。

### 运行时容器：Electron vs Tauri

**Electron**

- 架构：捆绑完整的 Chromium 引擎 + Node.js 运行时
- 安装包大小：120–200 MB
- 空闲内存占用：约 600 MB+
- 前后端语言统一为 TypeScript/JavaScript
- 可直接使用整个 Node.js 生态
- 跨平台 UI 一致性好（同一个 Chromium 引擎）
- 调试体验好（Chrome DevTools）
- 代表产品：VS Code、Cursor、Slack

适用场景：团队是 Web 技术栈背景，需要三平台一致的 UI 表现，对内存占用不敏感。

**Tauri 2.0**

- 架构：使用系统原生 WebView（macOS 用 WebKit、Windows 用 WebView2、Linux 用 WebKitGTK）+ Rust 后端
- 安装包大小：5–20 MB
- 空闲内存占用：约 60–120 MB
- 后端用 Rust 编写，前端仍然是 React/TypeScript
- 内存占用比 Electron 低约 85%
- 需要 Rust 工具链
- 不同平台的 WebView 引擎不同，需要额外的兼容性测试
- 代表产品：Terax（AI 终端）、ChatML、Agents UI

适用场景：Agent 工具需要与本地 LLM 或其他重型进程共存，资源效率是硬性要求。

**选择建议（记录而非建议）：**

多数 2026 年新建的 AI Agent 桌面项目选择 Tauri 2.0 的理由集中在资源效率上——Agent 本身已经很吃资源，桌面壳应该尽量轻。选择 Electron 的理由集中在开发效率和生态成熟度上——不需要写 Rust，Node.js 生态的库可以直接用。

### 终端模拟

桌面端 Agent 平台通常需要内嵌终端：

- **xterm.js** — 浏览器和 Electron/Tauri WebView 中的标准终端模拟器
- **xterm.js WebGL 插件** — GPU 加速渲染，高帧率输出
- **node-pty**（Electron）/ **portable-pty**（Tauri/Rust）— 后端 PTY 进程管理，提供真实的 Shell 会话
- 需要实现 Shell 集成：当前工作目录上报、Prompt 标记、内联搜索、链接检测、True Color 支持

### 代码编辑器

- **Monaco Editor** — VS Code 同款编辑器引擎，功能完整，体积较大，适合需要 VS Code 级别体验的场景
- **CodeMirror 6** — 模块化架构，更轻量，支持丰富的语言扩展和主题，适合不需要完整 IDE 功能的场景。Terax 等项目使用 CodeMirror 6

两者都有成熟的 React 封装：`@monaco-editor/react`、`@uiw/react-codemirror`。

### IPC 通信

前端与后端的通信机制因容器不同而异：

- **Electron** — `ipcMain` / `ipcRenderer`，基于 Chromium IPC
- **Tauri** — `invoke`（前端调用 Rust 命令）和 `emit/listen`（事件系统）
- **Sidecar 模式** — 部分项目将 Agent 逻辑放在独立的子进程（Go、Node.js、Python），通过本地 HTTP/WebSocket 与前端通信。Tauri 原生支持 sidecar 概念（打包外部二进制文件并管理其生命周期）

### 文件系统与 Git

桌面端可以直接访问本地文件系统和 Git：

- **Tauri** — Rust 后端通过 `std::fs` 和 `git2` crate 直接操作
- **Electron** — 通过 Node.js 的 `fs` 模块和 `simple-git` / `isomorphic-git`
- **文件树组件** — 通常自行实现，结合虚拟化列表（react-virtualized / TanStack Virtual）处理大型文件树
- **Diff 查看器** — 基于 Monaco 的 diff editor 或者 `react-diff-viewer`

### 系统级能力

桌面端相对于 Web 端的独特能力：

- **OS 密钥链** — 安全存储 API Key（Tauri 有 `tauri-plugin-keychain`，Electron 有 `keytar`）
- **本地 LLM 集成** — 通过 Ollama 或 LM Studio 运行本地模型，不需要网络请求
- **系统通知** — 原生通知、托盘图标
- **本地数据库** — SQLite（通过 `better-sqlite3` 或 Tauri 的 Rust SQLite 绑定）

### 一个典型桌面端 Agent 项目的技术栈示例

以开源项目 Terax（AI 原生终端）为参考：

| 层级 | 技术选择 |
|------|---------|
| 容器 | Tauri 2 |
| 后端 | Rust + portable-pty |
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 终端 | xterm.js + WebGL 渲染器 |
| 编辑器 | CodeMirror 6 |
| AI SDK | Vercel AI SDK v6 |
| 样式 | Tailwind v4 + shadcn/ui |
| 状态管理 | Zustand |
| LLM 接入 | BYOK 多提供商 + 本地模型 |

---

## 补充路线：CLI 终端型 Agent — 以 Claude Code 为架构参考

除了 Web 端和桌面 GUI 端，还存在第三种形态：**CLI 终端型 Agent**。这类产品不使用浏览器或桌面窗口管理器渲染 UI，而是直接在终端中运行，通过 ANSI 转义序列渲染交互界面。Claude Code 是这条路线的代表性产品。

以下内容主要参考《[御舆：解码 Agent Harness — Claude Code 架构深度剖析](https://lintsinghua.github.io/)》一书的分析。该书为开源技术书籍，42 万字、15 章、139 张架构图，从对话循环到构建自定义 Agent Harness 做了系统拆解。

### Claude Code 技术栈

| 层级 | 技术选择 |
|------|---------|
| 运行时 | Bun（非 Node.js，冷启动 <50ms，内置 SQLite） |
| 语言 | TypeScript 5.x strict mode |
| 终端 UI | React 18 + Ink 4 |
| CLI 解析 | Commander.js |
| Schema 校验 | Zod v4 |
| API 客户端 | @anthropic-ai/sdk（SSE 流式） |
| 代码搜索 | ripgrep（Rust 实现） |
| 协议 | MCP SDK、LSP |
| 遥测 | OpenTelemetry + gRPC（懒加载，不影响冷启动） |
| 特性开关 | GrowthBook（编译时消除死代码） |
| 认证 | OAuth 2.0、JWT、macOS Keychain |

### React + Ink：在终端中使用 React

Ink 是 React 的终端适配器。它将 React 的 Virtual DOM diff 结果翻译为 ANSI 转义序列（光标位置、颜色、清屏），输出到终端。Claude Code 使用 React + Ink 构建整个交互界面——输入区、消息展示、工具调用进度、权限确认弹窗等。

这意味着：
- 终端 UI 可以用 React 组件模式开发（状态管理、组件组合、重渲染）
- UI 层可测试、可组合，对 React 开发者来说门槛低
- 代价是引入了一套非平凡的依赖树到 CLI 工具中

### Agent Harness 核心架构

Claude Code 的架构可以理解为围绕 LLM 构建的运行时框架（Agent Harness），包含六个核心抽象：

**1. 对话循环（Query Loop）**

核心是一个 `while(true)` 异步生成器循环，位于 `query.ts`（约 1700 行）。循环体从第 307 行到第 1728 行，包含 9 个不同的 `continue` 状态转换点。每一轮循环：发送消息给 LLM → 流式接收响应 → 检测工具调用 → 通过权限层 → 执行工具 → 将结果回传给下一轮 API 调用。

设计选择：循环优于递归（更易调试和追踪状态）、异步生成器优于事件发射器（统一了流式事件、终止信号和错误传播）。

**2. 工具系统（Tool System）**

约 40 个工具，每个工具是一个自包含模块，必须提供：

- `name` — 工具名称（LLM 用此名称调用）
- `description` — 自然语言描述（LLM 据此判断何时使用）
- `inputSchema` — Zod Schema 定义输入参数
- `execute()` — 实际执行逻辑
- `requiresPermission()` — 是否需要用户确认
- `permissionDescription()` — 权限提示文本

工具之间无共享可变状态。工具调用经过 14 步执行管线（校验、权限检查、钩子、执行、分析），位于 `toolExecution.ts`（约 1745 行）。

`StreamingToolExecutor` 实现了流式工具执行——在模型还在生成第三个工具调用时，第一个并发安全的工具已经开始执行。

**3. 权限管线（Permission Pipeline）**

四阶段管线、五种权限模式。关键设计：默认 fail-closed（未明确允许的一律拒绝）、推测性分类器使用 `Promise.race` 实现 2 秒超时。Bash 命令有独立的规则匹配系统。

**4. 上下文管理（Context Management）**

有效窗口公式管理 Token 预算，四级渐进压缩策略：

- Snip — 截断过长的工具输出
- MicroCompact — 小范围压缩
- Collapse — 折叠历史消息
- AutoCompact — LLM 驱动的自动摘要

使用断路器模式防止压缩循环失控。

**5. 子 Agent 与任务系统（Tasks）**

`AgentTool` 可以作为标准工具调用产生子 Agent，子 Agent 运行独立的 query loop，拥有独立的消息历史、工具集和权限作用域。任务遵循状态机：`pending → running → completed | failed | killed`。

多 Agent 协作使用 Mailbox 模式：Worker Agent 无法独立批准高风险操作，必须向 Coordinator 的信箱发送请求并等待批准。

**6. 记忆与钩子系统**

- 记忆系统：四种封闭式记忆类型，"只保存无法推导的信息"，通过 `CLAUDE.md` / `MEMORY.md` 索引
- 钩子系统：五种 Hook 类型、27 个生命周期事件、JSON 响应协议，支持在工具执行前后注入自定义逻辑

### 从 Claude Code 架构中提取的设计原则

《御舆》一书总结了 Agent Harness 的五大设计原则：

1. **异步流式优先** — 所有 I/O 操作使用异步生成器，UI 层实时消费流式事件
2. **安全边界内嵌** — 权限检查不是外挂的中间件，而是嵌入到工具系统和对话循环的每一步
3. **缓存感知设计** — Prompt 缓存的命中率直接影响成本和延迟，系统 Prompt 的组织方式考虑了缓存友好性
4. **渐进式能力扩展** — 从最小循环开始，按需引入权限、压缩、子 Agent、钩子等子系统
5. **不可变状态流转** — 使用单一可变 State 对象原子更新，避免分散的副作用

这些原则不绑定特定的 LLM 或框架，对使用 LangGraph、AutoGen、CrewAI 或自建 Agent 系统都适用。

### CLI 终端型 vs Web 端 vs 桌面 GUI 端

| 维度 | CLI 终端型（Claude Code） | Web 端 | 桌面 GUI 端 |
|------|--------------------------|--------|------------|
| UI 渲染 | React + Ink → ANSI 转义序列 | React → DOM | React → DOM（WebView 或 Chromium）|
| 分发方式 | npm 全局安装 | URL 访问 | 安装包 |
| 系统能力 | 完整（直接访问文件系统、终端、进程）| 受限 | 完整 |
| 适用场景 | 开发者工具、编码 Agent | SaaS 平台、Agent 工作台 | AI IDE、本地工作站 |
| 用户群体 | 终端用户、开发者 | 一般用户 | 一般用户和开发者 |

---

## 三条路线对比

| 维度 | Web 端 | 桌面 GUI 端 | CLI 终端型 |
|------|--------|------------|-----------|
| 运行时 | 浏览器 | Electron / Tauri | Bun / Node.js |
| UI 技术 | React → DOM | React → DOM（WebView）| React + Ink → ANSI |
| 分发方式 | URL 访问 | 安装包 | npm 全局安装 |
| 系统能力 | 受浏览器沙箱限制 | 可访问文件系统、终端、密钥链 | 完整系统访问 |
| 本地 LLM | 不支持（需通过 API） | 支持直连 Ollama / LM Studio | 支持 |
| 终端集成 | WebContainers（受限）| xterm.js + PTY | 原生终端 |
| 离线使用 | 不支持 | 支持（配合本地模型）| 支持 |
| 开发复杂度 | 较低 | 较高（IPC、系统 API、打包签名）| 中等（无 GUI 布局，但需处理终端渲染）|
| 更新机制 | 即时生效 | 自动更新（autoUpdater / Tauri updater）| npm update |
| 代表产品 | ChatGPT Web、v0 | Cursor、Terax | Claude Code、Codex CLI |

---

## 参考来源

- [Best AI Agent SaaS Tech Stack in 2026 — AI in Plain English](https://ai.plainenglish.io/best-ai-agent-saas-tech-stack-in-2026-1544bee567da)
- [The React + AI Stack for 2026 — Builder.io](https://www.builder.io/blog/react-ai-stack-2026)
- [AI SDK 7 is now available — Vercel](https://vercel.com/blog/ai-sdk-7)
- [assistant-ui — React Chat UI for AI Apps](https://www.assistant-ui.com/)
- [AG-UI Protocol — GitHub](https://github.com/ag-ui-protocol/ag-ui)
- [Electron Desktop App Development Guide 2026 — Forasoft](https://www.forasoft.com/blog/article/electron-desktop-app-development-guide-for-business)
- [We Built a Desktop AI App with Tauri 2 — ChatML](https://chatml.com/blog/desktop-ai-app-tauri-2-instead-of-electron)
- [Tauri vs Electron for Developer Tools — Agents UI](https://agents-ui.com/blog/tauri-vs-electron-for-developer-tools/)
- [Terax — 开源 AI 终端](https://github.com/crynta/terax-ai)
- [The Agent Protocol Stack: MCP vs A2A vs AG-UI — DEV Community](https://dev.to/jubinsoni/the-agent-protocol-stack-mcp-vs-a2a-vs-ag-ui-when-to-use-what-6dn)
- [御舆：解码 Agent Harness — Claude Code 架构深度剖析（在线阅读）](https://lintsinghua.github.io/)
- [御舆 — GitHub 仓库](https://github.com/lintsinghua/claude-code-book)
- [Claude Code Architecture — 官方文档](https://instructkr-claude-code.mintlify.app/concepts/architecture)
- [Everyone Analyzed Claude Code's Features. We Analyzed Its Architecture — Medium](https://medium.com/@sathishkraju/everyone-analyzed-claude-codes-features-we-analyzed-its-architecture-d971ca723a68)
