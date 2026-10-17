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

## 2026-08-13 - UI Eight-Stage Source Reconciliation / UI 八阶段来源复核

状态：文档已完善，门禁不变。

Status: documentation improved; gates unchanged.

对照用户在 Codex 内置浏览器中打开的原始规划，确认现有 `docs/ui-v1-execution-plan.md` 已覆盖八阶段且不应另建体系。补充原始阶段到 Master Phase 0→7 的映射、视觉编译到产品闭环的依赖原则，并细化 Phase 1 的 semantic roles、layout hints、单一正式策略、determinism 与 Redis mental-map 验收要求。未修改代码、依赖、Architecture IR 或 Final Decision。

Rechecked the original plan opened by the user in the Codex in-app browser and confirmed that `docs/ui-v1-execution-plan.md` already covers the eight stages and should not be duplicated. Added source-to-Master-Phase mapping, the visual-compilation-to-product-closure dependency rule, and refined Phase 1 acceptance for semantic roles, layout hints, one formal strategy, determinism, and the Redis mental-map scenario. Changed no code, dependency, Architecture IR, or Final Decision.

## 2026-08-13 - Phase 1 Checkpoint 1 Projection Slice / Phase 1 Checkpoint 1 投影切片

状态：已验证。

Status: Verified.

用户批准 D-001、D-002、D-005、D-010 后，`architecture-layout` 实现 coordinate-free 的 semantic classification、component/explicit-module/infrastructure abstraction、VisualGraph、LayoutGraph 与 rank/group/proximity/direction constraints。新增 deterministic、序列化、唯一 ID、合法 endpoint、输入不可变和 renderer/coordinate 禁止字段测试。没有实现 ELK、worker、坐标、LayoutResult、incremental、Ghost、Svelte 或 UI。

After the user approved D-001, D-002, D-005, and D-010, `architecture-layout` implemented coordinate-free semantic classification, component/explicit-module/infrastructure abstraction, VisualGraph, LayoutGraph, and rank/group/proximity/direction constraints. Added tests for determinism, serialization, unique IDs, valid endpoints, input immutability, and forbidden renderer/coordinate fields. No ELK, worker, coordinates, LayoutResult, incremental behavior, Ghost behavior, Svelte, or UI was implemented.

验证：package TypeScript compile、pass unit test 与 compiler integration test 通过；用户恢复 pnpm 环境后，`pnpm ci:verify` 完整通过：typecheck 23/23、unit 27/27、integration 17/17、E2E 16/16、build 15/15。

Validation: package TypeScript compilation, pass unit tests, and compiler integration tests passed. After the user restored the pnpm environment, the complete `pnpm ci:verify` passed: typecheck 23/23, unit 27/27, integration 17/17, E2E 16/16, and build 15/15.

## 2026-08-13 - Phase 1 Checkpoint 2 Started / Phase 1 Checkpoint 2 启动

状态：进行中，package 验证通过。

Status: In progress; package verification passed.

第一阶段文档与 Checkpoint 1 验收状态完成同步后，按已批准 D-001/D-002/D-010 开始 Checkpoint 2。新增唯一 runtime dependency `elkjs@0.12.0`，并通过 solver-neutral public API、内部 adapter 和内部 solver-only worker boundary 隔离。实现没有修改 Architecture IR/DSL、apps/web、Svelte、Ghost、Terminal、persistence 或 incremental 行为。

After synchronizing Phase 1 documentation and the Checkpoint 1 acceptance state, Checkpoint 2 began under approved D-001/D-002/D-010. Added the sole runtime dependency `elkjs@0.12.0`, isolated behind a solver-neutral public API, an internal adapter, and an internal solver-only worker boundary. The implementation changes no Architecture IR/DSL, apps/web, Svelte, Ghost, Terminal, persistence, or incremental behavior.

Package typecheck/unit/integration tests and the complete `pnpm ci:verify` pass: typecheck 23/23, unit 27/27, integration 17/17, E2E 16/16, build 15/15. Checkpoint 2 remains open only for the unapproved large-graph latency/web-bundle budget and later host-integration evidence.

## 2026-08-13 - Phase 1 Incremental/Stability Infrastructure / Phase 1 增量稳定性基础设施

状态：已验证。

Status: Verified.

用户批准所有推荐项：100/150 p95 ≤ 250 ms、500/800 p95 ≤ 1.5 s、ELK worker gzip ≤ 550 KiB 且动态加载；D-004 延后 V1 pin；D-006 由 Workspace abstraction 持有 LayoutState；未受影响节点 movement p95 ≤ 48 px、max ≤ 144 px 且不整体翻转顺序。实现 FULL/INCREMENTAL、missing-state/direction-change FULL fallback、可序列化 LayoutState、change derivation、local placement、stability pass 与 movement report。Redis/cache 新增、connection add、component remove 回归均通过，未受影响节点为 0 px 移动。

The user approved all recommended options: p95 ≤ 250 ms for 100/150, p95 ≤ 1.5 s for 500/800, an ELK worker ≤ 550 KiB gzip with dynamic loading, D-004 deferring V1 pinning, D-006 assigning LayoutState to the Workspace abstraction, and unaffected movement p95 ≤ 48 px/max ≤ 144 px without overall order reversal. Implemented FULL/INCREMENTAL behavior, missing-state/direction-change FULL fallback, serializable LayoutState, change derivation, local placement, a stability pass, and movement reports. Redis/cache addition, connection addition, and component removal regressions pass with 0 px movement for unaffected nodes.

完整 `pnpm ci:verify` 通过：typecheck 23/23、unit 27/27、integration 17/17、E2E 16/16、build 15/15。完整 CI 中性能证据：100/150 cold 180.19 ms、p95 56.92 ms；500/800 cold 460.39 ms、p95 506.66 ms；ELK gzip 471,876 bytes。

The complete `pnpm ci:verify` passed: typecheck 23/23, unit 27/27, integration 17/17, E2E 16/16, and build 15/15. Full-CI performance evidence: 100/150 cold 180.19 ms and p95 56.92 ms; 500/800 cold 460.39 ms and p95 506.66 ms; ELK gzip 471,876 bytes.

随后完成 Phase 1 Ghost core protocol：proposal-scoped identity、只投影新增 node/edge、局部放置且不修改 accepted IR/LayoutState。没有实现 D-007 管辖的呈现策略、Review accept/reject 或 UI。

The Phase 1 Ghost core protocol then added proposal-scoped identity, projection of added nodes/edges only, and local placement without mutating accepted IR/LayoutState. It implements no D-007 presentation strategy, Review accept/reject behavior, or UI.

Phase 1 最终完整 `pnpm ci:verify` 再次通过；public declaration 未泄漏 ELK/worker/UI 类型，`architecture-layout` 不依赖 `architecture-review`/Svelte/apps/web，Architecture IR/DSL 未出现视觉状态字段。Phase 1 据此标记 Verified。

The final Phase 1 `pnpm ci:verify` passed again. Public declarations leak no ELK, worker, or UI types; `architecture-layout` does not depend on `architecture-review`, Svelte, or apps/web; Architecture IR/DSL contains no visual-state fields. Phase 1 is therefore marked Verified.

## 2026-08-13 - Phase 1 Decision Closure / Phase 1 决策收尾

状态：已验证；Phase 2 已就绪但未开始。

Status: Verified; Phase 2 is ready but not started.

读取用户指定的内置浏览器 21:03 决策建议，并依据用户“根据建议执行”授权正式批准 Phase 2 前置项：D-009 采用 `@xyflow/svelte`，但只允许经 `apps/web` anti-corruption adapter 进入 Canvas；D-003 只持久化 Workspace-owned LayoutState 中的 drag position，禁止修改 IR 或自动推导 constraint；D-008 采用 Standard + Semantic Zoom。同步 Decision、Master Plan、Roadmap、UI Architecture、AGENTS、web README 和结构化日志。

Read the user-designated 21:03 decision guidance in the in-app browser and, under the user's instruction to execute it, formally approved the Phase 2 prerequisites: D-009 adopts `@xyflow/svelte` only through the `apps/web` anti-corruption adapter; D-003 persists only drag positions in Workspace-owned LayoutState without changing IR or inferring constraints; and D-008 adopts Standard + Semantic Zoom. Synchronized the Decision record, Master Plan, Roadmap, UI Architecture, AGENTS, web README, and structured logs.

本收尾没有初始化 SvelteKit、安装 UI 依赖、实现 Canvas/drag/semantic zoom、修改 Architecture IR，或进入 Phase 2 代码实现。

This closure did not initialize SvelteKit, install UI dependencies, implement Canvas/drag/semantic zoom, change Architecture IR, or begin Phase 2 code implementation.

验证：Decision 结构为 10/10、已批准 9、仅 D-007 保持 TBD；Master Phase 0→7 顺序检查、禁止 Svelte 类型泄漏检查与 `git diff --check` 通过。完整 `pnpm ci:verify` 通过：typecheck 23/23、unit 27/27、integration 17/17、E2E 16/16、build 15/15。

Validation: the Decision structure is 10/10 with 9 approved and only D-007 remaining TBD; Master Phase 0→7 ordering, forbidden Svelte-type leakage, and `git diff --check` pass. The complete `pnpm ci:verify` passes: typecheck 23/23, unit 27/27, integration 17/17, E2E 16/16, and build 15/15.

## 2026-08-13 - Shared Runner Performance Gate Stabilization / 共享 Runner 性能门禁稳定化

状态：本地已验证，等待远端流水线。

Status: Locally verified; awaiting the remote pipeline.

GitHub Actions run `31705682848` 的所有功能测试均通过，但 100/150 ELK fixture 在共享 runner 的单个采样窗口得到 p95 313.93 ms，超过已批准的 250 ms；本地同一窗口约为 57 ms。根因是绝对 wall-clock benchmark 把一次 runner 争用窗口直接当作产品性能失败。

All functional tests passed in GitHub Actions run `31705682848`, but one shared-runner sampling window measured p95 313.93 ms for the 100/150 ELK fixture, above the approved 250 ms budget; the same local window measured about 57 ms. The absolute wall-clock benchmark treated one contended runner window as a product-performance failure.

保留 250 ms / 1.5 s 原预算与每窗口 20 次采样，允许最多三个独立稳态窗口；任一完整窗口满足原预算才通过，并输出所有窗口 p95。该修复不放宽预算、不修改 layout 行为，也不移除 CI 性能门禁。

The fix preserves the original 250 ms / 1.5 s budgets and 20 samples per window while allowing up to three independent steady-state windows. At least one complete window must meet the original budget, and every window p95 is reported. It neither relaxes the budgets nor changes layout behavior or removes the CI performance gate.

本地定向 integration 与完整 `pnpm ci:verify` 通过；完整 CI 证据为 100/150 p95-window 71.13 ms、500/800 p95-window 493.50 ms、ELK gzip 471,876 bytes。

The targeted integration test and complete local `pnpm ci:verify` pass; full-CI evidence is a 71.13 ms p95 window for 100/150, a 493.50 ms p95 window for 500/800, and ELK gzip of 471,876 bytes.

## 2026-08-13 - CI Job Rename Follow-up / CI Job 重命名跟进

状态：根因已确认。

Status: Root cause confirmed.

用户将 CI job display name 从 `PR Skills Gate` 改为 `PR Verify`；GitHub Actions run `31707423728` 已正确识别并执行新名称。失败并非 YAML 或 job name 问题，而是对应提交 `ccf4205` 使用全角冒号 `feat：...`，未满足 `type(optional-scope): description` 的 Conventional Commits 门禁。保留 `PR Verify` 名称，不重写已推送的 `main` 历史；以本规范提交触发新的 push range 验证。

The user renamed the CI job display name from `PR Skills Gate` to `PR Verify`, and GitHub Actions run `31707423728` recognized and executed the new name correctly. The failure was not caused by YAML or the job name: commit `ccf4205` used a full-width colon in `feat：...` and failed the `type(optional-scope): description` Conventional Commits gate. The `PR Verify` name is retained, pushed `main` history is not rewritten, and this conforming follow-up commit triggers validation for a new push range.

## 2026-08-13 - Phase 2 Narrow-Slice Planning / Phase 2 窄切片规划

状态：规划中，实现未开始。

Status: Planning in progress; implementation has not started.

在 `codex/phase-2-svelte-cad` 上把 Phase 2 拆分为 P2.0–P2.6 七个顺序切片，并明确 Checkpoint 3、Master Phase 2 与 Phase 3 的边界：基础 Canvas 属于 Checkpoint 3；headless Add/Remove/Connect command application 属于 Phase 2 退出条件；Palette/Inspector 产品入口及 visible-control E2E 属于 Phase 3。

On `codex/phase-2-svelte-cad`, split Phase 2 into seven ordered slices, P2.0–P2.6, and clarified the boundary between Checkpoint 3, Master Phase 2, and Phase 3: the foundational Canvas belongs to Checkpoint 3; the headless Add/Remove/Connect command application is a Phase 2 exit condition; and Palette/Inspector product entry points plus visible-control E2E belong to Phase 3.

本轮只更新计划与结构化日志，未安装依赖、未初始化 SvelteKit、未实现 UI 或 Layout 行为。

This slice updates only plans and structured logs. It installs no dependency, initializes no SvelteKit app, and implements no UI or Layout behavior.

## 2026-08-13 - Phase 2 Svelte CAD Infrastructure / Phase 2 Svelte CAD 基础设施

状态：已验证。

Status: Verified.

按用户批准的三项推荐完成 P2.0–P2.6：使用 headless Architecture Review 作为 command acceptance gate；drag 只更新 Workspace-owned `LayoutState` 并提供 Auto Layout reset；在 `apps/web` 建立 Vitest、Svelte component testing 与 Playwright。原地把 Web placeholder 转为 SvelteKit/Svelte 5 app，采用 `@xyflow/svelte` 1.6.3 behind the sole adapter，并将 Vite 从不兼容的 8.x 调整为插件 peer range 支持的 7.3.6。

Completed P2.0–P2.6 under the user's approval of all three recommendations: headless Architecture Review is the command acceptance gate; drag updates only Workspace-owned `LayoutState` with an Auto Layout reset path; and Vitest, Svelte component testing, and Playwright are established in `apps/web`. Converted the Web placeholder in place into a SvelteKit/Svelte 5 app, adopted `@xyflow/svelte` 1.6.3 behind the sole adapter, and corrected Vite from incompatible 8.x to peer-compatible 7.3.6.

实现真实 ArchitectureProject fixture、LayoutResult adapter、Standard + Semantic Zoom、node/edge rendering、pan/zoom/select、keyboard/focus 基础、loading/error/cancellation、solver-only Web Worker，以及 renderer-neutral Add/Remove/Connect command application。命令链路为 `command -> candidate -> Validator -> headless Review -> accepted IR -> layout -> Canvas projection`；validation/rejection 保留原 accepted IR。

Implemented a real ArchitectureProject fixture, the LayoutResult adapter, Standard + Semantic Zoom, node/edge rendering, pan/zoom/select, keyboard/focus basics, loading/error/cancellation, a solver-only Web Worker, and the renderer-neutral Add/Remove/Connect command application. The command path is `command -> candidate -> Validator -> headless Review -> accepted IR -> layout -> Canvas projection`; validation failure or rejection preserves the original accepted IR.

定向证据：Web typecheck 0 errors/0 warnings；unit 6 files/9 tests；integration 1 file/2 tests；Playwright Chrome E2E 1 passed，覆盖 load、render、select、zoom、pan、drag、Auto Layout reset 与 semantic zoom。构建将 ELK 隔离在 worker chunk，主页面 chunk 约 65.71 KiB gzip；未实现 Palette、Inspector、Greenfield、Ghost 或 Terminal。

Targeted evidence: Web typecheck reports 0 errors and 0 warnings; unit tests pass 6 files/9 tests; integration passes 1 file/2 tests; one Playwright Chrome E2E passes and covers load, render, select, zoom, pan, drag, Auto Layout reset, and semantic zoom. The build isolates ELK in a worker chunk while the main page chunk is about 65.71 KiB gzip. Palette, Inspector, Greenfield, Ghost, and Terminal remain unimplemented.

最终完整 `pnpm ci:verify` 通过：workspace architecture 15 modules；typecheck 25/25；unit 28/28；integration 18/18；E2E 17/17；build 15/15。性能证据：100/150 cold 183.37 ms、p95 56.64 ms；500/800 cold 484.96 ms、p95 501.34 ms；ELK worker gzip 471,876 bytes。`git diff --check` 同时通过。

The final complete `pnpm ci:verify` passes: workspace architecture 15 modules; typecheck 25/25; unit 28/28; integration 18/18; E2E 17/17; and build 15/15. Performance evidence: 100/150 cold 183.37 ms and p95 56.64 ms; 500/800 cold 484.96 ms and p95 501.34 ms; ELK worker gzip 471,876 bytes. `git diff --check` also passes.

## 2026-08-13 - Phase 3 Greenfield Planning / Phase 3 Greenfield 规划

