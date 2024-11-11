---
title: 微信小程序与钉钉小程序开发流程
date: 2022-11-11 11:52:00
update: 2022-11-11 11:52:00
author: "LeeZChuan"
categories: ["计算机技术", "小程序","WX"]
description: 微信小程序开发与钉钉小程序开发的移动端兼容上有很多需要注意的点。

---

开发小程序有很多问题特此记录一下～～～

> 小程序开发（移动端开发）兼容注意事项：

1. ios不兼容yyyy-MM-dd HH:mm:ss这种时间格式，需要将-替换成/，在安卓下两种格式都支持。
2. 使用window.location.reload()方法刷新页面，在安卓下无效。
3. 正常情况下使用window.location.replace()方法跳转页面时会覆盖当前页面而不会生成新的history记录，但是在安卓下依然会生成history记录。
4. ios中，父元素设置border-radius和overflow:hidden实现圆角。如果此时子元素使用了transform属性会导致父元素的圆角失效。


5. 小程序中使用web-view打开pdf, IOS 可以正常打开，Android 打开为空白；
6. 微信小程序分包加载，需要注意单个分包或者主包大小不要超过2m
7. uni-app的坑，尤其是弹窗官方提供的uni-popup，存在ref引用销毁问题，导致点击多次无法正常绘制了，需要自己写弹窗逻辑（能不用官方的插件尽量不用，有很多性能问题都是官方插件引起，比如日期控件或者弹窗控件都会产城一些未知bug）
8. 安卓与ios在很多地方api不能共用，比如数字转换添加千分位这个问题，安卓就不支持（JS内置 API （`toLocaleString`），ios是支持的，但是在安卓的浏览器内核中不存在这个api无法正常转译），具体可以看链接：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString

> 虚拟滚动的实现思路

基本思路就是动态渲染一个div中的元素组件一般是4-10个模块，实现了数据量200条数据但是只需要10个模块

（1）给需要滚动的组件添加padding-top与padding-bottom，然后分别计算这两个相对的像素值

（2）或者父元素使用绝对定位，其中动态的div使用相对定位，然后使用两栏或者三栏布局使用卡片式渲染，不断推动向下渲染即可

（3）难点有二：用户快速滑动可能也会导致渲染白屏，优化体验可以考虑使用降低用户的滑动速度或者是增加更多的渲染模块

