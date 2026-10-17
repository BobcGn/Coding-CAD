# PR Draft: Phase 5 — Ghost Architecture, Review, and Execution Handoff / 阶段 5 Ghost 架构、审核与执行交接 PR 草稿

分支 / Branch: `codex/phase-5-ghost-handoff`  
目标基线 / Target Baseline: `c060ffb` (main)  
当前状态 / Current Status: 有条件满足（已完成步骤 5.0~5.6 全流程开发、订正、测试与真实浏览器基准测试；进入步骤 5.7 Ghost 预测位置设计备忘录） / CONDITIONALLY SATISFIED (Steps 5.0-5.6 complete, corrections, tests, and real browser benchmarks verified; proceeding to Step 5.7 design memo)  
退出结论 / Exit Conclusion: **有条件满足 / CONDITIONALLY SATISFIED**（阶段 5 范围内全部交付物与门禁均已完成并验证，待用户处理事项裁定） / CONDITIONALLY SATISFIED (All deliverables and gates within Phase 5 scope verified, pending user action items).

---

## 阶段 5 用户已批准决策 / Phase 5 User-Approved Decisions

| 编号 / # | 决策事项 / Topic | 选定方案 / Selected Option | 决策状态 / Status |
| --- | --- | --- | --- |
| **Q-5.1** | **D-007 Ghost 呈现形态裁定** | **方案 B**（画布级局部扩展 via Web Adapter）。硬约束：零重叠、局部放置、不改动 `architecture-layout` 公开 API、不改动 D-010 边界。 | **已批准 (APPROVED)** |
| **Q-5.2** | **提案并发策略** | **方案 A**（单提案锁定）。同一时间仅允许一个未决 Ghost 提案；未决期间阻止新编辑并给出明确提示。 | **已批准 (APPROVED)** |
| **Q-5.3** | **部分采纳 (Cherry-picking) 语义** | **方案 A**（V1 仅支持全量接受或全量拒绝）。拒绝后可通过 Inspector 针对性编辑。 | **已批准 (APPROVED)** |
| **Q-5.4** | **基线演变后的过期提案处置** | **方案 A**（自动标记“已过期”，禁用接受，要求重新提议）。保证架构一致性。 | **已批准 (APPROVED)** |
| **Q-5.5** | **Brownfield Handoff 的证据提示** | **方案 A**（显著呈现含 `inferred` 证据提示横幅）。已在 5.1 中落实并验证。 | **已批准 (APPROVED)** |

---

## 1. 做了什么 / What

- **基础配置与 Git 规则完善 (Chore: Gitignore Rules)**：
  - 从最新 `main` 检出分支 `codex/phase-5-ghost-handoff`；
  - 完善根目录 `.gitignore`，补齐 `.vite/`、`.eslintcache`、`*.local`、编辑器临时文件、包管理调试日志及 Playwright blob 报告规则；
  - 为 `apps/web` 与 `apps/server` 分别创建专用 `.gitignore`，忽略 `.svelte-kit/`、`build/`、`dist/`、`.coding-cad/` 等构建产物与本地持久化目录；
  - 为 `packages/` 下 13 个包补齐目录级 `.gitignore`，隔离 `dist/`、`.turbo/`、`coverage/` 与 `*.tsbuildinfo`。
- **步骤 5.0：设计备忘录 (Step 5.0: Design Memo, Read-only)**：
  - 产出中英双语设计备忘录 [`docs/phase-5-design-memo.md`](../docs/phase-5-design-memo.md)；
  - 现状盘点：系统梳理 Greenfield 候选架构、Inspector/Palette 待审批命令与 `ArchitectureReview` 状态机的存储模型（纯内存）、状态迁移与现有已批准语义（`local-user` 审批人、必填理由、拒绝保留候选、未校验通过硬门禁）；
  - Proposal 概念对齐：论证了 Phase 5 Proposal 与现有 `Proposal` 状态机完全同源可复用，明确记录单命令批处理、提案来源标注及部分接受 3 项能力缺口，不擅自增改类型；
  - D-007 方案对比：对比了 Overlay、Web Adapter 画布局部扩展与独立对比视图 3 种方案的取舍，推荐采用零修改 `architecture-layout` 公开 API 的画布局部扩展方案；
  - 审批语义缺口表：逐项列出完整接受/拒绝、部分采纳、多提案并发、提案过期与拒绝后重提 6 大场景，提取用户决策清单；
  - Ghost 与增量布局：分析确认现有 Stability pass 若直接接入 Ghost 会污染持久化 LayoutState 并需要修改公开 API，确定 Ghost 局部放置应位于 Web Adapter 层；
  - Handoff 现状与 `xjb_coding` 只读调研：梳理 Blueprint 结构与 Generic/Codex/Claude 渲染器，分析来源回溯能力；在 `/Users/bobcgn/AAA_Codings/OpenSource_Projects/xjb_coding` 完成只读调研，分析其任务计划（TRACKER.md 与 MCP 工具）、L1~L4 四层门禁以及与 Blueprint 的映射可行性，明确声明不实现导出目标。