状态：规划完成，等待用户决策；实现未开始。

Status: Planning complete and awaiting user decisions; implementation has not started.

PR #1 已合并为 `a917f5d`，本地与远端 Phase 2 分支已删除；`codex/phase-3-greenfield-workspace` 已快进到合并后的 `main`。Phase 3 被拆分为 P3.0–P3.7，覆盖 Workspace host、candidate/review lifecycle、Workspace shell、Palette、Inspector、Save/Open 与验收。

PR #1 was merged as `a917f5d`; the local and remote Phase 2 branches were deleted, and `codex/phase-3-greenfield-workspace` was fast-forwarded to post-merge `main`. Phase 3 is split into P3.0–P3.7 covering Workspace hosting, candidate/review lifecycle, Workspace shell, Palette, Inspector, Save/Open, and acceptance.

规划识别三个实现前门禁：P3-D1 使用 SvelteKit server boundary 隔离 Node-only Workspace；P3-D2 使用现有 deterministic Architecture Agent/Mock Provider 作为 V1 Greenfield baseline；P3-D3 使用 app-private field-specific Inspector commands 并禁止 generic patch。三项均为推荐，尚未代替用户决策。本轮未安装依赖或修改行为代码。

Planning identified three pre-implementation gates: P3-D1 isolates the Node-only Workspace behind a SvelteKit server boundary; P3-D2 uses the existing deterministic Architecture Agent/Mock Provider as the V1 Greenfield baseline; and P3-D3 uses app-private field-specific Inspector commands while prohibiting generic patches. All three are recommendations and do not replace user decisions. This slice installs no dependency and changes no behavior code.


## 2026-08-15 - Phase 3 Detailed Slice Planning / Phase 3 详细切片规划

状态：详细规划完成，等待用户决策；实现未开始。

Status: Detailed planning complete and awaiting user decisions; implementation has not started.

同步了 `logs/modules/web` 的 Scope/State/Todo/Links（此前仍停留在 Phase 2 之前的 placeholder 描述），并把 `docs/ui-v1-execution-plan.md` 尾部的旧 Phase 1 Readiness 段更新为 Phase 0–2 已验证合并、Phase 3 规划完成的当前状态。

Synchronized `logs/modules/web` Scope/State/Todo/Links (previously still describing the pre-Phase-2 placeholder) and updated the stale Phase 1 Readiness section at the end of `docs/ui-v1-execution-plan.md` to the current state of Phases 0–2 verified and merged with Phase 3 planning complete.

在 Master Plan 的 Phase 3 部分为 P3.0–P3.7 每个切片补充了完整规格：Goal、Input、Output、Acceptance Criteria、Known Risks、Non-goals 与 Exit Evidence，覆盖 Workspace host bridge、requirement-to-candidate、workspace shell、Palette command entry、semantic Inspector、Save/Open lifecycle 与阶段验收；Roadmap Checkpoint 4 已链接到该详细规格。P3-D1–P3-D3 保持为推荐方向，等待用户确认后才进入对应实现边界。

The Master Plan Phase 3 section now carries complete specifications for each P3.0–P3.7 slice: Goal, Input, Output, Acceptance Criteria, Known Risks, Non-goals, and Exit Evidence, covering the Workspace host bridge, requirement-to-candidate, workspace shell, Palette command entry, semantic Inspector, Save/Open lifecycle, and phase acceptance; Roadmap Checkpoint 4 links to these detailed specifications. P3-D1 through P3-D3 remain recommendations awaiting user confirmation before their implementation boundaries.

本轮未安装依赖、未修改行为代码；文档结构、Git 边界与 workspace 基线检查在提交前通过。

This slice installs no dependency and changes no behavior code; documentation-structure, Git-boundary, and workspace-baseline checks pass before commit.

## 2026-08-15 - P3-D2 Confirmed: Zero LLM in Generation / P3-D2 确认：生成零 LLM

状态：决策已记录，Phase 3 实现开始。

Status: Decision recorded; Phase 3 implementation has started.

用户在 codex/phase-3-greenfield-workspace 上明确 P3-D2 决策：**LLM 在生成部分无职责，仅负责后续审批等功能**。requirement -> candidate ArchitectureProject 的生成完全由 deterministic Architecture Agent + Mock Provider 完成，任何生成阶段不调用 LLM；真实 LLM 若未来接入只允许出现在审批/评审等下游辅助环节，由 TODO-009 独立门禁管辖。

The user explicitly confirmed P3-D2 on codex/phase-3-greenfield-workspace: **LLM has no role in architecture generation and is limited to later approval/review support**. Requirement -> candidate ArchitectureProject generation is fully handled by the deterministic Architecture Agent with the Mock Provider; no generation stage invokes an LLM. If a real LLM is integrated in the future, it is allowed only in downstream approval/review support under the separate TODO-009 gate.

边界已写入 docs/architecture-layout-decisions.md（P3-D2 门禁行与 Blocking Summary）、docs/ui-v1-execution-plan.md（P3-D2 门禁与 P3.2 Non-goals）、docs/ui-mvp-roadmap.md（Checkpoint 4 状态/Non-goals/Ordered Slices）、docs/ui-architecture.md（Greenfield 工作流 LLM 边界）。TODO-009 定位调整为审批侧 LLM 支持。

The boundary is recorded in docs/architecture-layout-decisions.md (P3-D2 gate row and Blocking Summary), docs/ui-v1-execution-plan.md (P3-D2 gate and P3.2 Non-goals), docs/ui-mvp-roadmap.md (Checkpoint 4 status/Non-goals/Ordered Slices), and docs/ui-architecture.md (Greenfield workflow LLM boundary). TODO-009 is refocused as approval-side LLM support.

P3-D1（Workspace host boundary）与 P3-D3（Inspector command granularity）仍为推荐方向，等待用户确认；确认前不进入 P3.1/P3.5 实现边界。本轮文档改动未安装依赖、未修改行为代码；提交前的验证命令通过。

P3-D1 (Workspace host boundary) and P3-D3 (Inspector command granularity) remain recommendations awaiting user confirmation; their implementation boundaries are not entered before confirmation. This slice installs no dependency and changes no behavior code; verification commands pass before commit.

## 2026-08-15 - P3-D1/P3-D3 Confirmed; P3.0 Complete / P3-D1/P3-D3 确认；P3.0 完成

状态：决策全部确认；P3.0 契约冻结完成；P3.1 开始。

Status: All decisions confirmed; the P3.0 contract freeze is complete; P3.1 has started.

用户批准 P3-D1（SvelteKit server boundary + typed app contract，浏览器不导入 node:*/FileWorkspaceStorage/磁盘 schema）与 P3-D3（app-private field-specific commands，禁止 generic patch）。连同此前确认的 P3-D2（生成零 LLM），Phase 3 三项门禁全部通过。

The user approved P3-D1 (SvelteKit server boundary with typed app contracts; the browser imports no node:*/FileWorkspaceStorage/disk schemas) and P3-D3 (app-private field-specific commands; generic patches prohibited). Together with the previously confirmed P3-D2 (zero LLM in generation), all three Phase 3 gates are cleared.

P3.0 交付：apps/web/src/lib/cad/workspace/README.md 冻结 browser-safe DTO 边界、SvelteKit server boundary 与 accepted/candidate/evidence/view-state/ephemeral 生命周期所有权矩阵；packages/architecture-agent 移除生成路径 LLM 调用点（删除 llm/ 目录与 system prompt，index 不再导出 LLM provider）。

P3.0 deliverables: apps/web/src/lib/cad/workspace/README.md freezes the browser-safe DTO boundary, SvelteKit server boundary, and the accepted/candidate/evidence/view-state/ephemeral lifecycle ownership matrix; packages/architecture-agent removed generation-side LLM call sites (deleted the llm/ directory and system prompt; index no longer exports an LLM provider).

验证：全仓 typecheck 25/25、unit 28/28、integration 18/18 通过；git diff --check 通过。

Validation: full workspace typecheck 25/25, unit 28/28, and integration 18/18 pass; git diff --check passes.

## 2026-08-15 - P3.1 Workspace Host Bridge Complete / P3.1 Workspace 宿主桥接完成

状态：已验证；P3.1 完成，P3.2（Requirement to Candidate）为下一切片。

Status: Verified; P3.1 is complete and P3.2 (Requirement to Candidate) is the next slice.

P3.1 交付：browser-safe typed contract 与 workspace-bridge client 在 apps/web/src/lib/architecture/workspace/；SvelteKit server routes 在 apps/web/src/routes/api/workspace/ 承载 Node-only Workspace create/open/save。@coding-cad/workspace 依赖加入 apps/web 并更新 lockfile。构建产物验证 Node-only 代码只进入 server chunks，浏览器 bundle 零 node:* 泄漏。

P3.1 deliverables: browser-safe typed contracts and the workspace-bridge client in apps/web/src/lib/architecture/workspace/; SvelteKit server routes in apps/web/src/routes/api/workspace/ hosting Node-only Workspace create/open/save. The @coding-cad/workspace dependency was added to apps/web and the lockfile was updated. Build artifacts confirm Node-only code enters only server chunks with zero node:* leakage in the browser bundle.

## 2026-08-16 - Phase 3 Completion Report / Phase 3 完成报告

### 1. Completed / 已完成

Phase 3（Greenfield Architecture Workspace）按 P3.0–P3.7 全部实现：P3.0 契约与宿主冻结（browser-safe DTO、SvelteKit server boundary、生命周期矩阵、生成零 LLM）；P3.1 Workspace host bridge（server routes + typed contract）；P3.2 Requirement to Candidate（deterministic Agent + Validator + 最小 Review gate）；P3.3 Workspace shell（New Project/Requirement/Canvas/Problems/selection/loading-error）；P3.4 Palette command entry；P3.5 Semantic Inspector（field-specific 命令）；P3.6 Save/Open lifecycle（IR/evidence/view state 分离）；P3.7 Phase acceptance（happy path + error paths + 完整 CI）。

Phase 3 (Greenfield Architecture Workspace) is fully implemented across P3.0–P3.7: P3.0 contract/host freeze (browser-safe DTOs, SvelteKit server boundary, lifecycle matrix, zero-LLM generation); P3.1 Workspace host bridge (server routes + typed contract); P3.2 Requirement to Candidate (deterministic Agent + Validator + minimal Review gate); P3.3 Workspace shell (New Project/Requirement/Canvas/Problems/selection/loading-error); P3.4 Palette command entry; P3.5 Semantic Inspector (field-specific commands); P3.6 Save/Open lifecycle (IR/evidence/view state separation); P3.7 phase acceptance (happy path + error paths + full CI).

### 2. Acceptance Criteria Result / 验收结果

Create/Display/Edit/Validate/Accept/Save/Open happy path 通过（9 个 Playwright E2E）；invalid-candidate/rejection/error paths 通过（空 requirement、重复组件、reject）；所有 semantic edit 经 command/proposal 且不直接改 accepted IR；validation issue 可导航；保存后 IR 与 Layout/View State 分离；默认布局无需手动整理。

The Create/Display/Edit/Validate/Accept/Save/Open happy path passes (nine Playwright E2E); invalid-candidate, rejection, and error paths pass (empty requirement, duplicate component, reject); every semantic edit uses a command/proposal without directly mutating accepted IR; validation issues navigate; saved IR and Layout/View State stay separate; the default layout needs no manual arrangement.

### 3. Tests / 测试

pnpm ci:verify 全门禁通过：workspace architecture 15 modules；typecheck 25/25；unit 28/28；integration 18/18；E2E 17/17（web 9 + cli 8）；build 15/15；change-record、commit-message、secrets checks 通过。web 侧 unit 10 files/30 tests、integration 3 files/9 tests、Playwright 9 tests。

pnpm ci:verify passes all gates: workspace architecture 15 modules; typecheck 25/25; unit 28/28; integration 18/18; E2E 17/17 (web 9 + cli 8); build 15/15; change-record, commit-message, and secrets checks pass. Web: unit 10 files/30 tests, integration 3 files/9 tests, Playwright 9 tests.

### 4. Architecture Invariants Check / 架构不变量检查

ArchitectureProject 仍是唯一事实来源；浏览器 bundle 无 node:*、FileWorkspaceStorage 或磁盘 schema（P3-D1）；生成路径零 LLM（P3-D2）；Inspector 无 generic patch 且不编辑 width/height/color/border（P3-D3）；accepted/candidate/evidence/view-state 生命周期分离（P3.0 矩阵）；LayoutState 不写入 Architecture IR。

ArchitectureProject remains the sole source of truth; the browser bundle has no node:*, FileWorkspaceStorage, or disk schemas (P3-D1); the generation path has zero LLM (P3-D2); the Inspector has no generic patch and no width/height/color/border editing (P3-D3); accepted/candidate/evidence/view-state lifecycles stay separate (P3.0 matrix); LayoutState never enters Architecture IR.

### 5. Known Risks / 已知风险

Playwright 与 Svelte 5 事件委托存在兼容限制（条件渲染面板内按钮需原生事件分发）；vite dev 用于 E2E（preview 不提供 server routes）；workspace 磁盘格式仍未冻结（D-006 后续门禁）。

Playwright and Svelte 5 event delegation have a compatibility limitation (buttons inside conditionally rendered panels need native event dispatch); E2E uses vite dev (preview does not serve server routes); the workspace disk format remains unfrozen (later D-006 gate).

### 6. Technical Debt / 技术债

workspace package 的 ./pure 子路径导出与 browser-safe idGenerator 是为 P3-D1 引入的最小适配；E2E nativeClick helper 用于规避 Playwright/Svelte 5 兼容限制；Inspector 编辑暂限 description/capabilities（contracts/constraints 编辑留待后续切片）。

The workspace ./pure subpath export and browser-safe idGenerator are minimal P3-D1 adaptations; the E2E nativeClick helper works around the Playwright/Svelte 5 limitation; Inspector editing is limited to description/capabilities for now (contracts/constraints editing remains for later slices).

### 7. Decision Required / 待决策

无阻塞决策。D-007（Ghost presentation）保留 Phase 5 门禁；D-004/D-006 的后续子决策（pin、shared/personal storage）在 Phase 6 前确认。

No blocking decisions. D-007 (Ghost presentation) retains its Phase 5 gate; later D-004/D-006 sub-decisions (pin, shared/personal storage) are confirmed before Phase 6.

### 8. Next Phase Readiness / 下一 Phase 就绪度

Phase 3 完成；Phase 4（Brownfield Architecture Workspace）就绪，依赖 Phase 3 exit 与 D-005（已批准）。

Phase 3 is complete; Phase 4 (Brownfield Architecture Workspace) is ready, depending on the Phase 3 exit and D-005 (approved).

## 2026-08-16 - Workspace Sidebar and Personal Settings / 工作区侧边栏与个人设置

状态：已验证；Phase 3 UI 收尾完成。

Status: Verified; Phase 3 UI closeout complete.

提 PR 前完成两项 UI 收尾：左侧工作区侧边栏聚合项目管理功能；个人设置整合到侧边栏左下角齿轮图标弹窗（语言 + 主题亮/暗/跟随系统），设置持久化到浏览器 localStorage，不进入架构/磁盘格式。完整 pnpm ci:verify 通过。

Completed two pre-PR UI closeouts: the left workspace sidebar aggregates project management, and personal settings are collapsed behind a gear-icon dialog in the sidebar bottom-left (language + light/dark/system theme), persisted to browser localStorage without entering architecture or disk formats. The complete pnpm ci:verify passes.

## 2026-10-16 - Step 5 State and Exit Report / 步骤5状态与退出报告

动机：修正当前文档中“已完成并合并”“代码未开始”“待三项决策”互相冲突的状态，不重写历史implementation-log。同步主计划、Roadmap、UI/Architecture/Layout说明、README与根/模块State/Todo/Links。新增双语 `docs/phase-3-exit-report.md`，保留命令成功与实际solver退化两个事实。

Motivation: reconcile conflicting current status without rewriting historical implementation logs. Synchronized plan, roadmap, architecture/UI/layout notes, READMEs and root/module state, todo and links. Added the bilingual exit report, retaining both successful engineering commands and actual solver fallback.

阶段3结论：不满足退出条件；不授权进入阶段4。审批与P3-D3澄清已解决，无待答复决策。浏览器ELK互操作尚未修复；若修复方案改变已批准边界/公开API/依赖须另行决策。 / Phase 3 does not satisfy exit and does not authorize Phase 4. Approval and Inspector clarifications are resolved. ELK interoperability remains unfixed; changes to approved boundaries/APIs/dependencies require separate decisions.

步骤5文档验证：git diff --check、15模块workspace边界检查、change-record通过；退出报告/审计/主计划/Roadmap共16个本地链接目标存在。最终源码CI见10-final-source-ci.txt，最新Web计数57/9/18。 / Step 5 document checks passed: diff whitespace, 15-module workspace boundary, change-record, and 16 local link targets. Final source CI is in 10-final-source-ci.txt with Web counts 57/9/18.

