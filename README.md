# Coding CAD

Coding CAD 是 **Software Architecture CAD + AI Engineering Orchestration Layer**。

Coding CAD is a **Software Architecture CAD + AI Engineering Orchestration Layer**.

它不是低代码 CRUD 生成器，而是一个架构优先的平台：人类用可视化和结构化方式表达软件设计意图，AI Agent 在生成任何代码之前先理解架构、约束、执行蓝图和演进方向。

It is not a low-code CRUD generator. It is an architecture-first platform where humans express software design intent visually and structurally, so AI agents can understand architecture, constraints, execution blueprints, and evolution before producing code.

核心流程：

Core flow:

```text
Human visual intent
  -> Architecture Agent
  -> Architecture IR
  -> Architecture DSL
  -> Validator and Architecture Agent
  -> Execution Blueprint
  -> Agent Adapter
  -> External Coding Agent / Testing Agent
```

## Why This Exists / 为什么存在

Coding CAD 将软件架构建模为 AI 可以理解的中间表示层。

Coding CAD models software architecture as an intermediate representation that AI can understand.

它要表达：

It captures:

- 系统为什么存在 / why a system exists
- 哪些领域概念重要 / which domain concepts matter
- 模块之间如何交互 / how modules interact
- 哪些约束不能被破坏 / which constraints must not be broken
- 为什么选择这些技术 / why technologies were selected
- 系统未来如何演进 / how the architecture should evolve over time

长期资产不是生成出来的代码，而是可推理、可验证、可演进的架构模型。

The durable asset is not generated code. The durable asset is a reasoned, validated, and evolvable architecture model.

## MVP Scope / MVP 范围

第一版优先建设真正的核心能力。当前已完成架构建模、架构交换、架构校验、组件知识库、CLI 入口、第一阶段 Architecture Agent、Execution Blueprint 协议层和 Agent Adapter 渲染层。

The first version focuses on the core moat. The current implementation now includes architecture modeling, architecture exchange, architecture validation, component knowledge, the CLI entry point, the first Architecture Agent phase, the Execution Blueprint protocol layer, and the Agent Adapter rendering layer.

1. Architecture IR 类型定义 / Architecture IR type definitions
2. YAML DSL 解析与生成 / YAML DSL parser and generator
3. 基础架构验证器 / Basic architecture validator
4. 组件能力知识库 / Component capability knowledge base
5. CLI 架构分析与设计入口 / CLI architecture analysis and design entry point
6. Architecture Agent 架构推理层 / Architecture Agent reasoning layer
7. Execution Blueprint 工程实施协议 / Execution Blueprint implementation protocol
8. Agent Adapter 外部 Coding Agent 指导文档渲染 / External Coding Agent instruction rendering
9. 面向未来编排的 Agent Runtime 边界 / Agent-runtime boundaries for future orchestration

React / React Flow 编辑器会延后，直到 DSL 和 IR 被证明足够有用。UI 应该是模型的视图，而不是模型本身。

The React / React Flow editor is intentionally deferred until the DSL and IR prove useful. A UI should be a view over the model, not the model itself.

## Workspace / 工作区

本仓库使用 pnpm workspaces 和 Turborepo。

This repository uses pnpm workspaces and Turborepo.

```text
apps/
  web/       架构可视化编辑器 shell / Architecture visual editor shell
  server/    DSL 解析、验证和未来 Agent API / DSL parsing, validation, and future agent APIs
packages/
  architecture-ir/       核心架构中间表示 / Core architecture intermediate representation
  architecture-dsl/      YAML 架构描述语言 / YAML architecture description language
  component-registry/    组件能力知识库 / Component capability knowledge base
  architecture-validator/ 架构诊断和规则检查 / Architecture diagnostics and rule checks
  cli/                   命令行入口 / Command-line entry point
  architecture-agent/    架构推理助手 / Architecture reasoning assistant
  execution-blueprint/   工程实施蓝图协议 / Implementation handoff blueprint protocol
  agent-adapter/         外部 Agent 指导文档渲染 / External Agent instruction renderer
  agent-runtime/         未来 AI Agent 编排边界 / Future AI agent orchestration boundary
  README.md              核心代码架构地图 / Core code architecture map
docs/
  architecture.md
  documentation-guidelines.md
  logging-system.md
```

## Core Package Architecture / 核心 Package 架构

核心代码采用单向依赖：基础模型位于 `architecture-ir`，其他 package 围绕它做解析、验证、知识补全和未来编排。

Core code uses one-way dependencies: the foundational model lives in `architecture-ir`, and other packages parse, validate, enrich, or orchestrate around it.

```text
architecture-dsl       -> architecture-ir
component-registry     -> architecture-ir
architecture-validator -> architecture-ir + component-registry
cli                    -> architecture-dsl + architecture-ir
                          + architecture-validator + component-registry
architecture-agent     -> architecture-ir + architecture-dsl
                          + architecture-validator + component-registry
execution-blueprint    -> architecture-ir + architecture-validator
                          + component-registry
agent-adapter          -> execution-blueprint
agent-runtime          -> architecture-ir
apps/*                 -> public package APIs
```

详细的 package 边界、数据流和扩展规则见 [`packages/README.md`](packages/README.md)。

See [`packages/README.md`](packages/README.md) for package boundaries, data flow, and extension rules.

## Commands / 命令

```bash
pnpm install
pnpm ci:verify
pnpm build
pnpm typecheck
pnpm test
```

CLI 当前支持架构校验、结构检查、格式化，以及从自然语言需求生成 Architecture IR。

The CLI currently supports architecture validation, structure inspection, formatting, and Architecture IR generation from natural-language requirements.

```bash
pnpm --filter @coding-cad/cli start -- design "设计一个积分系统，100万用户，积分不能丢失"
pnpm --filter @coding-cad/cli start -- validate architecture.yaml
pnpm --filter @coding-cad/cli start -- inspect architecture.yaml
pnpm --filter @coding-cad/cli start -- format architecture.yaml
```

推送前门禁和 GitHub Actions 说明见 [`docs/ci-cd.md`](docs/ci-cd.md)。

See [`docs/ci-cd.md`](docs/ci-cd.md) for the pre-push gate and GitHub Actions pipeline.

## Design Principles / 设计原则

- 架构优先 / Architecture first
- 类型安全 / Type safety
- 对 AI 友好 / AI friendly
- 可扩展插件架构 / Extensible plugin architecture
- 领域驱动设计 / Domain driven design
- 逻辑架构与具体技术绑定分离 / Logic architecture separated from concrete technology binding

## Documentation Rule / 文档规则

所有面向项目的 Markdown 文档必须始终保持中英双语。

All project-facing Markdown documentation must remain bilingual in Chinese and English.

文档和代码注释应该解释“为什么”和“调用者必须知道什么”，避免重复代码字面含义。接口契约、约束、不变量和设计取舍必须写清楚。

Documentation and code comments should explain why something exists and what callers must know, while avoiding repetition of literal code behavior. Interface contracts, constraints, invariants, and design tradeoffs must be explicit.
