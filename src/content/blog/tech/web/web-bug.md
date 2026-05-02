---
title: "开发web中遇到的一些兼容问题汇总"
description: "整理 Vue 或 React 开发移动端 H5 时高频遇到的浏览器、WebView、输入框、滚动、媒体与 SSR 兼容问题"
date: 2026-04-30T02:50:05.321Z
tags: ["前端", "H5", "Vue", "React", "兼容问题"]
---

这篇文章用来记录移动端 H5 开发里经常遇到的兼容问题。这里说的 H5，不只是浏览器里的普通网页，也包括微信、企业微信、钉钉、App 内嵌 WebView、iOS Safari、Android Chrome/WebView 这些真实运行环境。

下面的清单结合官方文档、MDN、Chrome/WebKit 相关说明，以及近一年社区里反复出现的 H5 踩坑文章整理而来。这里的“高频”不是严格统计排名，而是按移动端项目里最容易反复出现、社区讨论最多、对 Vue/React 项目影响最大的维度整理。

## 先给结论

Vue 和 React 在 H5 兼容问题上，大部分坑不是框架本身造成的，而是浏览器和 WebView 的差异被框架放大了。

典型情况是：

- CSS 视口、键盘、滚动、媒体播放属于浏览器问题，Vue/React 都会遇到；
- 表单输入、中文输入法、受控组件、`v-model` 属于浏览器事件和框架抽象叠加后的问题；
- SSR hydration、路由滚动恢复、DOM 更新时机属于框架特有问题；
- 微信、钉钉、App WebView 属于宿主环境问题，不能只按 Chrome/Safari 来判断。

所以解决 H5 兼容问题时，不要只问“Vue 怎么修”或“React 怎么修”，先判断它属于哪一层：

```text
浏览器/系统层 -> WebView/宿主层 -> 框架层 -> 业务代码层
```

## 高频兼容问题清单

1. **【通用】`100vh` 不等于真实可视高度**

   **问题**：全屏页面、底部按钮、弹窗高度使用 `100vh` 后，在移动端会被地址栏、工具栏或底部手势区域遮挡。

   **平台内容**：Vue / React 通用，常见于 iOS Safari、Android Chrome、App 内嵌 WebView。

   **解决方案**：优先使用 `100dvh`、`100svh`；需要兼容旧 WebView 时，用 JS 写入 `--vh` 变量；全屏容器不要只依赖 `100vh`。

2. **【通用】软键盘弹出后可视区域计算不准**

   **问题**：输入框聚焦后，布局视口和真实可视视口不一致，底部输入框或提交按钮被键盘盖住。

   **平台内容**：Vue / React 通用，常见于 iOS Safari、WKWebView、微信 iOS WebView。

   **解决方案**：使用 `window.visualViewport` 监听 `resize/scroll`；聚焦后必要时调用 `scrollIntoView`；键盘打开时底部栏尽量改为普通文档流布局。

3. **【通用】`input/textarea` 聚焦后页面整体上移**

   **问题**：iOS 设备上输入框唤起键盘后，页面被整体顶起，失焦后滚动位置不恢复。

   **平台内容**：Vue / React 通用，常见于 iOS Safari、微信 iOS WebView。

   **解决方案**：聚焦前记录 `scrollY`，失焦后延迟 `window.scrollTo` 恢复；复杂表单使用独立滚动容器，避免 body 直接滚动。

4. **【通用】底部 `position: fixed` 在键盘弹起时错位**

   **问题**：底部固定按钮、输入栏、操作栏在键盘弹出后漂浮到错误位置，或者被键盘遮挡。

   **平台内容**：Vue / React 通用，常见于 iOS Safari、Android WebView。

   **解决方案**：键盘打开时隐藏固定底栏，或把底栏改为内容流的一部分；必要时结合 `visualViewport.height` 计算偏移。

5. **【通用】刘海屏和 Home Indicator 遮挡底部操作区**

   **问题**：iPhone 刘海屏、底部手势条会遮挡按钮、TabBar 或提交区域。

   **平台内容**：Vue / React 通用，常见于 iPhone X 及之后机型。

   **解决方案**：viewport 添加 `viewport-fit=cover`；底部区域使用 `padding-bottom: env(safe-area-inset-bottom)`。

