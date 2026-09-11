# 当前状态 / Current State

更新时间 / Updated at: 2026-08-15 22:45 CST (Asia/Shanghai)

## 总览 / Overview

状态：Phase 0–3 已验证并合并；Phase 3（Greenfield Architecture Workspace）按 P3.0–P3.7 全部实现并验证；P3-D1、P3-D2、P3-D3 已于 2026-08-15 全部由用户确认。完整 pnpm ci:verify 通过。Phase 4（Brownfield）为下一阶段。

Status: Phases 0–3 are verified and merged. Phase 3 (Greenfield Architecture Workspace) is fully implemented and verified across P3.0–P3.7; P3-D1, P3-D2, and P3-D3 were all confirmed by the user on 2026-08-15. The complete pnpm ci:verify passes. Phase 4 (Brownfield) is next.

Phase 3 规划为 P3.0–P3.7：contract/host freeze、Workspace host bridge、requirement-to-candidate、workspace shell/projection、Palette command entry、semantic Inspector、Save/Open lifecycle 与 phase acceptance。每个切片已在 `docs/ui-v1-execution-plan.md` 展开为 Goal、Input、Output、Acceptance Criteria、Known Risks、Non-goals 与 Exit Evidence 规格。P3-D2 已确认；P3-D1 与 P3-D3 保持待用户确认。

Phase 3 is planned as P3.0–P3.7: contract/host freeze, Workspace host bridge, requirement-to-candidate, workspace shell/projection, Palette command entry, semantic Inspector, Save/Open lifecycle, and phase acceptance. Each slice is expanded in `docs/ui-v1-execution-plan.md` with Goal, Input, Output, Acceptance Criteria, Known Risks, Non-goals, and Exit Evidence specifications. P3-D2 is confirmed; P3-D1 and P3-D3 remain pending user confirmation.

Phase 2 已按 P2.0–P2.6 窄切片完成：SvelteKit/Svelte 5 app foundation、唯一 LayoutResult-to-Svelte-Flow adapter、基础 Canvas、Standard + Semantic Zoom、LayoutState-only drag、Auto Layout reset、solver-only Web Worker，以及 renderer-neutral Add/Remove/Connect command application。

Phase 2 is complete across slices P2.0–P2.6: the SvelteKit/Svelte 5 app foundation, sole LayoutResult-to-Svelte-Flow adapter, foundational Canvas, Standard + Semantic Zoom, LayoutState-only drag, Auto Layout reset, solver-only Web Worker, and renderer-neutral Add/Remove/Connect command application.

命令链路为 `command -> candidate -> Validator -> Architecture Review -> accepted ArchitectureProject -> layout -> Canvas projection`。validation failure 或 review rejection 保留原 accepted IR。Palette、Inspector、Greenfield、Ghost/Review UI、Terminal、pin 与磁盘持久化仍属于后续阶段。

The command path is `command -> candidate -> Validator -> Architecture Review -> accepted ArchitectureProject -> layout -> Canvas projection`. Validation failure or review rejection preserves the accepted IR. Palette, Inspector, Greenfield, Ghost/Review UI, Terminal, pinning, and disk persistence remain later-phase work.

## 当前变更 / Current Changes

- `apps/web` 已从 placeholder 原地转换为 SvelteKit/Svelte 5 app，未新建 UI package。
- `@xyflow/svelte` 仅通过 `apps/web/src/lib/layout/adapters` 进入 Canvas；core packages 不含 Svelte、DOM 或 Svelte Flow 类型。
- Workspace-owned LayoutState 持有拖拽位置；Architecture IR 未增加任何视觉状态字段。
- solver-only worker 保持 compiler passes 在调用侧，并隔离 ELK worker chunk。
- unit、integration、Svelte component 与 Playwright E2E 测试工具链已建立。
- UI/Layout design docs、Roadmap、Decision records、package/app README 与结构化日志已同步。

- `apps/web` is converted in place from a placeholder into a SvelteKit/Svelte 5 app; no new UI package was created.
- `@xyflow/svelte` enters the Canvas only through `apps/web/src/lib/layout/adapters`; core packages contain no Svelte, DOM, or Svelte Flow types.
- Workspace-owned LayoutState owns dragged positions; Architecture IR gained no visual-state fields.
- The solver-only worker keeps compiler passes caller-side and isolates the ELK worker chunk.
- Unit, integration, Svelte component, and Playwright E2E toolchains are established.
- UI/Layout design docs, Roadmap, Decision records, package/app READMEs, and structured logs are aligned.

## 验证结果 / Validation Results

- Web typecheck：0 errors / 0 warnings。
- Web unit：6 files / 9 tests；integration：1 file / 2 tests。
- Playwright Chrome E2E：1 passed，覆盖 load、render、select、zoom、pan、keyboard focus、drag、Auto Layout reset 与 semantic zoom。
- Web build：主页面约 65.71 KiB gzip；ELK 位于独立 worker chunk。
- 完整 workspace `pnpm ci:verify` 的最终证据记录在根实施日志。

- Web typecheck: 0 errors / 0 warnings.
- Web unit: 6 files / 9 tests; integration: 1 file / 2 tests.
- One Playwright Chrome E2E passes, covering load, render, select, zoom, pan, keyboard focus, drag, Auto Layout reset, and semantic zoom.
- Web build: the main page is about 65.71 KiB gzip; ELK remains in a separate worker chunk.
- Final full-workspace `pnpm ci:verify` evidence is recorded in the root implementation log.

## 回退点 / Rollback Point

回退 Phase 2 应逐文件恢复 `apps/web` placeholder 和对应 lockfile/docs/logs，保留已验证的 Phase 1 `architecture-layout` 实现与 Decision 历史；不得整体重置分支或回退来源不明的改动。

Roll back Phase 2 file by file by restoring the `apps/web` placeholder and corresponding lockfile/docs/logs while retaining the verified Phase 1 `architecture-layout` implementation and Decision history. Do not reset the branch wholesale or revert unrelated work.
