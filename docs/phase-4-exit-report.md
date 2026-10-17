# Phase 4 Exit Report / 阶段 4 退出报告

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-4-brownfield-workspace`  
基线提交 / Target Baseline: `bf3726b` (main)  
退出结论 / Exit Conclusion: **有条件满足 / CONDITIONALLY SATISFIED**  
*(严禁表述为无条件满足；当前分支待用户审批决策与人工可理解性评估执行 / Strictly NOT unconditional; awaiting user threshold approval, IR evolution decision, and human comprehension evaluation).*

---

## 待用户处理事项 / Items Pending User Action

为确保架构决策权在用户手中，并防止工程代理越权设定阈值，本报告将待用户裁定与处理的事项集中置顶：

### 1. 需用户批准的数值阈值 / Numerical Thresholds Pending User Approval

在阶段 4 实施中，严格遵守“不自设新阈值、实测数字如实记录”原则。以下为全量实测数据及代理建议阈值，**等待用户批准后方可固化为自动化门禁**：

| 评估指标 / Metric | 测量对象 / Target | 实测数值 / Measured Value | 建议批准阈值 / Proposed Threshold | 设定依据与建议说明 / Rationale & Recommendation |
| --- | --- | --- | --- | --- |
| **首屏渲染耗时 (Render Time)** | `Coding-CAD` (15 components) | 539.94 ms (preview) / 577.15 ms (dev) | **≤ 800 ms** (p95) | 包含服务端分析反演与浏览器 ELK 布局计算全流程，800ms 能保证良好人机交互体验。 |
| **大规模图渲染耗时** | `synthetic-large-repo` (120 modules) | 296.22 ms (preview) / 406.22 ms (dev) | **≤ 1500 ms** (p95) | 120 模块规模下布局计算耗时，沿用 Checkpoint 2 的 1.5s 预算。 |
| **服务端代码分析耗时** | `skill-central` (290 files) | 125.66 ms | **≤ 1000 ms** (p95) | 采用 AST 快速遍历与轻量 Heuristic，300 文件内单机耗时通常在 200ms 以内。 |
| **边交叉数 (Crossings) - 展开** | `synthetic-hub-repo` (57 modules) | 86 处交叉 | **仅作观测，不设硬门禁** | 复杂网状图交叉数高度依赖图拓扑内在特征，不宜设定统一的硬性交叉上限。 |
| **边交叉数 (Crossings) - 折叠优化** | `synthetic-hub-repo` (14 containers) | 34 处交叉 (降幅 60.5%) | **折叠交叉降幅 ≥ 40%** | 证明容器折叠能显著改善首屏几何可读性。 |
| **真实仓库边精确率 (Precision)** | `skill-central` (Seed: 42 抽检) | 30/30 (100.0%) | **≥ 95.0%** | 保证提取的模块依赖具备高置信度。 |
| **真实仓库边召回率 (Recall)** | `skill-central` (Seed: 42 抽检) | 22/30 (73.3%) | **≥ 70.0%** | 单体工程由于根入口脚本未聚类（8 处未提取），目前召回率为 73.3%，建议作为 V1 基线。 |

### 2. 需用户决策的架构事项 / Architecture Decisions Pending User Confirmation

- **事项 1：证据与置信度的正式 IR 建模时机**：
  - **现状**：当前遵循用户决策，证据与置信度封装于 `evidence-codec.ts`，暂存于 `Component.tags` 与 `Connection.constraints` 中，未修改 `@coding-cad/architecture-ir` 公开类型。
  - **决策选项**：
    - **选项 A（推荐）**：保持现状至阶段 5/6，待 Ghost 呈现与完整 Review 规范冻结后，统一在 IR 中增加 `evidence` 与 `confidence` 首类字段；
    - **选项 B**：在阶段 4 退出后立即开展 IR 模式扩展专项重构。
- **事项 2：单体工程根目录单文件聚类规则**：
  - **现状**：单体工程仅对 `src/<subdir>` 生成模块，根级单文件（如 `src/index.ts`、`src/mcp.ts`）未归组。
  - **决策选项**：是否授权在未来切片中引入 `group:root-entry` 虚拟模块来聚合根级文件以提升单体仓库召回率。

### 3. 需人工执行的评估任务 / Human Comprehension Evaluation Pending Execution

- **评估材料**：[`docs/evaluation/p4-comprehension-eval.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/evaluation/p4-comprehension-eval.md)
- **说明**：该评估方案包含 A/B 对照实验设计、三类目标代码库问答题及客观标准答案。**当前状态为待执行，评测数据必须由真实人类架构师实测填写，严禁 AI 代填**。

