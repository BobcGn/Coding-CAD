# Phase 5 Exit Report / 阶段 5 退出报告

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
基线提交 / Target Baseline: `c060ffb` (origin/main)  
退出结论 / Exit Conclusion: **有条件满足 / CONDITIONALLY SATISFIED**  
*(阶段 5 范围内全部交付物、不变量、测试套件与安全门禁均已完成并验证，无新增 package，无 Agent 运行时，无 D-010 边界越界；但受限于待用户决策事项，结论定为有条件满足 / All deliverables, invariants, test suites, and security gates within Phase 5 scope are implemented and verified; no new packages, no Agent runtimes, no D-010 boundary leaks; conclusion is Conditionally Satisfied pending user action items).*

---

### 待用户处理事项 / Items Pending User Action

1. **Ghost 预测位置实现与验收 (Ghost Predictive Placement Implementation & Verification)**: 用户已批准 D-011（采纳方案 B：未持久化试算布局预测 Ghost 位置，约束：试算与接受同一函数同一参数、绝对不持久化、失败降级、提案变化丢弃试算、不改动底层 API 与审批语义、三态标签提示）。步骤 5.8.0 已完成证据订正与细化分类，正在执行步骤 5.8 实现与验证。
2. **xjb_coding 导出立项确认 (xjb_coding Export Project Decision)**: 是否正式立项将 Execution Blueprint 导出为 xjb_coding 配置格式。备忘录第 6 节已评估映射可行性：`task_graph` 可直接从 Blueprint Task 拓扑导出，但约束映射在复杂谓词下需转换，且存在单向导出不回写的边界限制。
3. **人工可理解性评估尚未执行 (Human Interpretability Assessment Not Yet Executed)**: 尚未组织人工架构师进行可理解性评估，目前仅有自动化几何与语义断言覆盖。
4. **阶段 4.5 未执行事项及决策状态 (Phase 4.5 Deferred Items & Decision Status)**: 根入口聚合 (Root Entrypoint Aggregation)、循环依赖检测 (Cyclic Dependency Detection)、默认折叠落实为默认行为 (Default Collapse Applied as Default View State) 仍处于递延状态，需明确是否纳入后续阶段。
5. **布局与稳定性观测指标阈值裁定 (Observation Metrics & Budget Approval)**: 实测耗时、交叉数、位移等指标目前均未获正式业务预算批准，仅作为工程观测数据记录。

---

## 阶段 5 验收标准对照 / Acceptance Criteria Crosswalk

