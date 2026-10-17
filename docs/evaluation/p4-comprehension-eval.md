# Human Comprehension Evaluation Material / 人工架构可理解性评估材料

> **重要状态声明 / Status Notice**:
> **本材料供人工评估使用，当前状态为待执行，评测数据不可由 AI 代填。**
> **This evaluation material is designed for human subjective assessment. Its current status is PENDING EXECUTION, and benchmark scores must NOT be filled in or synthesized by AI.**

---

## 1. 做了什么 / What

设计并编写了阶段 4（Brownfield Architecture Workspace）的人工可理解性对照实验方案与评估题库，涵盖：
- **A/B 对照实验设计**：对比纯代码/文档检索（对照组 A）与 Coding-CAD 架构工作区（实验组 B）；
- **四类典型架构理解任务**：识别核心依赖、识别可疑/反向依赖、判断模块边界、评估改动影响范围；
- **多维度评分量表**：基于 NASA-TLX 简化版的认知负荷、完成耗时与决策置信度；
- **具体问答题库与客观标准答案**：涵盖真实仓库 `skill-central`、本工程 `Coding-CAD` 以及复杂拓扑合成夹具 `synthetic-hub-repo`，并均附代码与规范行号依据。

Designed a human comprehension A/B evaluation protocol and question set for Phase 4 covering core dependency discovery, suspicious dependency detection, boundary identification, and impact assessment across `skill-central`, `Coding-CAD`, and `synthetic-hub-repo`.

---

## 2. 为什么这么做 / Why

- **区分物理测量与人类认知**：
  布局引擎测得的交叉数（Crossings）、重叠度（Overlaps）和面积（Area）是客观几何指标，无法等同于人类架构师对系统结构的理解效率；必须通过独立的人工主观测试设计，验证架构图是否真正辅助了认知减负。
- **防止 AI 伪造用户测试数据**：
  严守科学诚信底线，明确将本材料标记为“待人工执行”，严禁模型自行假想或合成“用户实验得分”。

---

## 3. 实验方案设计 / Experiment Protocol Design

### 3.1 实验组别设置 / Subject Groups

| 组别 / Group | 工作环境与工具 / Environment & Tooling | 信息获取方式 / Information Retrieval Mode |
| --- | --- | --- |
| **对照组 A (Baseline)** | 现代 IDE（VS Code / WebStorm）+ 终端 + README/文档 | 依靠全文搜索（Grep）、目录浏览、手读代码与 `package.json` 清单 |
| **实验组 B (Coding-CAD)** | Coding-CAD Brownfield Architecture Workspace | 依靠模块分组、ELK 自动布局、展开/折叠、双向问题导航与检查器 |

### 3.2 评分量表 (1–5 分制) / Evaluation Rubric (1–5 Likert Scale)

| 维度 / Dimension | 1 分 / Very Low | 2 分 / Low | 3 分 / Moderate | 4 分 / High | 5 分 / Very High |
| --- | --- | --- | --- | --- | --- |
| **认知负荷 (Cognitive Load)**<br>完成任务所需心智努力 | 极高负担（思维混乱、多文件频繁跳转） | 较高负担 | 中等负担 | 较低负担 | 极低负担（一目了然、心智流利） |
| **理解速度 (Speed & Efficiency)**<br>得出确信结论的时间 | > 15 分钟 | 8–15 分钟 | 4–8 分钟 | 2–4 分钟 | < 2 分钟 |
| **决策置信度 (Confidence)**<br>对判断正确性的确信程度 | 完全不确定（纯靠猜测） | 较低把握 | 基本确定 | 很有把握 | 100% 确信（有明确视觉与证据支撑） |

---

## 4. 评估对象问答题与标准答案 / Evaluation Question Sets & Ground Truth

### 对象 1：真实开源代码库 `skill-central` (23 模块，77 依赖边)

- **仓库路径**：`/Users/bobcgn/AAA_Codings/Personal_Projects/skill-central`
- **仓库性质**：真实本地 TypeScript / Electron 生产力工具代码库

#### 任务 1：核心依赖识别 / Core Dependency Identification
- **题目**：请找出该系统中最核心的基础数据与配置存储模块。
- **客观标准答案**：`storage-service`（对应路径 `src/storage/`）。
- **代码与证据依据**：在 `src/storage/` 下承载了 `config.ts`、`history.ts`、`cache.ts` 等全局状态，全仓共有 11 个业务子模块显式依赖它（如 `core`、`commands`、`desktop`、`mcp` 等），在依赖图上呈现为最大的汇聚入度节点（In-degree = 11）。

#### 任务 2：模块调用隔离与分层判断 / Tiering & Boundary Check
- **题目**：桌面端主进程入口 `src/desktop/main.ts` 是否直接调用了底层 CLI 具体命令脚本（`src/commands/*`）？
- **客观标准答案**：否。桌面主进程未直接引用 `commands/*`，而是由 `desktop-service` 隔离，通过事件委托间接执行。
- **代码与证据依据**：检查 `src/desktop/main.ts` 的 import 语句（L1-L35），仅引入了 Electron、`app-metadata`、`ipc` 与 `window-manager`，不存在任何指向 `src/commands/` 的 import。

