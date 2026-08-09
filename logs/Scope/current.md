# 当前范围 / Current Scope

更新时间 / Updated at: 2026-08-09 22:22 CST (Asia/Shanghai)

## 本轮目标 / Current Objective

1. 删除职责重复且未实现的 `packages/agent-runtime` 占位包。
2. 明确 Coding CAD 与用户管理的外部 Coding Agent 之间的协议和进程边界。
3. 在 `apps/web` 路线图中记录 Integrated Terminal Infrastructure，但不实现终端。
4. 保持现有 Architecture IR、Review、Blueprint、Adapter、Analyzer 和 Validator 链路不变。

1. Remove the unimplemented, responsibility-duplicating `packages/agent-runtime` placeholder.
2. Define the protocol and process boundary between Coding CAD and user-managed external Coding Agents.
3. Record Integrated Terminal Infrastructure in the `apps/web` roadmap without implementing it.
4. Preserve the existing Architecture IR, Review, Blueprint, Adapter, Analyzer, and Validator pipeline.

## 边界 / Boundaries

- 不实现 Coding Agent、Code Generator、Web UI 或部署能力。
- Agent Adapter 第一阶段只渲染 Generic Markdown、Codex Prompt 和 Claude Code Guide，不调用具体 Agent。
- 不实现或编排 Coding Agent，不引入 Agent Provider、Executor、Memory、Tool Call 或 Scheduler 抽象。
- `agent-adapter` 仍是 Blueprint 到 Guide / Prompt 的纯渲染器。
- Integrated Terminal 仅属于未来 app host 的 OS Process / PTY 基础设施。
- 不把 app 占位 test 脚本误记为核心测试覆盖。
- Validator 只分析架构，不自动修改 Architecture IR；改进逻辑由 Architecture Agent 读取反馈后执行。

- Do not implement a Coding Agent, Code Generator, Web UI, or deployment capability.
- Agent Adapter phase one renders Generic Markdown, Codex Prompt, and Claude Code Guide only; it does not call a concrete Agent.
- Do not implement or orchestrate Coding Agents, or add Agent Provider, Executor, Memory, Tool Call, or Scheduler abstractions.
- `agent-adapter` remains a pure Blueprint-to-Guide/Prompt renderer.
- The Integrated Terminal belongs only to future app-host OS Process / PTY infrastructure.
- Do not count app placeholder test scripts as core test coverage.
- The Validator only analyzes architecture and never mutates Architecture IR automatically; refinement is done by Architecture Agent after reading feedback.

## 验收标准 / Acceptance Criteria

- `packages/` 与 `logs/modules/` 的模块映射清晰且无旧名称重复目录。
- 十二个核心模块都有实现、README、模块日志和对应测试证据。
- `packages/agent-runtime` 及其 workspace、锁文件、日志和文档映射已删除。
- 项目文档明确 Coding CAD 不拥有 Coding Agent Runtime。
- `pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e` 可分别运行。
- `pnpm build`、`pnpm typecheck`、`pnpm test` 从无缓存执行通过。

- The `packages/` to `logs/modules/` mapping is clear and has no legacy-name duplicate directories.
- Each of the twelve core modules has implementation, README, module logs, and corresponding test evidence.
- `packages/agent-runtime` and its workspace, lockfile, log, and documentation mappings are removed.
- Project documentation explicitly states that Coding CAD does not own the Coding Agent Runtime.
- `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` run independently.
- `pnpm build`, `pnpm typecheck`, and `pnpm test` pass without cached task results.