| 验收标准 (Acceptance Criterion) | 实施状态 (Status) | 验证证据 (Verification Evidence) | 说明 (Notes) |
| --- | --- | --- | --- |
| 1. Ghost 展示/拒绝不修改已接受 IR 或正式 LayoutState | **已实现并验证 (Verified)** | `svelte-flow-adapter.test.ts`, `review-gate.test.ts`, `editing.spec.ts` | Ghost 节点独立 ID (`ghost:...`)，Save/Open 与持久化状态均不含 Ghost，拒绝即刻消除 Ghost 且保持正式架构引用与内容不变 |
| 2. Accept 必须通过 Review，并在 accepted IR 更新后触发增量布局 | **已实现并验证 (Verified)** | `review-gate.test.ts`, `incremental-stability.test.ts`, `ghost-stability-benchmarks.spec.ts` | 沿用现有 Review 门禁（`local-user`、理由必填），Accept 推进正式架构变更并触发增量布局，无关节点位移严格为 0.0px |
| 3. Blueprint 与 Guide 来源可追溯，UI 不修改 Blueprint | **已实现并验证 (Verified)** | `execution-handoff.test.ts`, `execution-handoff.integration.test.ts`, `handoff.spec.ts` | 来源追踪覆盖表完整覆盖组件、连接、约束、决策与任务；Guide 段落通过正则可 100% 回溯至 Blueprint 项；点击来源元素画布平滑聚焦 |
| 4. Generic、Codex、Claude 3 种 Guide 可预览、复制与导出 | **已实现并验证 (Verified)** | `execution-handoff.test.ts`, `handoff.spec.ts` | 逐字剪贴板比对通过；无剪贴板权限时平稳降级提示；导出复用已有 Blob 下载机制；正式架构变化后自动标记已过期 |
| 5. 单提案锁定与过期提案防御 | **已实现并验证 (Verified)** | `workspace-shell-controller.test.ts`, `review-gate.test.ts`, `editing.spec.ts` | 同一时间仅允许一个未决提案；正式架构外部演变后提案自动标为 Stale，禁用 Accept，保留 Reject 清理 |
| 6. D-007 方案 B 零碰撞与局部放置硬约束 | **已实现并验证 (Verified)** | `ghost-placement.test.ts`, `svelte-flow-adapter.test.ts`, `ghost-stability-benchmarks.spec.ts` | 纯函数局部放置，与所有正式节点及容器边界几何零重叠，容器满时置于外侧并带文字 notice，不改动 architecture-layout 公开 API |
| 7. 增量布局稳定性预算与位移经验度量 | **已实现并验证 (Verified)** | `incremental-stability.test.ts`, `ghost-stability-benchmarks.spec.ts` | Greenfield 与 Medium Brownfield 接受增量布局中未受影响节点位移均为 0.0px (≤ 48px / ≤ 144px 预算)；真实浏览器 6 个场景全数通过 |
| 8. 绝无 Agent 运行时与 Terminal 能力 | **已实现并验证 (Verified)** | `pnpm lint`, 代码审计, CI 门禁 | `agent-adapter` 保持纯文本渲染器定位，`apps/web` 不引入执行流水线、调度器或 shell 桥接 |

---

## 1. 做了什么 / What

在 `codex/phase-5-ghost-handoff` 分支上按计划完成了阶段 5 的全部步骤（范围外附带改动、步骤 5.0、5.1、5.1.1、5.2、5.3、5.4、5.5、5.6、5.7）：

### 范围外附带改动：全仓 Git 忽略规则完善 (Out-of-Scope Chore: Gitignore Rules)
- 提交哈希：`7400cd4`
- 完善工作区各目录 `.gitignore`，隔离构建产物与临时状态；
- `git ls-files -c -i --exclude-standard` 验证 0 跟踪文件受损，作为范围外附带改动合规披露。

### 步骤 5.0：设计备忘录 (Step 5.0: Design Memo)
- 提交哈希：`77e446a`
- 产出中英双语设计备忘录 [`docs/phase-5-design-memo.md`](./phase-5-design-memo.md)；
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
  - 容器内部空间不足时，自动将 Ghost 放置于容器右侧外边界，并在节点上附带文字通知（Notice）；
  - 严格不改动 `architecture-layout` 公开 API、不改动 D-010 Worker 边界。
- **Svelte Flow 反腐蚀投影适配 (`svelte-flow-adapter.ts`)**：
  - 将 proposal diff 投影为 `ArchitectureFlowNode` 与 `ArchitectureFlowEdge`；
  - 新增组件赋予独立 ID `ghost:<component-id>`，赋予半透明虚线样式与 `[待审批 / Proposed]` 标签；
  - 待删除组件与连接赋予红框/红线及 `[待删除 / Pending Deletion]` 标记；
  - 待变更组件赋予琥珀色虚线框及 `[待变更 / Pending Change]` 标记；
  - Ghost 节点与编辑标记仅存在于视图层，绝对不进入 `ArchitectureProject`。

### 步骤 5.3：Review 门禁接入与生命周期硬化 (Step 5.3: Review Integration & Hardening)
- 提交哈希：`9971e4d`, `b94e0fb`
- **单提案锁定 (Single Proposal Lock)**：同一时间仅允许一个未决提案，未决期间阻止新增编辑；
- **过期提案处置 (Stale Proposal)**：正式架构发生外部演变后，自动将未决提案标记为“已过期”，禁用 Accept 并给出双语警告，保留 Reject 供显式清理；
- **审批门禁完整流转**：Ghost 提案的接受必须经过现有 Review 门禁（`local-user`、理由必填），接受后更新 accepted IR 并触发增量布局；拒绝后即刻消除 Ghost，保留候选于内存中以供审计。

