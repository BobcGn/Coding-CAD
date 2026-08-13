# 当前证据链 / Current Evidence Chain

更新时间 / Updated at: 2026-08-13 CST (Asia/Shanghai)

## 本轮事件源 / Current Event Sources

| 事件 / Event | 来源 / Source | 实施结果 / Result | 证据 / Evidence |
| --- | --- | --- | --- |
| 五个核心模块落文档 / Document five core modules | 用户要求参考 `logs/README.md` / User asked to follow `logs/README.md` | 更新根日志和模块日志 / Updated root and module logs | `logs/State/current.md`、`logs/modules/*` |
| 目录名校正 / Directory-name correction | 用户要求以当前项目目录名为准 / User required current project directory names as source of truth | 使用 `architecture-dsl`、`architecture-validator`、`cli`，删除旧 `dsl`、`validator` | `packages/architecture-dsl`、`packages/architecture-validator`、`packages/cli` |
| Server 迁移 / Server migration | 删除旧 package 前需要解除引用 / References needed removal before deleting old packages | `apps/server` 改用正式 DSL 和 Validator / `apps/server` now uses formal DSL and Validator | `apps/server/src/index.ts`、`apps/server/package.json` |
| 测试分层 / Test layering | 用户要求单元、集成、端到端均存在 / User required unit, integration, and end-to-end tests | 新增独立脚本和跨层集成用例 / Added independent scripts and a cross-layer integration case | `package.json`、`turbo.json`、`packages/cli/src/integration.test.ts`、`packages/cli/src/cli.test.ts` |
| 图完整性 / Graph integrity | 核心逻辑审计发现悬空连接与重复 ID 未诊断 / Core-logic audit found dangling references and duplicate ids were not diagnosed | 新增可解释 Validator 规则 / Added an explainable Validator rule | `packages/architecture-validator/src/rules/graph-integrity-rule.ts` |
| 依赖边界校正 / Dependency-boundary correction | 线性图与实际 package DAG 不一致 / Linear diagram differed from the actual package DAG | 文档改为真实 DAG / Documentation now shows the actual DAG | `packages/README.md` |
| CI/CD 门禁 / CI/CD gate | 用户要求参考 PR Skills 仓库 / User asked to reference the PR Skills repository | 建立本地和 GitHub Actions 检查流水线 / Added local and GitHub Actions check pipeline | `docs/ci-cd.md`、`.github/workflows/ci.yml` |
| CI 失败修复 / CI failure fix | GitHub Actions run `31261956693` 和 `31261956683` / GitHub Actions runs `31261956693` and `31261956683` | 补充 Node 类型并移除自动 CodeQL workflow / Added Node types and removed the automatic CodeQL workflow | `package.json`、`pnpm-lock.yaml`、`.github/workflows/ci.yml` |
| Architecture Agent / Architecture Agent | 用户要求实现第六个核心模块 / User requested the sixth core module | 新增架构推理层 / Added the architecture reasoning layer | `packages/architecture-agent`、`logs/modules/architecture-agent` |
| CLI Design Command / CLI Design Command | 用户要求继续编写下一模块 / User asked to continue with the next module | CLI 接入 Architecture Agent，支持需求到架构蓝图 / CLI now wires Architecture Agent for requirement-to-blueprint design | `packages/cli/src/commands/design.ts`、`packages/cli/src/index.ts`、`packages/cli/src/cli.test.ts` |
| Execution Blueprint / Execution Blueprint | 用户要求实现下一核心模块 / User requested the next core module | 新增架构到外部 Coding Agent 实施蓝图的协议层 / Added the protocol layer from architecture to external Coding Agent implementation blueprints | `packages/execution-blueprint`、`logs/modules/execution-blueprint` |
| Agent Adapter / Agent Adapter | 用户要求实现下一核心模块 / User requested the next core module | 新增 Execution Blueprint 到 Generic、Codex、Claude Code 指导文档的纯渲染层 / Added pure rendering from Execution Blueprint to Generic, Codex, and Claude Code instructions | `packages/agent-adapter`、`logs/modules/agent-adapter` |
| UI / Architecture Layout 骨架 / UI / Architecture Layout skeleton | 用户要求只建立目录与 package 边界 / User requested directory and package boundaries only | 新增唯一 Layout package 骨架并组织 Web UI 目录，不实现行为 / Added the sole Layout package skeleton and organized Web UI directories without behavior | `packages/architecture-layout`、`apps/web/src/lib`、`logs/modules/architecture-layout` |
| UI / Architecture Layout Documentation First | 用户要求先统一边界、风险、测试与 Decision / User requested shared boundaries, risks, tests, and Decisions before implementation | 新增四份设计文档、10 个 Decision、11 个 Checkpoint / Added four design documents, 10 Decisions, and 11 Checkpoints | `docs/ui-architecture.md`、`docs/architecture-layout.md`、`docs/architecture-layout-decisions.md`、`docs/ui-mvp-roadmap.md` |
| Root Coding Agent constraints / 根级 Coding Agent 约束 | 用户要求保留第一铁律并适配新目录 / User requested preserving the First Law while adapting to the new structure | 更新 `AGENTS.md` 的 Layout/UI/Decision/Checkpoint/Terminal 约束 / Updated Layout/UI/Decision/Checkpoint/Terminal constraints in `AGENTS.md` | `AGENTS.md`、`docs/architecture-layout-decisions.md`、`docs/ui-mvp-roadmap.md` |
| UI V1 Master Planning | 用户要求先规划 Phase 0–7、更新 Decisions/Risks/Roadmap 并跑 baseline / User requested Phase 0–7 planning, Decision/Risk/Roadmap updates, and baseline | 新增 Master Plan、canonical crosswalk、Phase gates 与 readiness 结论 / Added the Master Plan, canonical crosswalk, Phase gates, and readiness result | `docs/ui-v1-execution-plan.md`、`docs/architecture-layout-decisions.md`、`docs/ui-mvp-roadmap.md`、`docs/architecture-layout.md` |
| UI eight-stage source reconciliation / UI 八阶段来源复核 | 用户要求从内置浏览器中的原始规划提取八阶段并落地 / User requested extracting the eight stages from the original plan in the in-app browser | 复用并完善既有 Master Plan，新增来源映射与 Phase 1 细化验收，不建立重复体系 / Reused and improved the existing Master Plan with source mapping and refined Phase 1 acceptance instead of creating a duplicate system | `docs/ui-v1-execution-plan.md`、`logs/State/current.md`、`logs/modules/architecture-layout/implementation-log.md`、`logs/modules/web/implementation-log.md` |
| Phase 1 decision closure / Phase 1 决策收尾 | 用户指定内置浏览器 21:03 建议并要求据此执行 / User designated the 21:03 in-app-browser guidance and asked to execute it | 批准 D-003/D-008/D-009，冻结 Phase 2 guardrail，但不开始 UI 实现 / Approved D-003/D-008/D-009 and froze Phase 2 guardrails without starting UI implementation | `docs/architecture-layout-decisions.md`、`docs/ui-v1-execution-plan.md`、`docs/ui-mvp-roadmap.md`、`docs/ui-architecture.md`、`logs/State/current.md` |

