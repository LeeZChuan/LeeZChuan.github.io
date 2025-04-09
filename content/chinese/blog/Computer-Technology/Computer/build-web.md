---
title: 如何在远程服务器上部署项目
date: 2025-04-09T05:45:35.966Z
update: 2025-04-09T05:45:36.495Z
author: LeeZChuan
categories:
    - 远程部署
    - web
description: 如何将本地开发的代码部署到远程服务器上
---

## 前言

- 现在开发一个项目,从项目立项到开始开发,在github或者gitee上开发
- 本地运行没问题,肯定要走发布流程,让客户进行验收,这时候就需要远程服务器发布了
- 本次就聊聊,顺带记录一下如何发布

## 一、申请远程服务器

远程服务器现在市面上有很多供应商提供很多服务器,比如阿里、腾讯,我本次就购买了阿里的服务器《轻量应用服务器》

一系列操作之后就可以进入平台,我选择的都是默认的配置,然后点击`远程连接`,就可以进入到阿里提供的服务器上

{{< image src="images/blog/build-web/1.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="1"  webp="false" >}}

阿里远程提供了一个简易版的ai助手,如果一时想不起linux命令就可以问问他,还是有点方便的

{{< image src="images/blog/build-web/2.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="2"  webp="false" >}}


## 二、远程服务器环境搭建

- 接下来就是常规的环境配置了,包含node、git、nginx环境配置:

### 1.yum -y install git

### 2.yum install nodejs

- 这里也可以使用wget下载:
wget https://nodejs.org/dist/v16.14.0/node-v16.14.0-linux-x64.tar.xz

- 解压文件的 bin 目录底下包含了 node、npm 等命令
tar xf node-v16.14.0-linux-x64.tar.xz

- 把nodejs bin目录添加到环境变量

```md
1、备份老文件，防止改错弄坏服务器
cp /etc/profile /etc/profile_old

2、修改环境变量
vi /etc/profile     在文件尾部添加 export PATH=$PATH:/opt/node-v16.14.0-linux-x64/bin

3、刷新环境变量
source /etc/profile

node -v      输出版本号 16.14.0 即为配置成功
```

由于我的项目是大于18的所以我配置了20的环境变量

{{< image src="images/blog/build-web/3.png" caption="" alt="" height="" width="" position="center" command="fill"  class="img-fluid" title="3"  webp="false" >}}


### 3.sudo yum -y install nginx

- 安装好了可以访问nginx配置文件使用：vim /etc/nginx/nginx.conf

- 具体环境变量如何配置,请参考我的nginx那篇文章的讲解即可

## 三、发布代码

上述流程走完就该git拉代码,然后本地build代码,配置nginx路径就可以了,一切上述完成,你的网页就正式在公网可以访问了


## 四、公网域名处理

官方也提供了域名申请服务,按照自己的需求申请域名即可,一般常规的域名价格不会太高,一年100块钱左右