# Phase 3 Exit Report / 阶段3退出报告

日期 / Date: 2026-10-16
分支 / Branch: codex/phase-3-greenfield-workspace
本轮基线 / This run baseline: 2e4a500
结论 / Conclusion: **READY TO EXIT IN DEFINED PHASE 3 SCOPE / 定义的阶段3范围满足退出条件**。当前分支未合并；本任务未实施或授权Phase 4。 / The current branch is unmerged; this task neither implements nor authorizes Phase 4.

## 1. Completed / 已完成

原收尾记录的浏览器ELK阻塞已关闭。固定elkjs@0.12.0补丁修复内嵌worker的CJS初始化分支；普通production和dev实际Worker均返回success、空diagnostics与3条路由。所有浏览器测试拒绝fallback并禁用重试。 / The historical ELK blocker is closed by a pinned CJS initialization fix. Actual workers succeed in ordinary production and dev, with empty diagnostics and three routes. Every browser test rejects fallback without retry masking.

原审批、Add/Remove/Connect、Inspector最小Contract增删及Save/Open能力仍在本轮源码CI与双模式E2E中通过；local-user+必填理由、拒绝保留候选等用户批准语义未变。ArchitectureProject仍为唯一事实源，架构、候选/正式布局与UI状态分离。 / Existing approved product workflows pass the current source CI and both browser suites; approval semantics and architecture/layout ownership remain unchanged.

ELK成功后暴露的两项布局缺陷已最小修复：adapter转换绝对/父相对坐标；Stability pass避免新增无连接组件覆盖保留位置，并扩展受影响容器。均有回归，不增加solver/public API/worker语义。 / Successful ELK exposed two geometry defects: parent-relative projection and newcomer collision after stabilization. Narrow fixes and regressions preserve solver, public APIs and worker semantics.

## 2. Acceptance Criteria Result / 验收结果

| Criterion / 标准 | State / 状态 | Evidence / 证据 |
| --- | --- | --- |
| Requirement → candidate → Validator → Review → accepted IR | 已实现并验证 / Implemented and verified | apps/web/src/lib/architecture/greenfield/review-gate.test.ts; candidate-flow.test.ts; apps/web/e2e/canvas.spec.ts |
| Invalid/rejected/duplicate/error approval invariants / 无效、拒绝、重复与错误审批不变量 | 已实现并验证 / Implemented and verified | review-gate.test.ts exercises production controller / 走真实controller |
| Add/Remove/Connect and contracts with Save/Open / 编辑、契约和往返 | 已实现并验证 / Implemented and verified | apps/web/e2e/editing.spec.ts checks actual architecture sets / 断言真实架构集合 |
| Ordinary dev and production ELK / 普通双模式solver成功 | 已实现并验证 / Implemented and verified | [final modes](../logs/validation/p3-closeout/elk-browser/final-release-modes.json) |
| No fallback accepted by CI / CI禁止退化通过 | 已实现并验证 / Implemented and verified | apps/web/e2e/layout-fixture.ts; solver.spec.ts; [expected-failing negative control](../logs/validation/p3-closeout/elk-browser/negative-browser.txt) |
| Default layout readable without manual arrangement / 默认布局无需手动整理 | 已实现并验证于两fixture / Verified for two fixtures | No overlap, proper containment, deterministic; [quality report + screenshots](../logs/validation/p3-closeout/elk-browser/quality-report.md) / 无重叠、正确包含、确定 |
| Real-browser incremental locality / 浏览器增量稳定性 | 已实现并验证于描述编辑与Palette添加 / Verified for description edit and palette addition | apps/web/e2e/layout-quality.spec.ts; p95/max=0/0px, no order reversal / 无顺序反转 |
| Fresh source and full CI / 当前源码与完整CI | 已实现并验证 / Implemented and verified | [ordered results](../logs/validation/p3-closeout/elk-browser/verification/results.json), zero cached tasks / 零缓存 |
| Large browser graphs, other browsers/mobile, deployment / 大图浏览器、多平台、部署 | 已实现能力未验证这些情形 / Implemented capability, these cases unverified | No such claim / 不作通过声明 |
| Brownfield/Ghost presentation/full Review/Handoff/Terminal | 本轮未实现 / Not implemented in this task | Later phases remain outside scope / 后续阶段范围外 |

## 3. Root Cause and Minimal Fix / 根因与最小修复

dev复现_Worker is not a constructor；production preview复现压缩后的H8 is not a constructor。入口来自architecture-layout内部动态import elkjs/lib/elk.bundled.js。bundled文件内嵌elk-worker先探测self/document而后探测CommonJS，在现有module Worker里错误安装onmessage且未导出Worker；外层ELKNode随后new未定义符号。该符号不是app Worker类。 / Both modes reproduce the same embedded-worker export defect, with a minified production symbol. Worker-global detection wrongly precedes CJS export and overwrites the handler.

Node/Worker-global最小实验分别成功/失败；只在内存调整guard顺序后Worker-global也成功且onmessage保留。证据与复现命令见[root cause](../logs/validation/p3-closeout/elk-browser/root-cause.md)、[experiment](../logs/validation/p3-closeout/elk-browser/entry-experiment.json)、[baseline modes](../logs/validation/p3-closeout/elk-browser/baseline-modes.json)。 / The isolated experiment proves the branch-order cause rather than assuming default-export interop.