6. **【通用】`position: sticky` 不生效**

   **问题**：吸顶元素设置了 `position: sticky`，但滚动时没有吸附。

   **平台内容**：Vue / React 通用，常见于 Safari、iOS WebView、复杂滚动容器。

   **解决方案**：检查是否设置了 `top/bottom`；排查父级是否有 `overflow: hidden/auto`；兼容要求高时改用 JS 吸顶。

7. **【通用】`position: fixed` 被父级 transform 影响**

   **问题**：fixed 元素本应相对视口定位，但父级存在 `transform`、`filter`、`perspective` 时会相对父级定位。

   **平台内容**：Vue / React 通用，移动端和桌面端都可能出现。

   **解决方案**：把 fixed 弹窗、Toast、遮罩挂到根节点；Vue 使用 `Teleport`，React 使用 `Portal`；避免祖先元素创建 containing block。

8. **【通用】弹窗内部滚动带动底层页面滚动**

   **问题**：弹窗内容滚动到顶部或底部后，继续滑动会带动底层页面滚动。

   **平台内容**：Vue / React 通用，常见于移动端浏览器和 WebView。

   **解决方案**：支持环境使用 `overscroll-behavior: contain`；iOS 仍需要 body scroll lock 和滚动边界判断。

9. **【通用】弹窗锁 body 滚动后页面跳到顶部**

   **问题**：弹窗打开时锁定 body 滚动，关闭后页面滚动位置丢失。

   **平台内容**：Vue / React 通用，常见于 iOS Safari、微信 WebView。

   **解决方案**：打开弹窗前保存 `scrollY`；body 设置 `position: fixed; top: -scrollY`；关闭弹窗后恢复样式并滚回原位置。

10. **【通用】滚动容器在 iOS 上没有惯性滚动**

    **问题**：局部滚动区域在 iOS 上滚动不顺滑，缺少原生惯性效果。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、WKWebView。

    **解决方案**：滚动容器设置 `overflow-y: auto` 和 `-webkit-overflow-scrolling: touch`；减少嵌套滚动。

11. **【通用】`-webkit-overflow-scrolling: touch` 偶现白屏或滚动失效**

    **问题**：开启 iOS 惯性滚动后，复杂页面中可能出现白屏、滚动层失效或滚动位置异常。

    **平台内容**：Vue / React 通用，常见于 iOS WebView。

    **解决方案**：避免滚动容器频繁销毁重建；减少 fixed、transform、嵌套滚动组合；必要时关闭惯性滚动。

12. **【通用】`scrollTop` 读写对象不一致**

    **问题**：有的环境需要读 `document.body.scrollTop`，有的环境需要读 `document.documentElement.scrollTop`。

    **平台内容**：Vue / React 通用，iOS、Android 都可能遇到。

    **解决方案**：优先使用 `document.scrollingElement`；不要写死 `document.body.scrollTop`。

13. **【Vue/React】SPA 路由切换后滚动位置不符合预期**

    **问题**：进入新页面没有回到顶部，或者返回列表页时滚动位置丢失。

    **平台内容**：Vue Router / React Router，常见于 Vue、React SPA。

    **解决方案**：Vue Router 配置 `scrollBehavior`；React Router 使用 `ScrollRestoration` 或自定义滚动恢复逻辑。

14. **【通用】下拉刷新和滚动回弹影响交互**

    **问题**：页面下拉时触发浏览器刷新，或 iOS 回弹影响自定义下拉、弹窗滑动。

    **平台内容**：Vue / React 通用，常见于 Android Chrome、iOS Safari。

    **解决方案**：Android 可用 `overscroll-behavior`；iOS 需要结合 body lock、滚动边界判断和宿主能力。

15. **【通用】1px 边框在高 DPR 屏幕上太粗或发虚**

    **问题**：设计稿里的 1px 分割线在 Retina 或高 DPR 设备上显示不一致。

    **平台内容**：Vue / React 通用，常见于 Retina 屏和安卓高分屏。

    **解决方案**：用伪元素配合 `transform: scaleY(.5)`；或使用 `border-image`、SVG、设计侧统一视觉规范。

