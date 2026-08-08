# 当前状态 / Current State

更新时间 / Updated at: 2026-08-08 22:34 CST (Asia/Shanghai)

## 总览 / Overview

状态：已验证。

Status: Verified.

Coding CAD 已完成五个核心能力模块：Architecture IR、Component Registry、Architecture Validator、Architecture DSL 和 CLI。旧原型目录 `packages/dsl`、`packages/validator` 及其模块日志已按当前主线目录迁移删除。

Coding CAD has completed five core capability modules: Architecture IR, Component Registry, Architecture Validator, Architecture DSL, and CLI. The old prototype directories `packages/dsl`, `packages/validator`, and their module logs have been migrated away and removed according to the current mainline directories.

## 已确认事实 / Confirmed Facts

- 项目根目录是 Git 工作树，核心模块迁移、CI/CD 和日志文档已分批提交；当前正在修复 CI 失败。
- 文档规范要求项目 Markdown 始终中英双语。
- 当前核心闭环是 `architecture-dsl` -> `architecture-ir` -> `component-registry` -> `architecture-validator` -> `cli`。
- 当前已建立推送前本地门禁 `pnpm ci:verify` 和 GitHub Actions CI workflow。
- CodeQL 不再作为自动 workflow 启用，因为远端仓库尚未启用 GitHub code scanning。
- 当前 workspace 模块包括 `apps/web`、`apps/server`、`packages/architecture-ir`、`packages/architecture-dsl`、`packages/component-registry`、`packages/architecture-validator`、`packages/cli`、`packages/agent-runtime`。
- `packages/dsl` 和 `packages/validator` 是旧原型目录，已删除。
- `packages/` 与 `logs/modules/` 中不存在同名重复模块或空目录。
- 五个核心模块已有明确的单元、集成和端到端测试入口。

- The project root is a Git worktree; the core module migration, CI/CD, and log documentation have been committed in batches, and the current work is fixing the CI failure.
- The documentation rule requires project Markdown to remain bilingual.
- The current core loop is `architecture-dsl` -> `architecture-ir` -> `component-registry` -> `architecture-validator` -> `cli`.
- The local pre-push gate `pnpm ci:verify` and GitHub Actions CI workflow are now in place.
- CodeQL is no longer enabled as an automatic workflow because GitHub code scanning is not enabled for the remote repository yet.
- Current workspace modules include `apps/web`, `apps/server`, `packages/architecture-ir`, `packages/architecture-dsl`, `packages/component-registry`, `packages/architecture-validator`, `packages/cli`, and `packages/agent-runtime`.
- `packages/dsl` and `packages/validator` were old prototype directories and have been removed.
- No duplicate module names or empty directories exist under `packages/` and `logs/modules/`.
- The five core modules have explicit unit, integration, and end-to-end test entry points.

## 当前变更 / Current Changes

- 更新五个核心模块的日志文档。
- 新增 `logs/modules/architecture-dsl`、`logs/modules/architecture-validator`、`logs/modules/cli`。
- 更新 `logs/modules/architecture-ir` 和 `logs/modules/component-registry`。
- 删除旧日志目录 `logs/modules/dsl` 和 `logs/modules/validator`。
- `apps/server` 已迁移到正式 DSL 和 Validator 包。
- Validator 新增图完整性规则，检查重复组件 ID 和悬空连接端点。
- Package 文档已按真实依赖 DAG 校正，并记录三层测试架构。
- 新增 CI/CD 文档、GitHub Actions workflow、PR 模板和本地确定性检查脚本。
- 修复 CI 干净环境缺少 Node 类型声明的问题，并移除需要仓库 code scanning 支持的自动 CodeQL workflow。

- Updated log documentation for the five core modules.
- Added `logs/modules/architecture-dsl`, `logs/modules/architecture-validator`, and `logs/modules/cli`.
- Updated `logs/modules/architecture-ir` and `logs/modules/component-registry`.
- Removed old log directories `logs/modules/dsl` and `logs/modules/validator`.
- `apps/server` has migrated to the formal DSL and Validator packages.
- The Validator now includes graph-integrity checks for duplicate component ids and dangling connection endpoints.
- Package documentation now reflects the actual dependency DAG and records the three-layer test architecture.
- Added CI/CD documentation, a GitHub Actions workflow, a PR template, and deterministic local check scripts.
- Fixed the missing Node type declarations in clean CI and removed the automatic CodeQL workflow that requires repository code scanning support.

## 回退点 / Rollback Point

回退应恢复旧 `packages/dsl`、`packages/validator` 及其日志目录，并撤销 server 依赖迁移；不得覆盖来源不明的工作区改动。

Rollback should restore old `packages/dsl`, `packages/validator`, and their log directories, then undo the server dependency migration; do not overwrite unrelated workspace changes.
