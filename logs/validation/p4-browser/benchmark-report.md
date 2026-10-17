# Brownfield Real Browser & Repository Layout Benchmarks / Brownfield 真实浏览器与代码库布局全量实测报告

生成时间 / Generated at: 2026-10-17T06:05:00.000Z  
硬件测试环境 / Hardware Environment: Apple M5 (10 cores), 34.36 GB RAM, macOS Darwin 27.2.0, Node.js v24.16.0, Chromium 155.0.8059.80  

---

## 1. 做了什么 / What

在真实 Chromium 浏览器环境（Playwright E2E 驱动）与 Node.js 生产分析环境中，分别在 Vite `dev` 模式与生产 `preview` 模式下，针对本代码仓库（`Coding-CAD`）、大规模合成流水线夹具（`synthetic-large-repo`）、复杂拓扑合成夹具（`synthetic-hub-repo`）以及真实本地开源 TypeScript 仓库（`skill-central`），对产品流水线物理指标执行了**每模式每夹具各 10 次重复测量（共 80 次独立真实浏览器运行）**，统计并报告服务端反演耗时与首屏渲染耗时的最小值、中位数、最大值与 p95 分布。

Evaluated full end-to-end Brownfield pipeline metrics across a real Chromium browser (via Playwright in `dev` and `preview` modes) for four codebases: `Coding-CAD` (this repo), `synthetic-large-repo` (120 modules), `synthetic-hub-repo` (57 modules), and `skill-central` (real local TypeScript repo). Conducted **10 repeated measurements per fixture per mode (80 browser runs total)** to report Min, Median, Max, and p95 distributions for both server reverse engineering duration and first-screen render time.

### 度量口径严格定义 / Metric Scope Definitions
1. **服务端反演耗时 (Server Reverse Engineering Duration / `serverDurationMs`)**:
   包含从服务端路由接收 `/api/workspace/analyze-repository` HTTP POST 请求、执行 realpath 真实路径规范化与目录越界校验、遍历工作区收集文件清单、读取源码并调用 TypeScript Compiler API 解析 AST imports/exports、执行 L1-L4 分层推断与跨包 L2 交叉校验，直至生成 `ArchitectureProject` DTO 并完成 JSON 序列化返回客户端的纯服务端总耗时。
2. **首屏渲染耗时 (First-screen Render Duration / `firstScreenRenderMs`)**:
   包含用户在浏览器界面点击“开始分析”按钮、发起网络请求、服务端反演计算并返回 DTO、前端 Svelte 响应式状态更新、向 Web Worker 提交布局任务、Worker 中 ELK.js 计算节点与边路由坐标完成、主线程接收布局结果并经 Svelte Flow 适配器转换为 Canvas DOM 节点，直至画布触发 `data-layout-status="success"` 并呈现首屏节点的全链路完整耗时（端到端首屏可见时间）。

---

## 2. 10 次重复测量实测数据分布表 / 10-Iteration Repeated Measurements Table

以下各指标均为 10 次独立测量分布统计（单位：毫秒 ms）：

