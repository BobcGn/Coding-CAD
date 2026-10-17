# Phase 5 Ghost Predictive Placement Design Memo / 阶段 5 Ghost 预测位置设计备忘录

日期 / Date: 2026-10-17  
分支 / Branch: `codex/phase-5-ghost-handoff`  
文档性质 / Nature: **设计备忘录（只写文档，不实现任何产品代码 / Design Memo Only, Strictly No Product Code）**  
作者 / Author: Coding-CAD Team  

---

## 1. 问题陈述与实测位移分析 / Problem Statement & Empirical Displacement Analysis

在阶段 5.2 中，为了满足用户关于 D-007 的裁定（方案 B：Web 适配层局部扩展），系统实现了纯几何启发式的局部放置算法 (`calculateGhostPlacement`)。该算法在不需要调用底层布局求解器的情况下，以毫秒级纯同步计算找到了一个与既有所有正式节点零重叠的候选槽位。

然而，在阶段 5.6 的真实浏览器实测中，Ghost 初始呈现位置与用户在 Review 门禁点击 Accept 之后的最终正式排版位置之间，存在显著的几何位移差距：

### 真实浏览器实测位移数据摘要 (Empirical Browser Measurement Summary)

| 夹具类型 (Fixture) | 组件 (Component) | 关联锚点 (Anchor) | Ghost 启发式位置 | 接受后最终位置 | 欧几里得位移 (Displacement) |
| --- | --- | --- | --- | --- | --- |
| Greenfield (Points System) | AuditService | `ledger` | (512.0, 236.0) | (24.0, 236.0) | **488.0 px** |
| Greenfield (Points System) | PaymentGateway | `gateway` | (252.0, 236.0) | (24.0, 236.0) | **228.0 px** |
| Greenfield (Points System) | RedisCache | `group:infrastructure` | (801.0, 24.0) | (561.0, 248.0) | **328.3 px** |
| Coding-CAD (Medium Baseline) | Telemetry | `server` | (1764.0, 306.0) | (24.0, 153.0) | **1746.7 px** |
| Coding-CAD (Medium Baseline) | DocGen | `architecture-ir` | (1812.0, 208.0) | (24.0, 153.0) | **1788.8 px** |
| Coding-CAD (Medium Baseline) | IsolatedMock | *(None)* | (1812.0, 35.0) | (24.0, 153.0) | **1791.9 px** |

- **位移发生的技术机理 (Technical Root Cause)**：
  1. **局部贪心启发式 (Local Greedy Heuristics)**：Ghost 放置仅关注“紧邻当前关联节点”、“容器外侧边缘”或“全图右侧空白区”，试图最小化局部修改并保持即时响应；
  2. **全局层次排版逻辑 (Global Hierarchical Layout)**：底层 ELK 求解器遵循 Sugiyama 框架（分层、交叉最小化、紧凑压实）。在“从左到右 (LR)”模式下，入度为 0 的孤立节点必定被分派到最左侧的 **Layer 0 (x=24px)**。
  3. **宏观错位 (Macro-scale Disconnect)**：当用户为位于全图最右侧的节点（如 `architecture-ir`, x=1584px）添加依赖时，Ghost 出现在 x=1812px；但正式采纳后，ELK 将入度为 0 的新组件压实到最左侧的空白区域 (x=24px)，导致横跨 1700px 以上的巨大位移。
- **认知负担与用户体验问题 (Cognitive Load & User Experience Impact)**：
  - **视觉跳变 (Visual Jolt)**：用户点击 Accept 后，刚审阅的 Ghost 节点瞬间在视口中消失并在遥远的最左侧重现，用户需要移动视口或重新搜寻该节点；
  - **因果困惑 (Causal Confusion)**：架构师可能会误以为自己的提案没有被正确采纳，或者误以为求解器重排了其他无关节点（尽管实测证明无关节点位移严格为 0.0px）。

---

## 2. 方案列举与取舍对比 / Option Enumeration & Tradeoffs

