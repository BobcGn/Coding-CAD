# 当前状态 / Current State

更新时间 / Updated at: 2026-08-09 22:22 CST (Asia/Shanghai)

## 总览 / Overview

状态：已验证。

Status: Verified.

Coding CAD 已完成十二个核心能力模块：Architecture IR、Component Registry、Architecture Validator、Architecture DSL、CLI、Architecture Agent、Execution Blueprint、Agent Adapter、Workspace、Architecture Review、Implementation Analyzer 和 Implementation Validator。未实现且职责重复的 `packages/agent-runtime` 已从核心边界移除。

Coding CAD has completed twelve core capability modules: Architecture IR, Component Registry, Architecture Validator, Architecture DSL, CLI, Architecture Agent, Execution Blueprint, Agent Adapter, Workspace, Architecture Review, Implementation Analyzer, and Implementation Validator. The unimplemented and responsibility-duplicating `packages/agent-runtime` boundary has been removed.

## 已确认事实 / Confirmed Facts

- 项目根目录是 Git 工作树，核心模块迁移、CI/CD、CI 修复、Architecture Agent、Execution Blueprint 和 Agent Adapter 已按功能分批完成。
- 文档规范要求项目 Markdown 始终中英双语。
- 当前核心闭环是 `requirement` -> `architecture-agent` -> `architecture-ir` -> `architecture-validator` -> refinement -> `execution-blueprint` -> `agent-adapter` -> external Coding Agent，以及 `architecture-dsl` <-> `architecture-ir` -> `cli`。
- 当前已建立推送前本地门禁 `pnpm ci:verify` 和 GitHub Actions CI workflow。
- CodeQL 不再作为自动 workflow 启用，因为远端仓库尚未启用 GitHub code scanning。
- 当前 workspace 包括两个 app shell 和十二个已实现的核心 package；不包含 Coding Agent Runtime。
- Coding CAD 通过 Blueprint / Guide 向下传递意图，通过 Repository Analyzer / Validator 向上观察实现；外部 Coding Agent 是用户管理的进程。
- `packages/dsl` 和 `packages/validator` 是旧原型目录，已删除。
- `packages/` 与 `logs/modules/` 中不存在同名重复模块或空目录。
- 十二个核心模块已有明确的测试入口；`agent-adapter` 使用单元测试覆盖三种指导文档渲染与 Blueprint 不变性。

- The project root is a Git worktree; the core module migration, CI/CD, CI fix, Architecture Agent, Execution Blueprint, and Agent Adapter have been completed in functional batches.
- The documentation rule requires project Markdown to remain bilingual.
- The current core loop is `requirement` -> `architecture-agent` -> `architecture-ir` -> `architecture-validator` -> refinement -> `execution-blueprint` -> `agent-adapter` -> external Coding Agent, plus `architecture-dsl` <-> `architecture-ir` -> `cli`.
- The local pre-push gate `pnpm ci:verify` and GitHub Actions CI workflow are now in place.
- CodeQL is no longer enabled as an automatic workflow because GitHub code scanning is not enabled for the remote repository yet.
- The current workspace contains two app shells and twelve implemented core packages; it does not contain a Coding Agent Runtime.
- Coding CAD communicates intent downward through Blueprints and Guides, and observes implementation upward through repository analysis and validation; external Coding Agents are user-managed processes.
- `packages/dsl` and `packages/validator` were old prototype directories and have been removed.
- No duplicate module names or empty directories exist under `packages/` and `logs/modules/`.
- The twelve core modules have explicit test entry points; `agent-adapter` uses unit tests for three instruction renderers and Blueprint immutability.

## 当前变更 / Current Changes

- 更新核心模块的日志文档，并补齐第六模块 Architecture Agent 的模块日志。
- 新增 `logs/modules/architecture-dsl`、`logs/modules/architecture-validator`、`logs/modules/cli`。
- 更新 `logs/modules/architecture-ir` 和 `logs/modules/component-registry`。
- 删除旧日志目录 `logs/modules/dsl` 和 `logs/modules/validator`。
- `apps/server` 已迁移到正式 DSL 和 Validator 包。
- Validator 新增图完整性规则，检查重复组件 ID 和悬空连接端点。
- Package 文档已按真实依赖 DAG 校正，并记录三层测试架构。
- 新增 CI/CD 文档、GitHub Actions workflow、PR 模板和本地确定性检查脚本。
- 修复 CI 干净环境缺少 Node 类型声明的问题，并移除需要仓库 code scanning 支持的自动 CodeQL workflow。
- 新增 `packages/architecture-agent`，实现 Architecture Reasoning Layer 第一阶段。
- CLI 新增 `design` 命令，可从自然语言需求生成架构报告、JSON 或 Architecture DSL YAML。
- 新增 `packages/execution-blueprint`，实现 Architecture IR 到外部 Coding Agent 实施蓝图的协议层。
- 新增 `packages/agent-adapter`，将 Execution Blueprint 渲染为外部 Coding Agent 指导文档。

- Updated core module log documentation and added module logs for the sixth module, Architecture Agent.
- Added `logs/modules/architecture-dsl`, `logs/modules/architecture-validator`, and `logs/modules/cli`.
- Updated `logs/modules/architecture-ir` and `logs/modules/component-registry`.
- Removed old log directories `logs/modules/dsl` and `logs/modules/validator`.
- `apps/server` has migrated to the formal DSL and Validator packages.
- The Validator now includes graph-integrity checks for duplicate component ids and dangling connection endpoints.
- Package documentation now reflects the actual dependency DAG and records the three-layer test architecture.
- Added CI/CD documentation, a GitHub Actions workflow, a PR template, and deterministic local check scripts.
- Fixed the missing Node type declarations in clean CI and removed the automatic CodeQL workflow that requires repository code scanning support.
- Added `packages/architecture-agent`, implementing the first phase of the Architecture Reasoning Layer.
- Added the CLI `design` command, which generates an architecture report, JSON, or Architecture DSL YAML from natural-language requirements.
- Added `packages/execution-blueprint`, implementing the protocol layer from Architecture IR to external Coding Agent implementation blueprints.
- Added `packages/agent-adapter`, rendering Execution Blueprints into external Coding Agent instructions.

## 回退点 / Rollback Point

回退应恢复旧 `packages/dsl`、`packages/validator` 及其日志目录，并撤销 server 依赖迁移；不得覆盖来源不明的工作区改动。

Rollback should restore old `packages/dsl`, `packages/validator`, and their log directories, then undo the server dependency migration; do not overwrite unrelated workspace changes.
