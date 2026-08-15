# 当前范围 / Current Scope

更新时间 / Updated at: 2026-08-15 22:40 CST (Asia/Shanghai)

模块 / Module: `apps/web`

当前范围：Phase 3 Greenfield Architecture Workspace 实现规划。Phase 2 已验证并合并；本轮规划 P3.0–P3.7 详细切片，不实现 UI 或持久化。

Current scope: Phase 3 Greenfield Architecture Workspace implementation planning. Phase 2 is verified and merged; this slice defines detailed P3.0–P3.7 slices and implements no UI or persistence.

## 边界 / Boundaries

- 只做 Phase 3 详细规划与文档同步，不实现 Greenfield UI 或持久化。
- P3-D1–P3-D3 未由用户确认前，不进入对应实现边界。
- 不实现 Brownfield、Ghost、完整 Review、Handoff、Terminal 或真实 LLM Provider。
- 不修改 Architecture IR/DSL，不冻结 generic Inspector patch 或 workspace disk schema。

- This slice performs detailed Phase 3 planning and document synchronization only; it implements no Greenfield UI or persistence.
- Do not enter the corresponding implementation boundary before P3-D1 through P3-D3 are confirmed by the user.
- Do not implement Brownfield, Ghost, complete Review, Handoff, Terminal, or a real LLM Provider.
- Do not change Architecture IR/DSL or freeze a generic Inspector patch or Workspace disk schema.

## 验收标准 / Acceptance Criteria

- 每个 P3.x 切片有 Goal、Input、Output、Acceptance、Risk 与 Non-goal。
- 切片顺序严格、可独立验收，Decision gate 明确。
- 文档与根级/模块级日志同步。
- 文档结构、Git 边界和 workspace 基线检查通过。

- Each P3.x slice has Goal, Input, Output, Acceptance, Risk, and Non-goal.
- Slices are strictly ordered and independently acceptable with explicit Decision gates.
- Documents and root/module logs are aligned.
- Documentation structure, Git boundaries, and the workspace baseline remain passing.
