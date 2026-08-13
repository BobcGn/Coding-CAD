# Repository Guidelines

## Project Structure & Module Organization / 项目结构与模块组织

This is a pnpm + Turborepo TypeScript monorepo. `apps/web` is the future SvelteKit Architecture Workspace UI; `apps/server` exposes DSL analysis services. Core packages live under `packages/`, including `architecture-ir`, `architecture-layout`, `architecture-dsl`, `architecture-validator`, `component-registry`, `architecture-agent`, `execution-blueprint`, `agent-adapter`, `implementation-*`, `architecture-review`, `workspace`, and `cli`. Tests are colocated as `src/*.test.ts`. Examples live in `examples/`; durable design documents live in `docs/`; current execution facts and evidence live in `logs/`.

本仓库是 pnpm + Turborepo TypeScript monorepo。`apps/web` 是未来的 SvelteKit Architecture Workspace UI，`apps/server` 提供 DSL 分析服务；`packages/` 放核心能力，包括新增的 `architecture-layout`。测试以 `src/*.test.ts` 就近放置，示例在 `examples/`，长期设计文档在 `docs/`，当前实施事实与证据在 `logs/`。

## Architecture Source of Truth / 架构事实来源

`ArchitectureProject` in `@coding-cad/architecture-ir` is the sole Architecture Source of Truth. DSL, Architecture Agent, Validator, Review, Layout, UI, Blueprint, Analyzer, and Workspace are producers, consumers, validators, or projections around that model; none may create a competing architecture model.

`@coding-cad/architecture-ir` 中的 `ArchitectureProject` 是唯一 Architecture Source of Truth。DSL、Architecture Agent、Validator、Review、Layout、UI、Blueprint、Analyzer 和 Workspace 都只是围绕该模型的生产者、消费者、验证器或投影，不得创建竞争性的架构模型。

- Architecture semantics belong in `architecture-ir`; do not add UI, solver, renderer, DOM, persistence, or interaction assumptions there.
- Layout Semantic Roles are visualization classifications, not new Architecture IR domain objects, and must never be written back as architecture facts.
- Layout preferences and constraints organize a view; they are not Architecture Validator correctness rules.
- `ArchitectureProject` describes what the system is. Layout/View State describes how a user views it.
- Never add `x`, `y`, `width`, `height`, `viewport`, `collapsed`, or `pinned` to Architecture IR or Architecture DSL.

- 架构语义属于 `architecture-ir`；不得向其中加入 UI、solver、renderer、DOM、持久化或交互假设。
- Layout Semantic Role 是可视化分类，不是新的 Architecture IR 领域对象，绝不能作为架构事实写回。
- Layout preference/constraint 用于组织视图，不是 Architecture Validator correctness rule。
- `ArchitectureProject` 描述“系统是什么”；Layout/View State 描述“用户怎么看”。
- 禁止把 `x`、`y`、`width`、`height`、`viewport`、`collapsed`、`pinned` 加入 Architecture IR 或 Architecture DSL。

## Dependency Direction and Ownership / 依赖方向与职责

Dependencies point from a more specific layer to a more foundational layer:

依赖从更具体的层指向更基础的层：

```text
architecture-ir
      ^
architecture-layout
      ^
apps/web layout adapter
      ^
Svelte Flow / Architecture Canvas
```

- `architecture-ir` must not depend on `architecture-layout`, apps, UI libraries, or solvers.
- `architecture-layout` may consume approved `architecture-ir` contracts and may hide a future solver behind `LayoutEngine`; it must not depend on Svelte, SvelteKit, `@xyflow/svelte`, DOM, CSS, or `apps/web`.
- Solver-specific types, options, worker messages, and errors must remain inside `packages/architecture-layout/src/engines/<solver>/` and must not leak through package contracts.
- `apps/web` consumes public package APIs. Packages must never import from `apps/web`.
- `apps/web/src/lib/layout/adapters` is the only boundary that may convert `LayoutResult` into Svelte Flow nodes and edges. It must not contain layout algorithms or semantic heuristics.
- Do not add `packages/cad-ui`, `packages/svelte-ui`, `packages/layout-engine`, `packages/agent-runtime`, or another UI/runtime package unless the user explicitly changes the architecture.
- Do not add top-level `compiler/`, `layout/`, or `ui/` directories; use the established package/app ownership.

