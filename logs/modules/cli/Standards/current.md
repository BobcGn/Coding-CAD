# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-08 21:42 CST (Asia/Shanghai)

- CLI 只是入口层，不复制 DSL、Validator 或 Registry 逻辑。
- 默认输出面向人类，`--json` 面向外部系统。
- 文件和 DSL 错误不得输出 Node.js stack trace。
- 命令保持可扩展。

- CLI is only an entry layer and must not duplicate DSL, Validator, or Registry logic.
- Default output is for humans; `--json` is for external systems.
- File and DSL errors must not print Node.js stack traces.
- Commands should remain extensible.
