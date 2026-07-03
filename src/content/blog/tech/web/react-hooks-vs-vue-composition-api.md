---
title: "React Hooks vs Vue 组合式 API：概念对照与语法对比"
description: "系统性对比 React Hooks 和 Vue 3 组合式 API 中的相似概念，通过伪代码罗列两套框架在状态管理、副作用、计算属性、生命周期等方面的语法糖差异，帮助开发者快速在两个框架间切换思维模型。"
date: 2025-07-02T16:00:00.000Z
tags: ["计算机技术", "Web前端", "React", "Vue", "框架对比"]
---

React Hooks（16.8+）和 Vue 组合式 API（3.0+）在设计理念上高度相似——都以**函数式**的方式组织组件逻辑，都摆脱了 class / options 的束缚。本文将按概念维度逐一对照，配合伪代码帮助理解。

<!-- truncate -->

## 核心思维模型差异

在进入具体 API 对比之前，需要先理解两者的根本差异：

| 维度 | React | Vue |
|------|-------|-----|
| 响应式策略 | 不可变数据 + 重新执行整个函数组件 | 基于 Proxy 的细粒度响应式追踪 |
| 重渲染粒度 | 组件级（需手动 memo 优化） | 依赖级（自动追踪，精确更新） |
| 函数执行频率 | 每次渲染都重新执行组件函数 | `setup()` 只执行一次 |
| 值引用方式 | 直接使用值，setter 触发重渲染 | 通过 `.value` 访问（模板中自动解包） |

---

## 1. 状态声明

**概念**：声明组件内部可变状态，状态变化驱动视图更新。

### React: `useState`

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Vue: `ref` / `reactive`

```vue
<script setup>
import { ref, reactive } from 'vue'

// 基本类型用 ref
const count = ref(0)

// 对象类型用 reactive
const state = reactive({ name: 'Vue', version: 3 })
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

### 对比要点

| React `useState` | Vue `ref` / `reactive` |
|------------------|------------------------|
| 返回 `[value, setter]` 元组 | 返回响应式引用对象 |
| 通过 setter 函数更新 | 直接赋值 `.value`（ref）或修改属性（reactive） |
| 组件函数每次重新执行，值从闭包中获取 | `setup` 只执行一次，值始终是同一个引用 |
| 需要函数式更新避免闭包陷阱：`setCount(c => c+1)` | 无此问题，因为始终访问最新值 |

---

## 2. 计算/派生值

**概念**：基于已有状态派生出新值，当依赖变化时自动重新计算。

### React: `useMemo`

```jsx
import { useState, useMemo } from 'react'

function TodoList({ todos, filter }) {
  const filteredTodos = useMemo(
    () => todos.filter(t => t.status === filter),
    [todos, filter] // 手动声明依赖
  )
  return <ul>{filteredTodos.map(t => <li key={t.id}>{t.text}</li>)}</ul>
}
```

### Vue: `computed`

```vue
<script setup>
import { ref, computed } from 'vue'

const todos = ref([])
const filter = ref('active')

// 依赖自动追踪，无需手动声明
const filteredTodos = computed(() =>
  todos.value.filter(t => t.status === filter.value)
)
</script>
```

### 对比要点

| React `useMemo` | Vue `computed` |
|-----------------|----------------|
| 需要手动写依赖数组 | 依赖自动追踪 |
| 本质是性能优化（可被 React 丢弃缓存） | 语义上是派生状态，保证缓存一致性 |
| 返回值直接使用 | 返回 ref 对象，通过 `.value` 访问 |
| 不支持 setter | 支持 getter/setter 形式创建可写计算属性 |

---

## 3. 副作用 / 侦听

**概念**：在状态变化时执行副作用（网络请求、DOM 操作、订阅等）。

### React: `useEffect`

```jsx
import { useState, useEffect } from 'react'

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const connection = createConnection(roomId)
    connection.connect()
    connection.onMessage(msg => setMessages(prev => [...prev, msg]))

    // 清理函数
    return () => connection.disconnect()
  }, [roomId]) // 依赖变化时重新执行

  return <MessageList messages={messages} />
}
```

### Vue: `watch` / `watchEffect`

```vue
<script setup>
import { ref, watch, watchEffect } from 'vue'