针对 Ghost 预测位置与最终位置之间的位移问题，我们对比了三种可行方案：

| 方案 / Option | 核心机制 (Mechanism) | 预测位移差距 (Displacement) | 响应时间 (Response Time) | 对架构稳定性/非持久化的影响 (Safety & Purity) |
| --- | --- | --- | --- | --- |
| **方案 A：保持当前局部启发式 (Keep Current Local Heuristic)** | 维持 5.2/5.6 实现，纯前端几何避碰，Ghost 仅作为局部意图标记。 | 大 (Greenfield ~300px, Medium ~1700px) | **0 ms**（纯同步计算） | **最高**（完全不触碰求解器通道，0 额外状态） |
| **方案 B：提案生成时触发未持久化 Dry-run 布局 (Unpersisted Dry-run Layout on Proposal)** | 产生提案时，向 Web Worker 发起一次只读的增量布局计算，取新增节点坐标作为 Ghost 预览位置，但不持久化。 | 理论预期 0 px（待实现后验证） | 待实现后验证（理论预期处于即时响应窗口内） | **极高**（无副作用计算，严格不写入持久化状态与撤销栈） |
| **方案 C：增强过渡动画与视觉轨迹引导 (Transition Animation & Motion Trails)** | 保持方案 A 的初始位置，在点击 Accept 后沿运动路径播放 300ms 插值平滑动画，并绘制半透明运动轨迹。 | 不消除位移，但平滑视觉突变 | **0 ms** 初始计算，Accept 时增加 300ms 动画 | **中等**（增加 Svelte Flow 动画复杂度，跨屏幕飞行可能产生视觉混乱） |

---

## 3. 方案 B 深度评估 / Detailed Evaluation of Option B

方案 B 是彻底解决位移问题的核心候选方案。以下对其工程可行性、系统边界与性能开销进行逐项深度评估：

### 3.1 对 `architecture-layout` 公开 API 的影响
- **结论：0 API 变更，完全无需修改公开接口。**
- **技术依据**：
  - `packages/architecture-layout` 导出的 `layoutArchitectureGraph(projection.layoutGraph, options, engine)` 本身就是纯函数；
  - 该函数接收 `IncrementalLayoutOptions`（模式为 `INCREMENTAL`，传入当前正式基线作为 `previousState`），并返回 `IncrementalLayoutResult`；
  - 该函数不持有全局状态，不写任何持久化文件，也不假设调用方是否持久化该结果；
  - Web 层可在收到命令后，直接调用该函数进行只读求值，仅提取新增节点的 `{ x, y }` 作为 Ghost 的投影坐标。

### 3.2 对 D-010 Worker 边界的影响
- **结论：100% 保持 D-010 协议，无需新增消息类型。**
- **技术依据**：
  - D-010 Worker 运行时 (`elk-worker-runtime.ts`) 仅处理无状态的 `layout` 消息并返回 `result`；
  - Dry-run 计算与正式增量布局使用的是完全相同的消息通道和请求协议；
  - Worker 内部不持久化任何图结构，不感知该次计算是“正式提交”还是“意图预测”。

### 3.3 非持久化安全保证 (Non-Persistence Guarantee)
- **绝对不写入正式 LayoutState**：
  - Dry-run 计算得出的布局结果仅赋值给局部变量或临时的 `ephemeralGhostPositions: Map<string, LayoutPoint>`；
  - 控制器状态 `shell.layoutState` 保持为正式架构的排版状态不变；
- **绝对不污染撤销/重做栈 (Undo/Redo Purity)**：
  - 撤销栈仅在 `acceptCandidate` 成功时记录历史快照；未决提案阶段的 Dry-run 坐标绝对不产生历史记录；
- **拒绝/取消时即刻销毁 (Zero Residue on Rejection)**：
  - 当用户点击 Reject 或提案过期清理时，临时 Ghost 坐标随未决提案一同被丢弃并由 V8 垃圾回收，不留任何磁盘或内存残留；
