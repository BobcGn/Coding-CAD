# Coding CAD — Agent Rules & Workflow / 代理规则与工作流

Please read and strictly follow [AGENTS.md](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/AGENTS.md) as the primary engineering rails.

请阅读并严格遵循 [AGENTS.md](file:///Users/bobcgn/AAA_Codings/Personal_Projects/Coding-CAD/AGENTS.md) 作为首要工程轨道。

## Unified Recording Format / 统一记录格式

All PR descriptions, phase exit reports, change records (change-record), and step reports must strictly follow the bilingual three-part structure in order:
1. 做了什么 / What: changes and scope, locatable to commit hashes and file paths.
2. 为什么这么做 / Why: motivation, alternatives considered, tradeoffs, and reasons for rejected options.
3. 验证结果 / Verification: executed commands, actual results, test file paths; categorize as "Implemented and verified / Implemented but unverified / Not implemented"; unverified items and reasons; risks and rollback instructions.

所有 PR 描述、阶段退出报告、变更记录（change-record）、每个步骤的汇报，统一按以下顺序书写，中英双语：
1. 做了什么 / What：改动内容与范围，可定位到提交哈希与文件路径。
2. 为什么这么做 / Why：动机、考虑过的备选方案与取舍、被放弃的方案及原因。
3. 验证结果 / Verification：运行的命令、实际结果、测试文件路径；区分“已实现并验证 / 已实现未验证 / 未实现”；未验证项与原因；风险与回退方式。

## Core Principles / 核心原则

- `ArchitectureProject` in `@coding-cad/architecture-ir` is the sole Architecture Source of Truth. Layout/View State is separate.
- Do not invent acceptance thresholds: record measured numbers, and list them as "requiring user approval".
- Fallback in browser layout is treated as failure; ELK solver is required.
- All in-project markdown must remain bilingual in Chinese and English.
- Verify with `CI=true TURBO_FORCE=true pnpm ci:verify`.
