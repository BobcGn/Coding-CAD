import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanDirectoryForPatterns, runBundleCheck, FORBIDDEN_PATTERNS } from "./check-production-bundle.mjs";

test("check-production-bundle: clean directory returns no violations", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-clean-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "app.js"), "console.log('hello world'); export const config = { env: 'production' };\n");
    fs.writeFileSync(path.join(tmpDir, "styles.css"), "body { margin: 0; }\n");

    const violations = scanDirectoryForPatterns(tmpDir, FORBIDDEN_PATTERNS);
    assert.equal(violations.length, 0, "Clean bundle should yield 0 violations");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("check-production-bundle (negative control): detects __coding_cad_ hooks", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-violation1-"));
  try {
    fs.writeFileSync(
      path.join(tmpDir, "chunk.js"),
      "function init() { window.__coding_cad_wait_for_prediction__ = async () => {}; }\n"
    );

    const violations = scanDirectoryForPatterns(tmpDir, FORBIDDEN_PATTERNS);
    assert.equal(violations.length, 1, "Should catch exactly 1 violation");
    assert.ok(violations[0].pattern.includes("__coding_cad_"));
    assert.ok(violations[0].snippet.includes("window.__coding_cad_wait_for_prediction__"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("check-production-bundle (negative control): detects __p3LayoutAcceptance hook", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-violation2-"));
  try {
    fs.writeFileSync(
      path.join(tmpDir, "layout.js"),
      "if (typeof window !== 'undefined') { window.__p3LayoutAcceptance = true; }\n"
    );

    const violations = scanDirectoryForPatterns(tmpDir, FORBIDDEN_PATTERNS);
    assert.equal(violations.length, 1, "Should catch __p3LayoutAcceptance violation");
    assert.ok(violations[0].pattern.includes("__p3LayoutAcceptance"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("check-production-bundle (negative control): runBundleCheck returns failure on violations", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-runner-"));
  try {
    fs.writeFileSync(
      path.join(tmpDir, "page.js"),
      "window.__coding_cad_controller__ = null;\n"
    );

    const result = runBundleCheck(tmpDir);
    assert.equal(result.success, false, "runBundleCheck must fail when violations are present");
    assert.equal(result.violations.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