选择固定pnpm补丁，CommonJS优先导出并保留独立worker auto-attach。放弃仅调default层级（不能补缺失内嵌导出）、仅optimizeDeps（不能覆盖production worker语义）、新建物理Worker或换solver（越出边界且改动更大）。 / The chosen pinned patch fixes the embedded export in both builds. Extra default normalization and dev-only bundler settings do not fix the root cause; another worker or solver exceeds the boundary.

[boundary-release-check.json](../logs/validation/p3-closeout/elk-browser/boundary-release-check.json)确认公开契约/Worker传输无diff、elk版本仍0.12.0、普通production无内部验收钩子。D-010保持solver-only Worker，compiler与stability留在调用方。 / Boundary checks confirm unchanged public/transport surfaces and solver version; release hooks are absent.

## 4. Tests / 测试

以下按顺序在可写环境运行，全部CI=true、TURBO_FORCE=true。依赖安装和源码重建先于测试，不以旧dist或Turbo cache替代。 / All gates ran sequentially in writable execution with forced source rebuilds.

| Command / 命令 | Result / 结果 | Raw / 原始输出 |
| --- | --- | --- |
| pnpm install | exit0 | [01](../logs/validation/p3-closeout/elk-browser/verification/01-install.txt) |
| pnpm build | 15/15 task, exit0 | [02](../logs/validation/p3-closeout/elk-browser/verification/02-build.txt) |
| pnpm typecheck | 25/25 task; Web0 errors/warnings, exit0 | [03](../logs/validation/p3-closeout/elk-browser/verification/03-typecheck.txt) |
| pnpm test | 30/30 task, exit0 | [04](../logs/validation/p3-closeout/elk-browser/verification/04-test.txt) |
| pnpm --filter @coding-cad/web test:unit | 14 files,58 tests, exit0 | [05](../logs/validation/p3-closeout/elk-browser/verification/05-web-unit.txt) |
| pnpm --filter @coding-cad/web test:integration | 3 files,9 tests, exit0 | [06](../logs/validation/p3-closeout/elk-browser/verification/06-web-integration.txt) |
| pnpm --filter @coding-cad/web test:e2e | dev21 + preview21, exit0 | [07](../logs/validation/p3-closeout/elk-browser/verification/07-browser.txt) |
| pnpm ci:verify | exit0; typecheck25/unit28/integration18/E2E17/build15 task | [08](../logs/validation/p3-closeout/elk-browser/verification/08-ci.txt) |

所有Turbo阶段0cached；task数不等于断言数。Web test:e2e显式从源码构建layout-acceptance模式再运行双模式套件；普通production另行源码重建与浏览器验证。内部测试hook只在DEV/验收模式安装，未增加package公开字段。 / Task counts are not assertion counts. Browser acceptance builds test hooks explicitly; ordinary production is separately rebuilt and observed.

负控P3_FORCE_FALLBACK=1只在测试观察器将既有timeout设为0；真实LAYOUT_TIMEOUT导致同一ELK sentinel和自动守卫exit1。正向CI的test:e2e调用相同套件，任一fallback导致失败；retries=0避免重试洗绿。 / The negative control triggers the real timeout path and fails both assertions. CI runs that same guarded suite with no retries.

失败分类 / Failure classification:
- 代码 / Code: 原ELK导出错误、父相对坐标错误和新增组件重叠均复现、修复并回归。 / Export, coordinate and newcomer-overlap defects were reproduced, repaired and regressed.
- 测试本身 / Tests: 初版回归变量重名、preview配置启动重复server、Accept完成同步不足，均修正后重跑。 / A duplicate variable, duplicate preview server config and an acceptance synchronization race were corrected.
- 环境 / Environment: 最终8项无环境失败；预期负控exit1不是环境或产品回归。 / No final environment failures; expected negative-control failure is not a product regression.
- 历史 / Historical: 前轮09诊断及旧CI未检测fallback的结果保留，仅描述修复前状态。 / Earlier passing gates did not prove ELK success and remain historical evidence.

## 5. Layout Metrics / 布局指标

dev/preview两fixture结果一致；[完整对照](../logs/validation/p3-closeout/elk-browser/quality-report.md)保留原始图和结果。fallback为同一generator的受控timeout对照，非修复后的自然失败。 / Both fixtures and modes have matching measurements; fallback is a controlled comparison.

| Metric / 指标 | ELK | Fallback |
| --- | --- | --- |
| Peer overlap / 非包含重叠 | 0 | 0 |
| Outside container / 容器外成员 | 0 | 2 |
| Actual routes / 真实路由 | 3/3 | 0/3 |
| Proper routed crossings / 严格路由交叉 | 0 | null |
| Rank inversion / 层级倒置 | 0 | default0/points1 |
| Area / 面积px² | 183372 | 78624 |
| FULL determinism / 完全确定 | true | true |
| Incremental unaffected p95/max / 无关移动 | 0/0px | null; FULL fallback |

