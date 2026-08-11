# Coding CAD UI MVP Roadmap / Coding CAD UI MVP 路线图

## Roadmap Rules / 路线图规则

本路线图按风险递增推进。每个 Checkpoint 必须独立验收；未达到 Acceptance Criteria 时不得把后续阶段标记为完成。技术选型和 public API 只有在对应 Decision 获得用户确认后才能冻结。

This roadmap advances by increasing risk. Each checkpoint must be accepted independently; later stages must not be marked complete while earlier Acceptance Criteria remain unmet. Technology choices and public APIs may be frozen only after the corresponding Decision receives user approval.

状态词：`Pending`、`In Progress`、`Verified`、`Blocked by Decision`。当前只有 Checkpoint 0 可以在 Documentation First 阶段完成。

Status words: `Pending`, `In Progress`, `Verified`, and `Blocked by Decision`. Only Checkpoint 0 can be completed during Documentation First.

## Master Phase Alignment / Master Phase 对齐

`docs/ui-v1-execution-plan.md` 是 Phase 0–7 的主执行顺序；本文件保留细粒度 capability Checkpoint。用户已明确要求按 Phase 0→7 执行，因此 Checkpoint 编号不再被解释为跨 Phase 的完整时间顺序。

`docs/ui-v1-execution-plan.md` is the master Phase 0–7 execution order; this file retains fine-grained capability checkpoints. The user explicitly requires Phase 0→7 execution, so Checkpoint numbers are no longer interpreted as a complete cross-phase timeline.

| Master Phase | Checkpoint Mapping / Checkpoint 映射 |
| --- | --- |
| Phase 0 Planning / Decision Freeze | Checkpoint 0 |
| Phase 1 Semantic Layout Compiler | Checkpoints 1–2; core incremental/Ghost protocols for 6–7 |
| Phase 2 Svelte CAD Infrastructure | Checkpoint 3 |
| Phase 3 Greenfield Workspace | Checkpoint 4 and the Greenfield Inspector/Workspace slice of 8 |
| Phase 4 Brownfield Workspace | Checkpoint 5 |
| Phase 5 Ghost + Review + Handoff | Checkpoints 7–9 |
| Phase 6 Quality / Performance / E2E | Checkpoint 6 quality closure plus cross-flow gates |
| Phase 7 Terminal | Checkpoint 10 |

Phase 1 只建立 Ghost protocol，Phase 5 才实现 Ghost 产品行为；Phase 1 建立 incremental core，Phase 6 才用真实 UI workflow 完成稳定性、性能和 E2E 验收。

Phase 1 establishes only the Ghost protocol, while Phase 5 implements Ghost product behavior; Phase 1 establishes the incremental core, while Phase 6 completes stability, performance, and E2E acceptance using real UI workflows.

## Checkpoint 0 — Documentation / Architecture Frozen / 文档与架构边界冻结

**Status / 状态:** In Progress — planning documents verified; Decision Freeze blocked / 进行中——规划文档已验证，Decision Freeze 被阻塞

**Goal / 目标**

让开发者和 Coding Agent 对 Architecture IR、Layout compiler、Web adapter、Svelte Flow、View State、Review/Ghost 与 Terminal 边界拥有同一理解。 / Give developers and Coding Agents a shared understanding of the boundaries among Architecture IR, the Layout compiler, the Web adapter, Svelte Flow, View State, Review/Ghost, and Terminal.

**Input / 输入**

- 当前仓库架构、package skeleton、`apps/web` skeleton。 / Current repository architecture, package skeleton, and `apps/web` skeleton.
- Documentation First 用户要求。 / Documentation First user requirements.

**Output / 输出**

- `docs/ui-architecture.md`
- `docs/architecture-layout.md`
- `docs/architecture-layout-decisions.md`
- `docs/ui-mvp-roadmap.md`
- 更新后的 package/app README 与日志。 / Updated package/app READMEs and logs.