---

## 1. 做了什么 / What

在 `codex/phase-4-brownfield-workspace` 分支上完整实施了阶段 4（Brownfield Architecture Workspace）的全部核心流水线与实证支撑：

1. **统一交付记录格式与规则闸门（步骤 0 & 步骤 2.1 修复）**：
   - 固化中英双语“1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification”三段式顺序结构；
   - 更新全部项目规范与模板（`AGENTS.md`、`CLAUDE.md`、`.github/pull_request_template.md` 等）；
   - 在 `scripts/ci/check-change-record.mjs` 实现自动化格式检查，并通过独立单元测试与负控测试。
2. **真值基准体系与 Analyzer 分层提取（步骤 1 & 步骤 2）**：
   - 建立了 `coding-cad-golden.json`、`small-monorepo`、`small-single-repo` 与 `synthetic-large-repo` 四套测试夹具；
   - 实现了基于 TypeScript Compiler API 的 L1 清单、L2 AST 导入、L3 公开导出与 L4 目录聚类分层反演器；
   - 实现了 `benchmark.ts` 自动化评测工具，实测 Coding-CAD 依赖边反演准确率从修改前的 0% 提升至 100%。
3. **L2 交叉校验、类型化编解码与边缘用例覆盖（步骤 2.1）**：
   - 实现了 L2 跨包交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）与依赖类型标注（runtime/dev/peer）；
   - 封装类型化证据编解码器 `evidence-codec.ts`（Layer Prior 模型），严格清除 `capabilities` 语义污染；
   - 新增 `edge-cases-repo` 覆盖 barrel `export *`、`import type`、`await import()` 动态导入、`tsconfig paths` 别名、循环导入、未声明工作区依赖、语法错误等 7 项复杂边缘场景，100% 达到“正确解析”或“显式报告不支持”。
4. **Brownfield Web 流水线与服务端安全隔离（步骤 3 & 步骤 3.1）**：
   - 实现 `/api/workspace/analyze-repository` 服务端路由，落实单机 loopback、Host 头白名单（防范 DNS rebinding）、Origin 校验、强制 `application/json`；
   - 落实文件数超限（5000）、耗时超时（30s）、单文件体量超限的显式截断告警，禁止将残缺图冒充完整图；
   - 过滤凭据敏感文件与构建缓存（`.pnpm-store` 等），软链接防环与越界显式报告；
   - Web 控制器重建 `ArchitectureProject`，Canvas 与 Inspector 支持模块分组渲染、折叠/展开、隐藏计数与编解码证据呈现；
   - 编写 `server.test.ts`（19/19 测试全量通过）。
5. **期望基线合规检查与双向问题导航（步骤 4 & 步骤 4.1）**：
   - 编写架构基线合规设计说明，明确基线显式加载模型与未加载时的显式不可用横幅（`compliance-unavailable-banner`）；
   - 修正技术规则在技术未检出时的语义为“无法验证（Analyzer 未检出技术）”（非技术违规）；
   - 界面建立 4 类问题分流计数器（错误、警告、待人工确认、无法验证）与专用角标；
   - 画布实现受控自动展开：点击问题目标时精准展开隐藏该节点的已折叠父分组并高亮聚焦；点击节点联动 Inspector 展示关联问题；
   - 建立 Golden 完全匹配与 Drifted 5 项偏离双基线夹具，实测 Coding-CAD 0 误报，Drifted 5 项偏离 100% 精确检出（0 项表外多余问题）。
