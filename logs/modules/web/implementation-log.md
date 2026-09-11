# 实施日志 / Implementation Log

## 2026-08-08 - 模块日志初始化 / Module Log Initialization

为 `apps/web` 建立同构模块日志。

Initialized equivalent module logs for `apps/web`.

## 2026-08-11 - UI 目录骨架 / UI Directory Skeleton

状态：已验证。

Status: Verified.

为未来 SvelteKit 产品 UI 建立 Architecture、CAD、Layout adapter 与 Terminal TODO 目录边界。未初始化 SvelteKit，未实现 Svelte UI、布局算法或 Terminal。

Established Architecture, CAD, Layout adapter, and Terminal TODO directory boundaries for the future SvelteKit product UI. Did not initialize SvelteKit or implement Svelte UI, layout algorithms, or a terminal.

`pnpm build` 与 `pnpm test` 通过。

`pnpm build` and `pnpm test` passed.

## 2026-08-11 - Documentation First

状态：已验证。

Status: Verified.

文档化 Architecture Canvas、Inspector、Palette、Review、Problems、Execution Handoff 和 Terminal TODO 的职责、状态所有权、Greenfield/Brownfield/Ghost 工作流与 UI 测试计划。未初始化 SvelteKit 或安装 UI 依赖。

Documented responsibilities, state ownership, Greenfield/Brownfield/Ghost workflows, and the UI test plan for Architecture Canvas, Inspector, Palette, Review, Problems, Execution Handoff, and Terminal TODO. Did not initialize SvelteKit or install UI dependencies.

Roadmap 结构、workspace build 和 test 检查通过。

Roadmap structure, workspace build, and test checks passed.

## 2026-08-11 - UI V1 Master Phases 2–7 Planning / UI V1 Master Phase 2–7 规划

状态：已验证，尚未就绪。

Status: Verified, not ready.

按严格依赖顺序规划 Svelte CAD、Greenfield、Brownfield、Ghost/Review/Handoff、Quality/E2E 和 Terminal。`apps/web` 保持 placeholder；Phase 2 需等待 Phase 1 exit 与 D-009 等 Decision。

Planned Svelte CAD, Greenfield, Brownfield, Ghost/Review/Handoff, Quality/E2E, and Terminal in strict dependency order. `apps/web` remains a placeholder; Phase 2 awaits Phase 1 exit and Decisions including D-009.

## 2026-08-13 - UI Eight-Stage Source Mapping / UI 八阶段来源映射

确认原始对话的 Canvas、业务工作流与产品闭环阶段已由 Master Phase 2–7 覆盖；只补充来源映射，不重建 Roadmap，不初始化 SvelteKit，不安装依赖。

Confirmed that Master Phases 2–7 already cover the source conversation's Canvas, product workflows, and product-closure stages. Added source mapping only; did not rebuild the Roadmap, initialize SvelteKit, or install dependencies.

## 2026-08-13 - Phase 2 Prerequisite Decisions / Phase 2 前置决策

状态：已就绪，未开始。

Status: Ready, not started.

按用户指定的 21:03 建议批准 D-003、D-008、D-009，并把 anti-corruption adapter、Workspace-owned drag position 与 Standard + Semantic Zoom 设为 Checkpoint 3 guardrail。只更新文档和门禁状态；未初始化 SvelteKit、安装 `@xyflow/svelte` 或实现 UI。

Approved D-003, D-008, and D-009 from the user-designated 21:03 guidance and established the anti-corruption adapter, Workspace-owned drag positions, and Standard + Semantic Zoom as Checkpoint 3 guardrails. Updated documentation and gate state only; did not initialize SvelteKit, install `@xyflow/svelte`, or implement UI.

Decision/Phase 结构检查、Svelte 类型泄漏检查、`git diff --check` 与完整 `pnpm ci:verify` 均通过。Checkpoint 3 仍须通过实际 adapter、interaction、state separation、test 和 accessibility 证据后才能标记 Verified。

