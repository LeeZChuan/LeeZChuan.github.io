---
title: 为什么说useSignal()是Web框架的未来
date: 2024-11-11T06:19:51.214Z
update: 2024-12-18T12:20:48.954Z
author: LeeZChuan
categories:
    - 计算机技术
    - Web前端
    - React
    - JavaScript
description: Angular、Qwik的作者 MIŠKO HEVERY 在文章中盛赞了 useSignal() 这种数据流方案， 表示 useSignal() 是前端框架的未来，并考虑在Angular中实现它。我们在这里不评价文章的观点，我们来看看 useSignal 这个方案的前世今生。
---


## 什么是 useSignal

一个简单的 react 组件是下面这样的：它使用了useState这个hooks钩子函数
{{< image src="images/blog/useState.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="useState"  webp="false" >}}


useSignal()就是 state 和 setState 的改良版本，它写起来是这样的：
{{< image src="images/blog/useSignal.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="useSignal"  webp="false" >}}


虽然看起来没什么特别的，只是省略了一个 setState，但是两者的原理其实完全不同。Signals 和 State 之间的主要区别在于 Signals 返回一个 getter 和一个 setter ，而非响应式系统返回其值（和一个 setter ）。

Signals 是可响应的！就意味着它们会追踪对状态感兴趣的（订阅）人，如果状态发生了变化，就通知订阅者状态发生了变化。要具有响应性，Signals 必须收集谁对 Signals 的值感兴趣（订阅）。他们通过观察在哪些上下文中调用 state-getter 来获得这些信息。通过从 getter 获取值的行为，可以告诉 Signals 这个地方对其值感兴趣。如果值发生更改，则需要使该位置发生重新计算。换句话说，调用 getter 将创建订阅。

综上所述 Signals 其实是一个订阅发布系统，只是订阅这个步骤是自动实现的，这样的好处是不需要diff，也不需要死去活来的不断调用 App，减少开销。

它其实有点像vue的ref或者react的useRef；但是实际上：useRef（） 的使用与 useSignal（） 完全相同，用于传递对 state 的引用，而不是 state 本身。useRef（） 缺少的是订阅跟踪和通知。
