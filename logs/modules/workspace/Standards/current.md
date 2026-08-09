# 标准 / Standards

- Architecture IR 始终是架构事实来源；Workspace 只保存其生命周期副本和证据。
- `ArchitectureProject.version` 是 IR schema version；Workspace 数字版本是项目架构生命周期 version。
- 历史记录必须关联明确的架构版本。
- Workspace 不生成 Blueprint、不渲染 Agent 指令，也不运行 Agent。
- 文件持久化使用可读 JSON 和原子替换，不引入数据库职责。