Decision/Phase structure checks, the Svelte-type leakage check, `git diff --check`, and the complete `pnpm ci:verify` all pass. Checkpoint 3 still requires real adapter, interaction, state-separation, test, and accessibility evidence before it can be marked Verified.

## 2026-08-13 - Phase 2 Narrow-Slice Planning / Phase 2 窄切片规划

状态：规划中，代码实现未开始。

Status: Planning in progress; code implementation has not started.

把 Phase 2 拆分为 toolchain baseline、Svelte app foundation、adapter contract、Canvas shell、UI/async state、headless command application 和 phase acceptance 七个顺序切片。明确 Checkpoint 3 只验收基础 Canvas capability，而 Master Phase 2 另需完成 renderer-neutral command integration。

Split Phase 2 into seven ordered slices: toolchain baseline, Svelte app foundation, adapter contract, Canvas shell, UI/async state, headless command application, and phase acceptance. Clarified that Checkpoint 3 accepts only the foundational Canvas capability, while Master Phase 2 additionally requires renderer-neutral command integration.

Phase 2 不创建 Palette/Inspector 产品编辑入口；Add/Remove/Connect 通过 headless integration 验证。真实控件驱动的 add/remove/connect E2E 留给 Phase 3，并复用同一 command application。未安装依赖、未修改行为代码。

Phase 2 creates no Palette/Inspector product editing entry points; Add/Remove/Connect is verified through headless integration. Real-control add/remove/connect E2E remains in Phase 3 and reuses the same command application. No dependency was installed and no behavior code changed.

## 2026-08-13 - Phase 2 Implementation and Acceptance / Phase 2 实现与验收

状态：已验证。

Status: Verified.

完成 SvelteKit/Svelte 5 app foundation、唯一 `LayoutResult -> Svelte Flow` adapter、基础 Architecture Canvas、Standard + Semantic Zoom、pan/zoom/select、LayoutState-only drag、Auto Layout reset、solver-only worker、loading/error/cancellation 与 headless Architecture Command Application。

Completed the SvelteKit/Svelte 5 app foundation, sole `LayoutResult -> Svelte Flow` adapter, foundational Architecture Canvas, Standard + Semantic Zoom, pan/zoom/select, LayoutState-only drag, Auto Layout reset, solver-only worker, loading/error/cancellation, and the headless Architecture Command Application.

命令 contract 保持 renderer-neutral，Add/Remove/Connect 经 candidate、Validator、Architecture Review gate、accepted ArchitectureProject、layout 与 Canvas projection；无 Svelte Flow 类型进入 command、core package 或持久化契约。

Command contracts remain renderer-neutral. Add/Remove/Connect traverses candidate generation, Validator, Architecture Review gate, accepted ArchitectureProject, layout, and Canvas projection. No Svelte Flow type enters commands, core packages, or persistence contracts.

定向验收通过：typecheck 0/0；unit 6 files/9 tests；integration 1 file/2 tests；Playwright Chrome E2E 1 passed；build 主页面约 65.71 KiB gzip，ELK 位于独立 worker chunk。完整 workspace CI 结果记录在根实施日志。

Targeted acceptance passes: typecheck 0/0; unit 6 files/9 tests; integration 1 file/2 tests; one Playwright Chrome E2E; main-page build about 65.71 KiB gzip with ELK in a separate worker chunk. Complete workspace CI evidence is recorded in the root implementation log.

## 2026-08-13 - Phase 3 Greenfield Planning / Phase 3 Greenfield 规划

状态：规划完成，代码未开始。

Status: Planning complete; code has not started.

规划 P3.0–P3.7 的 Greenfield 垂直切片，并明确浏览器不得直接导入 Node Workspace/filesystem、Palette/Inspector 必须复用 Phase 2 command application、Phase 3 Review 仅为最小 accept/reject gate。P3-D1–P3-D3 等待用户确认。本轮未安装依赖或实现 UI。

