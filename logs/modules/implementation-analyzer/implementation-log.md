# 实施日志 / Implementation Log

## 2026-08-09 - Implementation Analyzer 第一阶段 / Implementation Analyzer Phase One

状态：已验证。

Status: Verified.

变更：

- 新增 Repository Scanner、Technology Detector、Module Analyzer 和 Dependency Graph。
- 实现 Node.js/TypeScript manifest、service 文件、相对 import 和数据库 client import 识别。
- 将仓库证据映射为 Architecture IR，不建立第二套架构模型。
- 新增 NestJS、PostgreSQL、Redis 示例项目和 Repository → ArchitectureProject 测试。

Changes:

- Added Repository Scanner, Technology Detector, Module Analyzer, and Dependency Graph.
- Implemented Node.js/TypeScript manifest, service-file, relative-import, and database-client-import detection.
- Mapped repository evidence into Architecture IR without creating a second architecture model.
- Added a NestJS, PostgreSQL, and Redis example project plus Repository-to-ArchitectureProject tests.

验证：

- `pnpm --filter @coding-cad/implementation-analyzer test`：通过。
- `pnpm ci:verify`：通过，workspace 共 14 个模块。

Validation:

- `pnpm --filter @coding-cad/implementation-analyzer test`: passed.
- `pnpm ci:verify`: passed, with 14 workspace modules.


## 2026-10-16 - 阶段 4 步骤 2：Analyzer 证据模型与分层提取 / Phase 4 Step 2: Analyzer Evidence Model and Layered Extraction

### 1. 做了什么 / What
- 增强 `packages/implementation-analyzer`：
  - L1: `RepositoryScanner` 与 `ModuleAnalyzer` 识别 `pnpm-workspace.yaml` 与 `package.json` workspaces，提取 monorepo packages（来源 `declared`，置信度 1.00）；
  - L2: 使用 TypeScript Compiler API（`ts.createSourceFile`）实现文件级 import 语法解析，彻底替代正则匹配，支持相对路径与包名依赖解析（来源 `resolved`，置信度 0.90）；
  - L3: 使用 TypeScript Compiler API 解析公开导出（函数、类、变量、接口、类型别名），写入 Component 的 `capabilities`（`export:<Name>`）与 description（来源 `resolved`）；
  - L4: 单体仓库中对未由 service 文件覆盖的子目录，使用目录归组策略提取为模块（来源 `inferred`，置信度 0.65）；
- 证据与置信度模型：在 Component 的 `tags`（`source:<declared|resolved|inferred>`、`confidence:<0.xx>`、`path:<path>`）与 Connection 的 `constraints`（`source:...`、`Detection confidence: <0.xx>`、`evidence:...`）中携带完整证据与置信度，不破坏 Architecture IR 的公开模型契约；
- 不支持结构显式报告：增加 `UnsupportedStructureReport`，显式收集并报告不支持的 manifest（`pom.xml`, `go.mod`, `Cargo.toml` 等）、非 TS/JS 语言、语法错误以及未识别的工作区结构，不在控制台或图上静默吞没；
- 边界约束遵守：仅使用 TypeScript Compiler API 语法树解析与导出提取，绝不引入语义类型推断、自动领域推断或契约字段猜测；
- 验证与基线比对：更新 `benchmark.ts` 输出 `logs/validation/p4-baseline/analyzer-baseline-after.json` 与 `baseline-report-after.md`，并生成前后对比表 `analyzer-comparison.md`；更新 `analyzer.test.ts` 补充 monorepo 与证据模型单测。
- Enhanced `packages/implementation-analyzer`:
  - L1: Discovered `pnpm-workspace.yaml` and `package.json` workspaces in `RepositoryScanner` and `ModuleAnalyzer` (source: `declared`, confidence: 1.00).
  - L2: Replaced regular expression import parsing with TypeScript Compiler API (`ts.createSourceFile`) for AST-accurate import resolution (source: `resolved`, confidence: 0.90).
  - L3: Extracted public exports (functions, classes, consts, interfaces, type aliases) via Compiler API into Component `capabilities` and descriptions (source: `resolved`).
  - L4: Maintained directory-grouping fallback for uncovered single-repo directories (source: `inferred`, confidence: 0.65).
