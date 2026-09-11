# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-08 22:34 CST (Asia/Shanghai)

## ARCHITECTURE-AGENT-001: Review-Side LLM Support / 审批侧 LLM 支持

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 生成流程完全 deterministic（P3-D2，2026-08-15 用户确认：LLM 在生成部分无职责）；不再导出 LLM Provider 接口。
- 边界 / Boundary: LLM 只允许出现在审批/评审等下游辅助环节；生成侧任何 LLM 接入都需要新的用户决策。
- 解除条件 / Exit condition: 定义审批侧 LLM 支持的错误处理、超时、结构化输出校验和审计记录，且不触碰生成流程。

## ARCHITECTURE-AGENT-002: Generalized Planning Heuristics / 通用规划启发式

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 第一阶段重点覆盖积分系统和强一致账本类需求。
- 解除条件 / Exit condition: 支持更多领域模板，并通过 Registry/Validator 约束生成可解释架构。
