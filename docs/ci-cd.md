# CI/CD Pipeline / CI/CD 流水线

Coding CAD uses a lightweight CI/CD gate before code is pushed or merged.

Coding CAD 在代码推送和合并前使用轻量 CI/CD 门禁。

## Source Trace / 来源追溯

The pipeline maps the project checks to the PR Skills repository at `https://github.com/BobcGn/pr-skills`, commit `e211f14d4ea196ab46c573ee4ac610cf331318eb`.

本流水线将项目检查映射到 PR Skills 仓库 `https://github.com/BobcGn/pr-skills`，参考提交为 `e211f14d4ea196ab46c573ee4ac610cf331318eb`。

## Local Gate / 本地门禁

Run the same deterministic checks locally before pushing:

推送前可在本地运行同一组确定性检查：

```bash
pnpm ci:verify
```

This command runs workspace structure checks, type checks, change-record checks, secret scanning, unit tests, integration tests, end-to-end tests, and build verification.

该命令会执行 workspace 结构检查、类型检查、变更记录检查、硬编码敏感信息扫描、单元测试、集成测试、端到端测试和构建验证。

## GitHub Actions / GitHub Actions

The repository defines one workflow:

仓库定义了一条 workflow：

- `.github/workflows/ci.yml`: PR/push gate for linting, changelog traceability, commit format, secret scan, tests, build, and dependency audit.

- `.github/workflows/ci.yml`：PR/push 门禁，覆盖代码规范、变更记录追溯、提交格式、敏感信息扫描、测试、构建和依赖审计。

CodeQL is intentionally not enabled as an automatic workflow yet because GitHub code scanning is not enabled for this repository. Add CodeQL after repository settings can accept CodeQL SARIF uploads.

当前没有将 CodeQL 作为自动 workflow 启用，因为本仓库尚未启用 GitHub code scanning。等仓库设置能够接收 CodeQL SARIF 上传后，再接入 CodeQL。

## PR Skills Mapping / PR Skills 映射

| PR Skill | Automated Gate | Notes |
| --- | --- | --- |
| Linting & Code Style Inspector | `pnpm lint` | Uses workspace structure checks plus TypeScript type checking. |
| Changeset & Changelog Generator | `pnpm check:changelog` | Requires logs, docs, changelog, or changeset updates when production code changes. |
| Test & Codecov Assessor | `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` | Keeps the three test layers explicit. Codecov upload can be added once coverage instrumentation exists. |
| CodeQL & Security Scanner | `pnpm security:secrets`, `pnpm security:audit` | Covers hardcoded secrets and dependency audit now; CodeQL is deferred until GitHub code scanning is enabled. |
| Commit Message Formatter | `pnpm commitlint` in CI | Enforces Conventional Commits over the pushed commit range. |

| PR Skill | 自动化门禁 | 说明 |
| --- | --- | --- |
| Linting & Code Style Inspector | `pnpm lint` | 使用 workspace 结构检查和 TypeScript 类型检查。 |
| Changeset & Changelog Generator | `pnpm check:changelog` | 生产代码变化时要求同步日志、文档、changelog 或 changeset。 |
| Test & Codecov Assessor | `pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e` | 明确保留三层测试入口。覆盖率上传会在覆盖率插桩存在后再接入。 |
| CodeQL & Security Scanner | `pnpm security:secrets`、`pnpm security:audit` | 当前覆盖硬编码敏感信息和依赖审计；CodeQL 等 GitHub code scanning 启用后再接入。 |
| Commit Message Formatter | CI 中的 `pnpm commitlint` | 对推送提交区间强制 Conventional Commits。 |
