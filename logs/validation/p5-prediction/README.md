# Phase 5 Step 5.8 Ghost Predictive Placement Validation Artifacts / 阶段 5 步骤 5.8 Ghost 预测位置验证产物

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
环境 / Environment: macOS (Darwin 24.3.0), Node.js v22.18.0, pnpm 10.34.1, Playwright (Chromium Headless), ELK.js 0.12.0  
验证模式 / Gate Mode: `CI=true TURBO_FORCE=true pnpm ci:verify` (可写环境，源码重建，严格无缓存，ELK 硬门禁)

---

## 1. 产物清单 / Artifact Inventory

| 文件名 (Filename) | 类别 (Category) | 描述 (Description) | 状态 (Status) |
| --- | --- | --- | --- |
| [`ci-verify.log`](./ci-verify.log) | 全量 CI 验证日志 | `CI=true TURBO_FORCE=true pnpm ci:verify` 完整标准输出/错误输出，包含 Turborepo 全部 15 项任务，74 项浏览器测试与代码类型/格式检查 | **全部通过 (100% Passed, 0 Failures)** |
| [`latency-distribution-dev.json`](./latency-distribution-dev.json) | 试算延迟分布 (Dev) | Dev 模式下 8 个场景（6 Add + 1 Connect + 1 Remove）各进行 10 次连续试算布局的延迟采样数据（min, median, max, samples） | **实测 131~251ms (中位数 ~141~211ms)** |
| [`latency-distribution-preview.json`](./latency-distribution-preview.json) | 试算延迟分布 (Preview) | Preview 模式下 8 个场景各进行 10 次连续试算布局的延迟采样数据（min, median, max, samples） | **实测 108~182ms (中位数 ~114~178ms)** |

---

## 2. 8 场景实测度量概览 / 8-Scenario Empirical Summary

| 场景与目标 (Scenario & Target) | 运行模式 (Mode) | 最小延迟 (Min) | 中位数延迟 (Median) | 最大延迟 (Max) | 预测与最终位移 (Pred-Final Diff) | 求解器 (Solver) | 重叠数 (Overlaps) | 判定 (Verdict) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield Add: AuditService | Dev / Preview | 132.1 / 114.8 ms | 141.1 / 119.2 ms | 145.4 / 130.9 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Add: PaymentGateway | Dev / Preview | 134.6 / 112.5 ms | 141.3 / 121.1 ms | 143.8 / 129.8 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Add: RedisCache (exterior) | Dev / Preview | 133.2 / 113.5 ms | 142.0 / 121.5 ms | 143.6 / 124.3 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: Telemetry (far anchor) | Dev / Preview | 188.0 / 168.8 ms | 200.7 / 177.9 ms | 224.5 / 182.0 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: DocGen (near anchor) | Dev / Preview | 192.5 / 171.5 ms | 211.7 / 174.9 ms | 251.5 / 182.2 ms | **0.0 px** | elk | 0 | PASS |
| Medium Add: IsolatedMock (fallback) | Dev / Preview | 191.5 / 171.5 ms | 201.3 / 174.9 ms | 209.6 / 182.6 ms | **0.0 px** | elk | 0 | PASS |
| Greenfield Connect: DB -> Events | Dev / Preview | 136.8 / 112.7 ms | 141.5 / 118.5 ms | 147.3 / 125.0 ms | N/A | elk | 0 | PASS |
| Greenfield Remove: Events | Dev / Preview | 131.7 / 108.8 ms | 139.4 / 114.4 ms | 160.1 / 120.7 ms | N/A | elk | 0 | PASS |

---

## 3. 核心约束达成结论 / Core Invariant Compliance

1. **零位移误差**：全部 6 组 Add 提案的预测位置与接受后最终位置位移严格为 **0.0px**；
2. **零持久化污染**：试算结果绝不写入 `layoutState`、撤销栈、Save 产物、Handoff 产物；
3. **零几何重叠**：Ghost 节点与正式节点、容器边界重叠数严格为 0；
4. **硬求解器门禁**：100% 走 Web Worker 中的 ELK.js 求解器，0 次降级；
5. **稳定性预算**：无关节点位移严格为 0.0px，完全满足预算；
6. **时延上限**：所有试算测量结果远低于 5000ms 临时上限。