Planned the P3.0–P3.7 Greenfield vertical slices and established that the browser must not directly import the Node Workspace/filesystem, Palette and Inspector must reuse the Phase 2 command application, and Phase 3 Review is only a minimal accept/reject gate. P3-D1 through P3-D3 await user confirmation. This slice installs no dependency and implements no UI.


## 2026-08-15 - Phase 3 Detailed Slice Planning / Phase 3 详细切片规划

状态：详细规划完成，代码未开始。

Status: Detailed planning complete; code has not started.

同步了 `logs/modules/web` 的 Scope/State/Todo/Links 到 Phase 2 已验证、Phase 3 详细规划完成的状态；WEB-001 重新定义为 Greenfield Architecture Workspace 并等待 P3-D1–P3-D3 决策。Master Plan 已为 P3.0–P3.7 提供完整切片规格，供实现开始时逐片恢复。

Synchronized `logs/modules/web` Scope/State/Todo/Links to the state of Phase 2 verified and detailed Phase 3 planning complete; WEB-001 is redefined as the Greenfield Architecture Workspace and awaits the P3-D1–P3-D3 decisions. The Master Plan now provides complete slice specifications for P3.0–P3.7 to restore slice by slice when implementation starts.

本轮未安装依赖、未实现 UI。
This slice installs no dependency and implements no UI.

## 2026-08-15 - P3.1 Workspace Host Bridge / P3.1 Workspace 宿主桥接

状态：已验证。

Status: Verified.

实现 P3.1 最小切片：apps/web/src/lib/architecture/workspace/ 提供 browser-safe typed contract（Create/Open/Save DTO）与 workspace-bridge typed client；apps/web/src/routes/api/workspace/ 的 SvelteKit server routes（POST 创建、GET 打开、PUT 保存）承载 Node-only @coding-cad/workspace 操作。apps/web 新增 @coding-cad/workspace workspace:* 依赖并更新 lockfile。

Implemented the P3.1 minimal slice: apps/web/src/lib/architecture/workspace/ provides browser-safe typed contracts (Create/Open/Save DTOs) and the workspace-bridge typed client; SvelteKit server routes under apps/web/src/routes/api/workspace/ (POST create, GET open, PUT save) host the Node-only @coding-cad/workspace operations. apps/web gained the @coding-cad/workspace workspace:* dependency and the lockfile was updated.

验证：web typecheck 0/0；unit 7 files/11 tests（新增 contract 2 tests）；integration 2 files/5 tests（新增 bridge round-trip 3 tests）；web build 成功且 @coding-cad/workspace 仅出现在 server chunks（browser client 无 node:* 模块、无 FileWorkspaceStorage/磁盘 schema、无 Workspace 类逻辑）。全仓 typecheck 25/25、unit 28/28、build 15/15。

Validation: web typecheck 0/0; unit 7 files/11 tests (2 new contract tests); integration 2 files/5 tests (3 new bridge round-trip tests); web build succeeds with @coding-cad/workspace confined to server chunks (browser client has no node:* modules, no FileWorkspaceStorage/disk schemas, and no Workspace class logic). Full workspace typecheck 25/25, unit 28/28, and build 15/15 pass.

## 2026-08-15 - P3.2 Requirement to Candidate / P3.2 Requirement 到 Candidate

状态：已验证。

Status: Verified.

实现 P3.2：apps/web/src/lib/architecture/greenfield/candidate-flow.ts 提供 requirement -> deterministic Architecture Agent -> candidate ArchitectureProject -> Validator Problems -> 最小 Review gate proposal 的 renderer-neutral 流程（P3-D2 生成零 LLM）。apps/web 新增 @coding-cad/architecture-agent workspace:* 依赖。

Implemented P3.2: apps/web/src/lib/architecture/greenfield/candidate-flow.ts provides the renderer-neutral requirement -> deterministic Architecture Agent -> candidate ArchitectureProject -> Validator Problems -> minimal Review gate proposal flow (P3-D2 zero-LLM generation). apps/web gained the @coding-cad/architecture-agent workspace:* dependency.

