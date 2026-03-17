---
title: CSS Container Queries：真正的组件级响应式布局
description: Media queries 是根据视口尺寸调整样式，而 Container Queries 让我们可以根据父容器的尺寸来调整样式，这才是组件真正需要的响应式能力。
date: 2024-05-12
tags: [CSS, 前端, Web开发]
---

`@media` 查询伴随我们工作了十多年，但它有一个根本的局限：**它依赖视口尺寸，而不是容器尺寸**。

这对组件来说是一个问题。同一个卡片组件，可能在侧边栏里很窄，在主内容区里很宽。用 media query 无法优雅地处理这种场景。

Container Queries 解决了这个问题。

## 基本用法

```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

第一步：给父容器设置 `container-type`
第二步：在 `@container` 规则里写样式

就这么简单。现在 `.card` 的布局会根据 `.card-wrapper` 的宽度变化，而不是视口。

## 命名容器

当存在嵌套容器时，可以给容器命名：

```css
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

.main-content {
  container-type: inline-size;
  container-name: main;
}

@container sidebar (max-width: 300px) {
  .widget {
    display: none;
  }
}

@container main (min-width: 800px) {
  .article {
    columns: 2;
  }
}
```

## 容器查询单位

与 viewport 单位（vw, vh）类似，Container Queries 也有专属单位：

| 单位 | 含义 |
|------|------|
| `cqw` | 容器宽度的 1% |
| `cqh` | 容器高度的 1% |
| `cqi` | 容器 inline 轴的 1% |
| `cqb` | 容器 block 轴的 1% |

```css
.card-title {
  font-size: clamp(1rem, 5cqi, 2rem);
}
```

## 浏览器支持

截至 2024 年，Container Queries 的支持已经相当好：

- Chrome 105+
- Safari 16+
- Firefox 110+

覆盖率超过 90%，可以在生产项目中使用了。

## 实战建议

不要把 Media Queries 全部替换成 Container Queries。它们有不同的适用场景：

- **Media Queries** → 页面级布局，导航栏，整体结构
- **Container Queries** → 组件内部布局，卡片，列表项

结合使用效果最好。

这是近年来 CSS 最重要的特性之一，值得花时间掌握。
