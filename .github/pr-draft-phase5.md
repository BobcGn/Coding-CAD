# PR Draft: Phase 5 — Ghost Architecture, Review, and Execution Handoff / 阶段 5 Ghost 架构、审核与执行交接 PR 草稿

分支 / Branch: `codex/phase-5-ghost-handoff`  
目标基线 / Target Baseline: `c060ffb` (main)  
当前状态 / Current Status: 进行中（已完成步骤 5.0 设计备忘录与全仓 gitignore 规则完善；步骤 5.1 进行中） / IN PROGRESS (Step 5.0 design memo and repo-wide gitignore completed; Step 5.1 in progress)  
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

---

## 2. 为什么这么做 / Why

- **严格遵循阶段顺序与门禁隔离**：
  - 步骤 5.0 坚持“只读调研与文档设计，不写任何产品实现代码”，在 D-007 获得用户正式决策前绝不提前实现 Ghost；
  - 调研先行有助于识别出“增量布局直接接入 Ghost 会污染持久化 LayoutState 且迫使公开 API 变更”的关键技术风险，提前确立 Web Adapter 隔离方案。
- **遵守架构事实来源铁律**：
  - 坚持 `ArchitectureProject` 是唯一事实来源，Ghost 只是外部未采纳提案的临时视觉投影，绝不能进入 Architecture IR 或持久化 LayoutState；
  - 明确审批语义必须复用既有经过验证的 Review 门禁，避免引入越权的伪自动化或多用户假设。

---

## 3. 验证结果 / Verification

- **Git 规则检查**：`git status` 确认工作区完全干净，中间生成物与构建产物全部被规则隔离；
- **设计备忘录校验**：`docs/phase-5-design-memo.md` 包含全部 7 项必需章节，中英双语齐备，逻辑自洽，无代码入侵。

---

## 提交记录与回退表 / Commits & Rollback Crosswalk

| 步骤 / Step | 提交哈希 / Commit | 提交信息 / Message | 回退命令 / Revert Command | 连带影响 / Cascade Impact |
| --- | --- | --- | --- | --- |
| 0 | `7400cd4` | `chore(git): perfect gitignore rules across workspace packages and apps` | `git revert 7400cd4` | 回退各目录 `.gitignore`，可能导致本地构建产生未跟踪文件 |
| 5.0 | *待提交* | `docs(phase-5): add phase 5 design memo and initialize PR draft` | `git revert <hash>` | 回退备忘录与 PR 草稿初始版 |

*(后续步骤提交将在完成后增量同步更新)*