- `architecture-ir` 不得依赖 `architecture-layout`、app、UI library 或 solver。
- `architecture-layout` 可以消费已批准的 `architecture-ir` 契约，并可在未来通过 `LayoutEngine` 隔离 solver；不得依赖 Svelte、SvelteKit、`@xyflow/svelte`、DOM、CSS 或 `apps/web`。
- solver-specific 类型、options、worker message 和 error 必须留在 `packages/architecture-layout/src/engines/<solver>/`，不得泄漏到 package 契约。
- `apps/web` 消费 package public API；任何 package 都不得 import `apps/web`。
- `apps/web/src/lib/layout/adapters` 是唯一允许把 `LayoutResult` 转换为 Svelte Flow node/edge 的边界，不得包含布局算法或语义 heuristic。
- 除非用户明确改变架构，不得新增 `packages/cad-ui`、`packages/svelte-ui`、`packages/layout-engine`、`packages/agent-runtime` 或其他 UI/runtime package。
- 不得新增顶层 `compiler/`、`layout/`、`ui/` 目录；使用既定 package/app 职责。

## Architecture Layout Package Rules / Architecture Layout Package 规则

`packages/architecture-layout` is a pure TypeScript Architecture Semantic Layout Compiler. Its intended internal stages are Semantic Analysis, Architecture Abstraction, Visual/Layout IR, Constraint Generation, `LayoutEngine`, Stability/Incremental processing, and `LayoutResult`.

`packages/architecture-layout` 是纯 TypeScript Architecture Semantic Layout Compiler。其预期内部阶段是 Semantic Analysis、Architecture Abstraction、Visual/Layout IR、Constraint Generation、`LayoutEngine`、Stability/Incremental 处理和 `LayoutResult`。

- Keep compiler passes renderer-independent and solver-neutral.
- Visual/Layout IR must not contain Svelte components, CSS classes, Svelte Flow nodes, HTML, DOM references, viewports, or UI stores.
- Prefer semantic fixtures and invariants over brittle coordinate snapshots.
- Optimize according to “Semantic First,” “Automatic by Default,” “Stable over Optimal,” and “Local Change, Local Movement.” Frequent manual arrangement is a layout failure signal, not the default workflow.
- Abstraction and progressive disclosure must preserve provenance and reveal hidden counts; low-confidence Analyzer inference must not be presented as confirmed architecture.
- FULL, INCREMENTAL, and future LOCAL/SUBGRAPH behavior must preserve input immutability and deterministic contracts. Missing previous state must safely fall back to FULL.
- Do not implement a solver, worker boundary, persistence format, pin behavior, or irreversible public API before the corresponding Decision and Checkpoint are approved.

- compiler pass 必须保持 renderer-independent 和 solver-neutral。
- Visual/Layout IR 不得包含 Svelte component、CSS class、Svelte Flow node、HTML、DOM reference、viewport 或 UI store。
- 优先使用语义 fixture 和 invariant，避免脆弱的坐标 snapshot。
- 遵守“Semantic First”“Automatic by Default”“Stable over Optimal”“Local Change, Local Movement”；频繁手动整理是布局失败信号，不是默认工作流。
- Abstraction/progressive disclosure 必须保留 provenance 并显示隐藏数量；低置信度 Analyzer 推断不得显示成已确认架构。
- FULL、INCREMENTAL 与未来 LOCAL/SUBGRAPH 行为必须保持输入不可变和契约确定性；缺少 previous state 时必须安全退化为 FULL。
- 对应 Decision 与 Checkpoint 未批准前，不得实现 solver、worker boundary、持久化格式、pin 行为或不可逆 public API。

