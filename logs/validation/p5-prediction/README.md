# Phase 5 Step 5.8 Ghost Predictive Placement Validation Artifacts / 阶段 5 步骤 5.8 Ghost 预测位置验证产物

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
环境 / Environment: macOS (Darwin 24.3.0), Node.js v22.18.0, pnpm 10.34.1, Playwright (Chromium Headless), ELK.js 0.12.0  
验证模式 / Gate Mode: `CI=true TURBO_FORCE=true pnpm ci:verify` (可写环境，源码重建，严格无缓存，ELK 硬门禁)

---

## 1. 产物清单 / Artifact Inventory

| 文件名 (Filename) | 类别 (Category) | 描述 (Description) | 状态 (Status) |
| --- | --- | --- | --- |
| [`ci-verify.log`](./ci-verify.log) | 全量 CI 验证日志 | `CI=true TURBO_FORCE=true pnpm ci:verify` 完整标准输出/错误输出，包含 Turborepo 全部任务，74 项浏览器测试、产物门禁检查与代码类型/格式检查 | **全部通过 (100% Passed, 0 Failures)** |
| [`latency-distribution-dev.json`](./latency-distribution-dev.json) | 试算延迟分布 (Dev) | Dev 模式下 8 个场景（6 Add + 1 Connect + 1 Remove）各进行 10 次连续试算布局的延迟采样数据（min, median, max, samples） | **实测 131~251ms (中位数 ~141~211ms)** |
| [`latency-distribution-preview.json`](./latency-distribution-preview.json) | 试算延迟分布 (Preview) | Preview 模式下 8 个场景各进行 10 次连续试算布局的延迟采样数据（min, median, max, samples） | **实测 108~182ms (中位数 ~114~178ms)** |
| [`package-logs/`](./package-logs/) | 逐包原始测试日志目录 | 包含全工作区 15 个包/应用及 CI 生产产物门禁检查的 18 份原始命令标准输出/错误输出日志 | **全部通过 (100% Passed)** |

---

## 2. 逐包原始测试输出索引表 / Package-by-Package Raw Test Output Index

| 序号 | 包名 / 目录 (Package / Directory) | 执行命令 (Command) | 原始日志路径 (Log Path) | 状态 (Status) | 测试套件/测试数说明 (Test Count Details) |
| --- | --- | --- | --- | --- | --- |
| 1 | `@coding-cad/agent-adapter` (`packages/agent-adapter`) | `pnpm test` | [`package-logs/agent-adapter.log`](./package-logs/agent-adapter.log) | PASS | 1 suite (adapter tests passed) |
| 2 | `@coding-cad/architecture-agent` (`packages/architecture-agent`) | `pnpm test` | [`package-logs/architecture-agent.log`](./package-logs/architecture-agent.log) | PASS | 1 suite (agent tests passed) |
| 3 | `@coding-cad/architecture-dsl` (`packages/architecture-dsl`) | `pnpm test` | [`package-logs/architecture-dsl.log`](./package-logs/architecture-dsl.log) | PASS | 1 suite (parser tests passed) |
| 4 | `@coding-cad/architecture-ir` (`packages/architecture-ir`) | `pnpm test` | [`package-logs/architecture-ir.log`](./package-logs/architecture-ir.log) | PASS | 1 suite (architecture-project tests passed) |
| 5 | `@coding-cad/architecture-layout` (`packages/architecture-layout`) | `pnpm test` | [`package-logs/architecture-layout.log`](./package-logs/architecture-layout.log) | PASS | 2 unit suites + 5 integration suites (7 dist test bundles passed) |
| 6 | `@coding-cad/architecture-review` (`packages/architecture-review`) | `pnpm test` | [`package-logs/architecture-review.log`](./package-logs/architecture-review.log) | PASS | 1 suite (review state machine tests passed) |
| 7 | `@coding-cad/architecture-validator` (`packages/architecture-validator`) | `pnpm test` | [`package-logs/architecture-validator.log`](./package-logs/architecture-validator.log) | PASS | 1 suite (validator tests passed) |
| 8 | `@coding-cad/cli` (`packages/cli`) | `pnpm test` | [`package-logs/cli.log`](./package-logs/cli.log) | PASS | 1 integration suite + 1 e2e suite (2 suites passed) |
| 9 | `@coding-cad/component-registry` (`packages/component-registry`) | `pnpm test` | [`package-logs/component-registry.log`](./package-logs/component-registry.log) | PASS | 1 suite (registry tests passed) |
| 10 | `@coding-cad/execution-blueprint` (`packages/execution-blueprint`) | `pnpm test` | [`package-logs/execution-blueprint.log`](./package-logs/execution-blueprint.log) | PASS | 1 suite (generator tests passed) |
| 11 | `@coding-cad/implementation-analyzer` (`packages/implementation-analyzer`) | `pnpm test` | [`package-logs/implementation-analyzer.log`](./package-logs/implementation-analyzer.log) | PASS | 2 suites (evidence-codec + analyzer tests passed) |
| 12 | `@coding-cad/implementation-validator` (`packages/implementation-validator`) | `pnpm test` | [`package-logs/implementation-validator.log`](./package-logs/implementation-validator.log) | PASS | 3 suites (compliance + analyzer-compatibility + validator tests passed) |
| 13 | `@coding-cad/workspace` (`packages/workspace`) | `pnpm test` | [`package-logs/workspace.log`](./package-logs/workspace.log) | PASS | 1 suite (workspace tests passed) |
| 14 | `@coding-cad/server` (`apps/server`) | `pnpm test` | [`package-logs/server.log`](./package-logs/server.log) | PASS | 占位命令 (`server: no tests yet`) |
| 15 | `@coding-cad/web` Unit (`apps/web`) | `pnpm test:unit` | [`package-logs/web-unit.log`](./package-logs/web-unit.log) | PASS | 18 test files, **126 passed tests** |
| 16 | `@coding-cad/web` Integration (`apps/web`) | `pnpm test:integration` | [`package-logs/web-integration.log`](./package-logs/web-integration.log) | PASS | 4 test files, **13 passed tests** |
| 17 | `@coding-cad/web` E2E (`apps/web`) | `pnpm test:e2e` | [`package-logs/web-e2e.log`](./package-logs/web-e2e.log) | PASS | 8 spec files, **37 passed in Dev + 37 passed in Preview (Total 74 browser tests)** |
| 18 | `CI Bundle Checker` (`scripts/ci`) | `pnpm check:prod-bundle` | [`package-logs/bundle-check.log`](./package-logs/bundle-check.log) | PASS | 1 test file, **4 passed tests** (含负控) + 生产产物 0 调试符号泄露 |