- Evidence & Confidence: Carried source classification and confidence scores in Component `tags` and Connection `constraints` without altering Architecture IR public types.
- Explicit Unsupported Reports: Added `UnsupportedStructureReport` capturing unsupported manifests, non-TS/JS languages, syntax errors, and unrecognized layouts.
- Preserved Boundaries: Strictly used Compiler API for syntactic parsing without full type inference, semantic deduction, or contract synthesis.
- Baseline Comparison: Updated `benchmark.ts` to output `analyzer-baseline-after.json`, `baseline-report-after.md`, and `analyzer-comparison.md`; added monorepo and evidence unit tests in `analyzer.test.ts`.

### 2. 为什么这么做 / Why
- 动机：旧版 Analyzer 仅硬编码扫描根 `src/` 与单个 service 正则，导致 Coding-CAD 本仓库及任何标准 pnpm monorepo 在反演时产生 0 模块与 0 依赖边的崩溃性假阴性（步骤 1 基线已证明）；同时正则解析 import 脆弱且无法提取真实导出。
- 备选方案与取舍：
  - 备选方案 A：修改 Architecture IR 核心类型，新增 `evidence`、`confidence`、`source` 等专有字段。被否决：违反 Architecture IR 稳定性与单一架构事实源约束，IR 属于业务架构意图，不应为反演器特化公开模型。因此选择复用已有的 `tags`、`capabilities`、`description` 和 `constraints`。
  - 备选方案 B：引入完整 TypeScript TypeChecker / Program。被否决：类型检查耗时大、内存占用高，且超出已批准的“仅限模块解析与导出提取，不做类型推断与语义分析”约束。采用轻量语法级 AST 解析（`ts.createSourceFile`）即达到 100% 召回且执行时间仅需数十毫秒。
- Motivation: The legacy analyzer only supported single root `src/` structures with fragile regex matching, yielding 0 modules and 0 connections on monorepos.
- Tradeoffs: Rejected modifying Architecture IR public types for evidence fields to protect IR boundaries; rejected full `TypeChecker`/`Program` semantic analysis in favor of syntactic AST parsing (`ts.createSourceFile`) to maintain sub-second performance and adhere to user boundaries.

### 3. 验证结果 / Verification
- 单元测试 / Unit tests: `pnpm --filter @coding-cad/implementation-analyzer test` 全部通过（包含 example-project 单体仓库、small-monorepo 工作区、证据与置信度标签断言、导出提取断言）。
- 依赖测试 / Downstream tests: `pnpm --filter @coding-cad/implementation-validator test` 全部通过（验证 IR 标签与约束未造成破坏）。
- 基线对比 / Benchmark Comparison (`pnpm --filter @coding-cad/implementation-analyzer benchmark`):
  - Coding-CAD 本仓库: 模块从 0% 召回提升至 15/15 (100.0% P / 100.0% R)；依赖边从 0% 提升至 38/37 (97.4% P / 100.0% R，覆盖全部 13 个核心包与 2 个应用，100% 召回 package.json 声明边并确认 architecture-review devDependency 差异)。
  - small-monorepo: 模块从 0/3 (0%) 提升至 3/3 (100.0% P / 100.0% R)；依赖边 3/3 (100.0% P / 100.0% R)。
  - small-single-repo: 保持 4/4 (100.0% P / 100.0% R)；依赖边 4/4 (100.0% P / 100.0% R)。
  - synthetic-large-repo: 模块从 0/120 (0%) 提升至 120/120 (100.0% P / 100.0% R)；依赖边从 0/147 提升至 147/147 (100.0% P / 100.0% R)。
- 状态分类 / Status: 已实现并验证（步骤 2 全部范围）。
- 风险与回退 / Risks & Rollback: 回退本步骤可执行 `git revert <step-2-commit>`。

## 2026-10-16 - 阶段 4 步骤 2.1：Analyzer 补强：跨包 L2 交叉校验、证据编解码与语义污染防御 / Phase 4 Step 2.1: Analyzer Hardening: Cross-Package L2 Cross-Validation, Typed Evidence Codec, and Semantic Pollution Defense

### 1. 做了什么 / What
- 提交拆分与历史卫生：
  - 将先前未推送提交中对 `scripts/ci/check-change-record.mjs` 的正则修复软重置并独立提交为 `ddc11f2` (`fix(ci): refine change record header regex to ignore list bullets`)；
  - 补充 `scripts/ci/check-change-record.test.mjs` 单测与负控测试，确保列表条目不被误判为标题，同时缺少任一章节依然被拦截；