验证：web typecheck 0/0；unit 8 files/16 tests（新增 candidate-flow 5 tests）；integration 3 files/7 tests（新增 candidate->review gate 2 tests）；determinism、accepted IR 不变、Problems 可追溯与 accept/reject 不变量均有断言。

Validation: web typecheck 0/0; unit 8 files/16 tests (5 new candidate-flow tests); integration 3 files/7 tests (2 new candidate -> review gate tests); determinism, accepted-IR immutability, Problems provenance, and accept/reject invariants are all asserted.

## 2026-08-15 - P3.3 Workspace Shell and Projection / P3.3 Workspace 外壳与投影

状态：已验证。

Status: Verified.

实现 P3.3：apps/web/src/lib/architecture/greenfield/workspace-shell.ts 与 workspace-shell-controller.ts 提供 Greenfield workspace shell 状态层（accepted/candidate/evidence/view 四类生命周期分离），+page.svelte 集成 New Project、Requirement 输入、Canvas 投影、Problems 面板、selection 导航与 loading/error/cancellation 状态。

Implemented P3.3: workspace-shell.ts and workspace-shell-controller.ts in apps/web/src/lib/architecture/greenfield provide the Greenfield workspace shell state layer (accepted/candidate/evidence/view lifecycle separation), and +page.svelte integrates New Project, Requirement input, Canvas projection, Problems panel, selection navigation, and loading/error/cancellation states.

同时修复 browser-safe 边界（P3-D1）：@coding-cad/workspace 新增 ./pure 子路径导出（diff/version 无 node:*），architecture-review 的 workspace 导入改为 /pure，并移除 review 默认 idGenerator 的 node:crypto 依赖（改 browser-safe 实现），使 client bundle 不再解析 Node-only 存储代码。Canvas 的 selection 改用节点 DOM data-id 的原生点击处理，解决 Svelte Flow onselectionchange 在该环境下不触发的问题。

Also fixed the browser-safe boundary (P3-D1): @coding-cad/workspace gained a ./pure subpath export (diff/version without node:*), architecture-review imports workspace via /pure and removed the node:crypto dependency from its default idGenerator (browser-safe implementation), so the client bundle no longer resolves Node-only storage code. Canvas selection now uses native click handling via node DOM data-id, fixing the non-firing Svelte Flow onselectionchange in this environment.

验证：web typecheck 0/0；unit 9 files/21 tests；integration 3 files/7 tests；Playwright E2E 3 passed（Greenfield 生成/Canvas 交互、Problems 导航、Reject 保持 accepted IR）；web build 成功且 client bundle 无 node:*。

Validation: web typecheck 0/0; unit 9 files/21 tests; integration 3 files/7 tests; three Playwright E2E pass (Greenfield generate/Canvas interaction, Problems navigation, Reject preserves accepted IR); web build succeeds with no node:* in the client bundle.

## 2026-08-15 - P3.4 Palette Command Entry / P3.4 Palette 命令入口

状态：已验证。

Status: Verified.

实现 P3.4：apps/web/src/lib/architecture/greenfield/palette.ts 从 Component Registry 投影 browser-safe Palette items 并产生 Add/Remove/Connect 显式命令；WorkspaceShellController.executeCommand 复用 Phase 2 CommandApplication（candidate -> Validator -> Review gate -> accepted -> layout）执行命令；+page.svelte 增加 Palette 面板，三栏布局（Palette + Canvas + Problems）。apps/web 新增 @coding-cad/component-registry 依赖。

Implemented P3.4: palette.ts projects browser-safe Palette items from the Component Registry and produces explicit Add/Remove/Connect commands; WorkspaceShellController.executeCommand reuses the Phase 2 CommandApplication (candidate -> Validator -> Review gate -> accepted -> layout); +page.svelte gains a Palette panel in a three-column layout (Palette + Canvas + Problems). apps/web gained the @coding-cad/component-registry dependency.

