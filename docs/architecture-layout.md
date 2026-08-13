# Architecture Semantic Layout Compiler / 架构语义布局编译器

## 文档状态 / Document Status

状态：Phase 1 与 Phase 2 已验证。Checkpoint 1–3、Incremental/Stability core、Ghost core protocol、Web adapter 与 solver-only worker host integration 已通过边界和测试检查；磁盘持久化格式仍未冻结。

Status: Phases 1 and 2 are verified. Checkpoints 1–3, the Incremental/Stability core, Ghost core protocol, Web adapter, and solver-only worker host integration pass boundary and test checks; the disk-persistence format remains unfrozen.

## 目的 / Purpose

`@coding-cad/architecture-layout` 是纯 TypeScript 的 Architecture Visualization Intelligence Layer。它回答“一个软件架构应该如何被组织成易于人类理解的视觉结构？”，不回答节点颜色、弹窗或其他产品交互问题。

`@coding-cad/architecture-layout` is a pure TypeScript Architecture Visualization Intelligence Layer. It answers “how should a software architecture be organized into a visual structure humans can understand?” It does not decide node colors, dialogs, or other product interactions.

Architecture IR 始终是架构事实来源。Layout 是可重建、renderer-independent 的投影；UI 是该投影的消费者。

Architecture IR remains the architecture source of truth. Layout is a rebuildable, renderer-independent projection, and the UI consumes that projection.

```text
ArchitectureProject
  -> Semantic Analysis
  -> Architecture Abstraction
  -> Visual/Layout IR
  -> Constraint Generation
  -> LayoutEngine
  -> Stability / Incremental Pass
  -> LayoutResult
```

## 产品哲学 / Product Philosophy

1. **Semantic First / 语义优先**：先理解架构角色、边界和通信语义，再处理图拓扑。 / Understand architectural roles, boundaries, and communication semantics before graph topology.
2. **Automatic by Default / 默认自动**：正常用户不应承担日常排版工作。 / Normal users should not perform routine diagram arrangement.
3. **Stable over Optimal / 稳定优于全局最优**：小变化优先保持 mental map。 / Preserve the mental map before pursuing a globally optimal arrangement.
4. **Local Change, Local Movement / 局部变化、局部移动**：局部 IR 变化应尽量限制移动范围。 / Local IR changes should constrain movement to the affected area.
5. **Progressive Disclosure / 渐进披露**：大型 Brownfield 架构必须支持抽象与展开。 / Large brownfield architectures require abstraction and expansion.
6. **Proposal-aware Layout / 感知 Proposal**：Ghost 建议需要局部自动放置，不扰乱正式架构。 / Ghost proposals need local automatic placement without disturbing the accepted architecture.
7. **Manual Layout is an Escape Hatch / 手动布局是逃生口**：频繁手动整理是 heuristic failure signal，不是默认工作流。 / Frequent manual arrangement is a heuristic-failure signal, not the default workflow.

## 编译阶段职责 / Compiler Pass Responsibilities

### Semantic Pass / 语义阶段

Semantic Pass 从 Architecture IR 推断仅服务于视觉组织的 `Layout Semantic Role`，例如 actor、gateway、domain-service、application-service、database、storage、cache、queue 和 external-system。

The Semantic Pass infers `Layout Semantic Role` values used only for visual organization, such as actor, gateway, domain-service, application-service, database, storage, cache, queue, and external-system.

这些 role 不是新的 Architecture IR 领域对象，不得写回 ArchitectureProject，也不得取代 Registry、Validator 或 Architecture Agent 的语义所有权。分类结果必须保留来源、置信度和可回退行为；低置信度不能伪装成架构事实。

These roles are not new Architecture IR domain objects. They must not be written back to ArchitectureProject or replace semantic ownership held by the Registry, Validator, or Architecture Agent. Classification must retain provenance, confidence, and fallback behavior; low confidence must not be presented as architecture fact.

### Abstraction Pass / 抽象阶段

Abstraction Pass 控制展示粒度，重点服务 Brownfield Repository Analysis。当 Analyzer 产生大量组件时，默认视图不应裸露所有节点。

The Abstraction Pass controls visual granularity, especially for Brownfield Repository Analysis. When the Analyzer produces many components, the default view should not expose every node.

