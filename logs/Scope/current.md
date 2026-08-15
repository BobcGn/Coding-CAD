# 当前范围 / Current Scope

更新时间 / Updated at: 2026-08-15 23:05 CST (Asia/Shanghai)

## 本轮目标 / Current Objective

在 `codex/phase-3-greenfield-workspace` 上确认 P3-D2 决策边界并开始 Phase 3 实现：用户明确「LLM 在生成部分无职责，仅负责后续审批等功能」，将该边界写入决策与 UI 架构文档，然后从 P3.0（契约与宿主冻结）开始窄切片实现。

Confirm the P3-D2 decision boundary and begin Phase 3 implementation on `codex/phase-3-greenfield-workspace`: the user stated that "LLM has no role in generation and is limited to later approval/review support"; record that boundary in the Decisions and UI architecture documents, then start narrow-slice implementation from P3.0 (contract and host freeze).

## 边界 / Boundaries

- 本轮先落实 P3-D2 决策文档，再开始 P3.0/P3.1 窄切片；不跨入 P3.2 及以后切片。
- P3-D1 与 P3-D3 未由用户确认前，不进入 P3.1/P3.5 的实现边界。
- 保留 ArchitectureProject 唯一事实来源、Phase 2 adapter/worker/command application 和 D-006 Workspace ownership。
- 不实现 Brownfield、Ghost、完整 Review、Handoff、Terminal 或真实 LLM Provider。
- 不修改 Architecture IR/DSL，不冻结 generic Inspector patch 或 workspace disk schema。

- This slice first records the P3-D2 decision, then starts narrow-slice implementation at P3.0/P3.1; it does not cross into P3.2 or later slices.
- Do not enter the P3.1/P3.5 implementation boundaries before P3-D1 and P3-D3 are confirmed by the user.
- Preserve ArchitectureProject as the sole source of truth, the Phase 2 adapter/worker/command application, and D-006 Workspace ownership.
- Do not implement Brownfield, Ghost, complete Review, Handoff, Terminal, or a real LLM Provider.
- Do not change Architecture IR/DSL or freeze a generic Inspector patch or Workspace disk schema.

## 验收标准 / Acceptance Criteria

- P3-D2 的 LLM 边界（生成零 LLM，LLM 仅限审批等下游支持）已写入 Decisions、Master Plan、Roadmap 与 UI 架构文档。
- TODO-009 定位为审批侧 LLM 支持，生成侧不预留 LLM 调用点。
- P3.0 输出契约、宿主边界与生命周期矩阵；P3.1 建立 Workspace host bridge 最小实现。
- 文档与根级/模块级日志同步，验证命令通过。

- The P3-D2 LLM boundary (zero LLM in generation; LLM limited to downstream approval/review support) is written into Decisions, the Master Plan, Roadmap, and UI architecture documents.
- TODO-009 is refocused as approval-side LLM support with no generation-side LLM call sites.
- P3.0 produces contracts, the host boundary, and the lifecycle matrix; P3.1 establishes a minimal Workspace host bridge.
- Documents and root/module logs are aligned and verification commands pass.