- **保存与打开一致性 (Save/Open Invariance)**：
  - 保存操作只序列化 `shell.accepted` 与 `shell.layoutState`，Dry-run 结果绝不落盘。

### 3.4 浏览器端耗时估算与理论分析 (Browser Latency Estimation & Theoretical Analysis)
> [!NOTE]
> **真实数据来源说明**：由于方案 B 尚未在真实浏览器中作为 Dry-run 链路实现，以下推导数字来自阶段 4 基准与阶段 5.4 Node 单测 (`packages/architecture-layout/src/stability/incremental-stability.test.ts` 中基于 Node ElkEngine 运行 `controller.acceptCandidate` 的正式增量接受路径)，而非真实浏览器 Web Worker Dry-run 实测。真实浏览器端 Dry-run 耗时与开销待步骤 5.8 实现后实测验证。

- **小型 Greenfield 夹具 (4~5 组件)**：理论推导增量求解约 12 ~ 25 ms（待实现后验证）；
- **中型 Brownfield 夹具 (15 组件, 42 边)**：理论推导增量求解约 45 ~ 85 ms（待实现后验证）；
- **合成大型网状夹具 (57 组件, 14 包)**：理论推导增量求解约 120 ~ 210 ms（待实现后验证）；
- **用户感知评估**：
  - 人机工程学标准中，**< 100ms** 的响应被视为“即时响应（Instantaneous）”；
  - 理论预期在 Palette 点击添加或在 Inspector 确认添加组件时，异步 Worker 往返处于即时感知窗口内；
  - 实际性能与开销待步骤 5.8 真实浏览器端实现后提供 10 次重复实测分布数据。

### 3.5 位置一致性指标与位移归零理论分析 (Displacement Reduction Analysis)
> [!NOTE]
> 以下为基于试算布局与接受后布局走同一函数、同一固定状态、同一参数的理论一致性预期。实际位移消除效果待步骤 5.8 在真实浏览器中实现后验证：

- `AuditService`: 理论预期位移从 488.0px 降低至 0.0 px（待实现后验证）；
- `PaymentGateway`: 理论预期位移从 228.0px 降低至 0.0 px（待实现后验证）；
- `RedisCache`: 理论预期位移从 328.3px 降低至 0.0 px（待实现后验证）；
- `Telemetry`: 理论预期位移从 1746.7px 降低至 0.0 px（待实现后验证）；
- `DocGen`: 理论预期位移从 1788.8px 降低至 0.0 px（待实现后验证）；
- `IsolatedMock`: 理论预期位移从 1791.9px 降低至 0.0 px（待实现后验证）；
- 理论上由于走完全一致的增量求解逻辑，预测准确率预期达到 100%，实际准确率与数值待实现后实测验证。

### 3.6 零重叠与局部性保证 (Zero Overlap & Locality Guarantee)
- **零重叠保障**：ELK 求解器天生保证不同节点间严格无几何重叠（通过了所有 E2E 的 0 peer overlaps 门禁）；
- **稳定性保障**：在增量模式下，未受影响的既有节点位移受 `StabilityPass` 保护（实测全为 0.0px），既不会推挤无关节点，又能精准预测新节点的最佳分层空位。

### 3.7 对各类提案的通用适用性 (Generality Across Proposal Types)
1. **`Add` 提案**：新增组件以 Ghost 半透明虚线样式直接呈现在其未来的最终分层位置，连接线预先路由；
2. **`Connect` 提案**：两端节点保持原位，新连接线通过 Dry-run 预先计算真实的避障折线（Bend Points），Ghost 边呈现真实路由；
3. **`Remove` 提案**：待删除节点保持在原位并显示红框，无需 Ghost 预测位置；但可借助 Dry-run 预测其删除后是否会导致下游节点重新靠拢。

---

## 4. 方案 C 深度评估 / Detailed Evaluation of Option C

