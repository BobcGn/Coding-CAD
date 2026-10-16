#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

export function parseArgs(rawArgs = process.argv.slice(2)) {
  const options = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    if (rawArgs[index] === "--from") {
      options.from = rawArgs[index + 1];
      index += 1;
    } else if (rawArgs[index] === "--to") {
      options.to = rawArgs[index + 1];
      index += 1;
    } else if (rawArgs[index] === "--file") {
      options.file = rawArgs[index + 1];
      index += 1;
    } else if (rawArgs[index] === "--allow-legacy") {
      options.allowLegacy = true;
    }
  }
  return options;
}

export function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  return result.stdout.trim();
}

export function isZeroSha(value) {
  return Boolean(value) && /^0{40}$/.test(value);
}

export function changedFiles({ from, to }) {
  if (from && to && !isZeroSha(from)) {
    const rangeOutput = git(["diff", "--name-only", `${from}...${to}`]);
    if (rangeOutput) {
      return rangeOutput.split("\n").filter(Boolean);
    }
  }

  const workingTreeOutput = git(["diff", "--name-only", "HEAD"]);
  if (workingTreeOutput) {
    return workingTreeOutput.split("\n").filter(Boolean);
  }

  return [];
}

export function moduleName(filePath) {
  const parts = filePath.split("/");
  if (parts[0] === "packages") {
    return parts[1];
  }
  if (parts[0] === "apps") {
    return parts[1];
  }
  return "";
}

export function isProductionCode(filePath) {
  if (!/^(packages|apps)\/[^/]+\/src\/.+\.(ts|tsx|js|mjs)$/.test(filePath)) {
    return false;
  }
  return !/(\.test|\.spec)\.(ts|tsx|js|mjs)$/.test(filePath);
}

export function isChangeRecord(filePath) {
  return (
    filePath === "logs/implementation-log.md" ||
    /^logs\/modules\/[^/]+\/implementation-log\.md$/.test(filePath) ||
    /^docs\/.+\.md$/.test(filePath) ||
    filePath === "README.md" ||
    filePath === "packages/README.md" ||
    /^\.changeset\/.+\.md$/.test(filePath) ||
    /^CHANGELOG(\.md)?$/.test(filePath)
  );
}

export function isImplementationLog(filePath) {
  return (
    filePath === "logs/implementation-log.md" ||
    /^logs\/modules\/[^/]+\/implementation-log\.md$/.test(filePath)
  );
}

function findSectionIndex(entryText, keywords) {
  // Matches markdown headers (e.g. ### 1. 做了什么), bold headers (**做了什么**), or standalone legacy labels (变更：, 验证:)
  // Does NOT match bullet list items like "- 验证与基线..."
  const pattern = new RegExp(
    `(?:^|\\n)(?:#{1,6}|\\*{2})?[\\s]*(?:\\d+[.:、\\s]*)?(?:${keywords.join("|")})(?:\\b|\\/|\\*|:|：|\\s|$)`,
    "i"
  );
  const match = pattern.exec(entryText);
  return match ? match.index : -1;
}

/**
 * Validates the 3-section format:
 * 1. 做了什么 / What
 * 2. 为什么这么做 / Why
 * 3. 验证结果 / Verification
 */
