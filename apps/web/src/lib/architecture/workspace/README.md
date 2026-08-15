# Workspace Bridge / Workspace 桥接层

## 状态 / Status

P3.1 Workspace Host Bridge（2026-08-15）。本目录实现浏览器侧的 Workspace 生命周期 typed contract 与 bridge client；Node-only Workspace 操作由 SvelteKit server routes 承载。

P3.1 Workspace Host Bridge (2026-08-15). This directory implements the browser-side Workspace lifecycle typed contract and bridge client; Node-only Workspace operations are hosted by SvelteKit server routes.

## 文件 / Files

- `contract.ts`：browser-safe DTO（`CreateProjectRequest/Response`、`OpenProjectRequest/Response`、`SaveProjectRequest/Response`），纯 JSON 可序列化，无 `node:*`。
- `workspace-bridge.ts`：浏览器侧 typed client，封装 fetch 到 `/api/workspace`，返回 DTO。
- `contract.test.ts`：DTO 校验单元测试。
- `workspace-bridge.integration.test.ts`：create/open/save 往返一致性集成测试（Node 环境，直接使用 `@coding-cad/workspace`）。

- `contract.ts`: browser-safe DTOs (Create/Open/Save request/response), pure JSON-serializable, no `node:*`.
- `workspace-bridge.ts`: browser-side typed client wrapping fetch to `/api/workspace`, returning DTOs.
- `contract.test.ts`: DTO validation unit tests.
- `workspace-bridge.integration.test.ts`: create/open/save round-trip integration tests (Node env, using `@coding-cad/workspace` directly).

## Server Routes / Server Routes

- `POST /api/workspace`：创建项目（`Workspace.create`）。
- `GET /api/workspace/[id]`：打开项目（`Workspace.open` + `loadLatestArchitecture`）。
- `PUT /api/workspace/[id]`：保存 accepted snapshot（`Workspace.saveSnapshot`）。

Node-only `@coding-cad/workspace` 只在这些 route 中运行；浏览器 bundle 不含 `node:*`、`FileWorkspaceStorage` 或磁盘 schema（已由构建产物检查验证）。工作目录由 `CODING_CAD_WORKSPACE_ROOT` 环境变量控制（默认 `.coding-cad`）。

Node-only `@coding-cad/workspace` runs only in these routes; the browser bundle contains no `node:*`, `FileWorkspaceStorage`, or disk schemas (verified via build artifacts). The working directory is controlled by the `CODING_CAD_WORKSPACE_ROOT` environment variable (default `.coding-cad`).
