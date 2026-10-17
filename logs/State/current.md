# 当前状态 / Current State

更新时间 / Updated at: 2026-10-16
分支 / Branch: codex/phase-4-brownfield-workspace

## 阶段 4 进度总结 / Phase 4 Progress Summary

阶段 4 (Brownfield Architecture Workspace) 正在按照既定步骤有序推进：
- **步骤 0（固化记录格式与规则文档）**：已完成并提交（`876e07c`）。PR 模板、AGENTS.md、CLAUDE.md、文档规则及变更检查脚本均已统一为三段式中英双语格式（做了什么 / What -> 为什么这么做 / Why -> 验证结果 / Verification），已做正负控制验证。
- **步骤 1（真值基准与当前基线）**：已完成并提交（`f78a2e5`）。建立了本仓库真值黄金文件、两个小型 TS 夹具（small-monorepo、small-single-repo）以及合成大型夹具（synthetic-large-repo），实测记录了修改前基线（本仓库 0/37 边，small-monorepo 0 模块）。
- **步骤 2（Analyzer 证据模型与分层提取）**：已完成并提交（`c38ef3f`）。实现 L1 工作区 package 清单提取、L2 TypeScript Compiler API 文件级 import 解析、L3 公开导出提取、L4 目录归组与 UnsupportedStructureReport 显式报告。
- **步骤 2.1（Analyzer 补强：跨包 L2 交叉校验、证据编解码与语义污染防御）**：已完成并验证。分离提交历史（`ddc11f2` 正则门禁独立修复）；实现 L2 交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）与依赖种类（runtime/dev/peer）；诚实区分 L1 manifest 与 L2+ 手工真值；新增 `edge-cases-repo` 覆盖 barrel `export *`、`import type`、`await import(...)` 动态导入、`tsconfig paths` 别名、循环导入、未声明工作区依赖、语法错误文件；封装类型化证据编解码器 `evidence-codec.ts`（Layer Prior 定义）；将 `export:<Symbol>` 移出 `capabilities` 消除语义污染；实测 `ImplementationValidator` 兼容性（自洽性检查通过）；全量基准测试 5 个夹具全部 PASS，代码导入边（resolvedCount）全部非 0。
- **步骤 3（Brownfield 产品流水线：服务端安全路由、ELK 布局、证据审查与分组折叠）**：已完成并提交（`a6d5781`）。编写 `docs/brownfield-pipeline-design.md` 说明宿主边界与安全模型；实现 `/api/workspace/analyze-repository` 服务端安全路由与负控测试套件；Web 控制器重建 Greenfield 同款 `ArchitectureProject` 并交由 `BrowserWorkerLayoutEngine`（ELK）完成布局；Canvas 与 Inspector 支持模块分组渲染、折叠/展开（带 `nodrag` 保护）、隐藏计数角标与编解码证据展示；Playwright E2E（`brownfield.spec.ts`）验证断言真实 ELK solver 执行与零 fallback 门禁。
- **步骤 3.1（补齐证据与安全加固）**：已完成并验证。落实功能开关 `CODING_CAD_ENABLE_REPOSITORY_ANALYSIS`、Host 头白名单（阻断 DNS rebinding）、Origin 校验、强制 Content-Type: application/json、软链接成环阻断与越界显式报告、超限资源截断负控（`server.test.ts` 19/19 项全数通过）；过滤 `.pnpm-store` 等构建缓存并限制 AST 解析仅针对脚本文件；更新设计文档与已知安全边界；刷新全量基准与边缘用例证据表（Coding-CAD 39 边 100% 召回，合成夹具 147 边全量检测）；真实 Chromium 浏览器测定 dev 与 preview 双模式下本仓库与 120 模块合成夹具实测数据（100% ELK 求解器，0 节点重叠，0 包含失败，400ms 内渲染完毕）。
- **步骤 4（合规检查与双向问题导航）**：已完成并验证。编写 `docs/brownfield-compliance-design.md` 说明基线来源模型与 5 条规则在棕地下的物理边界；扩展 `packages/implementation-validator` 导出 `IssueTarget`、`resolveIssueTarget`、`isContractIssue` 与 `createImplementationModel`；修复 `technology-rule.ts` 漏报缺陷；建立 `coding-cad-expected.json` 与 `coding-cad-drifted.json` 双基线夹具并通过自动化验证；Web 端实现基线加载预设、未加载显式不可用横幅、角标渲染（`[无法验证]`、`[待人工确认]`）、画布受控自动展开折叠分组以及 Inspector 双向联动；Playwright E2E（`brownfield.spec.ts`）在 dev 与 preview 双模式全数通过，100% 验证 ELK 求解器。
- **步骤 4.1（澄清与补齐证据）**：已完成并验证。更正技术合规规则在技术未检出时的语义为“无法验证（Analyzer 未检出技术）”（非技术违规）；在 Web 端实现 4 类分类计数器（错误、警告、待确认、无法验证）与专用角标；增加预设演示免责声明与非法路径错误横幅；补充 E2E 断言；交付四份关键证据文档（期望基线独立来源与边数 38->40 演进分析、L2 交叉校验文件路径与归因表、7 项边缘场景逐项矩阵、D-005 分组实现逐条合规核验表）。
- **步骤 5（验收基线完善、复杂网状夹具与真实代码库实测）**：已完成并验证。建立 57 模块、14 包的中心网状合成夹具 `synthetic-hub-repo`（中心 Hub、环依赖、跨层调用、桥接器），实测完全展开 86 处交叉，在测试中应用组件数 > 50 模拟初始折叠后降至 14 容器、34 交叉（模拟折叠降幅 60.5%，非默认行为）；对真实本地 TypeScript 代码库 `skill-central`（290 文件、23 模块、77 边、152 交叉、0 重叠、100% ELK）执行端到端分析，并完成种子 42 的 AI 抽样核对（Precision 100.0%、Recall 73.3%，诚实界定根级文件 L4 聚类边界）；交付人工可理解性评估材料 `docs/evaluation/p4-comprehension-eval.md`（带候选答案与源码路径依据，状态标注为待人工执行）；汇总全量物理指标于 `logs/validation/p4-browser/benchmark-report.md`。
- **步骤 6（退出报告与阶段状态对齐）**：已完成。完成中英双语《阶段 4 退出报告》（`docs/phase-4-exit-report.md`），明确置顶“待用户处理事项”，退出结论严格标注为“有条件满足 / Conditionally Satisfied”，全面同步更新 PR 草稿（`.github/pr-draft-phase4.md`）、执行计划、路线图与各模块状态。