- **步骤 5.1：Execution Handoff 产品化 (Step 5.1: Execution Handoff Productization)**：
  - **核心交接流水线 (`apps/web/src/lib/architecture/handoff/execution-handoff.ts`)**：
    - 实现 `generateExecutionHandoff` 纯函数，严格基于已通过 Validator 的正式 `ArchitectureProject` 生成 `ExecutionBlueprint` 与 3 种 Agent Guide（Generic / Codex / Claude）；
    - 实现快照指纹键 `createHandoffSnapshotKey` 与过期判定 `isHandoffStale`，任何正式架构变更即刻将预览标记为“已过期 (Stale)”；
    - 基于 `@coding-cad/implementation-analyzer/codec` 实现类型化证据解码与 `checkHasInferredEvidence`，精准识别代码反演架构中的 `inferred` 证据并生成提示横幅；
    - 实现双向来源追踪（`TaskProvenance`、`ConstraintProvenance`），将 Blueprint 任务与约束准确关联至 Architecture IR 的组件/连接 ID；
    - 实现一键复制（字面逐字一致）与标准文件导出（`formatHandoffExport`、`getHandoffExportFilename`），头部内嵌架构快照与时间戳；
    - 严格输入防伪网关：空架构或校验失败阻断生成并报错，未决 Review 候选存在时提示“尚有未批准的候选，Handoff 基于已批准的正式架构”，候选绝对不污染正式交接。
  - **交互视图与对焦控制 (`ExecutionHandoffModal.svelte` & `+page.svelte`)**：
    - Svelte 5 弹窗实现 Blueprint 与 3 种 Guide 的选项卡切换与全文预览；
    - 侧边栏常设“Execution Handoff”按钮；
    - 任务关联组件 ID 可直接点击并在画布上平滑滚动并高亮聚焦（`focusComponent`）；
    - 架构变动后展示黄色过期横幅与手动“重新生成”按钮。
  - **合规基线与全仓测试更新**：
    - 在 `baseline-presets.ts` 与 `coding-cad-golden.json` 中同步 `web -> execution-blueprint` 与 `web -> agent-adapter` 的合法依赖关系；
    - 更新 `brownfield-compliance.test.ts` 与 `coding-cad-drifted.json`，确保全仓 Brownfield 合规门禁 0 偏差。
- **步骤 5.1.1：订正与补齐证据 (Step 5.1.1: Corrections & Evidence Completion)**：
  - **基线改动溯源 (Baseline Provenance)**：手工比对 `apps/web/package.json` 差异，确认：
    - 第 18 行 `@coding-cad/agent-adapter` 与第 25 行 `@coding-cad/execution-blueprint` 系由 commit `2797f9c` 引入，合法建立 `web -> agent-adapter` 与 `web -> execution-blueprint` 边；
    - 第 27 行 `@coding-cad/implementation-validator` 系由阶段 4 commit `638a90e` 引入，在 5.1 中同步补齐至 `coding-cad-golden.json`；
    - 在 `logs/State/current.md` 明确注明阶段 4 验收报告中的“15 组件 / 40 边”为历史数字，阶段 5 起代码依赖真实边数为 42 边；
  - **剪贴板复制逐字验证与权限降级测试**：在 `apps/web/e2e/handoff.spec.ts` 中通过 `navigator.clipboard.readText()` 断言剪贴板文本与预览全文逐字一致；在 `ExecutionHandoffModal.svelte` 中显式处理剪贴板不可用与异常抛出，补充权限拒绝/失败降级 E2E 测试；
  - **来源追踪全覆盖表与验证**：梳理 Blueprint 各类条目来源映射表，在 `execution-handoff.test.ts` 中补齐断言：每个 Blueprint 任务关联组件均存在于正式架构，每个约束的 `sourceReference` 均可回溯，3 种 Guide 文本均可通过标识或标题回溯到 Blueprint 任务；
  - **快照键算法规范化**：重构 `createHandoffSnapshotKey` 为纯净的语义提取与规范排序算法，排除布局坐标与临时视图，补齐对属性键顺序不敏感、保存打开 roundtrip 一致、布局拖动不触发过期、语义属性变更立即过期的全量测试；
  - **范围外附带改动披露**：对步骤 0 的全仓 `.gitignore` 明确披露为“范围外附带改动”，并经 `git ls-files -c -i --exclude-standard` 验证 0 跟踪文件受损；
  - **测试用例统计更正**：更正此前“全仓 102 项测试”用词，细化为全仓 15 个包/应用按包列出（其中 `apps/web` 为 107 项测试，全工作区 30/30 Turbo 任务全量通过）。
