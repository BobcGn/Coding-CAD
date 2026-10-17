# Phase 5 Test Count & Evidence Reconciliation / 阶段 5 测试数量与证据对齐记录

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
环境 / Environment: macOS (Darwin 24.3.0), Node.js v22.18.0, pnpm 10.34.1, Playwright (Chromium Headless), ELK.js 0.12.0  
验证模式 / Gate Mode: `CI=true TURBO_FORCE=true pnpm ci:verify` (可写环境，源码重建，严格无缓存，ELK 硬门禁)

---

## 1. 逐包原始测试输出索引表 / Package-by-Package Raw Test Output Index

所有 13 个 `packages/` + 2 个 `apps/` 均单独执行并捕获原始 stdout/stderr 输出，全部退出码均为 0 (Success)：

| 序号 | 包名 / 目录 (Package / Directory) | 执行命令 (Command) | 原始日志路径 (Log Path) | 状态 (Status) | 测试套件/测试数说明 (Test Count Details) |
| --- | --- | --- | --- | --- | --- |
| 1 | `@coding-cad/agent-adapter` (`packages/agent-adapter`) | `pnpm test` | [`agent-adapter.log`](./agent-adapter.log) | PASS | 1 suite (adapter tests passed) |
| 2 | `@coding-cad/architecture-agent` (`packages/architecture-agent`) | `pnpm test` | [`architecture-agent.log`](./architecture-agent.log) | PASS | 1 suite (agent tests passed) |
| 3 | `@coding-cad/architecture-dsl` (`packages/architecture-dsl`) | `pnpm test` | [`architecture-dsl.log`](./architecture-dsl.log) | PASS | 1 suite (parser tests passed) |
| 4 | `@coding-cad/architecture-ir` (`packages/architecture-ir`) | `pnpm test` | [`architecture-ir.log`](./architecture-ir.log) | PASS | 1 suite (architecture-project tests passed) |
| 5 | `@coding-cad/architecture-layout` (`packages/architecture-layout`) | `pnpm test` | [`architecture-layout.log`](./architecture-layout.log) | PASS | 2 unit suites + 5 integration suites (7 dist test bundles, passes, elk-adapter, compiler, elk-engine, incremental-layout, ghost-layout, performance-budget) |
| 6 | `@coding-cad/architecture-review` (`packages/architecture-review`) | `pnpm test` | [`architecture-review.log`](./architecture-review.log) | PASS | 1 suite (review state machine tests passed) |
| 7 | `@coding-cad/architecture-validator` (`packages/architecture-validator`) | `pnpm test` | [`architecture-validator.log`](./architecture-validator.log) | PASS | 1 suite (validator tests passed) |
| 8 | `@coding-cad/cli` (`packages/cli`) | `pnpm test` | [`cli.log`](./cli.log) | PASS | 1 integration suite + 1 e2e suite (2 suites passed) |
| 9 | `@coding-cad/component-registry` (`packages/component-registry`) | `pnpm test` | [`component-registry.log`](./component-registry.log) | PASS | 1 suite (registry tests passed) |
| 10 | `@coding-cad/execution-blueprint` (`packages/execution-blueprint`) | `pnpm test` | [`execution-blueprint.log`](./execution-blueprint.log) | PASS | 1 suite (generator tests passed) |
| 11 | `@coding-cad/implementation-analyzer` (`packages/implementation-analyzer`) | `pnpm test` | [`implementation-analyzer.log`](./implementation-analyzer.log) | PASS | 2 suites (evidence-codec + analyzer tests passed) |
| 12 | `@coding-cad/implementation-validator` (`packages/implementation-validator`) | `pnpm test` | [`implementation-validator.log`](./implementation-validator.log) | PASS | 3 suites (compliance + analyzer-compatibility + validator tests passed) |
| 13 | `@coding-cad/workspace` (`packages/workspace`) | `pnpm test` | [`workspace.log`](./workspace.log) | PASS | 1 suite (workspace tests passed) |
| 14 | `@coding-cad/server` (`apps/server`) | `pnpm test` | [`server.log`](./server.log) | PASS | 占位命令 (`server: no tests yet`) |
| 15 | `@coding-cad/web` Unit (`apps/web`) | `pnpm test:unit` | [`web-unit.log`](./web-unit.log) | PASS | 12 test files, **117 passed tests** |
| 16 | `@coding-cad/web` Integration (`apps/web`) | `pnpm test:integration` | [`web-integration.log`](./web-integration.log) | PASS | 2 test files, **13 passed tests** |
| 17 | `@coding-cad/web` E2E (`apps/web`) | `pnpm test:e2e` | [`web-e2e.log`](./web-e2e.log) | PASS | 8 spec files, **37 passed in Dev + 37 passed in Preview (Total 74 browser tests)** |

---

## 2. 核心 5 包零改动核对 / 5 Core Packages Zero Changes Audit

指令核验：`git diff --stat main..HEAD packages/architecture-layout packages/architecture-ir packages/architecture-review packages/execution-blueprint packages/agent-adapter`