## Web Application Rules / Web 应用规则

`apps/web` owns the future SvelteKit/Svelte 5 product UI: Architecture Canvas, Inspector, Component Palette, Review, Problems/Validation, Workspace, Execution Handoff, and later Terminal infrastructure.

`apps/web` 拥有未来的 SvelteKit/Svelte 5 产品 UI：Architecture Canvas、Inspector、Component Palette、Review、Problems/Validation、Workspace、Execution Handoff，以及后续 Terminal infrastructure。

- The Canvas is a view and interaction surface over Architecture IR and `LayoutResult`; Svelte Flow does not own architecture, reasoning, validation, or semantic layout.
- Svelte stores and Svelte Flow state must not replace `ArchitectureProject`.
- Semantic edits must travel through explicit commands and the established Validator/Review boundaries; do not directly mutate accepted IR from a component.
- The Inspector focuses on component semantics, contracts, constraints, decisions, dependencies, implementation status, and validation issues—not width, height, color, or border design controls.
- Keep UI state (selection, viewport, panel state) separate from architecture state and from persisted LayoutState.
- UI tests belong to the app layer. Use adapter/unit tests, Svelte component tests, and Playwright E2E only after their Checkpoint and dependency decisions authorize the toolchain.

- Canvas 是 Architecture IR 与 `LayoutResult` 之上的视图和交互面；Svelte Flow 不拥有架构、推理、验证或语义布局。
- Svelte store 和 Svelte Flow state 不得替代 `ArchitectureProject`。
- 语义编辑必须经过显式 command 与既有 Validator/Review 边界；不得从 component 直接修改已接受 IR。
- Inspector 聚焦 component semantics、contracts、constraints、decisions、dependencies、implementation status 和 validation issues，而不是 width、height、color、border 图形设计控件。
- UI state（selection、viewport、panel state）、architecture state 和持久化 LayoutState 必须分离。
- UI 测试属于 app 层；只有对应 Checkpoint 和 dependency Decision 授权后，才可引入 adapter/unit、Svelte component 和 Playwright E2E 工具链。

## Proposal, Ghost, and Review Boundary / Proposal、Ghost 与 Review 边界

An unapproved Architecture Proposal is not part of the accepted `ArchitectureProject`. Ghost nodes and edges are proposal projections with separate identity and should prefer local placement without re-laying out the accepted graph.

未批准的 Architecture Proposal 不属于已接受的 `ArchitectureProject`。Ghost node/edge 是具有独立 identity 的 proposal projection，应优先局部放置且不重排正式架构全图。

```text
Proposal -> Ghost Projection -> Architecture Review
  -> accepted ArchitectureProject -> Incremental Layout
```

Rejecting a proposal removes only its Ghost projection. Accepting must pass through Architecture Review before it changes ArchitectureProject and triggers incremental layout. UI code must never bypass this gate.

拒绝 proposal 只移除 Ghost projection。接受 proposal 必须先通过 Architecture Review，之后才能改变 ArchitectureProject 并触发 incremental layout。UI 代码绝不能绕过该门禁。

## Decision and Checkpoint Gates / Decision 与 Checkpoint 门禁

Before non-trivial Layout or UI work, read `docs/ui-v1-execution-plan.md`, `docs/architecture-layout-decisions.md`, and `docs/ui-mvp-roadmap.md`. A recommendation is not a decision. Only an explicit user decision may replace `Final Decision: TBD` or authorize work blocked by that Decision.

进行非平凡 Layout 或 UI 工作前，必须读取 `docs/ui-v1-execution-plan.md`、`docs/architecture-layout-decisions.md` 与 `docs/ui-mvp-roadmap.md`。推荐不等于决定；只有用户明确决策才能替换 `Final Decision: TBD` 或授权被该 Decision 阻塞的工作。

