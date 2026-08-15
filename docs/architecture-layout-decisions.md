# Architecture Layout Decisions / Architecture Layout 决策清单

本文记录 UI/Layout 产品与架构选择及其批准状态。推荐方向用于促进讨论，不构成决定；所有 `Final Decision` 必须由用户填写或明确批准。

This document records UI/Layout product and architecture choices and their approval status. Recommended directions support discussion and are not decisions; every `Final Decision` must be filled in or explicitly approved by the user.

## Canonical ID Rule and Master Task Crosswalk / 正式编号规则与 Master Task 映射

本文件中的 D-001…D-010 是仓库 canonical ID。UI V1 Master Task 使用了不同的主题顺序；不得按附件顺序重编号本文件，否则会破坏 Roadmap、TODO、日志与历史链接。

D-001 through D-010 in this file are the repository's canonical IDs. The UI V1 Master Task used a different topic order; this file must not be renumbered to match the attachment because that would break Roadmap, TODO, log, and historical links.

| Master Task Topic Label / 附件主题编号 | Canonical Decision / 正式编号 | Topic / 主题 |
| --- | --- | --- |
| D-001 | D-002 | V1 Layout Solver |
| D-002 | D-001 | Default Layout Direction |
| D-003 | D-009 | Svelte Flow Commitment |
| D-004 | D-003 | Manual Drag Semantics |
| D-005 | D-006 | Layout State Persistence |
| D-006 | D-005 | Brownfield Abstraction Granularity |
| D-007 | D-007 | Ghost Proposal Presentation |
| D-008 | D-010 | Web Worker Boundary |
| D-009 | D-004 | Pinned Node V1 Scope |
| D-010 | D-008 | Canvas Node Information Density |

## Master Phase Gate Matrix / Master Phase 门禁矩阵

| Canonical Decision | Current Blocking | Master Phase Gate / Phase 门禁 | Current Result / 当前结果 |
| --- | --- | --- | --- |
| D-005 | YES | Phase 1 start: abstraction/Visual IR contract / Phase 1 起点 | APPROVED — Option A |
| D-002 | YES | Phase 1 solver adapter | APPROVED — ELK.js behind `LayoutEngine` |
| D-010 | YES | Phase 1 worker boundary | APPROVED — solver-only worker for V1 |
| D-001 | NO | Required before Phase 1 solver options / Phase 1 solver options 前必需 | APPROVED — LR default |
| D-009 | YES | Phase 2 Canvas engine/toolchain | APPROVED — `@xyflow/svelte` behind web adapter |
| D-003 | NO | Required before Phase 2 drag behavior | APPROVED — Workspace-owned LayoutState, conditional |
| D-008 | NO | Required before Phase 2 node renderer contract | APPROVED — Standard + Semantic Zoom |
| D-006 | NO | Required before Phase 3 persistence and Phase 6 quality closure | APPROVED — Workspace abstraction |
| D-007 | NO | Required before Phase 5 Ghost presentation | REQUIRED — TBD |
| D-004 | NO | Required or explicitly deferred before Phase 6 exit | APPROVED — deferred beyond V1 |

`Blocking: NO` 不代表 Codex 可以自行决定，只表示未到该功能边界时可以继续无关工作。Phase 0 Decision Freeze 必须由用户填写 Final Decision，或明确把某项延后到指定 Phase。

`Blocking: NO` does not authorize Codex to decide; it only allows unrelated work before that feature boundary. Phase 0 Decision Freeze requires the user to fill the Final Decision or explicitly defer the item to a named Phase.

## Phase 3 Planning Gates / Phase 3 规划门禁

这些是 Phase 3 新发现的 app-integration 决策点，不重编号既有 D-001–D-010，也不改变其历史。推荐不等于批准；对应 implementation slice 必须等待用户确认。 / These app-integration decisions were discovered during Phase 3 planning. They do not renumber or alter the history of D-001 through D-010. A recommendation is not approval; the corresponding implementation slice must wait for user confirmation.

| Gate | Blocks | Recommended Direction / 推荐方向 | Status / 状态 |
| --- | --- | --- | --- |
| P3-D1 Workspace host boundary / Workspace 宿主边界 | P3.1 | Node-only Workspace behind a SvelteKit server boundary; browser uses typed app contracts / Node-only Workspace 位于 SvelteKit server boundary 后，浏览器使用 typed app contract | USER DECISION REQUIRED |
| P3-D2 Greenfield generation mode / Greenfield 生成模式 | P3.2 | Existing deterministic Architecture Agent with Mock Provider; LLM has no role in generation and is limited to later approval/review support / V1 使用现有 deterministic Architecture Agent + Mock Provider；LLM 在生成部分无职责，仅负责后续审批等支持功能 | APPROVED — 2026-08-15 (user) |
| P3-D3 Inspector command granularity / Inspector 命令粒度 | P3.5 | App-private field-specific commands; no generic patch / app-private field-specific command；禁止 generic patch | USER DECISION REQUIRED |