策略边界包括 domain grouping、module grouping、infrastructure grouping、collapse/expand 和 progressive disclosure。D-005 已批准 V1 使用 component、显式 module 与 infrastructure grouping；domain grouping 仅消费明确来源信号，不做自动推断。

Strategy boundaries include domain grouping, module grouping, infrastructure grouping, collapse/expand, and progressive disclosure. D-005 approves component, explicit-module, and infrastructure grouping for V1; domain grouping consumes only explicit source signals and performs no automatic inference.

### Visual IR Pass / 视觉 IR 阶段

Architecture IR 不得直接映射到 ELK。Visual/Layout IR 是 ArchitectureProject 与 solver、renderer 之间的隔离层，表达可见节点、可见连接、层级、端口、分组、边界和布局提示。

Architecture IR must not map directly to ELK. Visual/Layout IR isolates ArchitectureProject from solvers and renderers and represents visible nodes, visible connections, hierarchy, ports, groups, boundaries, and layout hints.

Visual/Layout IR 绝对不得包含 Svelte component、CSS class、Svelte Flow Node、HTML、DOM reference、viewport 或交互 store。稳定 ID 必须可追溯到 Architecture IR 或 proposal identity，但 Visual IR 本身不是第二份 Architecture Source of Truth。

Visual/Layout IR must never contain Svelte components, CSS classes, Svelte Flow Nodes, HTML, DOM references, viewports, or interaction stores. Stable IDs must be traceable to Architecture IR or proposal identity, but Visual IR is not a second Architecture Source of Truth.

### Constraint Pass / 约束阶段

Constraint Pass 是 Coding CAD 自己的布局智能：它把架构语义转为 preferred rank、proximity、grouping、direction、external boundary、ownership affinity 和 port direction 等软/硬布局约束。

The Constraint Pass is Coding CAD’s own layout intelligence. It turns architecture semantics into soft or hard layout constraints such as preferred rank, proximity, grouping, direction, external boundary, ownership affinity, and port direction.

示例策略：database 倾向位于 service 的数据方向；cache 倾向靠近 owner service；external service 倾向处于 external boundary；queue 倾向表达 async communication lane。

Example policies: databases tend toward the data-facing side of services; caches stay near owner services; external services occupy an external boundary; queues express an asynchronous communication lane.

这些是 layout preference/constraint，不是 architecture correctness rule。违反布局偏好不能产生 Architecture Validator 错误，也不能修改 IR。

These are layout preferences or constraints, not architecture-correctness rules. Violating a layout preference must not produce an Architecture Validator error or mutate the IR.

### Solver / 求解器

架构必须 solver-neutral。`LayoutEngine` 是内部抽象边界，接受 renderer-independent Layout IR 和 constraints，返回 solver-neutral result。任何 package 消费者都不得依赖 ELK 类型。

The architecture must remain solver-neutral. `LayoutEngine` is the internal abstraction boundary: it accepts renderer-independent Layout IR and constraints and returns a solver-neutral result. No package consumer may depend on ELK types.

ELK.js Layered Layout 已由 D-002 批准为 V1 solver，但只能位于 `LayoutEngine` 与内部 adapter 之后。ELK 只是 constraint solver，不是 Coding CAD layout architecture。adapter 必须隔离选项翻译、worker 消息和错误处理，使替换 solver 不影响 compiler passes 或 `apps/web`。

ELK.js Layered Layout is approved by D-002 as the V1 solver, but only behind `LayoutEngine` and an internal adapter. ELK is a constraint solver, not the Coding CAD layout architecture. Its adapter must isolate option translation, worker messages, and errors so replacing the solver does not affect compiler passes or `apps/web`.

### Stability Pass / 稳定性阶段

稳定性目标至少考虑 readability、semantic consistency、crossing count、locality、previous position 和 unnecessary movement。优化函数必须允许“保持已知位置”压过较小的全局美观收益。

Stability objectives include readability, semantic consistency, crossing count, locality, previous position, and unnecessary movement. The optimization model must allow preserving known positions to outweigh small global aesthetic gains.