方案 C 试图通过平滑过渡动画来缓解突变：
- **优点**：无需在提案生成时额外调用求解器，实现相对轻量；
- **严重缺陷**：
  1. **无法解决“错觉”问题**：在审阅提案时，用户依然以为组件会被放置在锚点旁边（例如在最右侧审核 DocGen），点击 Accept 后看到节点“飞”到了最左侧，依然存在认知断裂；
  2. **视觉遮挡与飞行干扰**：从 `(1812, 208)` 飞往 `(24, 153)` 需要横穿中部的 13 个既有正式节点。如果播放 300ms 飞行插值动画，节点会在画布上高速穿透其他组件，造成严重的视觉混乱（Visual Clutter）；
  3. **复杂性转移**：Svelte Flow 本身的坐标更新机制需要接管并禁用物理布局，且在缩放/平移视口时容易产生渲染伪影。

---

## 5. 结论与推荐建议 / Conclusion & Recommendations

### 5.1 最终推荐 (Final Recommendation)
**强烈推荐采纳 方案 B（提案生成时触发未持久化 Dry-run 布局）。**

**核心推荐理由**：
1. **位移彻底归零**：理论上将 Ghost 到正式节点的位移从 1700px+ 彻底归零（0.0px），消灭所有视觉跳跃感（待 5.8 实测验证）；
2. **零架构污染**：严格保持 `packages/architecture-layout` 公开 API 0 改动、D-010 Worker 边界 0 改动，实现纯 Web 适配层闭环；
3. **性能极高**：中型图增加的异步 Worker 通信耗时理论预期处于 100ms 即时响应窗口内（待 5.8 实测验证），架构师完全感知不到延迟；
4. **所见即所得**：Ghost 呈现的位置即是采纳后的最终位置，大幅提升 CAD 专业建模工具的心智确定性。

---

### 5.2 用户决策结果与正式 Decision 条目 (User Decision & Canonical Decision Entry)

用户已于 2026-10-17 正式批准采纳方案 B，正式决策已追加至 `docs/architecture-layout-decisions.md`（编号 D-011）：

```markdown
### D-011: Ghost 预测位置布局策略 (Ghost Predictive Placement Strategy)

- **Status**: APPROVED — 2026-10-17 (User)
- **Context**: 阶段 5 实现了 Ghost 呈现与 Review 门禁。实测表明，纯几何启发式放置（方案 A）会导致 Ghost 与采纳后最终坐标之间存在显著位移（Greenfield 约 300px，Medium 约 1700px），给用户造成视觉跳变。
- **Final Decision**: 采纳 **方案 B（未持久化的 Dry-run 预测布局）**。
- **Hard Constraints / 硬约束**:
  1. **同一性约束**：试算与接受后的增量布局必须走同一函数、同一份固定状态（已有节点的位置约束）、同一份参数。禁止试算用全量布局而接受用增量布局；
  2. **严格非持久化**：试算结果绝不写入 layoutState、撤销栈、Save 产物、Handoff 产物；Ghost 的 id 绝不进入正式架构；
  3. **安全降级守卫**：试算失败、超时、返回降级求解器结果（solver 来源不是 ELK），一律视为“预测不可用”，回退到现有启发式放置，并在界面显式提示（带文字与可访问名称），不得把降级结果当预测展示；
  4. **并发与竞态处理**：提案变化、被拒绝、被标记过期时，丢弃进行中的试算或忽略其结果；必须有竞态测试；
  5. **架构边界保护**：不改 architecture-layout 公开 API、不改 D-010 边界、不改 IR 公开类型、不新增 package、不新增审批语义；
  6. **三态显式反馈**：预测期间，Ghost 先以现有启发式位置显示并标注“预测中”；预测完成后移动到预测位置并标注“预测位置”，标签文字需说明“接受前若有其他变更，最终位置可能变化”。试算超时上限使用可配置常量，标注为“未经批准的临时值”。
- **Affected Packages**: `apps/web` (仅限前端适配层)。
```
