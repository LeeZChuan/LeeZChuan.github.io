---
title: 2024 年我最常用的 TypeScript 技巧
description: 整理了一些在日常开发中高频使用的 TypeScript 模式和技巧，涵盖类型体操、实用工具类型和一些不常见但很有用的特性。
date: 2024-03-20
tags: [TypeScript, 技术]
---

用 TypeScript 几年了，有些模式和技巧几乎每个项目都会用到。整理一下。

## 1. 利用 `satisfies` 进行类型验证

`satisfies` 是 TypeScript 4.9 引入的操作符，它在验证类型的同时保留更精确的推断结果：

```typescript
type Config = {
  port: number;
  host: string;
  features: string[];
};

const config = {
  port: 3000,
  host: 'localhost',
  features: ['auth', 'logging'],
} satisfies Config;

// config.port 的类型是 number（不是 3000），但赋值时验证了类型
// 而 features[0] 的类型是 string（不是 "auth"）
```

与直接类型注解 `const config: Config = {...}` 的区别在于：使用 `satisfies` 后，变量的类型是推断出的更精确类型，而不是宽泛的 `Config`。

## 2. 条件类型提取

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>;  // string
type B = UnwrapPromise<number>;           // number
```

配合 `infer`，可以从复杂类型中提取内部类型：

```typescript
type FirstArg<T extends (...args: any[]) => any> =
  T extends (first: infer F, ...rest: any[]) => any ? F : never;

function greet(name: string, age: number) {}

type Name = FirstArg<typeof greet>;  // string
```

## 3. Template Literal Types

字符串模板类型可以生成大量字面量类型：

```typescript
type Direction = 'top' | 'right' | 'bottom' | 'left';
type Margin = `margin-${Direction}`;
// "margin-top" | "margin-right" | "margin-bottom" | "margin-left"

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>;  // "onClick"
```

## 4. 用 `as const` + `typeof` 替代 enum

Enum 在很多场景下不如对象 + `as const`：

```typescript
const Status = {
  Pending: 'pending',
  Active: 'active',
  Inactive: 'inactive',
} as const;

type Status = typeof Status[keyof typeof Status];
// 'pending' | 'active' | 'inactive'

function setStatus(status: Status) {
  // ...
}

setStatus(Status.Active);     // OK
setStatus('active');          // OK（更灵活）
setStatus('invalid');         // Error
```

## 5. Discriminated Unions

用于建模状态机或 API 响应非常好用：

```typescript
type ApiResponse<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function handleResponse<T>(res: ApiResponse<T>) {
  switch (res.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Display data={res.data} />;  // TypeScript 知道 data 存在
    case 'error':
      return <Error message={res.error} />; // TypeScript 知道 error 存在
  }
}
```

---

以上是我日常最常用的几个模式。TypeScript 的类型系统很强大，值得深入探索。
