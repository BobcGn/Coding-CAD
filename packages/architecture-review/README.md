# `@coding-cad/architecture-review`

`architecture-review` 是候选 Architecture IR 与现有 Execution Blueprint 流程之间的 Human-in-the-loop 控制门禁。

`architecture-review` is the human-in-the-loop control gate between candidate Architecture IR and the existing Execution Blueprint pipeline.

```text
Architecture Agent -> Proposal -> Human Review -> Approved Architecture IR
                                                    |
                                                    v
                                      Execution Blueprint (existing package)
```

## 职责 / Responsibilities

- 保存基线和候选 `ArchitectureProject` 的防御性副本，不修改输入。
- 管理 `draft`、`in-review`、`changes-requested`、`approved`、`rejected` 和 `withdrawn` 状态。
- 保存人工评论与不可变审批决定。
- 基于 Workspace diff 和 Validator 结果生成确定性的影响分析。
- 只有满足批准要求后，才释放候选 Architecture IR 的副本。

- Preserve defensive copies of baseline and candidate `ArchitectureProject` documents without mutating input.
- Manage `draft`, `in-review`, `changes-requested`, `approved`, `rejected`, and `withdrawn` states.
- Store human comments and immutable approval decisions.
- Produce deterministic impact analysis from Workspace diff and Validator results.
- Release a copy of candidate Architecture IR only after approval requirements are satisfied.

## 批准不变量 / Approval Invariants

- Proposal 必须先提交审核；每位 Reviewer 只能决定一次。
- 所需批准数必须显式设置，默认值为一。
- Validator 存在错误时禁止批准。
- `approved`、`rejected` 和 `withdrawn` 是终态。
- `changes-requested` 保留审核证据；修正后的架构应创建新的 Proposal。

- A Proposal must enter review first; each reviewer may decide once.
- Required approval count is explicit and defaults to one.
- A proposal with Validator errors cannot be approved.
- `approved`, `rejected`, and `withdrawn` are terminal.
- `changes-requested` preserves review evidence; corrected architecture should use a new Proposal.

## 边界 / Boundaries

本模块不修改 Architecture IR，不生成 Execution Blueprint，不渲染 Agent 指令，也不实现 UI、Agent 执行、代码生成或部署。调用方只能通过 `getApprovedArchitecture()` 获取批准后的 IR，再将其交给已有 `execution-blueprint` package。

This package does not mutate Architecture IR, generate Execution Blueprints, render Agent instructions, or implement UI, Agent execution, code generation, or deployment. Callers obtain approved IR through `getApprovedArchitecture()` and pass it to the existing `execution-blueprint` package.
