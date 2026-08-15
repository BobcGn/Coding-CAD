# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-15 22:40 CST (Asia/Shanghai)

本文件是 `apps/web` 模块仍有效 TODO 的单一事实源。

This file is the single source of truth for active `apps/web` module TODOs.

## WEB-001: Greenfield Architecture Workspace / Greenfield 架构工作区

- 状态 / Status: 规划完成，等待决策 / Planned, awaiting decisions
- 当前处理 / Current handling: P3.0–P3.7 详细切片已定义；Phase 3 分支已同步合并后的 main；尚未实现产品代码。
- 决策门禁 / Decision gates: P3-D1 Workspace host boundary、P3-D2 Greenfield generation mode、P3-D3 Inspector command granularity。
- 解除条件 / Exit condition: 用户确认三项门禁后，从 P3.0/P3.1 开始窄切片实现，并最终通过 Create/Display/Edit/Validate/Accept/Save/Open E2E 与完整 CI。

- Status: Planned, awaiting decisions
- Current handling: P3.0–P3.7 detailed slices are defined, and the Phase 3 branch is aligned with post-merge main; no product code is implemented.
- Decision gates: P3-D1 Workspace host boundary, P3-D2 Greenfield generation mode, and P3-D3 Inspector command granularity.
- Exit condition: After user confirmation, implement from P3.0/P3.1 in narrow slices and ultimately pass Create/Display/Edit/Validate/Accept/Save/Open E2E and full CI.

## WEB-002: Integrated Terminal Infrastructure / 集成终端基础设施

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 路线图已记录；本阶段不实现终端。
- 目标 / Goal: 在产品宿主中提供 xterm.js 或同类视图、PTY bridge、多标签页/会话、repository cwd 绑定，以及 cwd/pid/status/exit status 记录。
- 用户进程 / User processes: 支持用户自行运行 `codex`、`claude`、`opencode` 或任意 shell 命令。
- 边界 / Boundary: 只管理 OS Process / PTY；不实现 Agent Provider、Agent Runtime、Agent SDK 调用、Agent Memory、Tool Call 或 Scheduler。

- Status: Pending
- Current handling: The roadmap is recorded; no terminal is implemented in this phase.
- Goal: Provide an xterm.js or equivalent view, PTY bridge, multiple tabs/sessions, repository cwd binding, and cwd/pid/status/exit-status records in the product host.
- User processes: Let users run `codex`、`claude`、`opencode` or arbitrary shell commands themselves.
- Boundary: Manage OS Processes / PTYs only; do not implement Agent Providers, an Agent Runtime, Agent SDK invocation, Agent Memory, Tool Calls, or a Scheduler.
