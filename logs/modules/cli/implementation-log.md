# 实施日志 / Implementation Log

## 2026-08-08 - CLI 完成 / CLI Completed

状态：已验证。

Status: Verified.

变更：实现 `coding-cad validate`、`inspect`、`format`、JSON 输出和友好错误处理。

Changes: implemented `coding-cad validate`, `inspect`, `format`, JSON output, and friendly error handling.

验证：`pnpm --filter @coding-cad/cli test`、`pnpm typecheck`、`pnpm test` 曾通过；本轮将再次跑全仓库验证。

Validation: `pnpm --filter @coding-cad/cli test`, `pnpm typecheck`, and `pnpm test` passed previously; full workspace validation will run again in this slice.

## 2026-08-08 - 测试分层 / Test Layering

状态：已验证。新增 DSL -> IR -> Registry -> Validator 的进程内集成测试，并将现有真实 CLI 子进程测试明确为端到端层。

Status: Verified. Added an in-process DSL -> IR -> Registry -> Validator integration test and explicitly classified the existing real CLI subprocess test as end-to-end coverage.

## 2026-08-09 - Design Command / Design Command

状态：已验证。

Status: Verified.

变更：新增 `coding-cad design <requirement>`，调用 Architecture Agent 生成 Architecture IR，并输出人类报告、JSON 或 YAML。

Change: added `coding-cad design <requirement>`, which calls Architecture Agent to generate Architecture IR and outputs a human report, JSON, or YAML.

验证：`pnpm --filter @coding-cad/cli typecheck`、`pnpm --filter @coding-cad/cli test:e2e` 通过。

Validation: `pnpm --filter @coding-cad/cli typecheck` and `pnpm --filter @coding-cad/cli test:e2e` passed.
