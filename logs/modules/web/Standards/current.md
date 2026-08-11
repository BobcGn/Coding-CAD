# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-11 19:30 CST (Asia/Shanghai)

- UI 必须以 Architecture IR 为事实源。
- 不直接从 UI 生成业务代码。
- 未来 Svelte Flow 只作为 Architecture IR / LayoutResult 的视图和交互 adapter。
- 布局算法和 solver adapter 不得进入 `apps/web`。
- 未来终端只管理 OS Process / PTY 和会话生命周期，不拥有或编排 Coding Agent。
- Svelte Flow state 不得代替 ArchitectureProject；UI semantic edits 必须经过 command/validation/review 边界。

- UI must use Architecture IR as the source of truth.
- Do not generate application code directly from UI state.
- Future Svelte Flow work should be a view and interaction adapter over Architecture IR / LayoutResult.
- Layout algorithms and solver adapters must not enter `apps/web`.
- Future terminal work manages only OS Processes / PTYs and session lifecycles; it does not own or orchestrate Coding Agents.
- Svelte Flow state must not replace ArchitectureProject; UI semantic edits must pass through command, validation, and review boundaries.
