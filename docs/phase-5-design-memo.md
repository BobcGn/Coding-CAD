# Phase 5 Design Memo: Ghost Architecture, Review, and Execution Handoff
# 阶段 5 设计备忘录：Ghost 架构、审核与执行交接

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
性质 / Type: 只读调研与设计备忘录（不包含产品实现代码） / Read-only research and design memo (no production implementation code)

---

## 1. 现状盘点 / Current State Inventory

### 1.1 候选架构、待审批命令与 Review 状态机 / Candidate Architecture, Pending Commands, and Review State Machine

| 概念 / Concept | 含义与代表实体 / Representation | 存储位置与生命周期 / Storage & Lifecycle | 状态与迁移 / States & Transitions | 已批准语义与门禁 / Approved Semantics & Gates |
| --- | --- | --- | --- | --- |
| **候选架构 (Candidate Architecture)** | 未被正式采纳的完整 `ArchitectureProject` 提案。<br>1. Greenfield 中由 `ArchitectureAgent.design()` 确定性生成；<br>2. 交互编辑中由 `CommandApplication.prepare()` 针对正式架构生成演进快照。 | **纯内存状态 (In-memory only)**。<br>位于 `GreenfieldShellState.candidate` (`apps/web`)；绝不写入 `.coding-cad/` 磁盘，不生成正式快照，刷新/重置后即销毁。 | 1. `generate` / `executeCommand` -> 产生候选并进入 `layout` 状态；<br>2. `accept` -> 校验通过后替换为正式架构，候选置空；<br>3. `reject` -> 记录拒绝，候选保留供查看；<br>4. `reset` -> 丢弃候选。 | - 唯一架构事实源是已批准的 `ArchitectureProject`；<br>- 未通过校验的候选**严禁批准**；<br>- 候选展示不污染正式布局状态。 |
| **待审批命令 (Pending Command)** | 单次针对正式架构发起的结构性修改指令（`add-component`、`remove-component`、`connect-components`、`inspector-*`）。 | **纯内存单槽 (Single slot in-memory)**。<br>位于 `WorkspaceShellController.pendingCommand: CommandPreparation \| undefined`。 | 1. 发起命令 -> `prepare()` 校验并预演候选；<br>2. 存在未决命令时，**阻塞后续所有编辑命令**（抛出 `"Review the pending candidate before editing"`）；<br>3. `decide()` -> 批准后合并为正式架构，或拒绝后保留。 | - 命令粒度为细粒度字段指令（P3-D3：禁止通用 patch）；<br>- 必须经过 Validator 校验与 Review 门禁；<br>- 存在未决命令时不可并发。 |
| **Review 状态机 (`packages/architecture-review`)** | 架构提案生命周期治理引擎，管理 `Proposal` 及其影响分析（`ImpactAnalysis`）与审批记录（`Approval`）。 | **纯内存 Map (In-memory `Map<string, Proposal>`)**。<br>由 `ArchitectureReview` 实例管理，持久化属于外部宿主或 Workspace 职责。 | 状态集合：<br>- `draft`（草稿）<br>- `in-review`（评审中）<br>- `changes-requested`（要求修改）<br>- `approved`（已批准）<br>- `rejected`（已拒绝）<br>- `withdrawn`（已撤回）<br><br>迁移：<br>`draft` -> `submitProposal()` -> `in-review` -> `recordApproval(approve)` -> `approved`；或 -> `recordApproval(reject)` -> `rejected`。 | - **审批人身份固定**：`reviewer: "local-user"`（本地单用户，无认证系统）；<br>- **审批理由必填**：`rationale` 非空校验；<br>- **校验硬门禁**：`!validation.valid` 时禁止 `approve`；<br>- **拒绝保留候选**：拒绝记录在状态机并保留 proposal 供审查，不覆盖原图。 |

---

## 2. Proposal 概念对齐与复用分析 / Proposal Concept Alignment & Reuse Analysis

### 2.1 阶段 5 Proposal 与现有“候选/待审批命令”的关系

