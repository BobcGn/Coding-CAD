# Coding CAD UI V1 Master Execution Plan / Coding CAD UI V1 主执行计划

## Document Status / 文档状态

状态：Phase 0–2 已验证并合并；Phase 3 规划中，代码尚未开始。P3-D1–P3-D3 必须在对应实现边界前由用户确认。

Status: Phases 0–2 are verified and merged. Phase 3 planning is in progress and implementation has not started. P3-D1 through P3-D3 require user confirmation before their implementation boundaries.

本文是 UI V1 从规划到 Terminal 的主执行顺序。`docs/ui-mvp-roadmap.md` 保留细粒度 capability checkpoints；本文定义跨模块 Phase 依赖、退出门槛和报告格式。发生冲突时，先遵守用户已批准的 Decision，再遵守本计划；未批准的架构冲突必须停止并询问用户。

This is the master execution order for UI V1 from planning through Terminal. `docs/ui-mvp-roadmap.md` retains fine-grained capability checkpoints; this document defines cross-module phase dependencies, exit gates, and reporting. If documents conflict, follow user-approved Decisions first and then this plan; stop and ask the user about any unapproved architecture conflict.

## Source Conversation Baseline / 原始对话基线

本计划已于 2026-08-13 对照用户在 Codex 内置浏览器中打开的 Coding CAD 规划对话复核。对话给出的核心落地原则不是“先写 Svelte 组件”，而是按以下依赖链逐步建立产品能力：

This plan was rechecked on 2026-08-13 against the Coding CAD planning conversation opened by the user in the Codex in-app browser. Its central delivery rule is not to start with Svelte components, but to build product capability through this dependency chain:

```text
底层视觉编译能力 / Semantic visual compilation
  -> Architecture Canvas
  -> 业务工作流 / Product workflows
  -> 产品闭环 / Product closure
```

原始对话中的八个落地阶段与本文 Master Phase 一一对应；本文是在该基线之上补充仓库事实、Decision gate、测试、风险与退出条件，不另建第二套阶段体系。

The eight delivery stages in the source conversation map one-to-one to the Master Phases below. This document enriches that baseline with repository facts, Decision gates, tests, risks, and exit conditions instead of creating a second phase system.

| 顺序 / Order | 原始八阶段基线 / Source eight-stage baseline | 本文 / This plan | 核心能力结果 / Core capability outcome |
| --- | --- | --- | --- |
| 1 | Semantic Layout Compiler v0.1 | Phase 1 — Semantic Layout Compiler | `ArchitectureProject -> VisualGraph -> LayoutGraph -> LayoutResult` |
| 2 | Svelte CAD Infrastructure | Phase 2 — Svelte CAD Infrastructure | `LayoutResult -> Web adapter -> Architecture Canvas` |
| 3 | Greenfield Architecture Workspace | Phase 3 — Greenfield Architecture Workspace | requirement-to-accepted-architecture vertical workflow / 从需求到正式架构的垂直流程 |
| 4 | Brownfield Architecture Workspace | Phase 4 — Brownfield Architecture Workspace | repository reverse engineering with progressive disclosure / 带渐进披露的仓库反演 |
| 5 | Ghost Architecture + Review + Execution Handoff | Phase 5 — Ghost Architecture + Review + Execution Handoff | proposal-to-review-to-guide product closure / 从 proposal、review 到 guide 的产品闭环 |
| 6 | Layout Quality / Performance / E2E | Phase 6 — Layout Quality / Performance / E2E | semantic quality, stability, performance, and cross-flow evidence / 语义质量、稳定性、性能与跨流程证据 |
| 7 | Integrated Terminal | Phase 7 — Integrated Terminal | user-managed shell host after architecture approval / 架构批准后的用户自主管理 shell 宿主 |
| 0 | Planning / Decision Freeze（后续 Master Task 增加的前置治理阶段 / governance prerequisite added by the later Master Task） | Phase 0 — Planning / Decision Freeze | freeze or defer decisions before implementation / 实现前冻结或延后决策 |

顺序表保留 Master Phase 0→7 的正式执行编号；上表把原始对话的产品落地顺序与后续加入的 Phase 0 治理前置合并展示。任何摘要不得把 Phase 0 误计为产品能力实现，也不得据此跳过 Phase 0。

The formal execution numbering remains Master Phase 0→7. The table combines the source conversation's product-delivery order with the later Phase 0 governance prerequisite. No summary may count Phase 0 as implemented product capability or use this mapping to bypass Phase 0.

## Restored Repository Facts / 已恢复的仓库事实

- `ArchitectureProject` remains the sole Architecture Source of Truth. / `ArchitectureProject` 仍是唯一 Architecture Source of Truth。
- `packages/architecture-layout` has a verified coordinate-free Checkpoint 1 projection. Checkpoint 2 now adds ELK.js behind the solver-neutral engine and internal worker boundary. / `packages/architecture-layout` 已有通过验证的 Checkpoint 1 无坐标投影；Checkpoint 2 正在 solver-neutral engine 与内部 worker 边界之后接入 ELK.js。
- `apps/web` is now a SvelteKit/Svelte 5 app with `@xyflow/svelte` isolated behind the approved app adapter; Palette, Inspector, and complete Greenfield workflows remain unimplemented. / `apps/web` 现为 SvelteKit/Svelte 5 app，`@xyflow/svelte` 被隔离在已批准的 app adapter 后；Palette、Inspector 与完整 Greenfield workflow 仍未实现。
- Existing Architecture Agent, Validator, Review, Workspace, Blueprint, Adapter, Analyzer, and Implementation Validator packages already define the non-UI workflow boundaries. / 既有 Architecture Agent、Validator、Review、Workspace、Blueprint、Adapter、Analyzer 和 Implementation Validator package 已定义非 UI 工作流边界。
- Canonical D-001, D-002, D-005, and D-010 were approved by the user on 2026-08-13; the remaining Decisions retain their later-phase gates. / 用户已于 2026-08-13 批准 canonical D-001、D-002、D-005、D-010；其余 Decision 保持后续 Phase 门禁。
- Checkpoints 1–3 and Phases 1–2 passed their exit gates and are merged; Phase 3 planning is active. / Checkpoint 1–3 与 Phase 1–2 已通过退出门禁并合并；Phase 3 正在规划。

## Governance Difference: Decision Number Crosswalk / 治理差异：Decision 编号映射

本任务附件用 D-001…D-010 重新列举了相同主题，但顺序与仓库 canonical Decision 不同。为避免历史链接失效，不重编号现有 Decision；后续只使用 canonical ID。

The task attachment relists the same topics as D-001…D-010 in a different order from the repository's canonical Decisions. Existing Decisions are not renumbered because that would break historical links; all future work uses canonical IDs.

| Master Task Topic Label / 附件主题编号 | Topic / 主题 | Canonical Decision / 仓库正式编号 |
| --- | --- | --- |
| D-001 | V1 Layout Solver | D-002 |
| D-002 | Default Layout Direction | D-001 |
| D-003 | Svelte Flow Commitment | D-009 |
| D-004 | Manual Drag Semantics | D-003 |
| D-005 | Layout State Persistence | D-006 |
| D-006 | Brownfield Abstraction Granularity | D-005 |
| D-007 | Ghost Proposal Presentation | D-007 |
| D-008 | Web Worker Boundary | D-010 |
| D-009 | Pinned Node V1 Scope | D-004 |
| D-010 | Canvas Node Information Density | D-008 |

## Phase and Checkpoint Mapping / Phase 与 Checkpoint 映射

| Phase | Capability Checkpoints / 能力 Checkpoint | Mapping Note / 映射说明 |
| --- | --- | --- |
| Phase 0 | Checkpoint 0 | Documentation and Decision Freeze / 文档与决策冻结 |
| Phase 1 | Checkpoints 1–2; core protocols for 6–7 | Implements compiler contracts/solver plus core incremental and Ghost protocols; product integration remains later. / 实现 compiler contract/solver 以及 incremental/Ghost 核心协议；产品集成留在后续。 |
| Phase 2 | Checkpoint 3 | SvelteKit, command layer, Canvas adapter / SvelteKit、command layer、Canvas adapter |
| Phase 3 | Checkpoint 4; Inspector/Workspace slice of 8 | Greenfield vertical workflow / Greenfield 垂直工作流 |
| Phase 4 | Checkpoint 5 | Brownfield projection and progressive disclosure / Brownfield 投影与渐进披露 |
| Phase 5 | Checkpoints 7–9 | Ghost product behavior, Review, Handoff / Ghost 产品行为、Review、Handoff |
| Phase 6 | Checkpoint 6 plus quality/E2E gates across 4–9 | Finalizes incremental quality and cross-workflow evidence after representative UI flows exist. / 在代表性 UI flow 存在后完成 incremental 质量与跨流程证据。 |
| Phase 7 | Checkpoint 10 | Terminal, only after architecture review / Terminal，仅在架构评审后 |

现有 Checkpoint 编号是 capability 分解，不再被解释为完整执行顺序；用户本任务明确批准的 Phase 0→7 顺序是主执行顺序。Phase 1 只定义 Ghost protocol，Phase 5 才实现 Ghost 产品行为；Phase 1 建立 incremental core，Phase 6 才完成跨 UI workflow 的稳定性和质量门禁。

Existing Checkpoint numbers are a capability decomposition and are no longer interpreted as the complete execution order; the user-approved Phase 0→7 sequence in this task is the master execution order. Phase 1 defines only the Ghost protocol, while Phase 5 implements Ghost product behavior; Phase 1 establishes the incremental core, while Phase 6 completes stability and quality gates across UI workflows.

## Global Architecture Invariants / 全局架构不变量

