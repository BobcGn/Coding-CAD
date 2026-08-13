# Coding CAD Architecture Notes / 架构说明

Coding CAD 将软件架构视为一等设计资产。

Coding CAD treats software architecture as a first-class design artifact.

## Core Model / 核心模型

Architecture IR 描述以下内容：

The Architecture IR describes:

- 项目意图 / project intent
- 领域模型 / domain model
- 架构图 / architecture graph
- 组件契约 / component contracts
- 技术绑定 / technology bindings
- 约束 / constraints
- 演进计划 / evolution plan
- 架构决策 / architecture decisions

YAML DSL 是 IR 的人类可读投影；Architecture Agent 从需求产生候选 IR；Implementation Analyzer 从已有仓库反演实际 IR；Implementation Validator 比较批准 IR 与实际 IR；Workspace 保存 IR 生命周期；Architecture Review 管理人工审核和批准门禁；Architecture Layout 将 IR 投影为 renderer-independent LayoutResult；Execution Blueprint 只接收批准后的 IR；Agent Adapter 只渲染已有 Blueprint。未来的可视化编辑器也应该读写同一份 IR。

The YAML DSL is a human-readable projection of the IR; Architecture Agent produces candidate IR from requirements; Implementation Analyzer reverse-engineers actual IR from existing repositories; Implementation Validator compares approved and actual IR; Workspace preserves the IR lifecycle; Architecture Review owns human review and the approval gate; Architecture Layout projects IR into renderer-independent LayoutResult; Execution Blueprint receives approved IR; Agent Adapter only renders an existing Blueprint. Future visual editors should also read and write the same IR.

## Dependency Direction / 依赖方向

```text
architecture-dsl       -> architecture-ir
component-registry     -> architecture-ir
architecture-validator -> architecture-ir + component-registry
cli                    -> architecture-dsl + architecture-ir
                          + architecture-validator + component-registry
                          + architecture-agent
architecture-agent     -> architecture-ir + architecture-dsl
                          + architecture-validator + component-registry
execution-blueprint    -> architecture-ir + architecture-validator
                          + component-registry
agent-adapter          -> execution-blueprint
workspace              -> architecture-ir + architecture-validator
                          + execution-blueprint
architecture-review    -> architecture-ir + architecture-validator
                          + workspace
implementation-analyzer -> architecture-ir
implementation-validator -> architecture-ir + execution-blueprint
                          + implementation-analyzer
architecture-layout    -> architecture-ir
apps                   -> public package APIs
```

箭头表示“依赖于”。高层 package 可以依赖低层 package，但低层 package 不应该知道 app、UI、server 或具体 Agent 的存在。

The arrows mean "depends on." Packages may depend on lower-level packages, but lower-level packages should not know about apps, UI, servers, or specific agents.

`architecture-layout` 必须保持纯 TypeScript 和 renderer-neutral；`apps/web` 中的唯一 adapter 把 LayoutResult 转为 Svelte Flow 类型。Phase 2 的 solver-only Web Worker 由 app host 提供 transport，ELK 仍留在 solver worker chunk。坐标、尺寸、viewport、collapsed 和 pinned 属于 Workspace/View State，不得进入 Architecture IR 或 DSL。

`architecture-layout` remains pure TypeScript and renderer-neutral; the sole adapter in `apps/web` converts LayoutResult into Svelte Flow types. The Phase 2 solver-only Web Worker transport is hosted by the app, while ELK remains in the solver worker chunk. Coordinates, dimensions, viewport, collapsed state, and pinned state belong to Workspace/View State and must not enter Architecture IR or the DSL.

## Agent Execution Boundary / Agent 执行边界

Coding CAD 不提供或编排 Coding Agent。它拥有架构建模、推理、验证、审核、规划和实施指导；Coding Agent 由用户自行管理。向下的稳定协议是 Execution Blueprint 与 Agent Guide，向上的反馈边界是 Repository、Implementation Analyzer 与 Implementation Validator。

Coding CAD does not provide or orchestrate Coding Agents. It owns architecture modeling, reasoning, validation, review, planning, and implementation guidance; Coding Agents are user-managed. The stable downward protocols are the Execution Blueprint and Agent Guide, while the upward feedback boundary is the Repository, Implementation Analyzer, and Implementation Validator.

```text
Architecture Canvas
  -> Architecture IR
  -> Architecture Review
  -> Execution Blueprint
  -> Agent Adapter
  -> Prompt / Guide
  -> Integrated Terminal
  -> User-managed Coding Agent
  -> Repository
  -> Implementation Analyzer
  -> Implementation Validator
  -> Architecture Feedback
```

集成终端未来只提供 OS Process / PTY 能力，包括会话、工作目录、标准输入输出、标签页、进程生命周期和退出状态。它不提供 Agent Provider、Agent Executor、Agent Memory、Tool Call 或 Agent Scheduler 抽象。

The future integrated terminal provides only OS Process / PTY capabilities: sessions, working directories, standard input/output, tabs, process lifecycle, and exit status. It does not provide Agent Provider, Agent Executor, Agent Memory, Tool Call, or Agent Scheduler abstractions.

## MVP Validation Examples / MVP 验证示例

早期 validator 规则聚焦架构误用：

Early validator rules focus on architectural misuse:

- Redis 被选择为事务数据库 / Redis selected as a transactional database
- MongoDB 承担主要强事务边界 / MongoDB used as the primary strong-transaction boundary
- 服务之间存在循环依赖 / circular dependencies between services

这些规则刻意保持简单。目标是先建立验证接口和诊断形态，而不是第一天就编码所有技术决策。

These rules are intentionally simple. The goal is to establish the validation surface, not to encode every technology decision on day one.