const roomId = ref('general')
const messages = ref([])

// watchEffect: 自动追踪依赖，立即执行
watchEffect((onCleanup) => {
  const connection = createConnection(roomId.value)
  connection.connect()
  connection.onMessage(msg => messages.value.push(msg))

  onCleanup(() => connection.disconnect())
})

// watch: 显式指定侦听源，懒执行，可获取新旧值
watch(roomId, (newId, oldId) => {
  console.log(`从 ${oldId} 切换到 ${newId}`)
}, { immediate: false })
</script>
```

### 对比要点

| React `useEffect` | Vue `watchEffect` / `watch` |
|--------------------|-----------------------------|
| 依赖数组手动声明 | `watchEffect` 自动追踪；`watch` 显式指定源 |
| 组件挂载后执行（默认） | `watchEffect` 立即执行；`watch` 默认懒执行 |
| 返回清理函数 | 通过 `onCleanup` 参数注册清理逻辑 |
| 无法拿到旧值 | `watch` 回调提供 `(newVal, oldVal)` |
| 合并了挂载、更新、卸载逻辑 | Vue 将生命周期与侦听器分离 |

---

## 4. DOM 引用 / Ref

**概念**：获取 DOM 元素或子组件实例的引用。

### React: `useRef`

```jsx
import { useRef, useEffect } from 'react'

function TextInput() {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current.focus()
  }, [])

  return <input ref={inputRef} />
}
```

### Vue: `ref`（模板引用）

```vue
<script setup>
import { ref, onMounted } from 'vue'

const inputRef = ref(null)

