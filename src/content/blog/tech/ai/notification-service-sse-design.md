---
title: SSE 封装心得：统一契约，隐藏传输差异
description: 基于 notification-service/base 中 core、get、post 与工厂定义，整理 GET EventSource 与 POST fetch ReadableStream 的 SSE 封装方案
date: 2026-05-20
tags: [SSE, EventSource, ReadableStream, TypeScript, 前端架构]
---

最近重新看了一遍 `notification-service/base` 这层代码，我有一个很强的感受：

```text
上层要的是通知能力，不应该被 GET 或 POST 的传输细节绑住。
底层要做的，是把不同连接方式压成同一套事件语义。
```

这其实就是这套 SSE 封装最核心的设计思路。

`EventSource` 很好用，但它天然只支持 GET。当业务侧遇到需要 POST 建立 SSE 连接的接口时，我们不能再直接把 `EventSource` 暴露给上层。否则业务代码很快会分裂成两套：GET 一套写法，POST 一套写法，状态、参数、错误处理、事件分发也会慢慢变得不一致。

所以这次封装没有把重点放在“怎么请求”上，而是先回答另一个问题：

```text
不管底层是 EventSource 还是 fetch stream，上层能不能只面对同一种通知服务？
```

答案就是 `base` 文件夹承担的职责。

## 代码地图

先看这一层的文件职责：

```text
notification-service/base
├── core.ts   # 底层契约、连接状态、连接参数、抽象基类
├── get.ts    # GET SSE 实现，基于浏览器原生 EventSource
├── post.ts   # POST SSE 实现，基于 fetch + ReadableStream
└── index.ts  # 工厂入口，根据 request type 创建对应实现
```

这一层不是业务层。它不关心“盘中交易推送”还是“直连推送”，它只关心三件事：

1. 怎么建立连接。
2. 怎么把消息交给上层。
3. 怎么把连接状态收束成统一模型。

业务事件的注册和分发在更上层的 `module/event/base` 中完成。`base` 层要做的是把传输能力打磨成稳定的底座。

## 先定契约

SSE 封装的第一步，不是马上写 `new EventSource()`，也不是马上写 `fetch()`。

更重要的是先定义“一个通知服务应该长什么样”。

在 `core.ts` 里，核心接口可以概括成这样：

```ts
export interface IConnectService {
  connect(connectParam: ConnectParam): void;
  onBind(notificationService: INotificationService): void;
  disconnect(): void;
}

export interface INotificationService extends IConnectService {
  onStateChange(oldState: NSConnectionState, newState: NSConnectionState): void;
  onOpen(ev: any): void;
  onMessage(data: any): void;
  onError(error: any): void;
}
```

这套接口把连接行为和事件回调放在一起，形成一个很简单的约定：

```text
底层负责连接和监听。
上层负责响应 open/message/error/state。
```

这就是架构上很关键的一步。只要 GET 和 POST 都实现这套接口，上层就不需要知道底层到底用的是 `EventSource` 还是 `ReadableStream`。

## 连接状态要收口

`NSConnectionState` 定义了四个状态：

```ts
export enum NSConnectionState {
  NO_CONNECTION,
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}
```

这几个状态本身不复杂，但它们很有价值。

SSE 这种长连接最怕状态散落在各个实现里。GET 实现自己改状态，POST 实现自己改状态，上层再补一层状态，最后很容易出现“连接其实断了，但 UI 还以为在线”的问题。

所以 `AbstractNotificationService` 把状态迁移集中起来：

```text
connect()      -> doConnect()      -> CONNECTING
onOpen()       -> CONNECTED
onError()      -> DISCONNECTED
disconnect()   -> doDisconnect()   -> DISCONNECTED
```

这里用了一个很典型的模板方法思路：

```text
公共流程放在抽象基类。
差异实现留给 doConnect / doDisconnect。
```

这样 GET 和 POST 只需要关心“怎么连”和“怎么断”，不用重复写状态机。

## ConnectParam 是一个小但重要的设计

`ConnectParam` 不只是一个 `{ url, params }` 对象，它还提供了两个能力：

```ts
addArg(key: string, value: unknown): void;
buildStreamUrl(): string;
```

这让连接参数从“散落的普通对象”变成了一个有行为的参数模型。

GET SSE 需要把参数拼到 URL 上：

```ts
const fullUrl = connectParam.buildStreamUrl();
this.eventSource = new EventSource(fullUrl);
```

POST SSE 则需要把参数放进 body：

```ts
body: this.buildUrlEncodedBody(connectParam.params);
```

两种传输方式不一样，但参数规则尽量保持一致：

```text
undefined/null 不发送。
数组压平成逗号分隔字符串。
其他值统一转成字符串。
```

这个细节很实用。因为业务调用方不需要记住 GET 和 POST 参数编码的差异，只需要把参数交给 `ConnectParam`。

## GET 实现：薄薄一层 EventSource 适配器