产品描述编辑及Palette添加的无关组件p95/max均0/0px，无顺序反转，满足原48/144px预算；添加后无重叠且容器包含正确。增量stability按原设计清除旧edge route，交叉记null，不能误写0或fallback。 / Product edits/additions meet approved movement limits. Stabilization clears stale routes by existing design, so incremental crossing measurements are null.

默认截图无需拖动整理，入口→服务→基础设施和分组成员均可辨认。添加Kafka后当前固定viewport裁切下方新增节点，需要pan/zoom；未声称自动fit或任意图可读。 / Default screenshots show readable names and structure without manual arrangement; added Kafka may require viewport navigation.

CI中既有Node性能：100/150 p95=55.50ms；500/800 p95=495.19ms；worker gzip471875bytes，均通过原预算。它们不是大型图浏览器质量证明。 / Existing Node performance gates pass but do not prove large-graph browser quality.

## 6. Architecture Invariants Check / 架构不变量

ArchitectureProject仍为唯一事实源；语义修改经command/Validator/Review，测试不把生成的fixture写回正式状态。Layout/View State独立，adapter只转换坐标和renderer形态。package没有app依赖、UI类型或新公开API；不新增package或第二pipeline。 / Architecture truth, semantic gates and layout ownership remain intact; fixture measurements do not mutate accepted state. No reverse dependency or new runtime/API/pipeline is added.

既有自动边界检查通过；不是独立外部顾问审批或远程GitHub CI的声明。 / Automated checks pass; no independent external review or hosted CI is claimed.

## 7. Known Risks and Technical Debt / 风险与技术债

elkjs补丁固定在0.12.0，升级须回归补丁与双模式测试；大chunk/adapter-auto部署警告仍在。审批历史仍内存化、local-user未认证，schema编辑器和持久化审批记录超出已批准最小范围。大型图浏览器、多平台、部署、复杂嵌套图的普遍质量尚未验证。 / The pinned patch needs upgrade regression; bundle/deployment warnings remain. Approval audit/identity extensions and schema UX remain outside scope. Large/platform/deployment/complex-graph coverage is not established.

## 8. Decisions, Readiness and Rollback / 决策、就绪与回退

本修复未触碰solver选择、D-010边界或公开API，不需要新增审批语义/架构决策。既有48/144px与无顺序反转预算直接复用。交叉数、rank inversion、面积、浏览器耗时没有批准的新通过线，只记录；若未来设硬阈值，需用户批准。本次无待答复的阻塞决策。 / No prohibited boundary or new decision was required. Other quality observations have no invented pass thresholds; future thresholds need approval.

阶段3定义验收项满足，最后布局阻塞关闭；阶段4仍为后续顺序，未在本次启动。未合并/变基、未启动Coding Agent，.github/pr-draft-phase3.md保留未跟踪。 / Phase 3 criteria are met; later execution remains separate. No merge/rebase/Agent launch occurred and the draft remains untracked.

| This task step / 本任务步骤 | Commit / 提交 | Revert / 回退 |
| --- | --- | --- |
| 1 Reproduce/diagnose / 复现定位 | c7ecdae | git revert c7ecdae |
| 2 Pinned minimal patch / 最小补丁 | f67be3e | git revert f67be3e |
| 3 Hard browser gate / 硬门禁 | 99964a7 | git revert 99964a7 |
| 4 Quality/stability/source checks / 质量稳定性验收 | a93891f | git revert a93891f |
| 5 Documentation / 文档同步 | ecd7e27 | git revert ecd7e27 |

每步独立提交；整轮回退按5→1逆序，任意顺序可能需处理依赖/文档冲突。回退步骤2会恢复已知ELK缺陷，保留步骤3时门禁应变红，不应降低断言。 / Revert in reverse dependency order; reverting the patch restores the known defect and should fail the retained hard gate.

前轮收尾基线与回退仍可查：Review5e2ebdc、Remove/Connect8a17817、Inspectorb608fce、lifecycle e243537、旧退出报告2e4a500。旧报告“不满足”是修复前的正确历史结论，本报告以新证据更新，不覆盖原日志。 / Prior closeout commits remain recoverable; the historical blocked report was correct before this repair.


## 9. PR Security Audit Follow-up / PR安全审计后续

原PR #3远端运行38896801517在security:audit失败；旧本地ci:verify未含审计，不能称远端CI通过。用户随后批准修复，三项间接补丁版本与本地审计门禁已更新，high/critical为0；保留2moderate/1low并不降低门禁。ELK与D-010不变。 / The initial hosted run failed auditing omitted by the former local gate. Authorized dependency patches and gate alignment remove high/critical findings while retaining two moderate and one low without suppression. ELK and D-010 are unchanged.

本次独立修复、验证、剩余风险及回退见[安全修复记录](../logs/validation/p3-security-closeout/report.md)。最新远端状态以[PR #3 Checks](https://github.com/BobcGn/Coding-CAD/pull/3/checks)为准，不能从本地命令推断。 / See the separate repair record; current hosted status is established by PR checks, not inferred from local commands.