16. **【通用】伪元素高度不够或不撑开布局**

    **问题**：使用 `::before`、`::after` 做装饰或边框时，高度不够、位置错乱，甚至完全不显示。

    **平台内容**：Vue / React 通用，各端都可能出现。

    **解决方案**：伪元素必须写 `content`；需要参与布局时设置 `display: block/inline-block`；装饰类伪元素用绝对定位更稳定。

17. **【通用】iOS 自动放大小字号输入框**

    **问题**：输入框聚焦时页面被自动放大，影响布局和返回后的缩放比例。

    **平台内容**：Vue / React 通用，常见于 iOS Safari。

    **解决方案**：输入框字体至少设置为 `16px`；不要用小字号 input 再靠 transform 缩放。

18. **【通用】iOS 横竖屏切换后字体被自动放大**

    **问题**：横竖屏切换后，文本字号被 Safari 自动调整，页面排版错乱。

    **平台内容**：Vue / React 通用，常见于 iOS Safari。

    **解决方案**：设置 `-webkit-text-size-adjust: 100%`；关键文本区域不要依赖浏览器自动缩放。

19. **【通用】移动端点击延迟、点击高亮和快速点击误触**

    **问题**：点击按钮有延迟、出现蓝色或灰色高亮，快速点击时触发异常。

    **平台内容**：Vue / React 通用，常见于老 Android、部分 WebView。

    **解决方案**：设置正确 viewport；使用 Pointer Events 或 `touch-action: manipulation`；去掉 `-webkit-tap-highlight-color`。

20. **【React 更常见】`touchmove` 中 `preventDefault` 被忽略**

    **问题**：在触摸事件中调用 `preventDefault`，但浏览器仍然滚动页面。

    **平台内容**：Vue / React 都会遇到，React 中更常见，常见于 Chrome Android、iOS Safari。

    **解决方案**：原生绑定时显式 `{ passive: false }`；React 中用 `ref.addEventListener` 手动绑定；优先用 CSS `touch-action`。

21. **【通用】同时绑定 `touchend` 和 `click` 导致事件执行两次**

    **问题**：一个按钮在移动端触摸后，业务逻辑执行两遍。

    **平台内容**：Vue / React 通用，移动端浏览器和 WebView 都可能出现。

    **解决方案**：统一使用 Pointer Events；或只保留一种事件；必要时用时间戳去重。

22. **【通用】`flex gap` 在旧 iOS 或旧 WebView 不生效**

    **问题**：Flex 布局中使用 `gap`，旧设备上间距消失。

    **平台内容**：Vue / React 通用，常见于 iOS 14 以下、旧 Android WebView。

    **解决方案**：使用 PostCSS 降级或 margin fallback；组件库不要默认假设 flex gap 可用。

23. **【通用】`backdrop-filter` 毛玻璃不可用或性能差**

    **问题**：毛玻璃效果在旧设备不显示，或者导致页面滚动明显卡顿。

    **平台内容**：Vue / React 通用，常见于旧 iOS、旧 Android WebView。

    **解决方案**：使用 `@supports` 做降级；提供半透明背景兜底；列表页不要大面积使用。

24. **【通用】CSS `env(safe-area-inset-*)` 没生效**

    **问题**：写了安全区变量，但底部 padding 没有效果。

    **平台内容**：Vue / React 通用，常见于 iOS Safari。

    **解决方案**：检查 viewport 是否有 `viewport-fit=cover`；给 `env()` 加 fallback；老 iOS 可兼容 `constant()`。

25. **【通用】`input type="number"` 无法限制 `maxlength`**

    **问题**：手机号、验证码使用 `type="number"` 后，`maxlength` 不生效，前导 0 也可能丢失。

    **平台内容**：Vue / React 通用，iOS、Android 都常见。

    **解决方案**：手机号、验证码、身份证使用 `type="text"` + `inputmode="numeric"`；格式校验由业务自己处理。

26. **【通用】数字键盘和小数键盘表现不一致**

    **问题**：同样的输入配置，在 iOS 和 Android 上弹出的键盘类型不同。

    **平台内容**：Vue / React 通用，常见于 iOS、Android。

    **解决方案**：使用 `inputmode="numeric/decimal/tel"`；不要只依赖 `type="number"`。

