#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

const allowedTypes = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert"
]);

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

function commits({ from, to }) {
  if (!from || !to || isZeroSha(from)) {
    console.log("Commit message check skipped: no commit range was supplied.");
    return [];
  }

  const output = git(["log", "--format=%H%x00%s", `${from}..${to}`]);
  if (!output) {
    return [];
  }

  return output.split("\n").map((line) => {
    const [sha, subject] = line.split("\0");
    return { sha, subject };
  });
}

function validateSubject(subject) {
  if (/^(Merge|Revert)\b/.test(subject)) {
    return [];
  }

  const errors = [];
  const match = subject.match(/^([a-z]+)(\(([a-z0-9-]{1,15})\))?(!)?: (.+)$/);

  if (!match) {
    return ["Subject must follow Conventional Commits: type(optional-scope): description"];
  }

  const [, type, , scope, , description] = match;

  if (!allowedTypes.has(type)) {
    errors.push(`Unsupported type: ${type}`);
  }
  if (scope && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(scope)) {
    errors.push(`Invalid scope: ${scope}`);
  }
  if (subject.length > 72) {
    errors.push(`Subject exceeds 72 characters (${subject.length})`);
  }
  if (!/^[a-z]/.test(description)) {
    errors.push("Description must start with a lowercase letter");
  }
  if (description.endsWith(".")) {
    errors.push("Description must not end with a period");
  }

  return errors;
}

const checkedCommits = commits(parseArgs());
const failures = [];

for (const commit of checkedCommits) {
  const errors = validateSubject(commit.subject);
  if (errors.length > 0) {
    failures.push({ ...commit, errors });
  }
}

if (failures.length > 0) {
  console.error("Commit message check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.sha.slice(0, 8)} ${failure.subject}`);
    for (const error of failure.errors) {
      console.error(`  - ${error}`);
    }
  }
  process.exit(1);
}

console.log(`Commit message check passed (${checkedCommits.length} commits).`);