1. Architecture IR is the source of truth. / Architecture IR 是事实来源。
2. Layout State is not Architecture State. / Layout State 不是 Architecture State。
3. Svelte Flow is only a renderer and interaction surface. / Svelte Flow 只是 renderer 与 interaction surface。
4. ELK is only a solver behind `LayoutEngine`. / ELK 只是 `LayoutEngine` 后的 solver。
5. Semantic Layout belongs to Coding CAD. / Semantic Layout 属于 Coding CAD。
6. Automatic Layout is the default. / Automatic Layout 是默认方式。
7. Manual Layout is an escape hatch and quality signal. / Manual Layout 是逃生口与质量信号。
8. Local change should produce local movement. / 局部变化应产生局部移动。
9. Brownfield uses progressive disclosure. / Brownfield 使用 progressive disclosure。
10. Ghost Proposal never silently mutates Architecture IR. / Ghost Proposal 绝不静默修改 Architecture IR。
11. Coding CAD never owns an external Coding Agent runtime. / Coding CAD 绝不拥有外部 Coding Agent runtime。

## Phase 0 — Planning / Decision Freeze / 规划与决策冻结

### Goal / 目标

恢复真实仓库事实，建立 Phase 0–7 的唯一执行计划，并冻结或明确延后所有产品/技术 Decision。 / Restore repository facts, establish the sole Phase 0–7 execution plan, and freeze or explicitly defer every product and technical Decision.

### Modules / 模块

- `docs/ui-v1-execution-plan.md`
- `docs/ui-mvp-roadmap.md`
- `docs/architecture-layout-decisions.md`
- `docs/architecture-layout.md`
- `docs/ui-architecture.md`
- root and module `logs/`

### Dependencies / 依赖

无前置 Phase；依赖仓库代码、Git state、README、docs、Decision 与 TODO 的事实恢复。 / No preceding Phase; depends on restoring facts from code, Git state, READMEs, docs, Decisions, and TODOs.

### Scope / 范围

- 建立 Master Plan、Decision crosswalk、Phase/Checkpoint 映射与 baseline。 / Establish the Master Plan, Decision crosswalk, Phase/Checkpoint mapping, and baseline.
- 评估 canonical D-001…D-010 的 blocking 状态。 / Evaluate blocking status for canonical D-001…D-010.
- 对每个 Decision 填写 Final Decision，或由用户明确延后至指定 Phase。 / Have the user fill each Final Decision or explicitly defer it to a named Phase.
- 明确风险、回退和 Phase report 模板。 / Define risks, rollback, and the Phase report template.

### Non-goals / 非目标

- 不实现 Layout、Svelte、Ghost、Handoff 或 Terminal。 / Do not implement Layout, Svelte, Ghost, Handoff, or Terminal.
- 不安装依赖，不自行冻结 Decision。 / Do not install dependencies or decide for the user.

### Deliverables / 交付物

- 本 Master Plan 与同步后的 Roadmap、Decision、Risk Register。 / This Master Plan and synchronized Roadmap, Decisions, and Risk Register.
- lint/build/test baseline。 / A lint/build/test baseline.
- Phase 1 readiness 与 blocking summary。 / Phase 1 readiness and blocking summary.

### Acceptance Criteria / 验收标准

- Phase 0–7 格式完整且严格有序。 / Phases 0–7 are complete and strictly ordered.
- Decision 编号冲突有 canonical crosswalk。 / The Decision-number conflict has a canonical crosswalk.
- 所有 Phase 1 blocking/required Decision 明确。 / All Phase 1 blocking and required Decisions are explicit.
- baseline 通过或失败证据已记录。 / Baseline pass or failure evidence is recorded.
- 未修改实现代码或依赖。 / No implementation code or dependency is changed.

### Tests / 测试

- Unit：不适用；以 Decision/Phase 文档结构脚本替代。 / Unit: not applicable; use Decision/Phase document-structure scripts.
- Integration：文档链接、ID 映射和 blocking matrix 一致性检查。 / Integration: document-link, ID-mapping, and blocking-matrix consistency checks.
- E2E：现有 `pnpm test:e2e` baseline，不新增 UI E2E。 / E2E: existing `pnpm test:e2e` baseline; no new UI E2E.

### Risks / 风险

- 附件编号与 canonical ID 混淆。 / Confusion between attachment labels and canonical IDs.
- Recommendation 被误认为 Final Decision。 / Recommendations mistaken for Final Decisions.
- Phase 与 legacy Checkpoint 重复或漂移。 / Phase and legacy Checkpoint duplication or drift.

### Decision Gates / 决策门禁

- Phase 0 exit 前，D-001…D-010 必须被用户决定或明确延后。 / Before Phase 0 exit, the user must decide or explicitly defer D-001…D-010.
- D-001–D-006 与 D-008–D-010 已批准；Checkpoint 1–3 已验证并合并；D-007 保留 Phase 5 门禁。 / D-001 through D-006 and D-008 through D-010 are approved; Checkpoints 1–3 are verified and merged; D-007 remains the Phase 5 gate.

### Exit Condition / 退出条件

用户确认所有当前 blocking Decision，或明确给出允许进入 Phase 1 的 Decision 集合；baseline 通过；Phase 0 报告完成。 / The user confirms every currently blocking Decision or explicitly identifies the Decision set that authorizes Phase 1; baseline passes; the Phase 0 report is complete.

## Phase 1 — Semantic Layout Compiler / 语义布局编译器

### Goal / 目标

在纯 Node/TypeScript 环境建立 `ArchitectureProject -> Semantic Layout Compiler -> LayoutResult`，为所有 UI flow 提供 renderer-independent 布局能力。 / Establish `ArchitectureProject -> Semantic Layout Compiler -> LayoutResult` in pure Node/TypeScript, providing renderer-independent layout for every UI flow.

### Modules / 模块

- `packages/architecture-layout`
- `packages/architecture-ir`（只消费既有契约 / consume existing contracts only）
- `docs/architecture-layout.md`
- `docs/architecture-layout-decisions.md`
- `logs/modules/architecture-layout`

### Dependencies / 依赖

- Phase 0 exit。
- canonical D-005 用于 abstraction contract；D-002/D-010 用于 solver/worker；D-001 用于 default direction。 / Phase 0 exit; canonical D-005 for abstraction contracts, D-002/D-010 for solver/worker, and D-001 for default direction.

### Scope / 范围

- Layout/Visual IR、stable identity、result integrity。 / Layout/Visual IR, stable identity, and result integrity.
- Semantic Classification、Architecture Abstraction、Visual IR、Constraint Generation passes。 / Semantic Classification, Architecture Abstraction, Visual IR, and Constraint Generation passes.
- V0.1 semantic roles 至少覆盖 `actor`、`gateway`、`service`、`database`、`cache`、`queue`、`external`；更细角色必须保持 Layout classification，而不是新增 Architecture IR domain object。 / V0.1 semantic roles cover at least `actor`, `gateway`, `service`, `database`, `cache`, `queue`, and `external`; finer roles remain Layout classifications rather than new Architecture IR domain objects.
- V0.1 layout hints 至少表达 `rank`、`proximity`、`group`、`direction` 与 `port`，并保持 preference/constraint 语义，不升级为 Validator correctness rule。 / V0.1 layout hints express at least `rank`, `proximity`, `group`, `direction`, and `port`, and remain preferences or constraints rather than Validator correctness rules.
- solver-neutral `LayoutEngine`、批准后的 solver adapter 和 worker boundary。 / Solver-neutral `LayoutEngine`, approved solver adapter, and worker boundary.
- 第一个可验收版本只批准一种正式默认布局策略；方向和 solver 由 D-001/D-002 决定，其他策略不进入同一切片。 / The first acceptable version supports only one approved formal default layout strategy; D-001/D-002 decide its direction and solver, and additional strategies stay out of the same slice.
- Stability Pass、FULL/INCREMENTAL core、movement cost。 / Stability Pass, FULL/INCREMENTAL core, and movement cost.
- Ghost Layout protocol 与 local-placement contract，不做 UI。 / Ghost Layout protocol and local-placement contract without UI.
- deterministic validation、diagnostics、cancellation/fallback。 / Deterministic validation, diagnostics, and cancellation/fallback.

### Non-goals / 非目标

- 不实现 Svelte、SvelteKit、Svelte Flow、DOM 或 CSS。 / No Svelte, SvelteKit, Svelte Flow, DOM, or CSS.
- 不把 ELK 类型暴露到 public domain model。 / Do not expose ELK types in the public domain model.
- 不修改 Architecture IR 语义，不实现 LayoutState 持久化或 Ghost Review UI。 / Do not modify Architecture IR semantics or implement LayoutState persistence or Ghost Review UI.

### Deliverables / 交付物

- 经评审的 minimal public contracts 与 internal pass boundaries。 / Reviewed minimal public contracts and internal pass boundaries.
- ArchitectureProject compiler、LayoutResult validator、solver adapter。 / ArchitectureProject compiler, LayoutResult validator, and solver adapter.
- Greenfield/Brownfield/incremental/Ghost semantic fixtures。 / Greenfield, Brownfield, incremental, and Ghost semantic fixtures.
- Node-only unit/integration tests 与 performance baseline。 / Node-only unit/integration tests and a performance baseline.

### Acceptance Criteria / 验收标准

- ArchitectureProject 可生成合法 LayoutResult。 / ArchitectureProject generates a valid LayoutResult.
- 相同输入/options 产生 deterministic result。 / Identical inputs and options produce deterministic results.
- actor、gateway、service、database、cache、queue、external role 产生可验证 layout hints。 / Actor, gateway, service, database, cache, queue, and external roles produce verifiable layout hints.
- `rank`、`proximity`、`group`、`direction`、`port` 均有 fixture/invariant 证据，且不会写回 ArchitectureProject。 / `rank`, `proximity`, `group`, `direction`, and `port` all have fixture or invariant evidence and are never written back to ArchitectureProject.
- 新增局部组件不大幅移动无关节点，达到批准 movement threshold。 / Adding a local component does not significantly move unrelated nodes and meets the approved movement threshold.
- mental-map 回归至少包含“在既有图中为一个 service 增加 Redis/cache，多个无关节点不得整体换位”的场景。 / Mental-map regression includes at least the scenario of adding Redis/cache to one service in an existing graph without causing multiple unrelated nodes to change overall positions.
- Layout IR 无 renderer、ELK、Svelte、DOM 类型。 / Layout IR has no renderer, ELK, Svelte, or DOM types.
- Architecture IR/DSL 无视觉状态字段。 / Architecture IR/DSL contains no visual-state fields.
- failure、timeout/cancellation 有结构化诊断与 fallback。 / Failure, timeout, and cancellation have structured diagnostics and fallback.