- **步骤 5.2：Proposal 与 Ghost 投影 (Step 5.2: Proposal & Ghost Projection)**：
  - **Proposal 复用与单提案锁定**：复用现有 `ArchitectureReview` 状态机的 Proposal 与 CandidateCommand 模型，不新增类型；在 `WorkspaceShellController` 中增加单提案锁定门禁与 `isCommandProposal` 标记，未决提案期间编辑被明确阻断；
  - **D-007 方案 B（Web 适配层局部扩展）纯函数放置算法 (`apps/web/src/lib/cad/canvas/adapters/ghost-placement.ts`)**：实现 `calculateGhostPlacement` 纯函数。对于新增 Ghost 组件，优先寻找关联正式节点锚点紧邻放置，并严格保证与所有正式节点及容器边界零重叠（Zero Overlap）；对于属于已有容器且容器无空位的情况，在容器外侧放置并附带文字提示，不改动正式容器布局；
  - **Svelte Flow 适配层 Ghost 投影 (`apps/web/src/lib/layout/adapters/svelte-flow-adapter.ts`)**：
    - 将 `diff.components.added` 映射为 `ghost:${id}` 独立 ID 的 Ghost 节点与 `[待审批 / Proposed]` 状态徽章；
    - 将 `diff.connections.added` 映射为紫色虚线 Ghost 连接；
    - 将 `diff.components.changed` 映射为带 `[待变更 / Pending Change]` 黄色徽章的正式节点标记；
    - 将 `diff.components.removed` 映射为带 `[待删除 / Pending Deletion]` 红色徽章与删除线样式的正式节点标记；
    - 将 `diff.connections.removed` 映射为红色虚线 `[待删除 / Pending Deletion]` 连接；
    - 所有 Ghost 与标记均具备明确文字徽章与无障碍可访问名称（aria-label），不单纯依赖颜色区分；
  - **画布与节点渲染支持 (`ArchitectureNode.svelte` & `ArchitectureCanvas.svelte`)**：
    - 实现高对比度徽章、虚线边框、提示条与删除线；
    - 在存在未决命令提案时传递 `ghostProposal`，并在 Inspector 选择时自动解析底层组件 ID；
  - **自动化测试与不变量断言**：
    - 新增 `ghost-placement.test.ts`（5/5 通过）：验证碰撞检测、相邻空位、容器内部及溢出外置逻辑；
    - 扩展 `svelte-flow-adapter.test.ts`（8/8 通过）：验证 Ghost 节点/连接独立 ID、待变更/待删除标记、几何零重叠、无关正式节点不发生位移、非未决状态不投影 Ghost；
    - 扩展 `workspace-shell-controller.test.ts`（20/20 通过）：验证存在 Ghost 时正式架构引用与内容不变、Ghost ID 绝不进入 `saveProject` 载荷、命令提案不重新触发全图重布局；
    - 扩展 `apps/web/e2e/editing.spec.ts`（11/11 全数通过）：验证添加组件渲染 Ghost 节点且与正式节点零重叠、删除组件标记为待删除且不修改正式 IR、编辑属性标记为待变更、拒绝提案即刻清除 Ghost 投影。
