# 标准 / Standards

- Validator 只能消费 Analyzer 输出，不能读取 Repository。
- ImplementationModel 复用 ArchitectureProject 表示实际架构，不定义第二套组件或连接模型。
- 每个 ComplianceIssue 必须包含 expectation、evidence 和 recommendation。
- ERROR 阻止通过；WARNING 需要人工确认但不单独阻止。
- 规则通过 ComplianceRule 插件接口扩展，不能在 Engine 中硬编码项目逻辑。

- The Validator only consumes Analyzer output and never reads a Repository.
- ImplementationModel reuses ArchitectureProject for actual architecture rather than defining parallel components or connections.
- Every ComplianceIssue includes expectation, evidence, and recommendation.
- ERROR blocks passing; WARNING requires human attention but does not block alone.
- Rules extend through ComplianceRule instead of hard-coding project logic in the Engine.