### Tests / 测试

- Unit：classifier、abstraction、constraints、stability、movement cost、result validation。 / Unit: classifier, abstraction, constraints, stability, movement cost, and result validation.
- Integration：ArchitectureProject 到 LayoutResult、solver adapter contract、incremental diff，以及 Redis/cache mental-map fixture。 / Integration: ArchitectureProject to LayoutResult, solver-adapter contract, incremental diff, and the Redis/cache mental-map fixture.
- E2E：package-level Node fixture runner；无浏览器。 / E2E: package-level Node fixture runner without a browser.

### Risks / 风险

- semantic misclassification、过度 abstraction、layout instability。 / Semantic misclassification, over-abstraction, and layout instability.
- solver bundle/performance、worker cancellation、public API 过早冻结。 / Solver bundle/performance, worker cancellation, and premature public API freeze.
- 把完整 compiler 压入一个大切片。 / Compressing the full compiler into one oversized slice.

### Decision Gates / 决策门禁

- D-005：已批准并用于 Checkpoint 1 abstraction contract。
- D-002：已批准 ELK.js behind `LayoutEngine`。
- D-010：已批准 V1 solver-only worker。
- D-001：已批准 LR default compiler option。
- D-007：只阻塞 Ghost presentation，不阻塞 core protocol。

- D-005 is approved and applied to the Checkpoint 1 abstraction contract.
- D-002 approves ELK.js behind `LayoutEngine`.
- D-010 approves a solver-only worker for V1.
- D-001 approves LR as the default compiler option.
- D-007: blocks Ghost presentation only, not the core protocol.

### Exit Condition / 退出条件

全部 Acceptance Criteria 与 Node-only tests 通过；Architecture Review 确认 IR/renderer/solver 边界；Phase 1 report 完整。 / All Acceptance Criteria and Node-only tests pass; Architecture Review confirms IR/renderer/solver boundaries; the Phase 1 report is complete.

## Phase 2 — Svelte CAD Infrastructure / Svelte CAD 基础设施

### Goal / 目标

建立 `LayoutResult -> apps/web adapter -> Svelte Flow -> Architecture Canvas` 与 Architecture Command Layer。 / Establish `LayoutResult -> apps/web adapter -> Svelte Flow -> Architecture Canvas` and the Architecture Command Layer.

### Modules / 模块

- `apps/web`
- `packages/architecture-layout`（只消费 public API / consume public API only）
- `packages/architecture-ir`
- `docs/ui-architecture.md`
- `logs/modules/web`

### Dependencies / 依赖

- Phase 1 exit。
- D-009 Svelte Flow commitment；D-003 drag semantics；D-008 node density。 / Phase 1 exit; D-009 Svelte Flow commitment, D-003 drag semantics, and D-008 node density.

### Scope / 范围

- 初始化批准的 SvelteKit/Svelte 5/TypeScript toolchain。 / Initialize the approved SvelteKit/Svelte 5/TypeScript toolchain.
- 建立 `LayoutResult -> Svelte Flow Node/Edge` anti-corruption adapter。 / Establish the `LayoutResult -> Svelte Flow Node/Edge` anti-corruption adapter.
- Canvas pan、zoom、selection、node/edge rendering。 / Canvas pan, zoom, selection, and node/edge rendering.
- Architecture Command Layer：Add/Remove/Connect 经 command 生成 candidate IR change，再布局。 / Architecture Command Layer: Add/Remove/Connect creates a candidate IR change through commands and then re-layouts.
- 基础 loading/error/cancellation 与 accessibility。 / Basic loading, error, cancellation, and accessibility behavior.

### Narrow Slices / 窄切片顺序

Phase 2 按以下顺序实施；每一片必须独立通过其验收证据后才能进入下一片。 / Phase 2 is implemented in the following order; each slice must produce its own acceptance evidence before the next slice begins.

1. **P2.0 Baseline and Toolchain Plan / 基线与工具链计划**：核对 `apps/web` placeholder、workspace scripts、D-003/D-008/D-009、SvelteKit/Svelte 5、`@xyflow/svelte` 与测试工具的兼容范围；记录拟新增依赖和回退点。本片不安装依赖。 / Audit the `apps/web` placeholder, workspace scripts, D-003/D-008/D-009, and the compatibility range for SvelteKit/Svelte 5, `@xyflow/svelte`, and test tools; record intended dependencies and rollback points. This slice installs nothing.
2. **P2.1 Svelte App Foundation / Svelte 应用基础**：把既有 placeholder 原地转换为最小 SvelteKit app，保留既有 `src/lib` ownership；建立 build、typecheck、unit/component test 基线。验收为 workspace scripts 与最小页面通过，不包含产品 UI。 / Convert the existing placeholder in place into a minimal SvelteKit app while preserving current `src/lib` ownership; establish build, typecheck, and unit/component-test baselines. Acceptance is passing workspace scripts and a minimal page, not product UI.
3. **P2.2 Adapter Contract / Adapter 契约**：在唯一 adapter 边界完成 `LayoutResult -> Svelte Flow Node/Edge` 单向映射与 contract tests；证明 ID、edge endpoint、坐标/尺寸及 solver-neutral metadata 映射稳定，Svelte Flow 类型不泄漏。 / Implement the sole one-way `LayoutResult -> Svelte Flow Node/Edge` mapping and contract tests; prove stable ID, edge-endpoint, coordinate/size, and solver-neutral metadata mapping without Svelte Flow type leakage.
4. **P2.3 Canvas Shell / Canvas 外壳**：渲染真实 `ArchitectureProject -> LayoutResult` fixture，支持 node/edge rendering、pan、zoom、selection、Standard density 与 Semantic Zoom，并完成基础 keyboard/focus/accessibility。 / Render a real `ArchitectureProject -> LayoutResult` fixture with node/edge rendering, pan, zoom, selection, Standard density, Semantic Zoom, and basic keyboard/focus/accessibility behavior.
5. **P2.4 UI and Async State / UI 与异步状态**：分离 accepted ArchitectureProject、LayoutResult、Workspace-owned LayoutState 与 ephemeral UI state；覆盖 loading、error、cancellation、stale-result rejection。拖动若在本片启用，只写 LayoutState，禁止写 IR 或推导 constraint。 / Separate the accepted ArchitectureProject, LayoutResult, Workspace-owned LayoutState, and ephemeral UI state; cover loading, errors, cancellation, and stale-result rejection. If dragging is enabled in this slice, it writes only LayoutState and never IR or inferred constraints.
6. **P2.5 Headless Command Application / 无界面命令应用层**：以 renderer-neutral TypeScript 定义 Add/Remove/Connect command contract、candidate generation、Validator/acceptance boundary 与 accepted-state replacement；用 unit/integration tests 证明 rejection 不破坏 accepted IR，成功路径会重新布局并产生新 Canvas projection。本片不创建 Palette、Inspector 或临时产品编辑控件。 / Define renderer-neutral TypeScript contracts for Add/Remove/Connect commands, candidate generation, the Validator/acceptance boundary, and accepted-state replacement; use unit/integration tests to prove rejection preserves accepted IR and success re-lays out into a new Canvas projection. This slice creates no Palette, Inspector, or temporary product editing controls.
7. **P2.6 Phase Acceptance / 阶段验收**：运行 architecture-boundary checks、adapter/unit/component/integration tests，以及只覆盖 Canvas load/pan/zoom/select/accessibility 的 Playwright smoke E2E；同步文档、结构化日志和回退说明。 / Run architecture-boundary checks, adapter/unit/component/integration tests, and Playwright smoke E2E limited to Canvas load/pan/zoom/select/accessibility; synchronize documents, structured logs, and rollback guidance.

Checkpoint 3 是 P2.1–P2.4 的 Canvas capability gate；P2.5 是 Master Phase 2 的额外阶段退出基础设施。两者都完成后才允许进入 Phase 3。 / Checkpoint 3 is the Canvas capability gate for P2.1–P2.4; P2.5 is additional Master Phase 2 exit infrastructure. Both must complete before Phase 3 begins.

### Non-goals / 非目标

- 不实现完整 Inspector、Palette、Review、Brownfield、Ghost、Handoff 或 Terminal。 / No complete Inspector, Palette, Review, Brownfield, Ghost, Handoff, or Terminal.
- 不实现由 Palette、Inspector 或其他产品控件驱动的完整 Greenfield 编辑工作流；这些入口与其 add/remove/connect E2E 属于 Phase 3。 / No complete Greenfield editing workflow driven by Palette, Inspector, or other product controls; those entry points and their add/remove/connect E2E belong to Phase 3.
- Svelte Flow Node[] 不成为架构事实来源。 / Svelte Flow Node[] does not become architecture truth.
- UI adapter 不实现 semantic layout。 / The UI adapter does not implement semantic layout.

### Deliverables / 交付物

- Svelte CAD shell、Canvas、adapter、command contracts、基础 UI test harness。 / Svelte CAD shell, Canvas, adapter, command contracts, and basic UI test harness.
- 一份真实 ArchitectureProject 的可视化 fixture。 / A visual fixture for a real ArchitectureProject.

### Acceptance Criteria / 验收标准

- 真实 ArchitectureProject 经 LayoutResult 显示。 / A real ArchitectureProject displays through LayoutResult.
- pan/zoom/select/node/edge rendering 可工作。 / Pan, zoom, select, and node/edge rendering work.
- Add/Remove/Connect 最终修改 Architecture IR，不能只改 Svelte state。 / Add/Remove/Connect ultimately changes Architecture IR, not only Svelte state.
- package 无 `apps/web` 或 Svelte Flow 反向依赖。 / Packages have no reverse dependency on `apps/web` or Svelte Flow.
- command rejection/validation failure 不破坏 accepted IR。 / Command rejection or validation failure does not corrupt accepted IR.