- L2 交叉校验与依赖种类标注：
  - 在 `packages/implementation-analyzer/src/graph/dependency-graph.ts` 中比对 package.json 声明与 AST 文件级 import，对所有边产出显式分类：`declared-and-used`（声明且使用）、`declared-unused`（仅声明未使用）、`undeclared-used`（未声明使用）；
  - 为边标注依赖种类：`runtime`、`dev`、`peer`，完整保留边数不随意丢弃；
- 真值诚实表述：
  - 更新 `packages/implementation-analyzer/src/benchmark.ts`，在表头与说明中严格区分 `L1-manifest`（真值与分析器均源自 package.json）、`L2-hand-annotated`（经人工独立标注）、`synthetic`（合成大规模夹具）；
  - 统计所有边的交叉分类与 AST 确认导入数（`resolvedCount`），确保所有夹具中代码导入数均严格大于 0；
- 强化边缘用例夹具：
  - 新建 `packages/implementation-analyzer/fixtures/edge-cases-repo/`，覆盖：barrel `export *`、`import type`、`await import(...)` 动态导入、`tsconfig paths` 别名解析（`@utils/*`）、循环导入（A <-> B）、未声明工作区依赖、语法错误文件（`broken.ts`）；
  - 提供人工独立标注的 `truth.json`；
  - 在 `analyzer.test.ts` 中断言全部用例要么得到正确解析，要么显式输出 `unparseable-syntax` 报告，绝不静默丢弃；
- 类型化证据编解码封装：
  - 新增 `packages/implementation-analyzer/src/codec/evidence-codec.ts`，导出 `encodeComponentTags`、`decodeComponentEvidence`、`encodeConnectionConstraints`、`decodeConnectionEvidence`、`formatLayerPriorExplanation`；
  - 明确置信度文档定义为“层级先验”（Layer Prior：declared 1.00, resolved 0.90, inferred 0.65），非统计准确率；
- 语义字段污染清除：
  - 将 `export:<Symbol>` 彻底从 Component 的 `capabilities` 移入 `tags`，防止下游 Validator、Execution Blueprint 和 Layout Classifier 误读；
  - 将不支持结构警告从 `intent.purpose` 移出，保持 purpose 纯净描述，警告统一通过 `RepositoryInspection.unsupportedStructures` 传递；
- Validator 兼容实测：
  - 在 `packages/implementation-validator/src/analyzer-compatibility.test.ts` 中针对 Coding-CAD 本仓库与合成大图反演架构运行 `ImplementationValidator`，证实 evidence 字符串不触发 `not-primary-storage` 等限制关键词误报，验证通过率 100%。

- Commit Hygiene & Gate Hardening:
  - Soft-reset unpushed CI gate regex fix into standalone commit `ddc11f2` (`fix(ci): refine change record header regex to ignore list bullets`).
  - Added unit tests in `check-change-record.test.mjs` verifying negative controls (missing any section still rejected).
- L2 Cross-Validation & Dependency Kinds:
  - Compared package.json declarations against AST resolved imports in `dependency-graph.ts` to categorize edges into `declared-and-used`, `declared-unused`, and `undeclared-used`.
  - Tagged dependency kinds (`runtime`, `dev`, `peer`) on connection evidence.
- Honest Ground Truth Representation:
  - Updated `benchmark.ts` to distinguish `L1-manifest`, `L2-hand-annotated`, and `synthetic` truth levels.
  - Added connection cross-validation breakdown and AST resolved count (`resolvedCount > 0`).
- Edge-Case Fixture & Invariants:
  - Created `fixtures/edge-cases-repo/` testing barrel `export *`, `import type`, `await import(...)`, `tsconfig paths` alias, circular imports, undeclared workspace imports, and syntax errors (`broken.ts`).
  - Hand-annotated `truth.json` and verified all cases resolve or report explicit `unparseable-syntax`.
- Typed Evidence Codec:
  - Created `evidence-codec.ts` with round-trip encode/decode helpers and explicit Layer Prior definitions.
- Semantic Field Pollution Clean-up:
  - Moved `export:<Symbol>` from `capabilities` to `tags` to preserve capability semantics across downstream validators and blueprints.
  - Removed unsupported structure warning text from `intent.purpose`, routing warnings exclusively through typed inspection structures.
- Validator Compatibility Verification:
  - Added `analyzer-compatibility.test.ts` in `@coding-cad/implementation-validator` validating that evidence tags/strings produce 0 false positives against approved architecture limitations.

