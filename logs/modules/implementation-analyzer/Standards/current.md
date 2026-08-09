# 标准 / Standards

- Architecture IR 是唯一架构输出，不建立平行架构模型。
- 推断必须保留 evidence 和 confidence，不能伪装为已确认事实。
- Scanner 必须跳过依赖、构建产物和版本控制目录。
- Analyzer 只读取仓库，不修改任何输入文件。
- Implementation Analyzer 回答“实现现在是什么”，不承担未来 Implementation Validator 的合规判断。

- Architecture IR is the sole architecture output; no parallel architecture model is allowed.
- Inference must preserve evidence and confidence rather than masquerading as confirmed fact.
- The Scanner must skip dependencies, build output, and version-control directories.
- The Analyzer only reads repositories and never mutates input files.
- Implementation Analyzer answers “what exists now”; future Implementation Validator owns compliance decisions.