onMounted(() => {
  inputRef.value.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

### 对比要点

| React `useRef` | Vue 模板 `ref` |
|----------------|----------------|
| 通过 `.current` 访问 | 通过 `.value` 访问 |
| 同一个 `useRef` 也可存储任意可变值 | Vue 的 `ref()` 本身就是响应式的（但作为模板引用时通常不追踪） |
| 修改 `.current` 不触发重渲染 | 模板引用在挂载后才有值 |

---

## 5. 上下文 / 依赖注入

**概念**：跨层级传递数据，避免 props 逐层透传（prop drilling）。

### React: `createContext` + `useContext`

```jsx
import { createContext, useContext } from 'react'

const ThemeContext = createContext('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <DeepChild />
    </ThemeContext.Provider>
  )
}

function DeepChild() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>当前主题: {theme}</div>
}
```

### Vue: `provide` + `inject`

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('theme', theme) // 可以提供响应式值
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme', 'light') // 第二个参数为默认值
</script>

<template>
  <div :class="theme">当前主题: {{ theme }}</div>
</template>
```

### 对比要点

| React `useContext` | Vue `provide` / `inject` |
|--------------------|--------------------------|
| 需要先 `createContext` 创建上下文对象 | 使用字符串或 Symbol 作为 key |
| Provider 组件包裹子树 | 在 `setup` 中调用 `provide()` |
| 值变化时所有消费者重渲染 | 提供响应式值时自动精确更新 |
| 只读消费 | 可提供 setter 实现双向通信 |

---

## 6. 函数缓存

**概念**：缓存函数引用，避免因引用变化导致子组件不必要的重渲染。

### React: `useCallback`

```jsx
import { useState, useCallback, memo } from 'react'

const ExpensiveChild = memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  // 缓存函数引用，避免 ExpensiveChild 重渲染
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return <ExpensiveChild onClick={handleClick} />
}
```

### Vue: 无需等价 API

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

// setup 只执行一次，函数引用天然稳定
const handleClick = () => {
  count.value++
}
</script>

<template>
  <ExpensiveChild :onClick="handleClick" />
</template>
```

### 对比要点

Vue 的 `setup` 只执行一次，函数定义后引用不变，不存在 React 中因每次渲染重新创建函数导致的引用不稳定问题。因此 Vue **不需要** `useCallback` 的等价物。

---

## 7. 生命周期

**概念**：在组件挂载、更新、卸载等时机执行逻辑。

### React: `useEffect` 模拟生命周期

```jsx
import { useEffect } from 'react'

function MyComponent() {
  // 相当于 onMounted
  useEffect(() => {
    console.log('mounted')

    // 相当于 onUnmounted
    return () => console.log('unmounted')
  }, [])

  // 相当于 onUpdated（每次渲染后）
  useEffect(() => {
    console.log('updated')
  })
}
```

### Vue: 显式生命周期钩子

```vue
<script setup>
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

onBeforeMount(() => console.log('before mount'))
onMounted(() => console.log('mounted'))
onBeforeUpdate(() => console.log('before update'))
onUpdated(() => console.log('updated'))
onBeforeUnmount(() => console.log('before unmount'))
onUnmounted(() => console.log('unmounted'))
</script>
```

### 对比要点

| React | Vue |
|-------|-----|
| 用 `useEffect` + 依赖数组模拟不同阶段 | 提供语义明确的独立钩子函数 |
| 无 beforeMount / beforeUpdate 等价物 | 完整的 before/after 生命周期对 |
| `useLayoutEffect` ≈ 同步 DOM 操作时机 | 默认 `watchEffect` 在 DOM 更新前执行，`flush: 'post'` 在 DOM 更新后 |

---

## 8. Reducer 模式

**概念**：将复杂状态更新逻辑集中到 reducer 函数中管理。

### React: `useReducer`

```jsx
import { useReducer } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 }
    case 'decrement': return { count: state.count - 1 }
    default: return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 })

  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </>
  )
}
```

### Vue: 手动实现（composable）

```vue
<script setup>
import { reactive } from 'vue'

// Vue 没有内置 useReducer，但可以用 composable 轻松实现
function useReducer(reducer, initialState) {
  const state = reactive({ ...initialState })
  function dispatch(action) {
    const next = reducer({ ...state }, action)
    Object.assign(state, next)
  }
  return [state, dispatch]
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 }
    case 'decrement': return { count: state.count - 1 }
    default: return state
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 })
</script>

<template>
  <span>{{ state.count }}</span>
  <button @click="dispatch({ type: 'increment' })">+</button>
  <button @click="dispatch({ type: 'decrement' })">-</button>
</template>
```

### 对比要点

Vue 没有内置 `useReducer`，因为 `reactive` + 普通函数已经足够灵活。社区中通常直接在 composable 里封装状态变更方法，而非强制使用 action/dispatch 模式。

---

## 9. 暴露组件方法

**概念**：父组件通过 ref 调用子组件的方法。

### React: `useImperativeHandle` + `forwardRef`

```jsx
import { useRef, useImperativeHandle, forwardRef } from 'react'

const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef()

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollIntoView: () => inputRef.current.scrollIntoView()
  }))

  return <input ref={inputRef} />
})

function Parent() {
  const ref = useRef()
  return (
    <>
      <FancyInput ref={ref} />
      <button onClick={() => ref.current.focus()}>聚焦</button>
    </>
  )
}
```

### Vue: `defineExpose`

```vue
<!-- FancyInput.vue -->
<script setup>
import { ref } from 'vue'

const inputRef = ref()

defineExpose({
  focus: () => inputRef.value.focus(),
  scrollIntoView: () => inputRef.value.scrollIntoView()
})
</script>

<template>
  <input ref="inputRef" />
</template>

<!-- Parent.vue -->
<script setup>
import { ref } from 'vue'
import FancyInput from './FancyInput.vue'

const fancyRef = ref()
</script>

<template>
  <FancyInput ref="fancyRef" />
  <button @click="fancyRef.focus()">聚焦</button>
</template>
```

### 对比要点

| React `useImperativeHandle` | Vue `defineExpose` |
|-----------------------------|---------------------|
| 需要配合 `forwardRef` 使用 | `<script setup>` 默认不暴露内部，用 `defineExpose` 显式声明 |
| 接收依赖数组控制更新时机 | 声明即生效，无需依赖管理 |

---

## 10. 并发/过渡更新

**概念**：将某些状态更新标记为"非紧急"，保持 UI 响应性。

### React: `useTransition` / `useDeferredValue`

```jsx
import { useState, useTransition, useDeferredValue } from 'react'

function SearchResults() {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  function handleChange(e) {
    // 输入更新是紧急的
    setQuery(e.target.value)

    // 列表过滤是非紧急的
    startTransition(() => {
      // 触发 Suspense 或耗时渲染
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultList query={deferredQuery} />
    </>
  )
}
```

### Vue: 无直接等价

Vue 的细粒度响应式系统本身已经确保只更新必要的 DOM，因此不需要类似机制。对于大列表等场景，Vue 通常使用：
- **虚拟滚动**（如 `vue-virtual-scroller`）
- **`v-memo`** 指令跳过子树更新
- **`shallowRef`** 减少深层响应追踪
- **手动 debounce/throttle** 控制更新频率

---

## 11. 自定义 Hook / Composable

**概念**：将可复用的有状态逻辑封装为独立函数。

### React: Custom Hook

```jsx
import { useState, useEffect } from 'react'

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handler = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
    handler()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return size
}

// 使用
function MyComponent() {
  const { width, height } = useWindowSize()
  return <div>{width} x {height}</div>
}
```

### Vue: Composable

```js
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  function handler() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    handler()
    window.addEventListener('resize', handler)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handler)
  })

  return { width, height }
}
```

```vue
<script setup>
import { useWindowSize } from './useWindowSize'

const { width, height } = useWindowSize()
</script>

<template>
  <div>{{ width }} x {{ height }}</div>
</template>
```

### 对比要点

| React Custom Hook | Vue Composable |
|-------------------|----------------|
| 命名约定 `use` 开头 | 命名约定 `use` 开头（非强制） |
| 每次渲染都重新执行 | `setup` 中只执行一次 |
| 返回值为普通值（快照） | 返回响应式引用（始终最新） |
| 解构后值不再更新，需整体使用 | 解构 ref 后仍保持响应性 |

---

## 12. 唯一 ID 生成

**概念**：生成与服务端渲染兼容的稳定唯一 ID。

### React: `useId`

```jsx
import { useId } from 'react'

function FormField({ label }) {
  const id = useId()
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  )
}
```

### Vue: `useId`（3.5+）

```vue
<script setup>
import { useId } from 'vue'

const id = useId()
</script>

<template>
  <label :for="id">用户名</label>
  <input :id="id" />
</template>
```

### 对比要点

两者功能几乎一致，都用于生成 SSR 安全的唯一 ID，避免客户端/服务端水合不匹配。

---

## 速查总表

| 概念 | React | Vue |
|------|-------|-----|
| 基本状态 | `useState` | `ref` / `reactive` |
| 计算派生 | `useMemo` | `computed` |
| 副作用 | `useEffect` | `watchEffect` / `watch` |
| DOM 引用 | `useRef` | 模板 `ref` |
| 上下文注入 | `useContext` | `inject` |
| 跨层提供 | `Context.Provider` | `provide` |
| 函数缓存 | `useCallback` | _(不需要)_ |
| Reducer | `useReducer` | 手动 composable |
| 暴露方法 | `useImperativeHandle` | `defineExpose` |
| 并发更新 | `useTransition` / `useDeferredValue` | _(架构层面不需要)_ |
| 自定义逻辑复用 | Custom Hook | Composable |
| 唯一 ID | `useId` | `useId`（3.5+） |
| 布局副作用 | `useLayoutEffect` | `watchEffect({ flush: 'post' })` |
| 外部 store 同步 | `useSyncExternalStore` | _(响应式系统内建)_ |

---

## 总结

React 和 Vue 的"函数式组件逻辑组织"思路殊途同归，核心区别在于：

1. **React 是"快照"模型**：每次渲染创建值的快照，闭包捕获当次渲染的状态，需要手动管理依赖数组和缓存。
2. **Vue 是"引用"模型**：setup 只运行一次，所有状态通过响应式引用持久存在，依赖自动追踪，代价是需要 `.value`。

选择哪个取决于团队偏好和项目需求，两者在概念层面已高度对齐，迁移学习成本较低。
