# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-08 22:17 CST (Asia/Shanghai)

## 日志标准 / Log Standards

1. 根日志是跨模块事实源，模块日志是局部事实源。
2. `Todo/current.md` 是仍有效 TODO 的单一正文来源，其他日志只引用 TODO ID。
3. `Links/current.md` 必须记录可复现证据，包括文件、命令和结果。
4. `implementation-log.md` 只追加历史切片，不重写旧记录。
5. 所有 Markdown 日志必须中英双语。

1. Root logs are the cross-module source of truth; module logs are local sources of truth.
2. `Todo/current.md` is the single body source for active TODOs; other logs should reference TODO IDs.
3. `Links/current.md` must record reproducible evidence, including files, commands, and results.
4. `implementation-log.md` is append-only for historical slices.
5. All Markdown logs must be bilingual in Chinese and English.

## Coding CAD 标准 / Coding CAD Standards

1. Architecture IR 优先于 UI 和代码生成。
2. Architecture DSL 描述软件架构意图，不描述代码模板或部署端口。
3. Component Registry 必须同时记录能力和限制。
4. Architecture Validator 只分析，不自动修改架构。
5. CLI 只是入口层，不复制核心业务逻辑。

1. Architecture IR takes priority over UI and code generation.
2. Architecture DSL describes software architecture intent, not code templates or deployment ports.
3. Component Registry must record both capabilities and limitations.
4. Architecture Validator analyzes only and does not automatically modify architecture.
5. CLI is only an entry layer and must not duplicate core business logic.

## 验证门槛 / Validation Gates

- `pnpm ci:verify`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm security:audit`
- Markdown 结构检查 / Markdown structure inspection

- `pnpm ci:verify`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm security:audit`
- Markdown structure inspection
