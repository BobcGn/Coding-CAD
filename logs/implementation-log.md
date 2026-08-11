# 实施日志 / Implementation Log

本日志记录 Coding CAD 的实施切片，让路线图具备可审计轨迹。

This log records Coding CAD implementation slices so the roadmap has an auditable trail.

## 2026-08-08 - 日志体系落地 / Log System Initialization

状态：已验证。

Status: Verified.

变更：

Changes:

- 参考 `skill-central/logs` 建立根日志结构。
- 为 workspace 模块建立同构模块日志结构。
- 新增双语说明文档 `docs/logging-system.md`。

- Established the root log structure based on `skill-central/logs`.
- Established equivalent module log structures for workspace modules.
- Added bilingual documentation at `docs/logging-system.md`.

验证：

Validation:

- `find logs -maxdepth 4 -type f | sort`：通过。
- 模块文件计数检查：7 个模块各 7 个文件。
- `pnpm build`：通过。
- `pnpm typecheck`：通过。
- `pnpm test`：通过。

- `find logs -maxdepth 4 -type f | sort`: passed.
- Module file-count inspection: 7 modules each have 7 files.
- `pnpm build`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.

## 2026-08-08 - 五个核心模块文档同步 / Five Core Modules Documentation Sync

状态：已验证。

Status: Verified.

变更：

Changes:

- 更新 Architecture IR、Component Registry、Architecture Validator、Architecture DSL 和 CLI 的模块日志。
- 删除旧 `packages/dsl`、`packages/validator` 及对应旧模块日志目录。
- 将 `apps/server` 迁移到正式 DSL 和 Validator 包。
- 更新根日志和 package 架构文档。

- Updated module logs for Architecture IR, Component Registry, Architecture Validator, Architecture DSL, and CLI.
- Removed old `packages/dsl`, `packages/validator`, and their old module log directories.
- Migrated `apps/server` to the formal DSL and Validator packages.
- Updated root logs and package architecture documentation.

验证：

Validation:

- `pnpm install --no-frozen-lockfile`：通过。
- `pnpm build`：通过，8/8 tasks successful。
- `pnpm typecheck`：通过，12/12 tasks successful。
- `pnpm test`：通过，16/16 tasks successful。

- `pnpm install --no-frozen-lockfile`: passed.
- `pnpm build`: passed, 8/8 tasks successful.
- `pnpm typecheck`: passed, 12/12 tasks successful.
- `pnpm test`: passed, 16/16 tasks successful.

## 2026-08-08 - 核心架构同步与测试分层 / Core Architecture Sync and Test Layering

状态：已验证。

Status: Verified.

变更：

Changes:

- 核对 `packages/`、`logs/`、workspace 配置和五个核心模块的公开边界。
- 将依赖说明校正为真实 package DAG。
- 新增 Validator 图完整性规则，诊断重复组件 ID 和悬空连接端点。
- 建立可独立运行的单元、集成和端到端测试入口。
- 修正日志中的 Git 工作树事实，并记录技术绑定分层债务 `TODO-008`。
- 确认不存在旧名称重复模块或空目录。

- Audited `packages/`, `logs/`, workspace configuration, and public boundaries of the five core modules.
- Corrected dependency documentation to the actual package DAG.
- Added a Validator graph-integrity rule for duplicate component ids and dangling connection endpoints.
- Established independently executable unit, integration, and end-to-end test entry points.
- Corrected the Git worktree fact in logs and recorded technology-binding separation debt as `TODO-008`.
- Confirmed there are no legacy-name duplicate modules or empty directories.

验证：

Validation:

- `pnpm test:unit`：12/12 tasks successful，0 cached。
- `pnpm test:integration`：9/9 tasks successful，0 cached。
- `pnpm test:e2e`：9/9 tasks successful，0 cached。
- `pnpm exec turbo build --force`：8/8 tasks successful，0 cached。
- `pnpm exec turbo typecheck --force`：12/12 tasks successful，0 cached。
- `pnpm exec turbo test --force`：16/16 tasks successful，0 cached。
- `git diff --check`：通过。

