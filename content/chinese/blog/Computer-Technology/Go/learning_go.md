---
title: Go 后端开发学习笔记
date: 2025-04-16T12:36:18.456Z
update: 2025-04-16T12:36:17.697Z
author: LeeZChuan
categories:
    - 计算机技术
    - 编程语言
    - Go
description: 本文详细介绍了 Go 后端开发的基础知识，包括项目初始化、项目结构、依赖管理、API开发、数据持久化等内容，适合 Go 初学者学习和参考。
---

# Go 后端开发学习笔记

## 目录
1. [项目初始化](#项目初始化)
2. [项目结构](#项目结构)
3. [依赖管理](#依赖管理)
4. [API开发](#api开发)
5. [数据持久化](#数据持久化)
6. [常见问题](#常见问题)

## 项目初始化

### 1. 创建项目目录结构
```bash
mkdir -p backend/{cmd/server,configs,internal/{api,config},pkg}
```

### 2. 初始化Go模块
```bash
cd backend
go mod init front-page
```

### 3. 创建主程序入口
在`cmd/server/main.go`中创建主程序入口：

```go
package main

import (
    "context"
    "flag"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "front-page/internal/api"
    "front-page/internal/config"
)

func main() {
    // 解析命令行参数
    configPath := flag.String("config", "configs/config.yaml", "配置文件路径")
    flag.Parse()

    // 加载配置
    cfg, err := config.Load(*configPath)
    if err != nil {
        log.Fatalf("加载配置文件失败: %v", err)
    }

    // 创建API服务器
    router := api.NewRouter()
    server := &http.Server{
        Addr:         cfg.Server.Addr,
        Handler:      router,
        ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
        WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
    }

    // 启动服务器
    go func() {
        log.Printf("启动服务器在 %s\n", cfg.Server.Addr)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("监听失败: %v", err)
        }
    }()

    // 等待中断信号优雅地关闭服务器
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("正在关闭服务器...")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("服务器强制关闭: %v", err)
    }

    log.Println("服务器优雅退出")
}
```

### 4. 创建配置文件
在`configs/config.yaml`中创建配置文件：

```yaml
server:
  addr: ":8080"
  read_timeout: 10
  write_timeout: 10

db:
  driver: "sqlite3"
  dsn: "file:todos.db?cache=shared&mode=rwc"
  max_idle: 10
  max_open: 100
  log_level: "info"
```

### 5. 创建配置加载器
在`internal/config/config.go`中创建配置加载器：

```go
package config

import (
    "os"
    "gopkg.in/yaml.v3"
)

// Config 应用程序配置
type Config struct {
    Server ServerConfig `yaml:"server"`
    DB     DBConfig     `yaml:"db"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
    Addr         string `yaml:"addr"`
    ReadTimeout  int    `yaml:"read_timeout"`
    WriteTimeout int    `yaml:"write_timeout"`
}

// DBConfig 数据库配置
type DBConfig struct {
    Driver   string `yaml:"driver"`
    DSN      string `yaml:"dsn"`
    MaxIdle  int    `yaml:"max_idle"`
    MaxOpen  int    `yaml:"max_open"`
    LogLevel string `yaml:"log_level"`
}

// Load 从文件加载配置
func Load(file string) (*Config, error) {
    data, err := os.ReadFile(file)
    if err != nil {
        return nil, err
    }

    var config Config
    if err := yaml.Unmarshal(data, &config); err != nil {
        return nil, err
    }

    return &config, nil
}
```

### 6. 创建API路由器
在`internal/api/router.go`中创建API路由器：

```go
package api

import (
    "net/http"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

// NewRouter 创建并配置一个新的路由器
func NewRouter() *gin.Engine {
    router := gin.Default()

    // 配置CORS
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))

    // 健康检查
    router.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })

    // API v1 组
    v1 := router.Group("/api/v1")
    {
        // Todo API
        todoRoutes := v1.Group("/todos")
        {
            todoRoutes.GET("", listTodos)
            todoRoutes.GET("/:id", getTodo)
            todoRoutes.POST("", createTodo)
            todoRoutes.PUT("/:id", updateTodo)
            todoRoutes.DELETE("/:id", deleteTodo)
        }
    }

    return router
}
```

### 7. 创建业务逻辑处理程序
在`internal/api/todo_handler.go`中创建业务逻辑处理程序：

```go
package api

import (
    "net/http"
    "strconv"
    "sync"
    "github.com/gin-gonic/gin"
)

// Todo 表示一个待办事项
type Todo struct {
    ID        int    `json:"id"`
    Title     string `json:"title" binding:"required"`
    Completed bool   `json:"completed"`
}

// 内存中存储Todo的简单实现
var (
    todos     = make(map[int]Todo)
    todoMutex = &sync.Mutex{}
    lastID    = 0
)

// listTodos 获取所有Todo
func listTodos(c *gin.Context) {
    todoMutex.Lock()
    defer todoMutex.Unlock()

    todoList := make([]Todo, 0, len(todos))
    for _, todo := range todos {
        todoList = append(todoList, todo)
    }

    c.JSON(http.StatusOK, todoList)
}

// getTodo 获取单个Todo
func getTodo(c *gin.Context) {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的ID"})
        return
    }

    todoMutex.Lock()
    defer todoMutex.Unlock()

    todo, exists := todos[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "Todo不存在"})
        return
    }

    c.JSON(http.StatusOK, todo)
}