**Acceptance Criteria / 验收标准**

- Architecture IR 明确为唯一 Architecture Source of Truth。 / Architecture IR is explicitly the sole Architecture Source of Truth.
- Layout compiler 和 UI adapter 的依赖方向、禁止类型泄漏和 View State 分离已记录。 / Dependency direction, forbidden type leakage, and View State separation are documented.
- 10 个 Decision 使用统一模板，`Final Decision` 全部为 `TBD`。 / All 10 Decisions use the common template and every `Final Decision` is `TBD`.
- Risk Register 覆盖指定风险并包含 probability、impact、mitigation、owner、user decision。 / The Risk Register covers required risks with probability, impact, mitigation, owner, and user-decision fields.
- 没有算法、Svelte、Terminal、Ghost 行为或依赖安装。 / No algorithms, Svelte, Terminal, Ghost behavior, or dependency installation occurs.

**Known Risks / 已知风险**

- 文档可能与实现演进漂移；需要在每个 Checkpoint 更新。 / Documents may drift from implementation and must be updated at each checkpoint.
- 推荐方向可能被误读为已决定；必须检查 `Final Decision`。 / Recommendations may be mistaken for decisions; `Final Decision` must be checked.

**Non-goals / 非目标**

- 不冻结 public API、solver、存储格式或 UI library。 / Do not freeze public APIs, the solver, storage formats, or UI libraries.
- 不编写生产代码。 / Do not write production code.

## Checkpoint 1 — ArchitectureProject -> Visual/Layout IR

**Status / 状态:** Blocked by Decision D-005

**Goal / 目标**

建立 renderer-independent、solver-neutral 的 Semantic、Abstraction、Visual IR 和 Constraint generation 最小闭环。 / Establish a minimal renderer-independent and solver-neutral loop for Semantic, Abstraction, Visual IR, and Constraint generation.

**Input / 输入**

- `ArchitectureProject` 与明确的 test fixtures。 / `ArchitectureProject` and explicit test fixtures.
- D-005 确认的 V1 progressive-disclosure 粒度。 / V1 progressive-disclosure granularity approved in D-005.

**Output / 输出**

- 经评审的 VisualGraph/LayoutGraph/constraint contracts。 / Reviewed VisualGraph, LayoutGraph, and constraint contracts.
- Semantic role、abstraction 与 constraint generation 的纯 TypeScript 结果。 / Pure TypeScript outputs for semantic roles, abstraction, and constraint generation.
- 不包含坐标或 renderer 类型的中间表示。 / Intermediate representations without coordinates or renderer types.

**Acceptance Criteria / 验收标准**

- 相同输入产生 deterministic Visual/Layout IR。 / Identical inputs produce deterministic Visual/Layout IR.
- ID 唯一、edge endpoint 合法、输入 ArchitectureProject 不可变。 / IDs are unique, edge endpoints are valid, and input ArchitectureProject remains immutable.
- Layout Semantic Role 不写回 Architecture IR。 / Layout Semantic Roles are not written back into Architecture IR.
- Visual IR 不含 ELK、Svelte、DOM、CSS 或 Svelte Flow 类型。 / Visual IR contains no ELK, Svelte, DOM, CSS, or Svelte Flow types.
- database/cache/queue/external 的基础偏好由语义测试验证，而不是坐标 snapshot。 / Semantic tests verify basic database/cache/queue/external preferences rather than coordinate snapshots.
- Node.js 无 DOM 环境测试通过。 / Tests pass in Node.js without a DOM.

**Known Risks / 已知风险**

- Semantic classifier 误分类。 / Semantic-classifier errors.
- Abstraction 过度隐藏信息。 / Over-abstraction hides important information.
- 过早冻结 public API。 / Prematurely freezing public APIs.

**Non-goals / 非目标**

- 不引入 solver，不计算坐标，不做 UI adapter。 / No solver, coordinate computation, or UI adapter.
- 不实现自动 domain inference，除非 D-005 明确批准。 / No automatic domain inference unless D-005 explicitly approves it.

