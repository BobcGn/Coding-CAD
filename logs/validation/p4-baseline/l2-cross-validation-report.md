# L2 Dependency Cross-Validation Report / L2 依赖交叉校验详细报告

## 1. 做了什么 / What

对 Coding-CAD 本仓库及各类测试夹具执行了 L2 依赖交叉校验（声明且使用 / 仅声明未使用 / 仅使用未声明），提取了全部细分条目、所在源文件路径，并逐条给出了归因判定（真实问题、真值标注问题、解析缺陷或合成特性）。

Conducted fine-grained L2 dependency cross-validation (Declared & Used, Declared but Unused, Used but Undeclared) across the Coding-CAD repository and synthetic fixtures, capturing exact source file paths and categorizing each case by root-cause judgment.

---

## 2. 为什么这么做 / Why

- **消除黑盒统计与总数模糊性**：
  单纯报告“L2 校验通过”或数字汇总无法揭示边缘缺陷；必须深入到具体的文件路径与代码行，明确哪些依赖被实际代码引用，哪些依赖属于冗余声明，哪些代码导入未在清单中显式声明。
- **诚实归因与缺陷定位**：
  对所有“仅声明未使用”或“仅使用未声明”的条目，严格区分属于代码工程中的**真实问题**（如注入缺陷、未声明依赖）、**真值标注问题**（如基线标注遗漏）、**解析缺陷**（如静态分析漏检），还是**合成设计特性**。

---

## 3. 校验总体统计 / Cross-Validation Summary Table

| 目标代码库 / 夹具 | 模块数 | 声明依赖总数 | 解析导入边数 | 声明且使用 (Used) | 仅声明未使用 (Unused) | 仅使用未声明 (Undecl) | 纯代码导入 (Res) | 判定 / Judgment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Coding-CAD** (本仓库) | 15 | 40 | 40 | **40** | **0** | **0** | 0 | 100% 吻合 (一致) |
| **small-monorepo** (pnpm workspace) | 3 | 3 | 3 | **3** | **0** | **0** | 0 | 100% 吻合 (一致) |
| **small-single-repo** (plain src/) | 4 | 0 | 4 | 0 | 0 | 0 | **4** | 代码驱动模块，无 workspace 清单 |
| **edge-cases-repo** (边缘用例库) | 5 | 3 | 4 | **3** | **0** | **1** | 0 | 检出注入的未声明依赖 |
| **synthetic-large-repo** (大图压测) | 120 | 0 | 147 | 0 | 0 | **147** | 0 | 合成无清单夹具设计特性 |

---

## 4. 异常条目逐项明细与归因表 / Discrepancy Breakdown & Judgment

针对所有“仅使用未声明”（Undeclared & Used）及“仅声明未使用”（Declared & Unused）条目，逐项核对文件路径与代码证据：

### 4.1 edge-cases-repo 夹具

| 序号 | 依赖边 / Dependency | 分类 / Category | 源码文件路径 / Source File | 依赖清单文件 / Manifest File | 归因判定 / Root Cause Judgment |
| --- | --- | --- | --- | --- | --- |
| 1 | `pkg-undeclared -> pkg-core` | **仅使用未声明**<br>(Undeclared & Used) | `packages/pkg-undeclared/src/index.ts` (L1-L4: `import { coreUtility } from "@edge/pkg-core"`) | `packages/pkg-undeclared/package.json` (未包含 `@edge/pkg-core`) | **真实问题（设计注入测试项）**：夹具特意构造未在 `package.json` 声明但代码实际 `import` 的场景，Analyzer 成功在 L2 阶段以高置信度检出该未声明依赖，属于预期设计验证。 |

### 4.2 Coding-CAD 本仓库

- **仅声明未使用 (0 项)**：全仓库 40 条 workspace 依赖声明均在各 package 的 `src/` 源码中存在显式 `import`，无悬空或未使用的 workspace 依赖。
- **仅使用未声明 (0 项)**：全仓库不存在任何使用 `@coding-cad/*` 内部包但未在 `package.json` 声明的越界引用。

### 4.3 synthetic-large-repo 压测夹具

| 序号范围 | 依赖边数量 | 分类 / Category | 源码位置 / Source Location | 清单状态 / Manifest Status | 归因判定 / Root Cause Judgment |
| --- | --- | --- | --- | --- | --- |
| 1–147 | 147 条边 | **仅使用未声明**<br>(Undeclared & Used) | `packages/pkg-XX/src/service-*.ts` (共 120 个包相互调用) | 合成夹具根目录仅提供拓扑结构，子包无独立 `package.json` | **合成夹具构造特性**：为压测 120 节点、147 边的 ELK 布局性能而生成的代码导入拓扑，子包未配置独立 manifest，因而全部被归入 AST 源码解析与未声明依赖提取。 |

---

## 5. 验证结论 / Verification Conclusion

L2 交叉校验结果证明：
1. Analyzer 的 L2 阶段能够准确区分清单声明与 AST 代码调用的差异；
2. 在存在未声明引用的场景下（`edge-cases-repo`），精准定位于源码文件 `packages/pkg-undeclared/src/index.ts` 并标出 `undeclared-used`，未发生漏检或错误归类；
3. 本工程自身的 40 条依赖在清单与代码之间 100% 自洽。