| 目标代码库 / 夹具 | 性质 / Nature | 模式 / Mode | 节点数 (组件/容器) | 边数量 / Edges | 求解器 | 服务端反演耗时 (ms) [Min / Median / Max / p95] | 首屏渲染耗时 (ms) [Min / Median / Max / p95] | 边交叉数 (展开 / 折叠) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Coding-CAD** | 真实自身 Monorepo | `dev` | 30 (15 c / 15 g) | 40 / 40 | **elk** (100%) | 215.89 / 223.46 / 352.34 / **352.34** | 391.92 / 401.11 / 556.40 / **556.40** | 21 / 9 (折叠降幅 57.1%) |
| **Coding-CAD** | 真实自身 Monorepo | `preview` | 30 (15 c / 15 g) | 40 / 40 | **elk** (100%) | 233.13 / 238.93 / 522.57 / **522.57** | 410.73 / 417.42 / 834.86 / **834.86** | 21 / 9 (折叠降幅 57.1%) |
| **synthetic-large-repo** | 合成线性流水线 (120模块) | `dev` | 150 (120 c / 30 g) | 147 / 147 | **elk** (100%) | 80.32 / 85.35 / 108.56 / **108.56** | 274.90 / 287.35 / 373.37 / **373.37** | 1 / 0 (折叠 120 个组件) |
| **synthetic-large-repo** | 合成线性流水线 (120模块) | `preview` | 150 (120 c / 30 g) | 147 / 147 | **elk** (100%) | 86.96 / 91.97 / 191.49 / **191.49** | 278.53 / 292.65 / 377.81 / **377.81** | 1 / 0 (折叠 120 个组件) |
| **synthetic-hub-repo** | 合成中心复杂网状 (57模块) | `dev` | 71 (57 c / 14 g) | 83 / 83 | **elk** (100%) | 57.65 / 60.10 / 78.40 / **78.40** | 231.50 / 238.80 / 265.40 / **265.40** | **86** / **34** (折叠降幅 **60.5%**) |
| **synthetic-hub-repo** | 合成中心复杂网状 (57模块) | `preview` | 71 (57 c / 14 g) | 83 / 83 | **elk** (100%) | 57.35 / 61.20 / 80.15 / **80.15** | 235.58 / 240.23 / 259.69 / **259.69** | **86** / **34** (折叠降幅 **60.5%**) |
| **skill-central** | 真实开源单体 (290文件) | `dev` | 23 (23 c / 单体) | 77 / 77 | **elk** (100%) | 155.20 / 163.50 / 205.10 / **205.10** | 340.20 / 395.50 / 495.20 / **495.20** | 152 / N/A (单体无容器) |
| **skill-central** | 真实开源单体 (290文件) | `preview` | 23 (23 c / 单体) | 77 / 77 | **elk** (100%) | 159.32 / 163.90 / 199.35 / **199.35** | 346.11 / 401.26 / 480.16 / **480.16** | 152 / N/A (单体无容器) |

> **几何与求解器不变量**：在所有 80 次测量中，**重叠数（Peer Overlaps）恒为 0**，**包含失败（Containment Failures）恒为 0**，**求解器来源 100% 为 ELK（零 fallback）**。

---

## 3. 为什么这么做 / Why & 统计学客观分析

### 3.1 历史测量数据差异（329/336 ms vs 296/406 ms）分布学解释
- **现象**：上一轮 120 模块夹具首屏渲染单次记录为 329 ms (dev) / 336 ms (preview)，本轮前期单次记录为 406.22 ms (dev) / 296.22 ms (preview)。
- **分布学解释**：通过 10 次重复测量可见：
  - 在 `preview` 模式下，10 次渲染耗时样本分别为：`[278.53, 279.47, 286.17, 287.58, 290.61, 294.69, 309.71, 371.93, 373.50, 377.81]` ms，中位数为 **292.65 ms**。单次测得的 296 ms 与 336 ms 均完全落在该样本分布的正常波动区间内（处于第 40 至 70 百分位）；
  - 在 `dev` 模式下，受 Vite 开发时未打包模块动态解析与 JIT 预编译影响，首屏（冷启动）与偶发垃圾回收会带来约 100ms 的长尾毛刺（最大达 373~406 ms），稳态中位数保持在 **287.35 ms**。
  - **结论**：单次实测数值受操作系统线程调度与冷启动影响存在正常方差，10 次重复测量的稳态中位数（~290 ms）真实反映了系统的实际性能水平。

### 3.2 拓扑成因澄清：避免将线性流水线误报为通用表现
- `synthetic-large-repo` 之所以 147 条边仅产生 1 处交叉，是因为其拓扑为平行的线性调用链（`pkg-N -> pkg-(N-1)`）；
- 为此，专门构造了 `synthetic-hub-repo` 复杂拓扑（中心 Hub 入度 13、环依赖、跨层越级调用），如实测出完全展开时存在 **86 处连线交叉**；
- 当应用大图容器折叠后，交叉数由 86 处降为 34 处（**降幅达 60.5%**），首屏可见节点数降低 80.3%，实证了渐进披露容器折叠在大图场景下的认知减负效果。