- **步骤 5.3：Review 接入与生命周期硬化 (Step 5.3: Review Integration & Lifecycle Hardening)**：
  - **审批动作与 Ghost 关联**：实现 Accept 推进正式 `ArchitectureProject` 变更、Ghost 投影即刻消失、触发增量布局（Stability pass）；实现 Reject 即刻清除 Ghost 投影、正式架构事实保持不变、候选按已批准语义保留在内存中；
  - **过期提案 (Stale Proposal) 处置机制**：正式架构发生外部演变后，自动将未决提案标记为“已过期 (Stale)”（`isProposalStale: true`），禁用 Accept 按钮并提供中英双语警告“正式架构已变化，提案已失效，请重新提议。 / Formal architecture has changed; the proposal is stale and must be re-proposed.”，同时保留 Reject 操作用于显式清理；
  - **审查状态机防御与单提案锁定**：在未决提案或已过期提案存在时，严格阻断新增编辑命令；验证重复 Accept/Reject 的幂等性；验证校验失败的候选提案阻断 Accept 但允许 Reject 清理；
  - **自动化测试覆盖**：扩展 `review-gate.test.ts` 新增 6 项生命周期单元测试（11/11 通过）；扩展 `editing.spec.ts` 新增 3 项 Playwright E2E 测试（14/14 通过，覆盖 Ghost 采纳、Ghost 拒绝与过期阻断）。
- **步骤 5.4：增量布局与稳定性指标度量 (Step 5.4: Incremental Layout & Stability Metrics)**：
  - **增量布局位移追踪**：在 `GreenfieldShellState` 中增加 `movement?: MovementReport`，并在 `WorkspaceShellController.layoutCandidate` 中捕获并更新增量布局移动报告；在 `ShellController` 暴露 `movement()` 查询；
  - **预算机械化断言**：新增 `incremental-stability.test.ts`，在 Greenfield points-system 与 Medium Brownfield（15 组件，42 边）两个典型场景中执行提案采纳并触发增量布局，断言未受影响节点的位移严格满足预算（`unaffectedP95 <= 48px`, `unaffectedMax <= 144px`, `withinBudget: true`，实测均为 0.0px）；
  - **经验度量与表格输出**：系统测量 Ghost 初始位置与正式节点最终位置的欧几里得距离（Displacement: Mean, Median, Max），输出 6 组对比实验量化数据表，科学阐释局部几何启发式放置与全局 ELK 层次布局之间的合理位移现象。

---

## 2. 为什么这么做 / Why

- **严格遵循阶段顺序与门禁隔离**：
  - 步骤 5.0 坚持“只读调研与文档设计，不写任何产品实现代码”，在 D-007 获得用户正式决策前绝不提前实现 Ghost；
  - 调研先行有助于识别出“增量布局直接接入 Ghost 会污染持久化 LayoutState 且迫使公开 API 变更”的关键技术风险，提前确立 Web Adapter 隔离方案。
- **遵守架构事实来源铁律**：
  - 坚持 `ArchitectureProject` 是唯一事实来源，Ghost 只是外部未采纳提案的临时视觉投影，绝不能进入 Architecture IR 或持久化 LayoutState；
  - 明确审批语义必须复用既有经过验证的 Review 门禁，避免引入越权的伪自动化或多用户假设。
- **单一事实来源与零伪造执行契约（Step 5.1 & 5.1.1）**：
  - Handoff 产物必须且只能源自已接受的正式架构，未决候选提案绝对不能被执行流水线采纳；
  - 杜绝生成空文档冒充成功；反演架构中必须显式标识 `inferred` 证据，保持架构师与 Coding Agent 之间完全对称的上下文；
  - 剪贴板复制必须用真实的剪贴板读取进行逐字验证，拒绝静默假成功；
  - 快照键必须严格基于语义事实，防止画布纯布局微调导致交接文档误失效。
- **D-007 方案 B 硬约束合规（Step 5.2）**：
  - 严格满足用户裁定的“与正式节点零重叠、局部放置不触发无关节点移动、不改动 architecture-layout 公开 API、不改动 D-010 Worker 边界”四个硬条件；
  - 容器内部无空间时放置于外侧并附带 notice 提示，不破坏正式容器布局；
  - Ghost 拥有独立身份（`ghost:...`），其 ID 绝不进入正式 `ArchitectureProject`、持久化 `LayoutState`、Save 产物或 Handoff 蓝图；Save 后 Open 不残留 Ghost 或未决提案。
