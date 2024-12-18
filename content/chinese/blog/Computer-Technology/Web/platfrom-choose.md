---
title: TODO:前端开发中的流程自动化与提效实践
date: 2024-12-18T11:59:15.247Z
update: 2024-12-18T11:59:14.616Z
categories:
    - Web前端
    - 计算机技术
    - 跨平台
author: LeeZChuan
tags:
    - Web前端
    - 计算机技术
    - 跨平台
description: 跨平台前端平台技术整理
---



## 前言

在开发过程中，我们常常需要处理各种平台，如Android、iOS、Web等。为了提高开发效率，我们需要选择合适的跨平台技术。本文将介绍几种常用的跨平台技术；

## 跨平台技术

### 1. React Native--Star数：120k

React Native 是 Facebook 开发的一款跨平台移动应用开发框架，它允许开发者使用 JavaScript 和 React 来构建原生移动应用。React Native 的优点是性能较好，可以复用代码，但缺点是学习曲线较陡峭，需要掌握 React 和原生开发技能。React Native 的主要应用场景是移动应用开发。

{{< notice "tip" >}}
React Native 开发的应用只能在 iOS 15.1 和 Android 7.0 (API 24) 或更高版本上使用。
{{< /notice >}}


### 2. Flutter--Star数：167k

Flutter 是 Google 开发的一款跨平台移动应用开发框架，它允许开发者使用 Dart 语言来构建原生移动应用。Flutter 的优点是性能较好，可以复用代码，但缺点是学习曲线较陡峭，需要掌握 Dart 语言。Flutter 的主要应用场景是移动应用开发。

{{< notice "tip" >}}
React Native 开发的应用只能在 iOS 15.1 和 Android 7.0 (API 24) 或更高版本上使用。
{{< /notice >}}

### 3. Electron--Star数：115k

Electron 是一款跨平台桌面应用开发框架，它允许开发者使用 JavaScript、HTML 和 CSS 来构建桌面应用。Electron 的优点是开发效率高，可以复用 Web 开发技能，但缺点是性能较差，需要处理更多的兼容性问题。Electron 的主要应用场景是桌面应用开发。

{{< notice "tip" >}}
- ‌Electron 22.0.0‌是最后一个支持Windows 7的版本。
- 在这个版本中，Electron包括了新的实用进程API、对Windows 7/8/8.1支持的更新，以及对Chromium 108、V8 10.8和Node.js 16.17.1的升级。
- 从Electron 23.0.0开始，Electron取消了对Windows 7/8.1的支持，这标志着Electron将不再支持这些旧版本的操作系统。
- 此外，这一变化与Chromium的弃用政策相符，也呼应了Microsoft对Windows 7 ESU（扩展安全更新）和Windows 8.1扩展支持结束的政策‌。
- 具体的发行版本可以参考：https://www.electronjs.org/zh/docs/latest/tutorial/electron-timelines
{{< /notice >}}

#### 4. tauri--Star数：87.2k

tauri 是一款跨平台桌面应用开发框架，它允许开发者使用 Rust 和前端技术（如 React、Vue、Svelte 等）来构建桌面应用。tauri 的优点是性能较好，可以复用 Web 开发技能，但缺点是学习曲线较陡峭，需要掌握 Rust 语言。tauri 的主要应用场景是桌面应用开发和移动端开发。

目前官方介绍该项目支持的版本是：

{{< notice "tip" >}}
- Windows平台7及以上
- macOS 10.15及以上-
Linux webkit2gtk 4.0 for Tauri v1 (for example Ubuntu 18.04). webkit2gtk 4.1 for Tauri v2 (for example Ubuntu 22.04). 
- iOS/iPadOS (beta) 9及以上
- Android (beta) 7及以上。
{{< /notice >}}


美团在最近也设计了自己的框架：

{{< image src="images/blog/web-design.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="美团框架选择"  webp="false" >}}


## 其他资料-关于跨平台技术选型

- https://www.v2ex.com/t/938959
- https://www.v2ex.com/t/952400
- https://www.v2ex.com/t/955166
- https://zhuanlan.zhihu.com/p/520770477
- https://medium.com/@maxel333/comparing-desktop-application-development-frameworks-electron-flutter-tauri-react-native-and-fd2712765377