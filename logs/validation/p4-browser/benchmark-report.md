# Brownfield Real Browser Layout Benchmarks / Brownfield 真实浏览器布局实测报告

生成时间 / Generated at: 2026-10-17T02:22:00.000Z

## 1. 做了什么 / What

在真实 Chromium 浏览器环境（Playwright E2E）中，分别在 Vite `dev` 模式与生产 `preview` 模式下，针对本代码仓库自身（`Coding-CAD`）与 120 模块大规模合成夹具（`synthetic-large-repo`），实测完整的 Brownfield 产品流水线指标（服务端反演耗时、首屏渲染耗时、节点可见与折叠计数、ELK 求解器来源、同级重叠、容器包含与严格边交叉数）。

Evaluated full end-to-end Brownfield pipeline metrics in a real Chromium browser via Playwright across Vite `dev` and production `preview` modes for both `Coding-CAD` (this repository) and `synthetic-large-repo` (120 modules). Measured server analysis duration, first screen render time, visible and collapsed node counts, ELK solver source, peer overlaps, containment failures, and strict edge crossings.

---

## 2. 实测数据表格 / Measured Metrics Table

| 夹具 / Fixture | 运行模式 / Mode | 服务端耗时 / Server (ms) | 首屏渲染 / Render (ms) | 默认可见节点 / Visible | 折叠隐藏数 / Hidden | Solver 来源 | 重叠数 / Overlaps | 包含失败 / Containment Err | 边交叉数 / Crossings | 已布线边 / Edges |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Coding-CAD** (this repo) | dev | 293.48 | 493.11 | 30 | 15 | **elk** | 0 | 0 | 19 | 39 / 39 |
| **Coding-CAD** (this repo) | preview | 318.26 | 637.64 | 30 | 15 | **elk** | 0 | 0 | 19 | 39 / 39 |
| **synthetic-large-repo** (120 mod) | dev | 111.07 | 406.22 | 150 | 120 | **elk** | 0 | 0 | 1 | 147 / 147 |
| **synthetic-large-repo** (120 mod) | preview | 93.73 | 296.22 | 150 | 120 | **elk** | 0 | 0 | 1 | 147 / 147 |

---

## 3. 分析与结论 / Analysis & Conclusions

1. **零降级（Zero Fallback）硬门禁全数通过**：
   - 两种规模、两种模式下，`layoutSource` 与 Canvas 属性均 100% 断言为 `elk`，未发生任何超时回退或降级至简易布局；
   - 所有的 39 条（本仓库）及 147 条（合成夹具）连接边均完成标准多段正交路由（sections.length > 0）。
2. **布局质量与几何正确性**：
   - **重叠（Peer Overlaps）**：两组夹具在两种模式下均为 **0**，无任何同级节点重叠；
   - **容器包含（Containment Failures）**：两组夹具在两种模式下均为 **0**，子组件严格位于模块容器边界矩形内部；
   - **边交叉数（Crossings）**：本仓库 39 条边产生 19 处交叉；120 模块合成夹具 147 条边仅产生 **1** 处交叉，体现了 ELK 分层图布局的高质量边路由。
3. **120 模块大规模夹具可用性评估**：
   - 120 模块规模下，服务端反演耗时 ~100 ms，浏览器端从点击提交到首屏布局渲染完成仅 ~300–400 ms，未出现任何卡顿或超时；
   - 折叠机制正常：点击模块折叠按钮后，120 个子组件节点安全隐藏，画布保留 30 个顶层包容器，隐藏计数准确显示为 `(4 hidden)`；再次点击完整还原；
   - 120 模块下布局完全可用、性能充裕、几何规范，不存在不可用或需要掩盖的问题。
