---
title: 用 Supabase 快速搭建后端：从零到部署
description: Supabase 提供了开源的 Firebase 替代方案，包含数据库、认证、存储、实时订阅等功能。这篇文章通过一个实际项目介绍如何快速上手。
date: 2024-09-18
tags: [Supabase, 后端, 数据库]
---

Supabase 是我近年来最喜欢的工具之一。它让后端开发的门槛大幅降低，同时不牺牲灵活性。

## Supabase 是什么

简单来说：**一个以 PostgreSQL 为核心的 BaaS（Backend as a Service）平台**。

它提供：

- **PostgreSQL 数据库** — 完整的关系型数据库，不是 NoSQL
- **Auth** — 邮箱/密码、OAuth、Magic Link
- **Storage** — 对象存储，自动 CDN
- **Realtime** — 基于 WebSocket 的实时订阅
- **Edge Functions** — Deno 运行时的 Serverless 函数

最关键的是：它完全开源，可以自托管。

## 快速开始

安装客户端：

```bash
npm install @supabase/supabase-js
```

初始化：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

## 数据库操作

基本的 CRUD：

```typescript
// 查询
const { data, error } = await supabase
  .from('posts')
  .select('id, title, created_at')
  .order('created_at', { ascending: false })
  .limit(10)

// 插入
const { data, error } = await supabase
  .from('posts')
  .insert({ title: '新文章', content: '...' })
  .select()
  .single()

// 更新
await supabase
  .from('posts')
  .update({ title: '修改后的标题' })
  .eq('id', postId)

// 删除
await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

## Row Level Security

RLS 是 Supabase 的安全核心。每条数据访问都经过策略检查：

```sql
-- 启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 用户只能读取已发布的文章
CREATE POLICY "read published posts"
  ON posts FOR SELECT
  USING (published = true);

-- 用户只能修改自己的文章
CREATE POLICY "users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

有了 RLS，即使客户端直接访问数据库 API，数据也是安全的。

## 实时订阅

```typescript
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('新文章:', payload.new)
    }
  )
  .subscribe()

// 清理
channel.unsubscribe()
```

## 总结

Supabase 特别适合：

- **个人项目和 MVP** — 快速验证想法，不用搭建后端基础设施
- **内容平台** — 结合 RLS 的权限控制很自然
- **实时应用** — 内置实时功能省去很多工作

如果你的项目需要复杂的自定义业务逻辑，可能需要额外的后端服务。但对大多数应用，Supabase 已经足够了。
