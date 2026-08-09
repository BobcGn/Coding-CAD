# Architecture IR / 架构中间表示

`@coding-cad/architecture-ir` 是 Coding CAD 的第一个核心模块。它定义一个人类、DSL、可视化界面和 AI Agent 都能共同理解的软件架构模型。

`@coding-cad/architecture-ir` is the first core module of Coding CAD. It defines a software architecture model that humans, DSLs, visual tools, and AI Agents can all understand.

## 是什么 / What It Is

Architecture IR 描述的是 Software Architecture Intent：软件为什么存在、由哪些领域对象组成、组件如何连接、组件如何通信、架构受哪些约束、关键决策为什么成立，以及未来如何演进。

Architecture IR describes Software Architecture Intent: why the software exists, which domain objects it contains, how components connect, how they communicate, which constraints shape the architecture, why key decisions were made, and how the system may evolve.

它类似编译器中的 LLVM IR、Kubernetes Desired State 或 Terraform Infrastructure Model，但它不是代码表示，也不是某个具体技术栈的配置文件。

It is similar in spirit to LLVM IR, Kubernetes Desired State, or Terraform's infrastructure model, but it is not a code representation or a configuration file for a specific technology stack.

## 为什么存在 / Why It Exists

Coding CAD 需要一个稳定的核心模型，让后续 DSL、Graph UI、Validator、Architecture Agent 和外部 Agent 指导协议都围绕同一份架构语义工作。

Coding CAD needs a stable core model so DSLs, Graph UI, validators, the Architecture Agent, and external Agent guidance protocols can share the same architecture semantics.

第一版不追求覆盖所有工程场景，而是先稳定八个核心概念：

The first version does not try to cover every engineering scenario. It stabilizes eight core concepts first:

- Project / 项目意图
- Domain / 领域模型
- Component / 组件
- Connection / 连接
- Contract / 契约
- Constraint / 约束
- Decision / 决策
- Evolution / 演进

## 设计理念 / Design Principles

- 描述为什么这样设计，而不是代码怎么写。  
  Describe why the architecture is designed this way, not how code should be written.
- 保持技术无关，用 capability 和 limitation 表达组件语义。  
  Stay technology-neutral and express component semantics with capabilities and limitations.
- 字段命名清晰、无歧义，方便人类和 AI Agent 直接推理。  
  Keep field names clear and unambiguous so humans and AI Agents can reason over them directly.
- 所有对象必须可以 JSON/YAML 序列化。  
  All objects must be serializable to JSON/YAML.
- 第一版稳定核心闭环，后续再扩展到更通用的工程 IR。  
  Stabilize the core loop first; extend toward a more general engineering IR later.

## 顶层对象 / Top-Level Object

```ts
interface ArchitectureProject {
  version: string;
  intent: ProjectIntent;
  domain: DomainModel;
  architecture: ArchitectureGraph;
  constraints: Constraint[];
  decisions: ArchitectureDecision[];
  evolution?: EvolutionPlan;
}
```

`ArchitectureProject` 是新的规范入口。早期包中保留的 `ArchitectureIR` 只是兼容类型，后续 DSL、UI 和 Agent 应逐步迁移到 `ArchitectureProject`。

`ArchitectureProject` is the canonical new entry point. The older `ArchitectureIR` type is kept only for compatibility; future DSL, UI, and Agent work should migrate toward `ArchitectureProject`.

## 积分系统示例 / Point System Example

```ts
import type { ArchitectureProject } from "@coding-cad/architecture-ir";

const pointSystem: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "PointSystem",
    purpose: [
      "Reward users with auditable points.",
      "Keep point balance changes strongly consistent."
    ],
    scale: {
      users: 100000,
      peakQps: 1000
    },
    requirements: {
      consistency: "strong",
      availability: "99.9%",
      latencyMs: 200
    }
  },
  domain: {
    entities: [
      {
        name: "PointAccount",
        description: "Owns the current point balance for one user.",
        fields: [
          { name: "userId", type: "UserId", required: true },
          { name: "balance", type: "Integer", required: true }
        ],
        relations: [
          {
            name: "transactions",
            targetEntity: "PointTransaction",
            type: "one-to-many"
          }
        ]
      },
      {
        name: "PointTransaction",
        description: "Auditable record of one point balance change.",
        fields: [
          { name: "amount", type: "Integer", required: true },
          { name: "reason", type: "String", required: true }
        ]
      }
    ]
  },
  architecture: {
    components: [
      {
        id: "point-service",
        name: "Point Service",
        description: "Owns point account commands and transaction history.",
        type: "service",
        capabilities: ["transactional-command-handling", "point-ledger"],
        limitations: ["does-not-render-ui"],
        contracts: [
          {
            name: "AddPoint",
            protocol: "REST",
            inputs: [
              {
                name: "AddPointRequest",
                fields: [
                  { name: "userId", type: "UserId", required: true },
                  { name: "amount", type: "Integer", required: true }
                ]
              }
            ],
            outputs: [
              {
                name: "PointResult",
                fields: [
                  { name: "balance", type: "Integer", required: true }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "ledger-store",
        name: "Ledger Store",
        description: "Durable system of record for point transactions.",
        type: "database",
        capabilities: ["transactional-storage", "durable-ledger"],
        limitations: ["not-a-cache"]
      }
    ],
    connections: [
      {
        id: "point-service-to-ledger-store",
        from: "point-service",
        to: "ledger-store",
        protocol: "SQL",
        description: "Persist point account mutations and transaction records."
      }
    ]
  },
  constraints: [
    {
      type: "consistency",
      description: "Point balance updates must be strongly consistent.",
      value: "strong"
    }
  ],
  decisions: [
    {
      title: "Use transactional storage for point ledger",
      context: "Point transactions require correctness before scale-out complexity.",
      decision: "Store point ledger data in a transactional storage component.",
      alternatives: ["Use cache as primary ledger"],
      rationale: "Cache-first storage cannot provide the required durability and consistency boundary."
    }
  ],
  evolution: {
    phases: [
      {
        name: "V1",
        description: "Launch with a service and transactional ledger store.",
        changes: ["Create Point Service", "Create Ledger Store"]
      },
      {
        name: "V2",
        description: "Add read cache when query load exceeds target.",
        changes: ["Add read cache component"]
      }
    ]
  }
};
```