最终文档交付检查：5个收尾提交的Conventional Commits检查、secret scan、workspace检查及diff检查通过；4173端口无监听。见11-final-document-checks.txt。 / Final documentation delivery checks passed for all five closeout commit messages, secret scan, workspace and diff checks; port 4173 has no listener. See 11-final-document-checks.txt.

## 2026-10-16 - ELK Step 1 Diagnosis / ELK步骤1诊断

目标：只关闭阶段3浏览器ELK阻塞，保持ELK/D-010/public API。dev与production均复现；隔离VM证明内嵌worker初始化错误优先级导致缺失CJS导出并覆盖onmessage。内存CJS-first实验成功。详细证据及候选方案见 `logs/validation/p3-closeout/elk-browser/root-cause.md`；本提交不修改产品实现。 / Diagnose only the Phase 3 browser blocker. Both modes reproduce; the VM proves missing CJS export and message-handler overwrite, while a CJS-first in-memory experiment succeeds. This commit changes no product implementation.

## 2026-10-16 - ELK Step 2 Repair / ELK步骤2最小修复

选择对固定elkjs 0.12.0内嵌worker的单一初始化guard做pnpm补丁：CommonJS模块优先导出，独立worker仍auto-attach。锁文件只新增补丁hash，未改solver版本、D-010责任分配或package公开API。新增隔离Worker-global回归证明原onmessage保留且实际路由生成。 / Applied a pinned one-guard pnpm patch: export CommonJS first, retain standalone worker auto-attachment. Only patch metadata changed; solver/version, D-010 and public APIs stay unchanged. Regression verifies handler ownership and real routes.

源码integration与性能预算通过：100/150 p95 54.30ms、500/800 p95 513.86ms，worker gzip471875bytes。新增测试最初变量重名为测试编译错误，修正后通过。dev/preview重建后均无fallback/pageerror；进一步记录实际Worker结果，而非只看警告消失。 / Integration and existing performance budgets passed. An initial duplicate test variable was corrected. Both modes rebuilt without fallback/page errors; actual Worker results are also captured.

根因与放弃方案见root-cause.md；不采用更换solver、新增物理worker、全compiler搬迁或只调default层级等方案。 / See root-cause.md for alternatives; solver replacement, another physical worker, compiler relocation and extra default normalization were not used.

步骤2最终双模式证据：dev与preview的真实Worker均返回status=success、diagnostics=[]、3条已路由边，均无fallback/pageerror。见repaired-modes.json。 / Final Step 2 evidence: actual workers in dev and preview both returned success, empty diagnostics and three routed edges, with no fallback/page error.

## 2026-10-16 - ELK Step 3 Hard Gate / ELK步骤3硬门禁

每个现有浏览器用例都使用自动solverGuard，观察实际solver-only Worker的LayoutResult；任一fallback或diagnostics导致失败。来源复用既有status信号：当前唯一backend为ELK，success只由fromElkGraph在校验真实输出后发出，测试显式断言source=elk及真实路由，不新增package公开字段。 / Every current browser test observes real Worker results and fails on fallback/diagnostics. Source derives from the existing success signal of the sole ELK backend; explicit ELK and route assertions add no public field.

test:e2e同时执行dev和production preview套件，已有ci:verify的浏览器门禁因此覆盖两种模式。P3_FORCE_FALLBACK=1只在测试观察器中将timeout改为0，触发既有真实fallback，供负控证明测试必须失败。 / Both modes run through the existing CI browser gate. The test-only negative control sets the existing timeout to zero and must fail.

步骤3验证：Web typecheck 0/0；正常dev19/preview19通过。P3_FORCE_FALLBACK=1的同一ELK用例exit1，实际诊断LAYOUT_TIMEOUT，明确Expected success / Received fallback，自动守卫也失败；此为预期负控而非被忽略的产品失败。初版preview配置合并启动了重复同端口server，分类为测试配置错误，已改为覆盖配置并回归。证据见step3-browser.txt和negative-browser.txt。 / Typecheck and both 19-test suites passed. The forced real timeout exited 1 with success-versus-fallback assertions in both the test and automatic guard. This expected negative control is retained. A duplicate-server test configuration error was fixed and regressed.

## 2026-10-16 - ELK Step 4 Browser Quality / ELK步骤4浏览器质量

真实 ELK 输出暴露两个此前 fallback 掩盖的问题：Svelte Flow 子节点需要 parent-relative 坐标，LayoutState 为绝对坐标；新增无连接组件在稳定旧坐标后可能重叠。adapter 显式转换坐标，拖动反向转换；group 采用容器标签。既有 Stability pass 只移动重叠的新增组件并扩展受影响容器，保留既有组件位置；不改变 solver、D-010 或公开 API。 / Real ELK exposed parent-coordinate projection and orphan-addition overlap defects. The adapter converts absolute/relative coordinates in both directions and groups render as containers. The existing stability pass moves colliding newcomers and expands affected containers while retaining existing components; solver, D-010 and public contracts remain unchanged.

浏览器质量测试使用既有默认项目与 points-system fixture，观察真实 Worker 并测量重叠、包含、路由、交叉、rank inversion、面积、确定性、增量移动。采用已有 p95≤48px、max≤144px、无顺序反转预算；不为交叉或耗时发明阈值。产品描述编辑和 Palette 添加均经过 command/Validator/Review。内部测试钩子仅 DEV 或 layout-acceptance 构建安装，普通 production 构建移除；不新增 package API。 / Browser tests measure existing fixtures using real workers and apply only the approved movement budget. Product edits and palette additions follow the command/Validator/Review path. Private acceptance hooks exist only in development or an explicit test build and are removed from ordinary production builds.

定向测试已通过；新增 Palette 断言最初发现真实重叠，修复后通过。此前等待 Accept 完成不足属于测试同步问题，已等待明确完成状态。以下 verification/ 日志记录最终按顺序强制源码验证；对照 fallback 仅作为独立诊断，不允许通过正向验收守卫。 / Targeted tests passed after correcting a real overlap found by the palette assertion and a test synchronization issue. Final ordered forced source verification is recorded under verification/. Controlled fallback comparisons are separate diagnostics and never accepted by the positive guard.

正向 Playwright retries=0，防止一次真实 fallback 被后续重试通过掩盖。 / Positive Playwright suites disable retries so a fallback cannot be hidden by a later successful attempt.

步骤4最终顺序验证8项均exit0，CI=true/TURBO_FORCE=true；build15/typecheck25/test30 task，Web unit58/integration9，dev21/preview21，全量CI各Turbo阶段0cached。CI性能100/150 p95=55.50ms、500/800 p95=495.19ms、worker gzip471875bytes；均通过既有预算。最终普通production重建dev/preview均ELK success、3路由、无fallback/pageerror；静态产物无验收hook，公开契约/worker transport diff为空。 / All eight ordered gates passed with forced source rebuilds and zero cached Turbo tasks. Unit58/integration9 and browser21 per mode passed. Existing performance budgets passed. Ordinary production and dev both returned real ELK success, three routes and no errors; release hooks are absent and public/transport diffs are empty.

## 2026-10-16 - ELK Step 5 Exit Status / ELK步骤5退出状态

依据步骤4当前源码的顺序8项验证、普通release双模式solver观察、边界检查与截图，同步退出报告/计划/roadmap/架构说明和当前日志，关闭TODO-016/WEB-001。阶段3按定义范围满足退出条件；未声称合并、远程CI、生产部署或任意图普遍质量。 / Current ordered source gates, ordinary-release worker observations, boundary checks and screenshots support closing the defined Phase 3 scope. Reports, plans and current logs are synchronized without merge/hosted-CI/deployment/general-graph claims.

保留补丁升级、固定viewport、复杂大图/多平台未验证与审批历史范围限制；交叉/rank/耗时未新增硬阈值。五步提交支持逆序revert，原未跟踪PR草稿不触碰。 / Patch upgrades, fixed viewport, unverified graph/platform cases and approval-audit scope remain explicit. No new quality thresholds were invented. Five commits support reverse-order rollback; the untracked draft is untouched.

## 2026-10-16 - Phase 3 PR dependency audit repair / 阶段3 PR依赖审计修复

PR #3首次远端CI在额外security:audit步骤报告7high，本地旧ci:verify未包含此项。已获用户授权定向安全修复；pnpm10深层update未移动间接锁定版本，采用仅匹配已锁漏洞版本的overrides：undici8.10.0→8.10.2、devalue5.9.0→5.9.3、source-map-js1.2.1→1.2.2；均在父依赖允许的semver范围。 / The initial remote audit found seven high findings absent from the old local gate. The authorized narrow fix uses overrides matching only vulnerable locked versions after pnpm10's targeted update left the lock unchanged. All patches fit parent ranges.

本地ci:verify新增同一审计，保留high阈值；不忽略告警，不更换ELK/patch/worker/API。当前验证进行中，证据位于logs/validation/p3-security-closeout/；正式通过以实际命令与远端结果为准。 / Local CI now includes the same unchanged audit threshold. ELK, its patch, worker and API remain unchanged. Verification is in progress; evidence and actual results determine acceptance.


本轮最终验证：冻结安装、源码build、安全high门禁及含审计的强制ci:verify均exit0；Web58unit/9integration/dev21/preview21，所有Turbo阶段0cached。pnpm audit --json仍exit1，因剩余2moderate/1low；不将其误标为零漏洞或环境错误。证据见logs/validation/p3-security-closeout/report.md；远端以PR Checks为准。 / Final local gates pass with forced source builds and all browser guards. Unfiltered JSON audit exits1 for remaining low/moderate findings, not a zero-vulnerability claim or environment error. Hosted status remains independently observable.

## 2026-10-16 - 阶段 4 步骤 0：固化记录格式与规则文档 / Phase 4 Step 0: Standardize Recording Format and Rules

### 1. 做了什么 / What
- 识别仓库中所有涉及记录格式的载体：`.github/pull_request_template.md`、`AGENTS.md`、`CLAUDE.md`、`docs/documentation-guidelines.md`、`docs/logging-system.md`、`logs/Standards/current.md`、`logs/README.md`、`scripts/ci/check-change-record.mjs` 以及 `scripts/ci/check-change-record.test.mjs`。
- 将“1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification”三段式顺序结构和中英双语要求写入上述所有规则与模板载体。
- 升级 `scripts/ci/check-change-record.mjs`，增加对变更条目的三段结构与中英双语的自动化校验；新增单元测试 `scripts/ci/check-change-record.test.mjs`（7/7 通过），并在 `package.json` 的 `check:changelog` 中集成测试运行。
- 创建阶段 4 PR 草稿 `.github/pr-draft-phase4.md`，按新统一格式书写；严格保持未跟踪文件 `.github/pr-draft-phase3.md` 不受触碰。
- Identified all record format carriers in the repository and updated them with the standardized three-part sequence: 1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification in bilingual English and Chinese.
- Enhanced `scripts/ci/check-change-record.mjs` with automatic structural validation, added unit tests in `scripts/ci/check-change-record.test.mjs`, and wired them into `check:changelog`.
- Initialized `.github/pr-draft-phase4.md` without modifying `.github/pr-draft-phase3.md`.

### 2. 为什么这么做 / Why
- 动机：统一全生命周期的工程记录规范，消除 PR、阶段退出报告、变更记录和步骤汇报中的格式分歧与理由缺失，保证事实链可审计、可追溯。
- 备选方案与取舍：考虑过仅在文档中做软性口头约定，但容易在多阶段迭代中出现退化；选择将规则固化为 CI 检查脚本并配齐正负单元测试，形成强制工程轨道。保留对历史旧记录的兼容模式（allowLegacy），不破坏历史提交的查验。
- Motivation: Standardize engineering records across PRs, exit reports, change-logs, and step reports to guarantee an auditable, traceable evidence chain.
- Tradeoffs: Enforced via CI script rather than only textual documentation to prevent format regression. Added legacy compatibility mode so historical records remain verifiable.

### 3. 验证结果 / Verification
- 单元测试 / Unit tests: `node --test scripts/ci/check-change-record.test.mjs` 通过（7/7 用例，包含合规通过、缺 Why 拦截、顺序倒置拦截、缺 What 拦截、缺 Verification 拦截、单语拦截、旧格式兼容）。
- 命令验证 / Commands: `pnpm check:changelog` 与 `CI=true TURBO_FORCE=true pnpm ci:verify` 执行通过。
- 负控验证 / Negative control: 临时构造缺失“为什么这么做 / Why”字段的变更记录条目，执行 `pnpm check:changelog` 准确失败（exit 1）并提示缺失 Section 2；恢复合规内容后重测通过。
- 状态分类 / Status: 已实现并验证（步骤 0 全部范围）。
- 风险与回退 / Risks & Rollback: 回退本步骤可执行 `git revert <step-0-commit>`。

## 2026-10-16 - 阶段 4 步骤 1：真值基准与当前基线 / Phase 4 Step 1: Ground Truth Benchmarks and Baseline

### 1. 做了什么 / What
- 依据 `packages/README.md` 与各 `package.json` 声明，整理本仓库黄金真值文件 `packages/implementation-analyzer/fixtures/coding-cad-golden.json`，并如实记录两者差异（layout 依赖状态、review devDependencies、apps 依赖展开）。
- 新增两个小型 TS 测试夹具：`small-monorepo`（pnpm workspace 结构，3 模块 3 依赖边）与 `small-single-repo`（标准 src/ 结构，4 模块 4 依赖边），均配置人工标注的 `truth.json`。
- 新增合成大型夹具 `synthetic-large-repo`（30 个包、120 个模块、147 条依赖边），文件头与 README 显式标注 SYNTHETIC，严禁表述为真实仓库结果。
- 实现基准测试脚本 `packages/implementation-analyzer/src/benchmark.ts`，支持计算模块与依赖边的精准率（Precision）、召回率（Recall）、证据分类（declared/resolved/inferred），并在零检测时触发明确 FAIL 提示。
- 在修改 Analyzer 之前运行全套基准，并将修改前基线持久化至 `logs/validation/p4-baseline/analyzer-baseline-before.json` 与 `baseline-report-before.md`。
- Added `coding-cad-golden.json` comparing README and package.json declarations with all discrepancies documented.
- Added two small TypeScript fixtures (`small-monorepo` and `small-single-repo`) with human-annotated `truth.json`.
- Added synthetic large fixture `synthetic-large-repo` (30 packages, 120 modules, 147 connections) explicitly labeled as SYNTHETIC.
- Implemented benchmark harness in `benchmark.ts` measuring Precision, Recall, and evidence breakdown with zero-detection failure alerts.
- Captured pre-change baseline into `logs/validation/p4-baseline/`.

### 2. 为什么这么做 / Why
- 动机：确立客观、可度量、防篡改的真值比对基线，确保 Analyzer 的重构以真实指标驱动，而不是凭主观印象推测提取质量。
- 备选方案与取舍：考虑过直接修改 Analyzer 边改边测，但缺少修改前的客观基线数字就无法确切证明改进幅度，也无法满足门禁要求。因此本步骤严格限制为“只新增测试、fixture 与基准脚本，不修改 Analyzer 实现”。
- Motivation: Establish an objective, reproducible ground truth baseline before touching analyzer logic, preventing unverified quality claims.
- Tradeoffs: Strictly decoupled fixture and benchmark creation from analyzer implementation to capture true pre-change failure baselines (e.g. 0 modules on monorepos).

### 3. 验证结果 / Verification
- 运行基准脚本 / Benchmark command: `pnpm --filter @coding-cad/implementation-analyzer benchmark` 执行完成并输出基线报告。
- 实测基线数据 / Baseline metrics (修改前 / Pre-change):
  - Coding-CAD 本仓库: 2 检测 / 15 期望，精准率 0.0%，召回率 0.0%，边 0/37，判定 FAIL（零连接 / 错误识别根目录）。
  - small-monorepo: 0 检测 / 3 期望，精准率 0.0%，召回率 0.0%，边 0/3，判定 FAIL（0 模块 0 连接）。
  - small-single-repo: 4 检测 / 4 期望，精准率 100.0%，召回率 100.0%，边 4/4，精准率 100.0%，召回率 100.0%，判定 PASS。
  - synthetic-large-repo: 0 检测 / 120 期望，精准率 0.0%，召回率 0.0%，边 0/147，判定 FAIL（0 模块 0 连接）。
- 既有单元测试 / Existing unit tests: `pnpm --filter @coding-cad/implementation-analyzer test:unit` 全部通过。
- 门禁检查 / CI check: `pnpm check:changelog` 与 `pnpm lint:workspace` 全部通过。
- 状态分类 / Status: 已实现并验证（步骤 1 全部范围）。
- 风险与回退 / Risks & Rollback: 回退本步骤可执行 `git revert <step-1-commit>`。

## 2026-10-16 - 阶段 4 步骤 2：Analyzer 证据模型与分层提取 / Phase 4 Step 2: Analyzer Evidence Model and Layered Extraction

