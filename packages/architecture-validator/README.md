# Architecture Validator / 架构验证器

`@coding-cad/architecture-validator` 根据 Architecture IR 和 Component Registry 自动分析软件架构设计，发现潜在问题，并提供可解释的优化建议。

`@coding-cad/architecture-validator` analyzes software architecture designs using Architecture IR and Component Registry, finds potential problems, and returns explainable improvement suggestions.

## 是什么 / What It Is

Validator 检查的是 Architecture Correctness，而不是代码风格、部署配置或具体实现。

The validator checks Architecture Correctness, not code style, deployment configuration, or implementation details.

它回答的问题是：

It answers:

> 这个架构设计是否符合它声明的目标？  
> Does this architecture design satisfy its declared goals?

## 为什么需要 / Why It Exists

Architecture IR 描述项目意图和架构结构。Component Registry 描述组件能力、限制和使用建议。Validator 把两者结合起来，生成 Architecture Review Report。

Architecture IR describes project intent and architecture structure. Component Registry describes component capabilities, limitations, and recommendations. The validator combines them into an Architecture Review Report.

## 工作流 / Workflow

```text
ArchitectureProject
  -> ValidatorContext
  -> ValidationRule[]
  -> ValidationResult
```

Validator 只分析，不修改架构。未来 Architecture Agent 可以读取 `ValidationResult`，再决定是否提出修改方案。

The validator analyzes only; it does not modify architecture. Future Architecture Agents can read `ValidationResult` and decide whether to propose changes.

## 核心接口 / Core Interfaces

```ts
type Severity = "INFO" | "WARNING" | "ERROR";

interface ValidationIssue {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affectedComponent?: string;
  suggestion?: string;
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate(context: ValidatorContext): ValidationIssue[];
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: string;
}
```

## 内置规则 / Built-In Rules

- Component Capability Validation / 组件能力匹配检查
- Component Limitation Validation / 组件限制检查
- Architecture Graph Integrity / 架构图完整性检查
- Consistency Rule / 一致性要求检查
- Dependency Cycle Rule / 组件循环依赖检查
- Scale Rule / 规模规划提示

## 使用示例 / Usage Example

```ts
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";

const validator = new ArchitectureValidator();
const result = validator.validate(project);

if (!result.valid) {
  console.log(result.summary);
  console.log(result.issues);
}
```

## 与 Architecture IR 的关系 / Relationship to Architecture IR

Validator 从 `ArchitectureProject` 读取项目目标、组件、连接、约束和决策。它不会把具体技术知识写入 IR，也不会自动修改 IR。

The validator reads project goals, components, connections, constraints, and decisions from `ArchitectureProject`. It does not write concrete technology knowledge into IR and does not mutate IR.

## 与 Component Registry 的关系 / Relationship to Component Registry

Validator 使用 Component Registry 判断组件是否具备某种能力、是否存在限制，以及哪些场景需要人类决策。

The validator uses Component Registry to determine whether a component has a capability, carries a limitation, or needs explicit human decision.

示例：

Example:

- Redis has `cache` and `high-performance-read`.
- Redis has `not-primary-storage` and `weak-consistency`.
- PostgreSQL has `transaction` and `strong-consistency`.

因此当积分余额声明强一致并把 Redis 作为主存储时，Validator 可以输出可解释的问题，而不是只说架构无效。

Therefore, when point balance requires strong consistency but Redis is used as primary storage, the validator can produce an explainable issue instead of only saying the architecture is invalid.

## 扩展方向 / Extension Direction

规则是插件化的。调用方可以传入自定义 `ValidationRule[]`：

Rules are pluggable. Callers can provide custom `ValidationRule[]`:

```ts
const validator = new ArchitectureValidator([
  customRule
]);
```

第一阶段不实现 AI Agent、DSL Parser、UI 或 Code Generator。

The first phase does not implement AI Agent, DSL Parser, UI, or Code Generator.

## 测试 / Tests

- `pnpm --filter @coding-cad/architecture-validator test:unit`：验证规则执行、严重级别、图完整性和可解释建议。  
  Verifies rule execution, severity, graph integrity, and explainable suggestions.
- `pnpm test:integration`：验证 DSL、IR、Registry 与 Validator 的跨层组合。  
  Verifies cross-layer composition of DSL, IR, Registry, and Validator.