P3-D1 必须保持 ArchitectureProject snapshot、validation/review evidence、LayoutState 与 ephemeral UI state 的生命周期分离；不得让浏览器导入 `node:*`、`FileWorkspaceStorage` 或磁盘 schema。P3-D2 已由用户于 2026-08-15 确认：**LLM 在架构生成部分无职责，仅负责后续审批等支持功能**；requirement -> candidate ArchitectureProject 的生成完全由 deterministic Architecture Agent + Mock Provider 完成，任何生成阶段都不调用 LLM。真实 LLM 若未来接入，只允许出现在审批/评审等下游辅助环节，且由 TODO-009 的独立门禁管辖；该门禁不得授权生成侧 LLM。P3-D3 不新增 Architecture IR 语义；如果所需字段不在现有 IR 中，必须停止并另行决策。 / P3-D1 must keep ArchitectureProject snapshots, validation/review evidence, LayoutState, and ephemeral UI state on separate lifecycles and must not expose `node:*`, `FileWorkspaceStorage`, or disk schemas to the browser. P3-D2 was confirmed by the user on 2026-08-15: **LLM has no role in architecture generation and is limited to later approval/review support**; requirement -> candidate ArchitectureProject generation is fully handled by the deterministic Architecture Agent with the Mock Provider, and no generation stage invokes an LLM. If a real LLM is integrated in the future, it may appear only in downstream approval/review support under the separate TODO-009 gate, which must not authorize generation-side LLM use. P3-D3 adds no Architecture IR semantics; if a required field does not exist in the current IR, implementation must stop for a separate decision.

# D-001 Default Architecture Direction / 默认架构方向

Status:
APPROVED — 2026-08-13

Context / 背景:
Semantic Layout 需要默认主轴，同时允许未来按 workspace 或图类型覆盖。 / Semantic Layout needs a default primary axis while allowing future workspace- or graph-specific overrides.

Problem / 问题:
TB 与 LR 对阅读、屏幕利用、edge routing 和 mental map 有不同影响。 / TB and LR affect reading, screen use, edge routing, and mental-map stability differently.

Options / 选项:

Option A: TB (Top -> Bottom)

Pros / 优点:
- 符合分层架构和调用链的上下阅读习惯；Greenfield 小图容易理解。 / Fits top-down reading of layered architectures and call chains; easy for small Greenfield graphs.
- 宽屏上可以横向展开同层组件。 / Allows peers to spread horizontally on wide screens.

Cons / 缺点:
- 深层 Brownfield 图容易形成很高的画布和长垂直滚动。 / Deep Brownfield graphs can become very tall with long vertical navigation.
- 节点信息较宽时同层拥挤。 / Wide nodes can crowd each rank.

Option B: LR (Left -> Right)

Pros / 优点:
- 贴近时间线、请求流和多数系统架构图；适合宽屏 workspace。 / Matches timelines, request flows, and many system diagrams; suits wide workspaces.
- Inspector 位于侧边时仍可能保持清晰的流向。 / Can preserve a clear flow with a side Inspector.

Cons / 缺点:
- Brownfield 深链会产生很宽的画布；侧边面板会压缩可用宽度。 / Deep Brownfield chains create very wide canvases; side panels reduce available width.
- 大量上下游 fan-out 可能增加跨层连线。 / Large fan-out may increase cross-rank routing.

Recommended Direction / 推荐方向:
V1 默认 LR，但把 direction 作为 compiler option 而不是 Visual IR 固有语义。 / Default V1 to LR, while keeping direction a compiler option rather than intrinsic Visual IR semantics.

Why / 原因:
Coding CAD 的核心工作流强调依赖、请求和实施流，LR 在桌面 CAD workspace 上通常更自然；保留参数化可以避免锁死 Brownfield 场景。 / Coding CAD emphasizes dependency, request, and implementation flows, for which LR is often natural on a desktop CAD workspace; parameterization avoids locking brownfield use cases.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 2

Final Decision:
Option B: LR is the V1 default. Direction remains a compiler option and is not embedded as intrinsic Visual/Layout IR semantics. / V1 默认使用 LR；direction 保持 compiler option，不成为 Visual/Layout IR 的固有语义。

