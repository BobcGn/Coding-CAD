# Implementation Analyzer Before vs After Comparison / 实现反演改动前后对比报告

生成时间 / Generated at: 2026-10-17T02:14:54.555Z

> **对比说明 / Comparison Notes:**
> - Before 阶段由于仅检查 src/，在 Monorepo 下检测到 0 模块失败；
> - After 阶段实现了 L1 工作区发现、L2 AST 导入解析、L2 交叉校验与类型化证据编解码；
> - 边交叉校验区分为 声明且使用 (Used)、声明未使用 (Unused)、未声明使用 (Undecl)、代码纯解析 (Res)；
> - Resolved Edges 为经 TypeScript 编译器 AST 确认的代码导入边总数，已全部非 0。

| Fixture | Truth Level | Stage | Status | Modules (D/E) | Mod P / R | Conns (D/E) | Conn P / R | Edge Cross-Val (Used/Unused/Undecl/Res) | Resolved Edges | Elapsed (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coding-CAD (this repository) | L1-manifest | **Before** | FAIL | 2/15 | 0.0% / 0.0% | 0/37 | 0.0% / 0.0% | 0 / 0 / 0 / 0 | 0 | 57.02 |
| Coding-CAD (this repository) | L1-manifest | **After** | PASS | 15/15 | 100.0% / 100.0% | 39/39 | 100.0% / 100.0% | 39 / 0 / 0 / 0 | **39** | 891.61 |
| small-monorepo (pnpm workspace) | L2-hand-annotated | **Before** | FAIL | 0/3 | 0.0% / 0.0% | 0/3 | 0.0% / 0.0% | 0 / 0 / 0 / 0 | 0 | 0.59 |
| small-monorepo (pnpm workspace) | L2-hand-annotated | **After** | PASS | 3/3 | 100.0% / 100.0% | 3/3 | 100.0% / 100.0% | 3 / 0 / 0 / 0 | **3** | 3.71 |
| small-single-repo (plain src/) | L2-hand-annotated | **Before** | PASS | 4/4 | 100.0% / 100.0% | 4/4 | 100.0% / 100.0% | 0 / 0 / 0 / 0 | 0 | 1.27 |
| small-single-repo (plain src/) | L2-hand-annotated | **After** | PASS | 4/4 | 100.0% / 100.0% | 4/4 | 100.0% / 100.0% | 0 / 0 / 0 / 4 | **4** | 2.07 |
| edge-cases-repo (edge cases) | L2-hand-annotated | **After** | PASS | 5/5 | 100.0% / 100.0% | 4/4 | 100.0% / 100.0% | 3 / 0 / 1 / 0 | **4** | 5.05 |
| synthetic-large-repo (SYNTHETIC) | synthetic | **Before** | FAIL | 0/120 | 0.0% / 0.0% | 0/147 | 0.0% / 0.0% | 0 / 0 / 0 / 0 | 0 | 3.64 |
| synthetic-large-repo (SYNTHETIC) | synthetic | **After** | PASS | 120/120 | 100.0% / 100.0% | 147/147 | 100.0% / 100.0% | 0 / 0 / 147 / 0 | **147** | 30.38 |