# 当前 TODO / Current TODO

更新时间 / Updated at: 2026-08-08 21:56 CST (Asia/Shanghai)

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