### Tests / 测试

- Unit：adapter、command reducer、state ownership。 / Unit: adapter, command reducer, and state ownership.
- Integration：command -> candidate IR -> layout -> Canvas projection。 / Integration: command -> candidate IR -> layout -> Canvas projection.
- E2E：Phase 2 只覆盖 Canvas load、pan、zoom、select 与 accessibility smoke；Add/Remove/Connect 在 Phase 2 用 headless integration 验证，经真实产品控件触发的 happy-path E2E 属于 Phase 3。 / E2E: Phase 2 covers only Canvas load, pan, zoom, select, and accessibility smoke behavior. Add/Remove/Connect is verified through headless integration in Phase 2; happy-path E2E through real product controls belongs to Phase 3.

### Risks / 风险

- Svelte Flow 类型泄漏、版本维护、UI state 分叉。 / Svelte Flow type leakage, version maintenance, and UI-state divergence.
- command 与 accepted IR 生命周期不清。 / Unclear command and accepted-IR lifecycle.

### Decision Gates / 决策门禁

- D-009：YES，阻塞 Canvas engine/toolchain。
- D-003：在 drag 行为实现前必须确认。
- D-008：在 node renderer contract 前必须确认。

- D-009: YES, blocks the Canvas engine/toolchain.
- D-003 must be confirmed before drag behavior.
- D-008 must be confirmed before the node-renderer contract.

### Exit Condition / 退出条件

真实 IR 可稳定显示；headless command application 可在不破坏 accepted IR 的前提下生成、校验、接受或拒绝 candidate，并在接受后重新布局；adapter/command/component/Canvas smoke E2E 与架构不变量检查通过。完整 Greenfield 编辑 UI 仍未实现。 / Real IR displays reliably; the headless command application can generate, validate, accept, or reject a candidate without corrupting accepted IR and re-layout after acceptance; adapter, command, component, Canvas smoke E2E, and architecture-invariant checks pass. The complete Greenfield editing UI remains unimplemented.

## Phase 3 — Greenfield Architecture Workspace / Greenfield 架构工作区

### Goal / 目标

支持用户从 requirement 创建、显示、编辑、验证并保存一个简单 ArchitectureProject，且无需手动排版。 / Allow a user to create, display, edit, validate, and save a simple ArchitectureProject from a requirement without manual arrangement.

### Modules / 模块

- `apps/web`
- `packages/architecture-agent`
- `packages/architecture-validator`
- `packages/component-registry`
- `packages/architecture-review`
- `packages/workspace`
- `packages/architecture-layout`

### Dependencies / 依赖

- Phase 2 exit。
- D-006 Layout State persistence 在 Workspace Save/View State 持久化前确认。 / Phase 2 exit; D-006 Layout State persistence before Workspace Save/View State persistence.

### Scope / 范围

- New Project、Requirement、Architecture Agent 到 candidate ArchitectureProject。 / New Project, Requirement, and Architecture Agent to candidate ArchitectureProject.
- Component Palette、semantic Inspector、contract editing。 / Component Palette, semantic Inspector, and contract editing.
- Validation/Problems projection、Review gate、Workspace save/open。 / Validation/Problems projection, Review gate, and Workspace save/open.
- Layout 与 View State 生命周期，不污染 IR。 / Layout and View State lifecycle without IR pollution.
- 通过 Palette、Inspector 或其他正式产品入口触发 Add/Remove/Connect，并覆盖 visible-control E2E；复用 Phase 2 command application，不另建第二套 mutation path。 / Trigger Add/Remove/Connect through Palette, Inspector, or other real product entry points and cover visible-control E2E; reuse the Phase 2 command application rather than creating a second mutation path.

### Narrow Slices / 窄切片顺序

Phase 3 按以下顺序实施；每片必须先恢复 Goal、Input、Output、Acceptance、Risk 与 Non-goal，并独立产出证据。 / Phase 3 is implemented in the following order; each slice must first restore its Goal, Input, Output, Acceptance, Risk, and Non-goal and then produce independent evidence.

1. **P3.0 Contract and Host Freeze / 契约与宿主冻结**：确认 P3-D1–P3-D3，定义 browser-safe DTO、SvelteKit server boundary、accepted/candidate/review/view-state 生命周期和回退点；不实现产品行为。 / Confirm P3-D1 through P3-D3 and define browser-safe DTOs, the SvelteKit server boundary, accepted/candidate/review/view-state lifecycles, and rollback points; implement no product behavior.
2. **P3.1 Workspace Host Bridge / Workspace 宿主桥接**：让 Node-only `@coding-cad/workspace` 只在 SvelteKit server boundary 运行；浏览器通过 typed app contract create/open/save，不直接导入 `node:*` 或文件存储类型。ArchitectureProject snapshot 与 Layout/View State 分开保存。 / Run Node-only `@coding-cad/workspace` only at the SvelteKit server boundary; the browser creates, opens, and saves through a typed app contract without importing `node:*` or file-storage types. ArchitectureProject snapshots remain separate from Layout/View State.
3. **P3.2 Requirement to Candidate / Requirement 到 Candidate**：使用批准的 Greenfield generation mode 生成 candidate ArchitectureProject，经 Validator 产生 Problems，并通过最小 accept/reject gate；accepted ArchitectureProject 在批准前不变。 / Use the approved Greenfield generation mode to create a candidate ArchitectureProject, produce Problems through Validator, and pass a minimal accept/reject gate; the accepted ArchitectureProject remains unchanged before approval.
4. **P3.3 Workspace Shell and Projection / Workspace 外壳与投影**：建立 New Project、Requirement、Canvas、Problems、selection navigation 与 loading/error/cancellation 状态；复用 Phase 2 worker、adapter 和 Canvas。 / Establish New Project, Requirement, Canvas, Problems, selection navigation, and loading/error/cancellation state while reusing the Phase 2 worker, adapter, and Canvas.
5. **P3.4 Palette Command Entry / Palette 命令入口**：从 Component Registry 投影 Palette item，通过 Phase 2 command application 执行 Add/Remove/Connect；不建立第二套组件模型或 mutation path。 / Project Palette items from Component Registry and execute Add/Remove/Connect through the Phase 2 command application without creating a second component model or mutation path.
6. **P3.5 Semantic Inspector / 语义 Inspector**：显示并按批准粒度编辑 component semantics、capabilities、contracts 与 validation issues；只发显式 command，不提供 generic JSON patch 或 width/height/color/border 控件。 / Display and edit component semantics, capabilities, contracts, and validation issues at the approved granularity; emit only explicit commands and provide no generic JSON patch or width/height/color/border controls.
7. **P3.6 Save/Open Lifecycle / Save/Open 生命周期**：保存 accepted ArchitectureProject、validation evidence 和独立 Layout/View State；重新打开后恢复相同架构事实与可用视图，忽略失效 node identity。 / Save the accepted ArchitectureProject, validation evidence, and separate Layout/View State; reopening restores the same architecture facts and a usable view while safely ignoring stale node identities.
8. **P3.7 Phase Acceptance / 阶段验收**：完成 points-system Create/Display/Edit/Validate/Accept/Save/Open happy path 与 invalid-candidate/rejection/error paths；运行 unit/component/integration/Playwright、架构边界与完整 CI，并同步报告和回退证据。 / Complete points-system Create/Display/Edit/Validate/Accept/Save/Open happy paths plus invalid-candidate, rejection, and error paths; run unit/component/integration/Playwright, architecture-boundary checks, and full CI and synchronize reports and rollback evidence.

### Detailed Slice Specifications / 切片详细规格

以下每个切片都必须在开始实现前恢复其 Goal、Input、Output、Acceptance、Risk 与 Non-goal，并在切片结束时独立产出外部证据。 / Each slice below must restore its Goal, Input, Output, Acceptance, Risk, and Non-goal before implementation and produce independent external evidence at its end.

#### P3.0 Contract and Host Freeze / 契约与宿主冻结

**Goal / 目标**：确认 P3-D1-P3-D3，冻结 Phase 3 的 browser-safe 契约、宿主边界与生命周期划分，为全部后续切片建立不可变基线；本片不实现产品行为。 / Confirm P3-D1 through P3-D3 and freeze the Phase 3 browser-safe contracts, host boundary, and lifecycle split, establishing the immutable baseline for all later slices; this slice implements no product behavior.

**Input / 输入**：Phase 2 已验证的 adapter/worker/command application；@coding-cad/workspace、architecture-agent、architecture-validator、component-registry、architecture-review 的 public API 事实；D-006 的 LayoutState ownership。 / Phase 2 verified adapter/worker/command application; public-API facts from the Workspace, Architecture Agent, Validator, Component Registry, and Architecture Review packages; D-006 LayoutState ownership.

**Output / 输出**：P3-D1-P3-D3 的用户确认记录；browser-safe DTO 契约；SvelteKit server boundary 定义；accepted/candidate/review/view-state 四类生命周期的所有权矩阵；回退点。 / User confirmation records for P3-D1 through P3-D3; browser-safe DTO contracts; the SvelteKit server boundary definition; an ownership matrix for the accepted/candidate/review/view-state lifecycles; rollback points.

**Acceptance Criteria / 验收标准**：三项 P3-Dx 均由用户明确决定；浏览器不得导入 node:*、FileWorkspaceStorage 或磁盘 schema 的约束已写入契约；ArchitectureProject snapshot、validation/review evidence、LayoutState 与 ephemeral UI state 有独立生命周期；未冻结 workspace 磁盘格式或 generic Inspector patch API。 / All three P3-Dx gates are explicitly decided by the user; the constraint that the browser never imports node:* or FileWorkspaceStorage or disk schemas is written into the contracts; ArchitectureProject snapshots, validation/review evidence, LayoutState, and ephemeral UI state have distinct lifecycles; no workspace disk format or generic Inspector patch API is frozen.

