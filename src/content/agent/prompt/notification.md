---
name: NotificationService 可复用开发 Prompt（当前仅直连）
description: 基于SSE封装的前端通知服务设计prompt
---

# NotificationService 可复用开发 Prompt（当前仅直连）

## 适用范围

- 目标目录：`frontend/src/composables/notificationService`
- 当前阶段：只关注 `module/event/directConnection`
- 明确屏蔽：`module/event/tradingIntraday`（纯业务调度逻辑，当前不参与开发）
- 可扩展预留：`base/post.ts` 与 `createPostNotificationService`

---

## 可直接复用的 Prompt

```md
你是该项目的 TypeScript 开发助手，请在不破坏现有分层的前提下实现/修改通知服务代码。

【项目分层约束】
1) base 层（第一层）负责底层连接能力：
   - `core.ts`：统一状态、接口、抽象基类
   - `get.ts`：EventSource 的 GET SSE 实现
   - `post.ts`：POST SSE 扩展占位（未来通过 fetch + ReadableStream 接入）
2) module/event 层（第二层）负责事件分发封装。
3) 当前只允许处理 `directConnection`，禁止引入或修改 `tradingIntraday` 的业务调度逻辑。

【本次开发目标】
- 仅围绕“直连逻辑”实现功能：调用 connect 即建立连接，disconnect 即断开。
- 保持类型可扩展：允许未来补充自定义 EventMap 与 POST 通道实现。

【必须遵守的代码契约】
1) 连接状态必须使用 `NSConnectionState`：
   - `disconnected | connecting | connected | error`
2) 对外能力必须保持：
   - `onStateChange / onMessage / onDone / onError / connect / disconnect`
3) event 层事件监听必须保持：
   - `addEventListener / removeEventListener / removeAllEventListener`
4) `createGetNotificationService` 可用；`createPostNotificationService` 当前保持未实现占位（不要伪实现）。

【禁止事项】
- 不要把业务调度（交易时间、倒计时、自动重连策略）混入 `directConnection`。
- 不要改动与当前需求无关的目录或接口签名。
- 不要为了“看起来完整”而新增大段文档或过度重构。

【交付要求】
- 输出最小必要改动。
- 给出修改文件清单与每个文件的一句话说明。
- 若存在风险/待办，用 TODO 标识并保持可继续开发。
```

---

## 代码约束案例（用于约束模型方向）

### 案例 1：直连类只做直连

```ts
export class DirectConnectionNotificationService<TEventMap extends EventMapBase = {}>
  extends AbstractNotificationServiceImpl<TEventMap> {
  connect(streamUrl: string, commonParams: Record<string, unknown>): void {
    this.connectBase(streamUrl, commonParams)
  }
}
```

约束点：`connect()` 只做透传，不得加入交易时段计算或倒计时调度。

### 案例 2：事件层只分发，不承载业务策略

```ts
this.connection.onMessage((eventName: string, rawData: Record<string, any>) => {
  this.safeDispatch(this.messageHandlers, [eventName, rawData])
  // 按 rawData.event 进行业务事件分发
})
```

约束点：event base 负责“分发”，不负责“何时连接”的业务决策。

### 案例 3：POST 仅保留扩展位

```ts
export function createPostNotificationService<TEventMap extends EventMapBase = {}>(
  _options: CreatePostNotificationServiceOptions
): IEventNotificationService<TEventMap> {
  throw new Error('[createPostNotificationService] POST 方式尚未实现，请先完成 base/post.ts')
}
```

约束点：当前不伪造 POST 能力；未来按同一接口平滑扩展。

---

## 后续开发预留（简版）

- TODO(post): 在 `base/post.ts` 实现 `fetch + ReadableStream`，复用 `dispatchMessage/dispatchDone/dispatchError`。
- TODO(event-type): 继续通过 `ResolveEventPayload` 扩展事件类型映射，未命中回退 `any`。
- TODO(factory): 若后续要重新开放业务模块，可在 `module/event/index.ts` 中恢复多类型分发。
