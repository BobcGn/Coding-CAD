#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--from") {
      options.from = args[index + 1];
      index += 1;
    } else if (args[index] === "--to") {
      options.to = args[index + 1];
      index += 1;
    }
  }
  return options;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  return result.stdout.trim();
}

function isZeroSha(value) {
  return Boolean(value) && /^0{40}$/.test(value);
}

function changedFiles({ from, to }) {
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

function moduleName(filePath) {
  const parts = filePath.split("/");
  if (parts[0] === "packages") {
    return parts[1];
  }
  if (parts[0] === "apps") {
    return parts[1];
  }
  return "";
}

function isProductionCode(filePath) {
  if (!/^(packages|apps)\/[^/]+\/src\/.+\.(ts|tsx|js|mjs)$/.test(filePath)) {
    return false;
  }
  return !/(\.test|\.spec)\.(ts|tsx|js|mjs)$/.test(filePath);
}

function isChangeRecord(filePath) {
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

const options = parseArgs();
const files = changedFiles(options);
const productionFiles = files.filter(isProductionCode);

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