在阶段 3 的实现中，“候选架构”与“待审批命令”均已通过 `packages/architecture-review` 的 `Proposal` 承载：
- Greenfield 流程：`candidate-flow.ts` 将 requirement 生成的 `candidate` 与当前 `accepted` 包装为 `Proposal`；
- Inspector/Palette 命令流程：`command-application.ts` 将单条命令应用后的 `candidate` 与当前 `accepted` 包装为 `Proposal`。

两者底层均包含 `ArchitectureChange`：
```ts
export interface ArchitectureChange {
  readonly baseVersion: ArchitectureVersion;
  readonly proposedVersion: ArchitectureVersion;
  readonly baseArchitecture: ArchitectureProject;
  readonly proposedArchitecture: ArchitectureProject;
}
```

**结论**：阶段 5 所述的 **Proposal 与现有结构在领域语义上是高度一致的**，完全可以复用 `packages/architecture-review` 的 `Proposal` 状态机。

### 2.2 现有表达能力的缺口分析 / Gap Analysis (No Unauthorized Types)

虽然领域模型同源，但在支撑阶段 5 的 Ghost 与复杂提案时，现有运行时存在以下能力缺口（**本阶段仅记录缺口，不自行新增任何公开类型**）：

1. **单命令 vs. 多命令批处理 (Single Command vs. Batch Changes)**：
   - 现状：`CommandApplication` 仅能消费单条 `ArchitectureCommand`；
   - 缺口：外部 Agent 或复杂重构可能一次提议新增两个组件及一条连接。虽然 `Proposal.change` 支持两个完整架构的比对，但前端交互层缺乏多命令原子提议的构建管道。
2. **提案来源与元数据标注 (Proposal Provenance Annotation)**：
   - 现状：`Proposal` 仅包含 `author: string` 与 `title`/`summary`；
   - 缺口：无法类型化区分该提案是来自“用户手工命令”、“AI 智能体建议”、“代码反演对比”还是“规则修复推荐”。
3. **部分接受/挑拣接受 (Partial Acceptance / Cherry-picking)**：
   - 现状：`ArchitectureReview` 仅支持全量 `approve`（产生完整的 `proposedArchitecture`）或全量 `reject`；
   - 缺口：用户无法在一个提案中选择“仅接受组件 A，拒绝组件 B”。

---

## 3. D-007 (Ghost Proposal Presentation) 分析与方案对比 / D-007 Analysis & Options

### 3.1 D-007 原文要求与阶段 5 计划的差异 / Text vs. Plan Differences

- **D-007 原文要求**：解决未批准 Proposal 在画布上的呈现形态（Overlay vs. Local Extension vs. Separate Comparison View），避免干扰正式架构的 mental map，最晚在 Checkpoint 7（Phase 5）确认。
- **阶段 5 计划要求**：
  - Ghost 具备独立 Identity（独立于正式节点）；
  - 局部放置（Local placement）与最小扰动（Minimal disturbance）；
  - 拒绝 Proposal 只移除 Ghost，不修改正式 IR 或 LayoutState；
  - 接受 Proposal 必须走 Review 门禁，并在 accepted IR 更新后触发增量布局（Incremental Layout）；
  - 严禁把 Ghost 写入 `ArchitectureProject`。

### 3.2 2~3 个可行技术方案对比 / Feasible Technical Options

