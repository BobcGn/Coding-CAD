# Logging System / 日志体系

Coding CAD adopts a structured project log system inspired by `skill-central/logs`.

Coding CAD 采用参考 `skill-central/logs` 的结构化项目日志体系。

## Purpose / 目的

The log system is the observable memory of architecture work. It records intent, boundaries, standards, state, evidence, and remaining work before implementation details become scattered across chats or commits.

日志体系是架构工作的可观测记忆。它在实现细节散落到对话或提交之前，记录意图、边界、标准、状态、证据和剩余工作。

## Structure / 结构

The root `logs/` directory is the project-level source of truth.

根目录 `logs/` 是项目级事实源。

```text
logs/
  README.md
  Scope/current.md
  Standards/current.md
  State/current.md
  Links/current.md
  Todo/current.md
  implementation-log.md
  modules/
    <module>/
      README.md
      Scope/current.md
      Standards/current.md
      State/current.md
      Links/current.md
      Todo/current.md
      implementation-log.md
```

Module logs use the same shape as the root logs, but they only describe the local module boundary.

模块日志使用与根日志相同的结构，但只描述该模块自己的边界。

## Update Rules / 更新规则

1. Update `Scope/current.md` and `Standards/current.md` before a meaningful implementation slice.
2. Update `State/current.md` only with facts that have been observed or verified.
3. Update `Links/current.md` with files, commands, decisions, and validation evidence.
4. Keep active TODO items in `Todo/current.md`; other logs should reference TODO IDs instead of duplicating the full text.
5. Append historical slices to `implementation-log.md`; do not rewrite old entries.

1. 有意义的实施切片开始前，先更新 `Scope/current.md` 和 `Standards/current.md`。
2. `State/current.md` 只记录已经观察或验证过的事实。
3. `Links/current.md` 记录文件、命令、决策和验证证据。
4. 有效 TODO 统一维护在 `Todo/current.md`，其他日志引用 TODO ID，不重复正文。
5. 历史实施切片追加到 `implementation-log.md`，不要重写旧记录。

## Documentation Language / 文档语言

All log documents are project documentation and must remain bilingual in Chinese and English.

所有日志文档都属于项目文档，必须保持中英双语。

## Git Boundary / Git 边界

The `logs/` directory is a local engineering governance record and is ignored by Git by default.

`logs/` 目录是本地工程治理记录，默认被 Git 忽略。

Public, durable rules about the log system belong in `docs/logging-system.md`; changing current work state belongs in `logs/`.

公开、长期有效的日志体系规则写入 `docs/logging-system.md`；当前工作状态写入 `logs/`。