27. **【通用】日期输入控件 UI 和校验不一致**

    **问题**：`input type="date"`、`datetime-local` 在不同浏览器里的 UI、格式和校验表现不一致。

    **平台内容**：Vue / React 通用，常见于 Safari、Android WebView。

    **解决方案**：业务强依赖格式时使用自定义日期选择器；提交前统一转成标准格式。

28. **【通用】`input type="datetime"` 已废弃或无实现**

    **问题**：使用 `type="datetime"` 后，多数现代浏览器不会按预期显示日期时间控件。

    **平台内容**：Vue / React 通用，多数现代浏览器都会受影响。

    **解决方案**：改用 `datetime-local` 或自定义日期时间组件。

29. **【通用】`placeholder` 和 `textarea` 默认样式差异**

    **问题**：输入框默认高度、行高、内边距在 iOS 和 Android 上不一致。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、Android WebView。

    **解决方案**：重置 `appearance`、`line-height`、`padding`；不要依赖系统默认控件高度。

30. **【通用】`-webkit-text-security` 非标准且表现不稳定**

    **问题**：用 `-webkit-text-security` 做密码或验证码遮罩时，iOS 支持不稳定。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、WebView。

    **解决方案**：优先使用 `type="password"`；自定义安全输入框时用分格展示和真实值分离。

31. **【Vue】中文输入法组合过程中 `v-model` 不实时更新**

    **问题**：中文、日文、韩文输入时，composition 期间 `v-model` 不会实时同步，导致搜索或校验延迟。

    **平台内容**：Vue 表单、搜索框，移动端和桌面端 IME 都会出现。

    **解决方案**：Vue 文档明确说明 IME composition 期间不会更新；实时搜索要监听 `compositionend` 后再触发。

32. **【React】受控输入框遇到中文输入法提前触发搜索**

    **问题**：React controlled input 中，`onChange` 和 composition 事件顺序会导致中文输入过程中提前触发搜索或过滤。

    **平台内容**：React controlled input，移动端和桌面端 IME 都可能出现。

    **解决方案**：用 `onCompositionStart/End` 标记 composing；组合期间只更新显示值，不触发搜索/过滤。

33. **【Vue/React】输入框自动高度计算不准**

    **问题**：评论框、textarea 自动增高时，刚更新值就读取高度，得到的 `scrollHeight` 不准确。

    **平台内容**：Vue / React 通用，常见于 textarea、评论框。

    **解决方案**：修改值后等待 DOM 更新；Vue 用 `nextTick`，React 用 `useLayoutEffect` 或 `requestAnimationFrame` 再读尺寸。

34. **【通用】`autofocus` 在移动端不可靠**

    **问题**：页面加载后希望自动聚焦输入框并唤起键盘，但移动端经常无效。

    **平台内容**：Vue / React 通用，常见于 iOS、Android。

    **解决方案**：只能在用户手势后调用 `focus()`；进入页面自动聚焦不要作为关键流程。

35. **【通用】文件上传 `accept/capture` 行为不一致**

    **问题**：同样的上传配置，在 iOS 和 Android 上调起相机、相册、文件选择器的行为不同。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、Android Chrome、微信。

    **解决方案**：做好能力兜底；不要假设一定能直接打开相机；微信内可考虑 JS-SDK 能力。

36. **【通用】复制到剪贴板失败**

    **问题**：调用 Clipboard API 复制文本，在 HTTP、WebView 或没有用户手势时失败。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、WebView、HTTP 页面。

    **解决方案**：Clipboard API 要求 HTTPS 和用户激活；失败时回退到手动选择文本或旧方案。

37. **【通用】视频自动播放失败**

    **问题**：页面加载后调用 `video.play()`，移动端浏览器拒绝自动播放。

    **平台内容**：Vue / React 通用，常见于 iOS Safari、Android Chrome。

    **解决方案**：自动播放通常需要 `muted`、`playsinline`；同时准备用户点击播放兜底。

