# PR Draft: Phase 4 — Brownfield Architecture Workspace / 阶段 4 Brownfield 架构工作区 PR 草稿

分支 / Branch: `codex/phase-4-brownfield-workspace`  
目标基线 / Target Baseline: `bf3726b` (main)  
退出结论 / Exit Conclusion: **有条件满足 / CONDITIONALLY SATISFIED**  
*(严禁表述为无条件满足；当前分支待用户审批决策与人工可理解性评估执行 / Strictly NOT unconditional; awaiting user threshold approval, IR evolution decision, and human comprehension evaluation).*

---

## 待用户处理事项 / Items Pending User Action

### 1. 需用户批准的数值阈值 / Numerical Thresholds Pending User Approval
- **首屏渲染耗时**：实测 539.94 ms (preview) / 577.15 ms (dev)，建议批准阈值 **≤ 800 ms** (p95)；
- **大规模图渲染耗时**：实测 296.22 ms (preview) / 406.22 ms (dev)，建议批准阈值 **≤ 1500 ms** (p95)；
- **服务端分析耗时**：实测 125.66 ms (skill-central 290 文件)，建议批准阈值 **≤ 1000 ms** (p95)；
- **边交叉数 (Crossings) - 展开**：实测 86 处交叉 (synthetic-hub-repo 57 模块)，建议**仅作观测，不设硬门禁**；
- **边交叉数 (Crossings) - 折叠优化**：实测 34 处交叉 (降幅 60.5%)，建议批准阈值 **折叠交叉降幅 ≥ 40%**；
- **真实仓库边精确率 (Precision)**：实测 100.0% (30/30 抽检)，建议批准阈值 **≥ 95.0%**；
- **真实仓库边召回率 (Recall)**：实测 73.3% (22/30 抽检，根级单文件未聚类归因)，建议批准阈值 **≥ 70.0%**。

### 2. 需用户决策的架构事项 / Architecture Decisions Pending User Confirmation
- **证据与置信度的正式 IR 建模时机**：推荐保持现状至阶段 5/6 统一扩展，或授权开展专项扩展；
- **单体工程根目录单文件聚类规则**：是否授权未来引入 `group:root-entry` 虚拟模块。