# D-002 V1 Layout Solver / V1 布局 Solver

Status:
APPROVED — 2026-08-13

Context / 背景:
LayoutEngine 必须 solver-neutral，但 V1 需要一个实际 solver 才能产生 LayoutResult。 / LayoutEngine must remain solver-neutral, but V1 needs a concrete solver to produce LayoutResult.

Problem / 问题:
需要在能力、依赖风险、bundle size、worker 支持和替换成本之间平衡。 / The choice must balance capability, dependency risk, bundle size, worker support, and replacement cost.

Options / 选项:

Option A: ELK.js Layered Layout

Pros / 优点:
- 支持 compound graph、ports、层级、方向和丰富约束，最接近语义布局需求。 / Supports compound graphs, ports, hierarchy, direction, and rich constraints, closely matching semantic-layout needs.
- 成熟算法降低自研 crossing/routing 风险。 / Mature algorithms reduce custom crossing and routing risk.

Cons / 缺点:
- bundle 与计算成本可能较高，可能需要 Web Worker。 / Bundle and computation costs may be high and may require a Web Worker.
- option surface 较大，adapter 复杂；升级行为可能变化。 / Large option surface complicates the adapter; upgrades may alter behavior.

Option B: Dagre

Pros / 优点:
- API 和集成较简单，通常 bundle 更轻。 / Simpler API and integration, usually with a smaller bundle.
- 适合基础 layered DAG。 / Suitable for basic layered DAGs.

Cons / 缺点:
- compound graph、port 和复杂 constraint 能力较弱。 / Weaker compound-graph, port, and complex-constraint support.
- 可能迫使 Coding CAD 在 adapter 外补偿 solver 缺口。 / May force Coding CAD to compensate for solver limitations outside the adapter.

Option C: Custom Solver / 自研

Pros / 优点:
- 可完全围绕 Coding CAD semantic/stability objective 设计。 / Can be designed entirely around Coding CAD semantic and stability objectives.
- 依赖和行为完全可控。 / Full control over dependencies and behavior.

Cons / 缺点:
- 算法、routing、性能和测试成本极高，延迟 UI MVP。 / Very high algorithm, routing, performance, and test cost, delaying the UI MVP.
- 容易把研究项目变成产品关键路径。 / Risks turning a research effort into the product critical path.

Recommended Direction / 推荐方向:
选择 ELK.js 作为 V1 solver，但只通过 `LayoutEngine`/ELK adapter 使用，并设置 bundle、worker 和性能验收门槛。 / Select ELK.js as the V1 solver, but only behind `LayoutEngine` and the ELK adapter, with bundle, worker, and performance gates.

Why / 原因:
ELK 的层级、port 与 compound graph 能力最符合目标；严格 adapter 边界可把未来替换成本限制在 engines 层。 / ELK’s hierarchy, port, and compound-graph capabilities best match the target; a strict adapter boundary confines future replacement cost to the engines layer.

Blocking:
YES

Decision Needed Before / 最晚决策点:
Checkpoint 2

Final Decision:
Option A: use ELK.js Layered Layout only behind the solver-neutral `LayoutEngine` and the internal ELK adapter. Solver-specific types must not cross the engine boundary. / 采用 ELK.js Layered Layout，但只能位于 solver-neutral `LayoutEngine` 与内部 ELK adapter 之后；solver-specific 类型不得越过 engine 边界。

# D-003 Manual Drag Semantics / 手动拖动语义

Status:
APPROVED — 2026-08-13

Context / 背景:
Manual layout 是 escape hatch，但拖动后的含义会影响 LayoutState、增量布局和团队协作。 / Manual layout is an escape hatch, but drag semantics affect LayoutState, incremental layout, and collaboration.

Problem / 问题:
需要决定拖动是临时视图、持久状态还是自动布局偏好。 / Decide whether dragging is temporary view state, persisted state, or an automatic layout preference.

Options / 选项:

Option A: Temporary View Only / 仅临时 view

Pros / 优点:
- 最符合 automatic-by-default，数据模型简单。 / Best aligns with automatic-by-default and keeps the model simple.

Cons / 缺点:
- 刷新或重布局后丢失用户整理，可能令人困惑。 / User arrangement disappears after refresh or re-layout, which may be confusing.

Option B: Persist Layout State / 持久化 layout state

Pros / 优点:
- 尊重用户调整并支持长期 mental map。 / Respects user adjustments and supports a long-lived mental map.