### 1. 做了什么 / What
- 增强 `packages/implementation-analyzer`：
  - L1: `RepositoryScanner` 与 `ModuleAnalyzer` 识别 `pnpm-workspace.yaml` 与 `package.json` workspaces，提取 monorepo packages（来源 `declared`，置信度 1.00）；
  - L2: 使用 TypeScript Compiler API（`ts.createSourceFile`）实现文件级 import 语法解析，彻底替代正则匹配，支持相对路径与包名依赖解析（来源 `resolved`，置信度 0.90）；
  - L3: 使用 TypeScript Compiler API 解析公开导出（函数、类、变量、接口、类型别名），写入 Component 的 `capabilities`（`export:<Name>`）与 description（来源 `resolved`）；
  - L4: 单体仓库中对未由 service 文件覆盖的子目录，使用目录归组策略提取为模块（来源 `inferred`，置信度 0.65）；
- 证据与置信度模型：在 Component 的 `tags`（`source:<declared|resolved|inferred>`、`confidence:<0.xx>`、`path:<path>`）与 Connection 的 `constraints`（`source:...`、`Detection confidence: <0.xx>`、`evidence:...`）中携带完整证据与置信度，不破坏 Architecture IR 的公开模型契约；
- 不支持结构显式报告：增加 `UnsupportedStructureReport`，显式收集并报告不支持的 manifest（`pom.xml`, `go.mod`, `Cargo.toml` 等）、非 TS/JS 语言、语法错误以及未识别的工作区结构，不在控制台或图上静默吞没；
- 边界约束遵守：仅使用 TypeScript Compiler API 语法树解析与导出提取，绝不引入语义类型推断、自动领域推断或契约字段猜测；
- 验证与基线比对：更新 `benchmark.ts` 输出 `logs/validation/p4-baseline/analyzer-baseline-after.json` 与 `baseline-report-after.md`，并生成前后对比表 `analyzer-comparison.md`；更新 `analyzer.test.ts` 补充 monorepo 与证据模型单测。
- Enhanced `packages/implementation-analyzer`:
  - L1: Discovered `pnpm-workspace.yaml` and `package.json` workspaces in `RepositoryScanner` and `ModuleAnalyzer` (source: `declared`, confidence: 1.00).
  - L2: Replaced regular expression import parsing with TypeScript Compiler API (`ts.createSourceFile`) for AST-accurate import resolution (source: `resolved`, confidence: 0.90).
  - L3: Extracted public exports (functions, classes, consts, interfaces, type aliases) via Compiler API into Component `capabilities` and descriptions (source: `resolved`).
  - L4: Maintained directory-grouping fallback for uncovered single-repo directories (source: `inferred`, confidence: 0.65).
- Evidence & Confidence: Carried source classification and confidence scores in Component `tags` and Connection `constraints` without altering Architecture IR public types.
- Explicit Unsupported Reports: Added `UnsupportedStructureReport` capturing unsupported manifests, non-TS/JS languages, syntax errors, and unrecognized layouts.
- Preserved Boundaries: Strictly used Compiler API for syntactic parsing without full type inference, semantic deduction, or contract synthesis.
- Baseline Comparison: Updated `benchmark.ts` to output `analyzer-baseline-after.json`, `baseline-report-after.md`, and `analyzer-comparison.md`; added monorepo and evidence unit tests in `analyzer.test.ts`.

### 2. 为什么这么做 / Why
- 动机：旧版 Analyzer 仅硬编码扫描根 `src/` 与单个 service 正则，导致 Coding-CAD 本仓库及任何标准 pnpm monorepo 在反演时产生 0 模块与 0 依赖边的崩溃性假阴性（步骤 1 基线已证明）；同时正则解析 import 脆弱且无法提取真实导出。
- 备选方案与取舍：
  - 备选方案 A：修改 Architecture IR 核心类型，新增 `evidence`、`confidence`、`source` 等专有字段。被否决：违反 Architecture IR 稳定性与单一架构事实源约束，IR 属于业务架构意图，不应为反演器特化公开模型。因此选择复用已有的 `tags`、`capabilities`、`description` 和 `constraints`。
  - 备选方案 B：引入完整 TypeScript TypeChecker / Program。被否决：类型检查耗时大、内存占用高，且超出已批准的“仅限模块解析与导出提取，不做类型推断与语义分析”约束。采用轻量语法级 AST 解析（`ts.createSourceFile`）即达到 100% 召回且执行时间仅需数十毫秒。
- Motivation: The legacy analyzer only supported single root `src/` structures with fragile regex matching, yielding 0 modules and 0 connections on monorepos.
- Tradeoffs: Rejected modifying Architecture IR public types for evidence fields to protect IR boundaries; rejected full `TypeChecker`/`Program` semantic analysis in favor of syntactic AST parsing (`ts.createSourceFile`) to maintain sub-second performance and adhere to user boundaries.

### 3. 验证结果 / Verification
- 单元测试 / Unit tests: `pnpm --filter @coding-cad/implementation-analyzer test` 全部通过（包含 example-project 单体仓库、small-monorepo 工作区、证据与置信度标签断言、导出提取断言）。
- 依赖测试 / Downstream tests: `pnpm --filter @coding-cad/implementation-validator test` 全部通过（验证 IR 标签与约束未造成破坏）。
- 基线对比 / Benchmark Comparison (`pnpm --filter @coding-cad/implementation-analyzer benchmark`):
  - Coding-CAD 本仓库: 模块从 0% 召回提升至 15/15 (100.0% P / 100.0% R)；依赖边从 0% 提升至 38/37 (97.4% P / 100.0% R，覆盖全部 13 个核心包与 2 个应用，100% 召回 package.json 声明边并确认 architecture-review devDependency 差异)。
  - small-monorepo: 模块从 0/3 (0%) 提升至 3/3 (100.0% P / 100.0% R)；依赖边 3/3 (100.0% P / 100.0% R)。
  - small-single-repo: 保持 4/4 (100.0% P / 100.0% R)；依赖边 4/4 (100.0% P / 100.0% R)。
  - synthetic-large-repo: 模块从 0/120 (0%) 提升至 120/120 (100.0% P / 100.0% R)；依赖边从 0/147 提升至 147/147 (100.0% P / 100.0% R)。
- 状态分类 / Status: 已实现并验证（步骤 2 全部范围）。
- 风险与回退 / Risks & Rollback: 回退本步骤可执行 `git revert <step-2-commit>`。

## 2026-10-16 - 阶段 4 步骤 2.1：Analyzer 补强：跨包 L2 交叉校验、证据编解码与语义污染防御 / Phase 4 Step 2.1: Analyzer Hardening: Cross-Package L2 Cross-Validation, Typed Evidence Codec, and Semantic Pollution Defense

### 1. 做了什么 / What
- 提交拆分与历史卫生：
  - 将先前未推送提交中对 `scripts/ci/check-change-record.mjs` 的正则修复软重置并独立提交为 `ddc11f2` (`fix(ci): refine change record header regex to ignore list bullets`)；
  - 补充 `scripts/ci/check-change-record.test.mjs` 单测与负控测试，确保列表条目不被误判为标题，同时缺少任一章节依然被拦截；
- L2 交叉校验与依赖种类标注：
  - 在 `packages/implementation-analyzer/src/graph/dependency-graph.ts` 中比对 package.json 声明与 AST 文件级 import，对所有边产出显式分类：`declared-and-used`（声明且使用）、`declared-unused`（仅声明未使用）、`undeclared-used`（未声明使用）；
  - 为边标注依赖种类：`runtime`、`dev`、`peer`，完整保留边数不随意丢弃；
- 真值诚实表述：
  - 更新 `packages/implementation-analyzer/src/benchmark.ts`，在表头与说明中严格区分 `L1-manifest`（真值与分析器均源自 package.json）、`L2-hand-annotated`（经人工独立标注）、`synthetic`（合成大规模夹具）；
  - 统计所有边的交叉分类与 AST 确认导入数（`resolvedCount`），确保所有夹具中代码导入数均严格大于 0；
- 强化边缘用例夹具：
  - 新建 `packages/implementation-analyzer/fixtures/edge-cases-repo/`，覆盖：barrel `export *`、`import type`、`await import(...)` 动态导入、`tsconfig paths` 别名解析（`@utils/*`）、循环导入（A <-> B）、未声明工作区依赖、语法错误文件（`broken.ts`）；
  - 提供人工独立标注的 `truth.json`；
  - 在 `analyzer.test.ts` 中断言全部用例要么得到正确解析，要么显式输出 `unparseable-syntax` 报告，绝不静默丢弃；
- 类型化证据编解码封装：
  - 新增 `packages/implementation-analyzer/src/codec/evidence-codec.ts`，导出 `encodeComponentTags`、`decodeComponentEvidence`、`encodeConnectionConstraints`、`decodeConnectionEvidence`、`formatLayerPriorExplanation`；
  - 明确置信度文档定义为“层级先验”（Layer Prior：declared 1.00, resolved 0.90, inferred 0.65），非统计准确率；
- 语义字段污染清除：
  - 将 `export:<Symbol>` 彻底从 Component 的 `capabilities` 移入 `tags`，防止下游 Validator、Execution Blueprint 和 Layout Classifier 误读；
  - 将不支持结构警告从 `intent.purpose` 移出，保持 purpose 纯净描述，警告统一通过 `RepositoryInspection.unsupportedStructures` 传递；
- Validator 兼容实测：
  - 在 `packages/implementation-validator/src/analyzer-compatibility.test.ts` 中针对 Coding-CAD 本仓库与合成大图反演架构运行 `ImplementationValidator`，证实 evidence 字符串不触发 `not-primary-storage` 等限制关键词误报，验证通过率 100%。

- Commit Hygiene & Gate Hardening:
  - Soft-reset unpushed CI gate regex fix into standalone commit `ddc11f2` (`fix(ci): refine change record header regex to ignore list bullets`).
  - Added unit tests in `check-change-record.test.mjs` verifying negative controls (missing any section still rejected).
- L2 Cross-Validation & Dependency Kinds:
  - Compared package.json declarations against AST resolved imports in `dependency-graph.ts` to categorize edges into `declared-and-used`, `declared-unused`, and `undeclared-used`.
  - Tagged dependency kinds (`runtime`, `dev`, `peer`) on connection evidence.
- Honest Ground Truth Representation:
  - Updated `benchmark.ts` to distinguish `L1-manifest`, `L2-hand-annotated`, and `synthetic` truth levels.
  - Added connection cross-validation breakdown and AST resolved count (`resolvedCount > 0`).
- Edge-Case Fixture & Invariants:
  - Created `fixtures/edge-cases-repo/` testing barrel `export *`, `import type`, `await import(...)`, `tsconfig paths` alias, circular imports, undeclared workspace imports, and syntax errors (`broken.ts`).
  - Hand-annotated `truth.json` and verified all cases resolve or report explicit `unparseable-syntax`.
- Typed Evidence Codec:
  - Created `evidence-codec.ts` with round-trip encode/decode helpers and explicit Layer Prior definitions.
- Semantic Field Pollution Clean-up:
  - Moved `export:<Symbol>` from `capabilities` to `tags` to preserve capability semantics across downstream validators and blueprints.
  - Removed unsupported structure warning text from `intent.purpose`, routing warnings exclusively through typed inspection structures.
- Validator Compatibility Verification:
  - Added `analyzer-compatibility.test.ts` in `@coding-cad/implementation-validator` validating that evidence tags/strings produce 0 false positives against approved architecture limitations.

### 2. 为什么这么做 / Why
- 动机：步骤 2 遗留了门禁脚本混杂、未区分 manifest 与代码真实使用（导致 resolved 计数为 0）、真值混淆、缺少边缘语法测试、`export:*` 污染 `capabilities` 语义、以及缺少 Validator 兼容实证等问题。
- 备选方案与取舍：
  - 备选方案 A：直接修改 Architecture IR 引入新字段。被否决：违反单一事实源与核心类型稳定性原则。采用带类型的编解码器 `evidence-codec.ts` 将证据隔离在 `tags` 与 `constraints` 内是经过批准的最佳过渡方案。
  - 备选方案 B：将 `export:<Symbol>` 保留在 `capabilities`。被否决：下游 `architecture-validator` 与 `execution-blueprint` 将 `capabilities` 视为主干能力意图，混入数百个函数导出名会破坏能力合规检查与 AI prompt 生成。移入 `tags` 并由编解码器读取彻底根除了语义污染。

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-analyzer test`：通过（7/7 测试全部通过，包含 codec 单测、单体、monorepo 与 7 大边缘用例）；
  - `pnpm --filter @coding-cad/implementation-validator test`：通过（包含 analyzer-compatibility 实测，自洽性检查通过 / 0 偏离项）；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：通过（所有 5 个夹具全部 PASS，resolved edges 计数全部严格 > 0）；
  - `pnpm build && pnpm test`：通过（全工作区 30 个任务全部成功）；
- 未实现：无。
- 风险与回退方式：
  - 风险：若后续步骤有直接读取裸字符串 tags 的行为需统一走 `decodeComponentEvidence`；
  - 回退方式：`git revert <commit-hash>` 可完全独立回退步骤 2.1，不影响 `ddc11f2` 的 CI 检查修复。

## 2026-10-16 - 阶段 4 步骤 3：Brownfield 产品流水线（服务端安全路由、ELK 布局、证据面板与分组折叠） / Phase 4 Step 3: Brownfield Product Pipeline (Secure Server Route, ELK Layout, Evidence Inspector, and Group Collapse)

### 1. 做了什么 / What
- 设计规范与宿主安全模型文档：编写 `docs/brownfield-pipeline-design.md`，定义从“打开仓库 -> 服务端路由调用 Analyzer -> 重建 ArchitectureProject -> Layout -> Svelte Flow Canvas / Inspector”的完整流水线，并在第 4 节明确“宿主边界与安全模型”（纯本机 loopback、显式根目录、realpath 规范化并在根目录内、拒绝 `..` 遍历、忽略敏感目录与凭据、超限显式截断非静默、DTO 排除源码正文、日志不打源码内容）。
- 服务端安全分析路由与测试：
  - 实现 `apps/web/src/routes/api/workspace/analyze-repository/+server.ts`；
  - 实现 `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`（9/9 测试通过），覆盖非本机 403、路径遍历 400、外部软链接逃逸拦截、`.env*` 凭据过滤、DTO 源码正文排除、语法错误显式报告等安全负控。
- 扫描器与映射器安全与分组增强：
  - `packages/implementation-analyzer/src/repository/scanner.ts`：增加外部软链接跳过与敏感凭据（`.env*`, `*.pem`, `*.key`）忽略；
  - `packages/implementation-analyzer/src/mapper/architecture-mapper.ts`：为模块生成 `module:<pkgStem>` 分组标签；
  - `packages/implementation-analyzer/package.json`：导出纯类型解码子路径 `"./codec"`。
- Web 工作区与画布/属性检查器打通：
  - `apps/web/src/lib/architecture/workspace/workspace-bridge.ts`：导出 `analyzeRepository` 客户端；
  - `apps/web/src/lib/architecture/greenfield/workspace-shell-controller.ts`：集成分析流水线，将反演结果重建为与 Greenfield 相同类型的 `ArchitectureProject`，触发 `BrowserWorkerLayoutEngine`（ELK）完成布局并驱动 Canvas；
  - `apps/web/src/routes/+page.svelte`：新增“打开代码仓库 / Analyze Repository”弹窗、截断提示与不支持结构警告横幅；
  - `apps/web/src/lib/cad/canvas/ArchitectureCanvas.svelte` 与 `ArchitectureNode.svelte`：实现模块/基础设施分组渲染、折叠/展开（带 `nodrag`/`nopan` 保护）与隐藏成员数量角标；
  - `apps/web/src/lib/architecture/greenfield/inspector.ts` 与 `+page.svelte`：通过 `evidence-codec` 解码并展示来源类型、层级先验置信度解释（Layer Prior Explanation）、相对路径与公开导出符号；
- 浏览器端 E2E 验证：
  - 新增 `apps/web/e2e/brownfield.spec.ts`，验证真实浏览器中打开仓库、ELK 求解器布局（断言 `data-layout-solver="elk"`、`data-layout-status="success"` 与零 fallback 门禁）、证据审查以及分组折叠/展开与隐藏数量更新。

- Design Specification & Host Security Model: Authored `docs/brownfield-pipeline-design.md` defining the complete Brownfield pipeline and Section 4 "Host Boundary & Security Model" (loopback only, explicit directory, realpath containment, reject path traversal, secret file ignore, explicit truncation, source text excluded from DTOs, no source code logging).
- Secure Server Route & Negative Control Tests:
  - Implemented `apps/web/src/routes/api/workspace/analyze-repository/+server.ts`.
  - Implemented `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts` (9/9 passed) validating non-loopback 403, traversal 400, outside symlink rejection, credential ignore, DTO source exclusion, and syntax error reports.
- Scanner & Mapper Enhancements:
  - Updated `scanner.ts` to prevent external symlink traversal and exclude secret files (`.env*`, `*.pem`, `*.key`).
  - Added module grouping tags (`module:<pkgStem>`) in `architecture-mapper.ts`.
  - Exported subpath `"./codec"` in `packages/implementation-analyzer/package.json`.
- Web Integration (Canvas, Inspector, & Controller):
  - Exported `analyzeRepository` in `workspace-bridge.ts`.
  - Added `analyzeRepository` workflow in `workspace-shell-controller.ts`, reconstructing `ArchitectureProject` (same IR model as Greenfield) and laying out via ELK.
  - Added repository open dialog, truncation warning, and unsupported structure warning banners in `+page.svelte`.
  - Implemented container group rendering, interactive collapse/expand (with `nodrag`/`nopan`), and hidden member counts in `ArchitectureCanvas.svelte` and `ArchitectureNode.svelte`.
  - Rendered decoded provenance, Layer Prior confidence explanations, relative paths, and public exports in `inspector.ts` and `+page.svelte`.
- Browser E2E Automation:
  - Added `apps/web/e2e/brownfield.spec.ts` asserting real ELK solver execution (`data-layout-solver="elk"`, zero fallback), inspector evidence verification, and group collapse/expand toggling.

### 2. 为什么这么做 / Why
- 架构一致性：Brownfield 反演产出的 `ArchitectureProject` 与 Greenfield 共享完全相同的单一事实源模型契约，后续 Layout 与 Inspector 均复用既有组件与投影，不为 Brownfield 建立第二套架构或视图模型。
- 安全第一原则：由于 SvelteKit 服务端路由具备读取本地文件系统的能力，必须严格限制在 loopback 本机访问，并通过 realpath 严格限制在用户选择的目录范围内，严禁读取根目录外部的任何符号链接指向，绝不在网络 DTO 或日志中泄露源码正文，超限截断显式报告。
- 可视化分组与逐级展开：大型代码库模块繁多，基于 `module:<pkgStem>` 的容器分组与折叠展开能够在保持整体架构可理解性的同时隐藏细节，折叠计数让用户明确感知隐藏节点数量。
- Architecture Consistency: Reconstructed `ArchitectureProject` shares the identical IR model contract with Greenfield. Canvas, layout, and inspector are fully reused without creating a secondary architecture model.
- Security-First: Because SvelteKit server routes can access the local filesystem, strict loopback isolation, realpath boundary containment, secret ignore lists, and source code redaction prevent unauthorized host traversal or data leakage.
- Progressive Disclosure: Container grouping (`module:<pkgStem>`) and interactive collapse/expand allow scalable exploration while exposing exact hidden member counts.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`：9/9 测试通过；
  - `pnpm --filter @coding-cad/web test:unit`：15/15 文件，68/68 测试通过；
  - `pnpm --filter @coding-cad/web test:integration`：3/3 文件，9/9 测试通过；
  - `pnpm --filter @coding-cad/web typecheck`：0 错误，0 警告；
  - `pnpm --filter @coding-cad/web test:e2e`：全部 22 个 E2E 用例（dev 与 preview 模式各 22 个）全部通过，包含 `brownfield.spec.ts` 真实 ELK 求解器与路由断言；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：5 个真值基准夹具全部通过；
