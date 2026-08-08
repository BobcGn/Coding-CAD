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

YAML DSL 是 IR 的人类可读投影；Architecture Agent 读写 IR；Execution Blueprint 从 IR 生成给外部 Coding Agent 的实施协议。未来的可视化编辑器也应该读写同一份 IR。

The YAML DSL is a human-readable projection of the IR; Architecture Agent reads and writes IR; Execution Blueprint turns IR into an implementation protocol for external Coding Agents. Future visual editors should also read and write the same IR.

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
agent-runtime          -> architecture-ir
apps                   -> public package APIs
```

箭头表示“被谁依赖”。高层 package 可以依赖低层 package，但低层 package 不应该知道 app、UI、server 或具体 Agent 的存在。

The arrows mean "is depended on by". Packages may depend on lower-level packages, but lower-level packages should not know about apps, UI, servers, or specific agents.

## MVP Validation Examples / MVP 验证示例

早期 validator 规则聚焦架构误用：

Early validator rules focus on architectural misuse:

- Redis 被选择为事务数据库 / Redis selected as a transactional database
- MongoDB 承担主要强事务边界 / MongoDB used as the primary strong-transaction boundary
- 服务之间存在循环依赖 / circular dependencies between services

这些规则刻意保持简单。目标是先建立验证接口和诊断形态，而不是第一天就编码所有技术决策。

These rules are intentionally simple. The goal is to establish the validation surface, not to encode every technology decision on day one.
