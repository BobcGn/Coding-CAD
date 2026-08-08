# Architecture DSL / 架构描述语言

`@coding-cad/architecture-dsl` 定义 Coding CAD 的 YAML 架构描述语言，并提供 YAML 与 `ArchitectureProject` 的双向转换。

`@coding-cad/architecture-dsl` defines Coding CAD's YAML architecture description language and provides bidirectional conversion between YAML and `ArchitectureProject`.

## 是什么 / What It Is

Architecture DSL 是人类、AI Agent、可视化编辑器和系统持久化共同使用的软件架构交换格式。

Architecture DSL is the software architecture exchange format shared by humans, AI Agents, visual editors, and system persistence.

它描述架构意图，而不是代码或部署配置。

It describes architecture intent, not code or deployment configuration.

## 为什么需要 / Why It Exists

Architecture IR 是系统内部的强类型模型；DSL 是面向人类和外部工具的可读表示。两者表达同一份架构语义。

Architecture IR is the internal strongly typed model; DSL is the readable representation for humans and external tools. Both express the same architecture semantics.

```text
YAML DSL
  -> Architecture IR
  -> Component Knowledge
  -> Architecture Validator
  -> Architecture Report
```

## 核心 API / Core API

```ts
import { parseDSL, generateDSL } from "@coding-cad/architecture-dsl";

const project = parseDSL(yamlSource);
const yaml = generateDSL(project);
```

## DSL 结构 / DSL Shape

```yaml
version: "0.1"
project:
  name: PointSystem
  intent:
    purpose:
      - Reward users with auditable points.
    scale:
      users: 100000
      peakQps: 1000
    requirements:
      consistency: strong
      availability: "99.9%"
domain:
  entities:
    - name: PointAccount
      fields:
        - name: balance
          type: Integer
architecture:
  components:
    - id: point-service
      name: PointService
      type: service
    - id: postgres
      name: PostgreSQL
      type: database
      capabilities:
        - transaction
        - strong-consistency
  connections:
    - from: point-service
      to: postgres
      protocol: SQL
constraints:
  - type: consistency
    value: strong
    description: Point balance cannot lose data.
decisions:
  - title: Use PostgreSQL
    context: Point transactions require consistency.
    decision: Use relational database.
    rationale: Transaction support.
evolution:
  phases:
    - name: v1
      changes:
        - PostgreSQL storage
```

## 错误处理 / Error Handling

Parser 会抛出 `ArchitectureDSLError`，错误信息使用 YAML 路径，便于人类修复。

The parser throws `ArchitectureDSLError` with YAML paths that humans can fix directly.

```text
Architecture DSL Error:
- architecture.components[0].name: missing field
```

## 示例 / Example

完整示例见 [`src/examples/point-system.yaml`](src/examples/point-system.yaml)。

See [`src/examples/point-system.yaml`](src/examples/point-system.yaml) for a complete example.

## 当前边界 / Current Boundary

本模块只实现 Architecture DSL Layer：Parser、Generator、Schema Validation 和 YAML serialization。

This module implements only the Architecture DSL Layer: parser, generator, schema validation, and YAML serialization.

不实现 AI Agent、UI 编辑器、Code Generator 或 Validator。

It does not implement AI Agent, UI editor, Code Generator, or Validator.