同时修复 Canvas 高度塌陷（.svelte-flow 高度 0 导致指针事件被拦截）——根因是组件样式选择器仍为旧 section，已改为对根 div 生效；Canvas role 调整为 application 并补充键盘支持。

Also fixed the Canvas height collapse (the .svelte-flow height was 0, intercepting pointer events) — the root cause was the component style selector still targeting the old section; it now targets the root div. The Canvas role is now application with keyboard support.

验证：web typecheck 0/0；unit 9 files/23 tests（新增 2 个命令执行测试）；integration 3 files/7 tests；Playwright E2E 4 passed（Greenfield 全流程、Palette 添加 Kafka、Problems 导航、Reject）；build 通过。

Validation: web typecheck 0/0; unit 9 files/23 tests (2 new command-execution tests); integration 3 files/7 tests; four Playwright E2E pass (Greenfield full flow, Palette adds Kafka, Problems navigation, Reject); build passes.

## 2026-08-15 - P3.5 Semantic Inspector / P3.5 语义 Inspector

状态：已验证。

Status: Verified.

实现 P3.5：apps/web/src/lib/architecture/greenfield/inspector.ts 投影选中组件的 semantics（name/description/type/capabilities/limitations/contracts）与 validation issues；ArchitectureCommand 新增 field-specific Inspector 命令（inspector-update-description/type、add/remove-capability、add-limitation，P3-D3 无 generic patch），apply-command.ts 实现字段级应用；+page.svelte 增加 Inspector 面板（选中节点显示，编辑 description/capabilities 经 command application）。

Implemented P3.5: inspector.ts projects the selected component's semantics (name/description/type/capabilities/limitations/contracts) and validation issues; ArchitectureCommand gained field-specific Inspector commands (inspector-update-description/type, add/remove-capability, add-limitation; P3-D3 no generic patch) applied field-wise in apply-command.ts; +page.svelte adds an Inspector panel (shown on node selection, editing description/capabilities through the command application).

同时修复 Accept 后交互冻结（handleAccept 改用 await 模式）与消息显示（noticeMessage 独立 $state），并把 E2E 的 Inspector/Svelte Flow 控件交互改为原生事件分发以适配 Playwright 与 Svelte 5 事件委托的兼容限制。

Also fixed the post-Accept interaction freeze (handleAccept now uses await) and message display (noticeMessage as a separate $state), and switched Inspector/Svelte Flow control interactions in E2E to native event dispatch to accommodate the Playwright/Svelte 5 event-delegation compatibility limitation.

验证：web typecheck 0/0；unit 10 files/30 tests（新增 7 个 Inspector 命令测试）；integration 3 files/7 tests；Playwright E2E 5 passed（Greenfield、Inspector 编辑、Palette、Problems 导航、Reject）；build 通过。

Validation: web typecheck 0/0; unit 10 files/30 tests (7 new inspector command tests); integration 3 files/7 tests; five Playwright E2E pass (Greenfield, Inspector edit, Palette, Problems navigation, Reject); build passes.

## 2026-08-15 - P3.6 Save/Open Lifecycle / P3.6 Save/Open 生命周期

状态：已验证。

Status: Verified.

实现 P3.6：@coding-cad/workspace 新增可选 viewState 字段与 saveViewState/loadViewState（与 ArchitectureProject snapshot 分离保存，P3.0 矩阵）；workspace contract 的 Save/Open DTO 携带 viewStateJson；server route PUT 保存 viewState、GET 返回 viewState；WorkspaceShellController 新增 saveProject（首次保存自动 create fallback）与 openProject；+page.svelte 增加 Save/Open 按钮。Playwright webServer 改为 vite dev 以支持 server routes。