- Work in Master Phase 0→7 order from `docs/ui-v1-execution-plan.md`; use Checkpoints as capability acceptance gates within that sequence unless the user explicitly changes the plan with impact and rollback understood.
- Restore each Checkpoint's Goal, Input, Output, Acceptance Criteria, Known Risks, and Non-goals before coding.
- Do not mark a Checkpoint complete without external evidence for every Acceptance Criterion.
- If a required Decision remains `USER DECISION REQUIRED`, stop before the blocked implementation boundary and ask the user.
- Current documented gate: Phase 1 and Checkpoints 1–2 are verified; D-003, D-008, and D-009 are approved; Phase 2/Checkpoint 3 is ready but not started. Re-read the documents because this status may change.
- Update design docs, Decision records, roadmap status, and structured logs whenever an approved implementation changes a documented contract or risk.

- 除非用户在理解影响与回退后明确改变计划，否则按 `docs/ui-v1-execution-plan.md` 的 Master Phase 0→7 顺序工作，并把 Checkpoint 作为该顺序内的能力验收门禁。
- 编码前恢复该 Checkpoint 的 Goal、Input、Output、Acceptance Criteria、Known Risks 和 Non-goals。
- 未用外部证据满足全部 Acceptance Criteria，不得把 Checkpoint 标为完成。
- 所需 Decision 仍为 `USER DECISION REQUIRED` 时，必须停在被阻塞的实现边界并询问用户。
- 当前文档门禁：Phase 1 与 Checkpoint 1–2 已验证；D-003、D-008、D-009 已批准；Phase 2/Checkpoint 3 已就绪但尚未开始。状态可能变化，必须重新读取文档。
- 已批准实现改变文档契约或风险时，必须同步更新设计文档、Decision、Roadmap 状态和结构化日志。

## Terminal and External Agent Boundary / Terminal 与外部 Agent 边界

Terminal is a later `apps/web` product-host capability limited to cwd, process lifecycle, stdin, stdout, stderr, tabs, status, and PTY/host bridging. Users launch `codex`, `claude`, `opencode`, or other shell tools themselves.

Terminal 是后续 `apps/web` 产品宿主能力，只负责 cwd、process lifecycle、stdin、stdout、stderr、tabs、status 和 PTY/host bridge。用户自行启动 `codex`、`claude`、`opencode` 或其他 shell 工具。

Do not reintroduce Agent Runtime, Agent Provider, Agent Scheduler, Agent Memory, Agent SDK orchestration, or a second execution pipeline. `agent-adapter` remains a pure Execution Blueprint-to-Prompt/Guide renderer.

不得重新引入 Agent Runtime、Agent Provider、Agent Scheduler、Agent Memory、Agent SDK orchestration 或第二条执行流水线。`agent-adapter` 仍是 Execution Blueprint 到 Prompt/Guide 的纯渲染器。

## Build, Test, and Development Commands / 构建、测试与开发命令

- `pnpm install`: install workspace dependencies.
- `pnpm build`: build all packages through Turbo.
- `pnpm lint`: run workspace checks and TypeScript typecheck.
- `pnpm test`: run all package tests.
- `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`: run scoped test suites.
- `pnpm ci:verify`: run the full CI gate.

优先使用 `pnpm ci:verify` 作为提交前总门禁。

## Coding Style & Naming Conventions / 代码风格与命名

Use TypeScript ESM with strict settings from `tsconfig.base.json`. Prefer explicit exported types, small public APIs, and dependencies that point inward toward `architecture-ir`. Use kebab-case package names and descriptive file names such as `architecture-project.ts`. Keep Markdown bilingual.

使用严格 TypeScript ESM。依赖方向应指向更基础的包，尤其不要让 `architecture-ir` 反向依赖上层能力。

## Testing Guidelines / 测试规范

