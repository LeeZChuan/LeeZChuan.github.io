---
title: 原生表格的虚拟滚动实践（上）
date: 2024-12-16T08:44:18.020Z
update: 2024-12-16T08:44:18.694Z
author: LeeZChuan
categories:
  - 计算机技术
  - 虚拟滚动
description: 由于业务开发需要在低版本浏览器中使用，所以需要使用原生表格实现虚拟滚动，本篇仅分享表格竖向的虚拟滚动。
---

## 前言

在前端开发中，表格一直都是最复杂的组件之一，由于公司业务，需要在低版本浏览器中使用，并且需要实现固定列，所以市面上使用（使用position:sticky 实现粘性布局）的方案就被pass掉了，因为该特性只能在浏览器56版本以上才能使用，需要使用原生表格实现虚拟滚动，本篇仅分享表格竖向的虚拟滚动。

## 原生表格的虚拟滚动

### 原生表格

原生表格的虚拟滚动，主要是指使用原生表格标签，通过计算表格的`scrollTop`来控制表格的显示区域，从而实现表格的虚拟滚动。

### 使用

```js
// 这个表格使用核心就是传入两个数组，一个是列数组，一个是原始数据
<BaseTable
  :dataSource="dataSource"
  :columns="columns"
/>
```

### 原生表格（竖向）虚拟滚动实现

> 核心是使用padding的top与bottom来控制表格的显示区域，通过监听表格的scroll事件，来计算表格的scrollTop，从而控制表格的显示区域。流程如下：

{{< image src="images/blog/virtual01.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="实现1"  webp="false" >}}

> 核心需要根据当前下述状态中startIndex与endIndex乘以trHeight的去计算顶部padding与底部padding的高度，但是这种会导致渲染上存在一些渲染闪烁的问题，底层原因就是浏览器性能，在mac或者高性能电脑上就不是很明显

```js
this.virtualState = {
  // trHeight 一个行元素高度
  trHeight: 20,
  // 当前渲染的数据量
  containSize: 0,
  // 当前需要展示的表格dom高度
  tableDomHeight: 0,
  // 虚拟滚动当前列表的开始下标
  startIndex: 0,
  // 虚拟滚动当前列表的结束下标
  endIndex: 0,
  // 顶部填充
  topFill: 0,
  //底部填充
  bottomFill: 0,
  // 滚动距离顶部的距离
  scrollTop: 0,
};
```

### 优化方案1:

但是实际上这样会导致表格的滚动不流畅，因为每次滚动都会重新计算表格的scrollTop，所以需要使用requestAnimationFrame来优化，每次滚动都会将当前的scrollTop保存起来，然后在requestAnimationFrame中计算表格的scrollTop，从而实现表格的平滑滚动。

### 优化方案2-参考react-virtualized这个组件使用：

> 缓存表格的预估行高:

{{< image src="images/blog/virtual02.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="实现2"  webp="false" >}}

> 平滑滚动的要点
> 平滑性也是虚拟滚动的要点之一，滚动过程中应当避免因 blank 或行高变化而产生的抖动。滚动分为两种：

- 缓慢滚动：上一次渲染的行 与 下一次渲染的行有交集
- 快速滚动：上一次渲染的行 与 下一次渲染的行没有交集，# 即两次渲染之间部分行被跳过了

{{< image src="images/blog/virtual04.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="实现4"  webp="false" >}}

> 为了实现稳定高效且平滑的虚拟滚动，组件要注意以下几点：

- 缓慢滚动时，一些行会出现或消失，topBlank/bottomBlank 要同步地发生变化
- 例如向下滚动时，表格底部出现新的一行，行高为 50px，那么此时 bottomBlank 要同步地减小 50px
- 快速滚动时，要在短时间内给出一个大致的渲染范围；范围不需要很准确，要计算过程要快
- 渲染范围的计算结果要保持稳定：
- 相同的输入产生相同的输出
- 较大的 offset 会产生较大的 startIndex/endIndex，较大的 maxRenderHeight 会渲染更多的行
- 滚动到底部时，bottomBlank 的计算结果要等于 0，endIndex 要等于 dataSource.length



## 参考

1. https://www.yuque.com/shinima/blog/nbgglx
2. https://www.yuque.com/shinima/blog/llo9ro
