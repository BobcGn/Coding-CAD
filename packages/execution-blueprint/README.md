# Execution Blueprint / 执行蓝图

`@coding-cad/execution-blueprint` turns Architecture IR into an implementation handoff contract for external Coding Agents.

`@coding-cad/execution-blueprint` 将 Architecture IR 转换为外部 Coding Agent 可执行的工程实施交接协议。

## Why This Exists / 为什么需要它

Coding CAD is not a Coding Agent.

Coding CAD 不是 Coding Agent。

Coding CAD owns architecture design, decisions, constraints, validation, and planning. External Coding Agents own code changes, file edits, tests, and engineering execution.

Coding CAD 负责架构设计、决策、约束、校验和规划。外部 Coding Agent 负责代码修改、文件编辑、测试和工程执行。

Execution Blueprint is the protocol layer between them:

Execution Blueprint 是两者之间的协议层：

```text
ArchitectureProject
  -> ExecutionBlueprint
  -> future prompt / guide adapters
  -> external Coding Agent
```

## Difference from Architecture IR / 与 Architecture IR 的区别

Architecture IR describes what the system is and why it is designed that way.

Architecture IR 描述系统是什么，以及为什么这样设计。

Execution Blueprint describes how an external Coding Agent should approach implementation without changing the architecture.

Execution Blueprint 描述外部 Coding Agent 应该如何实施，同时不改变架构。

The blueprint contains:

Blueprint 包含：

- implementation tasks / 实施任务
- implementation constraints / 实施约束
- an external agent guide / 外部 Agent 指南
- architecture and decision references / 架构与决策引用

## Relationship to Coding Agents / 与 Coding Agent 的关系

This package does not generate code, modify files, or bind to Codex, Claude Code, Devin, Cursor, or any specific agent runtime.

本 package 不生成代码、不修改文件，也不绑定 Codex、Claude Code、Devin、Cursor 或任何具体 Agent Runtime。

Future adapters may render the same `ExecutionBlueprint` as:

未来适配器可以将同一个 `ExecutionBlueprint` 渲染为：

- Codex Prompt Markdown
- Claude Code Guide Markdown
- Generic Agent Instruction JSON

The first phase only implements the internal blueprint model and deterministic generator.

第一阶段只实现内部 Blueprint 模型和确定性生成器。

## Source of Truth / 事实来源

All tasks come from Architecture IR components, connections, constraints, and decisions.

所有任务都来自 Architecture IR 的组件、连接、约束和决策。

All implementation constraints come from:

所有实现约束来自：

- Architecture Constraints
- Architecture Decisions
- Validator Results
- Component Registry limitations

## Usage / 使用方式

```ts
import { generateExecutionBlueprint } from "@coding-cad/execution-blueprint";

const blueprint = generateExecutionBlueprint(architectureProject);
```

The generator validates the architecture by default so validator findings can become explicit implementation constraints. Callers that already have a `ValidationResult` can pass it in to avoid re-validating.

生成器默认会校验架构，因此 Validator findings 可以成为显式实施约束。调用方如果已经拥有 `ValidationResult`，也可以传入以避免重复校验。

## Design Principles / 设计原则

- Architecture IR remains the center.
- Execution Blueprint does not replace Architecture IR.
- The package does not generate code.
- The package does not bind to a specific Coding Agent.
- Blueprint tasks and constraints must be explainable and traceable.

- Architecture IR 永远是中心。
- Execution Blueprint 不替代 Architecture IR。
- 本 package 不生成代码。
- 本 package 不绑定具体 Coding Agent。
- Blueprint 任务和约束必须可解释、可追溯。