## Checkpoint 2 — Layout IR -> Solver -> LayoutResult

**Status / 状态:** Blocked by Decisions D-002 and D-010; D-001 required / 被 D-002、D-010 阻塞，且需 D-001

**Goal / 目标**

通过 `LayoutEngine` 将 Layout IR 与 constraints 转为 solver-neutral `LayoutResult`，同时隔离 solver 和 worker。 / Convert Layout IR and constraints into a solver-neutral `LayoutResult` through `LayoutEngine`, isolating the solver and worker.

**Input / 输入**

- Checkpoint 1 的 Layout IR 与 constraints。 / Layout IR and constraints from Checkpoint 1.
- 已批准的 default direction、solver 和 worker boundary。 / Approved default direction, solver, and worker boundary.

**Output / 输出**

- `LayoutEngine` contract、solver adapter、options translation 和 LayoutResult validation。 / `LayoutEngine` contract, solver adapter, option translation, and LayoutResult validation.
- 可取消、可诊断的计算路径。 / A cancellable and diagnosable computation path.

**Acceptance Criteria / 验收标准**

- package 消费者看不到 solver-specific 类型。 / Package consumers see no solver-specific types.
- LayoutResult node ID 唯一、edge endpoint 合法、坐标和尺寸有限。 / LayoutResult node IDs are unique, edge endpoints valid, and coordinates and dimensions finite.
- 相同输入/options 具有可声明的 deterministic behavior。 / Identical inputs and options provide documented deterministic behavior.
- solver failure、timeout/cancellation 有结构化诊断和安全 fallback。 / Solver failure, timeout, and cancellation have structured diagnostics and a safe fallback.
- 基准 fixture 达到批准的 latency/bundle budget。 / Benchmark fixtures meet approved latency and bundle budgets.
- worker 不接收 Svelte/DOM 对象。 / Workers receive no Svelte or DOM objects.

**Known Risks / 已知风险**

- ELK bundle、性能和升级行为。 / ELK bundle, performance, and upgrade behavior.
- worker 序列化、取消竞态和 stale result。 / Worker serialization, cancellation races, and stale results.

**Non-goals / 非目标**

- 不接入 Svelte Flow，不实现 drag/persistence。 / No Svelte Flow integration, drag behavior, or persistence.
- 不优化所有 Brownfield 大图。 / Do not optimize every brownfield large-graph case.

## Checkpoint 3 — LayoutResult -> Svelte Flow Canvas

**Status / 状态:** Blocked by Decision D-009; D-003 and D-008 required / 被 D-009 阻塞，且需 D-003、D-008

**Goal / 目标**

建立唯一的 `LayoutResult -> Svelte Flow Node/Edge` adapter，并显示基础 Architecture Canvas。 / Establish the sole `LayoutResult -> Svelte Flow Node/Edge` adapter and render a basic Architecture Canvas.

**Input / 输入**

- Checkpoint 2 的 LayoutResult。 / LayoutResult from Checkpoint 2.
- 已批准的 Svelte Flow commitment、node density 和 drag semantics。 / Approved Svelte Flow commitment, node density, and drag semantics.

**Output / 输出**

- SvelteKit/Svelte 5 app foundation、layout adapter、基础 node/edge renderer 与 Canvas shell。 / SvelteKit/Svelte 5 app foundation, layout adapter, basic node/edge renderers, and Canvas shell.

**Acceptance Criteria / 验收标准**

- adapter 是 Svelte Flow 类型的唯一入口，package 无反向依赖。 / The adapter is the only entry point for Svelte Flow types and packages have no reverse dependency.
- Canvas 支持 rendering、selection、viewport、pan 和 zoom。 / Canvas supports rendering, selection, viewport, pan, and zoom.
- UI state 与 ArchitectureProject/LayoutResult 分离。 / UI state is separate from ArchitectureProject and LayoutResult.
- Vitest adapter tests 与 Svelte component tests 通过。 / Vitest adapter tests and Svelte component tests pass.
- 基础 keyboard/focus/accessibility 行为可用。 / Basic keyboard, focus, and accessibility behavior works.

