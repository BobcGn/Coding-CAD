# 当前实施标准 / Current Implementation Standards

更新时间 / Updated at: 2026-08-08 22:34 CST (Asia/Shanghai)

- Architecture IR 永远是中心输出。
- Agent 不生成业务代码、不修改文件、不部署系统。
- 所有重要架构选择必须生成 `ArchitectureDecision`。
- Agent 必须调用 Validator，并支持根据 Validator issue 改进架构。
- LLM Provider 必须保持模型无关；当前只允许 Mock Provider。

- Architecture IR is always the central output.
- The Agent does not generate business code, mutate files, or deploy systems.
- Every important architecture choice must produce an `ArchitectureDecision`.
- The Agent must call the Validator and support refinement from Validator issues.
- LLM Provider must remain model-agnostic; the current phase only allows Mock Provider.
