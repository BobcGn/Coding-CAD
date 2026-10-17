# PR Draft: Phase 4 — Brownfield Architecture Workspace / 阶段 4 Brownfield 架构工作区 PR 草稿

分支 / Branch: `codex/phase-4-brownfield-workspace`  
目标基线 / Target Baseline: `bf3726b` (main)  
退出结论 / Exit Conclusion: **有条件满足 / CONDITIONALLY SATISFIED**  
*(严禁表述为无条件满足；当前分支待用户审批决策与人工可理解性评估执行 / Strictly NOT unconditional; awaiting user threshold approval, IR evolution decision, and human comprehension evaluation).*

---

## 待用户处理事项 / Items Pending User Action

### 1. 需用户批准的数值阈值（提议值，待用户裁定） / Proposed Numerical Thresholds Pending User Approval
以下指标基于 Apple M5 机器硬件环境，每模式每夹具各 10 次重复测量（80 次运行）得出的真实分布：
- **首屏渲染耗时**：实测 preview 中位数 **417.42 ms**（冷启动峰值 834.86 ms），dev 中位数 **401.11 ms**，提议批准阈值 **≤ 800 ms (稳态)**（实测倒推提议）；
- **大规模图首屏渲染耗时**：实测 preview 中位数 **292.65 ms**（p95: 377.81 ms），dev 中位数 **287.35 ms**，提议批准阈值 **≤ 1500 ms (稳态)**（沿用 Checkpoint 2 已批准预算）；
- **服务端代码分析耗时**：实测 preview 中位数 **163.90 ms**（p95: 199.35 ms），dev 中位数 **163.50 ms**，提议批准阈值 **≤ 1000 ms (稳态)**（实测倒推提议）；
- **边交叉数 (Crossings) - 展开**：实测 86 处交叉 (synthetic-hub-repo 57 模块)，提议**仅作观测，不设硬门禁**；
- **边交叉数 (Crossings) - 折叠优化**：实测 34 处交叉 (降幅 60.5%)，提议批准阈值 **折叠交叉降幅 ≥ 40%**（实测倒推提议）；
- **真实仓库边精确率 (Precision)**：实测 100.0% (30/30 抽检，95% CI: [88.65%, 100.00%])，提议批准阈值 **≥ 90.0%**；
- **真实仓库边召回率 (Recall)**：实测 73.3% (22/30 抽检，95% CI: [55.55%, 85.82%])，提议批准阈值 **≥ 70.0%**（实测倒推提议）。

### 2. 需用户决策的架构事项 / Architecture Decisions Pending User Confirmation
- **事项 1：证据与置信度的正式 IR 建模时机**：推荐保持现状至阶段 5/6 统一扩展，或授权开展专项扩展；
- **事项 2：单体工程根目录单文件聚类规则与召回缺口量化**：被漏掉的 8 条 import（占抽样 26.7%，占未提取 100%）全部源于根级单文件（`src/index.ts`、`src/mcp.ts`、`src/app-metadata.ts`）；是否授权未来引入 `group:root-entry` 虚拟模块；
- **事项 3（新增）：是否批准新增不依赖期望架构的结构性检查规则类型**：现有 5 类规则均依赖期望基线；是否批准在验证器中新增独立的跨模块循环依赖检测（`cyclic-dependencies`）；
- **事项 4（新增）：默认折叠阈值 N=50 的审批与确认**：代码已在 `ArchitectureCanvas.svelte` 导出 `DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50` 并通过 `defaultCollapseThreshold` prop 支持配置，标注为“未经批准的临时值”，请用户裁定是否作为默认行为。

### 3. 证据缺口客观披露 / Objective Disclosure of Evidence Gaps
- 真实代码库实测证据仅来自单个单体仓库（`skill-central`），没有任何真实生产 Monorepo 证据；
- `tsconfig.paths` 跨包别名、Monorepo 跨包桶文件引用等特性仅在合成夹具上验证，未在真实 Monorepo 上验证。

