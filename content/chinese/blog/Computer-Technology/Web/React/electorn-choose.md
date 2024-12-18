---
title: Electorn的相关脚手架
date: 2024-12-16T06:37:21.610Z
update: 2024-12-16T06:37:20.925Z
author: LeeZChuan
categories:
  - React
  - 计算机技术
  - Electorn
description: 今年上半年需要开发一个管理后台使用到了React框架，于是便接触一下Electorn框架，用于开发跨平台了解一下目前有哪些可以快速上手的框架代码
---

既然从头学习一门语言，最好的方式还是直接接触全流程的开发是最快的，调研了Electorn一下，目前比较流行的框架有如下几种：

目前有以下几个快速搭建的项目可以参考:

```md
| 项目名称                   | 项目链接                                                                                               | 星标数 | 描述                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------- |
| electron-react-boilerplate | [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) | 23.4k  | 一个用于构建跨平台应用的基础框架，集成了 Electron 和 React。            |
| electron-vue               | [electron-vue](https://github.com/SimulatedGREG/electron-vue)                                          | 15.2k  | 基于 Vue.js 的 Electron 模板，简化了使用 Vue 构建 Electron 应用的过程。 |
| electron-boilerplate       | [electron-boilerplate](https://github.com/sindresorhus/electron-boilerplate)                           | 3.2k   | 一个用于快速启动 Electron 应用开发的模板项目。                          |
| nextron                    | [nextron](https://github.com/saltyshiomix/nextron)                                                     | 2.4k   | 将 Next.js 与 Electron 结合，用于构建桌面应用的框架。                   |
| angular-electron           | [angular-electron](https://github.com/maximegris/angular-electron)                                     | 5.3k   | 集成 Angular 和 Electron 的模板，用于构建跨平台桌面应用。               |
```

由于electron-react-boilerplate这个项目的star数最多并且使用react框架开发，所以便开始这个项目的学习

### electron-react-boilerplate

#### 项目介绍

electron-react-boilerplate 是一个用于构建跨平台桌面应用的模板项目，它集成了 Electron 和 React，并提供了许多有用的配置和工具，使得开发者可以快速开始开发桌面应用。

#### 项目结构

项目结构如下：

```md
├── .electron-vue
│ ├── build.js
│ ├── dev-client.js
│ ├── dev-runner.js
│ ├── webpack.main.config.js
│ ├── webpack.renderer.config.js
│ └── webpack.web.config.js
├── .eslintrc.js
```