## 本轮验证记录 / Current Validation Records

- Master Plan 结构脚本：通过，8 Phases，每个 11 个必填栏目。
- Decision/crosswalk 结构脚本：通过，10 decisions、10 status、10 Final TBD、10 crosswalk。
- Risk Register 结构脚本：通过，15 entries。
- `pnpm lint`：通过，23/23 tasks successful。
- `pnpm build`：通过，15/15 tasks successful。
- `pnpm test`：通过，29/29 tasks successful。
- `AGENTS.md` First Law/关键规则脚本：通过，中英文第一铁律完整，9/9 规则存在，双语检查通过。
- `test ! -e AGENT.md`：通过，未创建重复单数文件。
- Decision 结构脚本：通过，10 decisions、10 status、10 final TBD、10 blocking、10 deadline。
- Roadmap 结构脚本：通过，11 checkpoints，每个包含 Goal/Input/Output/Acceptance Criteria/Known Risks/Non-goals。
- Risk Register 覆盖脚本：通过，12/12 指定风险。
- 空模块检查：通过，`packages/architecture-layout/src/**/*.ts` 仍全部为 `export {};`。
- `git diff --check`：通过。
- `pnpm lint:workspace`：通过，15 modules。
- `pnpm build`：通过，15/15 tasks successful。
- `pnpm test`：通过，29/29 tasks successful。

