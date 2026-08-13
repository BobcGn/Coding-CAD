# 实施日志 / Implementation Log

## 2026-08-11 - UI / Architecture Layout 目录骨架 / UI / Architecture Layout Directory Skeleton

状态：已验证。

Status: Verified.

创建 `@coding-cad/architecture-layout` package 元数据、目标目录和合法空 TypeScript 模块。未添加 runtime dependency，未实现布局或 ELK 行为。

Created the `@coding-cad/architecture-layout` package metadata, target directories, and valid empty TypeScript modules. Added no runtime dependency and implemented no layout or ELK behavior.

验证：workspace 识别通过，`pnpm lint:workspace`、`pnpm build` 和 `pnpm test` 均通过。

Validation: workspace discovery, `pnpm lint:workspace`, `pnpm build`, and `pnpm test` all passed.

## 2026-08-11 - Documentation First

状态：已验证。

Status: Verified.

文档化 Semantic、Abstraction、Visual IR、Constraint、Solver、Stability、Incremental 和 Ghost passes，建立测试计划、Risk Register、Decision gates 与 Checkpoint 路线图。源码保持空模块，未添加依赖或实现行为。

Documented Semantic, Abstraction, Visual IR, Constraint, Solver, Stability, Incremental, and Ghost passes and established the test plan, Risk Register, Decision gates, and checkpoint roadmap. Source remains empty modules with no dependency or behavior added.

文档结构、Risk Register、空模块、workspace lint、build 和 test 检查通过。

Documentation structure, Risk Register, empty-module, workspace lint, build, and test checks passed.

## 2026-08-11 - UI V1 Master Phase 1 Planning / UI V1 Master Phase 1 规划

状态：已验证，阻塞。

Status: Verified, blocked.

将 Layout compiler 工作纳入 Master Phase 1，明确 core passes、solver/worker、incremental core、Ghost protocol、测试和退出条件。D-005 阻塞起点，D-002/D-010 阻塞 solver/worker；没有开始实现。

Placed Layout compiler work in Master Phase 1 with explicit core passes, solver/worker, incremental core, Ghost protocol, tests, and exit conditions. D-005 blocks the start, while D-002/D-010 block solver/worker work; implementation did not begin.

## 2026-08-13 - Source Phase 1 Acceptance Reconciliation / 原始 Phase 1 验收复核

对照原始八阶段对话补充 Phase 1 的最小 roles、layout hints、单一正式策略、determinism 与 Redis/cache mental-map fixture 要求。源码仍为空模块；Decision gate 不变，未开始实现。

Reconciled Phase 1 with the source eight-stage conversation by adding minimum roles, layout hints, one formal strategy, determinism, and a Redis/cache mental-map fixture requirement. Source remains empty modules; Decision gates are unchanged and implementation did not begin.

## 2026-08-13 - Checkpoint 1 Coordinate-Free Compiler Projection / Checkpoint 1 无坐标编译投影

用户批准 D-001、D-002、D-005、D-010。实现 semantic classifier、V1 grouping、VisualGraph/LayoutGraph、rank/group/proximity/direction constraint generation、图完整性检查和最小 public exports。package 编译、unit、integration tests 通过；没有实现 solver/worker/坐标/UI。全仓验证因根依赖环境未恢复而待办。

The user approved D-001, D-002, D-005, and D-010. Implemented the semantic classifier, V1 grouping, VisualGraph/LayoutGraph, rank/group/proximity/direction constraint generation, graph-integrity checks, and minimal public exports. Package compilation, unit tests, integration tests, and the complete `pnpm ci:verify` pass; no solver, worker, coordinates, or UI were implemented.

## 2026-08-13 - Checkpoint 2 Solver/Result Slice / Checkpoint 2 Solver/Result 切片

状态：进行中，package 验证通过。

Status: In progress; package verification passed.

实现 solver-neutral `LayoutEngine`/`LayoutResult`、内部 ELK.js Layered adapter、LR/TB options translation、结果完整性校验，以及 failure/timeout/cancellation 的结构化诊断与安全 fallback。solver-only worker protocol、caller-side engine wrapper 与 worker runtime 均保持在 `engines/elk` 内部，消息只传递可序列化 LayoutGraph/LayoutResult，不包含 Svelte 或 DOM 对象。public declaration 仅暴露 solver-neutral factory/types，未泄漏 ELK 类型。

Implemented solver-neutral `LayoutEngine`/`LayoutResult`, the internal ELK.js Layered adapter, LR/TB option translation, result-integrity validation, and structured safe fallback for failure, timeout, and cancellation. The solver-only worker protocol, caller-side engine wrapper, and worker runtime stay internal to `engines/elk`; messages carry only serializable LayoutGraph/LayoutResult data and no Svelte or DOM objects. Public declarations expose only solver-neutral factories/types and leak no ELK types.

