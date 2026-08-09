# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-09 22:22 CST (Asia/Shanghai)

## WEB-001: IR Graph View / IR 图视图

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 等待 DSL/IR/Validator 更稳定。
- 解除条件 / Exit condition: 提供只读 IR graph view，再逐步开放编辑能力。

## WEB-002: Integrated Terminal Infrastructure / 集成终端基础设施

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 路线图已记录；本阶段不实现终端。
- 目标 / Goal: 在产品宿主中提供 xterm.js 或同类视图、PTY bridge、多标签页/会话、repository cwd 绑定，以及 cwd/pid/status/exit status 记录。
- 用户进程 / User processes: 支持用户自行运行 `codex`、`claude`、`opencode` 或任意 shell 命令。
- 边界 / Boundary: 只管理 OS Process / PTY；不实现 Agent Provider、Agent Runtime、Agent SDK 调用、Agent Memory、Tool Call 或 Scheduler。

- Status: Pending
- Current handling: The roadmap is recorded; no terminal is implemented in this phase.
- Goal: Provide an xterm.js or equivalent view, PTY bridge, multiple tabs/sessions, repository cwd binding, and cwd/pid/status/exit-status records in the product host.
- User processes: Let users run `codex`, `claude`, `opencode`, or arbitrary shell commands themselves.
- Boundary: Manage OS Processes / PTYs only; do not implement Agent Providers, an Agent Runtime, Agent SDK invocation, Agent Memory, Tool Calls, or a Scheduler.
