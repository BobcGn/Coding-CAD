# 标准 / Standards

- Adapter 必须是纯渲染层：不修改 `ExecutionBlueprint`。
- 指导文档中的项目事实、任务、约束、决策、禁止变更和验收标准必须来源于 Blueprint。
- 不生成代码，不绑定外部 Coding Agent SDK 或运行时。
- 新 Adapter 通过 `AgentAdapter` 接口扩展，不能绕过 Blueprint。