Cons / 缺点:
- 需要定义共享/个人存储、冲突和失效规则。 / Requires shared/personal storage, conflict, and invalidation rules.

Option C: Generate Layout Preference / 自动形成布局偏好

Pros / 优点:
- 后续 Auto Layout 可保留意图，而不是冻结绝对坐标。 / Later Auto Layout can preserve intent instead of absolute coordinates.

Cons / 缺点:
- 推断用户意图不透明，容易累积隐藏 constraint。 / Inferring user intent is opaque and can accumulate hidden constraints.

Recommended Direction / 推荐方向:
V1 采用 B，但只持久化 View/Layout State，不写入 Architecture IR；C 延后为可解释的高级功能。 / Use B in V1, persisting only View/Layout State and never Architecture IR; defer C to an explainable advanced feature.

Why / 原因:
完全临时会破坏 mental map，而自动生成 constraint 在 V1 认知成本过高。 / Purely temporary movement harms the mental map, while inferred constraints carry too much V1 cognitive cost.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 3

Final Decision:
Option B, with V1 guardrails: manual drag persists only node position in Workspace-owned `LayoutState`; it never mutates Architecture IR/DSL and never infers layout constraints or architecture semantics. Persisted positions are view preferences consumed by incremental layout, not permanent solver facts. Removed or incompatible node identities must be ignored safely, and Auto Layout must provide an explicit path back to generated placement. Disk format and shared-versus-personal storage remain governed by D-006 and later Workspace integration evidence. / 选择 Option B，并附带 V1 guardrail：手动拖动只把节点位置持久化到 Workspace-owned `LayoutState`；绝不修改 Architecture IR/DSL，也不推导布局 constraint 或架构语义。持久化位置是供增量布局消费的 view preference，不是永久 solver fact。已删除或不兼容的 node identity 必须安全忽略，Auto Layout 必须提供明确返回自动生成位置的路径。磁盘格式及共享/个人存储仍由 D-006 与后续 Workspace 集成证据管辖。

# D-004 Pinned Nodes in V1 / V1 是否支持 Pinned Node

Status:
APPROVED — 2026-08-13

Context / 背景:
Pin 可以稳定关键节点，但可能把 automatic layout 变成手动约束管理。 / Pinning can stabilize key nodes but may turn automatic layout into manual constraint management.

Problem / 问题:
需要决定 V1 是否暴露 pin，以及它与 drag、incremental 和 Auto Layout 的优先级。 / Decide whether V1 exposes pinning and how it interacts with drag, incremental layout, and Auto Layout.

Options / 选项:

Option A: Include in V1 / 纳入 V1

Pros / 优点:
- 对大型图和固定入口点有直接价值；增强控制感。 / Directly useful for large graphs and fixed landmarks; increases user control.

Cons / 缺点:
- 增加状态、冲突、失效与 UI 解释成本；可能掩盖算法失败。 / Adds state, conflict, invalidation, and UI-explanation costs; may hide algorithm failures.

Option B: Defer as Advanced Feature / 延后为高级功能

Pros / 优点:
- 让 V1 验证 semantic/incremental quality，保持默认自动哲学。 / Lets V1 validate semantic and incremental quality while preserving automatic-by-default.

Cons / 缺点:
- 早期用户缺少固定 landmark 的手段。 / Early users cannot lock landmarks.

Recommended Direction / 推荐方向:
选择 B；先把 drag persistence 与稳定性做好，再基于真实 failure signal 引入 pin。 / Choose B; first make drag persistence and stability reliable, then add pinning from observed failure signals.

Why / 原因:
Pin 是高认知负担的补救工具，不应在布局质量尚未验证时成为默认答案。 / Pinning is a high-cognitive-load remedy and should not become the default answer before layout quality is validated.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 6

Final Decision:
Option B: pinned nodes are deferred beyond V1. V1 must first prove automatic and incremental stability; pinning may be reconsidered only from observed failure evidence. / 选择 Option B：V1 延后 pinned node。V1 必须先验证自动布局与增量稳定性；只有真实失败证据出现后才重新评估 pin。

# D-005 Progressive Disclosure V1 Granularity / V1 渐进披露粒度

Status:
APPROVED — 2026-08-13

Context / 背景:
Brownfield Analyzer 可能产生数十到数百组件，Abstraction Pass 需要明确 V1 的最小分组层级。 / Brownfield Analyzer may produce tens or hundreds of components, so the Abstraction Pass needs a minimum V1 grouping level.

