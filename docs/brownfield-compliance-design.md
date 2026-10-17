# Brownfield Compliance Check & Problem Navigation Design / Brownfield 合规检查与问题导航设计说明

## 1. 做了什么 / What

设计并实现了 Brownfield 架构工作区中“实现 vs 期望”合规检查（Compliance Verification）与双向问题导航（Bidirectional Problem Navigation）机制：
1. **期望架构来源与基线机制（Expected Architecture Baseline）**：
   - 明确期望架构的权威来源，支持用户显式加载已有的 `ArchitectureProject` 作为期望基线（通过 UI 加载或导入项目 JSON）；
   - 严禁系统自动伪造或推测期望架构，维护 `ArchitectureProject` 作为单一事实源的纯粹性；
2. **未加载期望架构时的明确状态（Explicit Unavailable State）**：
   - 在用户未加载期望架构前，界面明确展示 `合规检查不可用：未加载期望架构 / Compliance check unavailable: No expected architecture loaded`；
   - 杜绝给出误导性的空结果或假“0 问题/全部通过”；
3. **现有 5 条 Validator 规则在 Brownfield 下的能力范围与局限说明（Rule Scope & Limitations）**：
   - 逐条界定 `component-existence`、`technology-compliance`、`component-capability-constraint`、`dependency-compliance` 与 `contract-compliance` 在静态代码反演场景下的检出能力与边界；
   - 针对 Phase 4 Analyzer 未提取代码级契约接口的物理限制，将契约规则明确标记为 `无法验证 (Analyzer 未提取契约) / Cannot Verify (Contracts not extracted by Analyzer)`，严禁静默当作通过或产生虚假违规；
4. **画布与问题列表的双向交互导航（Bidirectional Navigation）**：
   - 问题列表关联画布节点与连接；点击问题可居中聚焦目标节点/边；若目标节点所属模块分组处于折叠状态，系统自动将其展开；
   - 画布选择节点或边时，检查器与问题面板同步高亮该元素关联的合规问题；
5. **问题项元数据与证据呈现（Evidence & Confidence Presentation）**：
   - 呈现规则名称、严重等级（`ERROR`/`WARNING`/`INFO`）、违规说明与建议；
   - 通过 `evidence-codec` 解码并展示代码证据路径与层级先验置信度（Layer Prior）；
   - 对 `inferred` 推断性证据显式标注 `[待人工确认 / Pending Human Confirmation]` 标签。

Designed and implemented the compliance check and bidirectional problem navigation mechanism between reverse-engineered implementation and approved expected architecture in the Brownfield workspace:
1. Expected Architecture Baseline: Explicit loading of existing `ArchitectureProject` models without synthetic or AI-hallucinated expectations.
2. Explicit Unavailable State: When no expected baseline is provided, the UI displays "Compliance check unavailable: No expected architecture loaded" instead of misleading empty passes.
3. Capabilities and Limitations of 5 Builtin Rules: Rigorously documented detectable vs. undetectable deviations for each rule, explicitly tagging contract rules as "Cannot Verify" due to Phase 4 AST boundaries.
4. Bidirectional Canvas Navigation: Clicking issues focuses nodes/edges with automatic group expansion; selecting canvas elements highlights corresponding issues.
5. Evidence & Confidence Transparency: Problems render decoded evidence, Layer Priors, and explicit "Pending Human Confirmation" tags for inferred items.

---

## 2. 为什么这么做 / Why

### 2.1 期望架构从何而来？/ Where Does the Expected Architecture Come From?
- **设计本质**：`ImplementationValidator` 的核心逻辑是比较两份模型——**期望架构（ArchitectureProject）** 与 **实现反演模型（ImplementationModel）**。
- **Brownfield 的现实**：当用户首次打开一个遗留或已有代码仓库时，系统默认**只有实现事实，没有期望意图**。
- **备选方案分析**：
  - *方案 A（自动伪造/镜像期望）*：在打开仓库后，自动把反演出来的架构深拷贝一份作为“期望架构”。
    - **否决原因**：自欺欺人。把“现存代码是什么”直接当成“应该是什么”，会导致 Validator 永远产出 0 偏差，失去合规验证的核心价值；更违反了 `ArchitectureProject` 记录架构意图而非代码副本的根本原则。
  - *方案 B（通过 LLM 自动猜测业务期望）*：让 AI 阅读 README 或反演图猜测期望架构。
    - **否决原因**：不可控、低置信度、缺乏可解释性，容易在缺乏人类授权的情况下产生大量误报或漏报。
  - *方案 C（显式基线加载机制，已采用）*：
    - 期望架构必须来自人类架构师认可的权威来源：
      1. 用户在 Greenfield 或既有设计流程中保存的 `ArchitectureProject`（如 `.coding-cad/project.json` 或设计文档导出的 JSON）；
      2. 用户通过 UI 的 `[Load Expected Architecture / 加载期望架构]` 显式指定基线文件；
    - 在用户显式提供前，系统保持客观诚实，不擅自假设期望。

