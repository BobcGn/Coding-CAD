# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-11 19:30 CST (Asia/Shanghai)

本文件是仍有效 TODO 的单一事实源。

This file is the single source of truth for active TODOs.

## TODO-001: Architecture IR Schema Hardening / Architecture IR Schema 强化

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: `ArchitectureProject` 和拆分类型文件已完成，尚未加入运行时 schema 校验。
- 解除条件 / Exit condition: 为 IR 增加稳定 schemaVersion 策略、运行时校验和错误定位测试。

## TODO-009: Architecture Agent Real LLM Integration / Architecture Agent 真实 LLM 接入

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: `packages/architecture-agent` 当前使用 Mock Provider 和确定性启发式流程。
- 解除条件 / Exit condition: 定义真实 LLM Provider 的超时、错误处理、结构化输出校验、提示版本和审计记录。

## TODO-010: Architecture Agent Planning Generalization / Architecture Agent 规划泛化

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 第一阶段覆盖积分系统和强一致账本类需求。
- 解除条件 / Exit condition: 扩展更多领域规划模板，并让 Planner 系统性利用 Component Registry 和 Validator 反馈生成架构。

## TODO-011: Additional Agent Adapter Outputs / 更多 Agent Adapter 输出

- 状态 / Status: 部分完成 / Partially complete
- 当前处理 / Current handling: `packages/agent-adapter` 已提供 Generic Markdown、Codex Prompt 和 Claude Code Guide 渲染；尚未提供 Generic JSON、Cursor、Devin 或 GitHub Copilot Agent 格式。
- 解除条件 / Exit condition: 增加受版本化约束的 Generic JSON 与更多外部 Coding Agent Adapter，并保持 Blueprint-only 输入边界。

## TODO-012: Execution Blueprint Task Granularity / Execution Blueprint 任务粒度

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 当前任务由组件、连接和关键约束确定性生成。
- 解除条件 / Exit condition: 定义可配置任务粒度，支持单体、模块化单体和多服务实现风格。

## TODO-005: Web Editor Timing / Web Editor 时机

- 状态 / Status: 已就绪，未开始 / Ready, not started
- 当前处理 / Current handling: D-003、D-008、D-009 已批准；Web app 仍是 TypeScript placeholder，没有实现或安装 UI。
- 解除条件 / Exit condition: 以独立 Phase 2 窄切片初始化获批的 SvelteKit/Svelte Flow 工具链，并按 Checkpoint 3 验收。

## TODO-014: Architecture Layout Contracts / Architecture Layout 契约

- 状态 / Status: Phase 1 已验证 / Phase 1 verified
- 当前处理 / Current handling: Checkpoint 1–2、Incremental/Stability core 与 Ghost core protocol 已通过完整 CI 和边界检查。
- 解除条件 / Exit condition: 已满足；后续产品集成进入独立 Phase 2。

- Status: Phase 1 verified
- Current handling: Checkpoints 1–2, the Incremental/Stability core, and the Ghost core protocol pass full CI and boundary checks.
- Exit condition: Met; later product integration belongs to a separate Phase 2.

## TODO-015: UI / Layout User Decisions / UI / Layout 用户决策

- 状态 / Status: 部分完成 / Partially complete
- 当前处理 / Current handling: D-001、D-002、D-003、D-004、D-005、D-006、D-008、D-009、D-010 已批准；D-007 保持 Phase 5 Ghost presentation 门禁。
- 解除条件 / Exit condition: 在进入各后续功能边界前逐项确认或明确延后剩余 Decision。

- Status: Partially complete
- Current handling: D-001, D-002, D-003, D-004, D-005, D-006, D-008, D-009, and D-010 are approved; D-007 retains the Phase 5 Ghost-presentation gate.
- Exit condition: Confirm or explicitly defer each remaining Decision before entering its later feature boundary.

## TODO-013: Integrated Terminal Infrastructure / 集成终端基础设施

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 仅记录产品宿主路线图；本阶段不实现终端。
- 解除条件 / Exit condition: 在 `apps/web` 产品宿主中提供 xterm.js 或同类视图、PTY bridge、多会话/标签页、repository cwd 绑定，以及 cwd/pid/status/exit status 生命周期记录。
- 边界 / Boundary: 终端只管理 OS Process / PTY，允许用户运行 `codex`、`claude`、`opencode` 或任意 shell；不实现 Agent Provider、Agent Runtime、Agent SDK 调用或调度器。

- Status: Pending
- Current handling: Roadmap only; no terminal is implemented in this phase.
- Exit condition: Provide an xterm.js or equivalent view, PTY bridge, multiple sessions/tabs, repository cwd binding, and cwd/pid/status/exit-status lifecycle records in the `apps/web` product host.
- Boundary: The terminal manages only OS Processes / PTYs and lets users run `codex`, `claude`, `opencode`, or arbitrary shells; it does not implement Agent Providers, an Agent Runtime, Agent SDK invocation, or a scheduler.

## TODO-008: Technology Binding Separation / 技术绑定分层

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: Canonical `ArchitectureProject` 以逻辑组件为主，但 Validator 仍通过兼容字段、组件 ID 或名称识别 Registry 中的具体技术。
- 解除条件 / Exit condition: 在不污染 Architecture IR 的前提下，定义上层技术选择/绑定契约，并让 DSL、Validator 和未来 Architecture Agent 通过该契约协作。

- Status: Pending
- Current handling: Canonical `ArchitectureProject` is centered on logical components, but the Validator still recognizes concrete Registry technologies through compatibility fields, component ids, or names.
- Exit condition: Define an upper-layer technology selection/binding contract that keeps Architecture IR technology-independent and is shared by DSL, Validator, and the future Architecture Agent.