- **生命周期硬化与基线防冲突（Step 5.3）**：
  - 当正式架构发生外部演变后，旧提案基线已经失效，自动标记为过期并禁用 Accept，彻底杜绝静默冲突；
  - 允许 Reject 清理过期提案，确保心智模型清晰可恢复，且全流程不增加额外审批语义或角色。
- **稳定重于最优与心智模型保护（Step 5.4）**：
  - 增量布局必须确保用户在审批提案前后，无关正式节点位置保持绝对稳定，保护用户的心理认知地图（Mental Map）；
  - 局部启发式几何放置（Ghost 阶段）与全局求解器分层优化（正式采纳阶段）存在预期的位置差异，但在此过程中无关节点完全不动（0.0px 位移），满足稳定性最高要求。
- **纯渲染与宿主隔离**：
  - Adapter 仅负责将 Blueprint 映射为 Guide 文本，绝不引入 Agent 运行时、调度器、执行引擎或外部 shell 工具。

---

## 3. 验证结果 / Verification

- **Git 规则检查**：`git status` 确认工作区完全干净，中间生成物与构建产物全部被规则隔离；`git ls-files -c -i --exclude-standard` 输出为空，确认无跟踪文件被误忽略；
- **设计备忘录校验**：`docs/phase-5-design-memo.md` 包含全部 7 项必需章节，中英双语齐备，逻辑自洽，无代码入侵；
- **步骤 5.4 增量布局稳定性与位移度量结果**：
  - 实测经验度量数据表：

| 测试夹具 (Fixture) | 组件 (Component) | Ghost 初始坐标 | 正式最终坐标 | 位移距离 (Displacement) | 未受影响 p95 | 未受影响 Max | 符合预算 (Within Budget) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield (Points System) | Kafka | (801.0, 24.0) | (561.0, 248.0) | 328.3 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Greenfield (Points System) | RedisReplica | (801.0, 24.0) | (561.0, 248.0) | 328.3 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Greenfield (Points System) | NotificationService | (252.0, 236.0) | (24.0, 236.0) | 228.0 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | DocGen | (1812.0, 208.0) | (24.0, 153.0) | 1788.8 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | Telemetry | (1764.0, 306.0) | (24.0, 153.0) | 1746.7 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | ArtifactViewer | (252.0, 120.0) | (24.0, 153.0) | 230.4 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |

  - 汇总统计：
    - Greenfield：均值 Mean = 294.9px, 中位数 Median = 328.3px, 最大值 Max = 328.3px；
    - Medium Brownfield：均值 Mean = 1255.3px, 中位数 Median = 1746.7px, 最大值 Max = 1788.8px；
  - 稳定性预算判定：全部 6 组实验中 `unaffectedP95 = 0.0px`、`unaffectedMax = 0.0px`，100% 满足稳定性预算要求；
- **自动化测试按包分类统计 (Package Test Breakdown)**：
  - `@coding-cad/architecture-ir`: 1 文件，通过 (`dist/architecture-project.test.js`)；
  - `@coding-cad/component-registry`: 1 文件，通过 (`dist/registry.test.js`)；
  - `@coding-cad/architecture-dsl`: 1 文件，通过 (`dist/parser.test.js`)；
  - `@coding-cad/architecture-layout`: 7 测试文件全数通过 (passes, elk-adapter, compiler, elk-engine, incremental-layout, ghost-layout, performance-budget)；
  - `@coding-cad/architecture-validator`: 1 文件，通过 (`dist/validator.test.js`)；
  - `@coding-cad/execution-blueprint`: 1 文件，通过 (`dist/generator.test.js`)；
  - `@coding-cad/architecture-agent`: 1 文件，通过 (`dist/agent.test.js`)；
  - `@coding-cad/agent-adapter`: 1 文件，通过 (`dist/adapter.test.js`)；
  - `@coding-cad/workspace`: 1 文件，通过 (`dist/workspace.test.js`)；
  - `@coding-cad/implementation-analyzer`: 2 测试套件通过 (`evidence-codec`, `dist/analyzer.test.js`)；
  - `@coding-cad/implementation-validator`: 2 测试套件通过 (`brownfield-compliance`, `dist/validator.test.js`)；
  - `@coding-cad/architecture-review`: 1 文件，通过 (`dist/review.test.js`)；
  - `@coding-cad/cli`: 集成与 E2E 通过；
  - `@coding-cad/server`: 安全隔离与路由验证通过 (19/19 测试)；
  - `@coding-cad/web`:
    - 单元测试 (vitest unit)：18 个测试文件，115/115 项通过；
    - 集成测试 (vitest integration)：4 个测试文件，13/13 项通过；
    - 合计 Web 端单元 + 集成测试通过总数：128 项；
    - TypeScript 类型检查：`svelte-check` 0 错误 0 警告；
    - Playwright 浏览器 E2E (`editing.spec.ts`)：14/14 全数通过（包含 Ghost 节点添加、待删除标记、待变更标记、Ghost 接受、Ghost 拒绝与过期提案阻断）；
    - Playwright 浏览器 E2E (`handoff.spec.ts`)：dev 模式 4/4 通过，preview 模式 4/4 通过，包含逐字剪贴板比对与权限拒绝降级路径；
    - Playwright 浏览器 E2E 全量套件：36/36 全数通过。