- `pnpm test:unit`: 12/12 tasks successful, 0 cached.
- `pnpm test:integration`: 9/9 tasks successful, 0 cached.
- `pnpm test:e2e`: 9/9 tasks successful, 0 cached.
- `pnpm exec turbo build --force`: 8/8 tasks successful, 0 cached.
- `pnpm exec turbo typecheck --force`: 12/12 tasks successful, 0 cached.
- `pnpm exec turbo test --force`: 16/16 tasks successful, 0 cached.
- `git diff --check`: passed.

## 2026-08-08 - CI/CD 门禁落地 / CI/CD Gate Implementation

状态：已验证。

Status: Verified.

变更：

Changes:

- 参考 PR Skills 仓库 `BobcGn/pr-skills` 的五类检查职责，建立本地和 GitHub Actions 门禁。
- 新增 `pnpm ci:verify`，串联 workspace 结构检查、类型检查、变更记录检查、敏感信息扫描、commit message 检查、单元测试、集成测试、端到端测试和构建。
- 新增 GitHub Actions CI workflow，覆盖 PR/push 的质量、测试、构建和依赖审计。
- CodeQL 初始作为 workflow 接入，后续因仓库未启用 GitHub code scanning 而从自动门禁移除。
- 新增 CI/CD 文档和 PR 模板，确保推送前检查可追溯。

- Established local and GitHub Actions gates based on the five check responsibilities from the `BobcGn/pr-skills` repository.
- Added `pnpm ci:verify`, chaining workspace structure checks, type checks, change-record checks, secret scanning, commit-message checks, unit tests, integration tests, end-to-end tests, and build verification.
- Added a GitHub Actions CI workflow for PR/push quality, tests, build, and dependency audit.
- CodeQL was initially added as a workflow, then removed from the automatic gate because GitHub code scanning is not enabled for the repository.
- Added CI/CD documentation and a PR template so pre-push checks remain traceable.

验证：

Validation:

- `pnpm ci:verify`：通过。
- `ruby -e 'require "yaml"; ...' .github/workflows/ci.yml`：通过。
- `git diff --check`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。

- `pnpm ci:verify`: passed.

- `ruby -e 'require "yaml"; ...' .github/workflows/ci.yml`: passed.

## 2026-08-08 - CI 失败修复 / CI Failure Fix

状态：已验证。

Status: Verified.

原因：

Cause:

- GitHub Actions run `31261956693` 在 `architecture-ir` typecheck 失败，因为干净 Linux CI 环境没有隐式 Node 类型声明，测试和 CLI 代码使用了 `node:*` API。
- GitHub Actions run `31261956683` 的 CodeQL 扫描完成，但上传 SARIF 失败，因为仓库没有启用 GitHub code scanning。

- GitHub Actions run `31261956693` failed in `architecture-ir` typecheck because the clean Linux CI environment had no implicit Node type declarations while tests and CLI code use `node:*` APIs.
- GitHub Actions run `31261956683` completed CodeQL scanning but failed SARIF upload because GitHub code scanning is not enabled for the repository.

修复：

Fix:

- 将 `@types/node` 加入根 devDependency，这是 TypeScript 编译 Node API 所需的开发类型声明。
- 移除 `pnpm/action-setup` 和 `dependency-review-action`，改用 Corepack 启用 pnpm，并用 `pnpm security:audit` 做依赖安全门禁。
- 移除自动 CodeQL workflow；等仓库启用 code scanning 后再接入。

- Added `@types/node` as a root devDependency because it is required to compile Node API usage in TypeScript.
- Removed `pnpm/action-setup` and `dependency-review-action`; Corepack now enables pnpm, and `pnpm security:audit` provides the dependency-security gate.
- Removed the automatic CodeQL workflow; CodeQL can be added after repository code scanning is enabled.

验证：

Validation:

- `CI=true pnpm install --frozen-lockfile`：通过。
- `pnpm ci:verify`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。
- `ruby -e 'require "yaml"; ...' .github/workflows/ci.yml`：通过。
- `git diff --check`：通过。

- `CI=true pnpm install --frozen-lockfile`: passed.
- `pnpm ci:verify`: passed.
- `pnpm security:audit`: passed, No known vulnerabilities found.
- `ruby -e 'require "yaml"; ...' .github/workflows/ci.yml`: passed.
- `git diff --check`: passed.

## 2026-08-08 - Architecture Agent 第一阶段 / Architecture Agent Phase One

