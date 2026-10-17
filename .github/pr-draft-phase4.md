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
- 步骤 3：Brownfield 产品流水线（服务端安全路由、ELK 布局、证据面板与分组折叠，`a6d5781`）：
  - 编写 `docs/brownfield-pipeline-design.md` 说明宿主边界与安全模型；
  - 实现 `/api/workspace/analyze-repository` 服务端路由及 `server.test.ts` 负控测试；
  - `scanner.ts` 过滤外部软链接与 `.env*`/`.pem`/`.key` 敏感文件，`architecture-mapper.ts` 附加 `module:<pkgStem>` 分组标签；
  - Web 端控制器重建 `ArchitectureProject` 并触发 ELK 求解器，Canvas 与 Inspector 实现分组折叠/展开与证据先验展示；
  - 新增 `apps/web/e2e/brownfield.spec.ts` 并通过真实 ELK 求解器双模式验收。
- 步骤 3.1：补齐证据与安全加固（Host/Origin 白名单、软链接防环/外链显式报告、超限截断负控与浏览器双模式实测）：
  - 路由安全加固：落实 `CODING_CAD_ENABLE_REPOSITORY_ANALYSIS` 开关（默认关闭，未启用 403）、Host 头白名单（阻断 DNS rebinding）、Origin 跨源校验、强制 Content-Type: application/json；
  - 完善负控测试：单文件超限（`oversized-file`）、文件总数超限（`file-count`）、耗时超时（`timeout`）、外部软链接逃逸跳过并显式报告（`symlink-outside-root`）、软链接成环阻断递归；`server.test.ts` 扩展至 19/19 项测试全部通过；
  - 扫描器与分析器过滤：`IGNORED_DIRECTORIES` 追加 `.pnpm-store` 等依赖包存储与构建输出；AST 解析限制针对 JS/TS 脚本文件，杜绝非代码静态文件的误报；
  - 补充实测证据：刷新 `logs/validation/p4-baseline/` 基准并对齐 `coding-cad-golden.json`；新增 `apps/web/e2e/brownfield-benchmarks.spec.ts` 并在 Chromium 浏览器中测定 dev 与 preview 双模式下本仓库与 120 模块合成夹具实测数据（100% ELK 求解器，0 节点重叠，0 包含失败，生成 `logs/validation/p4-browser/benchmark-report.md`）。
- 步骤 4：架构期望基线合规检查与双向问题导航（`docs/brownfield-compliance-design.md`、`packages/implementation-validator/`、`apps/web/`）：
  - 编写设计说明，明确期望基线权威来源机制与未加载时的显式不可用状态（Explicit Unavailable State）；
  - 逐条界定 5 条 Validator 规则在 Brownfield 下的检出能力与物理局限，将代码契约规则透明标记为“无法验证”；
  - 扩展 `implementation-validator`：导出 `IssueTarget`、`resolveIssueTarget`、`isContractIssue` 与 `createImplementationModel`；修复 `technology-rule.ts` 漏报缺陷；
  - 编写双基线夹具（Golden 期望 `coding-cad-expected.json` 与 Drifted 偏离 `coding-cad-drifted.json`），单测与集成测试全量验证通过；
  - Web 端实现基线预设加载、不可用横幅、角标渲染（`[无法验证]`、`[待人工确认]`）、画布受控自动展开折叠分组以及 Inspector 双向联动；
  - 真实浏览器 Playwright E2E（`apps/web/e2e/brownfield.spec.ts`）在 dev 与 preview 双模式全数通过，100% 验证 ELK 求解器。
- 新建并增量维护阶段 4 PR 草稿 `.github/pr-draft-phase4.md`，未触碰未跟踪文件 `.github/pr-draft-phase3.md`。

- Step 3: Brownfield product pipeline (`a6d5781`).
- Step 3.1: Evidence replenishment and security hardening (feature switch, Host/Origin whitelist, symlink loop/escape safety, truncation negative controls, and real browser dual-mode benchmarks).
- Step 4: Expected architecture baseline compliance verification and bidirectional problem navigation (design doc, validator adaptation, golden/drifted fixtures, web presets, explicit unavailable banner, auto-expansion, badges, inspector sync, E2E tests).
- Maintained `.github/pr-draft-phase4.md` incrementally without touching untracked `.github/pr-draft-phase3.md`.

---

## 2. 为什么这么做 / Why

