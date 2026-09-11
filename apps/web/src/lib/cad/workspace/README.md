# Workspace UI Contract / 工作区 UI 契约

## 状态 / Status

P3.0 Contract and Host Freeze（2026-08-15）冻结本文件的契约；P3.1（2026-08-15）已按此契约实现 Workspace host bridge（见 `apps/web/src/lib/architecture/workspace/` 与 `apps/web/src/routes/api/workspace/`）。本目录仍是产品 Workspace UI 的未来边界，不包含 UI 实现。

P3.0 Contract and Host Freeze (2026-08-15) freezes the contracts in this file; P3.1 (2026-08-15) implemented the Workspace host bridge against them (see `apps/web/src/lib/architecture/workspace/` and `apps/web/src/routes/api/workspace/`). This directory remains the future product Workspace UI boundary and contains no UI implementation.

## 宿主边界 / Host Boundary

浏览器不得直接导入 Node-only 能力：`node:*`、`FileWorkspaceStorage`、Workspace 磁盘格式或任何 `@coding-cad/workspace` 的 Node 内部类型。所有项目生命周期操作经由 SvelteKit server boundary 上的 typed app contract。

The browser must not import Node-only capabilities: `node:*`, `FileWorkspaceStorage`, the Workspace disk format, or any Node-internal type of `@coding-cad/workspace`. All project-lifecycle operations go through a typed app contract on the SvelteKit server boundary.

```text
Svelte UI
  -> typed app contract (browser-safe DTO)
  -> SvelteKit server boundary
  -> @coding-cad/workspace (Node-only)
  -> workspace-internal storage
```

## 生命周期所有权 / Lifecycle Ownership

| Lifecycle / 生命周期 | Owner / 所有者 | Serialization / 序列化 | UI 责任 / UI Responsibility |
| --- | --- | --- | --- |
| Accepted ArchitectureProject / 已接受架构 | Workspace snapshot（`@coding-cad/workspace`） | server-side，经 DTO 传递 | 只读投影与 command 输入；不经浏览器写入磁盘 |
| Candidate ArchitectureProject / 候选架构 | 会话内 candidate 状态（app 层） | 仅内存，不持久化 | command/Agent 产出后展示，经最小 Review gate |
| Validation / Review evidence / 校验与评审证据 | Workspace validation/decision history | server-side | 展示 provenance；UI 不重写规则 |
| LayoutState / View State / 布局与视图状态 | Workspace-owned LayoutState（D-006） | 独立于 IR snapshot 保存 | 拖拽位置、viewport 等只入 View State |
| Ephemeral UI state / 瞬时 UI 状态 | 浏览器会话 | 不持久化 | selection、panel、loading/error/cancellation |

约束 / Constraints：

- Accepted IR snapshot 与 Layout/View State 必须分别保存、分别读取，绝不合并写入。
- Candidate 在 accept 前不得触碰 accepted IR。
- 浏览器不得导入 `node:*`、`FileWorkspaceStorage` 或磁盘 schema。
- 具体磁盘格式（`.coding-cad/...` 路径、字段布局）在 P3-D1 用户确认前不冻结。

- Accepted IR snapshots and Layout/View State must be saved and read separately and never merged.
- Candidates must not touch the accepted IR before accept.
- The browser must not import `node:*`, `FileWorkspaceStorage`, or disk schemas.
- The concrete disk format (paths such as `.coding-cad/...`, field layout) is not frozen before P3-D1 user confirmation.

## Browser-Safe DTO 边界 / Browser-Safe DTO Boundary

- 浏览器与 server 之间只交换可 JSON 序列化、无 `node:*` 依赖的 typed DTO。
- DTO 是 `@coding-cad/workspace` public API 的投影，不是第二套业务模型；server route 不做业务决策，只做类型边界与存储转发。
- Command 应用（Add/Remove/Connect 等）继续使用 Phase 2 的 renderer-neutral command application，不新建第二套 mutation path。

- The browser and server exchange only typed DTOs that are JSON-serializable and free of `node:*` dependencies.
- DTOs are projections of the `@coding-cad/workspace` public API, not a second business model; server routes make no business decisions and only enforce the type boundary and storage forwarding.
- Command application (Add/Remove/Connect) continues to use the Phase 2 renderer-neutral command application; no second mutation path is created.

## LLM 边界 / LLM Boundary

P3-D2（2026-08-15 用户确认）：**LLM 在架构生成部分无职责，仅负责后续审批等支持功能**。生成由 deterministic Architecture Agent 完成，浏览器与 server 的 Workspace 流程均不包含生成侧 LLM 调用点。

P3-D2 (user-confirmed 2026-08-15): **LLM has no role in architecture generation and is limited to later approval/review support**. Generation is handled by the deterministic Architecture Agent, and neither the browser nor the server Workspace flow contains generation-side LLM call sites.