状态：已验证。

Status: Verified.

变更：

Changes:

- 新增第六个核心模块 `packages/architecture-agent`。
- 实现 `ArchitectureAgent.design(requirement)` 主入口，返回 `ArchitectureProject`。
- 新增 Mock LLM Provider、Agent Context、Requirement Analyzer、Architecture Planner、Decision Maker 和 Validator Feedback Refinement Loop。
- 保持模型无关，不绑定 OpenAI、Claude、Gemini 或本地模型。
- 保持职责边界：Agent 只设计架构，不写业务代码、不修改文件、不部署系统。

- Added the sixth core module, `packages/architecture-agent`.
- Implemented the `ArchitectureAgent.design(requirement)` entry point returning `ArchitectureProject`.
- Added Mock LLM Provider, Agent Context, Requirement Analyzer, Architecture Planner, Decision Maker, and Validator Feedback Refinement Loop.
- Kept the module model-agnostic without binding OpenAI, Claude, Gemini, or local models.
- Preserved the responsibility boundary: the Agent designs architecture only, and does not write business code, mutate files, or deploy systems.

验证：

Validation:

- `pnpm --filter @coding-cad/architecture-agent test`：通过。

- `pnpm --filter @coding-cad/architecture-agent test`: passed.

## 2026-08-09 - CLI Design 入口 / CLI Design Entry Point

状态：已验证。

Status: Verified.

变更：

Changes:

- 新增 `coding-cad design <requirement>`，从自然语言需求生成 Architecture IR。
- 默认输出人类可读架构设计报告，并支持 `--json` 和 `--yaml`。
- CLI 只作为入口组合 Architecture Agent、Validator 和 DSL，不直接绕过 Architecture IR。
- 新增真实子进程端到端测试，覆盖人类报告、JSON 和 YAML 输出路径。

- Added `coding-cad design <requirement>` to generate Architecture IR from natural-language requirements.
- The default output is a human-readable architecture design report, with `--json` and `--yaml` support.
- The CLI only composes Architecture Agent, Validator, and DSL, and does not bypass Architecture IR.
- Added real subprocess end-to-end tests for the human report, JSON, and YAML output paths.

验证：

Validation:

- `pnpm --filter @coding-cad/cli typecheck`：通过。
- `pnpm --filter @coding-cad/cli test:e2e`：通过。

- `pnpm --filter @coding-cad/cli typecheck`: passed.
- `pnpm --filter @coding-cad/cli test:e2e`: passed.

## 2026-08-09 - Execution Blueprint 第一阶段 / Execution Blueprint Phase One

状态：已验证。

Status: Verified.

变更：

Changes:

- 新增下一核心模块 `packages/execution-blueprint`。
- 定义 `ExecutionBlueprint`、`ImplementationTask`、`ImplementationConstraint` 和 `AgentGuide`。
- 实现 `ExecutionBlueprintGenerator`，将 Architecture IR 转换为外部 Coding Agent 可执行的工程实施蓝图。
- 约束来源覆盖 Architecture Constraints、Architecture Decisions、Validator Results 和 Component Registry limitations。
- 保持 Coding CAD 与 Coding Agent 的边界：不生成代码、不修改文件、不绑定具体 Agent。

- Added the next core module, `packages/execution-blueprint`.
- Defined `ExecutionBlueprint`, `ImplementationTask`, `ImplementationConstraint`, and `AgentGuide`.
- Implemented `ExecutionBlueprintGenerator`, turning Architecture IR into implementation blueprints executable by external Coding Agents.
- Constraint sources cover Architecture Constraints, Architecture Decisions, Validator Results, and Component Registry limitations.
- Preserved the boundary between Coding CAD and Coding Agents: no code generation, no file mutation, and no concrete Agent binding.

验证：

Validation:

- `pnpm --filter @coding-cad/execution-blueprint test`：通过。
- `pnpm ci:verify`：通过，workspace 当前为 10 个模块。

- `pnpm --filter @coding-cad/execution-blueprint test`: passed.
- `pnpm ci:verify`: passed, with the workspace currently at 10 modules.

## 2026-08-09 - Agent Adapter 第一阶段 / Agent Adapter Phase One

状态：已验证。

Status: Pending verification.

