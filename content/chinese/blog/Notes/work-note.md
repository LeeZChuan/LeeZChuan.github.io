---
title: "工作中遇到的比较有意义的问题"
meta_title: ""
description: "工作解决的bug记录"
date: 2023-12-01 20:04:00
update: 2025-11-18 20:01:00
categories: ["架构设计", "前端"]
author: "LeeZChuan"
tags: ["架构设计", "前端"]
draft: false
---

## 1.canvas绘制元素优化方案

在2024年年底开发了一个基于zrender的canvas图表库,这个代码库实现了一个树图组件,当初子节点渲染很多导致很卡顿

当时采用了以下方案进行的性能优化

#### 视口裁剪（Viewport Culling）- 核心优化

- **实现智能视口裁剪机制**，只渲染当前可见区域内的节点和边
- **性能提升**：
  - 大数据量场景下（1000+ 节点）渲染性能提升 60-80%
  - 缩放、平移等交互操作响应速度显著提升
  - 内存占用大幅降低，避免不必要的元素创建
- **工作原理**：
  - 实时计算可视区域（viewport）范围
  - 动态过滤可见节点和边，仅渲染在视口内的元素
  - 支持缩放和平移时自动更新可见元素集合
  - 采用高效的边界检测算法，减少计算开销


## 2.ios设备的textarea元素唤起原生键盘让页面整体滚动

具体问题截图效果如下:

{{< image src="images/blog/work-note/01.jpg" caption="" alt="问题截图1" height="" width="" position="center" command="fill" option="q100" class="img-fluid" title="问题截图1"  webp="false" >}}

这个问题在移动端会导致用户点击textarea元素键盘会让页面整体被顶起来

具体修改后的ios工作流程:

{{< notice "note" >}}
```
1. 用户点击 textarea
   ↓
2. textarea 获得焦点 (isFocused = true)
   ↓
3. iOS 系统键盘弹出
   ↓
4. 视口高度变化 (触发 handleViewportChange)
   ↓
5. 检测到键盘弹出 (高度差 > 150px)
   ↓
6. 固定页面高度 (setPageHeight)
   ↓
7. 滚动到 textarea 位置 (scrollToTextarea)
   ↓
8. 防止系统滚动 (handleViewportScroll)
   ↓
9. 用户完成输入，失去焦点
   ↓
10. 键盘收起，恢复页面高度
```
{{< /notice >}}


```vue
/**
     * iOS 键盘适配 - 滚动到 textarea 位置，确保可见
     */
    scrollToTextarea() {
      const textarea = this.$refs.multLIneInputArea;
      if (!textarea) return;
      
      const contentEl = document.querySelector('.content');
      if (!contentEl) return;
      
      // 获取 textarea 相对于 content 的位置
      const textareaRect = textarea.getBoundingClientRect();
      const contentRect = contentEl.getBoundingClientRect();
      
      // 计算需要滚动的距离
      const offsetTop = textareaRect.top - contentRect.top + contentEl.scrollTop;
      const keyboardHeight = this.initialViewportHeight - this.currentViewportHeight;
      const visibleHeight = this.currentViewportHeight;
      
      // 确保 textarea 在可视区域内，留出一些间距
      const targetScrollTop = offsetTop - (visibleHeight - keyboardHeight) / 2;
      
      // 平滑滚动到目标位置
      if (contentEl.scrollTo) {
        contentEl.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      } else {
        contentEl.scrollTop = Math.max(0, targetScrollTop);
      }
    }
```

修改后的效果:
{{< image src="images/blog/work-note/02.jpg" caption="" alt="问题截图2" height="" width="" position="center" command="fill" option="q100" class="img-fluid" title="问题截图2"  webp="false" >}}