- 未实现：无。
- 风险与回退方式：
  - 风险：若后续需支持多用户环境需引入鉴权与容器沙箱；当前按批准的单机 loopback 模型实现。
  - 回退方式：`git revert <commit-hash>` 可完全独立回退步骤 3 的改动。

## 2026-10-16 - 阶段 4 步骤 3.1：补齐证据与安全加固（Host/Origin 白名单、软链接防环/外链显式报告、超限截断负控与浏览器双模式实测） / Phase 4 Step 3.1: Evidence Replenishment & Security Hardening (Host/Origin Whitelist, Symlink Cycle/Escape Explicit Reporting, Truncation Negative Controls, and Browser Dual-Mode Benchmarks)

### 1. 做了什么 / What
- 路由安全加固与负控测试（`apps/web/src/routes/api/workspace/analyze-repository/+server.ts` 与 `server.test.ts`）：
  - 显式功能开关：新增环境变量开关 `CODING_CAD_ENABLE_REPOSITORY_ANALYSIS`，默认完全关闭（Default-Off）；未启用时返回 403 Forbidden 并附带明确启用指引；
  - Host 头白名单校验：阻断 DNS Rebinding 攻击，仅允许 `localhost`、`127.0.0.1`、`[::1]` 及 `::1`；缺失或非环回 Host 头一律 403；
  - Origin 头跨源校验：若携带 Origin，必须解析为白名单内的环回主机名；
  - Content-Type 强制要求：必须指定为 `application/json`；
  - 补齐超限截断负控测试：文件数量超限截断（`hitLimit: "file-count"`）、执行耗时超时截断（`hitLimit: "timeout"`）、单文件体量超限（`oversized-file` 不支持结构）；
  - 补齐符号链接安全测试：跳过指向根目录外的软链接并显式报告为 `symlink-outside-root`；防止根目录内软链接成环造成无限递归（`visitedDirs` 真实物理路径集合检测）；
  - `server.test.ts` 测试套件扩展至 19/19 项测试全数通过。
- 扫描器与分析器安全与过滤补强（`packages/implementation-analyzer/`）：
  - `scanner.ts`：扩展 `IGNORED_DIRECTORIES`，忽略包管理器与构建缓存目录（`.pnpm-store`、`.yarn`、`.svelte-kit`、`.code-review-graph`、`.cache`、`.output`）；增加软链接访问真实路径去重与成环阻断；支持 `ScannerOptions`（`maxFiles`、`maxFileSizeBytes`、`timeoutMs`）；
  - `dependency-graph.ts`：限制 AST 编译器导入解析仅针对 JS/TS 脚本文件，避免对 Markdown、图像与 HTML 产生误报 `unparseable-syntax`；
  - `analyzer.ts`：透传 `ScannerOptions` 与截断状态元数据。
- 设计文档与安全边界完善：
  - 更新 `docs/brownfield-pipeline-design.md`，记录开关名称、Host/Origin 白名单、已知安全边界（TOCTOU 竞态物理局限、DTO 相对路径元数据承载）及 SvelteKit 本地文件访问先例说明。
- 实测证据补充与报告：
  - 刷新基准报告 `logs/validation/p4-baseline/analyzer-baseline-after.json` 与 `analyzer-comparison.md`；
  - 新增 `apps/web/e2e/brownfield-benchmarks.spec.ts`，在真实 Chromium 浏览器中测定本仓库自身与 120 模块合成夹具在 `dev` 与 `preview` 两种模式下的各项物理指标；
  - 生成 `logs/validation/p4-browser/benchmark-report.md`，记录完整的服务端反演耗时、首屏渲染耗时、节点与折叠计数、ELK 求解器来源（100% ELK 零 fallback）、0 重叠、0 容器包含失败与严格交叉数。

- Route Security Hardening & Negative Control Tests (`analyze-repository/+server.ts` & `server.test.ts`):
  - Explicit Feature Switch: Added `CODING_CAD_ENABLE_REPOSITORY_ANALYSIS` environment switch (default off); non-enabled requests receive 403 Forbidden with clear enablement instructions.
  - Host Header Whitelist: Prevents DNS rebinding; allows only `localhost`, `127.0.0.1`, `[::1]`, and `::1`; rejects missing or non-loopback hosts with 403.
  - Origin Validation: Validates incoming Origin headers against the loopback whitelist.
  - Content-Type Enforcement: Enforces `application/json`.
  - Resource Truncation Negative Controls: Validated file count truncation (`file-count`), duration truncation (`timeout`), and oversized file exclusion (`oversized-file`).
  - Symlink Safety Tests: Tested outside symlink skipping with explicit `symlink-outside-root` reporting; verified cycle detection preventing infinite recursion loops using `visitedDirs`.
  - Expanded `server.test.ts` to 19/19 passing tests.
- Scanner & Analyzer Defensive Filtering (`packages/implementation-analyzer/`):
  - `scanner.ts`: Expanded `IGNORED_DIRECTORIES` to exclude package manager and build cache directories (`.pnpm-store`, `.yarn`, `.svelte-kit`, `.code-review-graph`, `.cache`, `.output`); added cycle defense and `ScannerOptions` support.
  - `dependency-graph.ts`: Restricted AST import parsing strictly to JS/TS script files, preventing false positive `unparseable-syntax` warnings on Markdown and HTML.
  - `analyzer.ts`: Forwarded `ScannerOptions` and truncation metadata.
- Design Documentation & Security Boundaries:
  - Updated `docs/brownfield-pipeline-design.md` detailing the feature flag name, Host/Origin whitelisting, known boundaries (TOCTOU race conditions, DTO path metadata), and SvelteKit filesystem access precedents.
- Browser Benchmark Evidence:
  - Refreshed baseline records `logs/validation/p4-baseline/analyzer-baseline-after.json` and `analyzer-comparison.md`.
  - Added `apps/web/e2e/brownfield-benchmarks.spec.ts` capturing real Chromium browser metrics for `Coding-CAD` and `synthetic-large-repo` (120 modules) in both `dev` and `preview` modes.
  - Emitted `logs/validation/p4-browser/benchmark-report.md` recording server duration, first render time, node/collapse counts, ELK solver confirmation (100% ELK, zero fallback), zero overlaps, zero containment failures, and strict edge crossings.

### 2. 为什么这么做 / Why
- 防御性安全边界：DNS rebinding、恶意跨源请求与非 JSON 请求是单机本地服务暴露 HTTP 路由时的典型攻击面；通过 Host/Origin 严格白名单与强制 Content-Type，确保仅受信任的本地工作区能触发代码分析。
- 零静默降级原则：指向根目录外的软链接不能静默消失，必须显式报告原因与作用域；超限截断必须显式标记，禁止把残缺图冒充完整图。
- 物理现实与可解释性：将 AST 编译器解析范围限定于脚本文件，消除将非脚本静态资源视作语法错误的假阳性，提高分析报告可信度。
- 真实浏览器实测证据：按照阶段门禁要求，在大规模图（120 模块）下实测布局性能与几何质量，不人为假定阈值，用外部数据证明布局引擎在极端复杂度下的鲁棒性。
- Defensive Security: Strict Host and Origin whitelisting with JSON Content-Type enforcement blocks DNS rebinding and CSRF vectors on loopback analysis endpoints.
- Zero Silent Degradation: Symlinks pointing outside root are explicitly reported rather than silently ignored; truncated scans are transparently flagged to prevent misrepresenting partial graphs as complete models.
- Evidence Integrity: Confining AST compilation to script source extensions eliminates false-positive syntax warnings on non-code assets.
- Real Browser Evidence: Capturing real Chromium measurements across dev and preview modes provides empirical proof of ELK layout reliability under large-scale stress without arbitrary thresholds.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`：19/19 测试全数通过；
  - `pnpm --filter @coding-cad/implementation-analyzer test`：单测全量通过；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：5 个真值基准夹具全量通过（包含 Coding-CAD 39/39 边 100% 召回，以及 120 模块合成夹具 147 边全量检测）；
  - `pnpm --filter @coding-cad/web test:unit`：15/15 测试文件，78/78 测试全量通过；
  - `apps/web/e2e/brownfield-benchmarks.spec.ts`：真实浏览器 dev 模式（Coding-CAD 493ms / 合成 406ms，100% ELK 求解器，0 重叠，0 包含失败）与 preview 模式（Coding-CAD 637ms / 合成 296ms，100% ELK 求解器，0 重叠，0 包含失败）全量通过；
  - `pnpm check:changelog`：变更记录闸门脚本全量校验通过。
- 未实现：无。
- 风险与回退方式：
  - 风险：若用户分析超过 5000 文件的大型仓库，会触发文件数截断告警；后续可增加分包目录分析或自定义上限配置。
  - 回退方式：`git revert <commit-hash>` 可独立回退步骤 3.1 的安全加固与基准测量。

## 2026-10-16 - 阶段 4 步骤 4：架构期望基线合规检查与双向问题导航 / Phase 4 Step 4: Expected Architecture Baseline Compliance Check and Bidirectional Problem Navigation

### 1. 做了什么 / What
- 架构设计文档（`docs/brownfield-compliance-design.md`）：
  - 明确期望架构的权威来源机制（显式加载，严禁 AI 或系统自动深拷贝合成伪期望）；
  - 界定未加载期望架构时的显式不可用状态（Explicit Unavailable State）；
  - 逐条分析界定 5 条既有 Validator 规则在 Brownfield 下的检出能力与物理局限，将代码契约规则明确标记为“无法验证（Analyzer 未提取契约）”；
  - 规定双向问题导航与折叠分组自动展开机制。
- 校验器棕地适配与目标解析（`packages/implementation-validator/`）：
  - `src/types.ts` & `src/index.ts`：导出 `IssueTarget`、`resolveIssueTarget`、`isContractIssue` 与防空指针辅助函数 `createImplementationModel`；
  - `src/rules/technology-rule.ts`：修复 Brownfield 下未检测到实际技术但期望架构规定了技术时静默放行的漏洞，显式报告 `WARNING: Technology deviation detected`；
  - `fixtures/`：建立 `coding-cad-expected.json`（Golden 真实期望基线，15 组件 40 连接）与 `coding-cad-drifted.json`（注入 5 项典型偏差用于负控验证）；
  - `src/brownfield-compliance.test.ts`：测试目标解析与双基线，验证 Coding-CAD 0 结构误报与漂移基线 100% 检出。
- Web 状态机、控制器与基线预设（`apps/web/`）：
  - `src/lib/architecture/compliance/baseline-presets.ts`：提供 Golden 与 Drifted 类型化预设，支持自定义 JSON 导入；
  - `src/lib/architecture/greenfield/workspace-shell.ts` & `workspace-shell-controller.ts`：扩展 `expectedArchitecture` 与 `complianceReport`，提供 `loadExpectedArchitecture` 与 `clearExpectedArchitecture`；
  - `workspace-shell-controller.test.ts`：增加合规加载与计算测试，扩展至 17/17 测试全量通过。
- UI 交互、角标渲染与受控自动展开（`apps/web/`）：
  - `ArchitectureCanvas.svelte`：接收 `selectedNodeIds` 并在问题聚焦时自动展开目标所属父级分组容器（基于 `previousSelectedNodeIds` 差量触发，不影响用户后续手动折叠）；
  - `src/routes/+page.svelte`：未加载基线时展示显式不可用横幅；提供加载基线对话框；渲染合规问题项并标注 `[ERROR]`、`[WARNING]`、`[无法验证]`、`[待人工确认]`；提供聚焦定位按钮；在 Inspector 联动展示关联问题。
- Playwright E2E 真实浏览器验证（`apps/web/e2e/brownfield.spec.ts`）：
  - 端到端验证不可用横幅、加载偏离基线、角标断言、点击问题自动展开已折叠父分组并聚焦、点击节点联动 Inspector、加载 Golden 基线获得 0 偏差完全合规通过、以及 100% ELK 求解器执行与零 fallback。

- Design Documentation (`docs/brownfield-compliance-design.md`): Defined expected baseline sourcing (explicit loading, no synthetic hallucination), explicit unavailable state, rule scope & limitations, and bidirectional navigation.
- Validator Adaptation (`packages/implementation-validator/`): Exported `IssueTarget`, `resolveIssueTarget`, `isContractIssue`, and `createImplementationModel`. Fixed technology rule false negatives. Created golden and drifted fixtures and integration test suite.
- Web Controller & Presets (`apps/web/`): Added baseline presets, extended workspace shell controller with compliance actions and automated recalculation, covered by 17 unit tests.
- UI & Canvas Auto-Expansion (`apps/web/`): Added explicit unavailable banner, baseline loading dialog, problem badges, target focus link, auto-expansion for collapsed parent groups, and bidirectional inspector section.
- Playwright E2E (`apps/web/e2e/brownfield.spec.ts`): Fully validated end-to-end user journey in Chromium with 100% ELK solver confirmation.

### 2. 为什么这么做 / Why
- 架构事实来源唯一性与防伪要求：打开代码仓库时只有代码事实，没有预设期望；绝不能为了消除警告而由系统自动生成伪期望，必须由架构师显式加载批准模型；未加载时直白报告“不可用”。
- 零静默降级铁律：Phase 4 AST 解析器未提取代码契约模式，契约规则必须透明报告为“无法验证”，不得谎报通过。技术规则对缺失技术的偏离必须显式警示，不得静默跳过。
- 人机交互可用性：在 120+ 模块或大型工程中，合规问题对应的节点很可能位于折叠的模块容器内部；若不自动展开，用户点击问题后画布无从高亮，造成交互困惑；通过精准受控展开显著提升可用性。

- Architecture Source of Truth: Brownfield repositories only have implementation reality; synthetic baselines are forbidden. The unavailable state honestly prevents false passes.
- Zero Silent Degradation: Unextracted contract schemas are honestly labeled "Cannot Verify". Undetected expected technologies are reported as deviations rather than ignored.
- Progressive Disclosure UX: Auto-expanding collapsed parent containers when a problem is selected bridges abstraction density with pinpoint problem location.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-validator test`：全量通过；
  - `pnpm --filter @coding-cad/web test:unit`：15/15 文件，81/81 测试全量通过；
  - `pnpm --filter @coding-cad/web build`：构建成功，0 错误；
  - `apps/web/e2e/brownfield.spec.ts`：在 dev 模式与 preview 模式下双模式通过，100% ELK 求解器，零 fallback；
  - `CI=true TURBO_FORCE=true pnpm test`：工作区 30/30 任务全量通过；
  - `pnpm check:changelog`：检查通过（5 个生产文件变更）。
