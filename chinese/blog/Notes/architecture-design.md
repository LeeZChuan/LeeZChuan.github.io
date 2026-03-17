---
title: "架构设计笔记"
meta_title: ""
description: "阅读架构设计的笔记"
date: 2023-12-01 20:04:00
update: 2024-10-12 20:01:00
categories: ["架构设计", "前端"]
author: "LeeZChuan"
tags: ["架构设计", "前端"]
draft: false
---

该文章将目前可能能用到的架构理念，概念统一汇总整理～

> 多态

- 多态：多态的实际含义是:同一操作作用于不同的对象上面，可以产生不同的解释和不同的执行结 果。换句话说，给不同的对象发送同一个消息的时候，这些对象会根据这个消息分别给出不同的反馈。
- 多态背后的思想是将“做什么”和“谁去做以及怎样去做”分离开来，也就是将“不变的事 物”与 “可能改变的事物”分离开来。
- **把不变的部分隔离出来，把可变的部分封装起来，这给予了我们 扩展程序的能力**
- 使用继承来得到多态效果，是让对象表现出多态性的最常用手段。

> 高阶函数实现AOP

> 把这些功能抽离出来之后， 再通过“动态织入”的方式掺入业务逻辑模块中。这样做的好处首先是可以保持业务逻辑模块的纯净和高内聚性，其次是可以很方便地复用日志统计等功能模块。

1. currying
2. uncurrying
3. 分时函数
4. 惰性加载函数
   > 在 Web 开发中，因为浏览器之间的实现差异，一些嗅探工作总是不可避免。比如我们需要一个在各个浏览器中能够通用的事件绑定函数 addEvent，常见的写法如下:

```js
var addEvent = function (elem, type, handler) {
  if (window.addEventListener) {
    return elem.addEventListener(type, handler, false);
  }

  if (window.attachEvent) {
    return elem.attachEvent("on" + type, handler);
  }
};
```

> 第二种方案是这样，我们把嗅探浏览器的操作提前到代码加载的时候，在代码加载的时候就立刻进行一次判断，以便让 addEvent 返回一个包裹了正确逻辑的函数。代码如下:

```js
var addEvent = (function () {
  if (window.addEventListener) {
    return function (elem, type, handler) {
      elem.addEventListener(type, handler, false);
    };
  }
  if (window.attachEvent) {
    return function (elem, type, handler) {
      elem.attachEvent("on" + type, handler);
    };
  }
})();
```

> 单例模式

> 全局变量存在很多问题，减少全局变量声明，1. 使用命名空间；2. 使用闭包封装私有变量

> 代理模式
> 代理模式包括许多小分类，在 JavaScript 开发中最常用的是虚拟代理和缓存代理。虽然代理 模式非常有用，但我们在编写业务代码的时候，往往不需要去预先猜测是否需要使用代理模式。 当真正发现不方便直接访问某个对象的时候，再编写代理也不迟