Problem / 问题:
需要决定 component、module、domain、infrastructure 中哪些进入 V1，以及是否自动 domain grouping。 / Decide which of component, module, domain, and infrastructure enter V1 and whether domain grouping is automatic.

Options / 选项:

Option A: Component + Module + Infrastructure / 组件、模块、基础设施

Pros / 优点:
- 可利用 Analyzer 现有 module evidence，范围可控；infrastructure grouping 规则较明确。 / Can use existing Analyzer module evidence with controlled scope; infrastructure grouping is relatively explicit.

Cons / 缺点:
- 超大型系统仍可能过密；缺少 domain 级业务概览。 / Very large systems may remain dense and lack a domain-level business overview.

Option B: Add Automatic Domain Grouping / 加入自动 Domain 聚合

Pros / 优点:
- 更适合大型 Brownfield 的第一屏理解。 / Better first-screen comprehension for large brownfield systems.

Cons / 缺点:
- Analyzer domain inference 可能低置信度，错误聚合会隐藏关键信息。 / Analyzer domain inference may be low confidence; wrong grouping can hide important information.

Recommended Direction / 推荐方向:
V1 选择 A；定义 domain grouping 协议但不承诺自动推断，仅在 IR 有明确 domain 时使用。 / Choose A for V1; define the domain-grouping protocol but do not promise automatic inference, using domains only when explicit in IR.

Why / 原因:
这在 Brownfield 可读性与错误抽象风险之间形成可验证的最小切片。 / This provides a testable minimum slice between brownfield readability and the risk of incorrect abstraction.

Blocking:
YES

Decision Needed Before / 最晚决策点:
Checkpoint 1

Final Decision:
Option A: V1 supports component, explicit module, and infrastructure grouping. Domain grouping has a protocol boundary but is used only when the source IR carries an explicit domain signal; automatic domain inference is excluded. / V1 支持 component、显式 module 与 infrastructure grouping；保留 domain grouping 协议边界，但仅在来源 IR 有明确 domain 信号时使用，不做自动 domain inference。

# D-006 Layout State Storage / Layout State 存储位置

Status:
APPROVED — 2026-08-13

Context / 背景:
LayoutState 是 View/Workspace State，不属于 Architecture IR；仍需决定持久化位置和共享语义。 / LayoutState is View/Workspace State, not Architecture IR; its persistence location and sharing semantics remain undecided.

Problem / 问题:
Git versioning、用户个性化、离线能力与团队共享存在冲突。 / Git versioning, personalization, offline behavior, and team sharing pull in different directions.

Options / 选项:

Option A: Workspace Internal Storage / Workspace 内部存储

Pros / 优点:
- 复用 Workspace 生命周期和版本关联；不要求暴露文件格式。 / Reuses Workspace lifecycle and version association without exposing a file format.

Cons / 缺点:
- 个人与共享状态边界仍需额外建模。 / Personal versus shared state still needs modeling.

Option B: `.coding-cad/layout.json`

Pros / 优点:
- 可见、可离线、可选择纳入 Git。 / Visible, offline-capable, and optionally versioned in Git.

Cons / 缺点:
- 坐标 diff 和多人修改容易产生冲突；格式过早冻结。 / Coordinate diffs and concurrent edits create conflicts; freezes format early.

Option C: Browser Local Persistence / 浏览器本地持久化

Pros / 优点:
- 用户隔离、实现直接、不污染仓库。 / User-isolated, direct to implement, and does not pollute repositories.

Cons / 缺点:
- 跨设备、备份和团队共享较弱；清理浏览器会丢失。 / Weak cross-device, backup, and team-sharing behavior; browser cleanup loses state.

Option D: Hybrid / 混合

Pros / 优点:
- 可区分团队共享 abstraction 与个人 viewport/position。 / Can separate team-shared abstraction from personal viewport and positions.

Cons / 缺点:
- V1 同步、优先级和迁移复杂。 / Complex V1 synchronization, precedence, and migration.

Recommended Direction / 推荐方向:
V1 采用 A，以 Workspace 抽象保存，不冻结磁盘格式；明确 personal/shared 字段后再评估 D。 / Use A in V1 behind the Workspace abstraction without freezing disk format; evaluate D after defining personal and shared fields.

Why / 原因:
Workspace 已拥有项目生命周期边界，可避免 Architecture IR 污染和过早承诺 `.coding-cad` schema。 / Workspace already owns project lifecycle boundaries, avoiding Architecture IR pollution and premature commitment to a `.coding-cad` schema.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 6