### 步骤 5.4：增量布局稳定性预算与经验度量 (Step 5.4: Incremental Stability & Displacement Measurement)
- 提交哈希：`7120770`, `634c355`
- 验证增量布局稳定性预算：Greenfield 与 Medium Brownfield 场景中未受影响节点位移均为 0.0px（严格满足 `p95 <= 48px` 与 `max <= 144px` 预算）；
- 实测 6 组 Ghost 到正式节点的位移距离，量化局部启发式放置与全局分层布局之间的几何差距。

### 步骤 5.6：订正与补证据 (Step 5.6: Corrections & Evidence Completion)
- 提交哈希：`3f05c44`, `966fd4c`
- 退出结论更正为“有条件满足”，顶部建立待用户处理事项；
- 真实浏览器 Playwright E2E 证据收集：建立 `apps/web/e2e/ghost-stability-benchmarks.spec.ts`，在 dev 与 preview 双模式下实测 6 个 Add 场景，零重叠、零容器包含失败、100% ELK solver、未受影响节点位移全为 0.0px；
- 深入解答 Medium 夹具 (24, 153) 坐标归因与 DocGen (1812, 208) 候选顺序与回退条件；
- 全面完成范围与公开 API 审计 (`git diff --stat main..HEAD`)；
- 完成语义审计：单提案锁定与拒绝后内存保留语义澄清，补充 `review-gate.test.ts` 对应单元测试；
- 提交表规范化与按包测试统计。

### 步骤 5.7：Ghost 预测位置设计备忘录 (Step 5.7: Ghost Predictive Placement Memo, Read-only)
- 提交哈希：`338a489`, `df78264`
- 产出 [`docs/phase-5-ghost-placement-memo.md`](./phase-5-ghost-placement-memo.md)（只写文档，不实现任何产品代码）；
- 详尽评估方案 A、方案 B (Dry-run 预测布局)、方案 C (动画过渡) 的可行性、API 影响、D-010 边界与性能开销，给出推荐与决策草案。

### 步骤 5.8.0：订正证据与措辞 (Step 5.8.0: Evidence & Wording Corrections)
- 提交哈希：*(本步提交)*
- **备忘录订正**：`docs/phase-5-ghost-placement-memo.md` 中删除未经验证的具体延迟与准确率数字，替换为“待实现后验证”，并如实说明推导数据来源于 Node 单测路径而非浏览器运行时；
- **放置原因码细化**：重新定义并规范化放置原因码：
  - `near-anchor`：紧邻主锚点槽位（锚点距离 ≤ 300px）；
  - `far-anchor-fallback`：主槽位冲突后向外扩展列（如 Telemetry 锚点距离为 967.5px）；
  - `container-interior`：容器内部空位放置；
  - `container-exterior`：容器无空位置于外侧边界；
  - `global-fallback`：无锚点或全避碰后置于全局暂存区；
- **测试数量对齐与原始输出归档**：
  - 逐包执行 13 个 `packages/` + 2 个 `apps/`，全量原始输出保存至 [`logs/validation/p5-reconciliation/`](../logs/validation/p5-reconciliation/)；
  - 编制 [`logs/validation/p5-reconciliation/README.md`](../logs/validation/p5-reconciliation/README.md) 索引全部 17 份日志，澄清 Node bundle (7) 与源码文件 (9) 的统计口径，说明 Web 测试演进（117 单元 + 13 集成 + 74 浏览器）；
  - 核查 5 核心包零代码改动证据（`git diff --stat main..HEAD` 仅 30 行 `.gitignore`）；
- **全量 CI 门禁执行**：`CI=true TURBO_FORCE=true pnpm ci:verify`，原始输出保存至 `ci-verify.log`，记录各个 stage 耗时，总耗时约 150s，74 项浏览器测试（37 dev + 37 preview）全部一次性通过。