- Master Plan structure script: passed, 8 Phases with 11 required fields each.
- Decision/crosswalk structure script: passed, 10 decisions, 10 statuses, 10 Final TBD entries, and 10 crosswalk entries.
- Risk Register structure script: passed, 15 entries.
- `pnpm lint`: passed, 23/23 tasks successful.
- `pnpm build`: passed, 15/15 tasks successful.
- `pnpm test`: passed, 29/29 tasks successful.
- `AGENTS.md` First Law/key-rule script: passed; both First Law texts are intact, 9/9 rules are present, and the bilingual check passed.
- `test ! -e AGENT.md`: passed; no duplicate singular file was created.
- Decision structure script: passed with 10 decisions, 10 statuses, 10 final TBD entries, 10 blocking fields, and 10 deadlines.
- Roadmap structure script: passed with 11 checkpoints, each containing Goal/Input/Output/Acceptance Criteria/Known Risks/Non-goals.
- Risk Register coverage script: passed, 12/12 required risks.
- Empty-module check: passed; every `packages/architecture-layout/src/**/*.ts` file remains `export {};`.
- `git diff --check`: passed.
- `pnpm lint:workspace`: passed with 15 modules.
- `pnpm build`: passed, 15/15 tasks successful.
- `pnpm test`: passed, 29/29 tasks successful.

- `pnpm list -r --depth -1`：通过，识别 16 个 workspace projects，包括 `@coding-cad/architecture-layout`。
- `pnpm lint:workspace`：通过，Workspace architecture check passed (15 modules)。
- `pnpm build`：通过，15/15 tasks successful。
- `pnpm test`：通过，29/29 tasks successful。
- `pnpm install --lockfile-only --offline`：通过，downloaded 0、added 0，仅同步 lockfile importer。

- `pnpm list -r --depth -1`: passed; recognized 16 workspace projects including `@coding-cad/architecture-layout`.
- `pnpm lint:workspace`: passed, Workspace architecture check passed (15 modules).
- `pnpm build`: passed, 15/15 tasks successful.
- `pnpm test`: passed, 29/29 tasks successful.
- `pnpm install --lockfile-only --offline`: passed with 0 downloaded and 0 added; only the lockfile importer was synchronized.

- `find logs/modules -maxdepth 3 -type f | sort`：确认新模块日志文件存在、旧 `dsl`/`validator` 日志目录已移除。
- `rg "@coding-cad/(dsl|validator)|packages/(dsl|validator)|logs/modules/(dsl|validator)"`：无输出，确认旧主线引用已清理。
- `pnpm install --no-frozen-lockfile`：通过，workspace lockfile 已更新。
- `pnpm build`：通过，8/8 tasks successful。
- `pnpm typecheck`：通过，12/12 tasks successful。
- `pnpm test`：通过，16/16 tasks successful。
- `pnpm test:unit`：通过，12/12 tasks successful，0 cached。
- `pnpm test:integration`：通过，9/9 tasks successful，0 cached。
- `pnpm test:e2e`：通过，9/9 tasks successful，0 cached。
- `pnpm exec turbo build --force`：通过，8/8 tasks successful，0 cached。
- `pnpm exec turbo typecheck --force`：通过，12/12 tasks successful，0 cached。
- `pnpm exec turbo test --force`：通过，16/16 tasks successful，0 cached。
- `git ls-remote https://github.com/BobcGn/pr-skills.git`：通过，`main` 为 `e211f14d4ea196ab46c573ee4ac610cf331318eb`。
- `pnpm ci:verify`：通过，包含 workspace/typecheck/change-record/secret/commit-message/test/build 门禁。
- `ruby -e 'require "yaml"; ...' .github/workflows/*.yml`：通过，workflow YAML 可解析。
- `git diff --check`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。
- `gh run view 31261956693 --log-failed`：CI 失败点为 `architecture-ir` typecheck 缺少 Node 类型声明。
- `gh run view 31261956683 --log-failed`：CodeQL 扫描完成但 SARIF 上传失败，原因是仓库未启用 code scanning。
- `CI=true pnpm install --frozen-lockfile`：通过，lockfile 可在 CI 模式安装。
- `pnpm --filter @coding-cad/architecture-agent test`：通过。
- `pnpm --filter @coding-cad/cli typecheck`：通过。
- `pnpm --filter @coding-cad/cli test:e2e`：通过，覆盖 `design` 人类报告、JSON 和 YAML 输出。
- `pnpm --filter @coding-cad/execution-blueprint test`：通过。
- `pnpm lint:workspace`：通过，Workspace architecture check passed (10 modules)。
- `CI=true pnpm install --frozen-lockfile`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。
- `pnpm ci:verify`：通过，包含 10 个 workspace package。