Final Decision:
Option A: LayoutState is owned through the Workspace abstraction. V1 does not freeze a disk schema; `architecture-layout` defines only the pure in-memory state/lifecycle contract, while concrete storage remains a Workspace responsibility. / 选择 Option A：LayoutState 由 Workspace abstraction 持有。V1 不冻结磁盘 schema；`architecture-layout` 只定义纯内存状态与生命周期契约，具体存储仍归 Workspace 负责。

# D-007 Ghost Proposal Layout Behavior / Ghost Proposal 布局行为

Status:
USER DECISION REQUIRED

Context / 背景:
Ghost 必须展示未批准 Proposal，同时保护正式 ArchitectureProject 和 mental map。 / Ghost must display unapproved proposals while protecting the accepted ArchitectureProject and mental map.

Problem / 问题:
需要决定第一版使用 overlay、local extension 还是 separate comparison view。 / Decide whether V1 uses an overlay, local extension, or separate comparison view.

Options / 选项:

Option A: Overlay / 覆盖层

Pros / 优点:
- 清楚看到建议与当前架构的重叠关系。 / Clearly shows overlap between the proposal and current architecture.

Cons / 缺点:
- 复杂 Proposal 容易造成视觉噪音和 edge ambiguity。 / Complex proposals can create visual noise and edge ambiguity.

Option B: Local Extension / 局部扩展

Pros / 优点:
- 在受影响组件附近放置 Ghost，适合小 proposal 和 accept 后增量布局。 / Places Ghosts near affected components, fitting small proposals and post-accept incremental layout.

Cons / 缺点:
- 大 proposal 可能挤压局部空间；需要清晰的 proposal boundary。 / Large proposals may crowd local space and require a clear proposal boundary.

Option C: Separate Comparison View / 独立对比视图

Pros / 优点:
- 适合大型 proposal，对正式图零干扰。 / Suitable for large proposals with no disturbance to the accepted graph.

Cons / 缺点:
- 上下文切换更重，不能直接感知局部影响。 / Heavier context switching and weaker perception of local impact.

Recommended Direction / 推荐方向:
V1 采用 B 处理小型 proposal，并为超出阈值的 proposal 保留 C 的演进路径；不把 A 作为默认。 / Use B for small V1 proposals and preserve a path to C above a size threshold; do not make A the default.

Why / 原因:
Local extension 最符合 local change/local movement，并能自然衔接 accept 后的 incremental layout。 / Local extension best fits local change/local movement and naturally transitions to incremental layout after acceptance.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 7

Final Decision:
TBD

# D-008 Node Visual Density / 节点视觉密度

Status:
APPROVED — 2026-08-13

Context / 背景:
Canvas 必须提供足够架构信息，又不能替代 Inspector 或使大图不可读。 / The Canvas must show enough architecture information without replacing the Inspector or making large graphs unreadable.

Problem / 问题:
需要决定名称、role、核心 contract、status、confidence 与 issue 中哪些进入节点。 / Decide which of name, role, core contract, status, confidence, and issues appear on nodes.

Options / 选项:

Option A: Compact / 紧凑

Pros / 优点:
- 支持更多节点和更清晰拓扑。 / Supports more nodes and clearer topology.

Cons / 缺点:
- 语义和问题高度依赖 Inspector。 / Semantics and issues depend heavily on the Inspector.

Option B: Standard / 标准

Pros / 优点:
- 名称、role、关键 status/contract summary 能支持主要判断。 / Name, role, and key status or contract summaries support primary judgments.

Cons / 缺点:
- 节点尺寸增大，需要密度自适应。 / Larger nodes require density adaptation.

Option C: Expanded / 展开

Pros / 优点:
- 单节点上下文丰富。 / Rich single-node context.

Cons / 缺点:
- 大图迅速失去可读性，Canvas 变成卡片墙。 / Large graphs quickly lose readability and become a wall of cards.

Recommended Direction / 推荐方向:
V1 默认 B：名称、semantic role、一个关键 status/issue indicator；contracts 只显示短摘要，详细内容进入 Inspector。缩放远景可退化为 A。 / Default V1 to B: name, semantic role, and one key status or issue indicator; contracts appear only as short summaries, with detail in Inspector. Zoomed-out views may degrade to A.

Why / 原因:
Standard 在语义可读性与图密度之间平衡，同时保持 Inspector 的价值。 / Standard balances semantic readability and graph density while preserving the Inspector’s role.

Blocking:
NO

Decision Needed Before / 最晚决策点:
Checkpoint 3