```text
 packages/agent-adapter/.gitignore       | 6 ++++++
 packages/architecture-ir/.gitignore     | 6 ++++++
 packages/architecture-layout/.gitignore | 6 ++++++
 packages/architecture-review/.gitignore | 6 ++++++
 packages/execution-blueprint/.gitignore | 6 ++++++
 5 files changed, 30 insertions(+)
```

### 核验结论 (Audit Conclusion)
1. **代码与测试零变动**：上述 5 个核心包中，未修改任何 `src/**` 源码，未修改任何 `src/**/*.test.ts` 测试文件，未修改任何 `package.json` 依赖；
2. **仅有的变动性质**：仅在 commit `7400cd4` 中为各包添加了 `.gitignore`（忽略 `dist/` 与 `.turbo/`），属于已在报告中披露的**范围外附带改动 (out-of-scope chore)**，绝无任何架构或运行时语义污染。

---

## 3. 测试数量与历史报告差异解释 / Test Count Reconciliation & Historical Diff Analysis

### 3.1 历史报告数字差异原因 (Root Cause of Historical Test Count Differences)
1. **Node 聚合运行器 vs Vitest 发现规则**：
   - 基础包（如 `architecture-layout`）使用 Node 原生执行器运行编译后的 `dist/*.test.js` 入口文件，共计 7 个测试 bundle（`passes.test.js`, `elk-adapter.test.js`, `compiler.test.js`, `elk-engine.test.js`, `incremental-layout.test.js`, `ghost-layout.test.js`, `performance-budget.test.js`）；
   - 若使用源码扫描工具（如 vitest）或按 `src/**/*.test.ts` 查找，源码目录中近邻放置了 9 个测试源文件；历史文档中有时统计为“7 个编译测试套件”，有时统计为“9 个测试源码模块”，二者系统计口径不同，底层测试内容完全一致。
2. **Web 端测试分层与数量演进**：
   - 阶段 4 结束时，Web 端单元测试为 65 个；
   - 阶段 5 引入 Handoff 预览与导出（+15 tests）、Ghost 放置纯适配器（+6 tests）、Ghost Review 门禁（+12 tests）、Svelte Flow Ghost 投影（+19 tests），使 Web 单元测试总数增加至 **117 个**；
   - Web 集成测试保持为 **13 个**（覆盖 Greenfield 工作流与 Brownfield 还原流水线）；
   - Web 浏览器 E2E 测试从阶段 4 的 30 个增加至 **37 个**（新增 4 个 Handoff E2E、3 个 Ghost 增删改 E2E，以及 1 个多场景 Ghost 稳定性真实浏览器基准），并在 Dev 和 Preview 两个配置下完整运行（各 37 个，共 74 个执行用例）。
3. **边数历史数据订正 (Edge Count Correction)**：
   - 阶段 4 报告提及“15 组件 / 40 边”，在阶段 5.1 细化真实 package.json 声明与 Analyzer 依赖关系时，经严谨比对确认为 42 边；
   - 历史报告保留历史事实记录，当前基线统一订正为 42 边。

---

## 4. 全量 CI 运行证据与阶段耗时 / Full CI Verify Evidence & Stage Durations

全量原始输出保存在 [`ci-verify.log`](./ci-verify.log)。

### 运行环境与阶段耗时统计 (Execution Durations by CI Stage)

```text
CI=true TURBO_FORCE=true pnpm ci:verify
```

| CI 阶段 (Stage) | 执行内容 (Command) | 耗时 (Duration) | 判定结果 (Result) | 关键指标 / 证据 (Key Metrics / Evidence) |
| --- | --- | --- | --- | --- |
| 1. 安全审计 (Security Audit) | `pnpm security:audit` | 0.8s | PASS | 0 vulnerabilities (audit-level: high) |
| 2. 代码检查 (Lint & Typecheck) | `pnpm lint` (`lint:workspace` + `turbo typecheck`) | 7.2s | PASS | 15 packages/apps 全部类型检查通过 |
| 3. 变更记录审计 (Changelog Check) | `pnpm check:changelog` | 0.3s | PASS | 变更记录格式合规 |
| 4. 密钥泄露扫描 (Secrets Scan) | `pnpm security:secrets` | 0.2s | PASS | 0 secrets detected |
| 5. 提交信息校验 (Commitlint) | `pnpm commitlint` | 0.2s | PASS | Conventional Commits 格式合规 |
| 6. 单元测试 (Unit Tests) | `pnpm test:unit` | 5.8s | PASS | 13 packages + web unit (117 passed) 全部通过 |
| 7. 集成测试 (Integration Tests) | `pnpm test:integration` | 4.1s | PASS | cli, layout, web integration (13 passed) 全部通过 |
| 8. 浏览器端端测试 (E2E Tests) | `pnpm test:e2e` | 108.4s | PASS | **37 Dev + 37 Preview = 74 浏览器用例全部通过**，ELK 硬门禁 0 fallback，0 peer overlaps |
| 9. 全量生产构建 (Full Build) | `pnpm build` | 22.7s | PASS | 15/15 packages/apps 生产打包成功 |
| **总门禁耗时 (Total CI Time)** | — | **~150s** | **ALL PASS** | 严格遵循可写环境与真实源码重建原则 |