---

## 2. 为什么这么做 / Why

1. **退出结论必须实事求是**：由于 Ghost 预测位置存在方案选择、xjb_coding 导出待立项、人工评估待执行、阶段 4.5 未执行事项待裁定，以及度量阈值尚未获正式批准，退出结论必须如实定为“有条件满足”，杜绝过度声明。
2. **浏览器真实证据不可替代**：Node 环境单测 (`incremental-stability.test.ts`) 仅测试纯 V8 算法逻辑，无法替代浏览器环境中的 Web Worker 通信、Svelte Flow DOM 渲染、视口计算与真实 CSS 盒模型；必须通过 Playwright 在 dev 与 preview 模式下进行真实测量。
3. **严格遵守架构边界**：
   - `architecture-ir` 保持唯一事实来源，公开类型 0 改动；
   - `architecture-layout` 保持求解器中立，公开 API 0 改动，D-010 Worker 边界 0 改动；
   - 适配逻辑严格限制在 `apps/web` 层；
   - 坚决杜绝任何形式的 Agent 运行时、调度器或 Terminal 能力。

---

## 3. 验证结果 / Verification

### 真实浏览器实测证据表 (Playwright Browser Benchmarks, Dev & Preview)

由 `apps/web/e2e/ghost-stability-benchmarks.spec.ts` 产生的真实浏览器实测数据（分别在 `dev` 与 `preview` 模式下各执行一次，输出产物存放在 `logs/validation/p5-browser/`）：

#### Dev 模式运行结果 (`ghost-benchmarks-dev.json`)
| 夹具 (Fixture) | 组件 (Component) | 放置原因码 (Reason) | Ghost 位置 | 锚点距离 | 接受后位置 | 位移 (Displacement) | 接受前重叠数 | 接受后重叠数 | 容器包含失败 | Solver 来源 | 无关节点 p95 | 预算判定 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield (Points System) | AuditService | near-anchor | (512, 236) | 257.7px | (24, 236) | 488.0px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Greenfield (Points System) | PaymentGateway | near-anchor | (252, 236) | 257.7px | (24, 236) | 228.0px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Greenfield (Points System) | RedisCache | container-exterior | (801, 24) | 252.0px | (561, 248) | 328.3px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | Telemetry | far-anchor-fallback | (1764, 306) | 967.5px | (24, 153) | 1746.7px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | DocGen | near-anchor | (1812, 208) | 228.0px | (24, 153) | 1788.8px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | IsolatedMock | global-fallback | (1812, 35) | N/A | (24, 153) | 1791.9px | 0 | 0 | 0 | elk | 0.0px | PASS |

#### Preview 模式运行结果 (`ghost-benchmarks-preview.json`)
| 夹具 (Fixture) | 组件 (Component) | 放置原因码 (Reason) | Ghost 位置 | 锚点距离 | 接受后位置 | 位移 (Displacement) | 接受前重叠数 | 接受后重叠数 | 容器包含失败 | Solver 来源 | 无关节点 p95 | 预算判定 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greenfield (Points System) | AuditService | near-anchor | (512, 236) | 257.7px | (24, 236) | 488.0px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Greenfield (Points System) | PaymentGateway | near-anchor | (252, 236) | 257.7px | (24, 236) | 228.0px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Greenfield (Points System) | RedisCache | container-exterior | (801, 24) | 252.0px | (561, 248) | 328.3px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | Telemetry | far-anchor-fallback | (1764, 306) | 967.5px | (24, 153) | 1746.7px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | DocGen | near-anchor | (1812, 208) | 228.0px | (24, 153) | 1788.8px | 0 | 0 | 0 | elk | 0.0px | PASS |
| Coding-CAD (Medium Baseline) | IsolatedMock | global-fallback | (1812, 35) | N/A | (24, 153) | 1791.9px | 0 | 0 | 0 | elk | 0.0px | PASS |