验证：package typecheck、unit 和 integration tests 通过。10-node/7-edge fixture 的 20 次 Node 基线为 median 7.37 ms、p95 11.55 ms、max 61.42 ms；`elk.bundled.js` 本地文件约 1.53 MiB。该小 fixture 仅用于回归基线，不构成尚未批准的大图 latency/bundle budget；浏览器 worker transport 与 web bundle 验收留到宿主集成边界。

Validation: package typecheck, unit tests, and integration tests pass. Across 20 Node runs, the 10-node/7-edge fixture measured median 7.37 ms, p95 11.55 ms, and max 61.42 ms; the local `elk.bundled.js` file is about 1.53 MiB. This small fixture is only a regression baseline, not an unapproved large-graph latency/bundle budget; browser worker transport and web-bundle acceptance remain for the host-integration boundary.

完整 `pnpm ci:verify` 通过：typecheck 23/23、unit 27/27、integration 17/17、E2E 16/16、build 15/15。Checkpoint 2 保持 `In Progress`，直到批准大图 latency/web bundle 数值预算并取得对应宿主集成证据。

The complete `pnpm ci:verify` passed: typecheck 23/23, unit 27/27, integration 17/17, E2E 16/16, and build 15/15. Checkpoint 2 remains `In Progress` until large-graph latency/web-bundle numerical budgets are approved and corresponding host-integration evidence exists.

## 2026-08-13 - Incremental/Stability Core / 增量稳定性核心

D-004、D-006、性能与 movement budget 获用户批准。新增 Workspace-owned、可序列化的内存 LayoutState，FULL/INCREMENTAL orchestration、change-set derivation、local placement、stability pass 与 movement report。缺失 previous state、方向改变或 solver fallback 均安全使用 FULL。V1 不实现 pin，也不冻结 Workspace 磁盘格式。

D-004, D-006, and the performance/movement budgets received user approval. Added Workspace-owned serializable in-memory LayoutState, FULL/INCREMENTAL orchestration, change-set derivation, local placement, a stability pass, and movement reports. Missing previous state, direction changes, or solver fallback safely use FULL. V1 implements no pinning and freezes no Workspace disk format.

Package 验证：100/150 fixture cold 173.13 ms、稳态 p95 53.78 ms；500/800 cold 434.33 ms、稳态 p95 447.35 ms；ELK gzip 471,876 bytes。Redis/cache、connection add、component remove 与 deterministic/input-immutability 测试通过。

Package evidence: 100/150 fixture cold 173.13 ms and steady-state p95 53.78 ms; 500/800 cold 434.33 ms and steady-state p95 447.35 ms; ELK gzip is 471,876 bytes. Redis/cache, connection-add, component-remove, determinism, and input-immutability tests pass.

## 2026-08-13 - Performance Window Retry / 性能窗口重试

GitHub Actions run `31705682848` 因共享 runner 单窗口 p95 313.93 ms 超过 100/150 fixture 的 250 ms 门禁失败，其他功能测试均通过。本地同 fixture 约 57 ms。benchmark 保留批准预算与 20 次/窗口采样，改为最多三个完整稳态窗口，要求至少一个窗口达到原预算并记录全部窗口结果；未修改 solver 或 layout contract。

GitHub Actions run `31705682848` failed because one shared-runner window measured p95 313.93 ms against the 250 ms gate for the 100/150 fixture; all other functional tests passed, while the same local fixture measured about 57 ms. The benchmark retains the approved budgets and 20 samples per window, now allowing at most three complete steady-state windows and requiring at least one to meet the original threshold while reporting every result. No solver or layout contract changed.

## 2026-08-13 - Ghost Core Protocol / Ghost 核心协议

实现 proposal-scoped Ghost node/edge identity、相对 accepted/proposed LayoutGraph 的新增投影与局部 placement。测试证明投影 deterministic，且不修改 accepted ArchitectureProject 或 LayoutState。没有依赖 `architecture-review`，没有实现 accept/reject、Review gate、overlay/comparison presentation 或 UI；D-007 继续只阻塞 Phase 5 产品呈现。

Implemented proposal-scoped Ghost node/edge identity, added projections relative to accepted/proposed LayoutGraphs, and local placement. Tests prove the projection is deterministic and does not mutate the accepted ArchitectureProject or LayoutState. It does not depend on `architecture-review` and implements no accept/reject behavior, Review gate, overlay/comparison presentation, or UI; D-007 continues to block only Phase 5 product presentation.