变更：

- 新增第八个核心模块 `packages/agent-adapter`。
- 定义纯渲染型 `AgentAdapter` 与 `AgentInstruction` 契约。
- 实现 Generic Markdown、Codex Prompt 和 Claude Code `CLAUDE.md` 风格输出。
- 保持边界：不修改 Execution Blueprint、不生成代码、不调用外部 Agent SDK。

Changes:

- Added the eighth core module, `packages/agent-adapter`.
- Defined pure-rendering `AgentAdapter` and `AgentInstruction` contracts.
- Implemented Generic Markdown, Codex Prompt, and Claude Code `CLAUDE.md`-style output.
- Preserved boundaries: no Execution Blueprint mutation, code generation, or external Agent SDK calls.

验证：

- `pnpm --filter @coding-cad/agent-adapter test`：通过。
- `pnpm lint:workspace`：通过，workspace 当前为 11 个模块。
- `CI=true pnpm install --frozen-lockfile`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。
- `pnpm ci:verify`：通过。

Validation:

- `pnpm --filter @coding-cad/agent-adapter test`: passed.
- `pnpm lint:workspace`: passed, with 11 workspace modules.
- `CI=true pnpm install --frozen-lockfile`: passed.
- `pnpm security:audit`: passed, No known vulnerabilities found.
- `pnpm ci:verify`: passed.

## 2026-08-09 - Workspace 第一阶段 / Workspace Phase One

状态：已验证。

Status: Verified.

变更：

- 新增第九个核心模块 `packages/workspace`。
- 以 Architecture IR 为事实来源，实现快照、生命周期版本、架构差异、ADR、验证历史与 Blueprint 历史。
- 使用本地 JSON 文件存储并导出结构化 Workspace 报告。
- 保持现有执行链路不变；未增加 Agent Adapter、Agent 执行、UI、数据库或云服务。

Changes:

- Added the ninth core module, `packages/workspace`.
- Implemented snapshots, lifecycle versions, architecture diffs, ADRs, validation history, and Blueprint history around Architecture IR as the source of truth.
- Added local JSON file storage and structured Workspace report export.
- Preserved the existing execution pipeline without another Agent Adapter, Agent execution, UI, database, or cloud service.

验证：

- `pnpm --filter @coding-cad/workspace test`：通过。
- `pnpm ci:verify`：通过，workspace 共 12 个模块。

Validation:

- `pnpm --filter @coding-cad/workspace test`: passed.
- `pnpm ci:verify`: passed, with 12 workspace modules.

## 2026-08-09 - Architecture Review 第一阶段 / Architecture Review Phase One

状态：已验证。

Status: Verified.

变更：

- 新增第十个核心模块 `packages/architecture-review`。
- 实现 Proposal、ReviewComment、Approval、ImpactAnalysis 和受控审核状态机。
- Validator 错误会阻止批准，多人审批必须达到显式阈值。
- 复用 Workspace diff，并增强其组件修改检测。
- 只向现有 Execution Blueprint 流程释放批准后的 Architecture IR，不修改 IR、不创建第二条执行链路。

Changes:

- Added the tenth core module, `packages/architecture-review`.
- Implemented Proposal, ReviewComment, Approval, ImpactAnalysis, and a controlled review state machine.
- Validator errors block approval, and multi-reviewer approval must reach an explicit threshold.
- Reused Workspace diff and extended it to detect modified components.
- Released approved Architecture IR to the existing Execution Blueprint pipeline without mutating IR or creating a second pipeline.

验证：

- `pnpm --filter @coding-cad/architecture-review test`：通过。

Validation:

- `pnpm --filter @coding-cad/architecture-review test`: passed.
- `pnpm ci:verify`: passed, with 13 workspace modules.

## 2026-08-09 - Implementation Analyzer 第一阶段 / Implementation Analyzer Phase One

状态：已验证。

Status: Verified.

变更：

- 新增第十一个核心模块 `packages/implementation-analyzer`，建立 Brownfield Repository → Architecture IR 路径。
- 实现 RepositorySnapshot、Scanner、语言/框架/依赖检测、Module Analyzer、Dependency Graph 和 Architecture Mapper。
- 第一阶段优先支持 Node.js/TypeScript、NestJS、Express、Prisma、TypeORM、PostgreSQL 和 Redis 识别。
- 中间 inspection 只保存 evidence 和 confidence；ArchitectureProject 仍是唯一架构输出。
- 未实现附件中的第二阶段 `implementation-validator`，保持理解与合规检查职责分离。

