# 标准 / Standards

- Architecture IR 始终是事实来源；Review 保存防御性副本，不修改输入。
- Proposal 必须先提交审核，才能记录批准决定。
- Validator 存在错误时不得批准。
- 每位 Reviewer 对同一 Proposal 只能决定一次。
- Review 只释放批准后的 IR；Blueprint 仍由现有 package 生成。

- Architecture IR remains the source of truth; Review stores defensive copies and never mutates input.
- A proposal must enter review before decisions can be recorded.
- Proposals with Validator errors cannot be approved.
- Each reviewer may decide a proposal once.
- Review only releases approved IR; the existing package still generates Blueprints.