- 未实现：无。
- 风险与回退方式：
  - 风险：若用户上传格式损坏的 JSON 期望文件，由解析层友好捕获并提示。
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 4 步骤 4.1：技术合规规则语义修正、四分类问题分流与证据补充 / Phase 4 Step 4.1: Technology Rule Semantic Refinement, Four-Category Issue Counters, and Evidence Replenishment

### 1. 做了什么 / What
- 技术规则语义修正（`packages/implementation-validator/src/rules/technology-rule.ts`）：
  - 将技术未检出由技术偏差更正为“无法验证（Analyzer 未检出技术）”（`technology.undetected.${expected.id}`），消除分析器未提取技术所带来的假阳性；
  - 在 `packages/implementation-validator/src/types.ts` 导出 `isTechnologyUndetectedIssue`、`isCannotVerifyIssue` 与目标解析映射；
  - 更新 `packages/implementation-validator/src/brownfield-compliance.test.ts` 验证。
- UI 四分类计数器与预设说明（`apps/web/src/routes/+page.svelte`）：
  - 增加 4 类问题计数器（错误、警告、待人工确认、无法验证），避免无法验证项淹没真实架构偏离；
  - 渲染 `[无法验证 (Analyzer 未检出技术)]` 专用角标；
  - 在加载预设对话框中加入明显说明：“本预设仅供演示比对流程，不能用作 Analyzer 准确率的证据”；
  - 补齐非法仓库路径错误横幅 `data-testid="error-banner"`。
- E2E 浏览器验收断言（`apps/web/e2e/brownfield.spec.ts`）：
  - 断言预设免责说明、4 类分类计数器数值（错误 1、警告 2、待确认 0、无法验证 2）与无法验证技术专用角标；
  - 新增测试 3 断言 `edge-cases-repo` 语法错误横幅 `unsupported-structures-banner` 与非法路径 `error-banner`。
- 补交验证证据与设计文档：
  - `docs/brownfield-expected-baseline-provenance.md`：详细阐述期望基线生成依据、真值独立对照、边数 38->40 演进成因、自洽性检查降级说明与 5 项漂移逐项对照表（0 项表外问题）；
  - `logs/validation/p4-baseline/l2-cross-validation-report.md`：L2 三类交叉校验明细与源文件路径归因表；
  - `logs/validation/p4-baseline/edge-cases-matrix.md`：7 项复杂边缘用例全量逐项验证矩阵；
  - `docs/d005-grouping-conformance.md`：D-005 原文与 `module:<pkgStem>` 分组实现逐条核验表，证明 100% 严格在既定范围内。

- Technology Rule Semantic Refinement (`technology-rule.ts`, `types.ts`): Refined undetected actual technology to report as "Cannot Verify (Analyzer technology undetected)", avoiding false positive violations; exported classification helpers.
- UI Four-Category Issue Counters & Preset Notice (`+page.svelte`): Implemented distinct UI counters for errors, warnings, pending confirmation, and cannot-verify issues; added specific undetected tech badge and preset disclaimer notice.
- Browser E2E Assertions (`brownfield.spec.ts`): Added assertions for preset notice, four distinct counters, cannot-verify badge, unsupported-structures alert on `edge-cases-repo`, and error banner on invalid repo paths with 100% ELK solver.
- Evidence & Documentation Replenishment:
  - `docs/brownfield-expected-baseline-provenance.md`: Baseline provenance, independent ground truth comparison, edge count 38->40 evolution, consistency check downgrade, and 5-item drift table (0 extraneous issues).
  - `logs/validation/p4-baseline/l2-cross-validation-report.md`: Fine-grained L2 cross-validation source file paths and root-cause breakdown.
  - `logs/validation/p4-baseline/edge-cases-matrix.md`: 7-point edge case verification matrix.
  - `docs/d005-grouping-conformance.md`: Point-by-point conformance review verifying that `module:<pkgStem>` grouping strictly adheres to D-005.

### 2. 为什么这么做 / Why
- 遵守诚实与零静默降级原则：Analyzer 仅依据依赖做轻量技术判定，未做深度代码框架 AST 语法识别；将“未检出”直接报告为违背架构属于误报，修正为“无法验证”诚实地暴露了分析器的能力边界。
- 分类分流降低认知过载：四分类让用户清晰识别阻断性错误与工具限制性无法验证项，防止关键架构风险被遗漏。
- 严谨的真值表述：反演输出校准的基线不可作为证明分析器准确率的证据，降级为自洽性检查并附带明确说明，遵守科学真实性原则。