Changes:

- Added the eleventh core module, `packages/implementation-analyzer`, establishing the brownfield Repository-to-Architecture-IR path.
- Implemented RepositorySnapshot, Scanner, language/framework/dependency detection, Module Analyzer, Dependency Graph, and Architecture Mapper.
- Phase one prioritizes Node.js/TypeScript, NestJS, Express, Prisma, TypeORM, PostgreSQL, and Redis detection.
- Intermediate inspection only stores evidence and confidence; ArchitectureProject remains the sole architecture output.
- Did not implement the attachment's phase-two `implementation-validator`, preserving the understanding/compliance boundary.

验证：

- `pnpm --filter @coding-cad/implementation-analyzer test`：通过。

Validation:

- `pnpm --filter @coding-cad/implementation-analyzer test`: passed.
- `pnpm ci:verify`: passed, with 14 workspace modules.

## 2026-08-09 - Implementation Validator 第一阶段 / Implementation Validator Phase One

状态：已验证。

Status: Verified.

变更：

- 新增第十二个核心模块 `packages/implementation-validator`，闭合 Architecture Compliance feedback path。
- 定义 ImplementationModel 为 Analyzer inspection 与实际 ArchitectureProject 的组合，不创建第二套架构词汇。
- 实现组件存在、技术偏离、组件限制、依赖偏离和 Contract 合规五条插件式规则。
- 所有 ComplianceIssue 均包含架构期望、实现证据和修复建议。
- 保持边界：不扫描源码、不执行 AST、不修改代码、不生成 PR、不调用 Agent。

Changes:

- Added the twelfth core module, `packages/implementation-validator`, closing the Architecture Compliance feedback path.
- Defined ImplementationModel as Analyzer inspection plus actual ArchitectureProject without creating parallel architecture vocabulary.
- Implemented five plugin rules for component existence, technology deviation, component limitations, dependency drift, and contract compliance.
- Every ComplianceIssue contains architecture expectation, implementation evidence, and recommendation.
- Preserved boundaries: no source scanning, AST, code mutation, PR generation, or Agent invocation.

验证：

- `pnpm --filter @coding-cad/implementation-validator test`：通过。

Validation:

- `pnpm --filter @coding-cad/implementation-validator test`: passed.
- `pnpm ci:verify`: passed, with 15 workspace modules.

## 2026-08-09 - Agent Runtime 架构纠偏 / Agent Runtime Architecture Correction

状态：已验证。

Status: Verified.

变更：

- 审计全仓后确认 `packages/agent-runtime` 只有未使用的类型占位，没有业务 import 或真实执行链依赖。
- 删除 `packages/agent-runtime`、同名模块日志、workspace 校验映射和锁文件 importer。
- 将 Coding CAD 边界明确为 Architecture Brain、Architecture Commander 与 Architecture Compliance Layer，不拥有或编排 Coding Agent。
- 保留 `agent-adapter` 作为 Execution Blueprint 到 Guide / Prompt 的纯渲染边界。
- 在 `apps/web` 路线图中记录 Integrated Terminal Infrastructure；终端只管理 OS Process / PTY，Coding Agent 由用户自行运行。
- 未实现终端、Agent Provider、Agent SDK 调用、Agent Runtime 或新的执行流水线。

Changes:

- Audited the repository and confirmed that `packages/agent-runtime` was only an unused type placeholder with no business imports or real execution-path dependency.
- Removed `packages/agent-runtime`, its module logs, workspace-check mapping, and lockfile importer.
- Clarified Coding CAD as the Architecture Brain, Architecture Commander, and Architecture Compliance Layer; it does not own or orchestrate Coding Agents.
- Preserved `agent-adapter` as the pure Execution Blueprint-to-Guide/Prompt rendering boundary.
- Recorded Integrated Terminal Infrastructure in the `apps/web` roadmap; the terminal manages only OS Processes / PTYs, while users run their own Coding Agents.
- Did not implement a terminal, Agent Provider, Agent SDK invocation, Agent Runtime, or another execution pipeline.