**Known Risks / 已知风险**：宿主边界与磁盘格式提前冻结；DTO 与现有 package API 漂移；生命周期所有权含糊导致后续切片返工。 / Premature host-boundary or disk-format freeze; DTO drift from existing package APIs; ambiguous lifecycle ownership forcing rework in later slices.

**Non-goals / 非目标**：不实现任何产品 UI、存储读写或生成逻辑；不修改 Architecture IR/DSL。 / No product UI, storage I/O, or generation logic; no Architecture IR/DSL change.

**Exit Evidence / 退出证据**：用户确认记录；契约、生命周期与回退文档；文档结构检查与 workspace 基线通过。 / User confirmation records; contract, lifecycle, and rollback documentation; documentation-structure checks and the workspace baseline pass.

#### P3.1 Workspace Host Bridge / Workspace 宿主桥接

**Goal / 目标**：让 Node-only @coding-cad/workspace 只在 SvelteKit server boundary 运行，浏览器通过 typed app contract 创建、打开、保存项目，且不直接导入 node:* 或文件存储类型。 / Run Node-only @coding-cad/workspace only at the SvelteKit server boundary; the browser creates, opens, and saves projects through a typed app contract without importing node:* or file-storage types.

**Input / 输入**：P3.0 冻结的 browser-safe DTO 与 server boundary；@coding-cad/workspace 的 Node-only storage 能力；apps/web Phase 2 app。 / The P3.0-frozen browser-safe DTOs and server boundary; Node-only storage capabilities of @coding-cad/workspace; the Phase 2 apps/web app.

**Output / 输出**：SvelteKit server route/endpoint 桥接层；typed create/open/save app contract；ArchitectureProject snapshot 与 Layout/View State 分离存储的最小实现。 / A SvelteKit server route/endpoint bridge; typed create/open/save app contracts; a minimal implementation that stores ArchitectureProject snapshots separately from Layout/View State.

**Acceptance Criteria / 验收标准**：浏览器 bundle 不含 node:* 或 workspace 磁盘类型（build 与 lint 证据）；create/open/save 经 typed contract 往返一致；snapshot 与 Layout/View State 可分别读写；server boundary 拒绝未类型化请求。 / The browser bundle contains no node:* or workspace disk types (build and lint evidence); create/open/save round-trips consistently through typed contracts; snapshots and Layout/View State are separately readable and writable; the server boundary rejects untyped requests.

**Known Risks / 已知风险**：DTO 与 Workspace public API 不一致；序列化丢失 provenance；server route 变成第二套业务逻辑入口。 / DTO and Workspace public-API mismatch; serialization loses provenance; server routes become a second business-logic entry.

**Non-goals / 非目标**：不实现保存格式的最终版本；不做多用户并发或共享存储；不引入数据库。 / No final save format; no multi-user concurrency or shared storage; no database.

**Exit Evidence / 退出证据**：bridge/contract unit 与 integration tests；浏览器 bundle 类型检查；往返一致性测试。 / Bridge/contract unit and integration tests; browser-bundle type checks; round-trip consistency tests.

#### P3.2 Requirement to Candidate / Requirement 到 Candidate

**Goal / 目标**：使用 P3-D2 批准的生成模式，从 requirement 生成 candidate ArchitectureProject，经 Validator 产生 Problems，并通过最小 accept/reject gate；accepted ArchitectureProject 在批准前保持不变。 / Using the P3-D2-approved generation mode, create a candidate ArchitectureProject from a requirement, produce Problems through Validator, and pass a minimal accept/reject gate; the accepted ArchitectureProject remains unchanged before approval.

**Input / 输入**：用户 requirement；packages/architecture-agent（deterministic + Mock Provider baseline）；architecture-validator；component-registry；P3.1 的 app contract。 / A user requirement; packages/architecture-agent (deterministic + Mock Provider baseline); architecture-validator; component-registry; the P3.1 app contract.

**Output / 输出**：requirement -> candidate IR -> Problems -> minimal Review gate 的 renderer-neutral 流程；accept/reject 后 accepted IR 更新（accept 时）并保留 rejected candidate 为可丢弃状态。 / A renderer-neutral requirement -> candidate IR -> Problems -> minimal Review gate flow; on accept the accepted IR updates, and on reject the candidate becomes a discardable state.

**Acceptance Criteria / 验收标准**：相同 requirement 产生 deterministic candidate；Validator Problems 可追溯来源；accept 前 accepted IR 不变；accept 必须经过 Review gate 后才更新 accepted IR 并触发布局；reject 不改变 accepted IR。 / The same requirement produces a deterministic candidate; Validator Problems retain provenance; the accepted IR is unchanged before accept; accept passes through the Review gate before updating the accepted IR and triggering layout; reject leaves the accepted IR untouched.

**Known Risks / 已知风险**：Agent 输出与 command model 不一致；生成结果不稳定；Review gate 与 Phase 5 完整 Review 语义重叠。 / Agent output and command-model mismatch; unstable generation results; the Review gate overlapping Phase 5 complete-Review semantics.

**Non-goals / 非目标**：不接入真实 LLM Provider（留 TODO-009）；不做 Ghost presentation；不实现评论、多人 approval 或 impact analysis。 / No real LLM Provider (TODO-009 gate); no Ghost presentation; no comments, multi-approval, or impact analysis.

**Exit Evidence / 退出证据**：Agent -> Validator -> Review integration tests；points-system requirement fixture；determinism 测试；accept/reject 不变量测试。 / Agent -> Validator -> Review integration tests; a points-system requirement fixture; determinism tests; accept/reject invariant tests.

#### P3.3 Workspace Shell and Projection / Workspace 外壳与投影

**Goal / 目标**：建立 New Project、Requirement、Canvas、Problems、selection navigation 与 loading/error/cancellation 状态；复用 Phase 2 worker、adapter 与 Canvas，不重建布局或渲染逻辑。 / Establish New Project, Requirement, Canvas, Problems, selection navigation, and loading/error/cancellation state while reusing the Phase 2 worker, adapter, and Canvas without rebuilding layout or rendering logic.

**Input / 输入**：P3.1/P3.2 的 contract 与 candidate/review 流程；Phase 2 Canvas/worker/adapter；LayoutState 与 ephemeral UI state 的 P3.0 生命周期矩阵。 / P3.1/P3.2 contracts and candidate/review flow; Phase 2 Canvas/worker/adapter; the P3.0 lifecycle matrix for LayoutState and ephemeral UI state.

**Output / 输出**：Greenfield workspace shell（New Project、Requirement 输入、Canvas 投影、Problems 面板、选择导航）；loading/error/cancellation 状态机。 / A Greenfield workspace shell (New Project, Requirement input, Canvas projection, Problems panel, selection navigation); a loading/error/cancellation state machine.

**Acceptance Criteria / 验收标准**：从 requirement 到 Canvas 投影可重复；Problems 项可导航到对应对象；loading/error/cancellation 不破坏 accepted IR 或 LayoutState；选择导航不产生架构 mutation；UI state 与 ArchitectureProject/LayoutResult 分离。 / Requirement-to-Canvas projection is repeatable; Problems entries navigate to their objects; loading/error/cancellation never corrupt accepted IR or LayoutState; selection navigation performs no architecture mutation; UI state stays separate from ArchitectureProject/LayoutResult.

**Known Risks / 已知风险**：shell 状态与持久化状态混淆；Problems 投影复制 Validator 规则；cancellation 竞态产生 stale projection。 / Shell state confused with persisted state; Problems projection duplicates Validator rules; cancellation races produce stale projections.

**Non-goals / 非目标**：不实现 Palette/Inspector 编辑入口；不做完整 Review workspace；不实现 Brownfield import。 / No Palette/Inspector editing entry points; no complete Review workspace; no Brownfield import.

**Exit Evidence / 退出证据**：Svelte component tests；Playwright happy/error paths（New Project -> requirement -> Canvas -> Problems -> selection）；状态所有权单元测试。 / Svelte component tests; Playwright happy/error paths (New Project -> requirement -> Canvas -> Problems -> selection); state-ownership unit tests.

#### P3.4 Palette Command Entry / Palette 命令入口

**Goal / 目标**：从 Component Registry 投影 Palette item，通过 Phase 2 command application 执行 Add/Remove/Connect；不建立第二套组件模型或 mutation path。 / Project Palette items from Component Registry and execute Add/Remove/Connect through the Phase 2 command application without creating a second component model or mutation path.

**Input / 输入**：@coding-cad/component-registry 的组件能力；Phase 2 Add/Remove/Connect command contracts；accepted/candidate IR 状态。 / Component capabilities from @coding-cad/component-registry; Phase 2 Add/Remove/Connect command contracts; accepted and candidate IR state.

**Output / 输出**：Palette UI 投影（分类、搜索、禁用/可用状态）；Add/Remove/Connect 的产品级触发路径与 visible-control E2E。 / A Palette UI projection (categories, search, disabled/enabled states); product-level Add/Remove/Connect triggers and visible-control E2E.

**Acceptance Criteria / 验收标准**：Palette item 来自 Registry 且类型安全；所有 mutation 只经 Phase 2 command application；添加组件后 Canvas 增量更新且无关节点稳定；remove/connect 同样走命令并保持 accepted IR 不变量；无第二套 mutation path（架构 lint 证据）。 / Palette items come from the Registry and are type-safe; every mutation goes through the Phase 2 command application; adding a component increments the Canvas while unrelated nodes stay stable; remove/connect also use commands and preserve accepted-IR invariants; no second mutation path exists (architecture-lint evidence).

**Known Risks / 已知风险**：Palette 投影漂移出 Registry 事实；拖放被视为 UI 自有模型；命令失败吞掉诊断。 / Palette projection drifts from Registry facts; drag-and-drop is treated as a UI-owned model; command failures swallow diagnostics.

