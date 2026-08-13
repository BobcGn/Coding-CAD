# `@coding-cad/architecture-layout`

`architecture-layout` 是 Architecture IR 之上的纯 TypeScript Architecture Visualization Intelligence Layer。它负责把架构语义编译为 renderer-independent 的布局投影，帮助人类理解软件架构。

`architecture-layout` is a pure TypeScript Architecture Visualization Intelligence Layer over Architecture IR. It compiles architecture semantics into a renderer-independent layout projection that helps humans understand software architecture.

当前状态：Phase 1 与 Phase 2 集成已验证。Checkpoint 1–3、Incremental/Stability core、Ghost core protocol、Web adapter 与 solver-only worker host integration 已通过验证；Ghost 产品行为尚未实现。

Current status: Phase 1 and Phase 2 integration are verified. Checkpoints 1–3, the Incremental/Stability core, Ghost core protocol, Web adapter, and solver-only worker host integration pass verification; Ghost product behavior remains unimplemented.

## 预期流水线 / Intended Pipeline

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

Semantic role 只服务布局，不是新的 Architecture IR 领域对象。Constraint 是 layout preference，不是 Architecture Validator correctness rule。ELK.js 已获准作为 Checkpoint 2 solver，但只能隐藏在 `LayoutEngine` 与内部 adapter 后，不是 package architecture。

Semantic roles serve layout only and are not new Architecture IR domain objects. Constraints are layout preferences, not Architecture Validator correctness rules. ELK.js is approved for Checkpoint 2 only behind `LayoutEngine`; it is not the package architecture.

## 边界 / Boundaries

- Architecture IR 始终是架构事实来源；本 package 只生成布局投影。
- 本 package 仅以类型和只读输入消费 `@coding-cad/architecture-ir`；不会写回 ArchitectureProject。
- 本 package 不依赖 Svelte、SvelteKit、Svelte Flow、DOM、CSS 或 `apps/web`。
- `apps/web` 是本 package 的消费者，UI adapter 与 Web Worker transport 不属于本 package。
- 当前 public API 暴露 coordinate-free compiler projection、solver-neutral `LayoutEngine` factory 与 `LayoutResult` 类型；ELK 与 worker-specific 类型保持内部。
- `ArchitectureProject` 描述系统是什么；LayoutState 描述用户怎么看。坐标、尺寸、viewport、collapsed 和 pinned 不得进入 Architecture IR/DSL。
- 未批准 Proposal 只允许形成 Ghost projection，接受后才通过 Review 进入 ArchitectureProject 和 incremental layout。

- Architecture IR remains the architecture source of truth; this package only produces layout projections.
- This package consumes `@coding-cad/architecture-ir` only as typed, read-only input and never writes back into ArchitectureProject.
- This package does not depend on Svelte, SvelteKit, Svelte Flow, the DOM, CSS, or `apps/web`.
- `apps/web` consumes this package; UI adapters and the Web Worker transport do not belong here.
- The current public API exposes the coordinate-free compiler projection, a solver-neutral `LayoutEngine` factory, and `LayoutResult` types; ELK and worker-specific types remain internal.
- `ArchitectureProject` describes what the system is; LayoutState describes how a user views it. Coordinates, dimensions, viewport, collapsed state, and pinned state must not enter Architecture IR/DSL.
- Unapproved proposals may form only a Ghost projection; after acceptance through Review they enter ArchitectureProject and incremental layout.

## 设计原则 / Design Principles

- Semantic First / 语义优先
- Automatic by Default / 默认自动
- Stable over Optimal / 稳定优于全局最优
- Local Change, Local Movement / 局部变化、局部移动
- Progressive Disclosure / 渐进披露
- Proposal-aware Layout / 感知 Proposal
- Manual Layout is an Escape Hatch / 手动布局是逃生口

## 测试边界 / Test Boundary

Package 测试必须能在无 Svelte、无 DOM、无浏览器的 Node.js 环境运行。Checkpoint 1 已覆盖 semantic preference 与 projection invariant；Checkpoint 2 新增真实 ELK、确定性、有限坐标、输入不可变、结果校验，以及 failure/timeout/cancellation fallback 与 worker 边界测试。

Package tests must run in Node.js without Svelte, a DOM, or a browser. Tests cover semantic projection, real ELK, result integrity, fallback/worker boundaries, approved performance budgets, missing-state FULL fallback, deterministic incremental results, and Redis/cache mental-map stability.

## Decision Gates / 决策门禁

D-001、D-002、D-003、D-004、D-005、D-006、D-008、D-009、D-010 已获用户批准。V1 延后 pin，LayoutState 由 Workspace abstraction 持有且不冻结磁盘格式；Phase 2 drag 与 UI adapter 已实现，Ghost presentation 仍由 D-007 门禁控制。

D-001, D-002, D-003, D-004, D-005, D-006, D-008, D-009, and D-010 are user-approved. Pinning is deferred beyond V1, and LayoutState is owned by the Workspace abstraction without freezing a disk format. Phase 2 drag behavior and the UI adapter are implemented; Ghost presentation remains gated by D-007.

## 详细文档 / Detailed Documentation

- [Architecture Layout Design](../../docs/architecture-layout.md)
- [Decision Required](../../docs/architecture-layout-decisions.md)
- [UI MVP Roadmap](../../docs/ui-mvp-roadmap.md)
- [UI Architecture](../../docs/ui-architecture.md)