Use Node-based package tests via Turbo. Name tests `*.test.ts` and colocate them with implementation files. Add unit tests for pure rules, integration tests for workflows, and e2e tests for CLI behavior. Do not mark behavior complete until the relevant command has passed.

测试文件使用 `*.test.ts`。完成声明必须有命令或人工检查证据支撑。

Architecture Layout tests must run in Node.js without Svelte, a DOM, or a browser. Cover semantic classification, abstraction, constraint generation, determinism, input immutability, unique IDs, valid edge endpoints, finite results, and incremental movement of unrelated nodes. Solver adapter tests must prove solver-specific types do not leak.

Architecture Layout 测试必须在无 Svelte、无 DOM、无浏览器的 Node.js 环境运行，覆盖 semantic classification、abstraction、constraint generation、determinism、输入不可变、唯一 ID、合法 edge endpoint、有限结果，以及 incremental change 对无关节点的移动。Solver adapter 测试必须证明 solver-specific 类型没有泄漏。

UI testing is layered: adapter/unit tests, Svelte component tests, then Playwright E2E for Greenfield, Brownfield, Canvas, Inspector, Ghost accept/reject, Review, and Blueprint handoff. Do not install or claim these tests before the approved UI Checkpoint establishes the toolchain.

UI 测试分层为 adapter/unit、Svelte component、Playwright E2E，覆盖 Greenfield、Brownfield、Canvas、Inspector、Ghost accept/reject、Review 和 Blueprint handoff。获批 UI Checkpoint 建立工具链之前，不得安装或声称这些测试已存在。

## Documentation and Logs / 文档与日志

All Markdown remains bilingual. Durable architecture and product rules live in `docs/`; module boundaries live in package/app READMEs; current facts, evidence, TODOs, and rollback points live in `logs/`. Do not duplicate a new ADR or Roadmap system when the established files already cover the decision.

所有 Markdown 保持中英双语。长期架构和产品规则在 `docs/`，模块边界在 package/app README，当前事实、证据、TODO 与回退点在 `logs/`。已有文件能够承载决策时，不得重复创建新的 ADR 或 Roadmap 体系。

For UI/Layout work, keep these documents aligned:

UI/Layout 工作必须同步以下文档：

- `docs/architecture.md`
- `docs/ui-v1-execution-plan.md`
- `docs/architecture-layout.md`
- `docs/ui-architecture.md`
- `docs/architecture-layout-decisions.md`
- `docs/ui-mvp-roadmap.md`
- `packages/architecture-layout/README.md`
- `apps/web/README.md`
- root and module `logs/`

## Commit & Pull Request Guidelines / 提交与 PR 规范

Git history uses Conventional Commits, for example `feat(core): ...`, `fix(ci): ...`, and `docs(logs): ...`. PRs should include summary, validation evidence, linked issues when applicable, and screenshots for UI work. Follow `.github/pull_request_template.md`; run `pnpm ci:verify` before review.

提交遵循 Conventional Commits。PR 必须说明摘要、验证结果、相关 Issue，以及 UI 变更截图。

## Coding Agent First Law / Coding Agent 第一铁律

Human judgment sets direction; engineering rails protect delivery. Before acting, restore facts from repository files, Git state, rules, and `logs/` when present. Establish Intent, Boundary, and Done Criteria. Choose workflow depth by risk: architecture, release, security, data, migration, or cross-module work needs checkpoints and rollback. Execute in narrow slices, prefer existing patterns, and avoid opportunistic refactors. Verify with external evidence: tests, builds, schema checks, dry runs, command output, runtime inspection, review, or user confirmation. Final handoff must state changes, verification, gaps, risk, and rollback guidance.

人的判断设方向，工程轨道保交付。行动前先恢复事实；明确意图、边界、完成标准；按风险选择流程；窄切片执行；用外部证据验证；交付时说明变更、验证、未验证、风险和回退方式。`logs/` 存在时，非平凡任务必须先读日志、后更新日志。
