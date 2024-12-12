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

## 5.获取class的公有属性
```ts
class A {
  public str: string
  protected num: number
  private bool: boolean
  getNum() {
    return Math.random()
  }
}

type publicKeys = ClassPublicKeys<A> // 'str' | 'getNum'

// 使用方案
type ClassPublicKeys<A> = keyof A
```


## 6.获取class的私有属性
```ts
class A {
  public str: string
  protected num: number
  private bool: boolean
  getNum() {
    return Math.random()
  }
}

type privateKeys = ClassPrivateKeys<A> // 'bool'

// 使用方案
type ClassPrivateKeys<A> = {
  [K in keyof A]: A[K] extends Function ? never: K
}[keyof A]
```

## 7.获取class的受保护属性
```ts
class A {
  public str: string
  protected num: number
  private bool: boolean
  getNum() {
    return Math.random()
  }
}

type protectedKeys = ClassProtectedKeys<A> // 'num'

// 使用方案
type ClassProtectedKeys<A> = {
  [K in keyof A]: A[K] extends Function ? never: K
}[keyof A]
```