上一版位置只能作为 LayoutState/hint 输入，不能成为 ArchitectureProject 字段。输出应能够解释哪些节点因结构变化必须移动，哪些节点被稳定性策略保留。

Previous positions may enter only as LayoutState or hints, never as ArchitectureProject fields. Results should explain which nodes had to move because of structural changes and which were preserved by stability policy.

V1 的已批准 movement budget 为：未受影响节点 p95 ≤ 48 px、最大 ≤ 144 px，不允许整体相对顺序翻转。D-004 延后 pin，因此 landmark 只要求保持相对位置；不能把 pin 作为掩盖自动布局失败的手段。

The approved V1 movement budget is p95 ≤ 48 px and maximum ≤ 144 px for unaffected nodes, with no overall relative-order reversal. D-004 defers pinning, so landmarks preserve relative position only; pinning cannot hide automatic-layout failures.

### Incremental Layout / 增量布局

必须支持三种概念模式，但本阶段不冻结枚举或 API：

Three conceptual modes are required, but this phase does not freeze an enum or API:

- `FULL`：新项目、repository import、用户主动 Auto Layout。 / New project, repository import, or an explicit Auto Layout action.
- `INCREMENTAL`：add/remove component、add connection、accept proposal。 / Component add/remove, connection add, or proposal acceptance.
- `LOCAL/SUBGRAPH`：未来只重排受影响区域。 / Future re-layout of only the affected region.

Incremental 输入至少需要 previous LayoutState、IR change set 或可推导差异，以及当前 abstraction state。无 previous state 时必须安全退化为 FULL。

Incremental input needs at least previous LayoutState, an IR change set or derivable diff, and current abstraction state. Without previous state it must safely fall back to FULL.

D-006 指定 LayoutState 由 Workspace abstraction 持有；本 package 只定义纯内存、可序列化的状态与生命周期契约，不冻结 `.coding-cad/layout.json` 或浏览器存储格式。

D-006 assigns LayoutState ownership to the Workspace abstraction. This package defines only a pure in-memory, serializable state and lifecycle contract and freezes neither `.coding-cad/layout.json` nor a browser-storage format.

### Ghost Layout / Ghost 布局

Architecture Proposal 在接受前不属于正式 ArchitectureProject。Ghost node/edge 仅表示建议，必须拥有 proposal identity，优先采用 local placement，且不应触发正式架构全图重排。

An Architecture Proposal is not part of the accepted ArchitectureProject before approval. Ghost nodes and edges represent suggestions only, carry proposal identity, prefer local placement, and should not trigger a full re-layout of the accepted architecture.

接受路径是 `Proposal -> Architecture Review -> ArchitectureProject -> Incremental Layout`；拒绝只移除 Ghost projection。overlay、local extension 或 comparison view 的 V1 行为由 D-007 决定。

The acceptance path is `Proposal -> Architecture Review -> ArchitectureProject -> Incremental Layout`; rejection only removes the Ghost projection. D-007 decides whether V1 uses an overlay, local extension, or comparison view.

Phase 1 只提供 `GhostLayoutProjection` 协议：proposal-scoped identity、相对 accepted graph 的新增 node/edge projection，以及不修改 accepted ArchitectureProject/LayoutState 的局部 placement。它不定义颜色、透明度、overlay/comparison view，也不执行 accept/reject。

Phase 1 provides only the `GhostLayoutProjection` protocol: proposal-scoped identity, added-node/edge projection relative to the accepted graph, and local placement that does not mutate the accepted ArchitectureProject/LayoutState. It defines no color, opacity, overlay/comparison view, or accept/reject behavior.

## Architecture IR 与 Layout State 分离 / Separating Architecture IR and Layout State

`ArchitectureProject` 描述“系统是什么”；`LayoutState` 描述“用户怎么看这个系统”。以下字段绝对禁止进入 Architecture IR 或 Architecture DSL：`x`、`y`、`width`、`height`、`viewport`、`collapsed`、`pinned`。

`ArchitectureProject` describes “what the system is”; `LayoutState` describes “how a user views the system.” The following fields must never enter Architecture IR or Architecture DSL: `x`, `y`, `width`, `height`, `viewport`, `collapsed`, and `pinned`.