38. **【通用】iOS 视频自动全屏或不能内联播放**

    **问题**：视频在 iPhone 上播放时自动进入全屏，而不是在页面内播放。

    **平台内容**：Vue / React 通用，常见于 iPhone Safari、部分 WebView。

    **解决方案**：`video` 加 `playsinline`；React 中写 `playsInline`；必要时补充宿主 WebView 要求的参数。

39. **【通用】音频播放必须用户手势触发**

    **问题**：页面加载、接口返回或定时器里调用 `audio.play()`，移动端浏览器拒绝播放。

    **平台内容**：Vue / React 通用，常见于 iOS、Android。

    **解决方案**：首次播放放在按钮点击等用户手势内；不要在页面加载或异步回调里直接播放。

40. **【通用】Canvas 绘制跨域图片后导出失败**

    **问题**：Canvas 绘制远程图片后，调用 `toDataURL` 或 `toBlob` 报 tainted canvas 错误。

    **平台内容**：Vue / React 通用，各端都可能出现。

    **解决方案**：图片设置 `crossOrigin` 且必须在 `src` 前设置；服务端返回正确 CORS 头。

41. **【通用】相机/麦克风 `getUserMedia` 不可用**

    **问题**：调用摄像头或麦克风失败，或者在 iframe、WebView 中直接不可用。

    **平台内容**：Vue / React 通用，常见于 HTTP、iframe、部分 WebView。

    **解决方案**：必须 HTTPS 或 localhost；iframe 需要 `allow="camera; microphone"`；做好权限拒绝兜底。

42. **【通用】原生分享 `navigator.share` 不可用**

    **问题**：移动端原生分享能力在桌面浏览器、部分 WebView 或特定参数下不可用。

    **平台内容**：Vue / React 通用，常见于桌面浏览器、部分 WebView。

    **解决方案**：先判断 `navigator.share` 和 `navigator.canShare`；不支持时展示复制链接或二维码。

43. **【通用】本地存储在隐私模式或 WebView 中异常**

    **问题**：`localStorage/sessionStorage` 在隐私模式或特殊 WebView 中读写失败。

    **平台内容**：Vue / React 通用，常见于 iOS Safari 隐私模式、内嵌 WebView。

    **解决方案**：所有 storage 读写加 `try/catch`；关键数据不要只存在本地；大数据使用 IndexedDB。

44. **【Vue/React PWA】Service Worker 缓存导致用户看到旧页面**

    **问题**：H5 发版后，用户仍然加载旧 JS、旧 HTML 或旧接口缓存。

    **平台内容**：Vue / React PWA，常见于 PWA、离线包、强缓存策略项目。

    **解决方案**：做版本号和更新提示；关键资源加 hash；必要时主动 `skipWaiting` 并清理旧缓存。

45. **【Vue/React】SSR hydration mismatch**

    **问题**：服务端 HTML 和客户端首屏渲染结果不一致，导致 hydration 警告或节点重建。

    **平台内容**：Vue SSR / React SSR，常见于 Nuxt、Next、Vite SSR。

    **解决方案**：避免首屏使用随机数、时间、浏览器 API；保证服务端和客户端首屏数据一致。

46. **【Vue】SSR 中无效 HTML 结构导致 hydration mismatch**

    **问题**：服务端输出了无效 HTML，浏览器解析时自动修正，客户端 hydration 时结构对不上。

    **平台内容**：Vue SSR，常见于 Nuxt、Vue SSR。

    **解决方案**：避免 `<p><div></div></p>`、表格缺 `<tbody>` 等无效结构；必要时用 `data-allow-mismatch` 限定。

47. **【React】SSR 中读取 `window/localStorage` 导致首屏不一致**

    **问题**：服务端无法读取浏览器 API，客户端首屏又依赖这些数据，导致报错或 hydration mismatch。

    **平台内容**：React SSR，常见于 Next.js、Remix。

    **解决方案**：浏览器 API 放到 `useEffect`；不可 SSR 的组件动态导入；少量不可避免差异用 `suppressHydrationWarning`。

48. **【Vue】路由缓存页面返回后状态和滚动位置残留**

    **问题**：列表页、详情页使用 KeepAlive 后，返回页面时状态残留或滚动位置异常。

    **平台内容**：Vue、Vue Router、KeepAlive。

    **解决方案**：在 `onActivated/onDeactivated` 中恢复或重置状态；列表页单独保存滚动位置。