Implemented P3.6: @coding-cad/workspace gained an optional viewState field with saveViewState/loadViewState (saved separately from ArchitectureProject snapshots per the P3.0 matrix); the workspace contract Save/Open DTOs carry viewStateJson; the server route PUT persists view state and GET returns it; WorkspaceShellController gained saveProject (with a create fallback on first save) and openProject; +page.svelte gained Save/Open buttons. The Playwright webServer now uses vite dev to serve server routes.

验证：web typecheck 0/0；unit 30/30；integration 3 files/9 tests（新增 2 个 viewState 往返）；Playwright E2E 6 passed（新增 Save/Open 恢复架构事实与视图）；build 通过；全仓 typecheck 25/25。

Validation: web typecheck 0/0; unit 30/30; integration 3 files/9 tests (2 new view-state round-trips); six Playwright E2E pass (new Save/Open restores architecture facts and view); build succeeds; full workspace typecheck 25/25.

## 2026-08-15 - P3.7 Phase Acceptance / P3.7 阶段验收

状态：已验证。

Status: Verified.

P3.7 验收：补齐 points-system Create/Display/Edit/Validate/Accept/Save/Open happy path 与 invalid-candidate/rejection/error paths 的 Playwright E2E（新增空 requirement 阻止生成、重复组件拒绝、完整 happy path 三个测试）；运行完整 pnpm ci:verify 全部通过。

P3.7 acceptance: completed the points-system Create/Display/Edit/Validate/Accept/Save/Open happy path plus invalid-candidate, rejection, and error-path Playwright E2E (three new tests: empty requirement blocks generation, duplicate component rejected, full happy path); the complete pnpm ci:verify passes.

验证：Playwright E2E 9 passed；pnpm ci:verify 全门禁通过（workspace architecture 15 modules、typecheck 25/25、unit 28/28、integration 18/18、E2E 17/17、build 15/15、change-record/commit/security checks）。

Validation: nine Playwright E2E pass; pnpm ci:verify passes all gates (workspace architecture 15 modules, typecheck 25/25, unit 28/28, integration 18/18, E2E 17/17, build 15/15, plus change-record, commit-message, and security checks).

## 2026-08-16 - Workspace Sidebar and Personal Settings / 工作区侧边栏与个人设置

状态：已验证。

Status: Verified.

提 PR 前 UI 收尾：新增左侧工作区侧边栏，聚合新建项目、保存、打开与自动布局等项目管理功能；个人设置整合到侧边栏左下角的齿轮图标，点击弹出设置弹窗，包含语言（中文/English）与主题（亮色/暗色/跟随系统）。设置作为 ephemeral UI state 持久化到浏览器 localStorage，不进入 Architecture IR、LayoutState 或 Workspace 磁盘格式（P3.0 矩阵）；主题通过 data-theme 属性与 CSS 变量实现，跟随系统模式监听 prefers-color-scheme。

Pre-PR UI closeout: added a left workspace sidebar aggregating project management (New Project, Save, Open, Auto Layout); personal settings are collapsed behind a gear icon in the sidebar bottom-left that opens a dialog with language (中文/English) and theme (light/dark/system). Settings persist as ephemeral UI state in browser localStorage and never enter Architecture IR, LayoutState, or the Workspace disk format (P3.0 matrix); the theme uses a data-theme attribute with CSS variables, and system mode listens to prefers-color-scheme.

验证：web typecheck 0/0；unit 11 files/38 tests（新增 7 个 ui-settings 测试）；integration 3 files/9 tests；Playwright E2E 10 passed（新增侧边栏+齿轮弹窗设置测试）；完整 pnpm ci:verify 通过（unit 28/28、integration 18/18、E2E 17/17、build 15/15）。

Validation: web typecheck 0/0; unit 11 files/38 tests (7 new ui-settings tests); integration 3 files/9 tests; ten Playwright E2E pass (new sidebar + gear settings dialog test); the complete pnpm ci:verify passes (unit 28/28, integration 18/18, E2E 17/17, build 15/15).