Final Decision:
Option B: V1 uses Standard nodes with Semantic Zoom. The default node shows name, semantic role, a short contract summary, and at most one primary status/issue indicator; zoomed-out rendering degrades to Compact topology cues. Detailed contracts, evidence, confidence, and issue lists belong in Inspector/Problems. Density is a renderer concern and must not alter ArchitectureProject or LayoutResult semantics. / 选择 Option B：V1 使用 Standard node + Semantic Zoom。默认节点显示名称、semantic role、简短 contract summary，以及最多一个主要 status/issue indicator；远景缩放退化为 Compact 拓扑提示。详细 contract、evidence、confidence 与 issue list 属于 Inspector/Problems。密度是 renderer concern，不得改变 ArchitectureProject 或 LayoutResult 语义。

# D-009 Svelte Flow Dependency Commitment / Svelte Flow 依赖承诺

Status:
APPROVED — 2026-08-13

Context / 背景:
`@xyflow/svelte` 是 V1 Canvas engine 候选，提供成熟的交互能力，但会形成产品 UI 的重要依赖。 / `@xyflow/svelte` is the candidate V1 Canvas engine with mature interactions, but it becomes a significant product-UI dependency.

Problem / 问题:
需要确认能力、Svelte 5 兼容性、长期维护风险和替换成本是否可接受。 / Confirm whether capability, Svelte 5 compatibility, long-term maintenance risk, and replacement cost are acceptable.

Options / 选项:

Option A: Commit for V1 / V1 正式采用

Pros / 优点:
- 提供 node/edge rendering、selection、viewport、pan、zoom 和 connection interaction，缩短 MVP。 / Provides node/edge rendering, selection, viewport, pan, zoom, and connection interaction, shortening the MVP path.

Cons / 缺点:
- 升级与 Svelte 生态兼容风险；直接使用其类型会增加替换成本。 / Upgrade and ecosystem compatibility risk; direct use of its types increases replacement cost.

Option B: Build Canvas Internally / 自建 Canvas

Pros / 优点:
- 完全控制交互、渲染和长期演进。 / Full control over interaction, rendering, and long-term evolution.

Cons / 缺点:
- 可访问性、连接、viewport 和性能成本巨大，推迟产品验证。 / High accessibility, connection, viewport, and performance cost, delaying product validation.

Recommended Direction / 推荐方向:
V1 选择 A，但仅在 `apps/web` adapter/component 层使用，建立 anti-corruption adapter 和 contract tests。 / Choose A for V1, but use it only in the `apps/web` adapter/component layer with an anti-corruption adapter and contract tests.

Why / 原因:
其成熟交互价值明显高于 V1 自建成本；单向 adapter 可控制未来替换面。 / Its mature interactions outweigh V1 build cost; a one-way adapter controls the future replacement surface.

Blocking:
YES

Decision Needed Before / 最晚决策点:
Checkpoint 3

Final Decision:
Option A: adopt `@xyflow/svelte` as the V1 Canvas renderer, while keeping the Canvas engine replaceable infrastructure. The mandatory anti-corruption path is `ArchitectureProject -> architecture-layout -> LayoutResult -> apps/web/src/lib/layout/adapters -> @xyflow/svelte`. Its imports and types MAY appear only in `apps/web` Canvas/adapters and app-layer tests; they MUST NOT appear in core packages, Architecture IR/DSL, `architecture-layout` public contracts, commands, or persisted Workspace/LayoutState formats. The adapter must be one-way and contract-tested before Checkpoint 3 can be verified. This decision authorizes Phase 2 entry planning; it does not by itself install dependencies or complete the Canvas. / 选择 Option A：V1 采用 `@xyflow/svelte` 作为 Canvas renderer，同时把 Canvas engine 保持为可替换基础设施。强制 anti-corruption 路径为 `ArchitectureProject -> architecture-layout -> LayoutResult -> apps/web/src/lib/layout/adapters -> @xyflow/svelte`。其 import 与类型只允许出现在 `apps/web` Canvas/adapters 和 app-layer tests；严禁进入核心 package、Architecture IR/DSL、`architecture-layout` public contract、command 或持久化 Workspace/LayoutState 格式。adapter 必须单向并通过 contract test，Checkpoint 3 才能标记 Verified。本决定授权 Phase 2 入口规划，但不自动安装依赖或完成 Canvas。

# D-010 Web Worker Boundary / Web Worker 边界

Status:
APPROVED — 2026-08-13

Context / 背景:
Semantic passes 与 solver 都可能消耗 CPU，大型 Brownfield 图不得阻塞 UI。 / Semantic passes and the solver may consume CPU, and large Brownfield graphs must not block the UI.

