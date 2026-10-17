# Brownfield Expected Architecture Baseline Provenance / 期望架构基线来源说明

## 1. 做了什么 / What

详细记录了 Brownfield 架构工作区中 `coding-cad-expected.json` 期望基线的生成依据、来源溯源、边数演进历史，以及相较于 `packages/README.md` 与实际 `package.json` 的独立对照分析。

Documented the derivation, provenance, edge count evolution, and independent comparison against `packages/README.md` and `package.json` manifests for the `coding-cad-expected.json` baseline in the Brownfield workspace.

---

## 2. 为什么这么做 / Why

- **事实边界与诚实表述**：
  若期望架构文件是根据 Analyzer 的反演输出生成或反向校准的，则该期望文件**不能**作为证明 Analyzer 准确性的独立真值；
  在此场景下，Golden 基线验证得到的 0 项问题只能表述为**“自洽性检查”（Consistency Check）**，即证明期望模型与反演实现模型在相同语义契约下完全自洽，而**严禁表述为“0 误报”**。
- **真值来源对照（Independent Comparison）**：
  依据 `packages/README.md` 中的架构依赖方向表与各个子包的 `package.json` 显式依赖声明，手工整理独立基线对照，记录差异项，不自行设定倾向。

---

## 3. 期望基线独立对照表 / Independent Ground Truth Comparison Table