**Known Risks / 已知风险**

- Svelte Flow 类型泄漏与版本兼容。 / Svelte Flow type leakage and version compatibility.
- Node density 导致性能或可读性问题。 / Node density causes performance or readability problems.

**Non-goals / 非目标**

- 不实现完整 Greenfield/Brownfield workflow、Review、Ghost 或 Terminal。 / No complete Greenfield/Brownfield workflow, Review, Ghost, or Terminal.
- Canvas 不成为自由绘图工具。 / The Canvas does not become a free-form drawing tool.

## Checkpoint 4 — Greenfield Project Can Display / Greenfield 项目可显示

**Status / 状态:** Pending

**Goal / 目标**

让新建项目从 requirement/Architecture Agent 产生的 ArchitectureProject 经验证和布局后显示在 Canvas。 / Display a new project on the Canvas after requirement/Architecture Agent generation, validation, and layout.

**Input / 输入**

- 用户 requirement 或已有 Greenfield ArchitectureProject。 / A user requirement or existing Greenfield ArchitectureProject.
- Architecture Agent、Validator、Layout compiler 和 Canvas。 / Architecture Agent, Validator, Layout compiler, and Canvas.

**Output / 输出**

- 可导航的 Greenfield Architecture Workspace。 / A navigable Greenfield Architecture Workspace.
- validation/problems 状态与基础 loading/error flow。 / Validation/problems state and basic loading/error flow.

**Acceptance Criteria / 验收标准**

- `Requirement -> candidate ArchitectureProject -> Validator -> LayoutResult -> Canvas` 可重复执行。 / The end-to-end path is repeatable.
- UI 不直接修改 ArchitectureProject；commands 有明确边界。 / UI does not mutate ArchitectureProject directly; commands have an explicit boundary.
- validation issue 可定位到 Canvas/Inspector 对象。 / Validation issues navigate to Canvas/Inspector objects.
- Playwright Greenfield happy path 与错误路径通过。 / Playwright Greenfield happy and error paths pass.

**Known Risks / 已知风险**

- Architecture Agent 输出不完整导致 layout error。 / Incomplete Architecture Agent output causes layout errors.
- UI loading/error state掩盖真实 provenance。 / UI loading or error state hides provenance.

**Non-goals / 非目标**

- 不包含 repository import、Ghost、完整 Review 或 execution handoff。 / No repository import, Ghost, complete Review, or execution handoff.

## Checkpoint 5 — Brownfield Repository Can Display / Brownfield 仓库可显示

**Status / 状态:** Pending

**Goal / 目标**

把 Implementation Analyzer 重建的 ArchitectureProject 以可理解的抽象层级显示，并保留 evidence/confidence。 / Display an ArchitectureProject reconstructed by Implementation Analyzer at an understandable abstraction level while preserving evidence and confidence.

**Input / 输入**

- Repository snapshot、Analyzer output、confidence/provenance。 / Repository snapshot, Analyzer output, and confidence/provenance.
- Checkpoint 1 的 abstraction strategy。 / Abstraction strategy from Checkpoint 1.

**Output / 输出**

- Brownfield Architecture Canvas、group/collapse/expand 边界和证据展示。 / Brownfield Architecture Canvas, grouping/collapse/expand boundaries, and evidence display.

**Acceptance Criteria / 验收标准**

- 大型 fixture 不默认裸露全部节点，且隐藏数量与展开路径清晰。 / Large fixtures do not expose every node by default, and hidden counts and expansion paths are clear.
- 低置信度推断有视觉标识和 evidence link，不伪装为事实。 / Low-confidence inference has visual cues and evidence links and is not presented as fact.
- Implementation Validator issue 可以导航。 / Implementation Validator issues are navigable.
- Brownfield Playwright flow 与性能预算通过。 / Brownfield Playwright flow and performance budgets pass.