### 2. 为什么这么做 / Why
- 动机：步骤 2 遗留了门禁脚本混杂、未区分 manifest 与代码真实使用（导致 resolved 计数为 0）、真值混淆、缺少边缘语法测试、`export:*` 污染 `capabilities` 语义、以及缺少 Validator 兼容实证等问题。
- 备选方案与取舍：
  - 备选方案 A：直接修改 Architecture IR 引入新字段。被否决：违反单一事实源与核心类型稳定性原则。采用带类型的编解码器 `evidence-codec.ts` 将证据隔离在 `tags` 与 `constraints` 内是经过批准的最佳过渡方案。
  - 备选方案 B：将 `export:<Symbol>` 保留在 `capabilities`。被否决：下游 `architecture-validator` 与 `execution-blueprint` 将 `capabilities` 视为主干能力意图，混入数百个函数导出名会破坏能力合规检查与 AI prompt 生成。移入 `tags` 并由编解码器读取彻底根除了语义污染。

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-analyzer test`：通过（7/7 测试全部通过，包含 codec 单测、单体、monorepo 与 7 大边缘用例）；
  - `pnpm --filter @coding-cad/implementation-validator test`：通过（包含 analyzer-compatibility 实测，0 误报）；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：通过（所有 5 个夹具全部 PASS，resolved edges 计数全部严格 > 0）；
  - `pnpm build && pnpm test`：通过（全工作区 30 个任务全部成功）；
- 未实现：无。
- 风险与回退方式：
  - 风险：若后续步骤有直接读取裸字符串 tags 的行为需统一走 `decodeComponentEvidence`；
  - 回退方式：`git revert <commit-hash>` 可完全独立回退步骤 2.1，不影响 `ddc11f2` 的 CI 检查修复。

## 2026-10-16 - 阶段 4 步骤 3：扫描器外部链接安全防护、包分组与编解码导出 / Phase 4 Step 3: Scanner External Symlink Safety, Package Grouping, and Pure Codec Export

### 1. 做了什么 / What
- 扫描器安全加固：在 `scanner.ts` 中使用 `realpath` 解析符号链接目标，若目标超出 `rootPath` 范围则跳过不追踪；同时过滤敏感文件（`.env*`, `*.pem`, `*.key`, `id_rsa*`）。
- 包分组提取：在 `module-analyzer.ts` 与 `architecture-mapper.ts` 中提取并生成 `module:<pkgStem>` 分组标签，供布局引擎生成层次化容器与可视化折叠。
- 纯净编解码器导出：在 `package.json` 中配置 subpath `"./codec"`，提供类型化 `evidence-codec.js`，允许浏览器端安全导入而无需引入 Node.js `fs`/`path` 依赖。

- Scanner Security Hardening: Used `realpath` in `scanner.ts` to inspect symlink targets, skipping any links pointing outside `rootPath`, and excluded sensitive credential patterns (`.env*`, `*.pem`, `*.key`, `id_rsa*`).
- Package Grouping: Extracted and attached `module:<pkgStem>` group tags in `module-analyzer.ts` and `architecture-mapper.ts` to enable hierarchical layout containers and interactive collapse.
- Pure Codec Export: Added subpath export `"./codec"` in `package.json` for pure, browser-safe imports of `evidence-codec.ts`.

### 2. 为什么这么做 / Why
- 防止主机穿透：防止恶意软链接读取仓库外的敏感系统文件（如 `/etc/passwd`）。
- 模块语义聚类：使工作区包能够自然聚类为模块分组容器。
- 浏览器沙箱兼容：浏览器 UI 需要编解码置信度与证据，但不能导入依赖 Node.js 的扫描器。
- Security: Prevents symlink-based directory traversal attacks outside of the repository root.
- Visualization: Enables container-based layout grouping.
- Portability: Pure codec export allows browser consumption without Node.js polyfills.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-analyzer test`：全部通过；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：5 个真值夹具全部通过；
  - `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`：软链接安全负控与凭据忽略全部通过。
- 未实现：无。
- 风险与回退方式：
  - 风险：若用户仓库合法引用了外部符号链接，此类链接将被安全忽略；
  - 回退方式：`git revert <step-3-commit>`。

## 2026-10-16 - 阶段 4 步骤 3.1：扫描器与构建缓存过滤、软链接防环与 AST 解析白名单 / Phase 4 Step 3.1: Scanner Cache Exclusion, Symlink Cycle Prevention, and AST Parsing Extension Whitelist

