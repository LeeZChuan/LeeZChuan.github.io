---
title: ts常用体操
date: 2024-12-10T07:31:23.312Z
update: 2024-12-10T07:31:23.979Z
author: LeeZChuan
categories:
    - 计算机技术
    - 工具
    - TypeScript
    - 类型定义
description: 常用的ts体操。
---

这里记录一些常用的类型定义

## 1.对象属性只读（递归）

```ts
type X = { 
  x: { 
    a: 1
    b: 'hi'
  }
  y: 'hey'
}

type Expected = { 
  readonly x: { 
    readonly a: 1
    readonly b: 'hi'
  }
  readonly y: 'hey' 
}

type Todo = DeepReadonly<X> // should be same as `Expected`


// 实现
type DeepReadonly<T> = keyof T extends never ? T : { readonly [k in keyof T]: DeepReadonly<T[k]> };

```

## 2.元组转换为对象
```ts

type Tuple = ['tesla', 'model 3', 'model X', 'model Y'] // ['tesla', 'model 3', 'model X', 'model Y']

type Result = TupleToObject<Tuple> // expected { tesla: 'tesla'; 'model 3': 'model 3'; 'model X': 'model X'; 'model Y': 'model Y' }

// 实现
type TupleToObject<T extends readonly (string | number)[]> = {
  [K in T[number]]: K
}
```

## 3.获得可选属性
```ts

type I = GetOptional<{ foo: number, bar?: string }> // expected to be { bar?: string }

// 实现
type GetOptional<T> = {[P in keyof T as T[P] extends Required<T>[P] ? never: P]: T[P]}
```

## 4.获得必需的属性 
```ts
type I = GetRequired<{ foo: number, bar?: string }> // expected to be { foo: number }

// 实现
type GetRequired<T> = {[P in keyof T as T[P] extends Required<T>[P] ? P: never]: T[P]}
```

## 5.去除函数类型
```ts
type Foo = () => void;
type Bar = { name: string; age: number; }
type Baz = [number, () => void];

type RemoveFnType<T> = T extends (...args: infer P) => infer R ? R : T