#### 任务 3：单体工程边缘局限识别 / Boundary Heuristic Comprehension
- **题目**：为什么根入口 `src/index.ts` 到 `commands-service` 的 import 没有作为一条有向边出现在架构图中？
- **客观标准答案**：因为 `src/index.ts` 位于根目录，单体工程的 L4 聚类 Heuristic 仅针对 `src/<subdir>` 生成模块组件，根级单文件未归属于独立子模块。
- **代码与证据依据**：[`packages/implementation-analyzer/src/structure/module-analyzer.ts`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/packages/implementation-analyzer/src/structure/module-analyzer.ts#L141-L161) 中 `analyzeSingleRepository` 仅识别 `src/` 的直接子目录，根文件 `fromMod === undefined`。

---

### 对象 2：本工程 `Coding-CAD` (15 模块，40 依赖边)

- **仓库路径**：`/Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD`
- **仓库性质**：pnpm + Turborepo TypeScript Monorepo

#### 任务 1：架构事实中心判定 / Source of Truth Identification
- **题目**：在 Coding-CAD 架构中，哪个包是全系统唯一的架构事实来源（Single Source of Truth）？
- **客观标准答案**：`@coding-cad/architecture-ir`（对应 `packages/architecture-ir`）。
- **代码与证据依据**：根级 [`AGENTS.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/AGENTS.md#L11-L26) 明确规定；全仓 15 个模块中有 12 个模块在 `package.json` 中直接依赖 `architecture-ir`，且无任何模块创建竞争性的架构数据结构。

#### 任务 2：依赖方向规则合规审查 / Dependency Direction Rule Check
- **题目**：`packages/architecture-layout` 是否允许反向导入 `apps/web` 或 `@xyflow/svelte`？
- **客观标准答案**：严格禁止。
- **代码与证据依据**：架构决策 [D-009](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/architecture-layout-decisions.md#L468-L510) 与根级规则规定：Canvas 渲染器类型只能保留在 `apps/web` 内部的 adapter 层，核心布局编译器必须保持 solver-neutral 与 UI-neutral。

#### 任务 3：阶段 4 依赖演进溯源 / Dependency Evolution Tracking
- **题目**：阶段 4 相比阶段 3 退出时的 38 条依赖边，新增了哪两条依赖边？
- **客观标准答案**：`web -> implementation-analyzer`（步骤 3 新增）与 `web -> implementation-validator`（步骤 4 新增）。
- **代码与证据依据**：详见 [`docs/brownfield-expected-baseline-provenance.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/brownfield-expected-baseline-provenance.md#L68-L87)，两项均为真实新增的运行时依赖。

---

### 对象 3：合成复杂图夹具 `synthetic-hub-repo` (57 模块，14 包，83 边)

- **仓库路径**：`packages/implementation-analyzer/fixtures/synthetic-hub-repo`
- **仓库性质**：纯合成复杂基准夹具（包含中心 Hub、跨层调用、环依赖与桥接模块）

#### 任务 1：中心共享包（Hub Package）判定
- **题目**：该拓扑中最核心的中心共享包是哪一个？它被多少个包依赖？
- **客观标准答案**：`pkg-hub-core`；被其余 13 个包全部依赖（入度 In-degree = 13）。
- **代码与证据依据**：`packages/pkg-hub-core/package.json` 导出共享类型与总线，其余 13 个包的 `.service.ts` 均包含显式 `import from "../../pkg-hub-core/..."`。

#### 任务 2：环依赖排查 / Cyclic Dependency Detection
- **题目**：该拓扑中存在哪组直接相互引用的环依赖？
- **客观标准答案**：`pkg-service-order` 与 `pkg-service-inventory` 互斥环依赖。
- **代码与证据依据**：`packages/pkg-service-order/src/order-service.service.ts` 导入 `inventory-service`，同时 `packages/pkg-service-inventory/src/inventory-service.service.ts` 导入 `order-service`。

#### 任务 3：桥接模块（Bridge Connector）识别
- **题目**：连接传统遗留系统与现代微服务集群的桥接模块是哪一个？
- **客观标准答案**：`pkg-bridge-connector`。
- **代码与证据依据**：`packages/pkg-bridge-connector/src/legacy-adapter.service.ts` 导入 `pkg-legacy-crm`，`bridge-router.service.ts` 导入 `pkg-service-order` 与 `pkg-service-user`。

#### 任务 4：大图默认折叠策略（N > 50）效果评估
- **题目**：当采用 N > 50 初始折叠策略时，首屏可见节点数与连线交叉数发生了怎样的改善？
- **客观标准答案**：首屏可见节点数由 71 个降为 14 个（降幅 80.3%），交叉数由 86 次降为 34 次（降幅 60.5%），有效消除了大图首屏的信息过载。
- **实测数据依据**：详见 [`logs/validation/p4-browser/benchmark-report.md`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/logs/validation/p4-browser/benchmark-report.md)。

---

## 5. 待执行人工测试记录表（空白模板） / Blank Human Evaluation Log Sheet

| 受试者编号 | 组别 (A/B) | 评估对象 | 任务项 | 答题耗时 (s) | 得出答案 | 客观准确性 (0/1) | 认知负荷评分 (1–5) | 置信度评分 (1–5) | 评语与主观反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| *(待填)* | | | | | | | | | |
| *(待填)* | | | | | | | | | |

> **声明**：本表必须由真实人类受试者（架构师、开发工程师）在实际操作后填写；严禁任何自动化脚本或 AI 代填测试分数。