### 1. 做了什么 / What
- 缓存与包管理器目录忽略（`scanner.ts`）：
  - 在 `IGNORED_DIRECTORIES` 中追加 `.pnpm-store`、`.yarn`、`.svelte-kit`、`.code-review-graph`、`.cache`、`.output`，彻底排除依赖安装包存储与大型二进制缓存；
  - 引入 `ScannerOptions`（`maxFiles`、`maxFileSizeBytes`、`timeoutMs`），支持超限提前终止与显式标记 `isTruncated`。
- 软链接安全与成环阻断：
  - 在 `collectFiles` 中通过真实物理路径集合 `visitedDirs` 跟踪目录，遇到成环链接安全终止递归，防止无限循环遍历；
  - 遇到指向根目录外的软链接，记录 `type: "symlink-outside-root"` 显式报告结构，杜绝静默丢弃。
- AST 编译器解析白名单化（`dependency-graph.ts`）：
  - 限制 `ts.createSourceFile` 仅处理 `.ts`、`.tsx`、`.js`、`.jsx`、`.mjs`、`.cjs`，跳过 Markdown、图片与 HTML，彻底消除非脚本文件的假阳性语法错误。
- 完善真值对齐：
  - 更新 `fixtures/coding-cad-golden.json`，补充 `architecture-review -> execution-blueprint` 的 devDependency 声明，基准 Precision 与 Recall 达到 100%。

- Cache & Store Directory Exclusion (`scanner.ts`): Expanded `IGNORED_DIRECTORIES` to ignore `.pnpm-store`, `.yarn`, `.svelte-kit`, `.code-review-graph`, `.cache`, and `.output`. Added `ScannerOptions` for explicit truncation.
- Symlink Cycle & Escape Handling: Added `visitedDirs` set to block directory recursion cycles and recorded explicit `symlink-outside-root` reports.
- Script-Only AST Import Parsing (`dependency-graph.ts`): Confined `ts.createSourceFile` calls strictly to JS/TS script extensions, eliminating false syntax error diagnostics on non-script assets.
- Ground Truth Alignment: Added `architecture-review -> execution-blueprint` to `coding-cad-golden.json`, achieving 100% precision and recall across all fixtures.

### 2. 为什么这么做 / Why
- 真实单体仓库扫描可用性：`.pnpm-store` 包含数千个包与多兆字节执行体，不忽略会导致扫描器超出单文件或总文件限制并产生虚假截断；
- 真实软链接拓扑鲁棒性：本地开发常见软链接成环或指向外部，必须有闭环防线与可观测报告；
- 消除编译器假阳性：Markdown 与图片不是 JS 代码，传给 TS 编译器只会产生误报。
- Monorepo Practicality: Build and pnpm stores contain thousands of binary and vendor files that exhaust file budgets if unignored.
- Robust Topology: Symlink loops must terminate safely and escapes must be reported explicitly.
- Diagnostic Purity: Non-script assets should not be parsed as TypeScript syntax.

### 3. 验证结果 / Verification
- 已实现并验证：
  - `pnpm --filter @coding-cad/implementation-analyzer test`：单测通过；
  - `pnpm --filter @coding-cad/implementation-analyzer benchmark`：5 个真值夹具全量通过（所有夹具 precision 与 recall 均为 100%）；
  - `apps/web/src/routes/api/workspace/analyze-repository/server.test.ts`：19/19 测试通过（覆盖外部软链接跳过、软链接成环、文件数截断、耗时超时截断、超限文件排除）。
- 未实现：无。
- 风险与回退方式：
  - 风险：若未来新增非常规脚本后缀（如 `.cts`），可按需扩展白名单。
  - 回退方式：`git revert <commit-hash>`。

## 2026-10-17 - 阶段 4 步骤 5：复杂网状合成夹具建立与真实代码库 AI 抽样核对 / Phase 4 Step 5: Complex Mesh Synthetic Fixture and Real Repository AI Sampling Check