Problem / 问题:
需要决定主线程/worker 的责任划分、序列化边界、取消和错误恢复。 / Decide main-thread versus worker responsibility, serialization boundaries, cancellation, and error recovery.

Options / 选项:

Option A: Only ELK in Worker / 仅 ELK 在 worker

Pros / 优点:
- 初期边界较简单；semantic passes 可直接调试，worker 只隔离最重计算。 / Simpler initial boundary; semantic passes remain easy to debug while the heaviest computation is isolated.

Cons / 缺点:
- abstraction/constraint 在超大图上仍可能阻塞主线程；pipeline 跨边界两次。 / Abstraction and constraint generation may still block on very large graphs; the pipeline crosses boundaries twice.

Option B: Full Layout Compiler in Worker / 完整 compiler worker 化

Pros / 优点:
- UI 线程只发送 immutable input 并接收 LayoutResult；性能隔离清晰。 / The UI thread sends immutable input and receives LayoutResult, creating clear performance isolation.

Cons / 缺点:
- 需要提前稳定 serializable contracts、diagnostics、cancellation 和 versioning。 / Requires early stability for serializable contracts, diagnostics, cancellation, and versioning.

Recommended Direction / 推荐方向:
V1 先采用 A，并让 compiler contracts 全部可序列化；在 Brownfield benchmark 证明 semantic passes 超预算时迁移到 B。 / Start V1 with A while keeping all compiler contracts serializable; move to B if brownfield benchmarks show semantic passes exceeding budget.

Why / 原因:
它降低早期实现复杂度，同时保留完整 worker 化路径；决策必须配合实际 performance budget 复核。 / It reduces early implementation complexity while preserving a full-worker path; actual performance budgets must validate the choice.

Blocking:
YES

Decision Needed Before / 最晚决策点:
Checkpoint 2

Final Decision:
Option A: only the ELK solver runs in a worker in V1. Semantic, abstraction, Visual IR, and constraint passes stay on the caller side while every compiler/engine contract remains serializable. Revisit full compiler workers only with benchmark evidence. / V1 仅把 ELK solver 放入 worker；Semantic、Abstraction、Visual IR 与 Constraint pass 留在调用侧，同时所有 compiler/engine contract 必须可序列化。只有 benchmark 证据表明需要时才重新评估完整 compiler worker 化。

## Blocking Summary / 阻塞汇总

- D-005 已于 2026-08-13 批准，Checkpoint 1 的 grouping/abstraction contract 已解除 Decision 阻塞。 / D-005 was approved on 2026-08-13, removing the Decision block from the Checkpoint 1 grouping and abstraction contracts.
- D-001、D-002、D-010 已于 2026-08-13 批准并在 Checkpoint 2 验证；Phase 2 进一步证明 ELK 只进入 solver worker chunk。 / D-001, D-002, and D-010 were approved on 2026-08-13 and verified at Checkpoint 2; Phase 2 additionally proves that ELK enters only the solver worker chunk.
- Checkpoint 3 的 D-003、D-008、D-009 已实现并验证：drag 只更新 LayoutState，node 使用 Standard + Semantic Zoom，Svelte Flow 类型限制在 Web adapter/Canvas。 / D-003, D-008, and D-009 are implemented and verified at Checkpoint 3: drag updates only LayoutState, nodes use Standard + Semantic Zoom, and Svelte Flow types remain confined to the Web adapter/Canvas.
- D-004 已批准 V1 延后 pin；D-006 已批准 Workspace abstraction 持有 LayoutState。D-007 仍影响后续 Ghost presentation。 / D-004 approves deferring pinning beyond V1; D-006 assigns LayoutState ownership to the Workspace abstraction. D-007 still affects later Ghost presentation.
- Phase 3 新增 P3-D1（Workspace host boundary）、P3-D2（Greenfield generation mode）、P3-D3（Inspector command granularity）三个规划门禁；P3-D2 已由用户于 2026-08-15 确认（生成零 LLM，LLM 仅限审批等下游支持），P3-D1 与 P3-D3 仍在等待用户确认。它们不重编号 D-001–D-010，也不改变既有 Decision 历史。 / Phase 3 adds three planning gates — P3-D1 (Workspace host boundary), P3-D2 (Greenfield generation mode), and P3-D3 (Inspector command granularity); P3-D2 was confirmed by the user on 2026-08-15 (zero LLM in generation, LLM limited to downstream approval/review support), while P3-D1 and P3-D3 await user confirmation. They do not renumber D-001 through D-010 or alter existing Decision history.
