---
title: "跨平台应用开发技术选型整理"
description: "整理 React Native、Flutter、Electron、Tauri、Capacitor、Kotlin Multiplatform、.NET MAUI、Qt 等跨平台应用开发方案的定位、优缺点和选型逻辑。"
date: 2026-06-04 22:00:00
model: GPT-5.5 Codex
tags: ["计算机技术", "Web前端", "跨平台", "技术选型"]
---

## 前言

跨平台开发的核心目标并不是“一个代码库解决所有平台问题”，而是在不同平台之间找到合适的复用边界。移动端、桌面端、Web、嵌入式设备面对的是不同的系统能力、交互习惯、发布渠道和性能约束。选型时如果只看 GitHub Star 或者“能不能一套代码跑多端”，很容易低估后期维护成本。

这篇文章整理的是截至 2026-06-04 仍然值得重点关注的跨平台应用开发方案。原草稿里提到了 React Native、Flutter、Electron、Tauri，这些仍是主流项目；我这里补充 Capacitor、Kotlin Multiplatform、.NET MAUI、Qt，并把选型逻辑拆得更清楚一些。

如果只关心 Electron 快速上手模板，可以继续看我之前那篇：[Electorn 的相关脚手架](/blog/electorn-choose)。

## 先按目标平台分层

跨平台方案可以先按目标平台分成四类：

| 目标 | 常见方案 | 核心判断 |
| --- | --- | --- |
| iOS + Android 移动应用 | React Native、Flutter、Kotlin Multiplatform、.NET MAUI、Capacitor | 是否追求原生控件、统一 UI、Web 技术复用、原生团队协作 |
| Windows + macOS + Linux 桌面应用 | Electron、Tauri、Flutter Desktop、Qt、.NET MAUI、Compose Multiplatform | 是否需要完整 Web 能力、体积控制、系统集成、长期维护 |
| Web + 移动壳 | Capacitor、PWA、React Native Web、Flutter Web | 是否已有成熟 Web 应用，是否接受 WebView 或 Web 渲染限制 |
| 工业、嵌入式、车机、长期支持场景 | Qt、Flutter Embedded、原生定制方案 | 是否需要稳定 LTS、硬件适配、商业支持和可认证流程 |

一个实用的判断是：如果你的产品主要是内容展示、表单、列表、后台管理，那么 Web 技术栈复用收益很高；如果产品强依赖系统能力、复杂手势、地图、相机、蓝牙、后台任务、支付、推送、音视频，跨平台框架之外还要重点评估原生插件和调试能力。

## 方案总览

| 方案 | 主要语言/技术 | 主要平台 | 适合场景 | 主要风险 |
| --- | --- | --- | --- | --- |
| React Native / Expo | JavaScript、TypeScript、React、原生模块 | iOS、Android，另有 Web、Windows、macOS 等扩展 | React 团队做移动端，追求接近原生体验 | 原生依赖升级、平台差异、复杂动画和原生能力仍需原生知识 |
| Flutter | Dart、Skia/Impeller 渲染 | iOS、Android、Web、Windows、macOS、Linux | 需要高度一致 UI、多端统一视觉、独立 App 团队 | Dart 学习成本、与平台原生 UI 风格存在差异 |
| Electron | JavaScript、HTML、CSS、Node.js、Chromium | Windows、macOS、Linux | 桌面端、开发者工具、IM、IDE、内部工具 | 包体积和内存较大，需要跟随 Chromium/Electron 安全更新 |
| Tauri | Web 前端 + Rust + 系统 WebView | Windows、macOS、Linux、Android、iOS | 桌面端轻量应用、本地工具、安全和体积敏感应用 | Rust 和系统依赖门槛，移动端生态仍需谨慎评估 |
| Capacitor | Web 技术 + 原生容器插件 | iOS、Android、PWA | 已有 Web 应用改造成移动应用，业务以 Web UI 为主 | WebView 性能边界，复杂原生体验依赖插件质量 |
| Kotlin Multiplatform / Compose Multiplatform | Kotlin、Compose | Android、iOS、Desktop、Web | Android/Kotlin 团队复用业务逻辑或 UI | iOS/Web 成熟度、团队是否具备 Kotlin 和原生调试能力 |
| .NET MAUI | C#、XAML、.NET | Android、iOS、Windows、macOS | .NET 团队做企业级多端应用 | 非 .NET 团队引入成本高，生态偏企业与微软技术栈 |
| Qt | C++、QML、Python 等 | Desktop、Mobile、Embedded | 工业软件、嵌入式、车机、医疗、长期支持 GUI | 商业授权、C++/QML 技术栈、Web 前端团队迁移成本 |

