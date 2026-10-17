# 实施日志 / Implementation Log

## 2026-08-09 - Implementation Validator 第一阶段 / Implementation Validator Phase One

状态：已验证。

Status: Verified.

变更：

- 新增 ComplianceContext、ImplementationModel、ComplianceIssue、ComplianceReport 和 ComplianceRule。
- 实现组件存在、技术、组件限制、依赖和 Contract 五条规则。
- 实现插件式 ImplementationValidator Engine 和可解释文本 Formatter。
- 验证完全合规、组件缺失、技术偏离、Redis 主存储、依赖偏离和 Contract 缺失场景。

Changes:

- Added ComplianceContext, ImplementationModel, ComplianceIssue, ComplianceReport, and ComplianceRule.
- Implemented component existence, technology, component limitation, dependency, and contract rules.
- Implemented a plugin-based ImplementationValidator Engine and explainable text Formatter.
- Verified full compliance, missing component, technology deviation, Redis primary storage, dependency drift, and missing contract scenarios.

验证：

- `pnpm --filter @coding-cad/implementation-validator test`：通过。
- `pnpm ci:verify`：通过，workspace 共 15 个模块。

Validation:

- `pnpm --filter @coding-cad/implementation-validator test`: passed.
- `pnpm ci:verify`: passed, with 15 workspace modules.

## 2026-10-16 - 阶段 4 步骤 4：Implementation Validator 棕地适配与目标元素解析 / Phase 4 Step 4: Implementation Validator Brownfield Adaptation and Target Resolution

### 1. 做了什么 / What
- 目标元素解析与辅助函数（`packages/implementation-validator/src/types.ts` & `src/index.ts`）：
  - 导出 `IssueTarget` 接口与 `resolveIssueTarget(issue)` 解析函数，将各种 `ComplianceIssue` 映射到具体的目标组件 ID（`component`）或依赖边（`connection`，含 `from` 与 `to` 属性）；
  - 导出 `isContractIssue(issue)` 用于识别契约合规类问题；
  - 导出 `createImplementationModel(inspection, architecture)` 辅助构造函数，自动补齐 Brownfield 反演产物中的默认空字段（如 `dependencies`、`modules`、`files`），防范未捕获空指针。
  - 将 `packages/implementation-validator/src/index.ts` 导出修饰符更新为 `export * from "./types.js"`，确保辅助运行时函数向外导出。
- 规则修复（`packages/implementation-validator/src/rules/technology-rule.ts`）：
  - 修复技术合规规则在 Brownfield 下的代码逻辑：当期望架构规定了特定技术（例如 `FastAPI`），而代码反演中未检测到该技术时，不再静默返回通过，而是明确报告 `WARNING: Technology deviation detected` 与证据说明。
- 期望架构真值基线与漂移夹具（`packages/implementation-validator/fixtures/`）：
  - 编写 `coding-cad-expected.json`（15 组件、40 条已批准连接、包含 `web -> implementation-validator`，符合 ArchitectureProject IR 模式规范）；
  - 编写 `coding-cad-drifted.json`（注入缺失组件 `audit-logger`、技术偏离 `server` -> FastAPI、缺失依赖 `web -> execution-blueprint`、未批准依赖 `cli -> component-registry` 以及未提取契约，用于负控测试）。
- 测试套件（`packages/implementation-validator/src/brownfield-compliance.test.ts` & `src/validator.test.ts`）：
  - 覆盖 `resolveIssueTarget` 单元测试；
  - 针对 Coding-CAD 仓库源码实际反演产物核对 `coding-cad-expected.json`，验证结构类规则 0 误报；
  - 核对 `coding-cad-drifted.json`，验证 100% 准确捕获 5 类预设偏离。

- Target Resolution & Helpers (`types.ts`, `index.ts`): Exported `IssueTarget`, `resolveIssueTarget(issue)`, `isContractIssue(issue)`, and `createImplementationModel`. Replaced `export type *` with `export *` in `index.ts`.
- Rule Hardening (`technology-rule.ts`): Handled missing actual technology when expected technology is specified, preventing silent passes on technology deviations.
- Golden & Drifted Fixtures (`fixtures/`): Authored `coding-cad-expected.json` (15 components, 40 connections) and `coding-cad-drifted.json` (5 deliberate deviations).
- Test Suites (`brownfield-compliance.test.ts`, `validator.test.ts`): Validated target resolution, 0 structural false positives against Coding-CAD repo, and 100% recall of drifted deviations.

