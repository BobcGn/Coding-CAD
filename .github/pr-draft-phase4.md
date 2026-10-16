# PR Draft: Phase 4 — Brownfield Architecture Workspace / 阶段 4 Brownfield 架构工作区 PR 草稿

分支 / Branch: `codex/phase-4-brownfield-workspace`  
目标基线 / Target Baseline: `bf3726b` (main)

---

## 1. 做了什么 / What

- 步骤 0：固化 PR、退出报告、变更记录（change-record）与步骤汇报的统一记录格式；更新 `.github/pull_request_template.md`、`AGENTS.md`、`CLAUDE.md`、`docs/documentation-guidelines.md`、`docs/logging-system.md`、`logs/Standards/current.md`、`logs/README.md`、`scripts/ci/check-change-record.mjs` 以及新增 `scripts/ci/check-change-record.test.mjs`。
- 步骤 1：真值基准与当前基线；整理 `coding-cad-golden.json` 真值与差异清单，建立 `small-monorepo`、`small-single-repo`、合成大型夹具 `synthetic-large-repo`（30包、120模块、147边，明确标为合成），实现基准测试工具 `benchmark.ts`，如实生成并持久化修改前基线报告。
- 新建阶段 4 PR 草稿 `.github/pr-draft-phase4.md`（按新统一格式书写），未触碰未跟踪文件 `.github/pr-draft-phase3.md`。

- Step 0: Standardized the unified recording format for PR descriptions, exit reports, change records (change-record), and step reports; updated `.github/pull_request_template.md`, `AGENTS.md`, `CLAUDE.md`, `docs/documentation-guidelines.md`, `docs/logging-system.md`, `logs/Standards/current.md`, `logs/README.md`, `scripts/ci/check-change-record.mjs`, and added `scripts/ci/check-change-record.test.mjs`.
- Step 1: Ground truth benchmarks and pre-change baseline; authored `coding-cad-golden.json` comparing README and package.json with discrepancies noted, added `small-monorepo`, `small-single-repo`, and `synthetic-large-repo` (30 packages, 120 modules, 147 connections labeled SYNTHETIC), built `benchmark.ts` harness, and recorded pre-change baseline.
- Initialized Phase 4 PR draft `.github/pr-draft-phase4.md` under the new format without modifying untracked `.github/pr-draft-phase3.md`.

---

## 2. 为什么这么做 / Why

- 统一工程治理与审计轨迹：建立“1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification”三段式顺序结构，中英双语，杜绝信息缺失或格式漂移。
- 自动化门禁保障：在 CI 和 `pnpm check:changelog` 中对变更记录执行格式单元测试与新增条目校验，防止非合规记录进入代码库。
- 保护既有分支与文件：严格基于最新 main（Phase 3 exit `bf3726b`）工作，避免污染其他分支历史或遗留文件。
- 数据驱动改进：在改动 Analyzer 提取逻辑前确立严格的真值对照与客观基线，不修改实现，确保后续优化的准确率与召回率具有真实对照依据。

- Unified engineering governance and audit trail: enforce the 3-section sequence (What -> Why -> Verification) in bilingual format across all records, eliminating missing rationales or drifting formats.
- Automated gate protection: test and enforce format validation during `pnpm check:changelog` and `pnpm ci:verify`.
- Protect branch and file boundaries: work strictly from latest main (`bf3726b`) without touching other branch histories or untracked legacy files.
- Data-driven iteration: establish tamper-proof ground truth and baseline numbers before modifying analyzer implementation.

---

## 3. 验证结果 / Verification

### 验证状态 / Verification Status
- [x] 已实现并验证 / Implemented and verified:
  - `node --test scripts/ci/check-change-record.test.mjs`: 7/7 tests passed.
  - `pnpm check:changelog`: passed with zero errors.
  - 负控验证 / Negative control: 注入缺失 Section 2 (Why) 的非合规条目，`check-change-record` 成功拦截并报出错误；恢复后重新通过。
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`: 成功运行全套基准并生成 `logs/validation/p4-baseline/analyzer-baseline-before.json` 与 `baseline-report-before.md`。
  - 基线数字（修改前 / Pre-change）:
    - Coding-CAD 本仓库: 2 检测 / 15 期望，Precision 0.0%，Recall 0.0%，边 0/37，FAIL（零连接）。
    - small-monorepo: 0 检测 / 3 期望，Precision 0.0%，Recall 0.0%，边 0/3，FAIL（0 模块 0 连接）。
    - small-single-repo: 4 检测 / 4 期望，Precision 100.0%，Recall 100.0%，边 4/4，Precision 100.0%，Recall 100.0%，PASS。
    - synthetic-large-repo: 0 检测 / 120 期望，Precision 0.0%，Recall 0.0%，边 0/147，FAIL（0 模块 0 连接）。
- [ ] 已实现未验证 / Implemented but unverified:
  - 后续步骤（步骤 2–6）待在各自步骤中实施与验证。 / Subsequent steps (Steps 2–6) to be implemented and verified.
- [ ] 未实现 / Not implemented:
  - 阶段 4 后续功能（Analyzer 分层提取、Brownfield 流水线、合规导航、阶段验收与退出报告）。

### 风险与回退方式 / Risks and Rollback
- 风险 / Risk: 格式检查脚本对历史日志的兼容性；合成大仓库体积。已通过 `allowLegacy` 保证旧日志兼容，合成夹具严格限定在测试目录并显式标注 SYNTHETIC。
- 回退方式 / Rollback: 若需回退步骤 1，执行 `git revert <step-1-commit-hash>`；回退步骤 0 则执行 `git revert <step-0-commit-hash>`。