- 统一工程治理与审计轨迹：建立“1. 做了什么 / What -> 2. 为什么这么做 / Why -> 3. 验证结果 / Verification”三段式顺序结构，中英双语，杜绝信息缺失或格式漂移。
- 自动化门禁保障：在 CI 和 `pnpm check:changelog` 中对变更记录执行格式单元测试与新增条目校验，防止非合规记录进入代码库。
- 保护既有分支与文件：严格基于最新 main（Phase 3 exit `bf3726b`）工作，避免污染其他分支历史或遗留文件。
- 数据驱动改进：在改动 Analyzer 提取逻辑前确立严格的真值对照与客观基线；分层提取改造完成后，通过基准测试脚本自动计算 Precision 与 Recall，以实测数据量化证明提取质量。
- 严守架构与模型边界：拒绝为反演器特化而篡改 Architecture IR 公开类型，利用现有 `tags` 与 `constraints` 承载证据与置信度；通过带类型的编解码器 `evidence-codec.ts` 隔绝底层字符串格式变动；清除 `capabilities` 语义污染，避免下游 Validator 与 Blueprint 误读。
- 安全优先设计：SvelteKit 服务端路由读取本地目录必须限制在 loopback 本机，通过 Host 头白名单阻断 DNS rebinding，通过 realpath 拦截目录逃逸符号链接，过滤凭据文件并从 DTO 中彻底剔除源码正文。
- 渐进式呈现与架构保真：采用 `module:<pkgStem>` 分组容器与折叠交互降低大图视觉过载，并通过角标明确显示折叠成员数量。
- 架构事实来源与零假通过：Brownfield 场景打开仓库只有实现事实，拒绝系统伪造假期望；未加载基线时展示显式不可用横幅。Analyzer 未提取契约时诚实标记“无法验证”，杜绝静默假阳性或假阴性。
- 双向导航可用性闭环：点击问题时若目标节点被隐藏在折叠的模块容器内部，系统受控自动展开父容器并居中聚焦，使问题定位无缝衔接。

- Unified engineering governance and audit trail: enforce the 3-section sequence (What -> Why -> Verification) in bilingual format across all records.
- Automated gate protection: test and enforce format validation during `pnpm check:changelog` and `pnpm ci:verify`.
- Protect branch and file boundaries: work strictly from latest main (`bf3726b`) without touching untracked legacy files.
- Data-driven iteration: established ground truth and pre-change baseline in Step 1, followed by automated evaluation in Step 2 proving massive recall improvements.
- Strict architecture boundary preservation: rejected altering Architecture IR public types, leveraging existing tags and constraints via typed codec; purged `capabilities` semantic pollution to protect downstream validators and blueprints.
- Security-first host boundary: strictly contained server route filesystem access to loopback, sanitized paths with realpath, ignored secret files, and excluded source text from DTOs.
- Progressive disclosure: container grouping and collapse/expand badges manage visual density on large graphs.
- Architecture source of truth & zero false passes: reject synthetic baseline hallucination; explicit unavailable state prevents false passes. Honest "Cannot Verify" contract labels prevent silent degradation.
- Bidirectional navigation UX: auto-expanding parent containers when focusing problem targets bridges density with problem discoverability.

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
    - **Coding-CAD 本仓库** (L1-manifest): 15/15 模块 (100.0% P / 100.0% R), 39/39 边 (100.0% P / 100.0% R, Resolved Edges = 39).
    - **small-monorepo** (L2-hand-annotated): 3/3 模块 (100.0% P / 100.0% R), 3/3 边 (100.0% P / 100.0% R, Resolved Edges = 3).
    - **small-single-repo** (L2-hand-annotated): 4/4 模块 (100.0% P / 100.0% R), 4/4 边 (100.0% P / 100.0% R, Resolved Edges = 4).
    - **edge-cases-repo** (L2-hand-annotated): 5/5 模块 (100.0% P / 100.0% R), 4/4 边 (100.0% P / 100.0% R, Resolved Edges = 4).
    - **synthetic-large-repo** (synthetic): 120/120 模块 (100.0% P / 100.0% R), 147/147 边 (100.0% P / 100.0% R, Resolved Edges = 147).
  - 服务端安全路由负控 / Server route tests (`apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`): 19/19 passed (DNS rebinding, origin, Content-Type, truncation, symlinks).
  - Web unit 测试: 15/15 文件, 81/81 passed.
  - Web integration 测试: 3/3 文件, 9/9 passed.
  - Web typecheck: 0 errors, 0 warnings.
  - Playwright E2E 真实浏览器双模式测试 (`apps/web/e2e/brownfield.spec.ts` & `apps/web/e2e/brownfield-benchmarks.spec.ts`):
    - `brownfield.spec.ts` 在 dev 与 preview 双模式下均全量通过，断言不可用横幅、漂移基线、所有合规角标、自动展开父分组、聚焦元素、Inspector 双向联动、Golden 基线 0 偏差全合规、以及 100% ELK 求解器执行与零 fallback。
    - `brownfield-benchmarks.spec.ts` 在 dev 与 preview 双模式下均全量通过，测定 Coding-CAD（39边，0重叠，0包含失败，100% ELK）与 120 模块合成大图（147边，0重叠，0包含失败，100% ELK）。
  - `pnpm build && pnpm test`: 全工作区全量通过。
- [ ] 已实现未验证 / Implemented but unverified:
  - 步骤 5 的用户人工可理解性评估表（需待用户实际填写验收）。
- [ ] 未实现 / Not implemented:
  - 阶段 4 退出报告与 PR 最终合流。

### 风险与回退方式 / Risks and Rollback
- 风险 / Risk: 针对非标准工作区（如使用 lerna 或自定义路径）可能需要额外模式适配；已通过 `UnsupportedStructureReport` 提供显式告警而非静默降级。
- 回退方式 / Rollback: 每个步骤拥有独立提交，可严格逆序回退：
  - 回退步骤 3.1: `git revert <step-3.1-commit-hash>`
  - 回退步骤 3: `git revert a6d5781`
  - 回退步骤 2.1: `git revert 9ede079`
  - 回退步骤 2: `git revert c38ef3f`
  - 回退步骤 0 门禁修复: `git revert ddc11f2`
  - 回退步骤 1: `git revert f78a2e5`
  - 回退步骤 0: `git revert 876e07c`
