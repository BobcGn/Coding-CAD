# 实施日志 / Implementation Log

## 2026-08-08 - Architecture Agent 第一阶段 / Architecture Agent Phase One

状态：已验证。

Status: Verified.

变更：

Changes:

- 新增 `packages/architecture-agent`。
- 实现 LLM Provider 抽象和 Mock Provider。
- 实现需求分析、架构规划、决策生成和 Validator 反馈改进循环。
- 输出 `ArchitectureProject`，不直接输出代码或 YAML。
- 新增单元测试覆盖积分系统设计、决策生成、Validator 集成和 Redis 主存储修正。

- Added `packages/architecture-agent`.
- Implemented the LLM Provider abstraction and Mock Provider.
- Implemented requirement analysis, architecture planning, decision generation, and Validator feedback refinement.
- Outputs `ArchitectureProject`, not source code or YAML directly.
- Added unit tests covering point-system design, decision generation, Validator integration, and Redis primary-storage refinement.

验证：

Validation:

- `pnpm --filter @coding-cad/architecture-agent test`：通过。

- `pnpm --filter @coding-cad/architecture-agent test`: passed.

## 2026-08-15 - Zero-LLM Generation Boundary (P3-D2) / 生成零 LLM 边界（P3-D2）

状态：已验证。

Status: Verified.

按 P3-D2 用户决策移除生成路径的 LLM 调用点：删除 agent.ts 中未使用的 llmProvider 字段与 design() 内的 LLM 调用，删除 src/llm/ 目录与 prompts/architecture-system-prompt.ts，并从 index.ts 移除相关导出。生成流程现完全由 HeuristicRequirementAnalyzer、HeuristicDecisionMaker、HeuristicArchitecturePlanner 与 Validator 反馈循环完成。

Under the P3-D2 user decision, removed LLM call sites from the generation path: deleted the unused llmProvider field and the LLM call inside design() in agent.ts, removed the src/llm/ directory and prompts/architecture-system-prompt.ts, and dropped the related exports from index.ts. Generation is now fully handled by the HeuristicRequirementAnalyzer, HeuristicDecisionMaker, HeuristicArchitecturePlanner, and the Validator feedback loop.

验证：architecture-agent typecheck 0 errors；unit tests 全部通过；全仓无 LLMProvider/MockLLMProvider/llm/ 残留引用。README 与模块日志同步 P3-D2 边界。

Validation: architecture-agent typecheck 0 errors; all unit tests pass; no residual LLMProvider/MockLLMProvider/llm/ references remain in the repository. README and module logs reflect the P3-D2 boundary.
