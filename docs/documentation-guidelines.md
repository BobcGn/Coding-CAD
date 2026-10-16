# Documentation Guidelines / 文档规范

项目文档必须始终中英双语。

Project documentation must always be bilingual in Chinese and English.

## Rule / 规则

任何新增或修改的 Markdown 文档，都需要同时提供中文和英文表达。

Any new or modified Markdown document must provide both Chinese and English wording.

推荐格式是先中文、后英文；对于短列表，可以使用 `中文 / English` 的并列表达。

The preferred format is Chinese first, then English. For short lists, use paired `中文 / English` wording.

## Scope / 范围

该规则适用于 README、`docs/` 下的文档、app/package 说明文档，以及未来的设计说明。

This rule applies to README files, documents under `docs/`, app/package documentation, and future design notes.

## Reason / 原因

Coding CAD 的设计意图需要同时服务中文产品思考和英文工程生态。

Coding CAD needs to support Chinese product thinking and the English engineering ecosystem at the same time.

## Comment Philosophy / 注释哲学

本项目采用《软件设计的哲学》中强调的文档观：注释和文档应该降低认知负担，描述代码本身无法清楚表达的信息。

This project follows the documentation view emphasized by *A Philosophy of Software Design*: comments and documentation should reduce cognitive load by describing information the code cannot express clearly by itself.

## What to Document / 应该记录什么

- 模块存在的原因和边界 / Why a module exists and where its boundary is
- public API 的调用契约、输入形态和输出保证 / Public API contracts, accepted input shapes, and output guarantees
- 架构约束、不变量和设计取舍 / Architecture constraints, invariants, and design tradeoffs
- 兼容策略，例如 snake_case 与 camelCase 的同时支持 / Compatibility strategies, such as supporting both snake_case and camelCase
- 诊断规则背后的风险原因 / The risk behind a diagnostic rule

## What to Avoid / 应该避免什么

- 复述变量名或语句本身已经表达的内容 / Repeating what variable names or statements already say
- 为了显得完整而给简单代码添加噪音注释 / Adding noisy comments to simple code for the appearance of completeness
- 只描述“做了什么”，却不解释“为什么这么做” / Describing only what happens without explaining why
- 让 Markdown、示例和 TypeScript 类型长期表达不同语义 / Letting Markdown, examples, and TypeScript types drift into different meanings

## Maintenance Rule / 维护规则

当修改 `packages/` 下的核心契约时，需要同步检查三类文档：根 README 的总体说明、`packages/README.md` 的模块边界，以及相关 public type 或 public function 的注释。

When changing a core contract under `packages/`, check three documentation surfaces together: the root README overview, `packages/README.md` module boundaries, and comments on related public types or public functions.

## Unified Recording Format / 统一记录格式

所有 PR 描述、阶段退出报告、变更记录（change-record）、每个步骤的汇报，统一按以下顺序书写，中英双语：
1. 做了什么 / What：改动内容与范围，可定位到提交哈希与文件路径。
2. 为什么这么做 / Why：动机、考虑过的备选方案与取舍、被放弃的方案及原因。
3. 验证结果 / Verification：运行的命令、实际结果、测试文件路径；区分“已实现并验证 / 已实现未验证 / 未实现”；未验证项与原因；风险与回退方式。

All PR descriptions, phase exit reports, change records (change-record), and step reports must strictly follow the bilingual three-part structure in order:
1. 做了什么 / What: changes and scope, locatable to commit hashes and file paths.
2. 为什么这么做 / Why: motivation, alternatives considered, tradeoffs, and reasons for rejected options.
3. 验证结果 / Verification: executed commands, actual results, test file paths; categorize as "Implemented and verified / Implemented but unverified / Not implemented"; unverified items and reasons; risks and rollback instructions.

