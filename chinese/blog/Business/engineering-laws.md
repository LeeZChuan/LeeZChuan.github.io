---
title: 13个软件工程定律
meta_title: ""
description: 在开发过程中有很多可能常见的开发定律
date: 2025-04-16T05:58:41.024Z
categories:
    - 互联网名词
    - 软件工程
author: LeeZChuan
tags:
    - 互联网名词
    - 软件工程
update: 2025-04-16T05:58:41.579Z
---

## 一些有趣的开发定律

### 1.Parkinson’s law  帕金森定律

{{< notice "tip" >}}
Work expands to fill the available time.
工作范围扩大以填补可用时间。
{{< /notice >}}

- 通过设置截止日期，您可能会获得更好的开发结果。
- 这一切都是为了应对范围、资源和时间的铁三角。

### 2.Hofstadter’s law  霍夫施塔特定律

{{< notice "tip" >}}
It always takes longer than you expect, even when you take into account Hofstadter’s Law.
它总是比您预期的要长，即使您考虑到霍夫施塔特定律也是如此。
{{< /notice >}}

- 就是在评估项目代码开发周期的时候如果总是使用`Parkinson’s law `就会出现项目周期总是被延期

- 这个问题没有很好的解决方案,只能通过同事之间,大量的对齐和沟通,出具可协商的范围

- 不要把开发周期浪费在不必要的事情上,您需要了解的有关为什么软件中的估算如此困难的所有信息。如果频繁将时间浪费在无意义的事情上,开发周期必定会推迟。


### 3. Brooks’ law  布鲁克斯定律

{{< notice "tip" >}}
Adding manpower to a late software project makes it later.
为后期软件项目增加人力会让它更晚。
{{< /notice >}}


- 大多数新开发的软件或者项目并不完全掌握这项定律。他们认为现实更类似于林格尔曼效应 （我们稍后会介绍）。 假设您有 4 个人参与一个后期项目，并且为您提供了另外 2 名高级工程师。您知道它不会增加 50% 的生产力，但您认为您肯定会至少提高 5-10%。

- 很多时候，现实是开发周期并不一定会缩短!

- （当然，这取决于许多变量。就像这里的每条法律一样，它有其局限性）。


### 4.Conway’s law (and the Inverse Conway's law) 康威定律（和逆康威定律）


{{< notice "tip" >}}
Organizations produce designs which are copies of the communication structures of these organizations.
组织生成的设计是这些组织的通信结构的副本。
{{< /notice >}}

- 比如一个saas项目,拥有单独的前端和后端团队。由于这些团队单独运作，因此他们的沟通流程会影响产品最后的交付

- 前端团队构建一个 UI，该 UI 需要特定格式的数据

- 后端团队根据自己的假设构建 API

- API 响应与前端预期的不完全匹配，需要额外的转换。

- 随着时间的推移，SaaS 应用程序最终会带来额外的胶水代码层和效率低下 ，因为团队没有密切合作

### 5.Cunningham’s law  坎宁安定律

{{< notice "tip" >}}
The best way to get the right answer on the internet is not to ask a question, but to post the wrong answer.
在互联网上获得正确答案的最佳方法不是提出问题，而是发布错误的答案。
{{< /notice >}}

- 原文提到一个提交流程:

- 无需向 DevOps 团队提交请求，等待他们确定优先级，并最终完成它，只需打开一个 Pull-Request 即可自己完成。 即使你不知道自己在做什么。 查看合并的 PR，找到一个类似的 PR，然后尽力而为。

1. The DevOps team will see your PR and say “wtf is this?”
DevOps 团队会看到你的 PR 并说“这是什么鬼？

2. They’ll reply quickly on the PR with what needs to be fixed
他们会在 PR 上快速回复需要修复的内容

3. You’ll have better knowledge of what to do next time
您将更好地了解下次该做什么

4. The DevOps team will gradually standardize this process with automation and policies
DevOps 团队将通过自动化和策略逐步标准化此流程

### 6.Sturgeon’s law  斯特金定律
{{< notice "tip" >}}
90% of everything is crap.
90% 的东西都是废话。
{{< /notice >}}