**Known Risks / 已知风险**

- 大图性能、错误 grouping、低置信度信息误导。 / Large-graph performance, incorrect grouping, and misleading low-confidence information.

**Non-goals / 非目标**

- 不承诺完整 AST 理解或自动 domain inference。 / No promise of full AST understanding or automatic domain inference.
- 不自动修复 repository。 / Do not automatically modify the repository.

## Checkpoint 6 — Incremental Layout Stability / 增量布局稳定性

**Status / 状态:** Pending; Decisions D-004 and D-006 required / 待处理，需 D-004、D-006

**Goal / 目标**

在 add/remove component、add connection 和接受后的结构变化中保持 mental map，实现 local change/local movement。 / Preserve the mental map through component add/remove, connection add, and accepted structural changes, delivering local change/local movement.

**Input / 输入**

- Previous LayoutState、ArchitectureProject diff、当前 abstraction state。 / Previous LayoutState, ArchitectureProject diff, and current abstraction state.
- 已批准的 pin 与 persistence scope。 / Approved pin and persistence scope.

**Output / 输出**

- FULL/INCREMENTAL 行为、movement diagnostics、LayoutState lifecycle。 / FULL and INCREMENTAL behavior, movement diagnostics, and LayoutState lifecycle.

**Acceptance Criteria / 验收标准**

- 无 previous state 时安全退化 FULL。 / Safely falls back to FULL without previous state.
- fixture 中无关节点移动低于批准阈值；关键 landmark 稳定。 / Unrelated-node movement stays below an approved threshold and landmarks remain stable.
- 相同 prior state + diff 产生 deterministic result。 / Identical prior state and diff produce deterministic results.
- LayoutState 不进入 Architecture IR/DSL；存储符合 D-006。 / LayoutState never enters Architecture IR/DSL and storage follows D-006.
- incremental regression tests 和 movement metrics 通过。 / Incremental regression tests and movement metrics pass.

**Known Risks / 已知风险**

- 稳定目标与 crossing/readability 冲突。 / Stability conflicts with crossing and readability.
- stale LayoutState 或跨版本 state 失效。 / Stale or cross-version LayoutState invalidation.

**Non-goals / 非目标**

- 不承诺所有变化只移动一个节点。 / Do not promise every change moves only one node.
- LOCAL/SUBGRAPH 可保留为后续优化。 / LOCAL/SUBGRAPH may remain a later optimization.

## Checkpoint 7 — Ghost Architecture

**Status / 状态:** Pending; blocked by Decision D-007 / 待处理，被 D-007 阻塞

**Goal / 目标**

显示未批准 Proposal 的 Ghost projection，并在 accept/reject 时保持 Architecture Review 与 mental map 不变量。 / Display Ghost projections for unapproved proposals while preserving Architecture Review and mental-map invariants through accept/reject.

**Input / 输入**

- Accepted ArchitectureProject、Proposal、Review state、current LayoutState。 / Accepted ArchitectureProject, Proposal, Review state, and current LayoutState.
- 已批准的 Ghost presentation behavior。 / Approved Ghost presentation behavior.

**Output / 输出**

- Ghost node/edge projection、local placement、accept/reject UI path。 / Ghost node/edge projection, local placement, and accept/reject UI path.

**Acceptance Criteria / 验收标准**

- Ghost identity 与正式 IR identity 清晰区分。 / Ghost identity is clearly distinct from accepted IR identity.
- 显示/拒绝 Ghost 不修改 ArchitectureProject，也不触发正式图全局重排。 / Showing or rejecting a Ghost does not modify ArchitectureProject or trigger full accepted-graph re-layout.
- Accept 必须经过 Review gate，然后以 accepted IR diff 触发 incremental layout。 / Accept passes through the Review gate and then triggers incremental layout from the accepted IR diff.
- Playwright accept/reject/review-blocked paths 通过。 / Playwright accept, reject, and review-blocked paths pass.