## React Native：React 技术栈做原生移动应用

React Native 的定位仍然是用 React 开发原生移动应用。官方仓库说明 React Native 主要面向 iOS 和 Android，并且可以复用到其他平台；截至我查阅时，官方仓库列出的目标系统要求是 iOS 15.1 和 Android 7.0（API 24）或更新版本。

2026 年看 React Native，不能只看 `react-native init`。官方文档已经明确建议新应用优先使用 React Native Framework，例如 Expo。Expo 把路由、原生模块、构建、提交、OTA 更新等工程问题整合起来，可以减少大量从零拼装成本。

适合选择 React Native 的场景：

1. 团队已经熟悉 React、TypeScript 和前端工程化。
2. 产品主要目标是 iOS / Android 手机端。
3. 需要接近原生的控件、导航、手势和性能。
4. 团队能接受在关键功能上写 Swift、Kotlin、Objective-C、Java 原生模块。

不太适合的场景：

1. 希望完全不碰原生工程。
2. 页面高度依赖 Web DOM、CSS 布局和现有 Web 组件库。
3. 桌面端是第一目标平台。

## Flutter：统一渲染、多端一致性强

Flutter 是 Google 的跨平台 UI SDK，用 Dart 编写应用，通过自己的渲染体系提供高度一致的视觉表现。官方仓库描述它面向 mobile、web 和 desktop，并支持 iOS、Android、Web、Windows、macOS、Linux。

截至 2026 年前后的官方支持表，Flutter 支持 Android SDK 24 到 36、iOS 13 到 26、macOS 10.15 到 Tahoe 26、Windows 10/11、Ubuntu 20.04 LTS 到 24.04 LTS，以及主流浏览器的较新版本。具体版本会随 Flutter release 和系统 SDK 变化，实际项目要以官方 supported platforms 页面为准。

适合选择 Flutter 的场景：

1. 团队希望一套 UI 在多端尽量一致。
2. 产品对动画、复杂 UI、自绘控件要求高。
3. 团队愿意接受 Dart 和 Flutter 组件体系。
4. 移动端是主战场，同时希望兼顾桌面或 Web。

风险主要在两点：第一，Flutter 不是 Web DOM 体系，不能直接复用 React/Vue 组件；第二，如果你的产品必须严格贴合 iOS/Android 原生控件习惯，Flutter 的统一渲染既是优势也可能是成本。

## Electron：最成熟的 Web 桌面应用路线

Electron 的优势非常明确：它把 Chromium 和 Node.js 带进桌面应用，让 Web 技术栈可以直接构建 Windows、macOS、Linux 桌面软件。VS Code、Slack、Discord、GitHub Desktop 等产品都证明了这条路线的可行性。

截至 2026-06-04 查阅，Electron 官方仓库约 122k stars，最新 release 为 electron v42.3.3。Electron 官方文档说明每个版本提供 macOS、Windows、Linux 二进制包；当前平台支持包括 macOS Monterey 及以上、Windows 10 及以上、若干主流 Linux 发行版。Electron 23 起已经移除 Windows 7/8/8.1 支持，这和 Chromium 的弃用节奏一致。

适合选择 Electron 的场景：

1. 桌面端是明确目标。
2. 产品需要完整浏览器能力、复杂 Web UI、插件系统或 Node.js 能力。
3. 团队已有成熟 Web 代码，希望最大化复用。
4. 包体积和内存不是第一约束。

不适合的场景：