**Non-goals / 非目标**：不实现自由拖放建模；不做组件编辑（属 Inspector）；不引入第二套组件模型。 / No free-form drag modeling; no component editing (Inspector scope); no second component model.

**Exit Evidence / 退出证据**：Palette/command unit tests；visible-control E2E（add/remove/connect）；命令路径 lint 检查。 / Palette/command unit tests; visible-control E2E (add/remove/connect); command-path lint checks.

#### P3.5 Semantic Inspector / 语义 Inspector

**Goal / 目标**：显示并按 P3-D3 批准粒度编辑 component semantics、capabilities、contracts 与 validation issues；只发显式 command，不提供 generic JSON patch 或 width/height/color/border 控件。 / Display and edit component semantics, capabilities, contracts, and validation issues at the P3-D3-approved granularity; emit only explicit commands and provide no generic JSON patch or width/height/color/border controls.

**Input / 输入**：P3-D3 批准的 Inspector command 粒度；selected identity；ArchitectureProject 的 semantics/capabilities/contracts；Validator Problems。 / The P3-D3-approved Inspector command granularity; selected identity; ArchitectureProject semantics/capabilities/contracts; Validator Problems.

**Output / 输出**：语义优先的 Inspector UI；field-specific explicit commands；编辑后 candidate 经 Validator/Review 的闭环。 / A semantics-first Inspector UI; field-specific explicit commands; an edit -> candidate -> Validator/Review closed loop.

**Acceptance Criteria / 验收标准**：编辑只产生显式 command，且经 command application 进入 candidate 流程；无 generic JSON patch；无 width/height/color/border 编辑控件；Inspector 不复制 Validator/Review 业务规则；编辑产生的 validation issue 可导航。 / Edits produce only explicit commands routed through the command application into the candidate flow; no generic JSON patch; no width/height/color/border controls; the Inspector does not duplicate Validator/Review business rules; edited validation issues remain navigable.

**Known Risks / 已知风险**：Inspector 复制核心业务规则；field-specific command 集膨胀；编辑状态与候选 IR 分叉。 / Inspector duplicates core business rules; the field-specific command set balloons; edit state forks from candidate IR.

**Non-goals / 非目标**：不新增 Architecture IR 语义；不做图形设计属性面板；不实现 Ghost/Proposal 编辑。 / No new Architecture IR semantics; no graphic-design property panel; no Ghost/Proposal editing.

**Exit Evidence / 退出证据**：Inspector/command unit tests；component tests；edit-command E2E；IR-语义无变化检查。 / Inspector/command unit tests; component tests; edit-command E2E; no-IR-semantic-change checks.

#### P3.6 Save/Open Lifecycle / Save/Open 生命周期

**Goal / 目标**：保存 accepted ArchitectureProject、validation evidence 与独立 Layout/View State；重新打开后恢复相同架构事实与可用视图，安全忽略失效 node identity。 / Save the accepted ArchitectureProject, validation evidence, and separate Layout/View State; reopening restores the same architecture facts and a usable view while safely ignoring stale node identities.

**Input / 输入**：P3.1 bridge 与 storage；accepted IR snapshot；validation/review evidence；LayoutState/View State；失效 identity 处理规则（D-003）。 / P3.1 bridge and storage; accepted-IR snapshot; validation/review evidence; LayoutState/View State; stale-identity handling rules (D-003).

**Output / 输出**：Save/Open 产品路径；可恢复的 snapshot + evidence + view state 组合；失效 node identity 的安全忽略逻辑。 / Save/Open product paths; a restorable snapshot + evidence + view-state combination; safe stale-node-identity ignoring logic.

**Acceptance Criteria / 验收标准**：保存后重开恢复相同架构事实；Layout/View State 独立保存且不与 IR 合并；失效 node identity 被安全忽略且视图可用；保存/打开往返的确定性校验通过。 / Reopening restores identical architecture facts; Layout/View State saves separately and never merges into IR; stale node identities are safely ignored with a usable view; save/open round-trips pass determinism checks.

**Known Risks / 已知风险**：LayoutState 污染 ArchitectureProject；失效 identity 破坏 mental map；磁盘格式冻结过早。 / LayoutState pollutes ArchitectureProject; stale identities damage the mental map; the disk format freezes prematurely.

**Non-goals / 非目标**：不冻结最终磁盘格式；不做共享/个人存储策略决策（D-006 后续门禁）；不做版本迁移框架。 / No final disk-format freeze; no shared/personal storage decision (later D-006 gate); no version-migration framework.

**Exit Evidence / 退出证据**：Save/Open integration tests；往返一致性与失效 identity 测试；Playwright save/open happy path。 / Save/Open integration tests; round-trip consistency and stale-identity tests; Playwright save/open happy path.

#### P3.7 Phase Acceptance / 阶段验收

**Goal / 目标**：完成 points-system Create/Display/Edit/Validate/Accept/Save/Open happy path 与 invalid-candidate/rejection/error paths；运行 unit/component/integration/Playwright、架构边界与完整 CI，并同步报告与回退证据。 / Complete the points-system Create/Display/Edit/Validate/Accept/Save/Open happy path plus invalid-candidate, rejection, and error paths; run unit/component/integration/Playwright, architecture-boundary checks, and full CI; synchronize reports and rollback evidence.

**Input / 输入**：P3.0-P3.6 全部切片产出；points-system fixture；既有架构不变量与边界检查。 / All P3.0-P3.6 slice outputs; the points-system fixture; existing architecture invariants and boundary checks.

**Output / 输出**：Phase 3 完成报告（按 Required Phase Completion Report 格式）；E2E 证据；workspace/IR/View State 边界评审记录。 / A Phase 3 completion report (Required Phase Completion Report format); E2E evidence; the Workspace/IR/View State boundary review record.

**Acceptance Criteria / 验收标准**：happy path 全流程通过；invalid-candidate、rejection、error paths 有覆盖；所有 semantic edit 经 command/proposal 且不直接改 accepted IR；validation issue 可导航；保存后 IR 与 Layout/View State 分离；默认布局无需手动整理；完整 pnpm ci:verify 通过。 / The happy path passes end to end; invalid-candidate, rejection, and error paths are covered; every semantic edit uses a command/proposal without directly mutating accepted IR; validation issues navigate; saved IR and Layout/View State stay separate; the default layout needs no manual arrangement; the full pnpm ci:verify passes.

**Known Risks / 已知风险**：E2E 覆盖不足而宣称完成；切片间契约漂移在验收时才暴露；性能或可读性未达标。 / Claiming completion with insufficient E2E coverage; cross-slice contract drift surfacing only at acceptance; performance or readability falling short.

**Non-goals / 非目标**：不包含 Brownfield、Ghost、完整 Review、Handoff 或 Terminal；不引入真实 LLM。 / No Brownfield, Ghost, complete Review, Handoff, or Terminal; no real LLM.

**Exit Evidence / 退出证据**：完整 CI 输出；Playwright 全套；边界与不变量检查；Phase 3 报告与回退说明。 / Full CI output; the complete Playwright suite; boundary and invariant checks; the Phase 3 report and rollback guidance.

Phase 3 的 Review 仅是使 candidate 成为 accepted ArchitectureProject 的最小确认门禁；评论、多人 approval、impact analysis、Ghost presentation 与完整 Review workspace 属于 Phase 5。 / Phase 3 Review is only the minimal confirmation gate that turns a candidate into an accepted ArchitectureProject; comments, multi-reviewer approval, impact analysis, Ghost presentation, and the complete Review workspace belong to Phase 5.

### Non-goals / 非目标

- 不做 Brownfield import、Ghost、Execution Handoff 或 Terminal。 / No Brownfield import, Ghost, Execution Handoff, or Terminal.
- Inspector 不编辑 width/height/color/border。 / Inspector does not edit width, height, color, or border.

### Deliverables / 交付物

- Greenfield Architecture Workspace 垂直切片。 / Greenfield Architecture Workspace vertical slice.
- 简单积分系统 fixture 与可重复 walkthrough。 / A simple points-system fixture and repeatable walkthrough.

### Acceptance Criteria / 验收标准

- 用户完成 Create、Display、Edit、Validate、Review、Save/Open。 / The user completes Create, Display, Edit, Validate, Review, and Save/Open.
- 所有 semantic edit 通过 command/proposal，不直接修改 accepted IR。 / Every semantic edit uses a command/proposal and does not directly mutate accepted IR.
- validation issue 可导航到 Canvas/Inspector。 / Validation issues navigate to Canvas/Inspector.
- 保存后 ArchitectureProject 与 Layout/View State 分离。 / Saved ArchitectureProject and Layout/View State remain separate.
- 默认布局可理解，无需手动整理。 / Default layout is understandable without manual arrangement.

### Tests / 测试

- Unit：Inspector models、Palette commands、validation projection、Workspace adapters。 / Unit: Inspector models, Palette commands, validation projection, and Workspace adapters.
- Integration：Agent -> IR -> Validator -> Review -> Workspace -> Layout。 / Integration: Agent -> IR -> Validator -> Review -> Workspace -> Layout.
- E2E：积分系统 Create/Display/Edit/Validate/Save/Open。 / E2E: points-system Create/Display/Edit/Validate/Save/Open.

### Risks / 风险

- Agent 输出与 command model 不一致。 / Agent output and command model mismatch.
- Inspector 复制核心业务规则。 / Inspector duplicates core business rules.
- Layout persistence 污染 ArchitectureProject。 / Layout persistence pollutes ArchitectureProject.

### Decision Gates / 决策门禁

- D-006：LayoutState 存储与 shared/personal scope。
- 任何新的 Inspector 产品语义、不可逆 command API 或 IR 变化都需要新 Decision。

- D-006: LayoutState storage and shared/personal scope.
- Any new Inspector product semantics, irreversible command API, or IR change requires a new Decision.

Phase 3 planning gates are recorded below without changing Architecture IR or freezing implementation prematurely. / 以下 Phase 3 规划门禁不修改 Architecture IR，也不提前冻结实现：