验证：

- `CI=true pnpm install --frozen-lockfile`：通过，锁文件与 15 个 workspace projects（根项目、两个 app、十二个核心 package）一致。
- `pnpm ci:verify`：通过，workspace architecture check 确认 14 个实际模块，typecheck、单元、集成、端到端与 build 全部通过。
- 残留检查确认 package、模块日志、lockfile importer、workspace 映射和 `@coding-cad/agent-runtime` import 均不存在。

Validation:

- `CI=true pnpm install --frozen-lockfile`: passed; the lockfile matches 15 workspace projects (the root, two apps, and twelve core packages).
- `pnpm ci:verify`: passed; the workspace architecture check confirmed 14 actual modules, with typecheck, unit, integration, end-to-end, and build all passing.
- Residual checks confirmed that the package, module logs, lockfile importer, workspace mapping, and `@coding-cad/agent-runtime` imports are absent.

## 2026-08-11 - UI / Architecture Layout 目录骨架 / UI / Architecture Layout Directory Skeleton

状态：已验证。

Status: Verified.

变更：

- 新增唯一 package `packages/architecture-layout`，包含目标目录、合法空 TypeScript 模块、package 元数据与双语边界 README。
- 在 `apps/web/src/lib` 下建立 Architecture、CAD、Layout UI adapter 与 Terminal TODO 目录边界。
- 由现有 `packages/*` workspace 通配符识别新 package；仅同步 lockfile importer 和显式 workspace 门禁映射。
- 未添加 runtime dependency，未实现布局、ELK、Svelte UI、Terminal 或 Ghost Architecture 行为。

Changes:

- Added the sole new package, `packages/architecture-layout`, with target directories, valid empty TypeScript modules, package metadata, and a bilingual boundary README.
- Established Architecture, CAD, Layout UI adapter, and Terminal TODO boundaries under `apps/web/src/lib`.
- Used the existing `packages/*` workspace glob for discovery; synchronized only the lockfile importer and explicit workspace-gate mapping.
- Added no runtime dependency and implemented no layout, ELK, Svelte UI, terminal, or Ghost Architecture behavior.

验证：

- `pnpm list -r --depth -1`：通过，16 个 workspace projects。
- `pnpm lint:workspace`：通过，15 个实际模块。
- `pnpm build`：通过，15/15 tasks successful。
- `pnpm test`：通过，29/29 tasks successful。

Validation:

- `pnpm list -r --depth -1`: passed with 16 workspace projects.
- `pnpm lint:workspace`: passed with 15 actual modules.
- `pnpm build`: passed, 15/15 tasks successful.
- `pnpm test`: passed, 29/29 tasks successful.

## 2026-08-11 - UI / Architecture Layout Documentation First

状态：已验证。

Status: Verified.

变更：

- 新增 UI Architecture、Architecture Layout、Decision Required 和 UI MVP Roadmap 四份双语设计文档。
- 定义 Architecture IR、Layout compiler、LayoutState、Web adapter、Svelte Flow、Review/Ghost 和 Terminal 的责任边界。
- 建立包含 12 项指定风险的 Risk Register、10 个统一 Decision 模板和 11 个完整 Checkpoint。
- 更新 Architecture Layout/Web README 与长期架构说明。
- 修正长期架构说明中依赖箭头的既有反向文字描述。
- 所有 `Final Decision` 保持 `TBD`；未编写算法、UI、Terminal 或 Ghost 行为，未安装依赖。

Changes:

- Added four bilingual design documents for UI Architecture, Architecture Layout, Decision Required, and the UI MVP Roadmap.
- Defined responsibility boundaries among Architecture IR, the Layout compiler, LayoutState, the Web adapter, Svelte Flow, Review/Ghost, and Terminal.
- Established a Risk Register covering 12 required risks, 10 uniform Decision templates, and 11 complete Checkpoints.
- Updated Architecture Layout/Web READMEs and long-lived architecture notes.
- Corrected the pre-existing reversed wording for dependency arrows in the long-lived architecture notes.
- Kept every `Final Decision` as `TBD`; implemented no algorithm, UI, Terminal, or Ghost behavior and installed no dependency.

