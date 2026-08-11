# Web App / Web 应用

该应用未来会成为 SvelteKit Architecture Workspace UI，是 Architecture IR 与 LayoutResult 的产品交互层。

This app will become the SvelteKit Architecture Workspace UI, the product interaction layer over Architecture IR and LayoutResult.

第一版 UI 应该渲染和编辑 Architecture IR，而不是直接生成代码。未来的 SvelteKit 产品 UI 可以使用 Svelte Flow 作为 Architecture IR 与 LayoutResult 的交互视图。

The first UI should render and edit Architecture IR rather than generate code directly. The future SvelteKit product UI may use Svelte Flow as an interactive view over Architecture IR and LayoutResult.

```text
ArchitectureProject
  -> @coding-cad/architecture-layout
  -> LayoutResult
  -> apps/web layout adapter
  -> Svelte Flow
  -> Architecture Canvas
```

UI 不能成为新的 Architecture Source of Truth。Svelte Flow state 不能代替 ArchitectureProject；选择、viewport、坐标和展开状态属于 View State，架构语义变更必须通过 commands、Validator 和 Review。

The UI must not become a new Architecture Source of Truth. Svelte Flow state cannot replace ArchitectureProject; selection, viewport, coordinates, and expansion belong to View State, while architecture-semantic changes must pass through commands, Validators, and Review.

## 当前结构阶段 / Current Structure Phase

`apps/web` 当前仍是 TypeScript placeholder，不是已初始化的 SvelteKit 项目。本阶段只建立 `src/lib` 下的 Architecture、CAD、Layout UI adapter 与 Terminal TODO 目录边界，不初始化 SvelteKit，也不实现 UI。

`apps/web` remains a TypeScript placeholder and is not an initialized SvelteKit project. This phase only establishes Architecture, CAD, Layout UI adapter, and Terminal TODO boundaries under `src/lib`; it neither initializes SvelteKit nor implements UI.

## UI MVP Roadmap / UI MVP 路线图

### Architecture Workspace / 架构工作区

- Architecture Canvas / 架构画布
- Component Palette / 组件面板
- Property Inspector / 属性检查器
- Architecture Review / 架构审核
- Ghost Architecture Suggestions / 架构建议预览
- Problems / Validation / 问题与校验
- Execution Blueprint / Handoff / 执行蓝图与交接

Canvas 是产品第一公民。Svelte Flow 未来只负责 node/edge rendering、selection、viewport、pan、zoom 和 connection interaction，不负责 Architecture model、reasoning、validation 或 semantic layout。

The Canvas is a first-class product surface. Svelte Flow will own only node/edge rendering, selection, viewport, pan, zoom, and connection interaction, not the Architecture model, reasoning, validation, or semantic layout.

Inspector 以 Component semantics、Contracts、Constraints、Decisions、Dependencies、Implementation status 和 Validation issues 为主，不是 width/height/color/border 属性面板。

The Inspector centers on Component semantics, Contracts, Constraints, Decisions, Dependencies, Implementation status, and Validation issues; it is not a width/height/color/border property panel.

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

## 测试计划 / Test Plan

未来 UI 测试计划使用 Vitest、Svelte component tests 和 Playwright，覆盖 Greenfield、Brownfield、Canvas、Inspector、Ghost accept/reject、Review 与 Blueprint handoff。工具尚未安装，本阶段不授权安装。

Future UI tests plan to use Vitest, Svelte component tests, and Playwright to cover Greenfield, Brownfield, Canvas, Inspector, Ghost accept/reject, Review, and Blueprint handoff. These tools are not installed, and this phase does not authorize installation.

## 详细文档 / Detailed Documentation

- [UI Architecture](../../docs/ui-architecture.md)
- [Architecture Layout Design](../../docs/architecture-layout.md)
- [Decision Required](../../docs/architecture-layout-decisions.md)
- [UI MVP Roadmap](../../docs/ui-mvp-roadmap.md)
