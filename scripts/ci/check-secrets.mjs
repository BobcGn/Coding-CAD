#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const scanRoots = ["apps", "packages", ".github"];
const ignoredDirs = new Set(["node_modules", "dist", ".turbo", ".git"]);
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml"]);

const secretPatterns = [
  { label: "private key", pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { label: "hardcoded credential", pattern: /\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd|pwd)\b\s*[:=]\s*["'`][^"'`]{12,}["'`]/i },
  { label: "aws access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { label: "github token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { label: "slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { label: "internal ipv4 address", pattern: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/ }
];

function repoPath(relativePath) {
  return path.join(root, relativePath);
}

function walk(relativePath, files = []) {
  const absolutePath = repoPath(relativePath);
  if (!existsSync(absolutePath)) {
    return files;
  }

  const stats = statSync(absolutePath);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) {
      if (ignoredDirs.has(entry)) {
        continue;
      }
      walk(path.join(relativePath, entry), files);
    }
    return files;
  }

  if (allowedExtensions.has(path.extname(relativePath))) {
    files.push(relativePath);
  }

  return files;
}

const findings = [];
const files = scanRoots.flatMap((scanRoot) => walk(scanRoot));

for (const file of files) {
  const content = readFileSync(repoPath(file), "utf8");
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const { label, pattern } of secretPatterns) {
      if (pattern.test(line)) {
        findings.push(`${file}:${index + 1} ${label}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} files).`);