- **断言达成情况**：
  1. **接受前 Ghost 与正式节点重叠数**：全部 6 个场景严格为 **0**；
  2. **接受后全部节点对等重叠数**：全部 6 个场景严格为 **0**；
  3. **接受后容器包含失败数**：全部 6 个场景严格为 **0**；
  4. **求解器来源 (Solver Source)**：100% 为 **`elk`**，0 次降级；
  5. **未受影响无关节点位移**：全部 6 个场景中 `unaffectedP95 = 0.0px`、`unaffectedMax = 0.0px`，100% 满足稳定性预算；
  6. **容器满置于外侧通知**：在 `RedisCache` 场景中，Ghost 节点带有 `[data-testid="ghost-notice"]`，明确提示 `所属容器 'group:infrastructure' 内部无可用空间，Ghost 放置于容器外侧`。

### Node 单测与真实浏览器测试的本质差别说明

| 维度 | Node 单测 (`incremental-stability.test.ts`) | 真实浏览器测试 (`ghost-stability-benchmarks.spec.ts`) |
| --- | --- | --- |
| **执行环境** | 纯 Node.js / V8 进程 (Vitest) | 真实无头 Chromium 浏览器 (Playwright) |
| **求解器加载方式** | 同步引入 Node 版本的 elkjs 打包文件 | 真实 Web Worker (`layout-worker.ts`) 跨线程 postMessage 通信 |
| **DOM 与样式** | 无 DOM，无 CSS，无 Svelte 组件实例化 | 完整 Svelte 5 编译产物、Svelte Flow 节点容器渲染、真实 CSS 盒模型 |
| **坐标测量基准** | 纯内存抽象 LayoutResult 坐标对象 | `.svelte-flow__node` 真实 CSS transform 矩阵解析与实际视口渲染 |
| **事件流与响应** | 函数式直接调用控制器方法 | 浏览器事件循环、响应式 Rune 状态追踪与 DOM 同步 |

---

### 问题深度解答与实测证据

#### 1. 为什么 Medium 夹具中 DocGen、Telemetry、ArtifactViewer 接受后最终坐标都是 (24, 153)？该位置是否与既有节点或容器重叠？
- **原因剖析**：
  1. 在单组件新增命令 (`{ type: "add-component", component }`) 提案中，新增节点尚未建立 incident edges（`connections: []`）；
  2. 在 `stability-pass.ts` 中，`localPositionFor` 函数检测该节点在连接图中无相邻正式锚点节点，因而返回 `undefined`；
  3. 增量布局安全回退至 ELK 的全新求解坐标 `fresh.nodes.find(...)`；
  4. 在 ELK 的分层排版（Layered "LR"）算法中，入度为 0 且出度为 0 的孤立节点必定被分派到 Layer 0（最左列，`x = padding = 24`）；
  5. 在 Medium 基准架构 (`CODING_CAD_EXPECTED_BASELINE`) 中，Layer 0 仅有 `web` 组件位于 `{ x: 24, y: 258, width: 180, height: 72 }`，其上方 `y: [24, 258]` 为完全空白区域；
  6. ELK 的垂直压实算法确定性地将孤立新节点排布在最左列上方的第一个合法紧凑槽位 `(24, 153)`；
  7. 由于三个场景均独立以相同的正式基线为底，新增的孤立组件均确定性地落在此槽位。
- **重叠核查证据**：
  - 在 `(24, 153)` 处，节点占据矩形范围为 `x: [24, 204]`, `y: [153, 225]`；
  - 同一列中最近的节点 `web` 起始于 `y = 258`，存在 **33px** 的垂直间隙；
  - 架构中所有其他组件均位于 Layer 1 及之后（`x >= 284`），存在 **80px** 以上的水平间隙；
  - 该基准中无容器节点（全为平铺组件）；
  - **结论：经严格几何核算，该位置与既有任何节点及容器零重叠（0 Overlaps）。**

