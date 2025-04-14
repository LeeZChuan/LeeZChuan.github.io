---
title: Nginx在微信中的实战经验总结
date: 2025-04-14T06:44:48.023Z
update: 2025-04-14T06:44:48.824Z
author: LeeZChuan
categories:
    - 计算机技术
    - 服务器
    - Nginx
description: 由于需要修改线上需求,但是目前与后端沟通之后,不想要提供预发环境pre于是只能在正式环境开一个8080端口作为预发环境进行线上回归验收。
---

## 核心解决方案

- 由于发布的时候是在正式环境开一个8080端口作为访问路径,但是三方服务对接的时候还是使用的正式环境80端口,所以这里需要nginx配置修改一下逻辑;

{{< image src="images/blog/nginx-wx.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="nginx-wx"  webp="false" >}}

看上述截图可以看到访问到正式环境并且链接中有`/miniMarketAuth`和`/qhfMarketAuth`的时候就带着后续参数重定向到8080端口,这样就可以在申请新服务器与域名的情况下使用原有域名模拟预发环境进行测试

nginx参数解释:
```md
1. proxy_pass 是 Nginx 中的一个指令，用于将请求代理到另一个服务器或 URL。

2. $host 是 Nginx 中的一个变量，表示当前请求的主机名（hostname）。$host 的值是当前请求的主机名，也就是说，如果请求的 URL 是 http://example.com/path，那么 $host 的值就是 example.com。这个变量通常用于构造重写规则或代理请求时的 URL。

3. $1 是 Nginx 中的一个变量，表示正则表达式中第一个捕获组（capture group）的值。在上述代码中，(.*) 是一个正则表达式，用于匹配任意字符（包括空字符串）。圆括号 () 将这个表达式定义为一个捕获组。当 Nginx 匹配这个正则表达式时，捕获组的值将被存储在 $1 中。例如，如果请求的 URL 是 /path/to/resource，那么 $1 的值将是 /path/to/resource。在重写规则中，$1 被用于将原始 URL 的路径部分追加到重写后的 URL 上

4. $arg_openId 是 Nginx 中的一个变量，表示当前请求的 URL 参数 openId 的值。
```



