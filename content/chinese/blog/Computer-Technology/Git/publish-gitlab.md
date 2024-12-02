---
title: git依赖包发布
date: 2024-10-26T02:40:53.341Z
author: "LeeZChuan"
categories: ["git",'gitlab', "npm","内网部署"]
description: "自己开发的npm包如何发布到公网与内网"
---



> 最近在开发npm包，需要发布到内网或者公网，便于是乎调研有多少种方案

### 方案一：使用gitlab构建平台

#### 1. 如何发布

首先去gitlab平台对应你要发布的平台勾选对应的权限，然后创建你所需要的**token**，
在这里我创建了本次项目所需要的**zcharts_token**,
![gitlab-token](/assets/images/gitlab-token.png)

然后在windows配置全局token：

```sh
set NPM_TOKEN=xxxxxx;

// 确保你的token配置成功：
sh echo $NPM_TOKEN # Unix/macOS echo %NPM_TOKEN% # Windows
```


就可以正常发布了：`npm publish --registry=http://192.168.86.82/api/v4/projects/3606/packages/npm/`

#### 2. 如何在新项目中引入私有仓库

> 首先在项目中创建.npmrc文件

```sh
#@scope:registry=https://your_domain_name/api/v4/projects/your_project_id/packages/npm/
#//your_domain_name/api/v4/projects/your_project_id/packages/npm/:_authToken="${NPM_TOKEN}"
# 格式:
#  - scope：你的scopename
#  - your_domain_name：你的gitlab域名或ip
#  - your_project_id：你的仓库id
#  - NPM_TOKEN：用户发布的用户token
 
# 示例
@znz:registry=http://192.168.86.82/api/v4/projects/3606/packages/npm/
# 你可以直接将token写在这里(token需要写入你的环境变量)
//192.168.86.82/api/v4/projects/3606/packages/npm/:_authToken=${NPM_TOKEN}
```

> 然后通过npm i @znz/zcharts的形式就可以引入项目了，注意使用内网安装一定要@znz这是需要本地判断是否使用内网的依据，不然还是走本机配置的npm路径进行安装依赖


从下方安装依赖的路径可以看到是从ip内网安装的该依赖：

![npm-register](/assets/images/npm-register.png)


> 也可以使用该命令安装依赖：

`npm install @znz/znz-chart@0.2.0 --registry=http://repositories.compass.com/api/v4/projects/3606/packages/npm/ --//repositories.compass.com/api/v4/projects/3606/packages/npm/:_authToken=xxxxxx`


## 方案二：使用内网搭建一个npmserver

> 具体其实就是使用：https://verdaccio.org/docs/what-is-verdaccio


## 方案三：使用公网npm平台

最常用的就是在npm网站注册登陆自己的用户，然后使用npm publish发布自己的包，但是缺点就是需要公网ip，如果在内网的话，就需要使用内网穿透工具，比如frp等，但是这种方式需要额外配置，而且需要公网ip，所以不推荐使用。


## 参考文档
https://docs.gitlab.com/ee/user/packages/package_registry/
https://docs.gitlab.com/ee/user/packages/npm_registry/
https://docs.gitlab.com/ee/user/packages/yarn_repository/

