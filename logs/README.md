# Coding CAD 工作日志 / Coding CAD Work Logs

`logs/` 是 Coding CAD 项目实施过程的可观测入口。

`logs/` is the observable entry point for Coding CAD implementation work.

每轮涉及仓库分析、架构决策或代码变更的工作结束前，应同步更新下列五份当前记录：

Before finishing any work that changes repository analysis, architecture decisions, or code, update these five current records:

- `State/current.md`：当前事实、进度、验证结果和可回退点 / current facts, progress, validation results, and rollback points
- `Scope/current.md`：本轮目标、边界和验收条件 / current objective, boundaries, and acceptance criteria
- `Standards/current.md`：实施约束、质量门槛和禁止的顺手优化 / implementation constraints, quality gates, and avoided opportunistic changes
- `Links/current.md`：需求、事件、变更和验证之间的证据链 / evidence chain between requests, events, changes, and validation
- `Todo/current.md`：仍有效的待办、人工确认项、当前处理和解除条件 / active TODOs, human confirmations, current handling, and exit conditions

`implementation-log.md` 记录历史实施流水；五个 `current.md` 只描述最新状态。

`implementation-log.md` records historical implementation slices; the five `current.md` files describe the latest state only.

## Module Logs / 模块日志

`logs/modules/<module>/` 使用同样结构记录模块级状态。

`logs/modules/<module>/` uses the same structure for module-level state.

模块日志只描述该模块的范围、状态、证据和待办；跨模块事实以根日志为准。

Module logs describe only module-local scope, state, evidence, and TODOs; cross-module facts belong in the root logs.

## Status Words / 状态词

- `待处理 / Pending`：已进入范围，尚未开始 / in scope, not started
- `进行中 / In Progress`：已有实际分析或修改，仍缺少验收 / analysis or edits started, acceptance not complete
- `已验证 / Verified`：变更和相应验证均已完成 / changes and validation are complete
- `阻塞 / Blocked`：无法在当前授权或环境下继续，必须写明证据 / cannot continue under current authorization or environment; evidence is required