6. **验收基线完善与实证材料就绪（步骤 5）**：
   - 构造 57 模块、14 包的复杂拓扑合成夹具 `synthetic-hub-repo`（中心 Hub、环依赖、跨层调用、桥接器），测定完全展开 86 处交叉，应用 N > 50 初始折叠后降为 14 个容器、34 处交叉（降幅 60.5%）；
   - 盲测真实本地 TypeScript 代码库 `skill-central`（290 文件、23 模块、77 边、152 交叉、0 重叠、100% ELK 求解器），完成种子 42 的 AI 抽样核对（Precision 100.0%、Recall 73.3%），诚实记录根级入口脚本能力边界；
   - 汇编全量实测度量表于 `logs/validation/p4-browser/benchmark-report.md`，诚实说明流水线拓扑成因；
   - 交付带客观真值的人工可理解性评估材料 `docs/evaluation/p4-comprehension-eval.md`。

---

## 2. 为什么这么做 / Why

- **科学真实性与杜绝假阳性**：
  - 严禁将反演器生成的基线谎称为证明反演准确性的“独立真值”；明确降级为“自洽性检查”，并在 UI 增加预设免责声明；
  - 严禁将分析器未检出技术当作代码违规，修正为“无法验证”，诚实暴露工具边界；
  - 严禁将简单流水线（`synthetic-large-repo`）的 1 处交叉粉饰为“布局极佳”，通过复杂网状夹具（86 交叉）逼真呈现实际难度。
- **架构事实来源防伪铁律**：
  - 打开代码仓库时系统仅拥有代码实现事实，绝不能自动推断或深拷贝合成伪期望；未加载期望时直白展示“不可用”，由人类架构师显式加载批准模型。
- **安全优先与纵深防御**：
  - 打开本地文件系统能力的 Web 路由面临 DNS rebinding 与路径穿越风险；通过 Host/Origin 严格白名单与 realpath 真实路径校验构建坚固防线。
- **渐进式披露与认知减负**：
  - 在大型系统（> 50 节点）中，平铺所有节点必然造成严重的视觉混乱；通过容器折叠将节点数缩减 80%、交叉数减少 60.5%，点击问题时按需受控自动展开父容器，实现大图可读性与精确定位的统一。

---

## 3. 验证结果 / Verification

### 3.1 核心命令验证矩阵 / Core Commands Verification Matrix

以下命令均在可写环境（`CI=true TURBO_FORCE=true`）以最新源码完整执行并通过：

| 验证命令 / Command | 验证范围 / Scope | 执行结果 / Result | 证据文件索引 / Evidence Links |
| --- | --- | --- | --- |
| `pnpm check:changelog` | 交付记录格式与中英双语闸门 | PASS (exit 0) | [check-change-record.mjs](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/scripts/ci/check-change-record.mjs) |
| `node --test scripts/ci/check-change-record.test.mjs` | 变更检查脚本正负控制单测 | 8/8 PASS (exit 0) | [check-change-record.test.mjs](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/scripts/ci/check-change-record.test.mjs) |
| `pnpm --filter @coding-cad/implementation-analyzer test` | 分析器单元与夹具测试套件 | PASS (exit 0) | `packages/implementation-analyzer/src/*.test.ts` |
| `pnpm --filter @coding-cad/implementation-analyzer benchmark` | 5 个真值夹具基准精度与召回度量 | 全量 PASS (exit 0) | [analyzer-comparison.md](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/logs/validation/p4-baseline/analyzer-comparison.md) |
| `pnpm --filter @coding-cad/implementation-validator test` | 校验器合规规则、目标解析与语义单测 | PASS (exit 0) | `packages/implementation-validator/src/*.test.ts` |
| `apps/web/src/routes/api/.../server.test.ts` | 服务端路由安全加固与超限负控 (19 项) | 19/19 PASS (exit 0) | [server.test.ts](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/apps/web/src/routes/api/workspace/analyze-repository/server.test.ts) |
| `pnpm --filter @coding-cad/web test:unit` | Web 控制器、预设与组件单测 (15 文件) | 81/81 PASS (exit 0) | `apps/web/src/**/*.test.ts` |
| `pnpm --filter @coding-cad/web test:e2e` (dev 模式) | 真实 Chromium 端到端验收 (含棕地 E2E) | 26/26 PASS (exit 0) | [brownfield.spec.ts](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/apps/web/e2e/brownfield.spec.ts) |
| `pnpm --filter @coding-cad/web test:e2e` (preview 模式) | 生产打包真实 Chromium 端到端验收 | 26/26 PASS (exit 0) | [brownfield.spec.ts](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/apps/web/e2e/brownfield.spec.ts) |
| `apps/web/e2e/brownfield-benchmarks.spec.ts` | 真实浏览器性能与几何指标双模式测量 | 全量 PASS (exit 0) | [benchmark-report.md](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/logs/validation/p4-browser/benchmark-report.md) |

