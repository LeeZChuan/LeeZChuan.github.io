---
title: 有用的nginx配置
date: 2025-03-07T07:49:50.605Z
update: 2025-03-07T07:49:51.583Z
categories:
    - 计算机技术
    - 服务器
    - Nginx
description: 日常研发少不了上线部署工作,以下列出我工作期间常用的nginx配置
authors: LeeZChuan
keywords: 计算机技术
---



### 一、跨域配置

由于浏览器的安全策略，前端处理跨域请求的概率极高，如下是开启跨域请求常规手段

```nginx
if ($request_method = OPTIONS ) {
    add_header "Access-Control-Allow-Origin"  *;
    add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS, HEAD";
    add_header "Access-Control-Allow-Headers" "Authorization, Origin, X-Requested-With, Content-Type, Accept";
    add_header 'Access-Control-Max-Age' 600;
    return 200;
}
```

### 二、开启Gzip压缩

```nginx
{
  include       conf/mime.types;
  gzip on;
  gzip_min_length  1000;
  gzip_buffers     4 8k;   
  gzip_http_version 1.1; 
  gzip_types       text/plain application/x-javascript text/css application/xml application/javascript application/json;
}
```


```nginx
http {
    # ...

    # gzip
    gzip                on;
    gzip_min_length     20;
    gzip_buffers        4 16k;
    gzip_comp_level     6;
    gzip_types          text/plain text/xml text/css text/javascript application/x-javascript application/javascript application/json;
    gzip_http_version   1.0;
    gzip_disable        "MSIE [1-6]\.";
    gzip_proxied        off;
    gzip_vary           on;

    # ...
}
```

其中有几个配置需要特别注意：

- `gzip_min_length`

  文件大小小于该值的文件将不会被压缩，大于此值时才会被压缩。

- `gzip_buffers`

  设置用于处理请求压缩的缓冲区数量和大小。比如 `32 4K` 表示按照内存页（one memory page）大小以 4K 为单位（即一个系统中内存页为 4K），申请 32 倍的内存空间。通常默认即可。

- `gzip_comp_level`

  设置压缩级别，值为 1-9。压缩级别越高，压缩效果越好，但同时越耗费时间和 CPU 性能，所以通常设置为 6 即可。

- `gzip_types`

  设置要压缩的文件 MIME 类型，默认包含 `text/html`。gzip 只对文本文件的压缩效果较好，不建议设置非文本文件。

- `gzip_http_version`

  设置要进行压缩的 http 协议版本，默认设置为 1.0 即可，因为 nginx 和后端服务器（Server）默认采用 HTTP/1.0 进行通信的，防止出现不压缩的情况。