- **P3-D1 Workspace host boundary / Workspace 宿主边界**：推荐 SvelteKit server boundary 调用 Node-only Workspace，浏览器只使用 typed app contract；阻塞 P3.1。 / Recommend a SvelteKit server boundary around the Node-only Workspace with a typed browser-facing app contract; blocks P3.1.
- **P3-D2 Greenfield generation mode / Greenfield 生成模式**：推荐 V1 使用既有 deterministic Architecture Agent/Mock Provider 作为可重复基线，不接真实 LLM；阻塞 P3.2。 / Recommend the existing deterministic Architecture Agent/Mock Provider as the repeatable V1 baseline without a real LLM; blocks P3.2.
- **P3-D3 Inspector command granularity / Inspector 命令粒度**：推荐 app-private、field-specific commands，禁止 generic patch；阻塞 P3.5。 / Recommend app-private, field-specific commands and prohibit generic patches; blocks P3.5.

### Exit Condition / 退出条件

Greenfield E2E 和所有验收标准通过；Workspace/IR/View State 边界评审通过；Phase report 完成。 / Greenfield E2E and all Acceptance Criteria pass; Workspace/IR/View State boundaries pass review; the Phase report is complete.

## Phase 4 — Brownfield Architecture Workspace / Brownfield 架构工作区

### Goal / 目标

把中型 repository 反演为可理解、可导航、带 evidence/confidence 与 compliance issues 的 Architecture Workspace。 / Reverse-engineer a medium repository into an understandable and navigable Architecture Workspace with evidence/confidence and compliance issues.

### Modules / 模块

- `apps/web`
- `packages/implementation-analyzer`
- `packages/implementation-validator`
- `packages/architecture-layout`
- `packages/architecture-agent`
- `packages/architecture-review`

### Dependencies / 依赖

- Phase 3 exit。
- D-005 Brownfield abstraction granularity 已在 Phase 1 前确认。 / Phase 3 exit; D-005 Brownfield abstraction granularity was confirmed before Phase 1.

### Scope / 范围

- Open Repository -> Analyzer -> reconstructed ArchitectureProject。 / Open Repository -> Analyzer -> reconstructed ArchitectureProject.
- module/infrastructure grouping、collapse/expand/focus、hidden counts。 / Module/infrastructure grouping, collapse/expand/focus, and hidden counts.
- evidence/confidence projection、Implementation Validator issue mapping/navigation。 / Evidence/confidence projection and Implementation Validator issue mapping/navigation.
- 中型和大型 Brownfield performance fixtures。 / Medium and large Brownfield performance fixtures.

### Non-goals / 非目标

- 不默认裸露所有组件，不把低置信度推断显示成事实。 / Do not expose all components by default or present low-confidence inference as fact.
- 不实现完整 AST、自动代码修复或自动 domain inference（除非 Decision 批准）。 / No full AST, automatic code remediation, or automatic domain inference unless approved.

### Deliverables / 交付物

- Medium fixture repository workflow。 / Medium fixture repository workflow.
- Progressive Disclosure UI 与 abstraction evidence。 / Progressive Disclosure UI and abstraction evidence.
- Brownfield performance/understandability baseline。 / Brownfield performance and understandability baseline.

### Acceptance Criteria / 验收标准

- 能 reverse、display、inspect、map issues、navigate。 / Can reverse, display, inspect, map issues, and navigate.
- 默认视图不显示 80 个裸节点；group/collapse/expand/focus 可用。 / Default view does not show 80 bare nodes; group/collapse/expand/focus work.
- evidence/confidence 可见且可追溯。 / Evidence/confidence is visible and traceable.
- 需要大量手动拖动时 Phase 不通过，并登记 Layout quality defect。 / The Phase fails if substantial manual dragging is required, and a Layout quality defect is recorded.

### Tests / 测试

- Unit：abstraction projection、confidence indicators、issue mapping。 / Unit: abstraction projection, confidence indicators, and issue mapping.
- Integration：Repository -> Analyzer -> IR -> Layout -> Implementation Validator -> UI。 / Integration: Repository -> Analyzer -> IR -> Layout -> Implementation Validator -> UI.
- E2E：medium Brownfield import、expand/focus、issue navigation。 / E2E: medium Brownfield import, expand/focus, and issue navigation.

### Risks / 风险

- large graph performance、错误 grouping、信息隐藏。 / Large-graph performance, incorrect grouping, and hidden information.
- Analyzer 低置信度误导用户。 / Low-confidence Analyzer output misleads users.

### Decision Gates / 决策门禁

- 如果实际 fixture 暴露新的 domain grouping 需求，更新 D-005 或新建 Decision，不在 UI 写 workaround。 / If fixtures reveal new domain-grouping needs, update D-005 or create a Decision rather than adding a UI workaround.

### Exit Condition / 退出条件

中型 fixture 的 workflow、可理解性、性能与 issue navigation 通过；无依赖手动排版的默认体验。 / The medium-fixture workflow, understandability, performance, and issue navigation pass, with a default experience that does not depend on manual arrangement.

## Phase 5 — Ghost Architecture + Review + Execution Handoff / Ghost 架构、审核与执行交接

### Goal / 目标

完成 `Architecture -> Proposal -> Ghost -> Review -> Accept/Reject -> IR update -> Incremental Layout -> Blueprint -> Guide` 的受控流程。 / Complete the controlled `Architecture -> Proposal -> Ghost -> Review -> Accept/Reject -> IR update -> Incremental Layout -> Blueprint -> Guide` flow.

### Modules / 模块

- `apps/web`
- `packages/architecture-review`
- `packages/architecture-layout`
- `packages/execution-blueprint`
- `packages/agent-adapter`
- `packages/workspace`

### Dependencies / 依赖

- Phase 4 exit。
- D-007 Ghost presentation。 / Phase 4 exit and D-007 Ghost presentation.

### Scope / 范围

- Ghost local placement、separate identity、minimal disturbance。 / Ghost local placement, separate identity, and minimal disturbance.
- Accept/reject 与 Architecture Review gate。 / Accept/reject and the Architecture Review gate.
- accepted IR diff 触发 incremental layout。 / Accepted IR diff triggers incremental layout.
- Blueprint preview 与 Generic/Codex/Claude Guide preview/copy/export。 / Blueprint preview and Generic/Codex/Claude Guide preview/copy/export.

### Non-goals / 非目标

- Ghost 不属于 Architecture IR，不绕过 Review。 / Ghost does not belong to Architecture IR and does not bypass Review.
- 不调用、启动或管理 Coding Agent。 / Do not invoke, start, or manage Coding Agents.
- 不实现 Terminal。 / Do not implement Terminal.

### Deliverables / 交付物

- Ghost projection 与 proposal controls。 / Ghost projection and proposal controls.
- Review/approval impact flow。 / Review and approval impact flow.
- Execution Handoff preview/copy/export。 / Execution Handoff preview/copy/export.

### Acceptance Criteria / 验收标准

- Ghost display/reject 不修改 accepted IR 或正式 LayoutState。 / Ghost display/reject does not modify accepted IR or accepted LayoutState.
- Accept 必须通过 Review，并在 accepted IR 更新后 incremental layout。 / Accept passes through Review and incrementally lays out only after accepted IR updates.
- Blueprint/Guide provenance 可追溯，UI 不修改 Blueprint。 / Blueprint/Guide provenance is traceable and UI does not mutate the Blueprint.
- Generic、Codex、Claude Guide 可 preview/copy/export。 / Generic, Codex, and Claude Guides can be previewed, copied, and exported.

### Tests / 测试

- Unit：Ghost adapter、proposal identity、handoff view models。 / Unit: Ghost adapter, proposal identity, and handoff view models.
- Integration：Proposal -> Review -> IR -> Incremental Layout -> Blueprint -> Adapter。 / Integration: Proposal -> Review -> IR -> Incremental Layout -> Blueprint -> Adapter.
- E2E：accept、reject、review-blocked、Guide preview/copy/export。 / E2E: accept, reject, review-blocked, and Guide preview/copy/export.

### Risks / 风险

- Ghost 扰乱 mental map 或被误认为已批准。 / Ghost disturbs the mental map or is mistaken for accepted architecture.
- Handoff 被误认为 Agent 已执行。 / Handoff is mistaken for Agent execution.

### Decision Gates / 决策门禁

- D-007：Ghost presentation，当前需在 Phase 5 前确认。
- 任何新的 Proposal lifecycle/approval semantics 需要用户 Decision。

- D-007: Ghost presentation, to be confirmed before Phase 5.
- Any new Proposal lifecycle or approval semantics requires a user Decision.

### Exit Condition / 退出条件

完整流程 E2E 与 Review/IR/Ghost 不变量通过；没有 Agent runtime；Phase report 完成。 / The full-flow E2E and Review/IR/Ghost invariants pass; no Agent runtime exists; the Phase report is complete.

## Phase 6 — Layout Quality / Performance / E2E / 布局质量、性能与 E2E

### Goal / 目标

用代表性 fixture、metrics 和跨流程 E2E 证明 UI V1 的布局质量、稳定性、性能和产品可用性，并完成进入 Terminal 前的 Architecture Review。 / Prove UI V1 layout quality, stability, performance, and usability through representative fixtures, metrics, and cross-flow E2E, then complete the Architecture Review required before Terminal.

### Modules / 模块

- `packages/architecture-layout`
- `apps/web`
- `examples/` or approved test fixtures / 或批准的测试 fixture
- all workflow packages used by Greenfield/Brownfield/Ghost/Handoff / 所有相关 workflow package
- docs and logs / 文档与日志

### Dependencies / 依赖

- Phase 5 exit。
- D-004 Pinned Node scope 与 D-006 persistence 必须确认或明确延后。 / Phase 5 exit; D-004 Pinned Node scope and D-006 persistence must be decided or explicitly deferred.

### Scope / 范围