| 方案 / Option | 机制描述 / Mechanism | 优点 / Pros | 缺点 / Cons | 对公开 API 与稳定性的影响 / API & Stability Impact |
| --- | --- | --- | --- | --- |
| **方案 A：画布级局部投影 (Local Extension via Canvas Web Adapter)** *(推荐 / Recommended)* | 正式架构通过 `architecture-layout` 求解坐标；Web Adapter 识别 `Proposal.change.diff`，将新增的 Ghost 节点作为特殊 Svelte Flow 节点（`type: "ghost-component"`）局部放置在目标连接节点附近（无连接时置于独立 Ghost 区域）。 | 1. 严格遵循“Ghost 不属于 Architecture IR”铁律；<br>2. 拒绝时只需在前端卸载 Ghost 节点，正式画布与坐标零扰动；<br>3. 实现成本可控，渲染与正式逻辑解耦。 | 复杂多节点提案可能在局部产生遮挡，需前端简单避让计算。 | **完全不修改 `architecture-layout` 公开 API**。<br>不破坏现有的 D-010 Worker 边界与 Stability pass。 |
| **方案 B：求解器协同虚拟扩展 (Solver-assisted Virtual Extension)** | 将 Ghost 节点打上 `isGhost: true` 标记一同输入 `layoutArchitectureGraph`，求解器赋予 Ghost 节点更低位移权重，一次性完成全局与局部避让。 | 求解器自动计算连线与无重叠坐标，多节点 Ghost 拓扑视觉效果最好。 | 1. 违背“正式架构与提案分离”原则；<br>2. Ghost 存在会迫使正式节点发生位移，破坏用户的 Mental Map；<br>3. 拒绝提案后需要二次触发回滚重排。 | **严重违背约束**：<br>必须修改 `architecture-layout` 的 Visual IR 与输入契约；修改量巨大。 |
| **方案 C：独立对比视图 (Separate Comparison View / Diff Panel)** | 主画布始终只展示正式架构。点击“审查提案”时，打开模态弹窗或侧边双栏，左侧为基线架构，右侧为提案架构（包含高亮差异）。 | 1. 对主画布正式架构完全零干扰；<br>2. 适合大体量、破坏性大的重构提案；<br>3. 差异比对边界极其清晰。 | 割裂了局部上下文，用户无法在主画布直接直观感知新组件对现有拓扑的空间嵌入关系。 | **完全不修改任何核心 package API**。<br>纯前端视图层新增组件。 |

### 3.3 推荐与理由 / Recommendation & Rationale

**推荐采纳：方案 A（画布级局部投影）为主，并保留向方案 C 的降级通道**。
- **理由**：
  1. 方案 A 完美契合 Coding CAD 的“Local Change, Local Movement”与“Ghost 独立投影”原则；
  2. 保护了核心包边界：`packages/architecture-layout` 仅负责正式图的语义编译与稳定增量布局，不介入 Ghost 临时视图；
  3. 杜绝了方案 B 带来的正式图意外位移和 API 破坏性变更；
  4. 当提案组件数量超过一定阈值（如 > 5 个组件）时，可提示用户切换至全屏对比模式（方案 C）。

---

## 4. 审批语义缺口表 / Approval Semantics Gap Matrix

Ghost 节点的接受与拒绝必须严格经过现有 `packages/architecture-review` 门禁。以下梳理现有语义的覆盖情况与新增诉求：