### 2. 为什么这么做 / Why
- 零静默降级原则：当期望架构规定了组件技术（例如要求 FastAPI 或 PostgreSQL），而代码库未检测到对应技术时，旧实现因 `actualTechnology === undefined` 直接返回空数组，造成了严重的静默漏报；必须显式报告偏离。
- 双向导航需要确定性的目标映射：前端 UI 画布需要将问题高亮到具体节点或边；将目标定位逻辑统一定义在 Validator 包内，避免上层 Web 散落硬编码的字符串正则匹配。
- 架构事实边界：Brownfield 场景下默认没有期望架构，必须由真实期望模型与反演实现模型做差量比对，不可随意合成伪期望。

- Zero Silent Degradation: When an expected technology is defined but undetected in code, returning an empty pass was a silent false negative; explicit warnings now flag missing technologies.
- Deterministic Navigation: UI canvas navigation requires deterministic issue-to-node/edge resolution; centralized in the validator package rather than brittle string parsing in UI components.
- Architecture Boundary: Brownfield validation strictly compares an approved expected baseline against the reverse-engineered implementation model without synthetic expectations.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-validator test`：全套单元测试与集成测试全量通过（包含 `brownfield-compliance.test.ts`）；
  - `createImplementationModel`、`resolveIssueTarget`、`isContractIssue` 逻辑全覆盖；
  - Coding-CAD 本仓库在真实反演下的非契约结构类问题检出数为 0（符合 Golden 预期）；
  - 漂移基线 5 项偏差（组件缺失、技术偏离、缺失必需依赖、未批准依赖、未提取契约）全部检出并正确归类。
- 未实现：无。
- 风险与回退方式：
  - 风险：当代码库使用了非标准技术别名时可能触发技术偏离警告，需在 Analyzer 别名表中补充识别词。
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 4 步骤 4.1：技术合规规则语义修正与无法验证分类 / Phase 4 Step 4.1: Technology Rule Semantic Refinement and Cannot-Verify Classification

### 1. 做了什么 / What
- 技术规则语义修正（`packages/implementation-validator/src/rules/technology-rule.ts`）：
  - 当期望架构中配置了特定技术，而实现中未检出对应组件技术时，不再直接报告为技术偏差（Technology deviation），而是精准报告为“无法验证（Analyzer 未检出技术）”（`technology.undetected.${expected.id}`，标题为 `Cannot Verify: Technology undetected for ${expected.name}`），避免将分析器未检出与实际代码违规相混淆。
- 辅助与分类函数扩充（`packages/implementation-validator/src/types.ts`）：
  - 导出 `isTechnologyUndetectedIssue(issue)` 与 `isCannotVerifyIssue(issue)`，支持前端与分析层将“无法验证”类问题（技术未检出、契约未提取）从硬性阻断错误中分离；
  - 更新 `resolveIssueTarget`，精准解析 `technology.undetected.*` 对应目标组件。
- 单元测试与断言更新（`packages/implementation-validator/src/brownfield-compliance.test.ts`）：
  - 更新断言验证技术未检出被识别为 `Cannot Verify` 语义，漂移基线 5 项偏离中错误 1 项、警告 2 项、无法验证 2 项。

- Semantic Refinement (`technology-rule.ts`): Refined undetected actual technology to report as "Cannot Verify (Analyzer technology undetected)" instead of a definitive technology deviation, avoiding conflation of unextracted facts with code violations.
- Classification Helpers (`types.ts`): Exported `isTechnologyUndetectedIssue` and `isCannotVerifyIssue` to support UI separation of "Cannot Verify" items.
- Tests (`brownfield-compliance.test.ts`): Updated test assertions to verify cannot-verify semantics across drifted baseline fixtures.

### 2. 为什么这么做 / Why
- 遵守诚实与零静默降级原则：Analyzer 仅依据 `package.json` 依赖做轻量技术判定，未做深度框架语法识别；若把“未检出”直接报告为“违背架构”，属于误报。将其归类为“无法验证”既诚实反映了分析器能力边界，又不会掩盖潜在风险。

- Honesty and Zero Silent Degradation: Light-weight dependency heuristics cannot prove an absence of technology; classifying undetected items as "Cannot Verify" honestly reflects analyzer boundaries without false positives.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-validator test` 全量通过；
  - 漂移基线 5 项偏离分类精确为：1 错误（缺失组件）、2 警告（未批准/缺失依赖）、0 待确认、2 无法验证（技术未检出、契约未提取）。
- 未实现：无。
- 风险与回退方式：
  - 回退方式：`git revert <commit-hash>`。


