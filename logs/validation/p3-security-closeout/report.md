# Phase 3 PR Security Repair / 阶段3 PR安全修复

日期 / Date: 2026-10-16。基线 / Baseline: ecd7e27。分支 / Branch: codex/phase-3-greenfield-workspace。PR: [#3](https://github.com/BobcGn/Coding-CAD/pull/3)。

## Cause and Scope / 原因与范围

首次[远端运行](https://github.com/BobcGn/Coding-CAD/actions/runs/38896801517)在security:audit失败：7high/10moderate/5low；旧本地ci:verify未包含审计。用户批准定向补丁并对齐本地门禁；不改阶段顺序、生产源码、solver、D-010或公开API。 / The initial hosted run failed an audit absent from local CI. The approved narrow dependency repair aligns the gates without changing production source or architecture boundaries.

## Change / 变更

| Dependency / 依赖 | Before / 原版本 | After / 修复版本 |
| --- | --- | --- |
| undici | 8.10.0 | 8.10.2 |
| devalue | 5.9.0 | 5.9.3 |
| source-map-js | 1.2.1 | 1.2.2 |

pnpm10定向深层update未移动间接版本，改用仅匹配旧漏洞版本的overrides；三个patch均符合父依赖semver约束。安装仅+3/-3包，根及Web直接框架版本未更新。ELK固定补丁hash保持原值。 / A targeted update left transitive versions unchanged, so overrides match only the vulnerable locked versions. All patches fit parent ranges; only three packages were replaced, with no framework or ELK update.

ci:verify首先执行既有security:audit，保留--audit-level high，不忽略告警。该审计依赖registry和随时间变化的漏洞数据。undici要求Node≥22.19.0，本地Node24.16.0通过；远端使用workflow配置的Node22，以真实远端结果为准。 / Local CI now starts with the unchanged high-threshold audit. Registry data is time-dependent. Local Node24 satisfies the dependency requirement; hosted Node22 is verified separately by Actions.

## Verification / 验证

| Command / 命令 | Result / 结果 | Evidence / 证据 |
| --- | --- | --- |
| pnpm install --frozen-lockfile | exit0 | [03](03-frozen-install.txt) |
| CI=true TURBO_FORCE=true pnpm build | 15/15 tasks, 0cached, exit0 | [04](04-source-build.txt) |
| pnpm security:audit | exit0; 0high/0critical | [05](05-security-audit.txt) |
| pnpm audit --json | exit1 for remaining low/moderate / 因剩余低中风险而非0 | [06](06-audit-after.json) |
| CI=true TURBO_FORCE=true pnpm ci:verify | exit0; all Turbo phases 0cached / 全阶段零缓存 | [07](07-ci-verify.txt) |

完整门禁内Web unit58/integration9/dev21/preview21通过，ELK success硬门禁仍启用且不重试。性能p95为52.29ms（100/150）、440.92ms（500/800），worker gzip471875bytes，均通过既有预算。旧质量artifact保留其原始字节，本轮运行证据单独保存。 / All existing test layers and solver guards pass, as do existing performance budgets. Historical quality artifacts retain their original bytes; current raw evidence is separate.

[顺序结果 / Results](results.json)、[边界检查 / Boundary](boundary-check.json)、[修复前审计 / Before](01-audit-before.json)。本地通过不自动代表远端通过；最新远端结果见[PR Checks](https://github.com/BobcGn/Coding-CAD/pull/3/checks)。 / Local passing results do not imply hosted success.

## Remaining Risk and Rollback / 剩余风险与回退

还剩2moderate（vitest/@vitest/mocker同一公告）与1low（cookie），没有忽略或宣称零漏洞。该范围外依赖升级没有混入本次；只清除当前high级阻塞。精确版本override在将来升级父依赖/锁文件时应复查是否仍需保留。 / Two moderate entries and one low remain without suppression. This repair addresses the high-threshold blocker only; overrides should be revisited on future dependency upgrades.

本安全修复单独提交，可git revert该提交；回退将恢复已知漏洞与旧门禁，不能将其视为安全通过。原未跟踪.github/pr-draft-phase3.md保持不变。 / Revert the separate repair commit to roll back; this restores known vulnerabilities and the old gate. The untracked PR draft remains untouched.
