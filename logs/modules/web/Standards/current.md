# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-09 22:22 CST (Asia/Shanghai)

- UI 必须以 Architecture IR 为事实源。
- 不直接从 UI 生成业务代码。
- 未来 React Flow 只作为 IR graph 的视图和编辑器。
- 未来终端只管理 OS Process / PTY 和会话生命周期，不拥有或编排 Coding Agent。

- UI must use Architecture IR as the source of truth.
- Do not generate application code directly from UI state.
- Future React Flow work should be a view and editor over the IR graph.
- Future terminal work manages only OS Processes / PTYs and session lifecycles; it does not own or orchestrate Coding Agents.