验证：10 个 Decision、11 个 Checkpoint 和 12 项 Risk Register 覆盖检查通过；`pnpm lint:workspace`、`pnpm build`、`pnpm test` 与 `git diff --check` 通过。

Validation: checks for 10 Decisions, 11 Checkpoints, and 12 Risk Register entries passed; `pnpm lint:workspace`, `pnpm build`, `pnpm test`, and `git diff --check` passed.

## 2026-08-11 - Root AGENTS Constraints for Layout/UI / Layout/UI 根级 AGENTS 约束

状态：已验证。

Status: Verified.

变更：

- 完整保留 Coding Agent 第一铁律中英文原文。
- 更新根级 `AGENTS.md` 的项目结构，加入 `architecture-layout` 与新的 docs/logs 事实源说明。
- 增加 Architecture IR 唯一事实源、LayoutState 分离、依赖方向、Architecture Layout/Web 所有权、Ghost/Review、Decision/Checkpoint 和 Terminal/Agent 边界。
- 增加 Layout 无 DOM 测试与未来 UI 分层测试规则。
- 未新增单数 `AGENT.md`，未修改代码、依赖或用户 Decision。

Changes:

- Preserved the complete original Chinese and English Coding Agent First Law.
- Updated the project structure in the root `AGENTS.md` for `architecture-layout` and the new docs/logs sources of truth.
- Added Architecture IR source-of-truth, LayoutState separation, dependency direction, Architecture Layout/Web ownership, Ghost/Review, Decision/Checkpoint, and Terminal/Agent boundaries.
- Added DOM-free Layout testing and future layered UI testing rules.
- Added no singular `AGENT.md` and changed no code, dependency, or user Decision.

验证：第一铁律完整性与双语规则检查通过；`git diff --check`、`pnpm lint:workspace`、`pnpm build` 和 `pnpm test` 通过。

Validation: First Law integrity and bilingual-rule checks passed; `git diff --check`, `pnpm lint:workspace`, `pnpm build`, and `pnpm test` passed.

## 2026-08-11 - UI V1 Master Planning / UI V1 主规划

状态：已验证，Phase 1 阻塞。

Status: Verified, Phase 1 blocked.

变更：

- 新增 `docs/ui-v1-execution-plan.md`，按 Phase 0–7 定义 Goal、Modules、Dependencies、Scope、Non-goals、Deliverables、Acceptance Criteria、Tests、Risks、Decision Gates 和 Exit Condition。
- 保留 canonical Decision ID，建立附件主题编号的 10/10 crosswalk 与 Phase gate matrix。
- 同步 Roadmap 的 Master Phase mapping，并区分 Phase 1 core protocol、Phase 5 Ghost product behavior 和 Phase 6 quality closure。
- Risk Register 新增 R-013 至 R-015。
- 根级 `AGENTS.md` 接入 Master Plan，并把 Phase 0→7 设为 UI V1 主执行顺序。
- 未修改实现、依赖或 Final Decision；Phase 1 因 D-005、D-002、D-010 阻塞，D-001 也需在 solver 前确认。

Changes:

- Added `docs/ui-v1-execution-plan.md` with Goal, Modules, Dependencies, Scope, Non-goals, Deliverables, Acceptance Criteria, Tests, Risks, Decision Gates, and Exit Condition for Phases 0–7.
- Preserved canonical Decision IDs and added a 10/10 crosswalk from attachment labels plus a Phase gate matrix.
- Synchronized Master Phase mapping in the Roadmap and separated Phase 1 core protocols, Phase 5 Ghost product behavior, and Phase 6 quality closure.
- Added R-013 through R-015 to the Risk Register.
- Connected the Master Plan from the root `AGENTS.md` and made Phase 0→7 the UI V1 master execution order.
- Changed no implementation, dependency, or Final Decision; D-005, D-002, and D-010 block Phase 1, and D-001 is required before solver work.

验证：8/8 Phase、每 Phase 11/11 栏目、10/10 Decision/crosswalk、15/15 Risk entries 通过；`pnpm lint`、`pnpm build`、`pnpm test` 均通过。

Validation: 8/8 Phases with 11/11 fields each, 10/10 Decision/crosswalk entries, and 15/15 Risk entries passed; `pnpm lint`, `pnpm build`, and `pnpm test` all passed.