#### 2. DocGen 的 Ghost 初始坐标为 (1812, 208)，为什么不紧邻关联节点？放置算法候选顺序与回退条件是什么？
- **事实澄清**：
  - DocGen **确实紧邻其关联节点**！在测试中 DocGen 关联的正式节点为 `architecture-ir`；
  - 在 Medium 基准架构中，`architecture-ir` 被仓库中几乎所有包依赖（入度最大、出度为 0），因此在 ELK 的 LR 层次布局中被置于最右侧顶层，其绝对坐标为 `{ x: 1584, y: 208, width: 180, height: 72 }`；
  - `calculateGhostPlacement` 将 `architecture-ir` 作为锚点，探测其右侧候选槽位 1：`rightX = 1584 + 180 + 24 * 2 = 1812`，`y = 208`；
  - 槽位 1 在几何碰撞检测中通过（与所有正式节点零重叠），因此 Ghost 直接放置于 `(1812, 208)`；
  - **DocGen 的横坐标之所以很大，完全是因为其关联锚点本身就在最右侧 (x=1584)。**
- **放置算法候选顺序与回退条件 (`calculateGhostPlacement`)**：
  1. **容器内部槽位探测 (Inside Container Slot)**：若声明了 `targetContainerId`，先在容器内部网格探测未占用空间 (`findInsideContainerSlot`)；
  2. **容器外侧紧邻槽位探测 (Container Exterior Slot)**：若容器内部无空间，探测容器右侧外边界 `(container.x + container.width + 48, container.y)`；若无重叠，返回该位置并附带 `placedOutsideContainer: true` 与文字 Notice；
  3. **关联节点锚点槽位探测 (`generateAnchorSlots`)**：若存在关联节点，按优先级探测：
     - 槽位 1：正右侧 `(anchor.x + anchor.width + 48, anchor.y)`；
     - 槽位 2：右下方 `(anchor.x + anchor.width + 48, anchor.y + anchor.height + 48)`；
     - 槽位 3：右上方 `(anchor.x + anchor.width + 48, anchor.y - ghostHeight - 48)`；
     - 槽位 4：正下方 `(anchor.x, anchor.y + anchor.height + 48)`；
     - 槽位 5：正上方 `(anchor.x, anchor.y - ghostHeight - 48)`；
     - 槽位 6：正左侧 `(anchor.x - ghostWidth - 48, anchor.y)`；
     - 槽位 7~21：向外扩展列（col 1~5）；
  4. **全局暂存回退区 (Global Staging Fallback Area)**：若无关联锚点或所有锚点槽位均发生几何碰撞，计算全图 bounding box `[minX, minY, maxX, maxY]`，在全图右侧外边界自上而下逐行探测 50 个合法槽位；
  5. **绝对兜底保障 (Mathematical Guarantee Fallback)**：`position: { x: maxX + 96, y: minY }`。

---

### 范围与公开 API 审计核对 (`git diff --stat main..HEAD`)

针对核心包执行 `git diff --stat main..HEAD` 结果如下：

```text
 packages/agent-adapter/.gitignore       | 6 ++++++
 packages/architecture-ir/.gitignore     | 6 ++++++
 packages/architecture-layout/.gitignore | 6 ++++++
 packages/architecture-review/.gitignore | 6 ++++++
 packages/execution-blueprint/.gitignore | 6 ++++++
 5 files changed, 30 insertions(+)
```

- **逐文件逐包审计说明**：
  - `packages/architecture-ir`: 仅修改 `.gitignore`，公开类型、接口与数据模型 0 改动；
  - `packages/architecture-layout`: 仅修改 `.gitignore`，公开 API、`LayoutResult`、D-010 Worker 边界 0 改动，求解器完全未动；
  - `packages/architecture-review`: 仅修改 `.gitignore`，审核状态机与决策接口 0 改动；
  - `packages/execution-blueprint`: 仅修改 `.gitignore`，蓝图模型与生成接口 0 改动；
  - `packages/agent-adapter`: 仅修改 `.gitignore`，渲染适配接口 0 改动；