**Known Risks / 已知风险**

- Ghost edge ambiguity、局部拥挤、用户误认已批准。 / Ghost edge ambiguity, local crowding, and users mistaking proposals for accepted architecture.

**Non-goals / 非目标**

- 不让 Proposal 绕过 Architecture Review。 / Proposals cannot bypass Architecture Review.
- 不在 Ghost projection 中修改正式 LayoutState。 / Ghost projections do not modify accepted LayoutState.

## Checkpoint 8 — Inspector + Review

**Status / 状态:** Pending

**Goal / 目标**

提供语义优先的 Inspector 和完整 Architecture Review UI，使用户能理解、评论和批准架构变化。 / Provide a semantics-first Inspector and complete Architecture Review UI so users can understand, comment on, and approve architecture changes.

**Input / 输入**

- ArchitectureProject、selected identity、contracts/constraints/decisions、validation、proposal/review state。 / ArchitectureProject, selected identity, contracts/constraints/decisions, validation, and proposal/review state.

**Output / 输出**

- Inspector、Problems integration、review comments、approval gate、impact analysis UI。 / Inspector, Problems integration, review comments, approval gate, and impact-analysis UI.

**Acceptance Criteria / 验收标准**

- Inspector 聚焦 semantics，而非 width/height/color/border。 / Inspector focuses on semantics rather than width, height, color, or borders.
- 编辑通过 commands/proposal，不能直接 mutation。 / Editing occurs through commands/proposals, never direct mutation.
- Validator error 能阻止批准并显示 rationale。 / Validator errors block approval and display rationale.
- Review comments、approval threshold 和 impact analysis 与 package 行为一致。 / Review comments, approval threshold, and impact analysis match package behavior.
- Component/E2E tests 覆盖 Inspector 与 Review flow。 / Component and E2E tests cover Inspector and Review flows.

**Known Risks / 已知风险**

- UI 重复业务规则、复杂表单造成状态分叉。 / UI duplicates business rules or complex forms fork state.

**Non-goals / 非目标**

- 不在 Inspector 中构建图形设计工具。 / Do not build a graphic-design tool in the Inspector.
- 不执行 code remediation。 / Do not execute code remediation.

## Checkpoint 9 — Execution Handoff / 执行交接

**Status / 状态:** Pending

**Goal / 目标**

让批准后的 ArchitectureProject 进入现有 Execution Blueprint 与 Agent Adapter，并在 UI 中形成可审计 handoff。 / Route an approved ArchitectureProject through existing Execution Blueprint and Agent Adapter and provide an auditable UI handoff.

**Input / 输入**

- Approved ArchitectureProject、validation/review evidence。 / Approved ArchitectureProject and validation/review evidence.
- Execution Blueprint 与 Agent Adapter public APIs。 / Execution Blueprint and Agent Adapter public APIs.

**Output / 输出**

- Blueprint view、constraint provenance、Prompt/Guide export/copy path、handoff record。 / Blueprint view, constraint provenance, Prompt/Guide export or copy path, and handoff record.

**Acceptance Criteria / 验收标准**

- 未批准 architecture 不得生成正式 handoff。 / Unapproved architecture cannot generate an official handoff.
- UI 不修改 Blueprint 或注入新的架构意图。 / UI does not mutate the Blueprint or inject new architectural intent.
- Constraint provenance 可追溯到 IR、Decision、Validator 或 Registry limitation。 / Constraint provenance is traceable to IR, Decisions, Validators, or Registry limitations.
- Playwright handoff flow 通过。 / The Playwright handoff flow passes.

**Known Risks / 已知风险**

- 用户把 Prompt/Guide 误认为已执行；版本与 snapshot 错配。 / Users may mistake Prompt/Guide for execution; versions may mismatch snapshots.