`get.ts` 的实现很轻：

```ts
doConnect(connectParam: ConnectParam): void {
  const fullUrl = connectParam.buildStreamUrl();
  this.eventSource = new EventSource(fullUrl);
}
```

然后在 `onBind` 里把原生事件转给上层：

```ts
this.eventSource.onopen = (event) => notificationService.onOpen(event);
this.eventSource.onmessage = (event) => notificationService.onMessage(event);
this.eventSource.onerror = (event) => notificationService.onError(event);
```

这层封装没有刻意复杂化 `EventSource`。它只是做了一件事：

```text
把原生 EventSource 包进统一的 INotificationService 契约里。
```

这是一个好的适配器应该有的克制感。

## POST 实现：用 fetch 模拟 EventSource

真正有意思的是 `post.ts`。

因为浏览器原生 `EventSource` 不支持 POST，所以 POST SSE 必须自己处理几件事：

1. 用 `fetch` 发起 POST 请求。
2. 通过 `ReadableStream` 持续读取服务端响应。
3. 用 `TextDecoder` 处理字节流到字符串的转换。
4. 按 SSE 协议用空行拆分事件帧。
5. 把解析结果包装成 `MessageEvent`。
6. 按 open/message/error 的方式转发给上层。

也就是说，POST 实现不是简单换一个请求方法，而是在代码里补齐了 `EventSource` 原本替我们做掉的事情。

核心连接流程大概是这样：

```ts
const response = await fetch(connectParam.url, {
  method: 'POST',
  headers: {
    Accept: 'text/event-stream',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  },
  body: this.buildUrlEncodedBody(connectParam.params),
  signal: abortController.signal
});
```

拿到响应后，先判断协议层是否可读：

```text
response.ok 必须为 true。
response.body 必须存在。
```

然后手动触发上层 open：

```ts
this.boundNotificationService?.onOpen(new Event('open'));
```

从这一刻开始，POST 实现就开始模拟原生 EventSource 的行为。

## 读流不是读字符串

SSE 返回的是持续不断的响应体。对前端来说，它不是一次性 JSON，而是一段会不断追加的字节流。

所以 `readEventStream` 做了两件关键的事：

```text
reader.read() 不断读取 Uint8Array。
TextDecoder 负责把字节解成字符串。
```

这里有一个容易忽略的细节：

```ts
buffer += decoder.decode(value, { stream: true });
```

`stream: true` 很重要。网络 chunk 可能刚好把一个 UTF-8 多字节字符切开，如果每次都当成完整字符串解码，就可能出现乱码。让 `TextDecoder` 保持流式状态，才能正确处理跨 chunk 字符。

读完之后还会再 flush 一次：

```ts
buffer += decoder.decode();
```

这是为了把 decoder 内部可能残留的最后一段字符吐出来。

## SSE 的边界是空行

SSE 协议里，一条事件不是靠 JSON 边界判断的，而是靠空行分隔。

常见格式类似这样：

```text
id: 1
event: price-change
data: {"code":"AAPL","price":189.5}

id: 2
event: price-change
data: {"code":"MSFT","price":421.3}

```

所以 POST 实现会在 buffer 中查找事件边界：

```text
\n\n
\r\n\r\n
```

这里兼容 LF 和 CRLF 两种换行格式，是很必要的。不同服务端、代理或运行环境可能会产生不同换行风格。

解析逻辑大概是：

```text
buffer 里有完整事件边界
  -> 切出 rawEvent
  -> 解析 id/event/data
  -> 派发 MessageEvent
  -> 剩余内容继续留在 buffer
```

为什么要保留剩余内容？

因为网络分片可能把一条 SSE 事件拆成两段：

```text
data: {"message":"hel
```

下一次读取才得到：

```text
lo"}

```

如果每次读到 chunk 就立即解析，消息就会被截断。buffer 的存在就是为了处理这种半包问题。

## 事件最终要回到 MessageEvent

POST 实现最后会把解析出来的内容重新包装成 `MessageEvent`：

```ts
return new MessageEvent(payload.event || 'message', {
  data: payload.data,
  lastEventId: payload.id || ''
});
```

这个动作看起来只是包装，但设计意义很大。

GET 的原生 `EventSource` 给上层的就是 `MessageEvent`。如果 POST 也给上层 `MessageEvent`，那么上层的 `onMessage` 就不需要关心消息来自 GET 还是 POST。

这就是“统一事件语义”：

```text
GET 原生得到 MessageEvent。
POST 手动构造 MessageEvent。
上层永远消费 MessageEvent。
```

封装的价值在这里体现得很明显。

## abort 是连接生命周期的一部分

POST SSE 和普通请求不一样。普通请求很快结束，但 SSE 是长连接，如果不主动中止，它会一直占着连接和读取流程。

所以 `post.ts` 里维护了当前活跃的 `AbortController`：

