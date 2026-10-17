# Implementation Analyzer Baseline Report / 实现反演基线报告

生成时间 / Generated at: 2026-10-17T01:03:16.064Z

> **真值说明 / Ground Truth Notes:**
> - **L1-manifest**: 真值与分析器均同源于 package.json 声明，仅用于验证清单解析完整性，不能作为代码级正确率指标。
> - **L2-hand-annotated**: 经人工独立标注的模块与依赖边真值，包含跨包 AST 导入与交叉校验。
> - **synthetic**: 合成大规模基准夹具，用于布局吞吐与超大图压力测试，不得表述为真实仓库指标。

| Fixture | Truth Level | Passed? | Modules (D/E) | Mod P / R | Conns (D/E) | Conn P / R | Edge Cross-Val (Used/Unused/Undecl/Res) | Resolved Edges | Elapsed (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coding-CAD (this repository) | L1-manifest | PASS | 15/15 | 100.0% / 100.0% | 39/38 | 97.4% / 100.0% | 39 / 0 / 0 / 0 | **39** | 840.88 |
| small-monorepo (pnpm workspace) | L2-hand-annotated | PASS | 3/3 | 100.0% / 100.0% | 3/3 | 100.0% / 100.0% | 3 / 0 / 0 / 0 | **3** | 2.67 |
| small-single-repo (plain src/) | L2-hand-annotated | PASS | 4/4 | 100.0% / 100.0% | 4/4 | 100.0% / 100.0% | 0 / 0 / 0 / 4 | **4** | 1.87 |
| edge-cases-repo (edge cases) | L2-hand-annotated | PASS | 5/5 | 100.0% / 100.0% | 4/4 | 100.0% / 100.0% | 3 / 0 / 1 / 0 | **4** | 3.41 |
| synthetic-large-repo (SYNTHETIC) | synthetic | PASS | 120/120 | 100.0% / 100.0% | 147/147 | 100.0% / 100.0% | 0 / 0 / 147 / 0 | **147** | 29.15 |