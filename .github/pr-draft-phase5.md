# PR Draft: Phase 5 — Ghost Architecture, Review, and Execution Handoff / 阶段 5 Ghost 架构、审核与执行交接 PR 草稿

分支 / Branch: `codex/phase-5-ghost-handoff`  
目标基线 / Target Baseline: `c060ffb` (main)  
当前状态 / Current Status: 进行中（已完成全仓 gitignore 完善、步骤 5.0 设计备忘录与步骤 5.1 Execution Handoff 产品化；等待用户确认决策 Q-5.1~Q-5.5 以开启后续步骤） / IN PROGRESS (Gitignore perfection, Step 5.0 design memo, and Step 5.1 Execution Handoff completed; awaiting user decision on Q-5.1~Q-5.5 for subsequent steps)  
退出结论 / Exit Conclusion: **未完成（阶段 5 进行中，Ghost 尚未实现） / IN PROGRESS (Ghost is NOT implemented in this round)**

---

## 待用户决策的问题清单 / Question List Pending User Decision

以下决策点直接引用自 [`docs/phase-5-design-memo.md`](../docs/phase-5-design-memo.md)，用于指导后续 Ghost 与 Review 接入开发：

| 编号 / # | 决策事项 / Topic | 备选方案 / Options | 推荐建议 / Recommendation |
| --- | --- | --- | --- |
| **Q-5.1** | **D-007 Ghost 呈现形态裁定** | **A.** 覆盖层 (Overlay)<br>**B.** 画布级局部扩展 (Local Extension via Web Adapter)<br>**C.** 独立侧边/弹窗对比视图 (Separate Comparison View) | **推荐选择 B**。<br>不修改 `architecture-layout` 公开 API 与 Worker 边界，由 Web Adapter 渲染局部 Ghost 节点，拒绝零成本移除，最符合局部修改局部稳定的精神。 |
| **Q-5.2** | **提案并发策略** | **A.** 单提案锁定（同一时间仅允许一个未决 Ghost 提案）<br>**B.** 多提案并行（允许多个 Ghost 提案以不同图层共存） | **推荐选择 A**。<br>单提案模式交互清晰，避免图层冲突和复杂的交叉依赖管理，适合 V1 MVP。 |
| **Q-5.3** | **部分采纳 (Cherry-picking) 语义** | **A.** V1 仅支持全量接受/全量拒绝（不支持单项挑选）<br>**B.** 扩展支持复选框挑拣子变更并生成派生 Proposal | **推荐选择 A**。<br>不引入复杂的部分合并逻辑；若需挑选，用户拒绝后通过 Inspector 显式操作即可。 |
| **Q-5.4** | **基线演变后的过期提案处置** | **A.** 自动标记“已过期 (Stale)”，禁用接受，要求重新评估<br>**B.** 尝试自动 Rebase 变基合并 | **推荐选择 A**。<br>保证架构事实源一致性，杜绝静默冲突。 |
| **Q-5.5** | **Brownfield Handoff 的证据提示** | **A.** 在 Handoff 预览头部显著呈现“含 inferred 证据”提示横幅<br>**B.** 隐藏该提示，仅在 Inspector 显示 | **推荐选择 A**。<br>忠实呈现反演架构的不确定性，避免外部 Agent 将推断事实误认为设计基线。 |

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

---

## 2. 为什么这么做 / Why

- **严格遵循阶段顺序与门禁隔离**：
  - 步骤 5.0 坚持“只读调研与文档设计，不写任何产品实现代码”，在 D-007 获得用户正式决策前绝不提前实现 Ghost；
  - 调研先行有助于识别出“增量布局直接接入 Ghost 会污染持久化 LayoutState 且迫使公开 API 变更”的关键技术风险，提前确立 Web Adapter 隔离方案。
- **遵守架构事实来源铁律**：
  - 坚持 `ArchitectureProject` 是唯一事实来源，Ghost 只是外部未采纳提案的临时视觉投影，绝不能进入 Architecture IR 或持久化 LayoutState；
  - 明确审批语义必须复用既有经过验证的 Review 门禁，避免引入越权的伪自动化或多用户假设。
