---
title: Canvas 图片渲染问题解决方案
description: 使用不同 AI 模型解决 Canvas 中 Base64 图片渲染和缓存问题的实践对比
date: 2024-12-03
tags: [Canvas, 前端开发, AI辅助编程]
---

在开发 Canvas 图片绘制功能时，遇到了两个典型问题：Base64 图片首次渲染失败，以及频繁重绘导致图片闪烁。本文记录了使用不同 AI 模型（DeepSeek 和 ChatGPT-4）解决这些问题的过程。

## 问题描述

### 问题 1：Base64 图片首次渲染失败

原始代码对 Base64 和普通 URL 采用不同处理：

```javascript
if (src.includes('base64')) {
  img.src = src;
  ctx.drawImage(img, x, y, width, height);
} else {
  img.src = src;
  img.onload = () => {
    ctx.drawImage(img, x, y, width, height);
  };
}
```

Base64 图片直接绘制，导致图片数据未完全解码就调用 `drawImage`，首次渲染失败。

### 问题 2：频繁重绘导致闪烁

统一使用 `onload` 后，每次 Canvas 交互都会重新创建 Image 对象，导致图片不断消失再出现。

## AI 辅助解决方案对比

### DeepSeek V3 方案

DeepSeek 提出了离屏 Canvas + 双缓冲的方案：

```javascript
const offscreenCache = new WeakMap<CanvasRenderingContext2D, OffscreenCanvas>();

export function drawImage(ctx, attrs, styles) {
  const images = Array.isArray(attrs) ? attrs : [attrs];
  const { opacity = 1 } = styles;

  let offscreen = offscreenCache.get(ctx);
  if (!offscreen) {
    offscreen = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
    offscreenCache.set(ctx, offscreen);
  }
  const offCtx = offscreen.getContext('2d');

  images.forEach(({ x, y, width, height, src }) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    new Promise<void>((resolve, reject) => {
      img.onload = () => {
        offCtx.globalAlpha = opacity;
        offCtx.drawImage(img, x, y, width, height);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    }).catch(() => console.error(`Image load failed: ${src}`));
  });

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(offscreen, 0, 0);
}
```

**特点**：
- 使用 WeakMap 管理离屏 Canvas
- Promise 封装异步加载
- 双缓冲避免闪烁

**问题**：方案过于复杂，对原有代码改动较大，引入了较多新概念。

### ChatGPT-4o 方案

ChatGPT 提出了图片对象缓存的简洁方案：

```javascript
let cachedImages: Record<string, HTMLImageElement> = {};

export function drawImage(ctx, attrs, styles) {
  let images: ImageAttrs[] = [];
  images = images.concat(attrs);

  const { opacity = 1 } = styles;
  ctx.globalAlpha = opacity;

  images.map(({ x, y, width, height, src }) => {
    let img = cachedImages[src];

    if (!img) {
      img = new Image();
      img.src = src;

      img.onload = () => {
        cachedImages[src] = img;
        ctx.drawImage(img, x, y, width, height);
      };
    } else {
      ctx.drawImage(img, x, y, width, height);
    }
  });
}
```

**特点**：
- 简单的对象缓存机制
- 统一的异步加载流程
- 改动最小化

## 最终优化方案

基于 ChatGPT 方案进一步优化，处理多个相同 src 的场景：

```typescript
let cachedImages: Record<string, HTMLImageElement> = {};

export function drawImage(
  ctx: CanvasRenderingContext2D,
  attrs: ImageAttrs | ImageAttrs[],
  styles: Partial<ImageStyle>
): void {
  let images: ImageAttrs[] = [];
  images = images.concat(attrs);

  const { opacity = 1 } = styles;
  ctx.globalAlpha = opacity;

  images.map(({ x, y, width, height, src }, index) => {
    const cacheKey = `${src}_${index}`;
    let img = cachedImages[cacheKey];

    if (!img) {
      img = new Image();
      img.src = src;

      img.onload = () => {
        cachedImages[cacheKey] = img;
        ctx.drawImage(img, x, y, width, height);
      };
    } else {
      ctx.drawImage(img, x, y, width, height);
    }
  });
}
```

## 结论

在这次实践中：

- **DeepSeek** 的方案更加理论化和全面，但可能过度设计
- **ChatGPT-4o** 的方案更贴近实际需求，简洁有效
- 最佳实践是理解问题本质，选择足够好而非完美的方案

对于实际开发：
1. 优先考虑简单方案
2. 避免过度工程化
3. 保持代码可维护性
4. 根据实际场景逐步优化