| 序号 | 依赖边 / Dependency | `packages/README.md` 声明状态 | `package.json` 声明状态 | 源码 resolved import 状态 | 分类与判定 / Category & Judgment |
| --- | --- | --- | --- | --- | --- |
| 1 | `architecture-dsl -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`ast.ts`） | 一致 / Consistent |
| 2 | `architecture-validator -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`validator.ts`） | 一致 / Consistent |
| 3 | `architecture-validator -> component-registry` | 明确依赖 | `runtime` 依赖 | 是（`rules/*.ts`） | 一致 / Consistent |
| 4 | `architecture-layout -> architecture-ir` | 标注为规划中（planned） | `runtime` 依赖 | 是（`layout-engine.ts`） | 差异项：实现超前于文档，属于文档待同步，非解析缺陷 |
| 5 | `component-registry -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`registry.ts`） | 一致 / Consistent |
| 6 | `architecture-agent -> architecture-dsl` | 明确依赖 | `runtime` 依赖 | 是（`agent.ts`） | 一致 / Consistent |
| 7 | `architecture-agent -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`agent.ts`） | 一致 / Consistent |
| 8 | `architecture-agent -> architecture-validator` | 明确依赖 | `runtime` 依赖 | 是（`agent.ts`） | 一致 / Consistent |
| 9 | `architecture-agent -> component-registry` | 明确依赖 | `runtime` 依赖 | 是（`agent.ts`） | 一致 / Consistent |
| 10 | `execution-blueprint -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`blueprint.ts`） | 一致 / Consistent |
| 11 | `execution-blueprint -> architecture-validator` | 明确依赖 | `runtime` 依赖 | 是（`blueprint.ts`） | 一致 / Consistent |
| 12 | `execution-blueprint -> component-registry` | 明确依赖 | `runtime` 依赖 | 是（`blueprint.ts`） | 一致 / Consistent |
| 13 | `agent-adapter -> execution-blueprint` | 明确依赖 | `runtime` 依赖 | 是（`adapter.ts`） | 一致 / Consistent |
| 14 | `implementation-analyzer -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`mapper/*.ts`） | 一致 / Consistent |
| 15 | `implementation-validator -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`validator.ts`） | 一致 / Consistent |
| 16 | `implementation-validator -> execution-blueprint` | 明确依赖 | `runtime` 依赖 | 是（`types.ts`） | 一致 / Consistent |
| 17 | `implementation-validator -> implementation-analyzer` | 明确依赖 | `runtime` 依赖 | 是（`types.ts`） | 一致 / Consistent |
| 18 | `architecture-review -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`review.ts`） | 一致 / Consistent |
| 19 | `architecture-review -> architecture-validator` | 明确依赖 | `runtime` 依赖 | 是（`review.ts`） | 一致 / Consistent |
| 20 | `architecture-review -> workspace` | 明确依赖 | `runtime` 依赖 | 是（`review.ts`） | 一致 / Consistent |
| 21 | `architecture-review -> execution-blueprint` | 未在核心方向表中列出 | `dev` 依赖 | 是（`test/*.ts`） | 差异项：测试辅助依赖，非运行时核心流 |
| 22 | `workspace -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`workspace.ts`） | 一致 / Consistent |
| 23 | `workspace -> architecture-validator` | 明确依赖 | `runtime` 依赖 | 是（`workspace.ts`） | 一致 / Consistent |
| 24 | `workspace -> execution-blueprint` | 明确依赖 | `runtime` 依赖 | 是（`workspace.ts`） | 一致 / Consistent |
| 25 | `cli -> architecture-agent` | 明确依赖 | `runtime` 依赖 | 是（`cli.ts`） | 一致 / Consistent |
| 26 | `cli -> architecture-dsl` | 明确依赖 | `runtime` 依赖 | 是（`cli.ts`） | 一致 / Consistent |
| 27 | `cli -> architecture-ir` | 明确依赖 | `runtime` 依赖 | 是（`cli.ts`） | 一致 / Consistent |
| 28 | `cli -> architecture-validator` | 明确依赖 | `runtime` 依赖 | 是（`cli.ts`） | 一致 / Consistent |
| 29 | `cli -> component-registry` | 明确依赖 | `runtime` 依赖 | 是（`cli.ts`） | 一致 / Consistent |
| 30 | `server -> architecture-dsl` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`server.ts`） | 一致 / Consistent |
| 31 | `server -> architecture-validator` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`server.ts`） | 一致 / Consistent |
| 32 | `web -> architecture-agent` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`controller.ts`） | 一致 / Consistent |
| 33 | `web -> architecture-ir` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`+page.svelte`） | 一致 / Consistent |
| 34 | `web -> architecture-layout` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`canvas/*.svelte`） | 一致 / Consistent |
| 35 | `web -> architecture-review` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`controller.ts`） | 一致 / Consistent |
| 36 | `web -> architecture-validator` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`controller.ts`） | 一致 / Consistent |
| 37 | `web -> component-registry` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`palette.ts`） | 一致 / Consistent |
| 38 | `web -> workspace` | 概括为 apps/* 消费 public API | `runtime` 依赖 | 是（`bridge.ts`） | 一致 / Consistent |
| 39 | `web -> implementation-analyzer` | 阶段 4 规划能力 | `runtime` 依赖（步骤 3 新增） | 是（`+server.ts`） | 演进边：步骤 3 引入 |
| 40 | `web -> implementation-validator` | 阶段 4 规划能力 | `runtime` 依赖（步骤 4 新增） | 是（`controller.ts`） | 演进边：步骤 4 引入 |

---

## 4. 边数从 38 变为 40 的原因解释 / Explanation of Edge Count Growth (38 -> 40)

在阶段 4 实施过程中，Coding-CAD 依赖边经历了从 38 条增加至 40 条的严格工程演化：
1. **基线初始状态（38 条边）**：
   - 阶段 3 退出时，`apps/web` 包含 7 个内部核心包依赖（`architecture-agent`, `architecture-ir`, `architecture-layout`, `architecture-review`, `architecture-validator`, `component-registry`, `workspace`）；
   - 全仓库内部依赖总数为 38 条（包含 `architecture-review -> execution-blueprint (dev)`）。
2. **步骤 3 改动（38 -> 39 条边）**：
   - **新增依赖**：`web -> implementation-analyzer`；
   - **改动依据**：提交 `a6d5781`（`feat(web): connect brownfield repository analysis pipeline with secure server route`）；
   - **产生原因**：`apps/web` 实现 `/api/workspace/analyze-repository` 服务端路由，需要调用 `ImplementationAnalyzer` 执行本地代码扫描反演；
   - **证据类型**：`apps/web/package.json` 显式声明 `dependencies`，`apps/web/src/routes/api/workspace/analyze-repository/+server.ts` 显式 `import { ImplementationAnalyzer }`。
3. **步骤 4 改动（39 -> 40 条边）**：
   - **新增依赖**：`web -> implementation-validator`；
   - **改动依据**：提交 `638a90e`（`feat(compliance): implement expected architecture baseline validation and bidirectional problem navigation`）；
   - **产生原因**：`apps/web` 需要在浏览器端加载期望架构基线，并触发 `ImplementationValidator` 对反演模型执行合规检查；
   - **证据类型**：`apps/web/package.json` 显式声明 `dependencies`，`apps/web/src/routes/+page.svelte` 与 `workspace-shell-controller.ts` 显式 `import { isCannotVerifyIssue, resolveIssueTarget, ImplementationValidator }`。

**结论**：
这两条新增边均为阶段 4 既定功能开发所引入的真实运行时依赖，经由 `package.json` 清单声明与 TypeScript Compiler API 源码 `import` 解析双重交叉验证（均为 `declared-and-used`），与手工真值完全吻合。

---

## 5. 漂移基线偏差检出逐项对照表 / Drifted Baseline Injected Deviation Detection Table

在 [`packages/implementation-validator/fixtures/coding-cad-drifted.json`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/packages/implementation-validator/fixtures/coding-cad-drifted.json) 中注入了 5 项典型偏差，实测产生的合规检查结果如下：

| 注入偏差类型 / Injected Drift | 规则名称 / Rule ID | 目标元素 / Target | 严重度 / Severity | 分类与角标 / Category Badge | 实际产生的合规问题 / Actual Issue Produced |
| --- | --- | --- | --- | --- | --- |
| **缺失组件**<br>注入期望要求 `audit-logger` | `component-existence` | `audit-logger` (component) | `ERROR` | `[ERROR]` | `Missing implementation: AuditLogger` |
| **技术栈未检出**<br>期望 `server` 使用 `FastAPI` | `technology-compliance` | `server` (component) | `WARNING` | `[无法验证 (Analyzer 未检出技术)]` | `Cannot Verify: Technology undetected for Server` |
| **未批准依赖**<br>从期望中剔除 `cli -> component-registry` | `dependency-compliance` | `cli->component-registry` (connection) | `WARNING` | `[WARNING]` | `Unapproved dependency: cli -> component-registry` |
| **缺失必需依赖**<br>期望要求 `web -> execution-blueprint` | `dependency-compliance` | `web-to-execution-blueprint` (connection) | `WARNING` | `[WARNING]` | `Required dependency not detected: web -> execution-blueprint` |
| **契约未提取**<br>期望要求 `GET /api/v1/health` | `contract-compliance` | `server` (component) | `ERROR` | `[无法验证 (Analyzer 未提取契约)]` | `Required contract not implemented: GET /api/v1/health` |

- **无偏差版本（Golden Baseline）问题总数**：**0 项**（自洽性检查完全通过）；
- **漂移版本（Drifted Baseline）问题总数**：**5 项**（恰好对应注入的 5 项偏离，**无任何表外多余问题或误报**）。
- **各类问题统计分布（Drifted Baseline）**：
  - 错误（Errors）：**1** 项（缺失组件）；
  - 警告（Warnings）：**2** 项（未批准依赖、缺失依赖）；
  - 待人工确认（Pending）：**0** 项；
  - 无法验证（Cannot Verify）：**2** 项（未检出技术 1 项、未提取契约 1 项）。
