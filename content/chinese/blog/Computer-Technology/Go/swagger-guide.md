---
title: Go 后端开发学习笔记-引入swagger
date: 2025-04-16T12:36:08.501Z
update: 2025-04-16T12:36:09.163Z
author: LeeZChuan
categories:
    - 计算机技术
    - 编程语言
    - Go
description: 如何在go项目中引入swagger。
---

# Swagger API 文档集成指南

## 1. 安装 Swagger 工具

### 方法一：手动安装
```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

### 方法二：使用 Makefile（推荐）
项目已经集成了自动安装功能，只需要运行：
```bash
make swagger
```
这个命令会自动检查并安装 swag 工具。

## 2. 添加依赖

在项目中添加以下依赖：
```bash
go get -u github.com/swaggo/gin-swagger github.com/swaggo/files
```

## 3. 配置 Swagger

### 3.1 在 main.go 中添加配置

在 `cmd/server/main.go` 文件中添加以下内容：

```go
import (
    // ... 其他导入
    _ "front-page/docs" // 导入生成的 Swagger 文档
    swaggerFiles "github.com/swaggo/files"
    ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Front Page API
// @version         1.0
// @description     Front Page 项目的 API 文档
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

func main() {
    // ... 其他代码
    
    // 添加 Swagger 路由
    router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
    
    // ... 其他代码
}
```

### 3.2 在 API 处理函数中添加注释

在 API 处理函数上添加 Swagger 注释，例如：

```go
// @Summary      获取所有待办事项
// @Description  返回所有待办事项的列表
// @Tags         todos
// @Accept       json
// @Produce      json
// @Success      200  {array}   Todo
// @Router       /todos [get]
func listTodos(c *gin.Context) {
    // ... 函数实现
}
```

## 4. 生成文档

### 方法一：使用 Makefile（推荐）
```bash
make swagger
```

### 方法二：直接使用 swag 命令
```bash
swag init -g cmd/server/main.go
```

## 5. 启动服务

### 方法一：使用 Makefile（推荐）
```bash
make run-with-docs
```

### 方法二：直接运行
```bash
go run cmd/server/main.go
```

## 6. 访问 Swagger UI

启动服务后，可以通过以下地址访问 Swagger UI：
```
http://localhost:8080/swagger/index.html
```

## 7. 常用命令说明

- `make swagger` - 生成 Swagger 文档
- `make run` - 运行服务器
- `make run-with-docs` - 生成文档并运行服务器
- `make clean` - 清理编译文件

## 8. 注意事项

1. 修改 API 后需要重新生成文档
2. 确保所有 API 处理函数都有正确的 Swagger 注释
3. 文档生成后会自动创建 `docs` 目录
4. 可以通过 Swagger UI 测试 API 接口

## 9. 常见问题

### 9.1 命令未找到
如果遇到 "command not found" 错误，请确保：
1. Go 环境已正确配置
2. GOPATH/bin 已添加到系统 PATH
3. 或者使用 `make swagger` 命令自动安装

### 9.2 文档未更新
如果修改了 API 但文档未更新：
1. 确保添加了正确的 Swagger 注释
2. 重新运行 `make swagger`
3. 重启服务器

## 10. 参考链接

- [Swaggo/swag GitHub](https://github.com/swaggo/swag)
- [Swagger 官方文档](https://swagger.io/docs/)
- [Gin Swagger 文档](https://github.com/swaggo/gin-swagger) 