### 1. 做了什么 / What
- 复杂拓扑合成夹具构造（`packages/implementation-analyzer/fixtures/synthetic-hub-repo`）：
  - 标记为纯合成夹具（`SYNTHETIC BENCHMARK FIXTURE - NOT A REAL REPOSITORY`）；
  - 包含 14 个包、57 个服务组件（每个包配置 `.service.ts` 形成 `group: <pkgStem>` 模块分组）；
  - 具备真实复杂拓扑：中心共享 Hub 包 `pkg-hub-core`（入度 13）、环依赖 `pkg-service-order <-> pkg-service-inventory`、跨层调用（`analytics`、`audit`、`billing`）以及桥接模块 `pkg-bridge-connector`；
  - 实测完全展开时产生 86 处连线交叉；应用 N > 50 默认折叠策略后节点降至 14 个容器，交叉数降至 34 处（降幅 60.5%）。
- 真实本地 TypeScript 仓库实测（`/Users/bobcgn/AAA_Codings/Personal_Projects/skill-central`）：
  - 真实扫描 290 个源文件，检测出 23 个业务模块，提取 77 条代码 resolved 依赖边，0 语法不支持报告，0 截断，产生 152 处交叉，0 重叠，0 包含失败，100% ELK 求解器；
  - 执行种子为 42 的伪随机 AI 抽样核对（明确标注“由 AI 抽样核对, 非独立人工标注”）：
    - 精确率（Precision）：随机抽样 30 条检测到的依赖边，经核对 30/30 均对应源码中的跨模块调用，精确率达到 100.0%；
    - 召回率（Recall）：随机抽样 `src/` 下 30 处源码 `import` 语句，经核对 22 处正确映射到模块依赖或模块内调用，8 处未提取，召回率为 73.3%（22/30）；
    - 归因分析：8 处漏检均属于散落在单体仓库 `src/` 根目录的入口文件（`src/index.ts`、`src/mcp.ts`、`src/app-metadata.ts`），因 L4 目录聚类仅面向 `src/<subdir>` 二级目录，根级文件未归属于独立模块，属于单体工程下的已知能力边界；详细记录保存于 `logs/validation/p4-baseline/skill-central-sampling.json`。

- Complex Mesh Synthetic Fixture (`fixtures/synthetic-hub-repo`): Created a 14-package, 57-module synthetic benchmark featuring a central hub (`pkg-hub-core`), cyclic dependencies (`order <-> inventory`), cross-tier pipelines (`analytics`, `audit`), and bridge connectors (`pkg-bridge-connector`). Measured 86 crossings expanded vs. 34 crossings collapsed (60.5% reduction under N > 50 collapse).
- Real Repository Analysis & AI Sampling (`skill-central`): Analyzed 290 files, 23 modules, 77 connections, 152 crossings, 0 overlaps, 100% ELK layout. Conducted seeded (seed: 42) AI sampling check: Precision 30/30 (100.0%), Recall 22/30 (73.3%), with honest attribution that top-level root files (`src/*.ts`) are excluded by single-repo L4 directory clustering.

### 2. 为什么这么做 / Why
- 克服线性流水线的假象：此前 `synthetic-large-repo` 的 1 个交叉归因于其简单的流水线构造，不能用来证明复杂大图布局质量；必须建立逼真的中心包与环依赖复杂图，用实测数据证明折叠机制在降低认知过载方面的核心价值。
- 真实代码库的外部实证：必须引入未被本工程夹具专门微调过的真实外部代码库进行实测，诚实暴露出单体仓库根目录单文件的聚类边界。

- Overcoming Linear Artifacts: Acknowledging that `synthetic-large-repo`'s 1 crossing stemmed from parallel linear pipelines, the hub fixture genuinely stresses ELK with 86 crossings and proves the 60.5% crossing reduction of container collapse.
- External Empirical Grounding: Empirical testing on a real repository proves actual precision (100%) and exposes honest boundary limits (73.3% recall due to root-level file heuristics).

### 3. 验证结果 / Verification
- 已实现并验证：
  - `synthetic-hub-repo` 57 模块、14 包全部成功反演并完成 100% ELK 布局，86 交叉 -> 34 交叉；
  - `skill-central` 23 模块、77 边成功反演，耗时 125ms 分析、219ms 布局，100% ELK 求解器，0 重叠，0 包含失败；
  - AI 抽样核对记录保存于 `logs/validation/p4-baseline/skill-central-sampling.json`；
  - 人工评估方案就绪于 `docs/evaluation/p4-comprehension-eval.md`（状态：待执行）。
- 未实现：
  - 人工可理解性评测数据待真实人类架构师填写。
- 风险与回退方式：
  - 回退方式：`git revert <commit-hash>`。




