# Coding CAD UI Architecture / Coding CAD UI 架构

## 文档状态 / Document Status

状态：Phase 2 已验证；SvelteKit/Svelte 5、Svelte Flow adapter、基础 Canvas、solver-only worker 与 headless command application 已实现。

Status: Phase 2 is verified. SvelteKit/Svelte 5, the Svelte Flow adapter, foundational Canvas, solver-only worker, and headless command application are implemented.

## 核心原则 / Core Principle

UI 不能成为新的 Architecture Source of Truth。Architecture IR 描述系统是什么；LayoutResult 描述如何组织视觉结构；Svelte Flow 只渲染和交互；UI command 必须通过明确应用边界产生候选 ArchitectureProject 变更。

The UI must not become a new Architecture Source of Truth. Architecture IR describes what the system is; LayoutResult describes how its visual structure is organized; Svelte Flow only renders and interacts; UI commands must produce candidate ArchitectureProject changes through an explicit application boundary.

```text
ArchitectureProject
  -> @coding-cad/architecture-layout
  -> LayoutResult
  -> apps/web layout adapter
  -> Svelte Flow Node / Edge
  -> Architecture Canvas
```

反向交互不能直接把 Svelte Flow state 当作 ArchitectureProject。选择、viewport、展开、坐标和 pin 属于 View State；组件、连接、契约、约束和决策变更属于 Architecture commands，并继续经过 Validator/Review。

Reverse interaction must not treat Svelte Flow state as ArchitectureProject. Selection, viewport, expansion, coordinates, and pinning are View State; component, connection, contract, constraint, and decision changes are Architecture commands and continue through Validator and Review.

## 技术边界 / Technology Boundary

V1 技术为 SvelteKit + Svelte 5 + TypeScript；D-009 已批准并采用 `@xyflow/svelte` 作为可替换的 V1 Canvas renderer。

The V1 stack is SvelteKit + Svelte 5 + TypeScript; D-009 is implemented with `@xyflow/svelte` as the replaceable V1 Canvas renderer.

`@xyflow/svelte` 只能通过 `apps/web/src/lib/layout/adapters` 和 Canvas component 使用。它的类型不得进入 package public API、command、Architecture IR/DSL 或持久化 Workspace/LayoutState 格式。

`@xyflow/svelte` may be used only through `apps/web/src/lib/layout/adapters` and Canvas components. Its types must not enter package public APIs, commands, Architecture IR/DSL, or persisted Workspace/LayoutState formats.

`apps/web` 可以依赖 package public APIs；package 不得依赖 `apps/web`。`@coding-cad/architecture-layout` 不得导入 Svelte、DOM 或 Svelte Flow 类型。

`apps/web` may depend on package public APIs; packages must not depend on `apps/web`. `@coding-cad/architecture-layout` must not import Svelte, DOM, or Svelte Flow types.

## UI 区域 / Product Areas

### Architecture Canvas / 架构画布

Canvas 是产品第一公民。Svelte Flow 负责 node/edge rendering、selection、viewport、pan、zoom 和 connection interaction。

The Canvas is a first-class product surface. Svelte Flow owns node and edge rendering, selection, viewport, pan, zoom, and connection interaction.

Svelte Flow 不负责 Architecture model、reasoning、validation 或 semantic layout。`apps/web/src/lib/layout/adapters` 是唯一允许把 `LayoutResult` 转为 Svelte Flow Node/Edge 的边界；转换必须是单向、可测试且不把 Svelte Flow 类型反向泄漏到 package。

Svelte Flow does not own the Architecture model, reasoning, validation, or semantic layout. `apps/web/src/lib/layout/adapters` is the only boundary allowed to convert `LayoutResult` into Svelte Flow Nodes and Edges; conversion must be one-way and testable and must not leak Svelte Flow types back into packages.

### Inspector / 检查器

Inspector 主要展示和编辑 Component semantics、Contracts、Constraints、Decisions、Dependencies、Implementation status 和 Validation issues。它不是以 width、height、color、border 为核心的图形设计属性面板。