| 场景序号 / # | 交互场景 / Scenario | 现有语义状态 / Status | 详细说明 / Details | 需用户决策的问题与选项 / Questions & Options for User |
| --- | --- | --- | --- | --- |
| **S1** | **完整接受提案 (Full Accept)** | ✅ 现有语义已覆盖 | 调用 `recordApproval(id, { reviewer: "local-user", decision: "approve", rationale })`。校验通过后返回更新的 `accepted ArchitectureProject`，并触发正式图增量布局。 | 无需新决策，直接复用。 |
| **S2** | **完整拒绝提案 (Full Reject)** | ✅ 现有语义已覆盖 | 调用 `recordApproval(id, { reviewer: "local-user", decision: "reject", rationale })`。记录拒绝状态，正式架构保持不变，Ghost 从画布移除或标记为已拒绝。 | 无需新决策，直接复用。 |
| **S3** | **部分接受/挑选命令 (Partial Accept)** | ❌ 需要新增语义 | 当前 `ArchitectureReview` 只能整体批准。如果 Ghost 提案由多条子变更组成，用户希望“只采纳其中一部分”。 | **决策问题 1**：V1 是否支持提案部分采纳？<br>- **选项 A (推荐)**：V1 仅支持全量接受/拒绝。若需部分采纳，用户需拒绝后手动用 Palette/Inspector 编辑；<br>- **选项 B**：在前端把多命令拆解为独立子 Proposal 分别审批。 |
| **S4** | **多提案并发存在 (Multiple Proposals)** | ⚠️ 部分覆盖（状态机支持，前端不支持） | `ArchitectureReview` 内部使用 `Map<string, Proposal>`，理论上支持多个提案共存；但当前 `apps/web` 只有一个 `pendingCommand` 槽位，新提案会被拒绝。 | **决策问题 2**：画布是否允许同时存在多个不同来源的 Ghost 提案？<br>- **选项 A (推荐)**：V1 单一提案模式，同一时间画布仅渲染一组 Ghost，新提案必须等待当前提案完结；<br>- **选项 B**：多提案模式，各提案以不同颜色/Ghost 图层并行展示。 |
| **S5** | **基线变更导致提案过期 (Stale Proposal)** | ❌ 需要新增语义 | 当 Ghost 提案处于待审批状态时，用户在画布上通过 Palette 添加了其他正式组件（版本号递增），导致该 Ghost 的 `baseVersion` 与 `baseArchitecture` 过期。 | **决策问题 3**：基线演进后待决 Ghost 如何处理？<br>- **选项 A (推荐)**：自动标记 Ghost 为“已过期 (Stale)”，禁用接受按钮，要求重新生成或撤销；<br>- **选项 B**：尝试三方自动合并（Auto-rebase）并在合并冲突时报错。 |
| **S6** | **拒绝后再提议 (Re-propose after Reject)** | ✅ 现有语义已覆盖 | 提案被拒绝后保留在历史中；发起新提议创建新的 `Proposal`（`baseVersion` 依然对齐当前正式架构）。 | 无需新决策，符合现状。 |

---

## 5. Ghost 与增量布局分析 / Ghost and Incremental Layout Analysis

### 5.1 现有增量布局（Stability Pass）的能力边界

`packages/architecture-layout` 中的增量布局由 `StabilityPass` 实现：
1. **输入**：当前图的 `LayoutGraph`、上次已布局的状态 `previousState: LayoutState`（记录了已确认节点的绝对坐标）；
2. **行为**：
   - 保留未受影响节点的坐标；
   - 识别新增节点，并在不受影响节点形成的局部空白区域进行无碰撞分配；
   - 清除受影响边的历史路由，交由求解器重新连线。
3. **输出**：更新后的 `LayoutResult`，并转为新的 `LayoutState`。

### 5.2 增量布局对“未正式化 Ghost 节点”的处理结论

- **核心矛盾**：如果把 Ghost 节点传入 `layoutArchitectureGraph()`，增量布局引擎会视其为“合法节点”并为其生成持久化的 `LayoutState` 坐标。一旦用户拒绝该提案，系统必须从 `LayoutState` 中剔除这些节点，这会污染持久化的视图状态。
- **API 变更影响**：若要求 `architecture-layout` 原生支持 Ghost，必须修改 `ArchitectureLayoutGraph` 的节点定义（新增 `visualRole?: "ghost"`），并在 `LayoutMode` 中增加 `"GHOST"` 模式。这**直接违反了“本阶段不改动 architecture-layout 公开 API”的铁律**。
- **推荐技术路径**：
  - **正式图走标准 INCREMENTAL 模式**；
  - **Ghost 节点的布局计算留在 Web Adapter 层**：
    - 针对新增组件（`diff.components.added`）：若与已有组件有连接，将其放置在关联已有组件的右侧/下方预设偏移量处（如 `x + width + 48px`）；
    - 若为孤立新增组件，放置在当前视图右侧的暂存区；
    - Ghost 连线复用 Svelte Flow 的平滑贝塞尔虚线渲染，无需经过 ELK 复杂路由。

---

## 6. Execution Handoff 现状与调研 / Execution Handoff Current State & Research

### 6.1 `execution-blueprint` 的输出结构