- **关于 `ghost-layout.test.ts`**：
  - 该测试文件位于 `packages/architecture-layout/src/ghost/ghost-layout.test.ts`；
  - 由历史提交 `ee3a48f`（Phase 2 Checkpoint 3 增量与 Ghost 协议提交）引入，**早已存在于 `main` 分支**，绝非本分支新增。

---

### 语义核对审计

1. **“单提案锁定下阻断新增编辑”属性归属**：
   - 在 `main` 分支基线代码中，`WorkspaceShellController.executeCommand` 已存在：
     ```ts
     if (this.shell.proposal?.status === "draft" || this.shell.proposal?.status === "in-review") {
       this.shell = { ...this.shell, status: "error", message: "Review the pending candidate before editing." };
       return;
     }
     ```
   - 因此，“单提案未决期间阻止新增编辑”为**现有既有行为**；
   - 本分支在步骤 5.3 中增加的是：正式架构外部演变后将未决提案标记为“已过期 (Stale)”，并在过期状态下提供专用提示信息阻断 Accept。此部分已在步骤 5.3 获得用户决策确认。
2. **拒绝后“保留候选于内存中”的确切语义**：
   - **语义界定**：拒绝后，`this.shell.candidate` 依然保存在控制器内存对象中（用于审查历史追溯、调试与审计日志）；
   - **Ghost 是否复现**：Ghost **绝对不复现**。由于 `proposal.status === "rejected"`，`toSvelteFlowProjection` 判定其非未决状态，完全不生成任何 Ghost 节点与编辑标记；
   - **能否再次接受**：**绝对不可再次接受**。若用户调用 `acceptCandidate`，控制器判定 `proposal.status === "rejected"` 并直接返回，正式架构不受任何影响；
   - **锁释放与新编辑**：工作区编辑锁已完全释放，用户可以发起新的编辑命令或需求生成；发起新命令后，旧候选被新命令候选覆盖；
   - **自动化测试证据**：在 `review-gate.test.ts` 中已补充专用单元测试并 100% 通过验证。

---

### 工作区测试分类统计表 (Package Test Breakdown)

全工作区测试按包明细统计（全数通过，0 失败）：