### 3.2 交付状态分类 / Deliverables Status Classification

- **已实现并验证 (Implemented and verified)**：
  - 打开本地代码仓库 -> 服务端安全扫描与 AST 解析 -> 重建 ArchitectureProject -> Browser Worker ELK 布局计算 -> Web Canvas / Inspector 呈现全流水线打通；
  - 真实 Chromium 浏览器（Playwright E2E）双模式下 100% 断言 ELK 求解器执行（零 fallback）；
  - 模块容器分组、折叠/展开、隐藏计数角标、问题导航受控自动展开与双向定位；
  - 期望基线合规检查、4 类问题分流展示、无法验证透明标注、自洽性检查 0 误报、Drifted 5 项偏离 100% 精确检出（0 项表外问题）；
  - 7 大复杂边缘用例矩阵 100% 达标；
  - 复杂网状合成夹具 `synthetic-hub-repo`（57 模块、86 交叉 -> 34 交叉，降幅 60.5%）；
  - 真实代码库 `skill-central` 端到端反演与 Seed 42 AI 抽样核对（Precision 100.0%、Recall 73.3%）；
  - 全量实测指标报告汇总与拓扑客观分析；
  - 变更记录自动化格式门禁。
- **已实现未验证 (Implemented but unverified)**：
  - 人工可理解性评测底稿与实验方案已就绪（`docs/evaluation/p4-comprehension-eval.md`），状态为待执行，评测数据需真实人类架构师填写。
- **未实现及范围外 (Not implemented or out of scope)**：
  - Ghost 节点投影、完整 Review 工作区、Execution Handoff、Terminal（后续阶段范围）；
  - 完整 AST 类型推断、方法级代码契约自动提取、多语言深度解析；
  - 自动修复建议；
  - 修改 Architecture IR 公开类型或变更 D-010 worker 边界。

### 3.3 风险与回退指南 / Risks and Rollback Instructions

- **主要风险**：
  - 针对非标准工作区（如使用 lerna、嵌套非标准软链接），可能遇到未知目录结构；已通过 `UnsupportedStructureReport` 显式呈现告警，不发生静默崩溃。
  - 单体仓库根目录单文件当前未聚类为模块，可能引起约 25% 的跨文件依赖漏检；需待后续决策虚拟模块聚类方案。
- **步骤独立回退指南**：
  阶段 4 所有步骤严格遵循单步单独提交，各提交哈希如下，回退时应严格按照逆序执行 `git revert`：
  1. 回退步骤 5（验收基线与实证材料）：`git revert 2e838af`
  2. 回退步骤 4.1（语义修正与证据补齐）：`git revert 320f92c`
  3. 回退步骤 4（合规检查与双向导航）：`git revert 638a90e`
  4. 回退步骤 3.1（路由安全加固与浏览器实测）：`git revert dfed3d5`
  5. 回退步骤 3（Web 流水线与服务端安全路由）：`git revert a6d5781`
  6. 回退步骤 2.1（L2 交叉校验与编解码）：`git revert 9ede079`
  7. 回退步骤 2.1 门禁修复：`git revert ddc11f2`
  8. 回退步骤 2（Analyzer 分层提取）：`git revert c38ef3f`
  9. 回退步骤 1（真值基准与当前基线）：`git revert f78a2e5`
  10. 回退步骤 0（固化记录格式与规则文档）：`git revert 876e07c`
