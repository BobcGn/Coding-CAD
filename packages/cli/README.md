# Coding CAD CLI / 命令行入口

`@coding-cad/cli` 提供 Coding CAD 的命令行入口。它不实现业务逻辑，只组合已有核心能力：Architecture DSL、Architecture IR、Component Registry、Architecture Validator 和 Architecture Agent。

`@coding-cad/cli` provides the command-line entry point for Coding CAD. It does not implement business logic; it composes existing core capabilities: Architecture DSL, Architecture IR, Component Registry, Architecture Validator, and Architecture Agent.

## 安装 / Installation

当前仓库内使用 pnpm workspace：

Inside this repository, use pnpm workspace:

```bash
pnpm install
pnpm --filter @coding-cad/cli build
```

构建后可直接运行：

After building, run:

```bash
node packages/cli/dist/index.js --help
```

package 提供 bin：

The package exposes a bin:

```json
{
  "bin": {
    "coding-cad": "dist/index.js"
  }
}
```

## 命令 / Commands

### design

根据用户需求生成 Architecture IR，并通过 Architecture Agent 自动验证和改进。

Generate Architecture IR from a user requirement, then validate and refine it through Architecture Agent.

```bash
coding-cad design "设计一个积分系统，100万用户，积分不能丢失，未来支持活动兑换"
coding-cad design "point system with durable points" --json
coding-cad design "point system with durable points" --yaml
coding-cad design "point system with durable points" --format yaml
```

### validate

分析架构 DSL 并输出验证报告。

Analyze an architecture DSL file and print a validation report.

```bash
coding-cad validate architecture.yaml
coding-cad validate architecture.yaml --json
```

### inspect

查看架构摘要。

Inspect architecture summary.

```bash
coding-cad inspect architecture.yaml
coding-cad inspect architecture.yaml --json
```

### format

格式化 DSL 并输出标准 YAML。

Format DSL and print canonical YAML.

```bash
coding-cad format architecture.yaml
```

## 示例 / Example

```bash
coding-cad validate packages/architecture-dsl/src/examples/point-system.yaml
```

输出形态：

Output shape:

```text
Coding CAD Validation Report

Project:
PointSystem

Components:
[OK] PointService
[OK] PostgreSQL

Issues:
No issues found.

Summary:
Errors: 0
Warnings: 0
Info: 0
```

## 错误处理 / Error Handling

CLI 输出面向人类的错误，不打印 Node.js stack trace。

The CLI prints human-facing errors and does not show Node.js stack traces.

```text
File not found:
test.yaml
```

```text
Architecture DSL Error:
- architecture.components[0].name: missing field
```

## 设计原则 / Design Principles

- CLI 只是入口，不复制核心业务逻辑。
  CLI is only an entry point and does not duplicate core business logic.
- 所有核心能力来自 packages。
  All core capabilities come from packages.
- 默认输出面向人类，`--json` 面向外部系统，`--yaml` 面向 Architecture DSL 交换。
  Default output is human-readable; `--json` is for external systems, and `--yaml` is for Architecture DSL exchange.
- 保持未来扩展空间，例如 `generate`、`agent`、`deploy`。
  Keep room for future commands such as `generate`, `agent`, and `deploy`.

## 测试 / Tests

```bash
pnpm test:integration
pnpm test:e2e
```

集成测试在同一进程内验证 DSL -> IR -> Registry -> Validator。端到端测试启动构建后的真实 CLI，验证文件读取、命令输出、错误流和退出码。

Integration tests verify DSL -> IR -> Registry -> Validator in one process. End-to-end tests launch the built CLI and verify file reads, command output, error streams, and exit codes.
