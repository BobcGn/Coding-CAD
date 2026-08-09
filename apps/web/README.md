# Web App / Web 应用

该应用未来会成为架构可视化编辑器。

This app will become the architecture visual editor.

第一版 UI 应该渲染和编辑 Architecture IR，而不是直接生成代码。等 IR、DSL 和 validator 足够稳定后，可以加入 React Flow 或类似图编辑框架来驱动可视化模型。

The first UI should render and edit Architecture IR rather than generate code directly. React Flow or a similar graph editor can be added once the IR, DSL, and validator become stable enough to drive a useful visual model.

## UI MVP Roadmap / UI MVP 路线图

### Architecture Workspace / 架构工作区

- Architecture Canvas / 架构画布
- Component Palette / 组件面板
- Property Inspector / 属性检查器
- Architecture Review / 架构审核
- Ghost Architecture Suggestions / 架构建议预览

### Repository Workflow / 仓库工作流

- 打开本地仓库 / Open a local repository
- 导入并分析仓库 / Import and analyze a repository
- 展示反演后的 Architecture IR / Show reconstructed Architecture IR
- 展示架构合规状态 / Show architecture compliance status

### Integrated Terminal Infrastructure / 集成终端基础设施

- xterm.js 或同类终端视图 / xterm.js or an equivalent terminal view
- 由 server 或 desktop host 提供 PTY bridge / PTY bridge provided by a server or desktop host
- 多标签页和多终端会话 / Multiple tabs and terminal sessions
- 记录 session cwd、pid、status 和 exit status / Track session cwd, pid, status, and exit status
- 默认 cwd 绑定当前 Coding CAD Workspace 的代码仓库 / Bind the default cwd to the current Coding CAD Workspace repository
- 允许用户运行 `codex`、`claude`、`opencode` 或任意 shell 命令 / Let users run `codex`, `claude`, `opencode`, or arbitrary shell commands

终端只管理操作系统进程和 PTY。Coding Agent 始终由用户管理；这里不实现 Agent Provider、Agent Runtime、Agent SDK 调用或调度器。本阶段只记录路线图，不实现终端。

The terminal manages only operating-system processes and PTYs. Coding Agents remain user-managed; this layer does not implement Agent Providers, an Agent Runtime, Agent SDK invocation, or a scheduler. This phase records the roadmap only and does not implement the terminal.
