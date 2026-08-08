# Packages 架构 / Packages Architecture

`packages/` 是 Coding CAD 的核心代码层。这里保存稳定的架构模型、DSL 投影、验证规则、组件知识和未来 Agent 编排边界。

`packages/` is the core code layer of Coding CAD. It contains the stable architecture model, DSL projection, validation rules, component knowledge, and future Agent orchestration boundary.

## 心智模型 / Mental Model

```text
Human-readable YAML
  -> @coding-cad/architecture-dsl
  -> @coding-cad/architecture-ir
  -> @coding-cad/architecture-validator
  -> @coding-cad/cli

@coding-cad/component-registry
  -> can enrich validation and future design suggestions
```

核心原则：IR 是真实模型，YAML、UI 和 Agent 都只是围绕 IR 的不同读写界面。

Core principle: the IR is the source model. YAML, UI, and Agents are different read/write surfaces around the IR.

## 依赖方向 / Dependency Direction

```text
architecture-dsl       -> architecture-ir
component-registry     -> architecture-ir
architecture-validator -> architecture-ir + component-registry
cli                    -> architecture-dsl + architecture-ir
                          + architecture-validator + component-registry
agent-runtime          -> architecture-ir
apps/*                 -> public package APIs
```

依赖只能从更具体的层指向更基础的层。`architecture-ir` 不应该依赖任何 package；`architecture-dsl` 不应该知道 validator；validator 可以读取 IR 和 Registry，但不应该调用 CLI 或 app。

Dependencies should point from more specific layers to more foundational layers. `architecture-ir` should not depend on any package; `architecture-dsl` should not know about the validator; the validator may read IR and Registry, but should not call CLI or apps.

图中的箭头表示“依赖于”。DSL 和 Registry 是 IR 之上的并列层；Validator 同时依赖 IR 与 Registry；CLI 只负责组合公开 API。

Arrows in the diagram mean “depends on.” DSL and Registry are peer layers above IR; the Validator depends on both IR and Registry; the CLI only composes public APIs.

## Package 地图 / Package Map

| Package | 职责 / Responsibility | 拥有 / Owns | 不应拥有 / Should Not Own |
| --- | --- | --- | --- |
| `@coding-cad/architecture-ir` | 核心架构中间表示 / Core architecture intermediate representation | 类型契约、架构词汇、诊断形态 / Type contracts, architecture vocabulary, diagnostic shape | 解析、验证规则、运行时行为 / Parsing, validation rules, runtime behavior |
| `@coding-cad/architecture-dsl` | YAML 和 ArchitectureProject 的互转 / Convert between YAML and ArchitectureProject | DSL schema、解析、格式化、可读错误 / DSL schema, parsing, formatting, readable errors | 架构正确性判断 / Architecture correctness decisions |
| `@coding-cad/architecture-validator` | 架构诊断 / Architecture diagnostics | 规则执行、依赖图检查、能力和限制匹配 / Rule execution, dependency graph checks, capability and limitation matching | YAML 解析、组件目录所有权、Agent 执行 / YAML parsing, component catalog ownership, Agent execution |
| `@coding-cad/component-registry` | 组件能力知识库 / Component capability knowledge base | 技术能力、限制、适用和风险场景 / Technology capabilities, limitations, suitable/risky usage | 项目特定决策 / Project-specific decisions |
| `@coding-cad/cli` | 命令行入口 / Command-line entry point | 文件读取、命令分发、报告输出 / File reading, command dispatch, report output | DSL、Validator 或 Registry 的业务规则 / DSL, Validator, or Registry business rules |
| `@coding-cad/agent-runtime` | Agent 编排边界 / Agent orchestration boundary | 任务和结果契约、未来调度抽象 / Task/result contracts and future dispatch abstraction | 尚未成型的具体 Agent Provider 逻辑 / Concrete Agent provider logic before it exists |

## 数据流 / Data Flow

1. 用户或示例提供 YAML 架构文档。

   A user or example provides a YAML architecture document.
2. `@coding-cad/architecture-dsl` 将 YAML 解析为 `ArchitectureProject`。

   `@coding-cad/architecture-dsl` parses YAML into `ArchitectureProject`.
3. `@coding-cad/architecture-validator` 读取 IR 和 Registry 并输出 `ValidationResult`，不会修改 IR。

   `@coding-cad/architecture-validator` reads IR and Registry and returns `ValidationResult`; it does not mutate IR.
4. `@coding-cad/component-registry` 提供通用技术知识，供 validator、UI 或未来 Agent 使用。

   `@coding-cad/component-registry` provides general technology knowledge for the validator, UI, or future Agents.
5. `@coding-cad/cli` 组合 DSL、IR、Registry 和 Validator，提供可运行入口。

   `@coding-cad/cli` composes DSL, IR, Registry, and Validator into a runnable entry point.

## 扩展指南 / Extension Guide

- 新增 IR 字段时，先在 `architecture-ir/src/*` 定义语义，再更新 DSL 解析和示例。

  When adding an IR field, define its semantics in `architecture-ir/src/*` first, then update DSL parsing and examples.
- 新增 YAML 语法糖时，保持输出仍是标准 `ArchitectureProject`。

  When adding YAML syntax sugar, keep the output as standard `ArchitectureProject`.
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

## 测试架构 / Test Architecture

核心闭环使用三层测试，三层必须分别可执行：

The core loop uses three independently executable test layers:

| 层级 / Layer | 范围 / Scope | 命令 / Command | 主要证据 / Primary Evidence |
| --- | --- | --- | --- |
| 单元 / Unit | IR 契约、Registry 查询、DSL 往返、Validator 规则 / IR contracts, Registry queries, DSL round trip, Validator rules | `pnpm test:unit` | 各核心 package 的 `src/*.test.ts` / each core package's `src/*.test.ts` |
| 集成 / Integration | DSL -> IR -> Registry -> Validator 的进程内组合 / In-process DSL -> IR -> Registry -> Validator composition | `pnpm test:integration` | `packages/cli/src/integration.test.ts` |
| 端到端 / End-to-end | 真实 CLI 子进程、文件输入、stdout/stderr 与退出码 / Real CLI subprocess, file input, stdout/stderr, and exit codes | `pnpm test:e2e` | `packages/cli/src/cli.test.ts` |

`pnpm test` 仍是 workspace 总入口。`agent-runtime`、`apps/server` 和 `apps/web` 当前是占位边界，它们的占位脚本不计入五个核心模块的测试覆盖。

`pnpm test` remains the workspace-wide entry point. `agent-runtime`, `apps/server`, and `apps/web` are currently placeholder boundaries; their placeholder scripts do not count as test coverage for the five core modules.