---

## 3. 8 场景实测度量概览 / 8-Scenario Empirical Summary

| 场景与目标 (Scenario & Target) | 运行模式 (Mode) | 最小延迟 (Min) | 中位数延迟 (Median) | 最大延迟 (Max) | 预测与最终位移 (Pred-Final Diff) | 求解器 (Solver) | 重叠数 (Overlaps) | 判定 (Verdict) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield Add: AuditService | Dev / Preview | 132.1 / 114.8 ms | 141.1 / 119.2 ms | 145.4 / 130.9 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Add: PaymentGateway | Dev / Preview | 134.6 / 112.5 ms | 141.3 / 121.1 ms | 143.8 / 129.8 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Add: RedisCache (exterior) | Dev / Preview | 133.2 / 113.5 ms | 142.0 / 121.5 ms | 143.6 / 124.3 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: Telemetry (far anchor) | Dev / Preview | 188.0 / 168.8 ms | 200.7 / 177.9 ms | 224.5 / 182.0 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: DocGen (near anchor) | Dev / Preview | 192.5 / 171.5 ms | 211.7 / 174.9 ms | 251.5 / 182.2 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: IsolatedMock (fallback) | Dev / Preview | 191.5 / 171.5 ms | 201.3 / 174.9 ms | 209.6 / 182.6 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Connect: DB -> Events | Dev / Preview | 136.8 / 112.7 ms | 141.5 / 118.5 ms | 147.3 / 125.0 ms | N/A (旁路试算) | elk | 0 | PASS |
| Greenfield Remove: Events | Dev / Preview | 131.7 / 108.8 ms | 139.4 / 114.4 ms | 160.1 / 120.7 ms | N/A (旁路试算) | elk | 0 | PASS |

---

## 4. 核心约束达成结论 / Core Invariant Compliance

1. **零位移误差**：全部 6 组 Add 提案的预测位置与接受后最终位置位移严格为 **0.0px**；
2. **零持久化污染**：试算结果绝不写入 `layoutState`、撤销栈、Save 产物、Handoff 产物；
3. **零几何重叠**：Ghost 节点与正式节点、容器边界重叠数严格为 0；
4. **硬求解器门禁**：100% 走 Web Worker 中的 ELK.js 求解器，0 次降级；
5. **稳定性预算**：无关节点位移严格为 0.0px，完全满足预算；
6. **时延上限**：所有试算测量结果远低于 5000ms 临时上限；
7. **生产产物纯净**：普通 production 产物中 100% 消除所有 `window.__coding_cad_*` 内部验收钩子。