Layout State 属于 Workspace/View State。D-003 只允许持久化 drag position，D-004 将 pin 延后到 V1 之后，D-006 指定 Workspace abstraction 持有状态；`.coding-cad/workspace/layout.json` 等路径仍只是讨论示例，不是已批准格式。

Layout State belongs to Workspace/View State. D-003 allows only drag-position persistence, D-004 defers pinning beyond V1, and D-006 assigns ownership to the Workspace abstraction; paths such as `.coding-cad/workspace/layout.json` remain discussion examples rather than approved formats.

## 依赖和运行边界 / Dependency and Runtime Boundaries

```text
architecture-ir
      ^
architecture-layout (pure TypeScript, renderer-neutral)
      ^
apps/web layout adapter
      ^
Svelte Flow / Architecture Canvas
```

- 可依赖 / May depend on: `@coding-cad/architecture-ir`（已用于只读输入 / used as read-only input）与 D-002 批准的 ELK adapter dependency。
- 禁止依赖 / Forbidden dependencies: Svelte、SvelteKit、`@xyflow/svelte`、DOM、CSS、`apps/web`。
- 可测试环境 / Test environment: Node.js without Svelte, DOM, or a browser.
- 并发边界 / Concurrency boundary: D-010 已批准 V1 仅 solver worker 化；compiler contracts 必须保持可序列化。

## 测试计划 / Test Plan

### Package Tests / Package 测试

未来测试以 `ArchitectureProject -> Semantic Layout Compiler -> LayoutResult` 为主要闭环，并覆盖：

Future tests use `ArchitectureProject -> Semantic Layout Compiler -> LayoutResult` as the primary loop and cover:

- database 是否处于合理 rank / whether databases receive a reasonable rank;
- cache 是否靠近 owner service / whether caches stay near owner services;
- queue/external boundary 语义 / queue and external-boundary semantics;
- incremental change 是否避免移动无关节点 / whether incremental changes avoid moving unrelated nodes;
- 相同输入和选项的 deterministic behavior / deterministic behavior for identical input and options;
- LayoutResult 完整性、唯一 node ID、合法 edge endpoint / LayoutResult integrity, unique node IDs, and valid edge endpoints;
- solver adapter 不泄漏 solver-specific 类型 / solver adapters do not leak solver-specific types;
- 无 DOM、无浏览器运行 / operation without a DOM or browser;
- 大图 performance budget 和 worker cancellation / large-graph performance budgets and worker cancellation.

### Test Layers / 测试层级

- Unit：classifier、abstraction、constraint generation、movement cost、result validation。 / Unit: classifier, abstraction, constraint generation, movement cost, and result validation.
- Integration：完整 compiler pipeline 与 solver adapter contract。 / Integration: full compiler pipeline and solver-adapter contract.
- Golden/fixture：典型 Greenfield、Brownfield、incremental 和 Ghost 场景；fixture 必须表达语义而非坐标快照。 / Golden/fixture: representative Greenfield, Brownfield, incremental, and Ghost scenarios; fixtures should assert semantics rather than brittle coordinate snapshots.
- Property/invariant：ID 唯一、endpoint 合法、有限坐标、确定性和输入不可变。 / Property/invariant: unique IDs, valid endpoints, finite coordinates, determinism, and input immutability.

## Risk Register / 风险登记

概率和影响使用 Low、Medium、High；Owner Layer 表示缓解责任，不表示改变架构事实所有权。

Probability and impact use Low, Medium, and High. Owner Layer identifies mitigation responsibility, not ownership of architecture truth.