> 官网文档：[ngx_http_gzip_module](http://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip)


#### 三、使用 $request_id 实现链路追踪


Nginx在1.11.0版本中就提供了内置变量$request_id，其原理就是生成 32 位的随机字符串，虽不能比拟 UUID 的概率，但 32 位的随机字符串的重复概率也是微不足道了，所以一般可视为 UUID 来使用。

```nginx
location ^~ /habo/gid {
        add_header Cache-Control no-store;
        default_type application/javascript;
        set $unionId $cookie_GID;
        if ($unionId = "") {
                set $unionId $request_id;
                add_header Set-Cookie "GID=${unionId};path=/habo/;max-age=${GID_MAX_AGE}";
        }
        return 200 "document.cookie='GID=${unionId};path=/;max-age=${GID_MAX_AGE}'";
    }
```

#### 四、限流配置

其中，控制速率是指限制单位时间内的请求次数，而控制并发连接数是指限制同时处理的请求数量。

下面是一个简单的Nginx限流配置示例，使用leaky bucket算法进行限流：

```nginx
http {
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        location / {
            limit_req zone=one burst=5;
            proxy_pass http://backend;
        }
    }
}
```

在上述配置中，limit_req_zone用于定义一个名为one的共享内存区域，并将其与客户端IP地址相关联。这个共享内存区域最大占用10MB空间，并且允许每秒钟通过 1 个请求。然后，在location块中使用了limit_req指令来启用限流功能。这里设置burst为 5，表示当客户端在短时间内发送超过 1 个请求时，可以暂时容忍一定数量的请求超出限制。
需要注意的是，在实际应用中需要根据具体情况调整参数值以达到最佳效果。如下：
```nginx
map $http_baggage_flow  $plimit {
 "ptest" $server_name;
 default "";
}


limit_req_zone $plimit zone=prelimit:10m rate=600r/s;
 server {
  listen       443 ssl;
  server_name   www.jartto.com;
  limit_req zone=prelimit  nodelay;
  limit_req_status 530;

  location = /530.html {
      default_type application/json;
      return 200 '{"status" : 530}';
  }
  ...
}
```

#### 五、History 二级路由刷新问题

vue-router+webpack项目线上部署时单页项目路由，刷新页面出现 404 问题，一般需要配置如下：

```nginx
location / {
　　root html;
　　try_files $uri $uri/ @router;
　　index index.html index.htm;

}
location @router {
　　rewrite ^.*$ /index.html last;
}
```

完整的路由配置如下:
```nginx
 server {
        listen       80;
        server_name  192.168.86.152;
        # server_name  localhost;
        # 前端项目部署
        location / {
          root /data/MarketWeb/dist;   # 打包后的文件目录
          index index.html index.htm;
          try_files $uri $uri/ /index.html;  # 开启了browserRouter模式就写这个
        }

        location /market {
           absolute_redirect on;
           proxy_pass http://upstream_name;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    
        include /etc/nginx/default.d/*.conf;
        error_page 404 /404.html;
        location = /404.html {}
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {}
    }
```

#### 六、Cookie 路由识别

最常见的场景就是灰度发布，Nginx 来识别来自前端的流量，从而进行转发

```nginx
map $http_cookie $m_upstream {
    ~*baggage-version=isolute-feat-.*$ al-bj-sre-k8s-test-istio-gateway;
    default test.jartto.com;
}

upstream al-bj-sre-k8s-test-istio-gateway {
    server 47.95.128.11:80;
}
```



#### 七、服务端开启图片转换

这里主要是设置 WebP 格式图片:

```nginx
map $http_accept $webp_suffix {
    default   "";
    "~*webp"  ".webp";
}
```

```nginx
location  ~* ^/_nuxt/img/(.+\.png|jpe?g)$ {
    rewrite ^/_nuxt/img/(.+\.png|jpe?g)$ /$1 break;
    root /apps/srv/instance/test-webp.jartto.com/.nuxt/dist/client/img/;
    add_header Vary Accept;
    try_files $uri$webp_suffix $uri =404;
    expires 30d;
}
```


#### 八、负载均衡
负载均衡通常有四种算法：

* 轮询，默认方式，每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务挂了，能自动剔除；
* weight，权重分配，指定轮询几率，权重越高，在被访问的概率越大，用于后端服务器性能不均的情况；
* ip_hash，每个请求按访问 IP 的 hash 结果分配，这样每个访客固定访问一个后端服务器，可以解决动态网页 session 共享问题。负载均衡每次请求都会重新定位到服务器集群中的某一个，那么已经登录某一个服务器的用户再重新定位到另一个服务器，其登录信息将会丢失，这样显然是不妥的；
* fair（第三方），按后端服务器的响应时间分配，响应时间短的优先分配，依赖第三方插件 nginx-upstream-fair，使用前请先安装；

```nginx
http {
  upstream jartto-server {
  	# ip_hash;  # ip_hash 方式
    # fair;   # fair 方式
    server 127.0.0.1:8081;  # 负载均衡目的服务地址
    server 127.0.0.1:8080;
    server 127.0.0.1:8082 weight=10;  # weight 方式，不写默认为 1
  }
 
  server {
    location / {
    	proxy_pass http://jartto-server;
      proxy_connect_timeout 10;
    }
  }
}
```



#### 九、调试技巧

nginx 本身是比较难调试的，不过在配置 `location` 指令时，可以利用 `return` 指令来进行调试。

```nginx
location /test/ {
 return 600;
}
```

此时若访问 **/test/** 路径，可以看到响应码为 `600` 时，说明路径匹配成功。同时，可以添加一些辅助文本信息：

```nginx
location /test/ {
 default_type text/html;
 return 600 'Hello';
}
```

> 官网文档：[ngx_http_rewrite_module/return](http://nginx.org/en/docs/http/ngx_http_rewrite_module.html#return)

#### 十、虚拟目录

虚拟目录解决了客户端请求资源的 **URL** 与服务器端对应资源存在位置不一致的问题。如下所示：

    # 虚拟目录
    location /static/ {
        alias /DataDisk/resources/;
    }

    # 这样，客户端发送 example.com/static/bg.png 的请求实际映射到了服务器端 /DataDisk/resources/bg.png 的资源上

**URL** 作为统一资源定位符，代表的是资源所在的真实网络位置，但在某些情况下，出于安全性、降低逻辑复杂性等因素的考虑，给客户端提供一个虚拟目录可能更好，这个时候使用 `alias` 指令就可以实现。

作为对比，我们使用 `root` 指令通常指定的是真实目录。如下所示：

    # 真实目录
    location /static/ {
        root /DataDisk/resources;
    }

    # 这样，客户端发送 example.com/static/bg.png 的请求实际映射到了服务器端 /DataDisk/resources/static/bg.png 的资源上

可以看出，`root` 指令通常适合用在资源路径完全真实存在的情况下，而 `alias` 指令则更适合用在资源路径前缀部分不是真实存在的情况下。

> 官网文档：[ngx_http_core_module/alias](http://nginx.org/en/docs/http/ngx_http_core_module.html#alias)

#### 十一、文件列表浏览

静态资源服务器一般允许用户查看服务器上的文件列表，例如 CDN、镜像站等。nginx 出于安全考虑，默认是不允许客户端浏览器查看服务器上的文件列表的，可以通过以下指令来进行配置：

```nginx
location /static/ {
    autoindex on;				# 开启客户端文件列表浏览
    autoindex_exact_size off;   # 默认显示的文件确切大小，单位 b，关闭后自动计算 KB/MB/GB 等
    autoindex_localtime on;     # 文件的改动时间以服务器时间为准
}
```

> 官网文档：[ngx_http_autoindex_module](http://nginx.org/en/docs/http/ngx_http_autoindex_module.html)

#### 十二、允许跨域

有时候，比较大（几百兆以上）的静态资源需要在客户端使用异步方式加载（例如 Ajax），但是多个人合作开发时，拷贝这些静态资源到各自本地（如果不这么做，将会出现跨域问题）是最糟糕的解决方案，这个时候我们可以将静态资源放在一个服务器上，然后使用反向代理或者允许跨域的配置巧妙的解决这个问题。

    location /static/ {
        ...

        add_header 'Access-Control-Allow-Origin'      '*';
        add_header 'Access-Control-Allow-Headers'     'Content-Type';
        add_header 'Access-Control-Allow-Credentials' 'true';
    }

- `Access-Control-Allow-Origin`

  必选，这个响应头信息代表的是允许跨域请求的域名，`*` 则表示允许任意域名向此服务器发起跨域请求。

- `Access-Control-Allow-Credentials`

  可选，这个响应头信息代表的是跨域请求是否需要携带 **Cookie** 信息，默认为 `false`，在需要利用 Session-Cookie 机制的情况下务必设置为 `true`。

> 官网文档：[ngx_http_headers_module/add_header](http://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header)

#### 十三、反向代理

Nginx 可以作为一个反向代理服务器，来为我们提供一些场景下的解决方案，例如负载均衡、跨域、前后端完全分离开发场景等等。

    location / {
        proxy_set_header Host            $http_host;
        proxy_set_header X-Real-IP       $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cookie_path /project/ /;
        proxy_pass http://127.0.0.1:8181/project/;
    }

这里有几点需要注意下：

- `proxy_set_header`

  目的是为了保证后端（被代理的）服务器获取到远程客户端的真实信息，相当于将前端（nginx 反向代理）服务器的信息隐藏，造成客户端直接访问后端服务器的“假象”。

  `Host` 应尽可能设置成 `$http_host`，这样会包含完整的 **IP** 和**端口**信息，设置为 `$host` 时将不会包含端口信息。

- `proxy_cookie_path`

  目的是为了在访问路径与代理路径发生改变（不一致）的情况下防止出现客户端 Cookie 丢失的问题。

- `proxy_pass`

  则是后端（被代理）服务器地址。

#### 十四、代理服务路径变化时

如果说在反向代理过程中，路径没有差异，一般来说不会出现什么问题，但是如果路径有变化时，会出现两个问题，一个是 **cookie 丢失**，另一个则是 **后端服务器重定向错误**。 第一个问题可以用 `proxy_cookie_path` 指令解决，第二个问题则使用 `proxy_redirect` 指令解决。具体如下：

```nginx
location /test/ {
  proxy_cookie_path /project/ /test/;
  proxy_pass http://127.0.0.1:8181/project/;
  proxy_redirect ~(https?://[^/]+)?/project/(.*) $scheme://$http_host/test/$2;
}
```

首先，`proxy_pass` 指令配置的代理服务在用户实际访问时路径发生了变化。用户以 **/test/users** 路径访问时，实际被 nginx 代理到后端的服务路径为 **/project/users**，可以明显的看到路径的前缀发生了变化。

此时，`proxy_cookie_path` 指令告诉 nginx 将后端被代理服务的响应头中 cookie_path 进行转换，这样在客户端访问任意路径时，cookie_path 也会保持和访问路径一致，而不是实际代理的服务路径，否则 cookie 将会在客户端丢失。

同时，如果说被代理的服务有重定向需求的话，不配置 `proxy_redirect` 指令，重定向的路径将会发生错误，需要告诉 nginx 将其路径中部分进行替换。例如，用户访问 **/test/**，被代理的服务路径为 **/project/**，此时被代理服务做一个重定向操作到 **/project/index.html**，如果不做转换，用户会直接访问该路径将发生错误。在这里，`proxy_redirect` 指令所做的就是将响应头中 `Location`字段的值由 **/project/index.html** 替换为 **/test/index.html**，这样用户将会正常访问到资源。

> 官网文档：[ngx_http_proxy_module](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)

#### 十五、重定向

重定向是一个比较常见的需求，nginx 的重定向指令（rewrite）还是相当简单的。例如，需要将所有 http 请求重定向到 https 下，官方推荐这么做：

    server {
        listen      80;
        server_name localhost;
        return 301 https://example.com$request_uri;
    }

事实上，也可以用 `rewrite` 指令，不过官方不推荐：

    server {
        ...
        rewrite ^/(.*)$ https://example.com/$1 permanent;
    }

**注意：** `301` 重定向可能会导致 POST 请求被改变为 GET 请求，并可能丢失提交数据，此时使用 `308` 状态码替换即可。

> 官网文档：[ngx_http_rewrite_module](http://nginx.org/en/docs/http/ngx_http_rewrite_module.html)

#### 十六、项目首页重定向

大多数时候，我们在同一个域名下会部署多个 Web 应用，访问的话需要 **WebAppName** 来进行区分，例如 `localhost:80/App`，那么 `App` 其实就代表了一个 Web 应用，将会映射到相应的文件夹。这里有一个细节性问题，文件夹的路径必然以 `/` 结束，所以大多数服务器都会自动做一次重定向，将 `localhost:80/App` 重定向到 `localhost:80/App/`。如果 Nginx 没有配置，默认是不会做这个重定向的，为了用户访问方便，我们需要解决这个问题：

    localhost / {
        # 这是一个默认配置文件中的配置项
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        try_files $uri $uri/ =404;
    }

这个配置基本上解决了该问题，但**在内外网端口不一致时，会出现问题**。例如，我们通过 `www.example.com:80/App` 访问部署在内网 `8080` 端口上的 Nginx 时，Nginx 会将其重定向到 `www.example.com:8080/App/`，这里的差异在于，重定向时丢失了外网端口，用户此时将会访问失败。

目前，还没找到比较优雅的解决办法，可以用以下配置暂时解决该问题：

    location ~ ^/[^/]+$ {
        return 301 $scheme://$http_host$uri/;
    }

#### 十七、日志分割

Nginx 的访问日志（access_log）默认是没有进行分割的，时间一长，日志文件就会有 GB 级别的大小，日志写入速度变慢，也会影响 nginx 的性能。我们可以通过很简单的方式，将访问日志设置为按天记录,将日志记录在不同的文件中。

    server {
        ...
        # cut log by day
        if ($time_iso8601 ~ "^(\d{4})-(\d{2})-(\d{2})") {
            set $year  $1;
            set $month $2;
            set $day   $3;
        }

        access_log  logs/access/host.access-$year-$month-$day.log main;
    }

> 官网文档：[ngx_http_log_module](http://nginx.org/en/docs/http/ngx_http_log_module.html)
