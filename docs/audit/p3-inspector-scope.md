# P3 Inspector Scope Audit / P3 Inspector 范围审计

日期 / Date: 2026-10-16。范围：当前 Phase 3 分支；不新增 IR 语义、package、Ghost 或完整 Review 工作区。 / Scope: the current Phase 3 branch; no new IR semantics, package, Ghost, or full Review workspace.

## Approved wording / 已批准原文

来源：`docs/architecture-layout-decisions.md` 的 Phase 3 Planning Gates，P3-D3 标记 APPROVED — 2026-08-15 (user)。 / Source: Phase 3 Planning Gates in `docs/architecture-layout-decisions.md`, P3-D3 marked APPROVED — 2026-08-15 (user).

> App-private field-specific commands; no generic patch / app-private field-specific command；禁止 generic patch

同节补充：P3-D3 不新增 Architecture IR 语义；如需当前 IR 不存在的字段，必须停止并另行决策。它没有列出必须编辑的字段清单，也没有单独列出 contract editing。 / The same section prohibits new IR semantics and requires a separate decision for fields absent from IR. It enumerates neither editable fields nor contract editing.

`docs/ui-v1-execution-plan.md` Phase 3 Scope 则明确列出 Component Palette、semantic Inspector、contract editing；P3.5 Goal 提到 semantics、capabilities、contracts 与 validation issues。不能据 P3-D3 的粒度决定单独推导完整字段范围，也不能忽略主计划的契约编辑要求。 / Phase 3 Scope explicitly includes contract editing; the P3.5 Goal mentions semantics, capabilities, contracts, and validation issues. Command granularity alone does not establish a full field scope or erase the master-plan requirement.

## Requirement-by-requirement audit / 逐条审计

| Requirement / 要求 | Before closeout / 收尾前 | Current implementation and evidence / 当前实现与依据 |
| --- | --- | --- |
| App-private field-specific commands / app 私有字段命令 | 已实现并有命令测试 / Implemented with command tests | `architecture/commands/architecture-command.ts`, `apply-inspector-command.test.ts`; no package API added / 未新增 package API |
| No generic patch / 禁止通用 patch | 已实现；命令为显式联合类型 / Explicit command union already implemented | 同上；没有任意字段 patch / Same files; no arbitrary-field patch |
| No new IR semantics / 不扩展 IR | 已实现 / Implemented | `packages/architecture-ir/src/contract.ts` unchanged; uses existing Contract / 使用既有 Contract |
| Description editing / 描述编辑 | 已实现并有命令、产品 E2E 测试，但旧 synthetic click 掩盖响应式异常 / Command and E2E existed, synthetic click hid a reactive exception | `+page.svelte`, `canvas.spec.ts`; now real clicks and pageerror assertions / 现用真实点击及异常断言 |
| Type editing / 类型编辑 | 命令有测试，UI 只读 / Tested command, read-only UI | Type selector now emits existing command; pure command tested; dedicated UI interaction not separately tested / 现有类型选择器走既有命令；独立 UI 操作尚无专门测试 |
| Capability add/remove / 能力新增移除 | 已实现并有命令测试 / Implemented with command tests | `apply-inspector-command.test.ts`, `+page.svelte`; product approvals share the tested gate / 产品共用已测门禁 |
| Limitation add / 限制新增 | 命令有测试，UI 未提供 / Tested command, no UI | Now displays limitations and exposes existing add command; dedicated UI interaction not separately tested / 现有展示和新增入口；独立 UI 操作尚无专门测试 |
| Contract projection / 契约投影 | View model 已实现，UI 未显示 / Implemented view model, absent UI | `greenfield/inspector.ts`, `+page.svelte` displays contracts / 现显示契约 |
| Contract add/remove / 契约新增移除 | 未实现 / Not implemented | Two explicit commands; structural Validator rule; controller approval tests and Save/Open E2E / 两条命令、结构规则、controller 审批与往返 E2E |
| Validation issue projection/navigation / 问题投影导航 | 已实现并有测试，导航仅更改选择 / Implemented and tested | `projectInspector`, `canvas.spec.ts`; now also refreshes Inspector on problem navigation / 现同时刷新 Inspector |
| Validator and Review boundary / 校验审批边界 | Generated Accept empty; commands auto-approved / 生成接受为空实现，编辑自动批准 | All product edits prepare candidates, validate, then require local-user rationale and explicit approval / 产品编辑均先生成候选并经校验、用户理由和显式审批 |

App-relative paths above are under `apps/web/src/lib/`, except `+page.svelte` under `apps/web/src/routes/` and E2E under `apps/web/e2e/`. / 上述 app 路径按这些目录解析。

## Contract decision and minimal delivery / 契约结论与最小交付

审计结论：缺少契约编辑与 Phase 3 Scope/P3.5 不一致，但 P3-D3 本身没有字段枚举，存在范围解释歧义。2026-10-16 用户已明确选择“作为阶段3缺口补齐契约编辑”，解除本次实现歧义；已追加到原 Decision 文件，不改写历史批准内容。 / Finding: missing contract editing conflicts with Phase 3 Scope/P3.5, while P3-D3 itself has no field enumeration. On 2026-10-16 the user explicitly chose to close contract editing as a Phase 3 gap. This clarification is appended to the existing decision file without rewriting history.

新增两条 app-private 命令：`inspector-add-contract` 与 `inspector-remove-contract`。UI 最小编辑面为 name/protocol 的新增及删除；不提供输入输出 schema 的图形编辑器，也不增加 IR 字段。命令保留既有 Contract 的输入输出 schema；controller 测试验证 schema 不丢失。新增 `contractIntegrityRule` 检查非空及唯一名称、既有协议集合和 schema 字段结构；它不证明实际接口实现或运行时兼容。

Two app-private commands add/remove existing Contracts. The minimal UI adds name/protocol and removes contracts; it has no input/output schema editor and adds no IR fields. Commands retain existing Contract schemas, tested through the production controller. The structural rule checks nonempty/unique names, existing protocols, and schema fields, not implementation or runtime compatibility.

原备选为 (a) 按 P3-D3 粒度视为满足并明确延后契约编辑；(b) 阶段3补齐，估算两条命令、一类结构规则、命令/门禁/浏览器往返测试。用户已选择 (b)，不再列为未决事项。 / Original alternatives were (a) accept command granularity and explicitly defer contracts, or (b) add two commands, one structural rule, and command/gate/browser round-trip tests. The user selected (b); it is resolved.

## Validation / 验证

源码编译与实际命令结果记录在 `logs/modules/web/implementation-log.md` 和阶段3退出报告；不把“存在测试”写成“当前测试通过”。 / Source-build command results are recorded in the Web implementation log and Phase 3 exit report; test presence is not treated as a passing run.