The Inspector primarily displays and edits Component semantics, Contracts, Constraints, Decisions, Dependencies, Implementation status, and Validation issues. It is not a graphic-design property panel centered on width, height, color, or borders.

### Component Palette / 组件面板

Palette 提供基于 Architecture IR/Registry 的候选组件创建入口。拖放是创建命令的交互形式，不代表 UI 拥有独立组件模型。

The Palette provides candidate-component creation based on Architecture IR and the Registry. Drag-and-drop is an interaction form for a creation command, not ownership of a separate UI component model.

### Architecture Review / 架构审核

Review UI 展示 Proposal、评论、批准门禁和影响分析。未批准 Proposal 只能以 proposal/ghost projection 出现，不能静默进入正式 ArchitectureProject。

The Review UI displays proposals, comments, approval gates, and impact analysis. An unapproved proposal may appear only as a proposal or Ghost projection and must not silently enter the accepted ArchitectureProject.

### Problems / Validation / 问题与校验

Problems 面板汇总 Architecture Validator 和 Implementation Validator 输出，并保持 issue provenance。布局偏好失败不得伪装成架构验证错误。

The Problems panel aggregates Architecture Validator and Implementation Validator output while preserving issue provenance. A failed layout preference must not be presented as an architecture-validation error.

### Execution Blueprint / Handoff / 执行蓝图与交接

批准后的 ArchitectureProject 才进入 Execution Blueprint。UI 展示 Blueprint 和 Agent Adapter 生成的 Prompt/Guide，但不运行 Agent runtime。

Only an approved ArchitectureProject enters Execution Blueprint generation. The UI displays Blueprints and Prompt/Guide output from Agent Adapter but does not run an Agent runtime.

```text
Approved ArchitectureProject
  -> Execution Blueprint
  -> Agent Adapter
  -> Prompt / Guide
  -> User-managed External Agent
```

### Terminal / 终端（后续）

Integrated Terminal Infrastructure 只负责 cwd、process lifecycle、stdin、stdout、stderr、tabs 和 status。未来链路为 `xterm.js -> WebSocket/host bridge -> PTY -> user shell`，用户自行启动 `codex`、`claude`、`opencode` 或其他 CLI Agent。

Integrated Terminal Infrastructure owns only cwd, process lifecycle, stdin, stdout, stderr, tabs, and status. Its future path is `xterm.js -> WebSocket/host bridge -> PTY -> user shell`, where users launch `codex`, `claude`, `opencode`, or other CLI Agents themselves.

禁止重新引入 Agent Runtime、Agent Provider、Agent Scheduler、Agent Memory 或 Agent SDK orchestration。

Do not reintroduce an Agent Runtime, Agent Provider, Agent Scheduler, Agent Memory, or Agent SDK orchestration.

## 状态所有权 / State Ownership

| State | Source of Truth | UI Responsibility | Forbidden Shortcut |
| --- | --- | --- | --- |
| Architecture semantics / 架构语义 | `ArchitectureProject` | 读取、发出 commands、展示 proposal/review / read, issue commands, show proposals/reviews | 以 Svelte store 代替 IR / replacing IR with a Svelte store |
| Validation / 校验 | Validator results | 按来源展示和导航 / display and navigate by provenance | UI 自行重写规则 / reimplementing rules in UI |
| Layout semantics / 布局语义 | Layout compiler output | 请求布局、消费 `LayoutResult` / request layout and consume `LayoutResult` | 在 component 中实现 heuristic / implementing heuristics in components |
| View/Layout state / 视图状态 | Workspace-owned LayoutState（D-006） | selection、viewport、collapse；drag position 按 D-003 持久化；V1 无 pin / selection, viewport, collapse; drag position persists under D-003; no V1 pinning | 写入 Architecture IR/DSL 或从 drag 推导 constraint / writing into Architecture IR/DSL or inferring constraints from drag |
| Proposal/Ghost / 建议 | Architecture Review proposal | overlay/local/comparison projection / overlay, local, or comparison projection | 接受前写入正式 IR / writing accepted IR before approval |
| Implementation evidence / 实现证据 | Analyzer/Validator output | 展示 confidence 与 provenance / display confidence and provenance | 把低置信度推断显示为事实 / presenting low-confidence inference as fact |