49. **【React】开发环境 StrictMode 下 effect 执行两次**

    **问题**：React 18+ 开发环境里 effect 会被额外执行一次，容易误以为移动端重复请求或重复埋点。

    **平台内容**：React 18+ 开发环境。

    **解决方案**：effect 写成可清理、可重复执行；请求加 abort 或幂等保护；生产环境单独验证。

50. **【Vue/React】状态更新后马上读取 DOM 尺寸不准确**

    **问题**：状态刚更新就读取 DOM 尺寸，弹窗、虚拟列表、textarea、吸顶位置计算不准。

    **平台内容**：Vue / React 通用，常见于弹窗、虚拟列表、textarea、吸顶组件。

    **解决方案**：Vue 用 `await nextTick()`；React 用 `useLayoutEffect`；复杂场景再套一层 `requestAnimationFrame`。

## 常用兜底片段

### 1. 移动端真实高度变量

`100vh` 是 H5 里最常见的坑之一。比较稳的做法是 CSS 新单位优先，老环境用 JS 写变量兜底。

```css
.page {
  min-height: 100svh;
  min-height: 100dvh;
}

.page-legacy {
  min-height: calc(var(--vh, 1vh) * 100);
}
```

```js
function setRealVh() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

setRealVh()
window.addEventListener('resize', setRealVh)
```

### 2. iOS 安全区域

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
/>
```

```css
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 3. React 中文输入法组合态

```tsx
const composingRef = useRef(false)

function SearchInput() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false
        const next = e.currentTarget.value
        setValue(next)
        search(next)
      }}
      onChange={(e) => {
        const next = e.target.value
        setValue(next)
        if (!composingRef.current) search(next)
      }}
    />
  )
}
```

### 4. Vue 中文输入法组合态

```vue
<template>
  <input
    v-model="keyword"
    @compositionstart="composing = true"
    @compositionend="onCompositionEnd"
    @input="onInput"
  />
</template>

<script setup>
import { ref } from 'vue'

const keyword = ref('')
const composing = ref(false)

function onCompositionEnd(event) {
  composing.value = false
  keyword.value = event.target.value
  search(keyword.value)
}

function onInput() {
  if (!composing.value) search(keyword.value)
}
</script>
```

### 5. 弹窗锁 body 滚动

```js
let lockedScrollY = 0

export function lockBodyScroll() {
  lockedScrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

export function unlockBodyScroll() {
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}
```

## 我自己的处理原则

移动端 H5 兼容问题不能只靠“记坑”。我现在更倾向于按下面的顺序处理：

1. 先判断是系统浏览器问题、WebView 宿主问题，还是 Vue/React 抽象带来的问题；
2. CSS 能解决的，不用 JS；
3. 原生 API 有安全上下文要求的，一律判断能力再调用；
4. 输入法、键盘、滚动问题必须真机测试，模拟器和 DevTools 不够；
5. 组件库里要给旧 WebView 留 fallback，不要只按最新 Chrome 判断；
6. SSR 项目里，凡是依赖 `window`、时间、随机数、本地存储的内容，都不要直接参与服务端首屏渲染。

## 资料来源

- [MDN: VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
- [MDN: CSS env() and safe-area variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [MDN: position sticky/fixed](https://developer.mozilla.org/docs/Web/CSS/position)
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior)
- [MDN: -webkit-overflow-scrolling](https://mdn2.netlify.app/en-us/docs/web/css/-webkit-overflow-scrolling/)
- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- [MDN: input type date](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date)
- [MDN: input type datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)
- [MDN: video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [MDN: getUserMedia](https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Clipboard writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [Chrome Developers: Making touch scrolling fast by default](https://developer.chrome.com/blog/scrolling-intervention)
- [Vue SSR Guide: Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)
- [Vue 2 Form Input Bindings: IME composition](https://v2.vuejs.org/v2/guide/forms?redirect=true)
- [React hydrateRoot docs](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React issue: Composition Events problem in controlled components](https://github.com/facebook/react/issues/8683)