### 3.3 真实代码库 `skill-central` 抽样核对统计表述修正
- **抽样方式**：由 AI 辅助执行、固定随机种子（Seed: 42）、单仓库（`skill-central`）、各项指标独立抽取 30 条样本；**严禁表述为“盲测”**。
- **精确率（Precision）**：抽查 30 条检测到的依赖边，全部与源码中的跨模块调用相符（30/30，100.0%）。
  - **95% 置信区间 (Wilson score interval)**: **[88.65%, 100.00%]**（Clopper-Pearson 确切区间为 [88.43%, 100.00%]）。
- **召回率（Recall）**：抽取 `src/` 下 30 处真实代码 `import` 语句，22 处正确匹配依赖边，8 处未提取（22/30，73.33%）。
  - **95% 置信区间 (Wilson score interval)**: **[55.55%, 85.82%]**。
- **统计有效性注明**：
  由于样本量较小（$N=30$），置信区间较宽，以上数字**仅作为初步工程观察，不构成统计学完备的准确性证明**；后续重测时**严禁使用同一个种子（Seed: 42）在修复后重测来证明改进**，必须采用全新随机种子并扩大样本量。
- **漏检量化归因**：
  未提取的 8 处代码导入（占抽样总数 26.7%，占未提取总数 100%）全部发生在 `src/index.ts`、`src/mcp.ts` 与 `src/app-metadata.ts` 根级单文件中。由于单体工程的 L4 聚类仅对 `src/<subdir>` 二级目录推断模块，根级单文件未归组，导致跨模块调用被过滤。

---

## 4. 验证结果 / Verification & 待用户批准提议阈值

### 4.1 阈值表口径与说明（无重复测量支撑的 p95 均已删除）

| 评估指标 / Metric | 测量对象 / Target | 实测数值 (中位数 / p95) | 提议阈值（待用户批准） | 设定依据与提议性质（是否实测倒推） |
| --- | --- | --- | --- | --- |
| **首屏渲染耗时** | `Coding-CAD` (15 components) | 417.42 ms (preview 中位数) / 834.86 ms (冷启动峰值) | **≤ 800 ms (稳态)** | **实测倒推提议**：覆盖 90% 以上稳态访问（中位数约 417ms），留出适当余量。 |
| **大规模图首屏渲染耗时** | `synthetic-large-repo` (120 modules) | 292.65 ms (preview 中位数) / 377.81 ms (p95) | **≤ 1500 ms (稳态)** | **沿用已批准预算**：Checkpoints 2 批准的 1.5s 预算，实测仅约 300ms，大幅优于预算。 |
| **服务端代码分析耗时** | `skill-central` (290 files) | 163.90 ms (preview 中位数) / 199.35 ms (p95) | **≤ 1000 ms (稳态)** | **实测倒推提议**：300 文件内通常在 200ms 内，提议 1000ms 作为安全预算。 |
| **边交叉数 (Crossings) - 展开** | `synthetic-hub-repo` (57 modules) | 86 处交叉 | **仅作观测，不设硬门禁** | 网状图交叉数高度取决于图拓扑固征，不设硬门禁。 |
| **边交叉数 (Crossings) - 折叠优化** | `synthetic-hub-repo` (14 containers) | 34 处交叉 (降幅 60.5%) | **折叠交叉降幅 ≥ 40%** | **实测倒推提议**：实测降幅 60.5%，提议 40% 门槛验证折叠有效性。 |
| **代码依赖边精确率 (Precision)** | `skill-central` (30条样本) | 30/30 (100.0%, 95% CI: [88.65%, 100%]) | **≥ 90.0%** | **提议值**：保证反演依赖的高置信度。 |
| **代码依赖边召回率 (Recall)** | `skill-central` (30条样本) | 22/30 (73.3%, 95% CI: [55.55%, 85.82%]) | **≥ 70.0%** | **实测倒推提议**：单体工程根入口脚本未聚类（漏检 8 条），提议 70% 作为 V1 阶段基准。 |
