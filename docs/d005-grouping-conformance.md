# D-005 Conformance Review: Progressive Disclosure & Module Grouping / D-005 渐进披露与模块分组对照分析

## 1. 做了什么 / What

对系统既定架构决策 [D-005 (Progressive Disclosure V1 Granularity)](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/docs/architecture-layout-decisions.md#L259-L302) 与当前 Brownfield 工作区中 `module:<pkgStem>` 分组实现进行了逐条对照核验，评估其是否严格保持在批准边界内。

Conducted a point-by-point conformance review comparing architecture decision D-005 against the Brownfield `module:<pkgStem>` grouping implementation to verify strict adherence to approved boundaries.

---

## 2. 为什么这么做 / Why

- **防止越权扩展架构语义**：
  仓库规则明确禁止在未经用户决策的情况下扩展架构模型或引入自动推断能力。特别是 D-005 明确裁定：V1 阶段排除自动领域推断（Automatic Domain Inference），仅支持组件、显式模块与基础设施分组。
- **验证 Abstraction Pass 与 UI 交互的一致性**：
  确保分析器提取的 tags、Abstraction Pass 生成的 Visual Group，以及前端 Canvas 的展开/折叠行为，完全遵循 D-005 的协议边界。

---

## 3. 逐条对照核验表 / Point-by-Point Conformance Table

| 序号 | D-005 原文条款要求 / D-005 Approved Text | 当前 Brownfield 实现机制 / Current Brownfield Implementation | 实现所在文件与位置 / Code Location | 是否在范围内 / Within Scope? | 详细对照说明 / Detailed Comparison Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | **支持组件与显式模块分组**<br>"V1 supports component, explicit module, and infrastructure grouping." | 针对每个 workspace package（或单体模块），Analyzer 提取并在 component tags 注入 `module:${pkgStem}`；Abstraction Pass 解析 `module:` 前缀并构造对应 `group:module:${pkgStem}` 分组。 | [`packages/architecture-layout/src/compiler/passes/abstraction-pass.ts`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/packages/architecture-layout/src/compiler/passes/abstraction-pass.ts#L41-L51) | **完全在范围内**<br>(Strictly in scope) | 显式根据工程现有目录/包结构分组，属于最典型的“explicit module grouping”，未假设未知层级。 |
| 2 | **支持基础设施分组**<br>"...and infrastructure grouping." | 当组件的语义角色（Semantic Role）为 `database`, `storage`, `cache`, `queue`, 或 `external` 时，Abstraction Pass 自动将其归入 `group:infrastructure`。 | [`packages/architecture-layout/src/compiler/passes/abstraction-pass.ts`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/packages/architecture-layout/src/compiler/passes/abstraction-pass.ts#L53-L65) | **完全在范围内**<br>(Strictly in scope) | 沿用 Phase 1 已经验证的基础设施聚合规则，完全符合 D-005 Option A 的规定。 |
| 3 | **保留 Domain 分组协议边界，但禁止自动推断**<br>"Domain grouping has a protocol boundary but is used only when the source IR carries an explicit domain signal; automatic domain inference is excluded." | Abstraction Pass 预留了 `domain:${value}` 标签的解析逻辑，但 Analyzer **未实现**任何基于代码名称或目录猜想的自动领域推断规则；仅当输入 IR 中本身显式带有 `domain:*` 标签时才生成 domain 分组。 | [`packages/architecture-layout/src/compiler/passes/abstraction-pass.ts`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/packages/architecture-layout/src/compiler/passes/abstraction-pass.ts#L43-L48) | **完全在范围内**<br>(Strictly in scope) | 严格遵循排除自动领域推断的禁令，没有新增任何黑盒 heuristic。 |
| 4 | **折叠与隐藏计数保真**<br>"reveal hidden counts; low-confidence Analyzer inference must not be presented as confirmed architecture." | 模块折叠时，UI 显示该分组包含的组件数量（隐藏计数）；Canvas 与 Inspector 明确保留 Provenance（如 `module:architecture-ir` 来自 `package.json`），证据置信度通过类型化编解码呈现。 | [`apps/web/src/routes/+page.svelte`](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/apps/web/src/routes/+page.svelte) | **完全在范围内**<br>(Strictly in scope) | 隐藏计数与来源证据均在界面清晰显示，未对用户隐藏关键上下文。 |

---

## 4. 结论与边界判定 / Conclusion & Boundary Determination

- **判定结果**：Brownfield `module:<pkgStem>` 分组实现**完全符合 D-005 原文裁定，不存在任何超出范围的扩充**。
- **未越界项**：没有添加自动领域推断，没有创建新的 IR 核心类型，没有修改 `VisualGroupKind` 协议枚举。
- **无需暂停**：本实现无需停步等待用户二次决策。
