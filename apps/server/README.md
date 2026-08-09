# Server App / Server 应用

该应用负责暴露 DSL 解析与架构验证 API。

This app exposes DSL parsing and architecture validation APIs.

在 MVP 阶段，它只依赖 `@coding-cad/architecture-dsl` 和 `@coding-cad/architecture-validator`。它不应该成为 Architecture IR 语义的所有者。

For the MVP, it depends on `@coding-cad/architecture-dsl` and `@coding-cad/architecture-validator` only. It should not become the owner of Architecture IR semantics.
