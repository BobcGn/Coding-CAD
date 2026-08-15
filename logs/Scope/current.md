# 当前范围 / Current Scope

更新时间 / Updated at: 2026-08-15 23:20 CST (Asia/Shanghai)

## 本轮目标 / Current Objective

在 `codex/phase-3-greenfield-workspace` 上完成 P3.0（契约与宿主冻结）并开始 P3.1（Workspace host bridge）：P3-D1、P3-D2、P3-D3 已全部由用户于 2026-08-15 确认，Phase 3 正式进入实现。

Complete P3.0 (contract and host freeze) and start P3.1 (Workspace host bridge) on `codex/phase-3-greenfield-workspace`: P3-D1, P3-D2, and P3-D3 were all confirmed by the user on 2026-08-15, and Phase 3 implementation has officially started.

## 边界 / Boundaries

- 本轮实现 P3.0/P3.1 窄切片；不跨入 P3.2 及以后切片。
- 保留 ArchitectureProject 唯一事实来源、Phase 2 adapter/worker/command application 和 D-006 Workspace ownership。
- 不实现 Brownfield、Ghost、完整 Review、Handoff、Terminal 或真实 LLM Provider。
- 不修改 Architecture IR/DSL，不冻结 workspace 磁盘格式；P3.1 只建立 bridge 最小切片。
- 浏览器不得导入 `node:*`、`FileWorkspaceStorage` 或磁盘 schema（P3-D1）。

- This slice implements the P3.0/P3.1 narrow slices; it does not cross into P3.2 or later slices.
- Preserve ArchitectureProject as the sole source of truth, the Phase 2 adapter/worker/command application, and D-006 Workspace ownership.
- Do not implement Brownfield, Ghost, complete Review, Handoff, Terminal, or a real LLM Provider.
- Do not change Architecture IR/DSL or freeze the Workspace disk format; P3.1 establishes only the minimal bridge slice.
- The browser must not import `node:*`, `FileWorkspaceStorage`, or disk schemas (P3-D1).

## 验收标准 / Acceptance Criteria

- P3.0 输出 browser-safe DTO 边界、SvelteKit server boundary 与四类生命周期所有权矩阵（已写入 `apps/web/src/lib/cad/workspace/README.md`）。
- 生成路径零 LLM（P3-D2 已落实：移除 `architecture-agent` 的 LLM 调用点）。
- P3.1 建立最小 Workspace host bridge：server boundary + typed create/open/save contract。
- 文档与根级/模块级日志同步，验证命令通过。

- P3.0 produces the browser-safe DTO boundary, SvelteKit server boundary, and four-lifecycle ownership matrix (recorded in `apps/web/src/lib/cad/workspace/README.md`).
- The generation path has zero LLM (P3-D2 implemented: LLM call sites removed from `architecture-agent`).
- P3.1 establishes a minimal Workspace host bridge: server boundary plus typed create/open/save contracts.
- Documents and root/module logs are aligned and verification commands pass.
