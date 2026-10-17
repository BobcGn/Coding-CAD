# Phase 5 Exit Report / 阶段 5 退出报告

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
基线提交 / Target Baseline: `7400cd4` (origin/main)  
退出结论 / Exit Conclusion: **满足退出条件 / SATISFIED**  
*(阶段 5 范围内全部交付物、不变量、测试套件与安全门禁均已完成并验证，无新增 package，无 Agent 运行时，无 D-010 边界越界 / All deliverables, invariants, test suites, and security gates within Phase 5 scope are implemented and verified; no new packages, no Agent runtimes, no D-010 boundary leaks).*

---

## 阶段 5 验收标准对照 / Acceptance Criteria Crosswalk

| 验收标准 (Acceptance Criterion) | 实施状态 (Status) | 验证证据 (Verification Evidence) | 说明 (Notes) |
| --- | --- | --- | --- |
| 1. Ghost 展示/拒绝不修改已接受 IR 或正式 LayoutState | **已实现并验证 (Verified)** | `svelte-flow-adapter.test.ts`, `review-gate.test.ts`, `editing.spec.ts` | Ghost 节点独立 ID (`ghost:...`)，Save/Open 与持久化状态均不含 Ghost，拒绝即刻消除 Ghost 且保持正式架构引用与内容不变 |
| 2. Accept 必须通过 Review，并在 accepted IR 更新后触发增量布局 | **已实现并验证 (Verified)** | `review-gate.test.ts`, `incremental-stability.test.ts`, `editing.spec.ts` | 沿用现有 Review 门禁（`local-user`、理由必填），Accept 推进正式架构变更并触发增量布局，无关节点位移严格为 0.0px |
| 3. Blueprint 与 Guide 来源可追溯，UI 不修改 Blueprint | **已实现并验证 (Verified)** | `execution-handoff.test.ts`, `execution-handoff.integration.test.ts`, `handoff.spec.ts` | 来源追踪覆盖表完整覆盖组件、连接、约束、决策与任务；Guide 段落通过正则可 100% 回溯至 Blueprint 项；点击来源元素画布平滑聚焦 |
| 4. Generic、Codex、Claude 3 种 Guide 可预览、复制与导出 | **已实现并验证 (Verified)** | `execution-handoff.test.ts`, `handoff.spec.ts` | 逐字剪贴板比对通过；无剪贴板权限时平稳降级提示；导出复用已有 Blob 下载机制；正式架构变化后自动标记已过期 |
| 5. 单提案锁定与过期提案防御 | **已实现并验证 (Verified)** | `workspace-shell-controller.test.ts`, `review-gate.test.ts`, `editing.spec.ts` | 同一时间仅允许一个未决提案；正式架构外部演变后提案自动标为 Stale，禁用 Accept，保留 Reject 清理 |
| 6. D-007 方案 B 零碰撞与局部放置硬约束 | **已实现并验证 (Verified)** | `ghost-placement.test.ts`, `svelte-flow-adapter.test.ts`, `incremental-stability.test.ts` | 纯函数局部放置，与所有正式节点及容器边界几何零重叠，容器满时置于外侧并带文字 notice，不改动 architecture-layout 公开 API |
| 7. 增量布局稳定性预算与位移经验度量 | **已实现并验证 (Verified)** | `incremental-stability.test.ts` | Greenfield 与 Medium Brownfield 接受增量布局中未受影响节点位移均为 0.0px (≤ 48px / ≤ 144px 预算)；实测 Ghost 到正式节点位移并阐释机理 |
| 8. 绝无 Agent 运行时与 Terminal 能力 | **已实现并验证 (Verified)** | `pnpm lint`, 代码审计, CI 门禁 | `agent-adapter` 保持纯文本渲染器定位，`apps/web` 不引入执行流水线、调度器或 shell 桥接 |

---

## 1. 做了什么 / What