**Non-goals / 非目标**

- 不启动、管理或监控 Coding Agent。 / Do not start, manage, or monitor Coding Agents.
- 不生成业务代码或 PR。 / Do not generate application code or PRs.

## Checkpoint 10 — Terminal Infrastructure / 终端基础设施

**Status / 状态:** Pending; intentionally last / 待处理，刻意置于最后

**Goal / 目标**

在产品宿主中提供用户管理的 shell/CLI Agent 终端，不重新引入 Agent Runtime。 / Provide a user-managed shell and CLI-Agent terminal in the product host without reintroducing an Agent Runtime.

**Input / 输入**

- Workspace repository cwd、host security model、PTY bridge contract。 / Workspace repository cwd, host security model, and PTY bridge contract.
- 经单独安全与产品评审批准的 Terminal scope。 / Terminal scope approved through a separate security and product review.

**Output / 输出**

- `xterm.js -> WebSocket/host bridge -> PTY -> user shell` 基础设施。 / `xterm.js -> WebSocket/host bridge -> PTY -> user shell` infrastructure.
- tabs、cwd、process lifecycle、stdin/stdout/stderr、status/exit status。 / Tabs, cwd, process lifecycle, stdin/stdout/stderr, and status/exit status.

**Acceptance Criteria / 验收标准**

- 用户可自行运行 `codex`、`claude`、`opencode` 或普通 shell 命令。 / Users can run `codex`, `claude`, `opencode`, or ordinary shell commands themselves.
- cwd 绑定 Workspace repository，生命周期与退出状态正确。 / cwd binds to the Workspace repository and lifecycle and exit status are correct.
- 输入输出、resize、multiple tabs、disconnect/reconnect 行为有 E2E 验证。 / Input/output, resize, multiple tabs, and disconnect/reconnect behavior have E2E validation.
- 权限、命令注入、session isolation 和 resource cleanup 通过安全评审。 / Permissions, command injection, session isolation, and resource cleanup pass security review.
- 仓库中没有 Agent Provider、Runtime、Scheduler、Memory 或 SDK orchestration。 / The repository contains no Agent Provider, Runtime, Scheduler, Memory, or SDK orchestration.

**Known Risks / 已知风险**

- PTY/host security、process leak、跨平台行为、WebSocket lifecycle。 / PTY/host security, process leaks, cross-platform behavior, and WebSocket lifecycle.

**Non-goals / 非目标**

- 不拥有 Coding Agent，不解释 Agent protocol，不自动调度任务。 / Do not own Coding Agents, interpret Agent protocols, or schedule tasks automatically.
- 不属于早期 Architecture Canvas MVP。 / Not part of the early Architecture Canvas MVP.

## Checkpoint Dependency Summary / Checkpoint 依赖汇总

```text
CP0 Documentation
  -> CP1 Visual/Layout IR [D-005]
  -> CP2 Solver/LayoutResult [D-001, D-002, D-010]
  -> CP3 Svelte Flow Canvas [D-003, D-008, D-009]
  -> CP4 Greenfield Display
  -> CP5 Brownfield Display
  -> CP6 Incremental Stability [D-004, D-006]
  -> CP7 Ghost Architecture [D-007]
  -> CP8 Inspector + Review
  -> CP9 Execution Handoff
  -> CP10 Terminal Infrastructure
```

Checkpoint 顺序表达推荐的风险控制路径，不授权自动进入下一阶段。每个阶段开始前必须恢复仓库事实、复核对应 Decision，并更新日志和回退点。

The sequence expresses the recommended risk-control path and does not authorize automatic progression. Before each stage, restore repository facts, review the corresponding Decisions, and update logs and rollback points.

执行时以 Master Phase 0→7 为主顺序；上图继续表达 capability prerequisites，而不是允许跳过 Master Phase。

Execution follows Master Phases 0→7; the diagram above continues to express capability prerequisites and does not authorize skipping a Master Phase.