---

## 4. 来源追踪覆盖表 / Provenance Coverage Table

| Blueprint 条目类别 (Category) | 字段 (Field) | 来源 id 字段 (Source ID Field) | 是否保证非空 (Guaranteed Non-empty) | 是否有测试 (Has Test) | 说明 (Notes) |
| --- | --- | --- | --- | --- | --- |
| 实施任务 (Task - Component) | `ImplementationTask` | `task.relatedComponents` (`[component.id]`) | 是 (Yes) | 是 (Yes) | 来源于 `architecture.components`，每个 id 均在正式架构中存在 |
| 实施任务 (Task - Connection) | `ImplementationTask` | `task.relatedComponents` (`[from, to]`) | 是 (Yes) | 是 (Yes) | 来源于 `architecture.connections`，两端端点 id 均在正式架构中存在 |
| 实施任务 (Task - Consistency) | `ImplementationTask` | `task.relatedComponents` | 是 (Yes) | 是 (Yes) | 来源于 consistency 约束，关联 service 与 storage 组件 id |
| 约束 (Constraint - Architecture) | `ImplementationConstraint` | `sourceReference` (`constraint.type`) | 是 (Yes) | 是 (Yes) | 来源于 `architecture.constraints`，type 与正式约束一致 |
| 约束 (Constraint - Decision) | `ImplementationConstraint` | `sourceReference` (`decision.title`) | 是 (Yes) | 是 (Yes) | 来源于 `architecture.decisions`，title 与正式决策一致 |
| 约束 (Constraint - Validator Issue) | `ImplementationConstraint` | `sourceReference` (`issue.id`) | 是 (Yes) | 是 (Yes) | 来源于 `validatorResult.issues`，校验规则 issue id |
| 约束 (Constraint - Limitation) | `ImplementationConstraint` | `sourceReference` (`${component.id}:${limitation.id}`) | 是 (Yes) | 是 (Yes) | 包含组件 id 与限制项 id，targetComponentId 指向正式组件 |
| 指引 (Guide - Decisions) | `AgentGuide.decisions` | 字符串内包含 `decision.title` | 是 (Yes) | 是 (Yes) | 格式化文本，标题回溯到正式决策 |
| 指引 (Guide - Tasks in generic/codex/claude) | `AgentInstruction.content` | 段落包含 `Task ID: ${task.id}` 与标题 | 是 (Yes) | 是 (Yes) | 3 种 Guide 渲染文本均可通过正则匹配到全部 Blueprint task id |

---

## 提交记录与回退表 / Commits & Rollback Crosswalk