```ts
private abortController: AbortController | null = null;
```

每次重新连接前，都会先调用 `abortCurrentRequest()`：

```text
关闭旧连接。
停止旧 reader。
避免一个实例里同时存在多个流读取任务。
```

主动断开时也走同一个方法。

这里还有一个细节设计：`intentionallyAbortedControllers`。

`fetch` 被 `abort()` 之后也会抛出异常并进入 `catch`，但这不是网络错误，也不是服务端异常，而是我们主动关闭连接。

所以代码先记录这个 controller：

```ts
this.intentionallyAbortedControllers.add(this.abortController);
this.abortController.abort();
```

后面 catch 到 AbortError 时就可以判断：

```text
如果这是我主动 abort 的 controller，就直接 return。
不要继续触发上层 onError。
```

这类设计很细，但对体验很重要。否则用户主动断开连接，UI 却收到一个错误事件，很容易造成误判。

## 工厂入口让差异停在底层

`base/index.ts` 用一个工厂函数收束底层实现：

```ts
export function createNotificationService(
  type: RequestType = 'get',
  options: NotificationServiceOptions = {}
): AbstractNotificationService {
  switch (type) {
    case 'get':
      return new GetSSENotificationService(options);
    case 'post':
      return new PostSSENotificationService(options);
  }
}
```

这一层的收益是：调用方不需要直接 `new GetSSENotificationService()` 或 `new PostSSENotificationService()`。

上层只表达意图：

```text
我要一个 get 类型的通知服务。
我要一个 post 类型的通知服务。
```

至于怎么创建、怎么连接、怎么派发事件，都留给底层工厂和具体实现。

这也是后续扩展的入口。比如将来有 WebSocket、长轮询或者其他私有协议，只要它们能实现同一套契约，上层理论上不需要大改。

## 和业务层的配合方式

`base` 层只处理传输，不处理业务事件。

业务层的 `DefaultEventNotificationService` 会做两件事：

```text
注册业务事件名 -> addEventListener(event, handler)
收到 MessageEvent -> JSON.parse(message.data) -> 按 event 分发 handler
```

它还会在连接前把已注册的事件名拼进参数：

```text
events=eventA,eventB,eventC
```

这说明整套结构其实分了两层：

```text
base 层：连接、状态、传输协议适配。
event 层：业务事件注册、事件名订阅、消息分发。
```

这种分层是舒服的。底层不会因为业务类型变多而膨胀，业务层也不需要关心流读取和协议解析。

## 这次封装最值得保留的几个原则

第一，先统一契约，再处理实现差异。

GET 和 POST 的差异很大，但上层真正需要的是统一的 `connect/disconnect/onMessage` 能力。先把接口定住，代码就不会被传输细节牵着走。

第二，状态机应该集中，不要散落。

连接状态由 `AbstractNotificationService` 统一维护，具体实现只做传输动作。这能降低状态不一致的概率。

第三，POST SSE 要尊重流式协议。

它不是普通 JSON 请求。要考虑字节流、跨 chunk 字符、半包、SSE 空行分帧、多行 data、主动 abort 等问题。

第四，对外事件形态要稳定。

GET 原生是 `MessageEvent`，POST 也手动构造 `MessageEvent`。这样上层事件分发逻辑可以复用。

第五，主动关闭不是错误。

`abort()` 是生命周期的一部分，不应该被当成异常通知业务层。`intentionallyAbortedControllers` 就是在表达这个语义。

## 如果继续迭代，我会关注什么

这次 review 的原则是不改业务逻辑，所以很多点可以作为后续优化方向，而不是现在直接动掉：

1. 把日志统一接入 `debug` 配置，避免生产环境直接 `console.log`。
2. 把 SSE 解析逻辑抽成纯函数，方便单独写单元测试。
3. 给 POST SSE 增加更明确的重连策略，目前底层只负责连接和断开。
4. 收紧 `any` 类型，比如 `onOpen/onMessage/onError` 可以逐步引入更精确的事件类型。
5. 明确 `messageTimeout` 和 `connectTimeout` 的落地策略，让配置真正参与连接生命周期。

这些不是当前方案的缺陷，而是一个长连接 SDK 从“能用”走向“更稳”的自然路径。

## 小结

这套 SSE 封装的设计重点，不是把 `EventSource` 包一层，也不是把 `fetch` 写成流式读取这么简单。

它真正做的是：

```text
用统一接口屏蔽 GET/POST 差异。
用抽象基类收口连接状态。
用工厂隔离实例创建。
用 MessageEvent 统一事件形态。
用 AbortController 管理 POST 长连接生命周期。
```

最终上层业务只需要面对“通知服务”，而不是面对一堆传输细节。

这就是我理解里比较理想的封装边界：

```text
业务层关心事件。
传输层关心连接。
协议细节留在最底层。
```

当边界清楚以后，代码会更容易读，也更容易继续长大。