你发布的大部分功能都会没用，一小部分会是你公司的核心产品。 当人们谈论 10 倍（或 100 倍）工程师时 ，不是工程师创造了 10 倍以上的代码，而是那些为公司创造了 10 倍价值的工程师。

### 7.Zawinski’s law  Zawinski 定律

{{< notice "tip" >}}
Every program attempts to expand until it can read mail. Those programs which cannot so expand are replaced by ones that can.
每个程序都会尝试扩展，直到它可以读取邮件。那些不能如此扩展的程序被那些可以扩展的程序所取代。
{{< /notice >}}

- 不要给自己的app加过多没有用的功能

- 这就是功能蠕变的发生方式 - 不断添加功能，以至于它们破坏了产品的价值。用户抱怨产品变得过于复杂或令人困惑，或者找不到他们需要的功能。尤其是新鲜的完全丢失了！


### 8.Hyrum’s law  海仑律法

{{< notice "tip" >}}
With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody.
如果 API 的用户数量足够多，您在合同中承诺什么并不重要：您系统的所有可观察行为都将由某人依赖。
{{< /notice >}}


- 当软件上线后,根据`Zawinski’s law  Zawinski 定律`来说,90% 的东西都是废话.

- 但是，您仍然会花费大量时间来维护 100% 的功能 - 因为一旦你发布了某些东西，至少会有一个客户会使用它。当你试图删除它时，他们当然会抱怨......一些业务利益相关者会向您施压，要求您继续支持该功能。

- 我已经在 功能标志正在破坏你的代码库 中讨论了这个问题 。功能标志是一个很好的工具，但它们可能会被“滥用”，让 PM 有借口不做出艰难的决定 ，例如从代码库中完全删除功能。



## 9.Price’s law  普莱斯定律

{{< notice "tip" >}}
In any group, 50% of the work is done by the square root number of people.
在任何组中，50% 的工作是由平方根人数完成的。
{{< /notice >}}

- 如果您有 10 名工程师，则一半的产出可以归属于其中的 3 名工程师。

- 在 100 名工程师中，有 10 名将产生与其他 90 名工程师相似的输出。

- 扩大团队规模是困难的。如果你想让你的产出增加 2 倍，普莱斯定律意味着你需要多雇佣 4 倍的人。该定律的一种解释是`林格尔曼效应`：

### 10.The Ringelmann effect  林格尔曼效应

{{< notice "tip" >}}
The tendency for individual members of a group to become increasingly less productive as the size of their group increases.
随着群体规模的增加，群体中的个体成员的工作效率越来越低的趋势。
{{< /notice >}}

- PostHog 写了一篇关于(小型工程团队的魔力)[https://newsletter.posthog.com/p/the-magic-of-small-engineering-teams]的文章 （他们有 47 人组织了 15 个团队）。

### 11.Goodhart’s law  古德哈特定律

{{< notice "tip" >}}
When a measure becomes a target, it ceases to be a good measure.
当度量值成为目标时，它就不再是一个好的度量值。
{{< /notice >}}

- 这个很有名。它在技术领域不断被抛出，说你不应该测量代码行或 PR，因为人们会（理所当然地）玩弄它。



### 12.Gilb’s law  吉尔布定律

{{< notice "tip" >}}
Anything you need to quantify can be measured in some way that is superior to not measuring it at all.
你需要量化的任何东西都可以以某种方式进行测量，这比根本不测量它要好。
{{< /notice >}}

- 这是对古德哈特定律的一个很好的平衡。与其“放弃”测量，不如从某事开始并努力改进它。

### 13.Murphy’s law  墨菲定律

{{< notice "tip" >}}
Anything that can go wrong will go wrong.
任何可能出错的事情都会出错。
{{< /notice >}}

- 我相信你也经历过这样的事情：
- 您承受着发布功能的压力。只有一个边缘情况，测试起来非常复杂，你确定它永远不会发生。所以你决定偷工减料。
- 但是未来总有一次会在线上复现这个问题