阶段 4 最终退出结论：**有条件满足 / CONDITIONALLY SATISFIED**（待用户裁定推荐数值阈值、IR 模式演进时机与人工可理解性评估执行）。

## 已实现并验证 / Implemented and verified

- 统一记录格式自动化门禁：`check:changelog` 校验三段式顺序与中英双语；
- 5 套真值测试夹具与自动化度量脚本（`benchmark.ts`）；
- `ImplementationAnalyzer` 分层提取与 Compiler API AST 导入解析；
- L2 跨包交叉校验（declared-and-used / declared-unused / undeclared-used）与依赖种类（runtime/dev/peer）；
- 类型化证据编解码模块（`evidence-codec.ts`）与 Layer Prior（层级先验）模型；
- 语义字段污染清除（capabilities 保持纯净，warnings 移出 intent.purpose）；
- `ImplementationValidator` 架构兼容性实测（Coding-CAD 与合成大图自洽通过、0 偏离项）；
- 7 大边缘用例全面覆盖（barrel re-export、type-only、dynamic import、tsconfig paths、circular、undeclared workspace、unparseable syntax）；
- 性能与基线验证：Coding-CAD 本仓库及合成大型夹具召回率达到 100%，所有夹具代码导入解析边数均 > 0；
- 步骤 3 的 Web 产品流水线连接（打开仓库 -> 服务端安全分析 -> 重建 IR -> ELK Layout -> Canvas/Inspector 展示、分组折叠与隐藏计数）；
- 服务端安全隔离与负控测试（19/19 测试通过，覆盖 loopback、DNS rebinding、路径遍历拦截、凭据过滤、外部符号链接跳过、DTO 源码正文排除）；
- 步骤 4 的期望架构基线比对与合规检查流程（显式基线加载、显式不可用状态横幅、契约规则“无法验证”透明标记、推断项与技术偏离“待人工确认”标注）；
- 步骤 4 的画布与问题列表双向交互导航（点击问题自动展开已折叠父分组并聚焦节点；点击节点联动 Inspector 展示关联问题）；
- 真实浏览器 Playwright E2E 验证（双模式下 `brownfield.spec.ts` 与 `brownfield-benchmarks.spec.ts` 全量通过，断言 ELK 求解器执行与零 fallback）；
- 步骤 5 的复杂拓扑夹具（`synthetic-hub-repo` 57 模块、14 包）与 N > 50 折叠优化度量（86 交叉 -> 34 交叉，降幅 60.5%）；
- 步骤 5 的真实外部代码库实测（`skill-central` 23 模块、77 边、152 交叉、100% ELK 求解器、0 重叠、0 包含失败）与种子 42 AI 抽样核对（Precision 100.0%、Recall 73.3%）；
- 步骤 5 的全量物理度量报告汇总（`logs/validation/p4-browser/benchmark-report.md`）；
- 步骤 6 的退出报告草稿（`docs/phase-4-exit-report.md`）与 PR 草稿（`.github/pr-draft-phase4.md`），置顶“待用户处理事项”，结论严格标注“有条件满足 / Conditionally Satisfied”，并同步更新全量设计文档。

## 已实现未验证 / Implemented but unverified

- 步骤 5 的用户人工可理解性评估表（设计方案与带标准答案的题库已就绪于 `docs/evaluation/p4-comprehension-eval.md`，标注为待真实人类架构师测试执行，不可由 AI 代填）。

## 未实现及范围外 / Not implemented or out of scope

- Ghost 节点投影、完整 Review 工作区、Execution Handoff、Terminal（阶段 5+ 范围）；
- 完整 AST 语义推理、类型推断、契约字段自动推断、多语言深度解析；
- 自动修复建议；
- 新增 package、改动 Architecture IR 公开类型、改动 D-010 worker 边界或更换 solver。

## 风险与回退 / Risks and rollback

- 步骤 0–2 的提交均相互独立，如需回退某一步骤可严格逆序执行 `git revert`。
- 未跟踪文件 `.github/pr-draft-phase3.md` 保持不受触碰。
- 详细对比数据记录于 `logs/validation/p4-baseline/analyzer-comparison.md`。
