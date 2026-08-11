# 当前证据链 / Current Evidence Chain

更新时间 / Updated at: 2026-08-11 20:30 CST (Asia/Shanghai)

- 模块入口 / Module entry: `packages/architecture-layout/src/index.ts`
- 模块说明 / Module README: `packages/architecture-layout/README.md`
- Workspace 识别 / Workspace discovery: `pnpm-workspace.yaml` 的 `packages/*` 通配符 / `packages/*` glob in `pnpm-workspace.yaml`
- Workspace 门禁 / Workspace gate: `scripts/ci/check-workspace.mjs`
- 验证 / Validation: `pnpm list -r --depth -1`、`pnpm lint:workspace`、`pnpm build`、`pnpm test` 均通过 / all passed
- 设计 / Design: `docs/architecture-layout.md`
- 决策 / Decisions: `docs/architecture-layout-decisions.md`
- 路线图 / Roadmap: `docs/ui-mvp-roadmap.md`

- Module entry: `packages/architecture-layout/src/index.ts`
- Module README: `packages/architecture-layout/README.md`
- Workspace discovery: the `packages/*` glob in `pnpm-workspace.yaml`
- Workspace gate: `scripts/ci/check-workspace.mjs`
- Validation: `pnpm list -r --depth -1`, `pnpm lint:workspace`, `pnpm build`, and `pnpm test` all passed
- Design: `docs/architecture-layout.md`
- Decisions: `docs/architecture-layout-decisions.md`
- Roadmap: `docs/ui-mvp-roadmap.md`
- Master Plan: `docs/ui-v1-execution-plan.md` Phase 1
- Documentation validation: 10 Decisions, 11 Checkpoints, 12 required risks; workspace lint/build/test passed / 文档验证与 workspace lint/build/test 均通过
- Master planning validation: 8 Phases, 10 canonical Decisions/crosswalk entries, 15 risks; full lint/build/test passed / Master Plan 与完整 baseline 通过
