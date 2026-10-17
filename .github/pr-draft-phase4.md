# PR Draft: Phase 4 — Brownfield Architecture Workspace / 阶段 4 Brownfield 架构工作区 PR 草稿

分支 / Branch: `codex/phase-4-brownfield-workspace`  
目标基线 / Target Baseline: `bf3726b` (main)

---

## 1. 做了什么 / What

- 步骤 0：固化 PR、退出报告、变更记录（change-record）与步骤汇报的统一记录格式；更新 `.github/pull_request_template.md`、`AGENTS.md`、`CLAUDE.md`、`docs/documentation-guidelines.md`、`docs/logging-system.md`、`logs/Standards/current.md`、`logs/README.md`、`scripts/ci/check-change-record.mjs` 以及新增 `scripts/ci/check-change-record.test.mjs`。
- 步骤 1：真值基准与当前基线；整理 `coding-cad-golden.json` 真值与差异清单，建立 `small-monorepo`、`small-single-repo`、合成大型夹具 `synthetic-large-repo`（30包、120模块、147边，明确标为合成），实现基准测试工具 `benchmark.ts`，如实生成并持久化修改前基线报告。
- 步骤 2：Analyzer 证据模型与分层提取（`c38ef3f`）：实现 L1 工作区 package 清单提取、L2 TypeScript Compiler API 文件级 import 解析、L3 公开导出提取、L4 目录归组与 UnsupportedStructureReport 显式报告。
- 步骤 2.1：Analyzer 补强：跨包 L2 交叉校验、证据编解码与语义污染防御：
  - 独立提交 `ddc11f2`，修复 `check-change-record.mjs` 正则避免列表项误判为标题，通过负控测试；
  - L2 交叉校验分类（`declared-and-used`、`declared-unused`、`undeclared-used`）与依赖种类（runtime/dev/peer）；
  - 诚实区分 `L1-manifest` 与 `L2-hand-annotated` 真值；
  - 新增 `edge-cases-repo` 覆盖 barrel `export *`、`import type`、`await import(...)` 动态导入、`tsconfig paths` 别名、循环导入、未声明工作区依赖、语法错误文件；
  - 封装类型化证据编解码器 `evidence-codec.ts`（Layer Prior 定义）；
  - 将 `export:<Symbol>` 移出 `capabilities` 消除语义污染，将 warnings 移出 `intent.purpose`；
  - 实测 `ImplementationValidator` 兼容性（0 误报）；
  - 全量基准测试 5 个夹具全部 PASS，代码导入边（resolvedCount）全部非 0。
- 新建并增量维护阶段 4 PR 草稿 `.github/pr-draft-phase4.md`，未触碰未跟踪文件 `.github/pr-draft-phase3.md`。

- Step 0: Standardized the unified recording format for PR descriptions, exit reports, change records, and step reports; updated PR template, AGENTS.md, CLAUDE.md, docs, logs, and check-change-record scripts.
- Step 1: Ground truth benchmarks and pre-change baseline; authored `coding-cad-golden.json`, added fixtures (`small-monorepo`, `small-single-repo`, `synthetic-large-repo`), built `benchmark.ts`, and recorded pre-change baseline.
- Step 2: Analyzer evidence model and layered extraction (`c38ef3f`).
- Step 2.1: Analyzer hardening: cross-package L2 cross-validation, typed evidence codec, and semantic pollution defense:
  - Standalone commit `ddc11f2` fixing CI change record gate regex, verified with negative controls.
  - L2 cross-validation classification (`declared-and-used`, `declared-unused`, `undeclared-used`) and dependency kinds (`runtime`, `dev`, `peer`).
  - Honest distinction between `L1-manifest` and `L2-hand-annotated` truth levels.
  - New `edge-cases-repo` covering barrel `export *`, `import type`, `await import(...)`, `tsconfig paths` alias, circular imports, undeclared workspace imports, and syntax errors.
  - Typed evidence codec `evidence-codec.ts` defining Layer Priors.
  - Removed `export:<Symbol>` from `capabilities` and warnings from `intent.purpose` to prevent semantic pollution.
  - Verified `ImplementationValidator` compatibility with 0 false positives.
  - All 5 benchmark fixtures pass with non-zero resolved code imports.
- Maintained `.github/pr-draft-phase4.md` incrementally without touching untracked `.github/pr-draft-phase3.md`.

---

## 2. 为什么这么做 / Why

- 统一工程治理与审计轨迹：建立“1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification”三段式顺序结构，中英双语，杜绝信息缺失或格式漂移。
- 自动化门禁保障：在 CI 和 `pnpm check:changelog` 中对变更记录执行格式单元测试与新增条目校验，防止非合规记录进入代码库。
- 保护既有分支与文件：严格基于最新 main（Phase 3 exit `bf3726b`）工作，避免污染其他分支历史或遗留文件。
- 数据驱动改进：在改动 Analyzer 提取逻辑前确立严格的真值对照与客观基线；分层提取改造完成后，通过基准测试脚本自动计算 Precision 与 Recall，以实测数据量化证明提取质量。
- 严守架构与模型边界：拒绝为反演器特化而篡改 Architecture IR 公开类型，利用现有 `tags` 与 `constraints` 承载证据与置信度；通过带类型的编解码器 `evidence-codec.ts` 隔绝底层字符串格式变动；清除 `capabilities` 语义污染，避免下游 Validator 与 Blueprint 误读。