在 `codex/phase-5-ghost-handoff` 分支上按计划完成了阶段 5 的全部步骤（步骤 0、5.0、5.1、5.1.1、5.2、5.3、5.4、5.5）：

### 步骤 0：全仓 Git 忽略规则完善 (Chore: Gitignore Rules)
- 提交哈希：`7400cd4`
- 完善工作区各目录 `.gitignore`，隔离构建产物与临时状态；
- `git ls-files -c -i --exclude-standard` 验证 0 跟踪文件受损，作为范围外附带改动合规披露。

### 步骤 5.0：设计备忘录 (Step 5.0: Design Memo)
- 提交哈希：`77e446a`
- 产出中英双语设计备忘录 [`docs/phase-5-design-memo.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/phase-5-design-memo.md)；
- 梳理现有 Review 状态机、Proposal 概念复用、D-007 方案对比（方案 A/B/C 取舍）、审批缺口表、增量布局影响分析与 Handoff 现状；
- 列出 Q-5.1 ~ Q-5.5 决策清单供用户裁定。

### 步骤 5.1 & 5.1.1：Execution Handoff 产品化与订正补证据 (Step 5.1 & 5.1.1: Execution Handoff & Corrections)
- 提交哈希：`2797f9c`, `3f8d76a`, `f6ea675`
- **执行交接模态框 (`ExecutionHandoffModal.svelte`)**：
  - 仅对已通过 Validator 的正式架构生成，未决候选存在时展示“尚有未批准候选，Handoff 基于正式架构”提示；
  - 架构无效或空时阻断生成；
  - 提供 Blueprint 结构化树状预览、来源元素名称/ID 展示与点击画布聚焦跳转；
  - 提供 Generic / Codex / Claude 三类 Guide 切换渲染与段落溯源；
  - 提供版本快照键绑定（`createHandoffSnapshotKey`），正式架构变化后已生成文档标记“已过期”；
  - 提供一键复制全文与导出 `.md` 文件功能。
- **订正与补证据**：
  - 手工溯源 `apps/web/package.json` 引入的依赖与边数（基线由 40 边增至 42 边并注明于日志）；
  - 在 `handoff.spec.ts` 中通过真实读取剪贴板实现逐字比对，并补充剪贴板权限拒绝降级测试；
  - 建立完整的来源追踪覆盖表（覆盖组件、连接、约束、决策、限制项及三类 Guide 段落）；
  - 规范化 `createHandoffSnapshotKey` 排除布局坐标与临时视图，补充拖动不触发过期、语义属性变更触发过期的测试。

### 步骤 5.2：Proposal 与 Ghost 投影 (Step 5.2: Proposal & Ghost Projection)
- 提交哈希：`cb8be8e`, `baba8c0`
- **D-007 方案 B（Web 适配层局部扩展）放置算法 (`ghost-placement.ts`)**：
  - 实现纯函数 `calculateGhostPlacement`；
  - 保证 Ghost 与所有正式节点及容器边界几何零重叠（Zero Overlap）；
  - 属于已有容器但无空位时，置于容器外侧并附带文字 notice，不改动正式容器布局；
- **Svelte Flow 适配层 Ghost 投影 (`svelte-flow-adapter.ts`)**：
  - 新增组件映射为 `ghost:${id}` 独立 ID 节点与 `[待审批 / Proposed]` 紫色虚线样式；
  - 新增连接映射为紫色虚线 Ghost 连接；
  - 编辑属性映射为正式节点黄色 `[待变更 / Pending Change]` 徽章；
  - 删除组件/连接映射为正式元素红色 `[待删除 / Pending Deletion]` 徽章与删除线；
  - 所有 Ghost 与标记均配备文字徽章与无障碍 ARIA 标签；
- **画布渲染与不变量保障 (`ArchitectureCanvas.svelte`, `ArchitectureNode.svelte`)**：
  - Ghost 独立身份绝不进入正式 `ArchitectureProject`、持久化 `LayoutState` 或 Save 产物；
  - 单提案锁定机制：存在未决提案时阻断新的编辑命令。

### 步骤 5.3：Review 接入与生命周期硬化 (Step 5.3: Review Integration & Lifecycle Hardening)
- 提交哈希：`9971e4d`, `b94e0fb`
- **审批动作与 Ghost 关联**：
  - Accept：正式 `ArchitectureProject` 更新，Ghost 投影消除，触发增量布局（Stability pass）；
  - Reject：Ghost 投影立即消除，正式架构不变，候选按已批准语义保留在内存中；
- **过期提案 (Stale Proposal) 处置机制**：
  - 正式架构发生外部演变后，未决提案自动标记为“已过期”（`isProposalStale: true`）；
  - 界面与控制器严格禁用 Accept 并给出明确提示，保留 Reject 用于清理失效提案；
- **审查状态机防御**：
  - 验证重复 Accept/Reject 的幂等性；
  - 验证校验失败的候选提案阻断 Accept 但允许 Reject 清理；
  - 空理由严格阻断审批。

### 步骤 5.4：增量布局稳定性与位移度量 (Step 5.4: Incremental Layout & Stability Metrics)
- 提交哈希：`7120770`, `634c355`
- 在 `GreenfieldShellState` 与 `ShellController` 暴露增量布局位移报告 `movement`；
- 编写 `incremental-stability.test.ts`，机械化断言 Greenfield 与 Medium Brownfield 接受提案后未受影响节点移动量严格符合预算（实测均为 0.0px，严格 ≤ 48px / ≤ 144px 预算）；
- 经验度量 6 组 Ghost 初始位置与正式节点最终位置的欧几里得位移距离，输出完整量化表格与统计分析。

### 步骤 5.5：阶段 5 验收与文档同步 (Step 5.5: Acceptance & Documentation)
- 运行完整 CI 门禁（`CI=true TURBO_FORCE=true pnpm ci:verify`，全量通过，0 缓存）；
- 运行双模式浏览器 E2E 测试（36/36 全数通过）；
- 更新执行计划、当前状态日志与 PR 草稿，产出本退出报告。

---

## 2. 为什么这么做 / Why

1. **唯一架构事实来源铁律 (Source of Truth Invariant)**：
   - 坚持 `ArchitectureProject` 是系统架构唯一的真实来源，Ghost 只是未批准提议的临时视觉投影；
   - Ghost 的 ID（`ghost:...`）、坐标和视觉状态绝不污染底层 IR、持久化 LayoutState 或 Handoff 蓝图；
   - 杜绝任何组件或适配层绕过 Review 直接修改已接受 IR。
2. **D-007 方案 B 的权衡与合规 (D-007 Option B Rationale)**：
   - 方案 B 在 Web 适配层实现局部几何放置，完全避免了修改 `packages/architecture-layout` 公开 API，不破坏 D-010 Worker 边界，且严格实现了与正式节点的零重叠；
   - 容器无空位时置于外侧并带提示，避免了强制重排已有正式容器引发的视觉抖动。
3. **闭环生命周期与防冲突防御 (Lifecycle Hardening & Anti-drift)**：
   - 当正式架构发生外部演变后，旧提案基线失效，自动标记为 Stale 并禁用 Accept，杜绝了静默代码冲突；
   - 保留 Reject 作为恢复工作区编辑自由度的标准出口，符合人类自然心智模型。
4. **稳定重于最优与局部变更原则 (Stable over Optimal)**：
   - 增量布局必须确保无关节点绝对稳定（0.0px 位移），保护架构师心智地图；
   - 局部启发式几何放置与全局 ELK 层次优化的差异属于预期物理特性，通过实测度量透明记录，不隐瞒、不粉饰。
5. **零伪造执行契约 (Zero Fabrication in Handoff)**：
   - Handoff 产物严格基于正式架构，不包含未决提议；反演架构中显式标注 `inferred` 证据；
   - 剪贴板复制用真实读取逐字校验，拒绝静默假成功；
   - 严格杜绝 Agent 运行时或执行终端，保持 `agent-adapter` 的纯渲染器定位。

---

## 3. 验证结果 / Verification

### 自动化验证与门禁结果全量统计

| 检查项 / 门禁 | 执行命令 | 结果 (Result) | 关键指标 / 覆盖范围 |
| --- | --- | --- | --- |
| **CI 总门禁** | `CI=true TURBO_FORCE=true pnpm ci:verify` | **PASS (Exit 0)** | 包含全量审计、代码规范、变更记录、密钥扫描、提交检查、单测、集成测试、E2E 测试与源码重建（15 个包/应用，0 缓存） |
| **安全审计** | `pnpm security:audit` | **PASS (Exit 0)** | 0 high / 0 critical vulnerabilities |
| **密钥扫描** | `pnpm security:secrets` | **PASS (Exit 0)** | 651 files passed |
| **变更记录检查** | `pnpm check:changelog` | **PASS (Exit 0)** | 三段式结构与中英双语校验通过 |
| **提交格式规范** | `pnpm commitlint` | **PASS (Exit 0)** | Conventional Commits 规范通过 |
| **工作区架构规范** | `pnpm lint:workspace` | **PASS (Exit 0)** | 15 模块依赖方向校验无违背 |
| **TypeScript 类型检查** | `pnpm typecheck` | **PASS (Exit 0)** | 27 Turbo tasks 全数通过，0 错误 0 警告 |
| **全仓单元测试** | `pnpm test:unit` | **PASS (Exit 0)** | 28 Turbo tasks 全数通过（含 Web 端 18 个测试文件、115 项测试） |
| **全仓集成测试** | `pnpm test:integration` | **PASS (Exit 0)** | 18 Turbo tasks 全数通过（含 Web 端 4 个测试文件、13 项测试） |
| **Web 浏览器 E2E 测试 (dev)** | `playwright test --config=playwright.config.ts` | **PASS (Exit 0)** | 36/36 测试全数通过（100% ELK solver，零 fallback） |
| **Web 浏览器 E2E 测试 (preview)** | `playwright test --config=playwright.preview.config.ts` | **PASS (Exit 0)** | 36/36 测试全数通过（100% ELK solver，零 fallback） |
| **全包纯源码构建** | `pnpm build` | **PASS (Exit 0)** | 15 Turbo tasks 全数通过，0 缓存重新构建 |

### 各包测试用例明细 (Package Test Breakdown)

- `@coding-cad/architecture-ir`: 1 文件，通过 (`dist/architecture-project.test.js`)
- `@coding-cad/component-registry`: 1 文件，通过 (`dist/registry.test.js`)
- `@coding-cad/architecture-dsl`: 1 文件，通过 (`dist/parser.test.js`)
- `@coding-cad/architecture-layout`: 7 测试文件全数通过 (passes, elk-adapter, compiler, elk-engine, incremental-layout, ghost-layout, performance-budget)
- `@coding-cad/architecture-validator`: 1 文件，通过 (`dist/validator.test.js`)
- `@coding-cad/execution-blueprint`: 1 文件，通过 (`dist/generator.test.js`)
- `@coding-cad/architecture-agent`: 1 文件，通过 (`dist/agent.test.js`)
- `@coding-cad/agent-adapter`: 1 文件，通过 (`dist/adapter.test.js`)
- `@coding-cad/workspace`: 1 文件，通过 (`dist/workspace.test.js`)
- `@coding-cad/implementation-analyzer`: 2 测试套件通过 (`evidence-codec`, `dist/analyzer.test.js`)
- `@coding-cad/implementation-validator`: 2 测试套件通过 (`brownfield-compliance`, `dist/validator.test.js`)
- `@coding-cad/architecture-review`: 1 文件，通过 (`dist/review.test.js`)
- `@coding-cad/cli`: 集成与 E2E 通过
- `@coding-cad/server`: 安全隔离与路由验证通过 (19/19 测试)
- `@coding-cad/web`:
  - 单元测试 (vitest unit)：18 个测试文件，115/115 项通过；
  - 集成测试 (vitest integration)：4 个测试文件，13/13 项通过；
  - Web 端单元 + 集成测试合计通过：128 项；
  - 浏览器端 Playwright E2E 测试：36/36 项全数通过（dev 与 preview 模式各 36 项）。

### 步骤 5.4 增量布局稳定性与位移经验度量实测数据表

| 测试夹具 (Fixture) | 组件 (Component) | Ghost 初始坐标 | 正式最终坐标 | 位移距离 (Displacement) | 未受影响 p95 | 未受影响 Max | 符合预算 (Within Budget) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield (Points System) | Kafka | (801.0, 24.0) | (561.0, 248.0) | 328.3 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Greenfield (Points System) | RedisReplica | (801.0, 24.0) | (561.0, 248.0) | 328.3 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Greenfield (Points System) | NotificationService | (252.0, 236.0) | (24.0, 236.0) | 228.0 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | DocGen | (1812.0, 208.0) | (24.0, 153.0) | 1788.8 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | Telemetry | (1764.0, 306.0) | (24.0, 153.0) | 1746.7 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |
| Medium (Coding-CAD Baseline) | ArtifactViewer | (252.0, 120.0) | (24.0, 153.0) | 230.4 px | 0.0 px | 0.0 px | YES (<= 48px / <= 144px) |

- **汇总统计 (Summary Statistics)**：
  - Greenfield (Points System): 均值 Mean = 294.9px, 中位数 Median = 328.3px, 最大值 Max = 328.3px；
  - Medium Brownfield: 均值 Mean = 1255.3px, 中位数 Median = 1746.7px, 最大值 Max = 1788.8px；
- **稳定性分析与结论**：
  - 增量布局对所有未受影响节点位移实测均为 **0.0 px**（严格满足 `p95 <= 48px` 与 `max <= 144px` 预算）；
  - Ghost 到正式节点的位移完全源于局部几何启发式避碰与 ELK 全局拓扑分层优化之间的策略差异，属于设计预期范围。

---

## 4. 提交历史与逆序回退分析 / Commits & Rollback Crosswalk

### 提交记录表

| 步骤 / Step | 提交哈希 / Commit | 提交信息 / Message | 回退命令 / Revert Command | 连带影响 / Cascade Impact |
| --- | --- | --- | --- | --- |
| 0 | `7400cd4` | `chore(git): perfect gitignore rules across workspace packages and apps` | `git revert 7400cd4` | 回退工作区 `.gitignore`，可能导致本地构建产生未跟踪文件（范围外附带改动） |
| 5.0 | `77e446a` | `docs(phase-5): add phase 5 design memo and initialize PR draft` | `git revert 77e446a` | 回退设计备忘录与 PR 草稿初始版 |
| 5.1 | `2797f9c` | `feat(handoff): implement execution handoff preview, copy, export, and provenance tracking` | `git revert 2797f9c` | 移除 Execution Handoff 产品化能力、Web 依赖及对应 E2E/单元测试，恢复合规基线连接 |
| 5.1 (PR) | `3f8d76a` | `docs(pr): update PR draft with Step 5.1 commit hash and rollback crosswalk` | `git revert 3f8d76a` | 同步回退 PR 草稿中步骤 5.1 提交哈希 |
| 5.1.1 | `f6ea675` | `test(handoff): correct baseline provenance, add copy fallback, and enforce canonical snapshot key` | `git revert f6ea675` | 回退 5.1.1 补齐测试与快照算法规范化 |
| 5.2 | `cb8be8e` | `feat(ghost): implement proposal ghost projection, placement adapter, and view markers` | `git revert cb8be8e` | 移除 Ghost 放置算法、Svelte Flow Ghost 投影与编辑标记，恢复无 Ghost 的直接候选状态 |
| 5.2 (PR) | `baba8c0` | `docs(pr): update PR draft with Step 5.2 commit hash and rollback crosswalk` | `git revert baba8c0` | 同步回退 PR 草稿中步骤 5.2 提交哈希 |
| 5.3 | `9971e4d` | `feat(review): harden review gate with ghost accept/reject, stale proposals, and single-proposal lock` | `git revert 9971e4d` | 移除 Review 接入硬化、过期提案标记与单提案严格防御 |
| 5.3 (PR) | `b94e0fb` | `docs(pr): update PR draft with Step 5.3 commit hash` | `git revert b94e0fb` | 同步回退 PR 草稿中步骤 5.3 提交哈希 |
| 5.4 | `7120770` | `test(layout): verify incremental layout stability budget and measure ghost displacement` | `git revert 7120770` | 移除增量布局稳定性指标测试与位移度量套件 |
| 5.4 (PR) | `634c355` | `docs(pr): update PR draft with Step 5.4 commit hash` | `git revert 634c355` | 同步回退 PR 草稿中步骤 5.4 提交哈希 |

### 逆序回退分析 (Cascading Rollback Analysis)

若需回退本阶段提交，请严格按照逆序操作：
1. **回退 5.4** (`git revert 634c355` -> `git revert 7120770`)：安全移除增量布局稳定性指标测试与位移度量套件，不影响正式架构与 Ghost 交互；
2. **回退 5.3** (`git revert b94e0fb` -> `git revert 9971e4d`)：移除过期提案检测、单提案严格阻断与 Review 接入硬化，恢复步骤 5.2 的基本 Ghost 投影；
3. **回退 5.2** (`git revert baba8c0` -> `git revert cb8be8e`)：安全移除 Ghost 投影、局部放置纯函数与待删除/待变更视觉标记，不影响正式架构与 Review 状态机；
4. **回退 5.1.1** (`git revert f6ea675`)：恢复 5.1 初始快照实现与测试；
5. **回退 5.1** (`git revert 3f8d76a` -> `git revert 2797f9c`)：安全移除 Handoff 模态框、对焦控制与导出的全部功能代码及测试，不会损坏底层已有的 Greenfield/Brownfield/Review 核心逻辑；
6. **回退 5.0** (`git revert 77e446a`)：若在 5.1 未回退时强行回退 5.0，会导致 PR 草稿和设计备忘录丢失；
7. **回退 0** (`git revert 7400cd4`)：若在后续步骤未回退时单独回退，会导致 `.svelte-kit/`、`.turbo/` 等产生未跟踪文件污染工作区，但不影响业务代码运行。

---

## 5. 未决事项与后续阶段交接 / Pending Items & Phase 6 Handoff

### 需用户持续关注的架构备忘
1. **D-004 钉住节点 (Pinned Nodes) 与 D-006 布局持久化**：
   - 阶段 5 遵守只读与内存原则，未实现钉住节点或持久化 `LayoutState` 的磁盘序列化格式；
   - 阶段 6 规划中需在进入 Terminal 前对 D-004 与 D-006 进行最终确认或明确延后。
2. **xjb_coding 格式导出调研（设计备忘录第 6 节）**：
   - 备忘录已完成格式可行性调研（任务、依赖、验收条件均可映射）；
   - 当前不在交付范围内，未实现导出目标，待用户后续授权。
3. **后续阶段授权建议**：
   - 阶段 5 退出条件已全部满足；
   - 建议用户审阅本退出报告及 PR 草稿后，授权进入 **Phase 6 — Layout Quality / Performance / E2E（布局质量、性能与 E2E 综合验收）**。