- fixtures：Small Greenfield、Medium SaaS、PostgreSQL+Redis+Kafka、Complex dependencies、Medium/Large Brownfield、Ghost、Incremental edit。 / The required fixture set.
- metrics：overlap、crossing、semantic rank、movement cost、locality、determinism、duration、ghost locality。 / The required metric set.
- Manual Layout Intervention 作为 quality signal。 / Manual Layout Intervention as a quality signal.
- Greenfield、Brownfield、Ghost Review、Execution Handoff E2E。 / Greenfield, Brownfield, Ghost Review, and Execution Handoff E2E.
- worker/browser performance、cancellation、stale-result recovery。 / Worker/browser performance, cancellation, and stale-result recovery.

### Non-goals / 非目标

- 不用更多 manual control 掩盖 semantic layout defect。 / Do not hide semantic-layout defects with more manual controls.
- 不实现 UI polish、动画或复杂视觉效果来替代核心质量。 / Do not substitute UI polish, animation, or complex visuals for core quality.
- 不开始 Terminal。 / Do not start Terminal.

### Deliverables / 交付物

- versioned fixture catalog、metric harness、performance budgets、quality report。 / Versioned fixture catalog, metric harness, performance budgets, and quality report.
- cross-flow E2E suite 与 Architecture Review record。 / Cross-flow E2E suite and Architecture Review record.

### Acceptance Criteria / 验收标准

- fixture 无 node overlap/非法 endpoint，满足批准 crossing、movement、duration thresholds。 / Fixtures have no node overlap or invalid endpoints and meet approved crossing, movement, and duration thresholds.
- determinism 与 local movement regression 通过。 / Determinism and local-movement regressions pass.
- manual intervention 频率低于批准阈值；超标时先修 Layout。 / Manual intervention stays below the approved threshold; if exceeded, Layout is fixed first.
- Greenfield/Brownfield/Ghost/Handoff E2E 全部通过。 / Greenfield/Brownfield/Ghost/Handoff E2E all pass.
- Architecture Review 明确批准或拒绝 Phase 7 readiness。 / Architecture Review explicitly approves or rejects Phase 7 readiness.

### Tests / 测试

- Unit：metric calculators、result invariants、movement cost。 / Unit: metric calculators, result invariants, and movement cost.
- Integration：fixture compiler/browser adapter/performance harness。 / Integration: fixture compiler, browser adapter, and performance harness.
- E2E：所有四条产品主流程与 failure/cancellation path。 / E2E: all four main product flows plus failure/cancellation paths.

### Risks / 风险

- metrics 只优化数字而损害可理解性。 / Metrics optimize numbers while harming understandability.
- fixture 不代表真实项目。 / Fixtures do not represent real projects.
- performance threshold 没有用户批准。 / Performance thresholds lack user approval.

### Decision Gates / 决策门禁

- D-004/D-006 必须决定或明确延后。
- metric thresholds、supported graph size 与 Phase 7 readiness 需要用户/Architecture Review 确认。

- D-004/D-006 must be decided or explicitly deferred.
- Metric thresholds, supported graph size, and Phase 7 readiness require user or Architecture Review approval.

### Exit Condition / 退出条件

所有质量、性能、E2E 验收通过，Technical Debt 和 Known Risks 可接受，Architecture Review 明确批准 Phase 7。 / All quality, performance, and E2E acceptance passes, Technical Debt and Known Risks are acceptable, and Architecture Review explicitly approves Phase 7.

## Phase 7 — Integrated Terminal / 集成终端

### Goal / 目标

在产品宿主中提供用户管理的 shell/CLI Agent 终端基础设施，不改变 Coding CAD 的 Agent boundary。 / Provide user-managed shell and CLI-Agent terminal infrastructure in the product host without changing Coding CAD's Agent boundary.

### Modules / 模块

- `apps/web/src/lib/terminal`
- approved host/server bridge / 批准的 host/server bridge
- terminal security and lifecycle docs/tests / 终端安全与生命周期文档/测试

### Dependencies / 依赖

- Phase 0–6 全部 exit。
- Phase 6 Architecture Review 明确批准。 / All Phase 0–6 exits and explicit approval from the Phase 6 Architecture Review.

### Scope / 范围

- approved xterm.js-like view、PTY host bridge、WebSocket/host transport。 / Approved xterm.js-like view, PTY host bridge, and WebSocket/host transport.
- cwd、stdin/stdout/stderr、process lifecycle、tabs、status/exit status。 / cwd, stdin/stdout/stderr, process lifecycle, tabs, and status/exit status.
- 用户自行启动 `codex`、`claude`、`opencode` 或 shell command。 / Users launch `codex`, `claude`, `opencode`, or shell commands themselves.

### Non-goals / 非目标

- 不实现 Agent Runtime、Provider、Scheduler、Memory、Tool abstraction 或 SDK orchestration。 / No Agent Runtime, Provider, Scheduler, Memory, Tool abstraction, or SDK orchestration.
- 不自动启动或指挥 Agent。 / Do not automatically start or direct an Agent.
- 不以 Terminal 阻塞或重构核心 CAD。 / Terminal must not block or restructure the core CAD.

### Deliverables / 交付物

- secure terminal UI/bridge、session lifecycle、tabs/status。 / Secure terminal UI/bridge, session lifecycle, and tabs/status.
- threat model、resource cleanup、cross-platform support statement。 / Threat model, resource cleanup, and cross-platform support statement.

### Acceptance Criteria / 验收标准

- 用户可在 Workspace repository cwd 运行普通 shell 与 CLI Agent。 / Users can run ordinary shell and CLI Agents in the Workspace repository cwd.
- stdin/stdout/stderr、resize、tabs、exit、disconnect/reconnect 正确。 / stdin/stdout/stderr, resize, tabs, exit, and disconnect/reconnect work correctly.
- permission、session isolation、command injection、resource cleanup 通过安全评审。 / Permissions, session isolation, command injection, and resource cleanup pass security review.
- 全仓没有 Agent Runtime/Provider/Scheduler/Memory/SDK orchestration。 / The repository contains no Agent Runtime/Provider/Scheduler/Memory/SDK orchestration.

### Tests / 测试

- Unit：session state、lifecycle reducer、transport framing。 / Unit: session state, lifecycle reducer, and transport framing.
- Integration：UI -> transport -> PTY host -> process cleanup。 / Integration: UI -> transport -> PTY host -> process cleanup.
- E2E：shell command、CLI Agent manual launch、tabs、resize、disconnect、exit。 / E2E: shell command, manual CLI-Agent launch, tabs, resize, disconnect, and exit.

### Risks / 风险

- command injection、credential exposure、process leak、cross-platform PTY behavior。 / Command injection, credential exposure, process leaks, and cross-platform PTY behavior.
- Terminal scope creep into Agent ownership。 / Terminal scope creep into Agent ownership.

### Decision Gates / 决策门禁

- Terminal technology、host boundary、security model 和 supported platforms 需要独立用户/安全 Decision。 / Terminal technology, host boundary, security model, and supported platforms require separate user/security Decisions.

### Exit Condition / 退出条件

安全、生命周期、E2E 与 Agent-boundary 验收全部通过；UI V1 final report 完成。 / Security, lifecycle, E2E, and Agent-boundary acceptance all pass; the UI V1 final report is complete.

## Required Phase Completion Report / Phase 完成报告格式

每个 Phase 完成时必须报告以下内容，不得只说 “implemented successfully”：

Every completed Phase must report the following and must not merely say “implemented successfully”:

1. **Completed / 已完成**
2. **Acceptance Criteria Result / 验收结果**
3. **Tests / 测试**
4. **Architecture Invariants Check / 架构不变量检查**
5. **Known Risks / 已知风险**
6. **Technical Debt / 技术债**
7. **Decision Required / 待决策**
8. **Next Phase Readiness / 下一 Phase 就绪度**

## Current Phase Readiness / 当前 Phase 就绪度

结论：**PHASES 0–2 VERIFIED AND MERGED — PHASE 3 PLANNED, AWAITING DECISIONS**。

Conclusion: **PHASES 0–2 VERIFIED AND MERGED — PHASE 3 PLANNED, AWAITING DECISIONS**.

- Phase 0 Decision Freeze：D-001–D-006 与 D-008–D-010 已批准；D-007 保留 Phase 5 Ghost-presentation 门禁。 / Phase 0 Decision Freeze: D-001 through D-006 and D-008 through D-010 are approved; D-007 retains its Phase 5 Ghost-presentation gate.
- Phase 1 Semantic Layout Compiler：Checkpoint 1–2、FULL/INCREMENTAL、mental-map、movement-cost 与 Ghost core protocol 已通过 package tests、批准性能预算和完整 CI。 / Phase 1 Semantic Layout Compiler: Checkpoints 1–2, FULL/INCREMENTAL behavior, mental-map and movement-cost infrastructure, and the Ghost core protocol pass package tests, approved performance budgets, and the complete CI gate.
- Phase 2 Svelte CAD Infrastructure：SvelteKit/Svelte 5 app、唯一 LayoutResult->Svelte Flow adapter、基础 Canvas、Standard + Semantic Zoom、LayoutState-only drag、Auto Layout reset、solver-only worker 与 headless Add/Remove/Connect command application 已实现并合并（PR #1）。 / Phase 2 Svelte CAD Infrastructure: the SvelteKit/Svelte 5 app, sole LayoutResult->Svelte Flow adapter, foundational Canvas, Standard + Semantic Zoom, LayoutState-only drag, Auto Layout reset, solver-only worker, and headless Add/Remove/Connect command application are implemented and merged (PR #1).
- Phase 3 Greenfield Workspace：规划完成（P3.0–P3.7 窄切片）；P3-D1、P3-D2、P3-D3 为推荐方向，等待用户确认后方可进入对应实现边界。 / Phase 3 Greenfield Workspace: planning is complete (P3.0–P3.7 narrow slices); P3-D1, P3-D2, and P3-D3 are recommendations awaiting user confirmation before their implementation boundaries.