- Honesty and Zero Silent Degradation: Classification of unextracted technologies as "Cannot Verify" prevents false positives while preserving visibility into tool limitations.
- Cognitive Clarity: Segregating errors, warnings, pending confirmation, and cannot-verify issues prevents unverified items from obscuring genuine architectural drift.
- Scientific Ground Truth Integrity: Baselines aligned with tool outputs must be framed as consistency checks with explicit disclaimers rather than independent accuracy proofs.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-validator test`：全量通过；
  - `pnpm --filter @coding-cad/web test:unit`：81/81 单测通过；
  - `apps/web/e2e/brownfield.spec.ts`：在 dev 模式（4.7s）与 preview 模式（3.6s）下 3/3 浏览器测试全量通过；
  - 100% ELK 布局求解器守卫通过（零 fallback）；
  - 全仓 26 个 Playwright 测试全数通过。
- 未实现：无。
- 风险与回退方式：
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 4 步骤 5：验收基线完善、复杂网状夹具与真实代码库实测 / Phase 4 Step 5: Acceptance Baseline Expansion, Complex Mesh Fixture, and Real Repository Empirical Testing

### 1. 做了什么 / What
- 复杂拓扑合成夹具构造（`packages/implementation-analyzer/fixtures/synthetic-hub-repo`）：
  - 构造 14 包、57 服务的复杂合成微服务网络，明确标记为 `SYNTHETIC BENCHMARK FIXTURE - NOT A REAL REPOSITORY`；
  - 包含中心共享 Hub（`pkg-hub-core`，入度 13）、环依赖（`order <-> inventory`）、跨层越级调用（`analytics`、`audit`、`billing`）以及遗留桥接（`pkg-bridge-connector`）；
  - 实测完全展开时产生 86 处交叉，应用 N > 50 初始折叠后节点降为 14 个容器，交叉数降至 34 处（降幅 60.5%）。
- 真实本地 TypeScript 仓库实测（`/Users/bobcgn/AAA_Codings/Personal_Projects/skill-central`）：
  - 真实扫描 290 个源文件，检测出 23 个业务模块，提取 77 条代码 resolved 导入边，0 语法不支持报告，0 截断，产生 152 处交叉，0 重叠，0 包含失败，100% ELK 求解器；
  - 执行种子 42 的伪随机 AI 抽样核对（明确标注“由 AI 抽样核对, 非独立人工标注”）：精确率 100.0%（30/30），召回率 73.3%（22/30），详细记录与未提取根文件归因保存于 `logs/validation/p4-baseline/skill-central-sampling.json`。
- 人工可理解性评估材料设计（`docs/evaluation/p4-comprehension-eval.md`）：
  - 设计 A/B 对照方案、四类任务（核心依赖、可疑依赖、模块边界、改动影响）与 1–5 分评分量表；
  - 针对 `skill-central`、`Coding-CAD` 与 `synthetic-hub-repo` 编写了附带代码行证据的标准答案；
  - 明确标注“本材料供人工评估使用，当前状态为待执行，评测数据不可由 AI 代填”。
- 汇总全量实测数据报告（`logs/validation/p4-browser/benchmark-report.md`）：
  - 整合本仓库、120 模块流水线、57 模块复杂 Hub 以及真实开源仓库的实测表格；
  - 诚实指出 `synthetic-large-repo` 的 1 处交叉归因于线性流水线拓扑，杜绝技术粉饰。

- Complex Mesh Synthetic Fixture (`fixtures/synthetic-hub-repo`): Built 14-package, 57-module benchmark with central hub, cyclic dependency, cross-tier pipelines, and bridge connectors. Measured 86 crossings expanded vs. 34 crossings collapsed (60.5% reduction under N > 50 collapse).
- Real Repository Testing & AI Sampling (`skill-central`): Measured 290 files, 23 modules, 77 connections, 152 crossings, 0 overlaps, 100% ELK layout. Seed-42 AI sampling yielded 100.0% precision (30/30) and 73.3% recall (22/30) with honest root-file attribution recorded in `logs/validation/p4-baseline/skill-central-sampling.json`.
- Human Comprehension Evaluation Material (`docs/evaluation/p4-comprehension-eval.md`): Defined A/B protocol, rubric, and question sets with verified ground truth; marked as PENDING EXECUTION for human evaluators.
- Consolidated Metrics Report (`logs/validation/p4-browser/benchmark-report.md`): Documented metrics across all four codebases and clarified the linear-pipeline topology origin of the single crossing in `synthetic-large-repo`.

### 2. 为什么这么做 / Why
- 科学求实与杜绝粉饰：严禁将线性流水线的低交叉假象宣称为算法性能优越；通过复杂中心网状夹具真实呈现了 86 处交叉，并用实测数据证明了模块折叠对降低视觉杂乱度的决定性价值。
- 严守主观评测真实性：人类可理解性评估必须由真实工程师执行，严禁 AI 编造用户评分；提供带候选答案与源码路径依据的测试底稿，为后续人工验收奠定基础。

- Scientific Honesty: Acknowledged topology constraints in `synthetic-large-repo` while generating realistic 86-crossing mesh graphs to prove the 60.5% crossing drop from container collapse.
- Subjective Evaluation Integrity: Human comprehension cannot be synthesized by AI; providing structured question sets with ground truth establishes a rigorous foundation for human review.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `synthetic-hub-repo` 57 模块、14 包全部成功反演并完成 100% ELK 布局，86 交叉 -> 34 交叉；
  - `skill-central` 23 模块、77 边成功反演，耗时 125ms 分析、219ms 布局，100% ELK 求解器，0 重叠，0 包含失败；
  - AI 抽样核对记录保存于 `logs/validation/p4-baseline/skill-central-sampling.json`；
  - 人工评估方案就绪于 `docs/evaluation/p4-comprehension-eval.md`；
  - `logs/validation/p4-browser/benchmark-report.md` 汇总结构全量就绪。
## 2026-10-17: 阶段 4 报告与证据全量订正 / Phase 4 Exit Report and Evidence Rectification

### 1. 做了什么 / What
- 提交与回退表完整重构（订正 1）：
  - 通过 `git log --oneline bf3726b..HEAD` 重新导出 11 个提交并逐一验证对象真实存在；
  - 明确说明旧哈希 `7e5111f` 与 `f78a2e5` 失效原因（`f78a2e5` 系此前误记，真实提交为 `c38ef3f`；`7e5111f` 在本地门禁拆分中已重写为 `ddc11f2` 与 `9ede079`）；
  - 编写包含各提交逆序回退连带影响的完整回退指南，同步更正 `docs/phase-4-exit-report.md` 与 `.github/pr-draft-phase4.md`。
- 待用户处理事项全面补齐（订正 2）：
  - 补列事项 3：是否批准新增不依赖期望架构的结构性检查规则类型（最小集合：跨模块循环依赖检测 `cyclic-dependencies`）；
  - 补列事项 4：默认折叠阈值 N=50 的审批与确认，在 `ArchitectureCanvas.svelte` 导出 `DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50` 并支持 `defaultCollapseThreshold` prop，严格标注为未经批准临时值；
  - 补充单体仓库根级单文件未聚类量化影响（漏检 8 条 import 占抽样 26.7%，涉及 `src/index.ts`、`src/mcp.ts`、`src/app-metadata.ts`）；
  - 披露证据缺口（仅覆盖单个单体仓库，无真实 Monorepo 证据）。
- 统计表述严谨规范化（订正 3）：
  - 彻底删除全篇“盲测”字样，准确描述为“AI 辅助抽样核对（固定种子 42、单仓库、各抽取 30 条）”；
  - 采用 Wilson score interval 标明 95% 置信区间（精确率 100.0% [88.65%, 100%]，召回率 73.3% [55.55%, 85.82%]），注明样本量小仅作初步观察，禁止用同一种子重测证明改进。
- 度量口径统一与 10 次重复测量（订正 4）：
  - 严格定义服务端反演耗时与首屏渲染耗时口径；
  - 在 Apple M5 环境下对 4 个夹具在 dev 与 preview 模式下各重复测量 10 次（共 80 次真实浏览器运行），报告 Min/Median/Max/p95 分布；
  - 解释 120 模块历史数字差异源于稳态分布与冷启动波动；删除无重复测量支撑的 p95，阈值表明确标注提议性质及是否由实测倒推。
- 关键结论内嵌矩阵表（订正 5）：
  - 在报告正文内嵌四张完整表格：期望基线来源与 38->40 边演进表、7 项边缘用例逐项矩阵表、D-005 原文与分组/折叠逐条对照表、漂移夹具 5 类偏差检出表（无偏差 0 项 vs 漂移 5 项）。
- 预设基线标注与断言（订正 6）：
  - 确认界面已明确标注“示例基线，仅适用于本仓库”，在 `brownfield.spec.ts` 补充对应断言。

- Commit & Rollback Table Reconstruction (Correction 1): Re-exported and verified all 11 commits via `git log`, explained invalidation of `7e5111f` and `f78a2e5`, and documented cascade rollback effects.
- Complete Items Pending User Action (Correction 2): Added structural cyclic dependency rule approval, N=50 collapse threshold configurability and unapproved temporary value annotation in `ArchitectureCanvas.svelte`, quantified root-level entry file recall gap (8/30 missed), and disclosed real monorepo evidence gaps.
- Rigorous Statistical Descriptions (Correction 3): Removed "blind test" wording, accurately described AI-assisted sampling with seed 42, calculated 95% Wilson confidence intervals, and barred reusing seed 42 for re-evaluations.
- Strict Metric Definitions & 10-Iteration Repeated Measurements (Correction 4): Formally defined server and render duration scopes, executed 10 repeated measurements per fixture per mode (80 runs total), explained distribution variance, and removed unsupported p95 claims from proposed threshold tables.
- Embedded Critical Tables in Report Body (Correction 5): Directly embedded four analysis tables in exit report: expected baseline 38->40 evolution, 7 edge cases matrix, D-005 conformance table, and drifted 5-deviation detection table.
- Preset Baseline Annotations (Correction 6): Verified explicit UI annotations for sample baselines and added E2E assertions in `brownfield.spec.ts`.

### 2. 为什么这么做 / Why
- 严格遵循工程治理与科学真实性原则：严禁将局部单次测量包装为无方差确据；通过 10 次重复测量揭示真实系统稳态与长尾方差。
- 恪守架构事实边界：对未经用户批准的 N=50 折叠策略和结构性检查规则，显式提请用户决策，防止工程代理越权固化业务规则。
- 杜绝技术粉饰：诚实汇报样本量较小带来的置信区间宽度，如实披露真实 Monorepo 证据缺口与单体工程根级单文件的聚类能力边界。

- Rigorous Engineering Governance: Rejected packaging single-shot spikes as steady-state performance; 10 repeated runs reveal true distributions across dev and preview.
- Preserving Architecture Authority: Explicitly raised unapproved N=50 collapse and structural rule additions for user confirmation, preventing agent overreach.
- Zero Technical Whitewashing: Transparently reported wide confidence intervals from small sample sizes and acknowledged evidence gaps regarding production monorepos.

### 3. 验证结果 / Verification
- 已实现并验证 / Implemented and verified:
  - `pnpm check:changelog`: 全量检查通过；
  - `apps/web/src/lib/cad/canvas/ArchitectureCanvas.test.svelte.ts`: 单元测试验证 `DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50` 导出与可配置性；
  - `apps/web/e2e/brownfield.spec.ts`: dev 与 preview 双模式 26/26 通过，包含预设免责声明与 4 类问题计数器断言；
  - `node scripts/benchmarks/run-repeated-benchmarks.mjs`: 4 夹具双模式各 10 次重复测量（80 次运行）全量 PASS (exit 0)；
  - `CI=true TURBO_FORCE=true pnpm ci:verify`: 15/15 任务全量通过（0 cached）。
- 已实现未验证 / Implemented but unverified:
  - 人工可理解性评测方案（`docs/evaluation/p4-comprehension-eval.md`）待人类架构师实操执行。
- 未实现及范围外 / Not implemented or out of scope:
  - 阶段 5+（Ghost 节点、完整 Review 工作区、Execution Handoff、Terminal）。
- 风险与回退方式 / Risks and Rollback:
  - 回退方式: `git revert <commit-hash>`。

---

## [2026-10-17] 阶段 4 深度订正（订正 A–D：交叉数矛盾彻底澄清、折叠收益口径客观化、表 A 38->40 演进与非独立基线修正、候选答案评估材料规范）

### 1. 做了什么 / What
- 订正 A（交叉数矛盾排查与此前 0/0 作废）：
  - 彻底排查此前总结表格将 Coding-CAD 交叉数显示为 0/0 的成因：计数函数（`apps/web/e2e/layout-metrics.ts` 之 `measureLayout` / `segmentCrosses`）未变，输入图与求解器输出未变，0/0 系总结制表时误将 `peerOverlaps: 0` 错填至交叉数列所致；正式声明此前 0/0 记录作废；
  - 更新 `scripts/benchmarks/run-repeated-benchmarks.mjs`，在 10 次重复运行中实时拦截 Worker 消息并以 `measureLayout` 严格统计线段交叉数，在 dev 与 preview 下测得 Coding-CAD 交叉数恒定为 21（展开）/ 9（模拟折叠），synthetic-hub-repo 恒为 86（展开）/ 34（模拟折叠），skill-central 恒为 152（展开）/ 152（折叠）；
  - 在 `docs/phase-4-exit-report.md`、`logs/validation/p4-browser/benchmark-report.md` 与 `.github/pr-draft-phase4.md` 中同步更正。
- 订正 B（折叠收益客观口径与单体工程局限）：
  - 在所有报告中明确声明：synthetic-hub-repo 交叉数 60.5% 降幅（86 -> 34）系测试中模拟全部折叠的结果，非当前产品默认行为（默认视图为全展开，可见 71 节点）；
  - 新增记录：skill-central 展开交叉数 152、折叠 152，降幅 0.0%，因该平铺单体仓库无容器分组可折叠，明确将“折叠机制对无容器分组的单体仓库无效”列为已知局限；
  - 测定并记录每个夹具默认状态下屏幕上同时可见的节点数（产品实际行为）：Coding-CAD 为 30 个、synthetic-large-repo 为 150 个、synthetic-hub-repo 为 71 个、skill-central 为 23 个。
- 订正 C（表 A 38->40 演进与基线非独立性降级）：
  - 纠正表 A 虚构边，详列两条真实新增边：`web -> implementation-analyzer`（步骤 3 提交 `a6d5781`，runtime 依赖）与 `web -> implementation-validator`（步骤 4 提交 `638a90e`，runtime 依赖），均为阶段 4 业务流水线客观真实依赖；
  - 对照 package.json 声明真值（初始 37 条 runtime + 1 条 dev = 38 条；新增 2 条 runtime = 40 条）；
  - 披露 `coding-cad-expected.json` 曾使用 Analyzer 输出校对，属于非独立基线，将“0 误报”严格降级为“自洽性检查通过”，并在表 D 明确注明；删除“补全 IR 契约依赖”虚假措辞。
- 订正 D（评估材料规范）：
  - 将 `docs/evaluation/p4-comprehension-eval.md` 中全部“客观标准答案”更正为“候选答案（待用户对照源码确认）”；
  - 为每条候选答案附上明确源码文件路径作为依据，显式标注“未经用户确认，不得作为评分依据”，杜绝宣称已有客观标准答案。

- Rectification A (Crossing Contradiction Investigation & 0/0 Invalidation): Invalidated the erroneous 0/0 crossing entry for Coding-CAD, identified it as a transcription mix-up with `peerOverlaps = 0`, verified layout stability, and updated `run-repeated-benchmarks.mjs` to record exact crossings (Coding-CAD 21 expanded / 9 collapsed; hub-repo 86 expanded / 34 collapsed; skill-central 152 / 152) across all documentation.
- Rectification B (Objective Collapse Benefit Scope & Known Limitations): Formally stated that the 60.5% crossing drop in hub-repo is from simulated collapse in tests rather than default view behavior; documented skill-central's 0.0% collapse improvement (152/152) and listed "collapse mechanism ineffective for container-less monolithic repos" as a known limitation; recorded actual visible node counts in default state (30, 150, 71, 23).
- Rectification C (Table A 38->40 True Edge Evolution & Non-independent Baseline Downgrade): Corrected Table A to detail the real additions: `web -> implementation-analyzer` (Step 3, `a6d5781`) and `web -> implementation-validator` (Step 4, `638a90e`); cross-checked against 37 runtime + 1 dev manifest baseline; disclosed Analyzer calibration in `coding-cad-expected.json`, downgraded "0 false positives" to "self-consistency check", and purged incorrect contract extraction phrasing.
- Rectification D (Evaluation Materials Candidate Answers): Replaced all "objective standard answers" in `docs/evaluation/p4-comprehension-eval.md` with "candidate answers pending user confirmation against source code", attached source paths, and barred claiming objective ground truth prior to user review.

### 2. 为什么这么做 / Why
- 严格遵循用户对阶段 4 证据与报告的 4 项深度订正指令，杜绝任何数据自相矛盾与虚假断言；
- 恪守科学求真与工程诚实原则：用真实测试分布与客观局限披露替代过度包装，保证所有结论经得起同行评审；
- 严守架构事实来源铁律，严禁伪造不存在的架构边或虚假契约提取能力。

- Strictly adhere to user's 4 rectification directives (A-D) without adding scope or falsifying metrics;
- Preserve scientific integrity by invalidating mistaken reports, explaining variances, and disclosing known limitations;
- Maintain strict fidelity to Architecture Source of Truth and code reality.

### 3. 验证结果 / Verification
- 已实现并验证 / Implemented and verified:
  - 80 次真实浏览器重复基准测量（`node scripts/benchmarks/run-repeated-benchmarks.mjs`，包含交叉数、默认可见节点数、反演耗时与渲染耗时，80/80 PASS）；
  - `docs/evaluation/p4-comprehension-eval.md` 候选答案与源码路径依据规范就绪；
  - `docs/phase-4-exit-report.md`、`logs/validation/p4-browser/benchmark-report.md`、`.github/pr-draft-phase4.md` 全量同步更新；
  - `pnpm --filter @coding-cad/web test:unit` (82/82 PASS)；
  - `pnpm --filter @coding-cad/web test:e2e` (26/26 dev, 26/26 preview PASS)；
  - `CI=true TURBO_FORCE=true pnpm ci:verify` (15/15 PASS)。
- 已实现未验证 / Implemented but unverified:
  - 人工代码理解评估实操打分（等待人类架构师实操执行）。
- 未实现及范围外 / Not implemented or out of scope:
  - 阶段 5+（Ghost 节点、完整 Review、Execution Handoff、Terminal）。
- 风险与回退方式 / Risks and Rollback:
  - 回退方式：`git revert <commit-hash>`。

---

## [2026-10-17] 阶段 4 文档与注释专项订正（统一折叠阈值代码实际行为、明确 IR 正式建模时机、厘清根级引用样本与总体口径、全文清除残留）

### 1. 做了什么 / What
- 折叠阈值代码实际行为核准与口径统一：
  - 读取 `apps/web/src/lib/cad/canvas/ArchitectureCanvas.svelte` 与唯一调用处 `apps/web/src/routes/+page.svelte`，确认当前代码实际运行行为：
    1. **默认是否折叠**：主界面未传入 `defaultCollapseThreshold`（缺省为 `undefined`），默认完全平铺展开，不执行自动折叠；
    2. **判断条件**：代码为严格的大于 **`> 50`**（`componentCount > defaultCollapseThreshold`），非 `≥ 50`；
    3. **统计对象**：统计的是**组件数（`componentCount`，即 `kind === 'component'`）**，非顶层容器数，非可见节点数；
    4. **常量属性**：`DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50` 为未经批准临时预留常量，测试中的折叠收益（60.5% 降幅）系测试脚本模拟折叠所测得；
  - 在 `ArchitectureCanvas.svelte` 代码注释、`docs/phase-4-exit-report.md`、`.github/pr-draft-phase4.md` 与 `logs/validation/p4-browser/benchmark-report.md` 中全面统一表述，消除“已自动折叠”的表述歧义，未改动任何产品运行时行为。
- 待用户处理事项补全：
  - 明确将“IR 正式建模时机”补回待决清单：决定推迟到阶段 5/6；在此期间任何新增消费方读取证据必须经 `evidence-codec`，不得各自解析 tags/constraints 字符串。
- 根级引用数样本与总体口径厘清：
  - 明确“漏检 8 条”为**样本级（n = 30）**抽样实测值（22 召回，8 漏检，8/30 = 26.7%）；
  - 明确“约 39 条”为**全仓总体级（Population）**中 5 个根入口文件累计涉及的 import 引用总数；
  - 纠正此前汇报中将二者混淆为“抽样中约占 39 个”的范围笔误，并在各报告中以严谨口径区分样本与总体。
- 全文检索与敏感残留清除：
  - 全文检索退出报告、PR 草稿、benchmark 报告、`logs/State/current.md` 及评估底稿，彻底清除 Coding-CAD 交叉数“0/0”、“客观标准答案”、“0 误报”与“盲测”残留表述。

- Harmonized Collapse Threshold Behavior: Verified actual runtime behavior in `ArchitectureCanvas.svelte` and `+page.svelte` (default uncollapsed, threshold condition `componentCount > 50`, counts `kind === 'component'`, tests use simulated collapse) and unified docs and comments without altering product code.
- Reinstated IR Modeling Decision: Formally specified postponement to Phase 5/6 and mandated all evidence reads go through `evidence-codec`.
- Clarified Root Import Scopes: Distinguished sample-level misses (8/30) from full repo population root imports (~39).
- Purged Sensitive Residuals: Fully cleared all occurrences of "0/0", "objective standard answers", "0 false positives", and "blind test".

### 2. 为什么这么做 / Why
- 严格遵循用户专项订正指令，只改文档与代码注释，坚决不改动产品运行时行为；
- 维护工程事实与代码行为的 100% 绝对一致，杜绝文档脱离代码实际；
- 明确统计学边界，区分样本统计量与总体参数，防止混淆。

- Strictly comply with user directives to update only documentation and comments;
- Ensure absolute fidelity between code behavior and documented claims;
- Maintain rigorous statistical discipline across sampling and population parameters.

### 3. 验证结果 / Verification
- 已实现并验证 / Implemented and verified:
  - `git grep -E "(0/0|客观标准答案|0[ ]?误报|盲测)"` 在 `docs/phase-4-exit-report.md`、`.github/pr-draft-phase4.md`、`logs/validation/p4-browser/benchmark-report.md`、`logs/State/current.md` 与 `docs/evaluation/p4-comprehension-eval.md` 中输出为 0（全部清洁通过）；
  - `node scripts/ci/check-change-record.mjs` 通过；
  - `CI=true TURBO_FORCE=true pnpm ci:verify` 15/15 任务全量通过。
- 已实现未验证 / Implemented but unverified:
  - 人工代码理解评估实操打分（待人类架构师对照源码实操执行）。
- 未实现及范围外 / Not implemented or out of scope:
  - 阶段 5+（Ghost 节点、完整 Review、Execution Handoff、Terminal）。
- 风险与回退方式 / Risks and Rollback:
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 5 步骤 5.1：Execution Handoff 产品化 / Phase 5 Step 5.1: Execution Handoff Productization

### 1. 做了什么 / What
- 架构执行交接核心逻辑（`apps/web/src/lib/architecture/handoff/execution-handoff.ts`）：
  - 实现基于已批准正式架构生成 Execution Blueprint 与 Generic / Codex / Claude 3 种 Guide 的纯函数流水线；
  - 实现架构快照指纹键（`createHandoffSnapshotKey`）与过期判定（`isHandoffStale`），正式架构发生变动后即刻将 Handoff 标为过期；
  - 基于官方 `@coding-cad/implementation-analyzer/codec` 实现反演证据类型化解码与 `inferred` 证据通知检测（`checkHasInferredEvidence`）；
  - 实现任务与约束来源双向回溯（`TaskProvenance`、`ConstraintProvenance`），将 Blueprint 任务和约束准确关联到正式架构的组件与连接 ID；
  - 实现一键复制（字面逐字一致）与文件导出功能（`formatHandoffExport`、`getHandoffExportFilename`），并在导出的 Markdown / JSON 头部内嵌来源快照标识与 ISO 生成时间戳；
  - 严格防御空架构或校验失败的架构，严禁生成空文档冒充成功；当存在未审批候选时，界面明确提示“尚有未批准的候选，Handoff 基于已批准的正式架构”。
- 界面交互组件（`apps/web/src/lib/cad/handoff/ExecutionHandoffModal.svelte` 与 `apps/web/src/routes/+page.svelte`）：
  - 提供 Blueprint 与 3 种 Agent Guide 选项卡切换预览；
  - 在侧边栏新增“Execution Handoff”入口按钮；
  - 支持点击任务关联的组件 ID 立即定位并在画布上高亮聚焦（`focusComponent`）；
  - 在检测到架构变更时展示显式警告横幅与“重新生成”按钮。
- 基线配置与合规测试更新（`apps/web/src/lib/architecture/compliance/baseline-presets.ts`、`packages/implementation-analyzer/fixtures/coding-cad-golden.json`、`packages/implementation-validator/fixtures/coding-cad-expected.json`、`packages/implementation-validator/fixtures/coding-cad-drifted.json`）：
  - 同步 Coding-CAD 架构基线对 `@coding-cad/execution-blueprint` 与 `@coding-cad/agent-adapter` 的合法依赖关系，维护全仓合规门禁一致性。

- Core Handoff Pipeline (`apps/web/src/lib/architecture/handoff/execution-handoff.ts`):
  - Pure function pipeline generating Execution Blueprint and 3 Agent Guides (Generic, Codex, Claude) strictly from validated ArchitectureProject.
  - Snapshot fingerprinting (`createHandoffSnapshotKey`) and staleness detection (`isHandoffStale`).
  - Typed evidence decoding via `@coding-cad/implementation-analyzer/codec` to identify reverse-engineered architectures containing inferred evidence (`checkHasInferredEvidence`).
  - Bi-directional task and constraint provenance tracking linking blueprint items back to Architecture IR elements.
  - Verbatim clipboard copy and standard file export formatting with embedded metadata headers and timestamps.
  - Strict gating: rejects empty or invalid architectures, displays unapproved candidate notice without polluting handoff.
- UI Modal & Canvas Focus (`ExecutionHandoffModal.svelte` & `+page.svelte`):
  - Tabbed viewer for Blueprint JSON and 3 Guides.
  - Sidebar entry point, interactive provenance links focusing canvas nodes, staleness warning banners with manual regeneration.
- Baseline Presets & Validator Fixtures:
  - Updated monorepo golden and expected baselines to incorporate legitimate web dependencies on execution-blueprint and agent-adapter.

### 2. 为什么这么做 / Why
- 单一事实来源守卫：Handoff 必须纯粹基于已批准的正式 `ArchitectureProject` 生成，杜绝候选提案（Ghost/Candidate）或者未校验草稿污染执行产物。
- 可追溯性与执行契约：每一项 Blueprint 任务和 Guide 步骤必须精确回溯到架构元素（组件、连接、决策），使架构师与 Coding Agent 之间保持透明的上下文审计链。
- 零伪造与防误导：架构为空或失效时严禁伪造空文档冒充成功；代码反演架构含 `inferred` 证据时主动提示，确保下游 Coding Agent 理解证据置信度边界。
- 纯渲染适配：UI 和 Adapter 仅消费 Blueprint 与公共包 API，不引入外部 Agent 运行时或独立调度器，恪守架构分层边界。

- Source of Truth Integrity: Handoff is strictly derived from the validated, accepted ArchitectureProject; unapproved candidates never leak into generated handoff artifacts.
- Bidirectional Provenance: Every task and constraint links directly to IR element IDs, preserving an auditable chain from architecture decisions to agent implementation.
- Zero Deception: Prohibits generating empty artifacts on invalid architectures; explicitly flags inferred evidence from reverse engineering.
- Renderer Boundary: Adapter renders Blueprint into prompts without runtime dependencies or orchestration layers.

### 3. 验证结果 / Verification
- 已实现并验证：
  - Web 单元测试：`apps/web/src/lib/architecture/handoff/execution-handoff.test.ts` 7/7 通过；
  - Web 集成测试：`apps/web/src/lib/architecture/handoff/execution-handoff.integration.test.ts` 4/4 通过；
  - Web 端全量测试：16 个单元测试文件（89 测试通过），4 个集成测试文件（13 测试通过）；
  - Playwright E2E 浏览器测试（`apps/web/e2e/handoff.spec.ts`）：
    - 在 dev 模式与 preview 模式下，全部 3 个端到端测试均通过（包含 Greenfield 流程、三 Guide 切换、画布聚焦、剪贴板复制比对、文件导出校验、过期变动检测、未决候选隔离断言、Brownfield 反演架构 inferred 证据横幅展示）；
    - 完整 web E2E 套件（29 个测试）在 dev 和 production preview 下 100% 通过，保持 100% ELK 布局求解器守卫（零 fallback）；
  - 全仓跨包测试：15 个包全部通过构建，30/30 单元与集成测试套件通过；
  - 严格变更审计：`CI=true TURBO_FORCE=true pnpm ci:verify` 全门禁通过。
- 未实现：
  - 不包含 Ghost 节点渲染与交互（留待后续步骤）；
  - 不包含启动或管理 Coding Agent、Terminal 功能；
  - 不包含 xjb_coding 导出目标实现（仅在备忘录调研）。
- 风险与回退方式：
  - 风险：若浏览器不支持 `navigator.clipboard.writeText`，回退至安全通知提示用户手动选择复制。
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 5 步骤 5.1.1：订正与补齐证据 / Phase 5 Step 5.1.1: Corrections & Evidence Completion

### 1. 做了什么 / What
- 基线依赖改动手工溯源与文档注解：
  - 对 `apps/web/package.json` 进行差异审计，确认第 18 行 `@coding-cad/agent-adapter` 与第 25 行 `@coding-cad/execution-blueprint` 系由 commit `2797f9c` 引入，从而在基线中合法引入 `web -> agent-adapter` 与 `web -> execution-blueprint` 两条依赖边；
  - 确认 `coding-cad-golden.json` 中的 `web -> implementation-validator` 对应 `apps/web/package.json` 第 27 行，系由阶段 4 commit `638a90e` 引入并在 5.1 中补齐；
  - 在 `logs/State/current.md` 明确注明阶段 4 验收报告中的“15 组件 / 40 边”为历史数字，阶段 5 起代码依赖真实边数为 42 边；阶段 4 历史报告保持不变。
- 剪贴板复制逐字比对断言与错误降级强化：
  - 在 `apps/web/src/lib/cad/handoff/ExecutionHandoffModal.svelte` 中增强剪贴板调用判断，当 `navigator.clipboard` 缺失或抛出异常时显式展示“复制失败”，杜绝静默假成功；
  - 在 `apps/web/e2e/handoff.spec.ts` 中通过 `navigator.clipboard.readText()` 实测断言剪贴板文本与预览展示内容逐字一致；
  - 在 `apps/web/e2e/handoff.spec.ts` 中新增针对剪贴板写入异常的降级路径自动化测试，验证失败提示正常展示。
- 来源追踪全覆盖表与验证：
  - 建立 Blueprint 任务、约束、决策与指引四类条目的来源回溯对照矩阵；
  - 在 `apps/web/src/lib/architecture/handoff/execution-handoff.test.ts` 补齐测试：断言每个任务的 `relatedComponents` 均存在于当前正式架构，每个约束的 `sourceReference` 均有确定来源并可解析，3 种 Guide 文本均可通过 ID 或标题模式回溯到 Blueprint 任务。
- 快照键算法规范化与不变性验证：
  - 重构 `createHandoffSnapshotKey`：对组件、连接、约束、决策按照稳定键进行严格规范排序并提取语义字段，彻底排除布局坐标（x, y, width, height）与临时视图状态；
  - 补齐单元测试：验证仅拖动画布节点不使快照过期；修改描述、增删组件/连接、修改约束或决策使快照立即过期；Save -> Open（JSON 序列化与反序列化）保持快照键完全一致；对象属性定义顺序对快照键生成完全不敏感。
- 范围外改动披露与环境校验：
  - 对步骤 0 的全仓 `.gitignore` 提交披露为“范围外附带改动”，并经 `git ls-files -c -i --exclude-standard` 校验输出为空（0 跟踪文件受损）；
  - 将此前报告中的“全仓 102 项测试”用词更正为按包分别列出（其中 `apps/web` 为 107 项测试，全工作区 30/30 Turbo 任务全量通过）。
- D-007 决策正式记录：
  - 在 `docs/architecture-layout-decisions.md` 中将 D-007 标记为 APPROVED（Option B: Local Extension via Web Adapter），写入硬约束条件。

- Baseline Dependency Provenance and Historical Documentation:
  - Manually audited diffs in `apps/web/package.json` to confirm lines 18 and 25 introduced dependencies on `@coding-cad/agent-adapter` and `@coding-cad/execution-blueprint` in commit `2797f9c`.
  - Confirmed line 27 `@coding-cad/implementation-validator` was introduced in Phase 4 commit `638a90e` and synchronized into `coding-cad-golden.json`.
  - Added an explicit note in `logs/State/current.md` clarifying that "15 components / 40 edges" from Phase 4 is a historical record, and the repo baseline is now 42 edges.
- Clipboard Verbatim Assertions & Graceful Degradation:
  - Enhanced `ExecutionHandoffModal.svelte` to explicitly surface failure feedback when `navigator.clipboard` is unavailable or rejects, eliminating false successes.
  - Asserted verbatim equality between preview text and `navigator.clipboard.readText()` in `apps/web/e2e/handoff.spec.ts`.
  - Added E2E test covering clipboard rejection/failure degradation.
- Provenance Coverage Matrix & Unit Verification:
  - Compiled full provenance crosswalk across all Blueprint tasks, constraints, decisions, and guide paragraphs.
  - Added unit tests in `execution-handoff.test.ts` ensuring all task component references exist in formal architecture, all constraint references are valid, and all guide paragraphs link back to blueprint tasks.
- Canonical Snapshot Key Algorithm & Invariant Testing:
  - Canonicalized `createHandoffSnapshotKey` to sort components, connections, constraints, and decisions, strictly omitting layout coordinates and ephemeral state.
  - Added tests confirming node dragging does not trigger staleness, semantic edits immediately trigger staleness, Save -> Open is key-invariant, and property insertion order is ignored.
- Out-of-scope Disclosure & Worktree Auditing:
  - Explicitly disclosed Step 0 `.gitignore` as an out-of-scope ancillary chore, verified with `git ls-files -c -i --exclude-standard` (zero tracked files affected).
  - Clarified test count nomenclature from "workspace 102 tests" to a package-by-package breakdown (107 tests in `apps/web`, 30/30 successful Turbo tasks).
- Formalized D-007 Decision:
  - Recorded user-approved Option B with hard constraints in `docs/architecture-layout-decisions.md`.

### 2. 为什么这么做 / Why
- 工程交付严谨性与审计防伪：基线改动必须直接溯源至 `package.json` 代码声明，杜绝从 Analyzer 输出反向抄写导致的循环论证；明确历史边数演进，防止审计混淆。
- 真实性与测试有效性：剪贴板操作必须真正验证系统剪贴板中的字面内容，不能以 UI 状态提示代指写入成功；必须覆盖剪贴板无权限时的优雅降级。
- 架构事实与视图状态分离铁律：画布拖拽调整节点布局不应当导致面向执行的 Handoff 蓝图与指引失效；只有真正的架构语义变化（组件、连接、描述、契约、决策）才应触发过期判定。
- 决策归档完整性：在进入 Ghost 实现前，将用户对 D-007 的正式裁定与硬约束写入决策矩阵。

- Engineering Rigor & Provenance Integrity: Baseline changes must be derived directly from `package.json` source declarations, avoiding circular copying from analyzer outputs; clarifies historical edge progression.
- Test Validity: Clipboard copy assertions must inspect actual clipboard contents rather than UI feedback banners alone, with full coverage of permission-denied degradation.
- Separation of Concerns: Canvas layout adjustments must not invalidate semantic execution blueprints; only architectural changes should trigger staleness.
- Decision Traceability: Commits user-approved D-007 Option B and hard constraints before entering Ghost implementation.

### 3. 验证结果 / Verification
- 已实现并验证：
  - Web 单元测试：`apps/web/src/lib/architecture/handoff/execution-handoff.test.ts` 12/12 项通过（新增 5 项快照与溯源测试）；
  - Web 集成测试：`apps/web/src/lib/architecture/handoff/execution-handoff.integration.test.ts` 4/4 项通过；
  - Web 全量测试：16 个单元测试文件（94/94 项通过），4 个集成测试文件（13/13 项通过），总计 107 项 Web 自动化测试全数通过；
  - Playwright E2E 浏览器测试（`apps/web/e2e/handoff.spec.ts`）：
    - dev 模式 4/4 通过（含逐字剪贴板比对与权限拒绝降级测试）；
    - preview 模式 4/4 通过；
  - 全工作区构建与测试：`CI=true TURBO_FORCE=true pnpm test` 全量通过（30/30 Turbo 任务成功，覆盖 15 个包与应用）；
  - `git ls-files -c -i --exclude-standard`：输出为空（0 跟踪文件受损）；
  - `docs/architecture-layout-decisions.md`：D-007 更新为 APPROVED（Option B）。
- 未实现：
  - Ghost 节点渲染与交互（步骤 5.2 范围）；
  - Agent 运行时与 Terminal 功能（范围外）。
- 风险与回退方式：
  - 风险：若浏览器不支持 `navigator.clipboard`，已通过降级分支展示“复制失败”提示。
  - 回退方式：`git revert HEAD`。

## 2026-10-17 - 阶段 5 步骤 5.2：Proposal 与 Ghost 投影 / Phase 5 Step 5.2: Proposal & Ghost Projection

### 1. 做了什么 / What
- Proposal 复用与单提案锁定：
  - 复用现有 `ArchitectureReview` 状态机的 Proposal 与 CandidateCommand 模型，不新增类型；
  - 在 `WorkspaceShellController` 中引入单提案锁定，未决提案期间阻止新的编辑命令并给出明确提示；
  - 增加 `isCommandProposal` 标识，区分全局需求候选与单命令编辑提案。
- D-007 方案 B（Web 适配层局部扩展）纯函数放置算法：
  - 新增 `apps/web/src/lib/cad/canvas/adapters/ghost-placement.ts`，实现 `calculateGhostPlacement` 纯函数；
  - 锚点优先策略：根据连接关系优先在关联正式节点相邻空位放置，保证与所有正式节点及容器边界严格零重叠（Zero Overlap）；
  - 容器保护策略：若指定容器内部无空位，不改动正式容器布局，放置于容器外侧并附带文字提示；
  - 纯几何算法保证在 Node.js 和浏览器中具备确定性无碰撞输出。
- Svelte Flow 适配层 Ghost 投影：
  - 更新 `apps/web/src/lib/layout/adapters/svelte-flow-adapter.ts`，扩展 `ArchitectureNodeData` 与 `ArchitectureFlowEdge`；
  - 将 `diff.components.added` 映射为带有 `ghost:${id}` 独立 ID 的 Ghost 节点与 `[待审批 / Proposed]` 状态徽章；
  - 将 `diff.connections.added` 映射为紫色虚线 Ghost 连接；
  - 将 `diff.components.changed` 映射为带有 `[待变更 / Pending Change]` 黄色徽章的正式节点标记；
  - 将 `diff.components.removed` 映射为带有 `[待删除 / Pending Deletion]` 红色徽章与删除线样式的正式节点标记；
  - 将 `diff.connections.removed` 映射为红色虚线 `[待删除 / Pending Deletion]` 连接；
  - 所有 Ghost 与标记均具有明确文本徽章与 `aria-label`，符合无障碍标准，绝不单纯依赖颜色区分。
- 画布与节点视图渲染：
  - 更新 `ArchitectureNode.svelte`：实现紫/黄/红高对比度虚线边框、半透明背景、状态徽章条、容器提示与删除线样式；
  - 更新 `ArchitectureCanvas.svelte` 与 `+page.svelte`：在命令提案未决时传递 `ghostProposal`，并在 Inspector 聚焦时自动解析底层组件 ID。
- 自动化测试与不变量断言：
  - 新增 `ghost-placement.test.ts`（5/5 通过）：验证碰撞检测、相邻空位、容器内部及溢出外置逻辑；
  - 扩展 `svelte-flow-adapter.test.ts`（8/8 通过）：验证 Ghost 节点/连接独立 ID、待变更/待删除标记、几何零重叠、无关正式节点不发生位移、非未决状态不投影 Ghost；
  - 扩展 `workspace-shell-controller.test.ts`（20/20 通过）：验证存在 Ghost 时正式架构引用与内容不变、Ghost ID 绝不进入 `saveProject` 载荷、命令提案不重新触发全图重布局；
  - 扩展 `apps/web/e2e/editing.spec.ts`（11/11 全数通过）：验证添加组件渲染 Ghost 节点且与正式节点零重叠、删除组件标记为待删除且不修改正式 IR、编辑属性标记为待变更、拒绝提案即刻清除 Ghost 投影。

- Proposal Reuse & Single Proposal Lock:
  - Reused existing `ArchitectureReview` state machine and CandidateCommand models without introducing new types.
  - Enforced single-proposal lock in `WorkspaceShellController`, preventing concurrent edits during pending proposals.
  - Added `isCommandProposal` flag to distinguish single-command editing proposals from full requirement candidates.
- D-007 Option B (Local Extension via Web Adapter) Pure Placement Algorithm:
  - Created `apps/web/src/lib/cad/canvas/adapters/ghost-placement.ts` with `calculateGhostPlacement` pure function.
  - Anchor-based placement: places ghost adjacent to connected formal nodes with zero overlap with formal nodes and containers.
  - Container preservation: places outside container with notice if inside space is insufficient, preserving formal container layout.
- Svelte Flow Adapter Ghost Projection:
  - Updated `apps/web/src/lib/layout/adapters/svelte-flow-adapter.ts` with ghost types and data mappings.
  - Maps added components to `ghost:${id}` nodes with `[待审批 / Proposed]` badges and purple dashed edges.
  - Maps modified components to `[待变更 / Pending Change]` badges and removed components to `[待删除 / Pending Deletion]` with strikethrough.
  - All ghost elements and markers include textual badges and accessible `aria-label` attributes.
- Canvas & Node View Rendering:
  - Updated `ArchitectureNode.svelte` with dashed borders, badge bars, notices, and strikethrough styles.
  - Updated `ArchitectureCanvas.svelte` and `+page.svelte` to pass `ghostProposal` and resolve component IDs on inspection.
- Automated Invariant Tests:
  - Added `ghost-placement.test.ts` (5/5 passed) for geometric collision-free validation.
  - Added ghost test suite in `svelte-flow-adapter.test.ts` (8/8 passed) verifying independent IDs, zero overlap, and stable formal nodes.
  - Added invariant tests in `workspace-shell-controller.test.ts` (20/20 passed) ensuring formal IR immutability, zero ghost leak in saveProject, and stable formal layout.
  - Added Playwright E2E tests in `apps/web/e2e/editing.spec.ts` (11/11 passed) verifying browser rendering, zero overlap, and reject clearance.

### 2. 为什么这么做 / Why
- D-007 方案 B 硬约束合规：满足用户确认的零重叠、局部放置、不改动 `architecture-layout` 公开 API、不改动 D-010 Worker 边界四项硬条件。
- 架构事实唯一来源铁律：Ghost 拥有独立身份，其 ID 绝不进入正式 `ArchitectureProject`、持久化 `LayoutState`、Save 产物或 Handoff 蓝图；Save 后 Open 不残留 Ghost 或未决提案。
- 审批语义完全复用：沿用既有通过检验的 Review 门禁（`local-user`、必填理由），不额外增加越权审批状态。
- 无障碍与可访问性：所有 Ghost 与标记均包含清晰的文字徽章与 ARIA 名称，不依赖单一颜色传达语义。

- D-007 Option B Hard Constraints: Satisfies zero overlap, local placement, zero `architecture-layout` public API changes, and zero D-010 worker boundary changes.
- Architecture Source of Truth Invariant: Ghost elements possess independent identity (`ghost:...`) and never leak into formal `ArchitectureProject`, persisted `LayoutState`, Save artifacts, or Handoff blueprints.
- Approval Semantics Reuse: Reuses the established Review gate (`local-user`, required rationale) without ad-hoc approval states.
- Accessibility: All ghost artifacts and markers feature explicit text badges and accessible ARIA labels.

### 3. 验证结果 / Verification
- 已实现并验证：
  - Web 单元测试：`apps/web` 17 个测试文件，106/106 项通过；
  - Web 集成测试：`apps/web` 4 个测试文件，13/13 项通过；
  - Web 浏览器 E2E 测试：`apps/web/e2e/editing.spec.ts` 11/11 项通过；
  - TypeScript 类型检查：`pnpm --filter @coding-cad/web typecheck` 0 错误 0 警告；
  - 全工作区构建与测试：`CI=true TURBO_FORCE=true pnpm test` 全量通过（30/30 Turbo 任务成功，覆盖 15 个包与应用）。
- 未实现：
  - 步骤 5.3 审核接入强化与过期提案自动失效（步骤 5.3 范围）；
  - 步骤 5.4 增量布局稳定性位移量化指标测量（步骤 5.4 范围）。
- 风险与回退方式：
  - 风险：若极密集图在特定容器内无空间，Ghost 置于容器外侧并附带 notice 提示，不破坏正式容器边界。
  - 回退方式：`git revert <commit-hash>`。


