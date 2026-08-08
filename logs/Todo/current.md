# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-09 00:35 CST (Asia/Shanghai)

本文件是仍有效 TODO 的单一事实源。

This file is the single source of truth for active TODOs.

## TODO-001: Architecture IR Schema Hardening / Architecture IR Schema 强化

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: `ArchitectureProject` 和拆分类型文件已完成，尚未加入运行时 schema 校验。
- 解除条件 / Exit condition: 为 IR 增加稳定 schemaVersion 策略、运行时校验和错误定位测试。

## TODO-004: Agent Runtime Contract / Agent Runtime 契约

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 已有 Architecture/Coding/Testing Agent 的最小边界类型。
- 解除条件 / Exit condition: 定义 Agent 输入输出协议、任务生命周期、人工决策点和可审计 artifact。

## TODO-009: Architecture Agent Real LLM Integration / Architecture Agent 真实 LLM 接入

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: `packages/architecture-agent` 当前使用 Mock Provider 和确定性启发式流程。
- 解除条件 / Exit condition: 定义真实 LLM Provider 的超时、错误处理、结构化输出校验、提示版本和审计记录。

## TODO-010: Architecture Agent Planning Generalization / Architecture Agent 规划泛化

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 第一阶段覆盖积分系统和强一致账本类需求。
- 解除条件 / Exit condition: 扩展更多领域规划模板，并让 Planner 系统性利用 Component Registry 和 Validator 反馈生成架构。

## TODO-011: Execution Blueprint Adapter Outputs / Execution Blueprint 适配器输出

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: `packages/execution-blueprint` 当前只实现内部模型和确定性生成器。
- 解除条件 / Exit condition: 增加 Codex Prompt Markdown、Claude Code Guide Markdown 和 Generic Agent Instruction JSON 渲染器。

## TODO-012: Execution Blueprint Task Granularity / Execution Blueprint 任务粒度

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: 当前任务由组件、连接和关键约束确定性生成。
- 解除条件 / Exit condition: 定义可配置任务粒度，支持单体、模块化单体和多服务实现风格。

## TODO-005: Web Editor Timing / Web Editor 时机

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: Web app 仍是 IR view shell，没有实现拖拽界面。
- 解除条件 / Exit condition: 在 DSL/IR/Validator 更稳定后，再设计 React Flow 编辑器的最小可用视图。

## TODO-008: Technology Binding Separation / 技术绑定分层

- 状态 / Status: 待处理 / Pending
- 当前处理 / Current handling: Canonical `ArchitectureProject` 以逻辑组件为主，但 Validator 仍通过兼容字段、组件 ID 或名称识别 Registry 中的具体技术。
- 解除条件 / Exit condition: 在不污染 Architecture IR 的前提下，定义上层技术选择/绑定契约，并让 DSL、Validator 和未来 Architecture Agent 通过该契约协作。

- Status: Pending
- Current handling: Canonical `ArchitectureProject` is centered on logical components, but the Validator still recognizes concrete Registry technologies through compatibility fields, component ids, or names.
- Exit condition: Define an upper-layer technology selection/binding contract that keeps Architecture IR technology-independent and is shared by DSL, Validator, and the future Architecture Agent.