- Unified engineering governance and audit trail: enforce the 3-section sequence (What -> Why -> Verification) in bilingual format across all records.
- Automated gate protection: test and enforce format validation during `pnpm check:changelog` and `pnpm ci:verify`.
- Protect branch and file boundaries: work strictly from latest main (`bf3726b`) without touching untracked legacy files.
- Data-driven iteration: established ground truth and pre-change baseline in Step 1, followed by automated evaluation in Step 2 proving massive recall improvements.
- Strict architecture boundary preservation: rejected altering Architecture IR public types, leveraging existing tags and constraints via typed codec; purged `capabilities` semantic pollution to protect downstream validators and blueprints.

---

## 3. 验证结果 / Verification

### 验证状态 / Verification Status
- [x] 已实现并验证 / Implemented and verified:
  - `node --test scripts/ci/check-change-record.test.mjs`: 8/8 tests passed.
  - `pnpm check:changelog`: passed with zero errors.
  - 负控验证 / Negative control: 注入缺少 Section 2 (Why) 的非合规条目，`check-change-record` 成功拦截并报出错误；恢复后重新通过。
  - `pnpm --filter @coding-cad/implementation-analyzer test`: passed on all unit test suites (codec, example-project, small-monorepo, edge-cases-repo).
  - `pnpm --filter @coding-cad/implementation-validator test`: passed, confirming 0 false positives from evidence strings/tags on Coding-CAD and synthetic fixtures.
  - 基线对比数据 / Baseline Comparison (`pnpm --filter @coding-cad/implementation-analyzer benchmark`):
    - **Coding-CAD 本仓库** (L1-manifest):
      - 模块: 从 Before 0% (2/15) 提升至 After **100.0% P / 100.0% R** (15/15 核心包与应用全部识别，来源均为 `declared`，置信度 1.00)。
      - 连接: 从 Before 0% (0/37) 提升至 After **97.4% P / 100.0% R** (38/37，100% 召回 package.json 声明边，38 条边全部经 AST 代码导入确认，Resolved Edges = 38)。
    - **small-monorepo** (L2-hand-annotated):
      - 模块: 从 Before 0% (0/3) 提升至 After **100.0% P / 100.0% R** (3/3)。
      - 连接: 从 Before 0% (0/3) 提升至 After **100.0% P / 100.0% R** (3/3，全部 3 条边经 AST 代码导入确认，Resolved Edges = 3)。
    - **small-single-repo** (L2-hand-annotated):
      - 模块与连接: 均保持 **100.0% P / 100.0% R** (4/4 模块，4/4 边，Resolved Edges = 4)。
    - **edge-cases-repo** (L2-hand-annotated):
      - 模块与连接: **100.0% P / 100.0% R** (5/5 模块，4/4 边，包含 3 声明且使用，1 未声明使用，1 语法错误显式报告，Resolved Edges = 4)。
    - **synthetic-large-repo** (synthetic):
      - 模块: 从 Before 0% (0/120) 提升至 After **100.0% P / 100.0% R** (120/120)。
      - 连接: 从 Before 0% (0/147) 提升至 After **100.0% P / 100.0% R** (147/147，Resolved Edges = 147)。
  - `pnpm build && pnpm test`: 全工作区 30/30 任务全部成功通过。
- [ ] 已实现未验证 / Implemented but unverified:
  - 步骤 3 的 Web 产品流水线连接（打开仓库 -> 反演 -> 重建 IR -> Layout -> 展示）。
  - 步骤 4 的 Validator 问题双向导航与契约检查状态展示。
  - 步骤 5 的真实浏览器 E2E 双模式验收（断言 ELK 来源）。
  - 步骤 5 的用户人工可理解性评估表（需待用户实际填写验收）。
- [ ] 未实现 / Not implemented:
  - 阶段 4 后续功能（Brownfield 流水线、合规导航、阶段验收与退出报告）。

### 风险与回退方式 / Risks and Rollback
- 风险 / Risk: 针对非标准工作区（如使用 lerna 或自定义路径）可能需要额外模式适配；已通过 `UnsupportedStructureReport` 提供显式告警而非静默降级。
- 回退方式 / Rollback: 每个步骤拥有独立提交，可严格逆序回退：
  - 回退步骤 2.1: `git revert <step-2.1-commit-hash>`
  - 回退步骤 2: `git revert c38ef3f`
  - 回退步骤 0 门禁修复: `git revert ddc11f2`
  - 回退步骤 1: `git revert f78a2e5`
  - 回退步骤 0: `git revert 876e07c`