1. 对安装包体积、冷启动、内存占用非常敏感。
2. 只需要简单系统托盘、小工具、轻量本地客户端。
3. 团队没有持续跟进 Electron/Chromium 安全更新的能力。

## Tauri：轻量桌面应用的新主流候选

Tauri 的思路和 Electron 不同：它不把 Chromium 打包进应用，而是使用系统 WebView，后端能力主要通过 Rust 暴露。官方文档强调，Tauri 应用只包含自身代码和资源，不需要随每个应用捆绑浏览器引擎，因此最小应用体积可以非常小。

Tauri 2.0 已经把移动端纳入同一套平台叙事。官方 v2 文档写明它面向 Linux、macOS、Windows、Android、iOS。开发依赖上，Windows 需要 Microsoft C++ Build Tools 和 WebView2，macOS/iOS 需要 Xcode，移动端还要配置 Android SDK、NDK 和 Rust target。

适合选择 Tauri 的场景：

1. 桌面工具、开发者工具、本地优先应用。
2. 需要比 Electron 更小的安装包和更低资源占用。
3. 团队能接受 Rust，或者至少能维护少量 Rust bridge。
4. 安全边界、本地文件、系统 API 访问需要更细控制。

需要谨慎的地方：

1. 系统 WebView 带来平台差异，不能假设和 Chromium 完全一致。
2. 移动端生态虽然已经进入 v2 体系，但插件、调试、发布经验不如 React Native / Flutter 成熟。
3. Rust 工程能力会影响上限。

## Capacitor：Web 应用移动化的务实路线

Capacitor 是 Ionic 团队维护的 Web Native runtime。它的定位不是“重写一套原生 UI”，而是让现代 Web 应用进入 iOS、Android 和 PWA，同时通过插件访问相机、定位、通知、文件系统等原生能力。

它最适合这类场景：

1. 已经有成熟 Web 应用，希望较快进入 App Store / Google Play。
2. 业务以内容、表单、列表、商城、后台工作流为主。
3. UI 可以接受 WebView 渲染。
4. 团队主要是 Web 前端，不希望大量投入原生 UI。

如果产品大量依赖高性能手势、复杂动画、实时音视频、后台任务、地图导航，Capacitor 仍然可做，但要提前验证插件质量和平台行为。

## Kotlin Multiplatform：更适合原生团队的共享边界

Kotlin Multiplatform 的思路和 React Native、Flutter 不完全一样。它更强调共享业务逻辑、数据层、网络层、状态和部分 UI，而不是一定要把所有平台 UI 都统一起来。Compose Multiplatform 则进一步把 Kotlin 的声明式 UI 扩展到 Android、iOS、Desktop、Web 等目标。

适合选择 Kotlin Multiplatform 的场景：

1. 团队有 Android/Kotlin 经验。
2. 希望 Android 和 iOS 共用业务逻辑，但保留部分原生 UI。
3. 产品长期维护，愿意投入架构分层。
4. 与 JVM、Ktor、Compose、Gradle 生态结合紧密。

它不太像传统 Web 前端方案，前端团队如果没有 Kotlin 经验，引入成本会明显高于 React Native、Flutter 或 Capacitor。

## .NET MAUI：微软技术栈内的多端应用方案

.NET MAUI 是微软的跨平台 UI 框架，目标是用单一 C# 代码库构建 Android、iOS、Windows、macOS 应用。它适合已有 .NET、Visual Studio、C#、企业内网系统经验的团队。

适合场景：

1. 企业内部应用、管理工具、业务系统客户端。
2. 团队已经重度使用 .NET。
3. 需要和 C# 后端、Azure、Windows 桌面生态协同。

如果团队是典型 Web 前端团队，.NET MAUI 的语言和生态切换成本较高，通常不是第一选择。

## Qt：长期支持和复杂 GUI 的老牌方案

Qt 是跨平台 GUI 领域非常成熟的方案，覆盖桌面、移动、嵌入式等方向。相比 Web 前端常见框架，Qt 更常见于工业软件、车机、医疗设备、嵌入式终端、专业桌面工具等场景。

适合选择 Qt 的场景：