export function validateEntryFormat(entryText, options = {}) {
  const allowLegacy = options.allowLegacy ?? false;
  const errors = [];

  const hasChinese = /[\u4e00-\u9fa5]/.test(entryText);
  const hasEnglish = /[a-zA-Z]/.test(entryText);
  if (!hasChinese || !hasEnglish) {
    errors.push("Entry must be bilingual (contain both Chinese and English).");
  }

  // Section 1: 做了什么 / What (or legacy 变更 / Changes)
  const whatIndex = findSectionIndex(entryText, ["做了什么", "What", "变更", "Changes"]);
  // Section 2: 为什么这么做 / Why (mandatory unless allowLegacy=true)
  const whyIndex = findSectionIndex(entryText, ["为什么这么做", "Why", "动机", "Motivation", "Rationale"]);
  // Section 3: 验证结果 / Verification (or 验证 / Validation)
  const verIndex = findSectionIndex(entryText, ["验证结果", "Verification", "Validation", "验证"]);

  if (whatIndex === -1) {
    errors.push("Missing Section 1: 做了什么 / What");
  }
  if (whyIndex === -1) {
    if (!allowLegacy) {
      errors.push("Missing Section 2: 为什么这么做 / Why");
    }
  }
  if (verIndex === -1) {
    errors.push("Missing Section 3: 验证结果 / Verification");
  }

  // Check order: What -> Why -> Verification
  if (whatIndex !== -1 && whyIndex !== -1 && whyIndex <= whatIndex) {
    errors.push("Section 2 (Why / 为什么这么做) must appear after Section 1 (What / 做了什么).");
  }
  if (whyIndex !== -1 && verIndex !== -1 && verIndex <= whyIndex) {
    errors.push("Section 3 (Verification / 验证结果) must appear after Section 2 (Why / 为什么这么做).");
  }
  if (whyIndex === -1 && whatIndex !== -1 && verIndex !== -1 && verIndex <= whatIndex) {
    errors.push("Section 3 (Verification / 验证结果) must appear after Section 1 (What / 做了什么).");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function splitEntries(content) {
  const lines = content.split("\n");
  const entries = [];
  let currentTitle = "";
  let currentLines = [];

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (currentTitle) {
        entries.push({
          title: currentTitle,
          content: currentLines.join("\n")
        });
      }
      currentTitle = line.trim();
      currentLines = [line];
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    entries.push({
      title: currentTitle,
      content: currentLines.join("\n")
    });
  }
  return entries;
}

export function validateChangeRecordContent(content, options = {}) {
  const entries = splitEntries(content);
  if (entries.length === 0) {
    return validateEntryFormat(content, options);
  }
  const allErrors = [];
  for (const entry of entries) {
    const res = validateEntryFormat(entry.content, options);
    if (!res.valid) {
      allErrors.push({
        title: entry.title,
        errors: res.errors
      });
    }
  }
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}

function getDiffAddedLines(filePath, { from, to }) {
  if (from && to && !isZeroSha(from)) {
    const out = git(["diff", "-U0", `${from}...${to}`, "--", filePath]);
    return parseAddedLines(out);
  }
  const out = git(["diff", "-U0", "HEAD", "--", filePath]);
  const staged = git(["diff", "--cached", "-U0", "--", filePath]);
  return [...parseAddedLines(out), ...parseAddedLines(staged)];
}

function parseAddedLines(diffOutput) {
  if (!diffOutput) return [];
  return diffOutput
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
}

function validateModifiedLogFile(filePath, options) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8");
  const entries = splitEntries(content);
  if (entries.length === 0) return [];

  const addedLines = getDiffAddedLines(filePath, options);
  const failures = [];

  // If there are no diff lines (e.g. untracked or file-based check), validate the latest entry
  if (addedLines.length === 0) {
    const latest = entries[0];
    if (latest) {
      const res = validateEntryFormat(latest.content, options);
      if (!res.valid) {
        failures.push({ file: filePath, title: latest.title, errors: res.errors });
      }
    }
    return failures;
  }

  // Find entries that contain any of the added lines
  for (const entry of entries) {
    const isTouched = addedLines.some((line) => line.trim().length > 10 && entry.content.includes(line.trim()));
    const titleAdded = addedLines.some((line) => line.trim() === entry.title);
    if (isTouched || titleAdded) {
      const res = validateEntryFormat(entry.content, options);
      if (!res.valid) {
        failures.push({ file: filePath, title: entry.title, errors: res.errors });
      }
    }
  }

  return failures;
}

function main() {
  const options = parseArgs();

  if (options.file) {
    if (!existsSync(options.file)) {
      console.error(`File does not exist: ${options.file}`);
      process.exit(1);
    }
    const content = readFileSync(options.file, "utf8");
    const res = validateChangeRecordContent(content, options);
    if (!res.valid) {
      console.error(`Change record check failed for ${options.file}:`);
      for (const err of res.errors) {
        if (err.title) {
          console.error(`- ${err.title}:`);
          for (const msg of err.errors) console.error(`    ${msg}`);
        } else {
          console.error(`- ${err}`);
        }
      }
      process.exit(1);
    }
    console.log(`Change record check passed for ${options.file}.`);
    process.exit(0);
  }

  const files = changedFiles(options);
  const productionFiles = files.filter(isProductionCode);

  // Validate format of any modified implementation-log.md files
  const logFiles = files.filter(isImplementationLog);
  const formatFailures = [];
  for (const logFile of logFiles) {
    const failures = validateModifiedLogFile(logFile, options);
    formatFailures.push(...failures);
  }

  if (formatFailures.length > 0) {
    console.error("Change record format check failed:");
    for (const failure of formatFailures) {
      console.error(`- In ${failure.file} -> ${failure.title}:`);
      for (const error of failure.errors) {
        console.error(`    ${error}`);
      }
    }
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("Change record check skipped: no changed files detected.");
    process.exit(0);
  }

  if (productionFiles.length === 0) {
    console.log("Change record check passed: no production code changes detected.");
    process.exit(0);
  }

  const changedModules = new Set(productionFiles.map(moduleName).filter(Boolean));
  const hasGlobalRecord = files.some(isChangeRecord);
  const missingModuleRecords = [...changedModules].filter((name) => {
    const logName = name === "server" || name === "web" ? name : name;
    return !files.includes(`logs/modules/${logName}/implementation-log.md`);
  });

  if (!hasGlobalRecord && missingModuleRecords.length > 0) {
    console.error("Change record check failed:");
    console.error("- Production code changed without an architecture log, docs update, changelog, or changeset.");
    console.error(`- Production files: ${productionFiles.join(", ")}`);
    console.error(`- Missing module records: ${missingModuleRecords.join(", ")}`);
    process.exit(1);
  }

  console.log(`Change record check passed (${productionFiles.length} production file changes).`);
}

// Only run main if executed directly
if (process.argv[1] && process.argv[1].endsWith("check-change-record.mjs")) {
  main();
}
