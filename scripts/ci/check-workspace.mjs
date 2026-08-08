#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const workspaceModules = [
  { workspace: "apps/server", log: "server", requiredScripts: ["build", "typecheck", "test", "clean"] },
  { workspace: "apps/web", log: "web", requiredScripts: ["build", "typecheck", "test", "clean"] },
  { workspace: "packages/agent-runtime", log: "agent-runtime", requiredScripts: ["build", "typecheck", "test", "clean"] },
  { workspace: "packages/architecture-ir", log: "architecture-ir", requiredScripts: ["build", "typecheck", "test", "test:unit", "clean"] },
  { workspace: "packages/architecture-dsl", log: "architecture-dsl", requiredScripts: ["build", "typecheck", "test", "test:unit", "clean"] },
  { workspace: "packages/component-registry", log: "component-registry", requiredScripts: ["build", "typecheck", "test", "test:unit", "clean"] },
  { workspace: "packages/architecture-validator", log: "architecture-validator", requiredScripts: ["build", "typecheck", "test", "test:unit", "clean"] },
  { workspace: "packages/cli", log: "cli", requiredScripts: ["build", "typecheck", "test", "test:integration", "test:e2e", "clean"] }
];

const requiredLogFiles = [
  "README.md",
  "Links/current.md",
  "Scope/current.md",
  "Standards/current.md",
  "State/current.md",
  "Todo/current.md",
  "implementation-log.md"
];

const forbiddenPaths = [
  "packages/dsl",
  "packages/validator",
  "logs/modules/dsl",
  "logs/modules/validator"
];

const requiredRootScripts = [
  "build",
  "typecheck",
  "test",
  "test:unit",
  "test:integration",
  "test:e2e",
  "lint",
  "check:changelog",
  "commitlint",
  "security:secrets",
  "ci:verify"
];

const findings = [];

function repoPath(relativePath) {
  return path.join(root, relativePath);
}

function requireFile(relativePath) {
  if (!existsSync(repoPath(relativePath)) || !statSync(repoPath(relativePath)).isFile()) {
    findings.push(`Missing required file: ${relativePath}`);
  }
}

function requireDir(relativePath) {
  if (!existsSync(repoPath(relativePath)) || !statSync(repoPath(relativePath)).isDirectory()) {
    findings.push(`Missing required directory: ${relativePath}`);
  }
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(repoPath(relativePath), "utf8"));
  } catch (error) {
    findings.push(`Invalid JSON file: ${relativePath} (${error.message})`);
    return {};
  }
}

function collectEmptyDirs(relativePath, emptyDirs = []) {
  const absolutePath = repoPath(relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    return emptyDirs;
  }

  const ignored = new Set(["node_modules", "dist", ".turbo", ".git"]);
  const entries = readdirSync(absolutePath).filter((entry) => !ignored.has(entry));
  if (entries.length === 0) {
    emptyDirs.push(relativePath);
    return emptyDirs;
  }

  for (const entry of entries) {
    const child = path.join(relativePath, entry);
    if (statSync(repoPath(child)).isDirectory()) {
      collectEmptyDirs(child, emptyDirs);
    }
  }

  return emptyDirs;
}

const rootPackage = readJson("package.json");
for (const scriptName of requiredRootScripts) {
  if (!rootPackage.scripts?.[scriptName]) {
    findings.push(`Root package.json is missing script: ${scriptName}`);
  }
}

for (const forbiddenPath of forbiddenPaths) {
  if (existsSync(repoPath(forbiddenPath))) {
    findings.push(`Legacy or duplicate module path should not exist: ${forbiddenPath}`);
  }
}

for (const module of workspaceModules) {
  requireDir(module.workspace);
  requireFile(`${module.workspace}/package.json`);
  requireFile(`${module.workspace}/tsconfig.json`);

  const packageJson = readJson(`${module.workspace}/package.json`);
  for (const scriptName of module.requiredScripts) {
    if (!packageJson.scripts?.[scriptName]) {
      findings.push(`${module.workspace}/package.json is missing script: ${scriptName}`);
    }
  }

  for (const logFile of requiredLogFiles) {
    requireFile(`logs/modules/${module.log}/${logFile}`);
  }
}

for (const requiredFile of [
  "README.md",
  "packages/README.md",
  "docs/architecture.md",
  "docs/documentation-guidelines.md",
  "docs/logging-system.md",
  "docs/ci-cd.md",
  "logs/README.md",
  "logs/implementation-log.md"
]) {
  requireFile(requiredFile);
}

for (const emptyDir of [...collectEmptyDirs("packages"), ...collectEmptyDirs("logs")]) {
  findings.push(`Empty directory detected: ${emptyDir}`);
}

if (findings.length > 0) {
  console.error("Workspace architecture check failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`Workspace architecture check passed (${workspaceModules.length} modules).`);