### 4. 需人工执行的评估任务 / Human Comprehension Evaluation Pending Execution
- 详见 [`docs/evaluation/p4-comprehension-eval.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/evaluation/p4-comprehension-eval.md)。评测数据必须由真实人类架构师实测填写，严禁 AI 代填。

---

## 1. 做了什么 / What

- **步骤 0**：固化 PR、退出报告、变更记录（change-record）与步骤汇报的统一记录格式；更新规范文件与检查脚本 `scripts/ci/check-change-record.mjs`。
- **步骤 1**：建立真值基准与当前基线（`coding-cad-golden.json`、`small-monorepo`、`small-single-repo`、`synthetic-large-repo`），实现基准测试工具 `benchmark.ts`。
- **步骤 2 & 2.1**：Analyzer 证据模型与分层提取（`c38ef3f` / `9ede079`）：实现 L1 清单、L2 AST 导入、L3 公开导出与 L4 目录聚类；L2 跨包交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）；封装类型化证据编解码器 `evidence-codec.ts`；清除 `capabilities` 语义污染；覆盖 7 项边缘用例。独立修复门禁正则（`ddc11f2`）。
- **步骤 3 & 3.1**：Brownfield 产品流水线与安全加固（`a6d5781` / `dfed3d5`）：实现 `/api/workspace/analyze-repository` 服务端安全路由与 19 项负控单测（Host 头/Origin 白名单、强制 application/json、超限截断告警、软链接防环与越界显式报告）；Web 控制器重建 `ArchitectureProject` 并触发 ELK 求解器，Canvas 与 Inspector 实现分组折叠/展开与证据先验展示。
- **步骤 4 & 4.1**：架构期望基线合规检查与双向问题导航（`638a90e` / `320f92c`）：明确基线显式加载模型与显式不可用状态横幅；实现 Validator 目标解析与规则修复；更正技术未检出语义为“无法验证（Analyzer 未检出技术）”；UI 实现 4 类问题分流计数器与专用角标；画布实现受控自动展开折叠父分组与双向定位。
- **步骤 5**：验收基线完善、复杂网状夹具与真实代码库实测（`2e838af`）：构造 57 模块复杂拓扑合成夹具 `synthetic-hub-repo`（86 交叉 -> 34 交叉，降幅 60.5%）；实测真实代码库 `skill-central`（23 模块、77 边、152 交叉、100% ELK 求解器），完成 Seed: 42 AI 抽样核对（Precision 100.0%、Recall 73.3%）；交付人工可理解性评估材料。
- **步骤 6**：编写退出报告草稿 `docs/phase-4-exit-report.md`，完成 80 次真实浏览器重复测量，规范 N=50 可配置性与临时值标注，内嵌 4 张关键结论分析表，置顶“待用户处理事项”，结论严格表述为“有条件满足 / Conditionally Satisfied”。

---

## 2. 为什么这么做 / Why

- **科学诚信与杜绝假阳性**：
  - 严禁将反演基线谎称为证明准确率的“独立真值”，降级为“自洽性检查”并附带预设免责声明；
  - 严禁将分析器未检出技术当作代码破坏架构，修正为“无法验证”，诚实暴露工具边界；
  - 严禁将简单流水线的 1 处交叉粉饰为“布局极佳”，通过复杂网状夹具（86 交叉）真实呈现实际工程拓扑，并用实测数据证明折叠机制能改善可读性。
- **架构事实来源防伪铁律**：打开代码仓库时系统仅拥有代码实现事实，绝不能自动推断或深拷贝合成伪期望；未加载期望时直白展示“不可用”，由人类架构师显式加载批准模型。
- **安全优先与纵深防御**：通过 Host/Origin 严格白名单与 realpath 真实路径校验构建坚固防线，阻断 DNS rebinding 与路径穿越。
- **渐进式披露与认知减负**：在大型系统（> 50 节点）中通过容器折叠将节点数缩减 80%、交叉数减少 60.5%，点击问题时按需受控自动展开父容器，实现大图可读性与精确定位的统一。

---

## 3. 验证结果 / Verification

### 验证状态 / Verification Status
- [x] 已实现并验证 / Implemented and verified:
  - `pnpm check:changelog`: 通过（exit 0）；
  - `node --test scripts/ci/check-change-record.test.mjs`: 8/8 通过；
  - `pnpm --filter @coding-cad/implementation-analyzer test`: 全量通过；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`: 5 夹具全量通过；
  - `pnpm --filter @coding-cad/implementation-validator test`: 全量通过；
  - `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`: 19/19 负控全量通过；
  - `pnpm --filter @coding-cad/web test:unit`: 82/82 通过；
  - `pnpm --filter @coding-cad/web test:e2e` (dev 模式): 26/26 通过，100% ELK 求解器，零 fallback；
  - `pnpm --filter @coding-cad/web test:e2e` (preview 模式): 26/26 通过，100% ELK 求解器，零 fallback；
  - `node scripts/benchmarks/run-repeated-benchmarks.mjs`: 4 夹具双模式各 10 次重复测量（80 次运行）全量 PASS (exit 0)；
  - `synthetic-hub-repo` 57 模块、83 边 100% ELK 布局成功；
  - `skill-central` 23 模块、77 边 100% ELK 布局成功，AI 抽样核对记录就绪；
  - `CI=true TURBO_FORCE=true pnpm ci:verify`: 15/15 任务全量通过。
- [ ] 已实现未验证 / Implemented but unverified:
  - 步骤 5 的用户人工可理解性评估表（需待真实人类架构师实操填写）。
- [ ] 未实现及范围外 / Not implemented or out of scope:
  - 阶段 5+：Ghost 节点投影、完整 Review 工作区、Execution Handoff、Terminal。

### 提交历史与回退方式 / Commits & Rollback Guide

> **旧哈希失效说明**：此前汇报中出现的哈希 `7e5111f` 与 `f78a2e5` 已失效，以新列表为准：
> - `f78a2e5`：此前汇报误记，真实提交为 `c38ef3f`；
> - `7e5111f`：在步骤 2.1 门禁拆分时已重写为 `ddc11f2`（门禁修复）与 `9ede079`（分层提取与补强）。

经核验的完整真实提交列表与逆序回退命令：
- 回退步骤 6 (文档与状态): `git revert 66b9fd0`（连带影响：仅撤销报告与标记）
- 回退步骤 5 (验收与实证): `git revert 2e838af`（连带影响：撤销 hub 夹具与实证数据）
- 回退步骤 4.1 (语义修正与证据): `git revert 320f92c`（连带影响：撤销 4 类计数器与语义修正）
- 回退步骤 4 补档文档: `git revert 9ebfcb0`（连带影响：仅撤销 40 边基准文档）
- 回退步骤 4 (合规检查与导航): `git revert 638a90e`（连带影响：撤销基线比对与双向定位）
- 回退步骤 3.1 (安全加固): `git revert dfed3d5`（连带影响：撤销 Host 白名单与截断告警）
- 回退步骤 3 (Web 流水线): `git revert a6d5781`（连带影响：撤销分析路由与 Web 工作区）
- 回退步骤 2 & 2.1 (分析器与补强): `git revert 9ede079`（连带影响：撤销分层提取与编解码器）
- 回退步骤 2.1 门禁修复: `git revert ddc11f2`（连带影响：撤销检查脚本正则修复）
- 回退步骤 1 (真值基准): `git revert c38ef3f`（连带影响：撤销测试夹具）
- 回退步骤 0 (格式与规则): `git revert 876e07c`（连带影响：撤销三段式记录门禁）
