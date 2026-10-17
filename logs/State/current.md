# 当前状态 / Current State

更新时间 / Updated at: 2026-10-16
分支 / Branch: codex/phase-4-brownfield-workspace

## 阶段 4 进度总结 / Phase 4 Progress Summary

阶段 4 (Brownfield Architecture Workspace) 正在按照既定步骤有序推进：
- **步骤 0（固化记录格式与规则文档）**：已完成并提交（`876e07c`）。PR 模板、AGENTS.md、CLAUDE.md、文档规则及变更检查脚本均已统一为三段式中英双语格式（做了什么 / What -> 为什么这么做 / Why -> 验证结果 / Verification），已做正负控制验证。
- **步骤 1（真值基准与当前基线）**：已完成并提交（`f78a2e5`）。建立了本仓库真值黄金文件、两个小型 TS 夹具（small-monorepo、small-single-repo）以及合成大型夹具（synthetic-large-repo），实测记录了修改前基线（本仓库 0/37 边，small-monorepo 0 模块）。
- **步骤 2（Analyzer 证据模型与分层提取）**：已完成并提交（`c38ef3f`）。实现 L1 工作区 package 清单提取、L2 TypeScript Compiler API 文件级 import 解析、L3 公开导出提取、L4 目录归组与 UnsupportedStructureReport 显式报告。
- **步骤 2.1（Analyzer 补强：跨包 L2 交叉校验、证据编解码与语义污染防御）**：已完成并验证。分离提交历史（`ddc11f2` 正则门禁独立修复）；实现 L2 交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）与依赖种类（runtime/dev/peer）；诚实区分 L1 manifest 与 L2+ 手工真值；新增 `edge-cases-repo` 覆盖 barrel `export *`、`import type`、`await import(...)` 动态导入、`tsconfig paths` 别名、循环导入、未声明工作区依赖、语法错误文件；封装类型化证据编解码器 `evidence-codec.ts`（Layer Prior 定义）；将 `export:<Symbol>` 移出 `capabilities` 消除语义污染；实测 `ImplementationValidator` 兼容性（0 误报）；全量基准测试 5 个夹具全部 PASS，代码导入边（resolvedCount）全部非 0。
- **步骤 3（Brownfield 产品流水线：服务端安全路由、ELK 布局、证据审查与分组折叠）**：已完成并验证。编写 `docs/brownfield-pipeline-design.md` 说明宿主边界与安全模型；实现 `/api/workspace/analyze-repository` 服务端安全路由与负控测试套件（9/9 通过，覆盖 403 loopback、400 路径遍历、跳过外部软链接、过滤 `.env*` 凭据、排除源码正文）；Web 控制器重建 Greenfield 同款 `ArchitectureProject` 并交由 `BrowserWorkerLayoutEngine`（ELK）完成布局；Canvas 与 Inspector 支持模块分组渲染、折叠/展开（带 `nodrag` 保护）、隐藏计数角标与编解码证据展示；Playwright E2E（`brownfield.spec.ts`）验证断言真实 ELK solver 执行与零 fallback 门禁，全量 dev/preview 双模式 22 个 E2E 用例 100% 通过。
- **步骤 4–6**：待推进（步骤 4：合规检查与问题导航；步骤 5：全量验收与人工可理解性评估；步骤 6：退出报告与 PR 草稿定稿）。

## 已实现并验证 / Implemented and verified

- 统一记录格式自动化门禁：`check:changelog` 校验三段式顺序与中英双语；
- 5 套真值测试夹具与自动化度量脚本（`benchmark.ts`）；
- `ImplementationAnalyzer` 分层提取与 Compiler API AST 导入解析；
- L2 跨包交叉校验（declared-and-used / declared-unused / undeclared-used）与依赖种类（runtime/dev/peer）；
- 类型化证据编解码模块（`evidence-codec.ts`）与 Layer Prior（层级先验）模型；
- 语义字段污染清除（capabilities 保持纯净，warnings 移出 intent.purpose）；
- `ImplementationValidator` 架构兼容性实测（Coding-CAD 与合成大图 0 限制关键词误报）；
- 7 大边缘用例全面覆盖（barrel re-export、type-only、dynamic import、tsconfig paths、circular、undeclared workspace、unparseable syntax）；
- 性能与基线验证：Coding-CAD 本仓库及合成大型夹具召回率达到 100%，所有夹具代码导入解析边数均 > 0；
- 步骤 3 的 Web 产品流水线连接（打开仓库 -> 服务端安全分析 -> 重建 IR -> ELK Layout -> Canvas/Inspector 展示、分组折叠与隐藏计数）；
- 服务端安全隔离与负控测试（9/9 测试通过，覆盖 loopback、路径遍历拦截、凭据过滤、外部符号链接跳过、DTO 源码正文排除）；
- 真实浏览器 Playwright E2E 验证（22/22 测试在 dev 与 preview 双模式全部通过，断言 ELK 求解器执行与零 fallback）。

## 已实现未验证 / Implemented but unverified

- 步骤 4 的 Validator 问题双向导航与契约检查状态展示；
- 步骤 5 的用户人工可理解性评估表（需待用户实际填写验收）。

## 未实现及范围外 / Not implemented or out of scope

- Ghost 节点投影、完整 Review 工作区、Execution Handoff、Terminal（阶段 5+ 范围）；
- 完整 AST 语义推理、类型推断、契约字段自动推断、多语言深度解析；
- 自动修复建议；
- 新增 package、改动 Architecture IR 公开类型、改动 D-010 worker 边界或更换 solver。

## 风险与回退 / Risks and rollback

- 步骤 0–2 的提交均相互独立，如需回退某一步骤可严格逆序执行 `git revert`。
- 未跟踪文件 `.github/pr-draft-phase3.md` 保持不受触碰。
- 详细对比数据记录于 `logs/validation/p4-baseline/analyzer-comparison.md`。