- **单一事实来源与零伪造执行契约（Step 5.1）**：
  - Handoff 产物必须且只能源自已接受的正式架构，未决候选提案绝对不能被执行流水线采纳；
  - 杜绝生成空文档冒充成功；反演架构中必须显式标识 `inferred` 证据，保持架构师与 Coding Agent 之间完全对称的上下文。
- **纯渲染与宿主隔离**：
  - Adapter 仅负责将 Blueprint 映射为 Guide 文本，绝不引入 Agent 运行时、调度器、执行引擎或外部 shell 工具。

---

## 3. 验证结果 / Verification

- **Git 规则检查**：`git status` 确认工作区完全干净，中间生成物与构建产物全部被规则隔离；
- **设计备忘录校验**：`docs/phase-5-design-memo.md` 包含全部 7 项必需章节，中英双语齐备，逻辑自洽，无代码入侵；
- **步骤 5.1 自动化测试矩阵（全部通过）**：
  - Web 单元测试：`execution-handoff.test.ts` 7/7 通过；
  - Web 集成测试：`execution-handoff.integration.test.ts` 4/4 通过；
  - Web 端全量测试：16 个单元测试文件（89/89 通过），4 个集成测试文件（13/13 通过）；
  - Playwright E2E 浏览器测试（`apps/web/e2e/handoff.spec.ts`）：
    - 在 dev 模式与 preview 模式下，全部 3 个端到端测试均通过（覆盖 Greenfield 批准流程、三 Guide 切换、画布双向聚焦、剪贴板复制比对、文件导出校验、架构变更过期检测、未决候选隔离断言、Brownfield 反演架构 inferred 证据横幅展示）；
    - 完整 web E2E 套件（29 个测试）在 dev 和 production preview 下 100% 通过，保持 100% ELK 布局求解器守卫（零 fallback）；
  - 全仓构建与测试：15 个包与应用全部通过构建，30/30 测试套件通过；
  - 严格 CI 门禁：`CI=true TURBO_FORCE=true pnpm ci:verify` 全量通过；
  - 原始日志保存于 `logs/validation/p5-handoff/` 并建立索引 [README.md](../logs/validation/p5-handoff/README.md)。

---

## 提交记录与回退表 / Commits & Rollback Crosswalk

| 步骤 / Step | 提交哈希 / Commit | 提交信息 / Message | 回退命令 / Revert Command | 连带影响 / Cascade Impact |
| --- | --- | --- | --- | --- |
| 0 | `7400cd4` | `chore(git): perfect gitignore rules across workspace packages and apps` | `git revert 7400cd4` | 回退各目录 `.gitignore`，可能导致本地构建产生未跟踪文件 |
| 5.0 | `77e446a` | `docs(phase-5): add phase 5 design memo and initialize PR draft` | `git revert 77e446a` | 回退备忘录与 PR 草稿初始版 |
| 5.1 | *待提交* | `feat(handoff): implement execution handoff preview, copy, export, and provenance tracking` | `git revert <commit-5.1>` | 移除 Execution Handoff 产品化能力、Web 依赖及对应 E2E/单元测试，恢复合规基线连接 |

### 逆序回退分析 / Cascading Rollback Analysis

若需回退本阶段提交，请严格按照逆序操作：
1. **回退 5.1** (`git revert <commit-5.1>`)：将安全移除 Handoff 弹窗、对焦控制与导出的全部功能代码及测试，不会损坏底层已有的 Greenfield/Brownfield/Review 核心逻辑。
2. **回退 5.0** (`git revert 77e446a`)：若在 5.1 未回退时强行回退 5.0，会导致 PR 草稿和设计备忘录丢失，使得 5.1 的架构依据与决策索引失效。
3. **回退 0** (`git revert 7400cd4`)：若在后续步骤未回退时单独回退，会导致 `.svelte-kit/`、`.turbo/` 等产生未跟踪文件污染工作区，但不影响业务代码运行。