| 代码包 / 应用 (Package / App) | 测试文件数 (Files) | 测试用例数 (Tests) | 验证状态 (Status) |
| --- | --- | --- | --- |
| `@coding-cad/web` (单元测试) | 18 | 116 | **全部通过 (100% Passed)** |
| `@coding-cad/web` (集成测试) | 4 | 13 | **全部通过 (100% Passed)** |
| `@coding-cad/web` (浏览器 E2E) | 8 | 36 (dev) / 36 (preview) | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-ir` | 1 | 14 | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-layout` | 9 | 36 | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-review` | 3 | 12 | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-validator` | 4 | 16 | **全部通过 (100% Passed)** |
| `@coding-cad/component-registry` | 2 | 8 | **全部通过 (100% Passed)** |
| `@coding-cad/execution-blueprint` | 2 | 8 | **全部通过 (100% Passed)** |
| `@coding-cad/agent-adapter` | 2 | 7 | **全部通过 (100% Passed)** |
| `@coding-cad/implementation-analyzer` | 5 | 20 | **全部通过 (100% Passed)** |
| `@coding-cad/implementation-validator` | 3 | 10 | **全部通过 (100% Passed)** |
| `@coding-cad/workspace` | 3 | 12 | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-agent` | 2 | 6 | **全部通过 (100% Passed)** |
| `@coding-cad/architecture-dsl` | 3 | 10 | **全部通过 (100% Passed)** |
| `@coding-cad/cli` | 2 | 6 | **全部通过 (100% Passed)** |
| `apps/server` | 2 | 6 | **全部通过 (100% Passed)** |

---

## 4. 提交历史与逆序回退分析 / Commits & Rollback Crosswalk

### 提交记录表

| 步骤 / Step | 提交哈希 / Commit | 提交信息 / Message | 回退命令 / Revert Command | 连带影响 / Cascade Impact |
| --- | --- | --- | --- | --- |
| 范围外附带改动 | `7400cd4` | `chore(git): perfect gitignore rules across workspace packages and apps` | `git revert 7400cd4` | 回退工作区 `.gitignore`，可能导致本地构建产生未跟踪文件 |
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
| 5.5 | `d529390` | `docs(phase-5): add phase 5 exit report and update execution plan` | `git revert d529390` | 回退阶段 5 初始退出报告 |
| 5.5 (PR) | `71e76d0` | `docs(pr): update PR draft with Step 5.5 commit hash and final rollback crosswalk` | `git revert 71e76d0` | 同步回退 PR 草稿中步骤 5.5 提交哈希 |
| 5.6 | `3f05c44` | `test(e2e): add real browser benchmarks for ghost placement and correct exit status` | `git revert 3f05c44` | 移除浏览器 E2E benchmark 测试与订正报告 |
| 5.6 (PR) | `966fd4c` | `docs(pr): update PR draft with Step 5.6 commit hash and rollback crosswalk` | `git revert 966fd4c` | 同步回退 PR 草稿中步骤 5.6 提交哈希 |
| 5.7 | `338a489` | `docs(phase-5): add ghost predictive placement design memo evaluating options A, B, and C` | `git revert 338a489` | 移除 Ghost 预测位置设计备忘录 |
| 5.7 (PR) | `df78264` | `docs(pr): update PR draft with Step 5.7 commit hash and rollback crosswalk` | `git revert df78264` | 同步回退 PR 草稿中步骤 5.7 提交哈希 |
| 5.8.0 | *(本步提交)* | `docs(phase-5): reconcile test evidence, refine reason codes, and correct placement memo` | `git revert <hash>` | 回退 5.8.0 证据对齐、原因码细化与备忘录订正 |

### 逆序回退分析 (Cascading Rollback Analysis)

若需回退本阶段提交，请严格按照逆序操作：
1. **回退 5.8.0** (`git revert <5.8.0-hash>`)：移除证据对齐、原因码细化与备忘录订正，恢复 5.7 状态；
2. **回退 5.7** (`git revert df78264` -> `git revert 338a489`)：安全移除 Ghost 预测位置设计备忘录；
3. **回退 5.6** (`git revert 966fd4c` -> `git revert 3f05c44`)：移除浏览器 E2E benchmark 测试套件与订正报告；
4. **回退 5.5** (`git revert 71e76d0` -> `git revert d529390`)：移除阶段 5 退出报告及执行计划更新；
5. **回退 5.4** (`git revert 634c355` -> `git revert 7120770`)：安全移除增量布局稳定性指标测试与位移度量套件，不影响正式架构与 Ghost 交互；
6. **回退 5.3** (`git revert b94e0fb` -> `git revert 9971e4d`)：移除过期提案检测、单提案严格阻断与 Review 接入硬化，恢复步骤 5.2 的基本 Ghost 投影；
7. **回退 5.2** (`git revert baba8c0` -> `git revert cb8be8e`)：安全移除 Ghost 投影、局部放置纯函数与待删除/待变更视觉标记，不影响正式架构与 Review 状态机；
8. **回退 5.1.1** (`git revert f6ea675`)：恢复 5.1 初始快照实现与测试；
9. **回退 5.1** (`git revert 3f8d76a` -> `git revert 2797f9c`)：安全移除 Handoff 模态框、对焦控制与导出的全部功能代码及测试，不会损坏底层已有的 Greenfield/Brownfield/Review 核心逻辑；
10. **回退 5.0** (`git revert 77e446a`)：若在 5.1 未回退时强行回退 5.0，会导致 PR 草稿和设计备忘录丢失；
11. **回退范围外附带改动** (`git revert 7400cd4`)：若在后续步骤未回退时单独回退，会导致 `.svelte-kit/`、`.turbo/` 等产生未跟踪文件污染工作区，但不影响业务代码运行。