### 3. 需人工执行的评估任务 / Human Comprehension Evaluation Pending Execution
- 详见 [`docs/evaluation/p4-comprehension-eval.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/evaluation/p4-comprehension-eval.md)。评测数据必须由真实人类架构师实测填写，严禁 AI 代填。

---

## 1. 做了什么 / What

- **步骤 0**：固化 PR、退出报告、变更记录（change-record）与步骤汇报的统一记录格式；更新规范文件与检查脚本 `scripts/ci/check-change-record.mjs`。
- **步骤 1**：建立真值基准与当前基线（`coding-cad-golden.json`、`small-monorepo`、`small-single-repo`、`synthetic-large-repo`），实现基准测试工具 `benchmark.ts`。
- **步骤 2**：Analyzer 证据模型与分层提取（`c38ef3f`）：实现 L1 清单、L2 AST 导入、L3 公开导出与 L4 目录聚类分层反演器。
- **步骤 2.1**：跨包 L2 交叉校验、证据编解码与语义污染防御：独立修复门禁正则（`ddc11f2`）；L2 交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）；诚实区分真值等级；新增 `edge-cases-repo` 覆盖 7 项复杂边缘场景；封装类型化证据编解码器 `evidence-codec.ts`；清除 `capabilities` 语义污染。
- **步骤 3**：Brownfield 产品流水线（`a6d5781`）：实现 `/api/workspace/analyze-repository` 服务端安全路由与负控单测；Web 控制器重建 `ArchitectureProject` 并触发 ELK 求解器，Canvas 与 Inspector 实现分组折叠/展开与证据先验展示；新增 `brownfield.spec.ts` 真实 ELK 求解器验收。
- **步骤 3.1**：路由安全加固与浏览器实测（`dfed3d5`）：落实功能开关、Host 头白名单（阻断 DNS rebinding）、Origin 跨源校验、强制 Content-Type: application/json；补齐单文件/文件数/耗时超限截断负控与软链接防环/越界显式报告；过滤 `.pnpm-store` 等构建缓存；新增 `brownfield-benchmarks.spec.ts` 并在真实 Chromium 浏览器测定 dev 与 preview 双模式指标。
- **步骤 4**：架构期望基线合规检查与双向问题导航（`638a90e`）：编写合规设计说明，明确基线显式加载模型与显式不可用状态横幅；实现 Validator 目标解析与规则修复；建立双基线夹具（Golden 0 误报，Drifted 5 偏离全量检出）；Web 端实现预设加载、角标渲染、画布受控自动展开折叠分组与 Inspector 双向联动；通过 dev 与 preview 双模式 E2E。
- **步骤 4.1**：技术规则语义修正与证据补齐（`320f92c`）：更正技术未检出语义为“无法验证（Analyzer 未检出技术）”；UI 实现 4 类问题分流计数器与专用角标；增加预设演示免责声明与非法路径错误横幅；补充 E2E 断言；交付 4 份关键设计与实证文档。
- **步骤 5**：验收基线完善、复杂网状夹具与真实代码库实测：
  - 构造 57 模块、14 包的中心网状合成夹具 `synthetic-hub-repo`（中心 Hub、环依赖、跨层调用、桥接器），测定完全展开 86 处交叉，N > 50 初始折叠后降至 14 容器、34 交叉（降幅 60.5%）；
  - 盲测真实本地 TypeScript 代码库 `skill-central`（290 文件、23 模块、77 边、152 交叉、0 重叠、100% ELK 求解器），完成种子 42 的 AI 抽样核对（Precision 100.0%、Recall 73.3%），诚实记录根级入口脚本聚类边界；
  - 交付人工可理解性评估材料 `docs/evaluation/p4-comprehension-eval.md`（状态：待人工执行）；
  - 汇总全量实测度量表于 `logs/validation/p4-browser/benchmark-report.md`，诚实说明流水线拓扑成因。
- **步骤 6**：编写退出报告草稿 `docs/phase-4-exit-report.md`，置顶“待用户处理事项”，结论严格表述为“有条件满足 / Conditionally Satisfied”，同步全部文档与计划状态。

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
  - `pnpm --filter @coding-cad/web test:unit`: 81/81 通过；
  - `pnpm --filter @coding-cad/web test:e2e` (dev 模式): 26/26 通过，100% ELK 求解器，零 fallback；
  - `pnpm --filter @coding-cad/web test:e2e` (preview 模式): 26/26 通过，100% ELK 求解器，零 fallback；
  - `synthetic-hub-repo` 57 模块、83 边 100% ELK 布局成功；
  - `skill-central` 23 模块、77 边 100% ELK 布局成功，AI 抽样核对记录就绪；
  - `docs/evaluation/p4-comprehension-eval.md` 评估方案就绪；
  - `logs/validation/p4-browser/benchmark-report.md` 汇总就绪。
- [ ] 已实现未验证 / Implemented but unverified:
  - 步骤 5 的用户人工可理解性评估表（需待真实人类架构师实操填写）。
- [ ] 未实现及范围外 / Not implemented or out of scope:
  - 阶段 5+：Ghost 节点投影、完整 Review 工作区、Execution Handoff、Terminal。

### 风险与回退方式 / Risks and Rollback
- 风险 / Risk: 针对非标准单体仓库根目录单文件当前未聚类；已在分析报告中清晰归因，等待用户决策。
- 回退方式 / Rollback: 每个步骤拥有独立提交，严格逆序回退：
  - 回退步骤 5: `git revert 2e838af`
  - 回退步骤 4.1: `git revert 320f92c`
  - 回退步骤 4: `git revert 638a90e`
  - 回退步骤 3.1: `git revert dfed3d5`
  - 回退步骤 3: `git revert a6d5781`
  - 回退步骤 2.1: `git revert 9ede079`
  - 回退步骤 2.1 门禁修复: `git revert ddc11f2`
  - 回退步骤 2: `git revert c38ef3f`
  - 回退步骤 1: `git revert f78a2e5`
  - 回退步骤 0: `git revert 876e07c`