- `find logs/modules -maxdepth 3 -type f | sort`: confirms new module log files exist and old `dsl`/`validator` log directories are removed.
- `rg "@coding-cad/(dsl|validator)|packages/(dsl|validator)|logs/modules/(dsl|validator)"`: no output, confirming old mainline references are cleaned.
- `pnpm install --no-frozen-lockfile`: passed, workspace lockfile updated.
- `pnpm build`: passed, 8/8 tasks successful.
- `pnpm typecheck`: passed, 12/12 tasks successful.
- `pnpm test`: passed, 16/16 tasks successful.
- `pnpm test:unit`: passed, 12/12 tasks successful, 0 cached.
- `pnpm test:integration`: passed, 9/9 tasks successful, 0 cached.
- `pnpm test:e2e`: passed, 9/9 tasks successful, 0 cached.
- `pnpm exec turbo build --force`: passed, 8/8 tasks successful, 0 cached.
- `pnpm exec turbo typecheck --force`: passed, 12/12 tasks successful, 0 cached.
- `pnpm exec turbo test --force`: passed, 16/16 tasks successful, 0 cached.
- `git ls-remote https://github.com/BobcGn/pr-skills.git`: passed, `main` is `e211f14d4ea196ab46c573ee4ac610cf331318eb`.
- `pnpm ci:verify`: passed, including workspace/typecheck/change-record/secret/commit-message/test/build gates.
- `ruby -e 'require "yaml"; ...' .github/workflows/*.yml`: passed, workflow YAML parses successfully.
- `git diff --check`: passed.
- `pnpm security:audit`: passed, No known vulnerabilities found.
- `gh run view 31261956693 --log-failed`: CI failed at `architecture-ir` typecheck because Node type declarations were missing.
- `gh run view 31261956683 --log-failed`: CodeQL completed scanning but failed SARIF upload because repository code scanning is not enabled.
- `CI=true pnpm install --frozen-lockfile`: passed, lockfile installs in CI mode.
- `pnpm --filter @coding-cad/architecture-agent test`: passed.
- `pnpm --filter @coding-cad/cli typecheck`: passed.
- `pnpm --filter @coding-cad/cli test:e2e`: passed, covering `design` human report, JSON, and YAML output.
- `pnpm --filter @coding-cad/execution-blueprint test`: passed.
- `pnpm lint:workspace`: passed, Workspace architecture check passed (10 modules).
- `CI=true pnpm install --frozen-lockfile`: passed.
- `pnpm security:audit`: passed, No known vulnerabilities found.
- `pnpm ci:verify`: passed, including 10 workspace packages.
- `pnpm --filter @coding-cad/agent-adapter test`：通过。
- `pnpm lint:workspace`：通过，Workspace architecture check passed (11 modules)。
- `CI=true pnpm install --frozen-lockfile`：通过。
- `pnpm security:audit`：通过，No known vulnerabilities found。
- `pnpm ci:verify`：通过，包含 11 个 workspace package。

- `pnpm --filter @coding-cad/agent-adapter test`: passed.
- `pnpm lint:workspace`: passed, Workspace architecture check passed (11 modules).
- `CI=true pnpm install --frozen-lockfile`: passed.
- `pnpm security:audit`: passed, No known vulnerabilities found.
- `pnpm ci:verify`: passed, including 11 workspace packages.

## 本轮回退引用 / Rollback References

- 回退需恢复旧 `packages/dsl`、`packages/validator`、旧模块日志目录和 server 依赖。
- 回退方式：逐文件恢复/删除，不使用破坏性 Git 命令。

- Rollback must restore old `packages/dsl`, `packages/validator`, old module log directories, and server dependencies.
- Rollback method: restore/remove files individually, without destructive Git commands.