## 工作流 / Workflows

### Greenfield / 新建项目

```text
New Project
  -> Requirement
  -> Architecture Agent
  -> candidate ArchitectureProject
  -> Validator / Review
  -> Architecture Semantic Layout
  -> LayoutResult
  -> Canvas
```

### Brownfield / 已有仓库

```text
Open Repository
  -> Implementation Analyzer
  -> reconstructed ArchitectureProject + evidence/confidence
  -> Architecture Semantic Layout + abstraction
  -> Canvas
  -> Implementation Validator / Architecture Agent
  -> Proposal / Ghost Architecture
```

### Proposal Acceptance / 建议接受

```text
Ghost Projection
  -> Accept
  -> Architecture Review gate
  -> accepted ArchitectureProject
  -> Incremental Layout
  -> updated Canvas
```

Reject 只移除 Ghost projection，不修改正式 ArchitectureProject 或其 LayoutState。

Reject only removes the Ghost projection and does not modify the accepted ArchitectureProject or its LayoutState.

## UI 测试计划 / UI Test Plan

- Unit/adapter：Vitest 验证 commands、stores 和 `LayoutResult -> Svelte Flow` 映射；不复制 compiler 测试。 / Unit/adapter: Vitest verifies commands, stores, and `LayoutResult -> Svelte Flow` mapping without duplicating compiler tests.
- Component：Svelte component tests 验证 Canvas node、Inspector、Problems、Review 与 Handoff 的渲染和交互。 / Component: Svelte component tests verify rendering and interaction for Canvas nodes, Inspector, Problems, Review, and Handoff.
- E2E：Playwright 覆盖 Greenfield workspace、Brownfield import、Canvas interaction、Inspector、Ghost accept/reject、Review flow 和 Blueprint handoff。 / E2E: Playwright covers Greenfield workspace, Brownfield import, Canvas interaction, Inspector, Ghost accept/reject, Review flow, and Blueprint handoff.
- Accessibility：键盘导航、焦点、缩放替代、screen-reader labels 和问题导航。 / Accessibility: keyboard navigation, focus, zoom alternatives, screen-reader labels, and issue navigation.
- Performance：大图首次显示、增量更新、取消、worker failure 和恢复。 / Performance: initial display of large graphs, incremental updates, cancellation, worker failure, and recovery.

Phase 2 已按用户明确批准建立 Vitest、Svelte component testing 与 Playwright 工具链；Phase 3 以后只在各自 Checkpoint 范围内扩展测试。

Phase 2 establishes Vitest, Svelte component testing, and Playwright under explicit user approval. Later phases may extend them only within their respective Checkpoint scopes.

## 非目标 / Non-goals

- Phase 2 已完成 SvelteKit/Canvas 基础设施；本阶段结论不授权继续实现 Phase 3 Palette、Inspector 或完整 Greenfield workflow。 / Phase 2 has completed the SvelteKit/Canvas infrastructure; this conclusion does not authorize Phase 3 Palette, Inspector, or complete Greenfield workflows.
- UI 不实现 Architecture Agent、Validator、Layout compiler 或 Agent runtime 的业务规则。 / The UI does not implement business rules belonging to Architecture Agent, Validators, the Layout compiler, or an Agent runtime.
- Canvas 不是自由绘图或图形设计工具。 / The Canvas is not a free-form drawing or graphic-design tool.
- Terminal 不在早期 UI checkpoints 范围内。 / The Terminal is outside early UI checkpoints.

## 相关文档 / Related Documents

- [Architecture Layout](./architecture-layout.md)
- [Architecture Layout Decisions](./architecture-layout-decisions.md)
- [UI MVP Roadmap](./ui-mvp-roadmap.md)
