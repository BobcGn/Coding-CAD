import test from "node:test";
import assert from "node:assert/strict";
import {
  validateEntryFormat,
  splitEntries,
  validateChangeRecordContent
} from "./check-change-record.mjs";

test("validateEntryFormat accepts compliant new-format bilingual entry", () => {
  const entry = `
## 2026-10-16 - 阶段 4 统一记录格式 / Phase 4 Unified Recording Format

### 1. 做了什么 / What
- 完善 PR 模板、规则文件与变更记录检查脚本。
- Updated PR template, rules, and change record scripts.

### 2. 为什么这么做 / Why
- 统一工程证据链，确保所有步骤与 PR 记录具备可追溯性与一致性。
- Standardize engineering evidence chains for complete traceability.

### 3. 验证结果 / Verification
- 运行 \`pnpm check:changelog\` 和 \`node --test\` 全部通过。
- Ran checks and verified all assertions passed.
`;

  const result = validateEntryFormat(entry, { allowLegacy: false });
  assert.equal(result.valid, true, `Expected valid entry, got: ${result.errors.join(", ")}`);
  assert.equal(result.errors.length, 0);
});

test("validateEntryFormat rejects entry missing Why in strict mode but accepts in legacy mode", () => {
  const legacyEntry = `
## 2026-08-08 - 历史日志 / Legacy Log
状态：已验证。
Status: Verified.
变更：
Changes:
- 更新旧模块。
- Updated old module.
验证：
Validation:
- pnpm build passed.
`;

  const strictResult = validateEntryFormat(legacyEntry, { allowLegacy: false });
  assert.equal(strictResult.valid, false);
  assert.ok(
    strictResult.errors.some((err) => err.includes("Why") || err.includes("为什么这么做")),
    "Strict mode must reject entry missing Why section"
  );

  const legacyResult = validateEntryFormat(legacyEntry, { allowLegacy: true });
  assert.equal(legacyResult.valid, true, `Legacy mode should accept old format: ${legacyResult.errors.join(", ")}`);
});

test("validateEntryFormat rejects entry with incorrect section order", () => {
  const wrongOrderEntry = `
## 2026-10-16 - 顺序错误测试 / Wrong Order Test

### 1. 做了什么 / What
- 改动描述 / Change description.

### 3. 验证结果 / Verification
- 验证描述 / Verification description.

### 2. 为什么这么做 / Why
- 动机描述 / Motivation description.
`;

  const result = validateEntryFormat(wrongOrderEntry, { allowLegacy: false });
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes("must appear after")),
    `Expected ordering failure, got: ${result.errors.join(", ")}`
  );
});

test("validateEntryFormat rejects entry missing Section 1 (What)", () => {
  const missingWhatEntry = `
## 2026-10-16 - 缺失第一部分 / Missing What

### 2. 为什么这么做 / Why
- 动机描述 / Motivation description.

### 3. 验证结果 / Verification
- 验证描述 / Verification description.
`;

  const result = validateEntryFormat(missingWhatEntry, { allowLegacy: false });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("What") || err.includes("做了什么")));
});

test("validateEntryFormat rejects entry missing Section 3 (Verification)", () => {
  const missingVerEntry = `
## 2026-10-16 - 缺失第三部分 / Missing Verification

### 1. 做了什么 / What
- 改动描述 / Change description.

### 2. 为什么这么做 / Why
- 动机描述 / Motivation description.
`;

  const result = validateEntryFormat(missingVerEntry, { allowLegacy: false });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("Verification") || err.includes("验证结果")));
});

test("validateEntryFormat rejects monolingual entry", () => {
  const chineseOnlyEntry = `
## 2026-10-16 - 仅中文条目

### 1. 做了什么
- 仅中文描述

### 2. 为什么这么做
- 仅中文动机

### 3. 验证结果
- 仅中文验证
`;

  const result = validateEntryFormat(chineseOnlyEntry, { allowLegacy: false });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("bilingual")));
});

test("validateEntryFormat does not treat list items with section keywords as headers", () => {
  const entryWithBullets = `
## 2026-10-16 - 列表项关键字测试 / Bullet Keyword Test

### 1. 做了什么 / What
- 验证与基线比对：更新 benchmark.ts 工具。
- Verification and baseline comparison: updated benchmark.ts tool.
- 为什么需要重构：为了支持 monorepo。
- Why refactor: to support monorepos.

### 2. 为什么这么做 / Why
- 动机描述：必须保留完整的架构事实链。
- Motivation: must preserve the full architecture truth chain.

### 3. 验证结果 / Verification
- 执行测试并通过。
- Ran tests and passed.
`;

  const result = validateEntryFormat(entryWithBullets, { allowLegacy: false });
  assert.equal(result.valid, true, `Expected valid entry, got: ${result.errors.join(", ")}`);
});

test("splitEntries correctly splits multiple markdown log entries", () => {
  const doc = `
# Title

## Entry 1
Content 1

## Entry 2
Content 2
`;
  const entries = splitEntries(doc);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].title, "## Entry 1");
  assert.equal(entries[1].title, "## Entry 2");
});

