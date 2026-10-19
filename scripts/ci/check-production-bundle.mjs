#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

export const FORBIDDEN_PATTERNS = [
  /__coding_cad_/,
  /__p3LayoutAcceptance/
];

/**
 * Recursively scans a directory for files matching any forbidden regular expression.
 *
 * @param {string} dir
 * @param {RegExp[]} patterns
 * @returns {Array<{ file: string, line: number, pattern: string, snippet: string }>}
 */
export function scanDirectoryForPatterns(dir, patterns = FORBIDDEN_PATTERNS) {
  const violations = [];
  if (!fs.existsSync(dir)) {
    return violations;
  }

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Only inspect text/bundle files (.js, .mjs, .cjs, .html, .css)
        const ext = path.extname(entry.name);
        if (![".js", ".mjs", ".cjs", ".html", ".css", ".json"].includes(ext)) {
          continue;
        }
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const pattern of patterns) {
            if (pattern.test(line)) {
              violations.push({
                file: path.relative(REPO_ROOT, fullPath),
                line: i + 1,
                pattern: pattern.toString(),
                snippet: line.length > 200 ? line.slice(0, 200) + "..." : line
              });
            }
          }
        }
      }
    }
  }

  walk(dir);
  return violations;
}

export function runBundleCheck(targetDir = path.join(REPO_ROOT, "apps/web/.svelte-kit/output")) {
  if (!fs.existsSync(targetDir)) {
    console.error(`[check-production-bundle] ERROR: Production output directory not found: ${targetDir}`);
    console.error(`Please run 'pnpm build' before checking the bundle.`);
    return { success: false, violations: [] };
  }

  console.log(`[check-production-bundle] Scanning production bundle in: ${path.relative(REPO_ROOT, targetDir)}...`);
  const violations = scanDirectoryForPatterns(targetDir);

  if (violations.length > 0) {
    console.error(`[check-production-bundle] FAILED: Found ${violations.length} forbidden test hook occurrence(s) in production bundle:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} matches ${v.pattern}`);
      console.error(`    snippet: ${v.snippet.trim()}`);
    }
    return { success: false, violations };
  }

  console.log(`[check-production-bundle] PASSED: 0 forbidden test hooks or debug globals found in production bundle.`);
  return { success: true, violations: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runBundleCheck();
  process.exit(result.success ? 0 : 1);
}