`ExecutionBlueprint` 定义于 `packages/execution-blueprint/src/blueprint.ts`：
1. `projectName: string`：系统名称；
2. `architectureReference: string`：如 `name@architecture-ir:1`；
3. `tasks: readonly ImplementationTask[]`：
   - `id`: 形如 `implement-<componentId>`、`connect-<from>-to-<to>`、`implement-consistency-logic`；
   - `title`: 人类可读标题（如 `"Create AuthService"`、`"Connect WebClient to AuthService"`）；
   - `description`: 任务目标；
   - `relatedComponents: readonly string[]`: 关联合法组件 ID 列表；
   - `requirements: readonly string[]`: 具体条目；
   - `dependencies: readonly string[]`: 依赖的任务 ID 列表；
4. `constraints: readonly ImplementationConstraint[]`：
   - `type`: 约束类型；
   - `description`: 约束详情；
   - `severity`: `"required"` / `"warning"` 等；
   - `source`: `"architecture-constraint"` \| `"architecture-decision"` \| `"validator-result"` \| `"component-limitation"`；
   - `sourceReference`: 来源标识（决策标题、校验 Issue ID、组件限制 ID）；
5. `agentGuide: AgentGuide`：
   - `systemContext`: 面向外部 Coding Agent 的职责声明；
   - `architectureSummary`: 拓扑结构与目的综述；
   - `decisions`: 决策列表；
   - `forbiddenChanges`: 禁止修改的行为边界；
   - `acceptanceCriteria`: 验收标准列表。

### 6.2 `agent-adapter` 的渲染能力

`packages/agent-adapter` 实现了针对三种目标的纯文本/Markdown 渲染：
1. **Generic (`generic-markdown`)**：结构完整的标准实施说明书 Markdown；
2. **Codex (`codex-prompt`)**：针对 OpenAI/Codex 优化的 System/Developer Prompt，强调文件修改范围与任务约束；
3. **Claude Code (`claude-md`)**：渲染为符合 Claude 惯例的 `CLAUDE.md` 格式，强调工程规范、设计原则与禁止项。

### 6.3 来源追踪现状与缺口 / Provenance Tracking & Gaps

- **组件与连线来源**：`ImplementationTask.relatedComponents` 完整保留了 `ArchitectureProject.architecture.components` 的真实 ID。从任务回溯到画布节点 100% 可行；
- **约束来源**：`ImplementationConstraint.sourceReference` 保留了约束来源 ID（如决策标题或限制标识）；
- **当前缺口**：
  1. `AgentGuide.decisions` 目前是格式化后的纯字符串数组（`"${title}: ${decision} Rationale: ${rationale}"`），未保留决策的结构化 ID；
  2. 渲染后的 Guide 文本为平铺 Markdown，段落与原始 Blueprint 项之间在数据结构上没有直接的一级索引，需在 Handoff 视图层维护渲染段落映射关系。

---

### 6.4 只读调研：`xjb_coding` 任务计划与验收条件格式 / Read-Only Research: `xjb_coding` Format

在宿主环境 `/Users/bobcgn/AAA_Codings/OpenSource_Projects/xjb_coding` 中完成对 `xjb_coding`（版本 v0.0.19, Skills-first, MCP-enhanced）的只读调研：

#### 1. 任务计划格式 (Task Plan Format)
`xjb_coding` 采用“双后端、统一语义”架构：
- **MCP 增强模式**：通过 `task.add(description, priority, layer, parent_id, project_id)` 与 `task.assign(task_id, depends_on_id)` 建立任务图；
- **Markdown 回退模式**：
  - 维护 `.auto_coding/tasks/TRACKER.md` 总控进度表，包含：
    - 总览表（各层级任务统计、状态符号 `✅ 🔵 🔲 ❌`）；
    - 详细状态表：`| ID | 标题 | 层级 | 优先级 | 状态 | 依赖 |`；
    - 断言续做指引（当前任务、编辑文件、已完成步骤、下一步、未提交改动）。
  - 单个任务持久化为 `.auto_coding/tasks/<层级>/TASK-XXX.md`。