// createTodo 创建新Todo
func createTodo(c *gin.Context) {
    var newTodo Todo
    if err := c.ShouldBindJSON(&newTodo); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    todoMutex.Lock()
    defer todoMutex.Unlock()

    lastID++
    newTodo.ID = lastID
    todos[newTodo.ID] = newTodo

    c.JSON(http.StatusCreated, newTodo)
}

// updateTodo 更新Todo
func updateTodo(c *gin.Context) {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的ID"})
        return
    }

    var updateTodo Todo
    if err := c.ShouldBindJSON(&updateTodo); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    todoMutex.Lock()
    defer todoMutex.Unlock()

    _, exists := todos[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "Todo不存在"})
        return
    }

    updateTodo.ID = id
    todos[id] = updateTodo

    c.JSON(http.StatusOK, updateTodo)
}

// deleteTodo 删除Todo
func deleteTodo(c *gin.Context) {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的ID"})
        return
    }

    todoMutex.Lock()
    defer todoMutex.Unlock()

    _, exists := todos[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "Todo不存在"})
        return
    }

    delete(todos, id)

    c.JSON(http.StatusOK, gin.H{"message": "Todo已删除"})
}
```

### 8. 运行项目
```bash
# 安装依赖
go mod download

# 运行项目
go run ./cmd/server/main.go
```

## 项目结构

### 标准Go项目布局
```
backend/
├── cmd/           # 主应用程序入口
├── configs/       # 配置文件
├── internal/      # 私有应用程序和库代码
│   ├── api/       # API处理程序
│   └── config/    # 配置加载
├── pkg/           # 公共库代码
├── vendor/        # 依赖管理
└── go.mod         # Go模块定义
```

### 重要目录说明
- `/cmd`: 应用程序入口点
- `/internal`: 私有代码，不允许外部导入
- `/pkg`: 可被外部项目导入的公共代码
- `/configs`: 配置文件目录
- `/vendor`: 依赖管理（可选）

## 依赖管理

### Go Modules
- 使用`go.mod`文件管理依赖
- 常用命令：
  ```bash
  go mod init      # 初始化模块
  go mod download  # 下载依赖
  go mod tidy      # 清理依赖
  go mod vendor    # 创建vendor目录
  ```

### 依赖代理设置
在中国大陆地区，建议设置国内代理：
```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

## API开发

### 使用Gin框架
- 创建路由
- 处理请求
- 返回响应

### API示例
```go
// 健康检查
router.GET("/ping", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "message": "pong",
    })
})

// Todo API
todoRoutes := v1.Group("/todos")
{
    todoRoutes.GET("", listTodos)
    todoRoutes.GET("/:id", getTodo)
    todoRoutes.POST("", createTodo)
    todoRoutes.PUT("/:id", updateTodo)
    todoRoutes.DELETE("/:id", deleteTodo)
}
```

## 数据持久化

### SQLite数据库
1. 安装SQLite：
   ```bash
   brew install sqlite3
   ```

2. 安装Go SQLite驱动：
   ```bash
   go get github.com/mattn/go-sqlite3
   ```

3. 数据库配置示例：
   ```yaml
   db:
     driver: "sqlite3"
     dsn: "file:todos.db?cache=shared&mode=rwc"
   ```

## 常见问题

### 1. 依赖下载超时
解决方案：
```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

### 2. vendor目录问题
- 忽略vendor目录运行：
  ```bash
  go run -mod=mod ./cmd/server/main.go
  ```
- 重新生成vendor：
  ```bash
  go mod vendor
  ```

### 3. 配置文件加载失败
解决方案：
- 在正确目录下运行：
  ```bash
  cd backend
  go run ./cmd/server/main.go
  ```
- 或指定配置文件路径：
  ```bash
  go run ./cmd/server/main.go -config=./backend/configs/config.yaml
  ```

### 4. .DS_Store文件
- 在`.gitignore`中添加：
  ```
  .DS_Store
  ```
- 删除已跟踪的.DS_Store文件：
  ```bash
  git rm --cached .DS_Store
  ```

## 最佳实践

1. **项目结构**：遵循标准Go项目布局
2. **依赖管理**：使用Go Modules
3. **代码组织**：将公共代码放在`pkg`，私有代码放在`internal`
4. **配置管理**：使用YAML或JSON格式的配置文件
5. **错误处理**：使用适当的错误处理机制
6. **测试**：编写单元测试和集成测试

## 参考资料

- [Go Modules](https://go.dev/wiki/Modules)
- [Gin Web Framework](https://gin-gonic.com/)
- [Go Project Layout](https://github.com/golang-standards/project-layout) 