| 步骤 / Step | 提交哈希 / Commit | 提交信息 / Message | 回退命令 / Revert Command | 连带影响 / Cascade Impact |
| --- | --- | --- | --- | --- |
| 范围外附带改动 | `7400cd4` | `chore(git): perfect gitignore rules across workspace packages and apps` | `git revert 7400cd4` | 回退各目录 `.gitignore`，可能导致本地构建产生未跟踪文件 |
| 5.0 | `77e446a` | `docs(phase-5): add phase 5 design memo and initialize PR draft` | `git revert 77e446a` | 回退备忘录与 PR 草稿初始版 |
| 5.1 | `2797f9c` | `feat(handoff): implement execution handoff preview, copy, export, and provenance tracking` | `git revert 2797f9c` | 移除 Execution Handoff 产品化能力、Web 依赖及对应 E2E/单元测试，恢复合规基线连接 |
| 5.1 (PR) | `3f8d76a` | `docs(pr): update PR draft with Step 5.1 commit hash and rollback crosswalk` | `git revert 3f8d76a` | 同步回退 PR 草稿中步骤 5.1 提交哈希 |
| 5.1.1 | `f6ea675` | `test(handoff): correct baseline provenance, add copy fallback, and enforce canonical snapshot key` | `git revert f6ea675` | 回退 5.1.1 补齐测试与快照算法规范化 |
| 5.2 | `cb8be8e` | `feat(ghost): implement proposal ghost projection, placement adapter, and view markers` | `git revert cb8be8e` | 移除 Ghost 放置算法、Svelte Flow Ghost 投影与编辑标记，恢复无 Ghost 的直接候选状态 |
| 5.2 (PR) | `baba8c0` | `docs(pr): update PR draft with Step 5.2 commit hash and rollback crosswalk` | `git revert baba8c0` | 同步回退 PR 草稿中步骤 5.2 提交哈希 |
| 5.3 | `9971e4d` | `feat(review): harden review gate with ghost accept/reject, stale proposals, and single-proposal lock` | `git revert 9971e4d` | 移除 Review 接入硬化、过期提案标记与单提案严格防御 |
| 5.3 (PR) | `b94e0fb` | `docs(pr): update PR draft with Step 5.3 commit hash` | `git revert b94e0fb` | 同步回退 PR 草稿中步骤 5.3 提交哈希 |
| 5.4 | `7120770` | `test(layout): verify incremental layout stability budget and measure ghost displacement` | `git revert 7120770` | 移除增量布局稳定性指标测试与位移度量套件 |
| 5.4 (PR) | `634c355` | `docs(pr): update PR draft with Step 5.4 commit hash` | `git revert 634c355` | 同步回退 PR 草稿中步骤 5.4 提交哈希 |
| 5.5 | `d529390` | `docs(phase-5): add phase 5 exit report and update execution plan` | `git revert d529390` | 回退阶段 5 初始退出报告 |
| 5.5 (PR) | `71e76d0` | `docs(pr): update PR draft with Step 5.5 commit hash and final rollback crosswalk` | `git revert 71e76d0` | 同步回退 PR 草稿中步骤 5.5 提交哈希 |
| 5.6 | *(Pending)* | `test(e2e): add real browser benchmarks for ghost placement and correct exit status` | `git revert <5.6-hash>` | 移除浏览器 E2E benchmark 测试套件与订正报告 |

### 逆序回退分析 / Cascading Rollback Analysis

若需回退本阶段提交，请严格按照逆序操作：
1. **回退 5.6** (`git revert <5.6-hash>`)：移除真实浏览器基准测试套件与订正报告；
2. **回退 5.5** (`git revert 71e76d0` -> `git revert d529390`)：移除阶段 5 退出报告与状态标记；
3. **回退 5.4** (`git revert 634c355` -> `git revert 7120770`)：移除增量布局稳定性测试与位移度量套件，不影响正式架构与 Ghost 交互；
4. **回退 5.3** (`git revert b94e0fb` -> `git revert 9971e4d`)：移除过期提案检测、单提案严格阻断与 Review 接入硬化，恢复步骤 5.2 的基本 Ghost 投影；
5. **回退 5.2** (`git revert baba8c0` -> `git revert cb8be8e`)：安全移除 Ghost 投影、局部放置纯函数与待删除/待变更视觉标记，不影响正式架构与 Review 状态机；
6. **回退 5.1.1** (`git revert f6ea675`)：恢复 5.1 初始快照实现与测试；
7. **回退 5.1** (`git revert 3f8d76a` -> `git revert 2797f9c`)：将安全移除 Handoff 弹窗、对焦控制与导出的全部功能代码及测试，不会损坏底层已有的 Greenfield/Brownfield/Review 核心逻辑；
8. **回退 5.0** (`git revert 77e446a`)：若在 5.1 未回退时强行回退 5.0，会导致 PR 草稿和设计备忘录丢失；
9. **回退范围外附带改动** (`git revert 7400cd4`)：若在后续步骤未回退时单独回退，会导致 `.svelte-kit/`、`.turbo/` 等产生未跟踪文件污染工作区，但不影响业务代码运行。