#### 2. 验收条件与四层门禁格式 (Quality Gates & Acceptance Criteria)
`xjb_coding` 定义了严格的 L1~L4 四层递进质量门禁：
1. **L1 工程门禁 (Engineering)**：`BUILD`、`TEST`、`FMT_CHK`、`LINT` 必须无报错通过；
2. **L2 架构门禁 (Architecture)**：模块职责清晰、不跨包非法导入、依赖方向不倒置；
3. **L3 业务门禁 (Business)**：功能完备性、边界用例、验收条件逐条满足；
4. **L4 专项门禁 (Specialized)**：压测、特定安全审计或领域自检脚本。

此外，在 `.auto_coding/start_coding.md` 的 §8 与 §9 中定义了全局硬约束与项目特定约定区（禁止 Docker、禁止改动测试断言、禁止修改特定目录等）。

#### 3. Execution Blueprint 映射到 `xjb_coding` 的可行性分析
- **高可行性**：
  - `ExecutionBlueprint.tasks` 可以 1:1 映射为 `xjb_coding` 的 `TASK-XXX`；
  - `ImplementationTask.dependencies` 直接映射为 `TRACKER.md` 的“依赖”列及 `task.assign`；
  - `ImplementationConstraint` 与 `AgentGuide.forbiddenChanges` 天然对应 `xjb_coding` 的 L2 架构门禁与 §9 项目约定；
  - `AgentGuide.acceptanceCriteria` 对应其 L3 业务验收条件。
- **声明 / Disclaimer**：
  本项分析仅作为格式可行性调研备忘，阶段 5.1 **不实现**向 `xjb_coding` 的导出目标或运行时对接。

---

## 7. 需要用户决策的问题清单 / Question List Pending User Decision

以下问题请用户裁定，以指导后续 Ghost 与 Review 阶段的实现：

| 编号 / # | 决策事项 / Topic | 备选方案 / Options | 推荐建议 / Recommendation |
| --- | --- | --- | --- |
| **Q-5.1** | **D-007 Ghost 呈现形态裁定** | **A.** 覆盖层 (Overlay)<br>**B.** 画布级局部扩展 (Local Extension via Web Adapter)<br>**C.** 独立侧边/弹窗对比视图 (Separate Comparison View) | **推荐选择 B**。<br>不修改 `architecture-layout` 公开 API 与 Worker 边界，由 Web Adapter 渲染局部 Ghost 节点，拒绝零成本移除，最符合局部修改局部稳定的精神。 |
| **Q-5.2** | **提案并发策略** | **A.** 单提案锁定（同一时间仅允许一个未决 Ghost 提案）<br>**B.** 多提案并行（允许多个 Ghost 提案以不同图层共存） | **推荐选择 A**。<br>单提案模式交互清晰，避免图层冲突和复杂的交叉依赖管理，适合 V1 MVP。 |
| **Q-5.3** | **部分采纳 (Cherry-picking) 语义** | **A.** V1 仅支持全量接受/全量拒绝（不支持单项挑选）<br>**B.** 扩展支持复选框挑拣子变更并生成派生 Proposal | **推荐选择 A**。<br>不引入复杂的部分合并逻辑；若需挑选，用户拒绝后通过 Inspector 显式操作即可。 |
| **Q-5.4** | **基线演变后的过期提案处置** | **A.** 自动标记“已过期 (Stale)”，禁用接受，要求重新评估<br>**B.** 尝试自动 Rebase 变基合并 | **推荐选择 A**。<br>保证架构事实源一致性，杜绝静默冲突。 |
| **Q-5.5** | **Brownfield Handoff 的证据提示** | **A.** 在 Handoff 预览头部显著呈现“含 inferred 证据”提示横幅<br>**B.** 隐藏该提示，仅在 Inspector 显示 | **推荐选择 A**。<br>忠实呈现反演架构的不确定性，避免外部 Agent 将推断事实误认为设计基线。 |
