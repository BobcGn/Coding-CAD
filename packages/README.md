# Packages 架构 / Packages Architecture

`packages/` 是 Coding CAD 的核心代码层。这里保存稳定的架构模型、DSL 投影、验证规则、组件知识和未来 Agent 编排边界。

`packages/` is the core code layer of Coding CAD. It contains the stable architecture model, DSL projection, validation rules, component knowledge, and future Agent orchestration boundary.

## 心智模型 / Mental Model

```text
Human-readable YAML
  -> @coding-cad/dsl
  -> @coding-cad/architecture-ir
  -> @coding-cad/validator
  -> @coding-cad/agent-runtime

@coding-cad/component-registry
  -> can enrich validation and future design suggestions
```

核心原则：IR 是真实模型，YAML、UI 和 Agent 都只是围绕 IR 的不同读写界面。

Core principle: the IR is the source model. YAML, UI, and Agents are different read/write surfaces around the IR.

## 依赖方向 / Dependency Direction

```text
architecture-ir
  <- dsl
  <- component-registry
  <- validator
  <- agent-runtime
  <- apps/*
```

依赖只能从更具体的层指向更基础的层。`architecture-ir` 不应该依赖任何 package；`dsl` 不应该知道 validator；validator 可以读取 IR，但不应该调度 Agent 或调用 app。

Dependencies should point from more specific layers to more foundational layers. `architecture-ir` should not depend on any package; `dsl` should not know about the validator; the validator may read IR, but should not dispatch Agents or call apps.

## Package 地图 / Package Map

| Package | 职责 / Responsibility | 拥有 / Owns | 不应拥有 / Should Not Own |
| --- | --- | --- | --- |
| `@coding-cad/architecture-ir` | 核心架构中间表示 / Core architecture intermediate representation | 类型契约、架构词汇、诊断形态 / Type contracts, architecture vocabulary, diagnostic shape | 解析、验证规则、运行时行为 / Parsing, validation rules, runtime behavior |
| `@coding-cad/dsl` | YAML 和 IR 的互转 / Convert between YAML and IR | 面向人的别名、YAML 形态归一化 / Human-friendly aliases, YAML shape normalization | 架构正确性判断 / Architecture correctness decisions |
| `@coding-cad/validator` | 架构诊断 / Architecture diagnostics | 规则执行、依赖图检查、技术误用诊断 / Rule execution, dependency graph checks, technology misuse diagnostics | YAML 解析、组件目录所有权、Agent 执行 / YAML parsing, component catalog ownership, Agent execution |
| `@coding-cad/component-registry` | 组件能力知识库 / Component capability knowledge base | 技术能力、限制、适用和风险场景 / Technology capabilities, limitations, suitable/risky usage | 项目特定决策 / Project-specific decisions |
| `@coding-cad/agent-runtime` | Agent 编排边界 / Agent orchestration boundary | 任务和结果契约、未来调度抽象 / Task/result contracts and future dispatch abstraction | 尚未成型的具体 Agent Provider 逻辑 / Concrete Agent provider logic before it exists |

## 数据流 / Data Flow

1. 用户或示例提供 YAML 架构文档。  
   A user or example provides a YAML architecture document.
2. `@coding-cad/dsl` 将 YAML 解析为 `ArchitectureIR`，并兼容 snake_case 与 camelCase 输入。  
   `@coding-cad/dsl` parses YAML into `ArchitectureIR`, accepting both snake_case and camelCase input.
3. `@coding-cad/validator` 读取 IR 并输出 `ArchitectureDiagnostic[]`，不会修改 IR。  
   `@coding-cad/validator` reads IR and returns `ArchitectureDiagnostic[]`; it does not mutate IR.
4. `@coding-cad/component-registry` 提供通用技术知识，供 validator、UI 或未来 Agent 使用。  
   `@coding-cad/component-registry` provides general technology knowledge for the validator, UI, or future Agents.
5. `@coding-cad/agent-runtime` 定义未来 Agent 如何接收架构、目标和诊断，并返回结果。  
   `@coding-cad/agent-runtime` defines how future Agents receive architecture, objectives, diagnostics, and return results.

## 扩展指南 / Extension Guide

- 新增 IR 字段时，先在 `architecture-ir/src/types.ts` 定义语义，再更新 DSL 解析和示例。  
  When adding an IR field, define its semantics in `architecture-ir/src/types.ts` first, then update DSL parsing and examples.
- 新增 YAML 语法糖时，保持输出仍是标准 `ArchitectureIR`。  
  When adding YAML syntax sugar, keep the output as standard `ArchitectureIR`.
- 新增 validator 规则时，诊断要说明风险原因，而不仅是指出违规。  
  When adding a validator rule, diagnostics should explain the risk, not only report the violation.
- 新增组件知识时，把事实性能力和项目特定选择分开。  
  When adding component knowledge, separate general capabilities from project-specific choices.
- 新增 Agent 能力时，先扩展任务和结果契约，再接入具体运行器。  
  When adding Agent capability, extend task/result contracts before wiring a concrete runner.

## 文档与注释 / Documentation and Comments

本目录遵循《软件设计的哲学》式的文档取向：文档应该解释接口、意图、约束、设计取舍和不变量，而不是复述代码正在做什么。

This directory follows the documentation style advocated by *A Philosophy of Software Design*: documentation should explain interfaces, intent, constraints, design tradeoffs, and invariants instead of restating what the code already says.

- package README 解释模块边界和协作方式。  
  Package READMEs explain module boundaries and collaboration patterns.
- public type/interface comments 解释调用者必须知道的契约。  
  Public type/interface comments explain contracts callers must know.
- implementation comments 只解释不显然的原因、兼容策略或风险。  
  Implementation comments explain only non-obvious reasons, compatibility strategies, or risks.
- 诊断文案要包含 `message` 和 `rationale`，让人和 Agent 都能理解后果。  
  Diagnostic text should include both `message` and `rationale`, so humans and Agents can understand consequences.