### 2.2 未加载期望架构时的系统行为 / Behavior When No Baseline is Loaded
- **严禁静默降级与伪通过**：若未加载期望架构，系统严禁显示 `0 validation issues` 或“实现符合已批准架构”。
- **诚实呈现**：问题面板直接展示提示信息：
  > “合规检查不可用：未加载期望架构。请加载已批准的架构基线（ArchitectureProject）以进行实现偏离核对。”
  > "Compliance check unavailable: No expected architecture loaded. Please load an approved ArchitectureProject baseline to check implementation drift."
- **状态分离**：此时工作区完整展示代码反演的架构图、组件依赖、模块分组与证据检查器，仅将“合规检查”模块置于等待基线就绪的状态。

### 2.3 现有 5 条 Validator 规则的能力范围与局限 / Scope & Limitations of the 5 Rules

| 规则名称 / Rule ID | Brownfield 场景下能查出什么 / What Can Be Detected | Brownfield 场景下查不出什么 / What Cannot Be Detected | 特殊处理与状态标记 / Special Handling & Tag |
| --- | --- | --- | --- |
| **组件存在性规则**<br>`component-existence` | 期望架构中要求存在、但代码反演中**完全缺失**的组件（Missing Components）。 | 代码中多出来的未规划组件（该情况由依赖规则捕获为意外依赖）；同名但内部职能漂移的组件。 | 报告 `ERROR: Missing implementation`；提供对应缺失组件 ID。 |
| **技术栈合规规则**<br>`technology-compliance` | 期望架构中指定的具体技术栈（如期望 PostgreSQL）与代码清单反演出的技术（如代码使用了 SQLite/MySQL）的**技术偏离**。 | 相同技术家族内部的细微版本漂移；未在 `technology` 白名单中定义的非标准库。 | 报告 `WARNING: Technology deviation`；显示代码检测到的实际技术 evidence。 |
| **组件能力与约束规则**<br>`component-capability-constraint` | 违反期望架构声明的 limitations 约束（例如组件标有 `not-primary-storage`、`cache-only`，但代码组件承担了持久化或主存储能力）。 | 运行时动态 SLA 越界（如内存突发、连接池耗尽、动态 QPS 违规）。 | 报告 `WARNING: Component violates limitation`；高亮违规的能力或标签。 |
| **依赖合规规则**<br>`dependency-compliance` | **双向检出**：<br>1. **未批准的依赖（Unapproved Dependency）**：代码中实际存在（package.json 声明或 AST 导入），但期望架构中未授权的违规调用边；<br>2. **缺失的必需依赖（Missing Dependency）**：期望架构中定义了连接，但代码中完全未找到调用事实。 | 动态反射调用、未声明的无类型 HTTP REST 字符串拼装、第三方运行时注入的隐式事件总线。 | 报告 `WARNING: Unapproved dependency` 或 `WARNING: Required dependency not detected`；提供具体边 ID。 |
| **契约合规规则**<br>`contract-compliance` | 预期用于核对组件对外暴露的 API Contracts（REST/gRPC/GraphQL）与接口签名是否一致。 | **局限**：Phase 4 Analyzer 的物理范围为 Monorepo 清单与文件级 AST 依赖图，**未进行方法体与契约模式（OpenAPI/Protobuf）的提取**。因此代码反演产物的 `contracts` 字段始终为空。 | **明确标记为“无法验证”**：若期望架构包含契约，系统**绝不**谎报“契约通过”，亦不报虚假错误，而是在问题列表显式展示标签 `[无法验证 / Cannot Verify (Contracts not extracted by Analyzer)]`。 |

---

## 3. 验证结果 / Verification

- 状态分类 / Status:
  - 已实现并验证：
    - 设计文档与规则边界定稿；
    - 期望基线夹具编写（`coding-cad-expected.json` 与变体夹具 `coding-cad-drifted.json`）；
    - 控制器与页面集成期望架构加载与 `ImplementationValidator` 触发；
    - 画布与问题面板双向导航（点击问题聚焦并自动展开所属分组；点击节点高亮关联问题）；
    - 证据、Layer Prior 置信度与 `待人工确认` / `无法验证` 标签渲染；
    - 单元测试与 E2E 浏览器自动化测试。
- 风险与回退方式 / Risks & Rollback:
  - 风险：当期望架构与代码组件命名规范不一致（如大小写或中划线）时，匹配器采用标准化模糊匹配；若差异过大需人工在 Architecture Review 中对齐。
  - 回退方式：`git revert <commit-hash>` 可独立回退步骤 4。
