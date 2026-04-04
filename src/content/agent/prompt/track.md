---
name: 基于claude code分析出的埋点skill
description: 埋点通用prompt
---

# 通用埋点方案复用 Prompt 模板

> 用法：把下面模板直接交给 AI/工程师，按你的项目填充 `[]` 占位符。

## Prompt（可直接复制）

```md
你现在是资深埋点架构师。请基于以下输入，输出一个“可替换埋点供应商”的通用埋点方案设计。

【项目背景】
- 项目类型: [CLI/Web/App/Server]
- 当前供应商: [Datadog/其他]
- 目标供应商(可多选): [Mixpanel/Amplitude/OTLP/自建]
- 隐私等级要求: [低/中/高]

【强制目标】
1) 底层抽象通用：业务层不感知供应商。
2) 支持未来替换任意埋点供应商。
3) 保留可靠性：批量、重试、flush、失败补偿。
4) 明确隐私策略：敏感字段不能进入通用分析通道。

请按下面 3 个部分输出：

---

### 一、文件结构定义（必须给出）
请给出建议目录树，并解释每个文件职责。至少包含：
- `analytics/index.ts`（统一入口）
- `analytics/pipeline.ts`（采样、过滤、分发编排）
- `analytics/privacy.ts`（敏感字段策略）
- `analytics/metadata.ts`（通用 metadata 组装）
- `analytics/adapters/[vendor].ts`（供应商适配器）
- `analytics/reliability/[batch|retry|spool].ts`（可靠性模块）
- `analytics/config.ts`（gate、killswitch、采样配置）

并额外输出：
- 哪些文件是“供应商无关层”
- 哪些文件是“供应商相关层（未来必须改造/扩充）”

---

### 二、文件方法定义（必须带关键逻辑）
请逐文件给出核心方法签名 + 关键伪代码（或 TypeScript 示例），至少覆盖：

1. `logEvent(name, metadata)` / `logEventAsync(name, metadata)`
2. `dispatch(event)`：
   - validate -> enrich -> sample -> privacyFilter -> fanout
3. `privacyFilter(event)`：
   - 受限字段进入 pii channel
   - 通用 channel 自动剥离敏感字段
4. `adapter.send(event)`：
   - vendor 字段映射
   - 批量/重试/超时策略接入
5. `shutdown()`：
   - flush in-memory queue
   - 处理失败落盘队列

要求：
- 明确每个方法输入输出。
- 明确哪些逻辑必须稳定（不可随供应商替换而变化）。
- 明确哪些逻辑是供应商定制点（必须可扩展）。

---

### 三、基于埋点的使用案例（给 3 个）
每个案例都输出：
- 触发场景
- 事件名
- 必填字段
- 可选字段
- 是否涉及敏感字段
- 上报路径（哪些 adapter 会收到）
- 常见告警/看板指标

案例建议：
1) API success/error
2) Tool use success/error
3) Plugin/Skill lifecycle（含敏感字段脱敏与受限字段分流）

---

【供应商改造提示（必须显式输出）】
请单独输出一节 “Vendor Migration Notes”，明确提醒未来使用者：
- 替换供应商时优先改 `adapters/*` 与字段映射，不要大面积改业务埋点调用点。
- 保留统一事件模型和隐私过滤栅栏。
- 明确新供应商的保留字段、高基数字段限制、鉴权方式、批处理限制。
- 验证 shutdown flush、失败重试、离线补偿在新供应商仍然有效。

【输出风格】
- 中文
- 结构化
- 简洁，不写无关背景
```

## 这个模板和当前项目的对应关系

- 对应当前统一入口：`services/analytics/index.ts`
- 对应当前编排层：`services/analytics/sink.ts`
- 对应当前隐私分流：`stripProtoFields + _PROTO_*`
- 对应当前供应商适配：`datadog.ts` 与 `firstPartyEventLogger/Exporter`
- 对应当前可靠性实现：`FirstPartyEventLoggingExporter` 的重试与落盘机制
