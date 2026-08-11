# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-11 19:30 CST (Asia/Shanghai)

- Architecture IR 是架构事实来源，Layout 只是投影。
- package 必须保持纯 TypeScript，不依赖 UI、DOM 或 CSS。
- `architecture-layout` 不得依赖 `apps/web`、Svelte、SvelteKit 或 Svelte Flow。
- 未确认的 public API 不得从 `src/index.ts` 导出。
- 推荐 solver、direction 和 worker boundary 不构成最终决定。

- Architecture IR is the architecture source of truth; Layout is only a projection.
- The package must remain pure TypeScript without UI, DOM, or CSS dependencies.
- `architecture-layout` must not depend on `apps/web`, Svelte, SvelteKit, or Svelte Flow.
- Unconfirmed public APIs must not be exported from `src/index.ts`.
- A recommended solver, direction, or worker boundary is not a final decision.
