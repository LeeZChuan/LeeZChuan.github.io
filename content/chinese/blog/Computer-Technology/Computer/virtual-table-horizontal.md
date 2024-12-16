---
title: 原生表格的虚拟滚动实践（下）
date: 2024-12-16T08:44:18.020Z
update: 2024-12-16T08:44:18.694Z
author: LeeZChuan
categories:
    - 计算机技术
    - 虚拟滚动
description: 由于业务开发需要在低版本浏览器中使用，所以需要使用原生表格实现虚拟滚动，本篇分享表格横向的虚拟滚动。
---


## 前言

在前端开发中，表格一直都是最复杂的组件之一，由于公司业务，需要在低版本浏览器中使用，并且需要实现固定列，所以市面上使用（使用position:sticky 实现粘性布局）的方案就被pass掉了，因为该特性只能在浏览器56版本以上才能使用，需要使用原生表格实现虚拟滚动，本篇仅分享表格竖向的虚拟滚动。

## 原生表格的横向虚拟滚动

### 原生表格

{{< image src="images/virtual03.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="实现3"  webp="false" >}}

## 参考

1. https://www.yuque.com/shinima/blog/nbgglx
2. https://www.yuque.com/shinima/blog/llo9ro