| ID | 风险 / Risk | Probability | Impact | 缓解 / Mitigation | Owner Layer | Need User Decision |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | ELK bundle/performance | Medium | High | adapter 隔离、性能预算、lazy/worker 加载、保留替换路径 / isolate adapter, set budgets, lazy/worker loading, preserve replacement path | Layout Solver + Web Build | YES — D-002/D-010 |
| R-002 | Large Brownfield graph performance / 大型 Brownfield 图性能 | High | High | abstraction、progressive disclosure、cancellation、benchmark fixtures / abstraction, progressive disclosure, cancellation, benchmark fixtures | Layout Compiler | YES — D-005/D-010 |
| R-003 | Layout instability / 布局不稳定 | Medium | High | previous-state cost、locality metrics、incremental regression fixtures / previous-state cost, locality metrics, incremental regression fixtures | Stability Pass | NO |
| R-004 | Layout computation blocks UI / 布局计算阻塞 UI | Medium | High | worker boundary、cancellation、progress feedback、time budget / worker boundary, cancellation, progress feedback, time budget | Layout + Web Adapter | YES — D-010 |
| R-005 | Svelte Flow/Layout IR type leakage / 类型泄漏 | Medium | High | 单向 adapter、dependency lint、contract tests / one-way adapter, dependency lint, contract tests | Web Adapter | YES — D-009 |
| R-006 | Architecture IR polluted by UI state / IR 被 UI 状态污染 | Medium | Critical | schema boundary、review rule、禁止字段检查 / schema boundary, review rule, forbidden-field checks | Architecture IR + Workspace | YES — D-006 |
| R-007 | Semantic classifier produces misleading layout / 分类错误导致误导布局 | Medium | High | confidence/provenance、fallback role、UI uncertainty cues / confidence and provenance, fallback role, UI uncertainty cues | Semantic Pass + UI | NO |
| R-008 | Graph abstraction hides important information / 抽象过度隐藏信息 | Medium | High | visible counts、expand affordance、validation surfacing、scope decision / visible counts, expansion affordance, validation surfacing, scope decision | Abstraction + UI | YES — D-005 |
| R-009 | Ghost proposals disturb mental map / Ghost 扰乱 mental map | Medium | High | local placement、accepted graph anchoring、separate proposal identity / local placement, accepted-graph anchoring, separate proposal identity | Ghost Layout | YES — D-007 |
| R-010 | Manual layout becomes default workflow / 手动布局成为默认 | Medium | High | telemetry/failure signal、Auto Layout quality gate、限制高级控制 / telemetry or failure signal, Auto Layout quality gate, limit advanced controls | Product + Layout | YES — D-003/D-004 |
| R-011 | Layout persistence conflicts in Git / 持久化与 Git 冲突 | Medium | Medium | 分离共享/个人状态、稳定序列化、明确 merge policy / separate shared and personal state, stable serialization, explicit merge policy | Workspace | YES — D-006 |
| R-012 | Low-confidence Analyzer evidence displayed as fact / 低置信度 Analyzer 信息被当作事实 | High | High | confidence badges、source evidence、manual confirmation、non-destructive defaults / confidence badges, source evidence, manual confirmation, non-destructive defaults | Analyzer Projection + UI | YES — D-008 |
| R-013 | Decision topic numbering diverges across planning sources / Decision 主题编号在规划来源间不一致 | High | High | canonical ID crosswalk、禁止重编号、Phase gate matrix / canonical-ID crosswalk, no renumbering, Phase gate matrix | Documentation / Governance | YES — Phase 0 |
| R-014 | Master Phases and capability Checkpoints drift / Master Phase 与能力 Checkpoint 漂移 | Medium | High | 单一 Master Plan、显式映射、每 Phase 同步 Roadmap/logs / single Master Plan, explicit mapping, Roadmap/log synchronization per Phase | Architecture Governance | NO |
| R-015 | Phase 1 becomes an oversized compiler rewrite / Phase 1 变成过大 compiler 重写 | High | High | 按 pass 窄切片、每片 contract review、Ghost 只做 protocol、quality integration 留到 Phase 6 / narrow pass slices, contract review per slice, Ghost protocol only, quality integration in Phase 6 | Architecture Layout | NO |

## 非目标 / Non-goals

Checkpoint 2 不定义不可逆 UI API，不实现 Ghost、持久化或 UI；只实现 solver-neutral engine/result contract、内部 ELK adapter 与 solver-only worker boundary。

Checkpoint 2 does not define irreversible UI APIs or implement Ghost behavior, persistence, or UI. It implements only solver-neutral engine/result contracts, the internal ELK adapter, and the solver-only worker boundary.

## 相关文档 / Related Documents

- [UI Architecture](./ui-architecture.md)
- [Architecture Layout Decisions](./architecture-layout-decisions.md)
- [UI MVP Roadmap](./ui-mvp-roadmap.md)
