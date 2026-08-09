# 当前范围 / Current Scope

更新时间 / Updated at: 2026-08-09 00:35 CST (Asia/Shanghai)

## 本轮目标 / Current Objective

1. 实现下一核心模块 `packages/agent-adapter`。
2. 建立 Execution Blueprint 到外部 Coding Agent 指导文档的适配层。
3. 同步 `packages/` 与 `logs/` 的当前事实和模块边界。
4. 保持单元、集成、端到端三层测试入口和 CI/CD 门禁可追溯。

1. Implement the next core module, `packages/agent-adapter`.
2. Establish the adapter layer from Execution Blueprint to external Coding Agent instructions.
3. Synchronize current facts and module boundaries across `packages/` and `logs/`.
4. Keep unit, integration, end-to-end test entry points and CI/CD gates traceable.

## 边界 / Boundaries

- 不实现 Coding Agent、Code Generator、Web UI 或部署能力。
- Agent Adapter 第一阶段只渲染 Generic Markdown、Codex Prompt 和 Claude Code Guide，不调用具体 Agent。
- `agent-runtime` 继续保持未来编排边界，不承载具体架构推理逻辑。
- 不把 app 占位 test 脚本误记为核心测试覆盖。
- Validator 只分析架构，不自动修改 Architecture IR；改进逻辑由 Architecture Agent 读取反馈后执行。

- Do not implement a Coding Agent, Code Generator, Web UI, or deployment capability.
- Agent Adapter phase one renders Generic Markdown, Codex Prompt, and Claude Code Guide only; it does not call a concrete Agent.
- `agent-runtime` remains a future orchestration boundary and does not contain concrete architecture reasoning.
- Do not count app placeholder test scripts as core test coverage.
- The Validator only analyzes architecture and never mutates Architecture IR automatically; refinement is done by Architecture Agent after reading feedback.

## 验收标准 / Acceptance Criteria

- `packages/` 与 `logs/modules/` 的模块映射清晰且无旧名称重复目录。
- 八个核心模块都有实现、README、模块日志和对应测试证据。
- Agent Adapter 能从 Execution Blueprint 生成 Generic Markdown、Codex Prompt 和 Claude Code Guide。
- `pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e` 可分别运行。
- `pnpm build`、`pnpm typecheck`、`pnpm test` 从无缓存执行通过。

- The `packages/` to `logs/modules/` mapping is clear and has no legacy-name duplicate directories.
- Each of the eight core modules has implementation, README, module logs, and corresponding test evidence.
- Agent Adapter can generate Generic Markdown, Codex Prompt, and Claude Code Guide from an Execution Blueprint.
- `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` run independently.
- `pnpm build`, `pnpm typecheck`, and `pnpm test` pass without cached task results.
