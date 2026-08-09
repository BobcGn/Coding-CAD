# 当前证据链 / Current Evidence Chain

更新时间 / Updated at: 2026-08-09 00:35 CST (Asia/Shanghai)

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

## 本轮验证记录 / Current Validation Records

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