1. 项目生命周期长，需要稳定维护和商业支持。
2. 涉及硬件、嵌入式、工业控制、车载等复杂设备。
3. 团队有 C++、QML 或 Qt 经验。
4. 对性能、图形、设备适配、长期维护有严格要求。

如果只是普通 Web 团队要做一个桌面壳，Qt 通常过重；Electron 或 Tauri 会更直接。

## 选型建议

如果你是 Web 前端团队：

1. 做桌面应用，优先 Electron 或 Tauri。
2. 已有 Web 应用想快速进移动端，优先 Capacitor。
3. 做真正移动 App，并希望接近原生体验，优先 React Native + Expo。
4. 愿意接受 Dart，且希望 UI 多端一致，优先 Flutter。

如果你是移动端团队：

1. Android/Kotlin 背景强，可以重点看 Kotlin Multiplatform。
2. 对统一 UI 和多端发布要求高，可以看 Flutter。
3. 产品仍希望利用 React 生态，可以看 React Native。

如果你是企业或工业软件团队：

1. .NET 技术栈深，优先 .NET MAUI。
2. C++/嵌入式/长期支持场景，优先 Qt。
3. 内部桌面工具、开发者工具，可以在 Electron 和 Tauri 之间选。

## 简单决策树

```text
目标是桌面端？
  是 -> 需要完整 Web/Node 能力或已有复杂 Web 应用？
        是 -> Electron
        否 -> 对体积和资源敏感？
              是 -> Tauri
              否 -> Electron / Flutter Desktop / Qt
  否 -> 目标是移动端？
        是 -> 已有 Web 应用要快速套壳？
              是 -> Capacitor
              否 -> 团队熟 React？
                    是 -> React Native + Expo
                    否 -> 接受 Dart 和统一渲染？
                          是 -> Flutter
                          否 -> Kotlin Multiplatform / .NET MAUI / 原生
        否 -> 目标包含嵌入式或工业 GUI？
              是 -> Qt
              否 -> 先重新确认是否真的需要跨平台框架
```

## 不建议只看 Star 数

原草稿里按 Star 数列了几个项目。Star 可以作为生态热度参考，但不能作为选型依据。比如截至查阅时，Flutter 官方仓库约 177k stars，React Native 约 126k stars，Electron 约 122k stars，Tauri 约 107k stars。这个排序只能说明社区关注度，并不能说明哪个更适合当前项目。

更可靠的评估维度是：

1. 目标平台是否是一等公民。
2. 团队已有技能能否迁移。
3. 插件和原生能力是否覆盖核心需求。
4. 构建、调试、发布、热更新、崩溃监控是否成熟。
5. 是否能接受框架的长期升级节奏。
6. 包体积、内存、启动速度是否符合产品要求。
7. 商业授权、LTS、合规、安全策略是否满足团队要求。

## 参考资料

- React Native 官方仓库：[facebook/react-native](https://github.com/facebook/react-native)
- React Native 官方文档：[Get Started with React Native](https://reactnative.dev/docs/environment-setup)
- React Native 官方文档：[Out-of-Tree Platforms](https://reactnative.dev/docs/out-of-tree-platforms)
- Expo 官方文档：[EAS Build](https://docs.expo.dev/build/)
- Flutter 官方仓库：[flutter/flutter](https://github.com/flutter/flutter)
- Flutter 官方文档：[Supported deployment platforms](https://docs.flutter.dev/reference/supported-platforms)
- Electron 官方仓库：[electron/electron](https://github.com/electron/electron)
- Electron 官方文档：[Electron Releases](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- Tauri 官方文档：[What is Tauri?](https://v2.tauri.app/start/)
- Tauri 官方文档：[Prerequisites](https://v2.tauri.app/start/prerequisites/)
- Capacitor 官方文档：[Capacitor Documentation](https://capacitorjs.com/docs/)
- Kotlin 官方文档：[Compose Multiplatform](https://kotlinlang.org/docs/multiplatform/compose-multiplatform.html)
- .NET 官方：[.NET MAUI](https://dotnet.microsoft.com/en-us/apps/maui)
- Qt 官方：[Qt Framework](https://www.qt.io/development/qt-framework)
