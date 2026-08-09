# `@coding-cad/implementation-validator`

`implementation-validator` 是 Architecture Compliance Verification Layer。它比较批准的 Architecture IR 与 Implementation Analyzer 产出的实际 Architecture IR 和 evidence，判断 Coding Agent 的实现是否偏离设计。

`implementation-validator` is the Architecture Compliance Verification Layer. It compares approved Architecture IR with actual Architecture IR and evidence produced by Implementation Analyzer to determine whether Coding Agent output has drifted from design.

## 数据流 / Data Flow

```text
Approved Architecture IR + optional Execution Blueprint
                         |
Implementation Analyzer -> ImplementationModel
                         |
                         v
               Implementation Validator
                         |
                         v
                 Compliance Report
```

`ImplementationModel` 只是 Analyzer inspection 与 Analyzer 输出 `ArchitectureProject` 的组合，不定义第二套 Component 或 Connection 类型。

`ImplementationModel` only combines Analyzer inspection with the Analyzer-produced `ArchitectureProject`; it does not define a second Component or Connection vocabulary.

## 第一阶段规则 / Phase-One Rules

- Component Existence：缺少批准组件时输出 ERROR。
- Technology Compliance：检测到技术替换时输出 WARNING。
- Component Capability Constraint：实现违反组件 limitation 时输出 ERROR，例如 Redis 成为 source of truth。
- Dependency Compliance：实现依赖不在批准架构图中或必要连接缺失时输出 WARNING。
- Contract Compliance：批准的 contract/interface 缺失或协议不匹配时输出 ERROR。

- Component Existence emits ERROR when an approved component is missing.
- Technology Compliance emits WARNING for detected technology substitution.
- Component Capability Constraint emits ERROR when implementation violates component limitations, such as Redis becoming the source of truth.
- Dependency Compliance emits WARNING for unapproved dependencies or missing required connections.
- Contract Compliance emits ERROR for missing approved contracts/interfaces or protocol mismatches.

所有 Issue 都包含 architecture expectation、implementation evidence 和 recommendation，避免不可解释的 “implementation invalid”。Report 只有在不存在 ERROR 时 `passed=true`；WARNING 表示需要人工确认，但不会单独阻断。

Every issue includes architecture expectation, implementation evidence, and recommendation instead of an opaque “implementation invalid.” A report passes when no ERROR exists; WARNING requires human attention but does not block by itself.

## 与其他 Validator 的区别 / Difference from Architecture Validator

Architecture Validator 输入 Architecture IR，检查设计本身是否合理，例如 Redis 是否适合作为积分主存储。

Architecture Validator consumes Architecture IR and checks whether the design itself is sound, such as whether Redis is suitable as primary point storage.

Implementation Validator 输入批准的 Architecture IR、Analyzer 的 ImplementationModel 和可选 Blueprint，检查代码实现是否真的遵守设计，例如实际依赖是否使用 PostgreSQL。

Implementation Validator consumes approved Architecture IR, Analyzer ImplementationModel, and an optional Blueprint to check whether code actually follows the design, such as whether PostgreSQL is really used.

## 边界与未来 / Boundaries and Future

本模块不扫描文件、不解析源码、不执行 AST 分析、不识别技术栈，也不修改代码、生成 PR、调用 Coding Agent 或实现 IDE 插件。未来 AI Auto Remediation 必须作为独立、人工授权的后续流程消费 Compliance Report，不能进入 Validator 规则层。

This package does not scan files, parse source, perform AST analysis, detect technology, mutate code, generate PRs, invoke Coding Agents, or implement IDE plugins. Future AI Auto Remediation must consume Compliance Reports as a separate human-authorized workflow and must not enter the Validator rule layer.
