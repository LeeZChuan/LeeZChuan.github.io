---
title: 原生表格的虚拟滚动实践（下）
date: 2024-12-16T08:44:18.020Z
update: 2024-12-18T02:42:39.850Z
author: LeeZChuan
categories:
    - 虚拟滚动
    - table
description: 由于业务开发需要在低版本浏览器中使用，所以需要使用原生表格实现虚拟滚动，本篇分享表格横向的虚拟滚动。
---

## 前言

本篇文章分享如何实现横向的虚拟滚动。

## 原生表格的横向虚拟滚动

### 原生表格-横向

> 在原文中提到这个方案：

横向虚拟滚动
当表格的列非常多时，也会导致表格渲染卡顿，所以如何在原生组件下实现了横向的虚拟滚动。横向虚拟滚动的开启前提是所有列的宽度都已知，这使横向的实现更加直截了当。根据当前的偏移量和最大渲染宽度，就可以精确地算出渲染范围，不再需要缓存来记录每一列的实际/预估宽度了。

{{< image src="images/blog/virtual03.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="实现3"  webp="false" >}}

不过左右两侧锁列的存在给实现带来了一定的麻烦：锁定的列不需要进行虚拟滚动。为了使横向虚拟滚动与锁列兼容，组件将所有列分为五个部分，从左至右依次为：left-lock, left-blank, center, right-blank, right-lock。根据 offset / maxRenderWidth 计算渲染范围时，组件要先根据锁列部分对输入进行调整，从而计算出非锁列部分的渲染范围（即算出 center 部分对应的下标）。在实际渲染时，组件会用一个宽度很大的单元格来替代 left-blank 所对应的多个单元格（right-blank 同理）。

表头包含嵌套结构（一个父节点下可以放置多个子节点），故其横向虚拟滚动实现会更加麻烦一些。因为父节点并不对应实际的表格列，横向虚拟滚动只与叶子节点相关。在计算得到横向的渲染范围之后，组件会根据「所需要渲染的叶子节点的列表」计算出「需要渲染的父节点的列表」，同样的，计算过程中要特别注意锁列带来的影响。

横向滚动时，td 单元格数量可能不断发生变化，相应的父节点的 colSpan 也会不断发生变化，使得单元格的宽度变化较大。当单元格宽度变小时，内容较多的表头的单元格高度会自动增大，导致整个表头行变高；继续滚动，单元格因为虚拟滚动而不再渲染，整个表头行又会突然变回原值，使得横向滚动时表头高度不断抖动。

:::TIP
因为表头默认开启了吸顶，表头大部分情况下会固定在页面顶部，此类抖动的视觉效果非常明显。所以 ali-react-table 默认关闭了表头的虚拟滚动，避免此类抖动；而纵向虚拟滚动会在表格超过 100 行时自动开启，横向虚拟滚动会在 100 列以上时自动开启。
:::

### 虚拟滚动中的「过扫描」

> 在某些电视机中，过扫描是一种行为，其中输入图片的一部分显示在屏幕的可视范围之外。之所以存在，是因为1930年代到2000年代初期的阴极射线管电视机在视频图像在屏幕边界内的定位方式上存在很大差异。后来，在图像周围出现黑色边缘的视频信号已成为惯例，电视本应以这种方式将其丢弃。

在虚拟滚动场景下，我们也需要 overscan —— 表格单元格的渲染范围不仅要充满可视区域，还要向可视区域四周延伸一定的距离。overscan 有以下优势：

- 焦点切换：按下Tab 键时，焦点可以被切换到表格下方部分，触发表格滚动使得表格渲染更多行或列
- 减少重渲染频率：滚动距离较小时，可以确保上一次的渲染内容仍会充满可视区域，不需要再触发 re-render
- 减少白屏时间：缓慢滚动的时候，部分元素已经提前渲染好了，减少白屏时间

{{< image src="images/blog/overscan.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="overscan"  webp="false" >}}

根据上述逻辑：ali-react-table 目前的延伸距离为 100px，在算出虚拟滚动的渲染范围（startIndex / endIndex）之后，组件会再根据 100px 去渲染额外的行或列。4 个方向都需要根据 overscan 调整渲染范围，其中向上的代码如下（其他方向的代码类似）：

```js
// 计算向上 overscan 的渲染范围
 function overscanUpwards(topIndex: number, topBlank: number) {
      let overscanSize = 0
      let overscanCount = 0
      while (overscanCount < topIndex && overscanSize < OVERSCAN_SIZE) {
        overscanCount += 1
        overscanSize += cache[topIndex - overscanCount]
      }
      return {
        topIndex: topIndex - overscanCount,
        topBlank: topBlank - overscanSize,
      }
    }

// 计算向下 overscan 的渲染范围
function overscanDownwards(bottomIndex: number, bottomBlank: number) {
      let overscanSize = 0
      let overscanCount = 0
      while (overscanCount < rowCount - bottomIndex && overscanSize < OVERSCAN_SIZE) {
        overscanSize += cache[bottomIndex + overscanCount]
        overscanCount += 1
      }
      return {
        bottomIndex: bottomIndex + overscanCount,
        bottomBlank: bottomBlank - overscanSize,
      }
    }
```


### 交叉表（new feature）

除了常见的行列数据，展示交叉数据或透视数据也是常见的表格需求。前述的 BaseTable 只能够展示行列异构的数据：行（dataSource）负责提供数据，列（columns）控制表格如何展现；而交叉/透视数据的行表头和列表头是同构的（行表头和列表头都是树状结构）。为了方便展示行列同构数据，我们基于 BaseTable 实现了一个简单的交叉表格（CrossTable），专门应对「行表头和列表头都是一棵树」 的场景。

ali-react-table/pivot 提供的交叉表（CrossTable）也是一个较为底层的 React 组件，仅提供表格结构的渲染能力。CrossTable 的渲染过程可认为是：左树 + 上树 => 表格。大致使用方式如下：

```js
<CrossTable
  // 推荐为交叉表设置一个默认列宽
  :defaultColumnWidth="100"
	// leftTree, topTree 均为 { key, value, children } 的嵌套树状结构
  :leftTree="leftTree"
  :topTree="topTree"
  :getValue="(leftNode, topNode) => {
    // 自定义的取数逻辑，针对每个单元格都会调用一次
    // leftNode 表示当前单元格对应的左侧树节点，topNode 是对应的上方树节点
  }"
  :render="(value, leftNode, topNode) => {
    // 可选的 自定义的渲染逻辑
    return value
  }}"
/>
```

### 由于交叉表可能引入一个横向滚动的问题：

#### 虚拟滚动与单元格合并（解决方案）

{{< image src="images/blog/col-rowspan01.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="row01"  webp="false" >}}

虚拟滚动的一个问题是会导致单元格合并失效。如上图，左上角的单元格设置了 colSpan=3 和 rowSpan=3，当页面向上滚动时，因虚拟滚动该单元格未被渲染，导致其余单元格合并失效。

{{< image src="images/blog/col-rowspan02.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="row01"  webp="false" >}}

一种解法是为各个单元格平滑地设置 colSpan/rowSpan，这样不论实际渲染时左上角是哪一个单元格，所有渲染的单元格都能正确地进行合并。不过这种方式对于上层开发者来说心智负担太大，使用成本过高。

从另一个视角看，所有的单元格都在一个大的矩形内，我选择了让上层开发者提供矩形的边界坐标（top/right/bottom/left），组件内部负责平滑设置 colSpan/rowSpan，以此降低使用成本。在 API 层面，除了可以通过 column.getCellProps 返回 colSpan/rowSpan 之外，表格组件也支持 column.getSpanRect 返回合并后的矩形边界坐标来设置单元格合并信息（虽然实际用下来仍然很复杂，但 API 清晰了很多）。

另外值得一提的点是，因为表格只会渲染视野中的那部分，而开发者是按照完整的表格来设置 rowSpan/colSpan 的，所以偶尔会出现 rowSpan/colSpan 过大的情况。此时组件内部要对 rowSpan/colSpan 进行处理，避免合并单元格越过表格边界。

## 参考

1. https://www.yuque.com/shinima/blog/nbgglx
2. https://www.yuque.com/shinima/blog/llo9ro
