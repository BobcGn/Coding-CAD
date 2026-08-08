# Component Registry / 组件知识库

`@coding-cad/component-registry` 是面向 AI Agent 的 Software Component Knowledge Base。它描述软件工程组件的能力、限制、接口和使用建议，帮助后续 Validator、UI 和 Agent 理解架构选择。

`@coding-cad/component-registry` is a Software Component Knowledge Base for AI Agents. It describes software component capabilities, limitations, interfaces, and recommendations so future validators, UI, and Agents can understand architecture choices.

## 是什么 / What It Is

Component Registry 保存工程知识，而不是部署配置。

Component Registry stores engineering knowledge, not deployment configuration.

正确表达：

Correct expression:

- PostgreSQL supports transactions and strong consistency.  
  PostgreSQL 支持事务和强一致性。
- Redis is suitable for cache and temporary state, but risky as primary storage.  
  Redis 适合缓存和临时状态，但不适合作为主存储。
- Kafka helps event streams and asynchronous processing, while introducing eventual consistency.  
  Kafka 适合事件流和异步处理，但会引入最终一致性。

不应该表达：

Should not be expressed:

- PostgreSQL port is 5432.  
  PostgreSQL 端口是 5432。
- Redis should be deployed with a specific memory size.  
  Redis 应该使用某个具体内存规格部署。

## 为什么需要 / Why It Exists

Architecture IR 描述软件架构意图，但它不应该内置所有技术知识。Component Registry 补充“组件能做什么、不能做什么、适合什么场景、不适合什么场景”。

Architecture IR describes software architecture intent, but it should not embed all technology knowledge. Component Registry adds what components can do, cannot do, are suitable for, and are unsuitable for.

例如，积分余额需要强一致的 source of truth 时，AI Agent 可以检索：

For example, when point balances need a strongly consistent source of truth, an AI Agent can retrieve:

- PostgreSQL: `transaction`, `relational-storage`, `strong-consistency`
- Redis: `cache`, `key-value`, `high-performance-read`, but `not-primary-storage`

因此 Agent 可以解释：积分余额更适合作为 PostgreSQL 这类事务型存储的职责，而 Redis 更适合作为缓存。

Therefore, the Agent can explain that point balances fit transactional storage such as PostgreSQL, while Redis fits cache responsibilities.

## 核心模型 / Core Model

```ts
interface ComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  capabilities: Capability[];
  limitations: Limitation[];
  interfaces: string[];
  suitableFor: string[];
  unsuitableFor: string[];
  recommendation?: Recommendation;
}
```

每个组件必须同时描述能力和限制。只描述优点的组件知识对架构判断不够可靠。

Each component must describe both capabilities and limitations. Component knowledge that only lists strengths is not reliable enough for architecture reasoning.

## 内置组件 / Built-In Components

第一阶段内置五个组件：

The first phase includes five built-in components:

- PostgreSQL
- Redis
- Kafka
- MongoDB
- REST API

## 使用示例 / Usage Example

```ts
import { createComponentRegistry } from "@coding-cad/component-registry";

const registry = createComponentRegistry();

const redis = registry.get("redis");
const transactionCandidates = registry.searchByCapability("transaction");

console.log(redis?.limitations);
console.log(transactionCandidates.map((component) => component.name));
```

## 与 Architecture IR 的关系 / Relationship to Architecture IR

Component Registry 依赖 Architecture IR 的基础组件类型词汇，但不强耦合具体架构文档。它不会修改 IR，也不会直接做 Validator 的工作。

Component Registry depends on Architecture IR's basic component vocabulary, but it is not tightly coupled to any specific architecture document. It does not modify IR and does not perform validator work directly.

未来 Validator 可以把 Architecture IR 中的需求与 Registry 中的能力和限制进行匹配，例如：

Future validators can match Architecture IR requirements against Registry capabilities and limitations, for example:

- `requires strong-consistency` -> PostgreSQL can satisfy it.
- `source of truth` + Redis -> Redis has `not-primary-storage` limitation.

## 扩展方向 / Extension Direction

- 插件化组件 / Plugin-provided components
- 用户自定义组件 / User-defined components
- 外部知识库导入 / External knowledge-base import
- 更丰富的检索策略 / Richer retrieval strategies
