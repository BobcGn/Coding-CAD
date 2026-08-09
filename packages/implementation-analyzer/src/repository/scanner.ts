import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { detectLanguages } from "../detector/language-detector.js";
import type { RepositorySnapshot } from "./snapshot.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".turbo",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "target",
  "vendor"
]);

const CONFIG_FILE_NAMES = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "go.mod",
  "Cargo.toml",
  "composer.json",
  "nest-cli.json"
]);

export class RepositoryScanner {
  async scan(rootPath: string): Promise<RepositorySnapshot> {
    const absoluteRoot = path.resolve(rootPath);
    const rootStats = await stat(absoluteRoot).catch(() => undefined);
    if (rootStats === undefined || !rootStats.isDirectory()) {
      throw new Error(`Repository path is not a directory: ${absoluteRoot}.`);
    }

    const files = await collectFiles(absoluteRoot);
    const configFiles = files.filter(isConfigFile);
    const dependencies = await readDependencies(absoluteRoot, configFiles);

    return {
      rootPath: absoluteRoot,
      files,
      languages: detectLanguages(files),
      configFiles,
      dependencies
    };
  }
}

async function collectFiles(rootPath: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path.join(directory, entry.name));
      } else if (entry.isFile()) {
        files.push(toRepositoryPath(path.relative(rootPath, path.join(directory, entry.name))));
      }
    }
  }

  await visit(rootPath);
  return files.sort();
}

function isConfigFile(file: string): boolean {
  const name = path.posix.basename(file);
  return CONFIG_FILE_NAMES.has(name)
    || /^tsconfig(?:\.[^.]+)?\.json$/.test(name)
    || /^package-lock\.json$/.test(name)
    || /^pnpm-lock\.yaml$/.test(name)
    || /^yarn\.lock$/.test(name);
}

async function readDependencies(rootPath: string, configFiles: readonly string[]): Promise<string[]> {
  const dependencies = new Set<string>();
  for (const file of configFiles) {
    const absolutePath = path.join(rootPath, file);
    if (path.posix.basename(file) === "package.json") {
      await addPackageJsonDependencies(absolutePath, dependencies);
    } else if (path.posix.basename(file) === "requirements.txt") {
      await addRequirementDependencies(absolutePath, dependencies);
    } else if (path.posix.basename(file) === "go.mod") {
      await addGoDependencies(absolutePath, dependencies);
    } else if (path.posix.basename(file) === "pom.xml") {
      await addMavenDependencies(absolutePath, dependencies);
    }
  }
  return [...dependencies].sort();
}

async function addPackageJsonDependencies(file: string, output: Set<string>): Promise<void> {
  try {
    const packageJson = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
    for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const values = packageJson[field];
      if (isRecord(values)) Object.keys(values).forEach((dependency) => output.add(dependency));
    }
  } catch (error) {
    throw new Error(`Cannot read dependency manifest ${file}: ${errorMessage(error)}`);
  }
}

async function addRequirementDependencies(file: string, output: Set<string>): Promise<void> {
  const source = await readFile(file, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const dependency = line.trim().split(/[<>=!~\s\[]/, 1)[0];
    if (dependency && !dependency.startsWith("#") && !dependency.startsWith("-")) output.add(dependency);
  }
}

async function addGoDependencies(file: string, output: Set<string>): Promise<void> {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/^\s*([\w./-]+)\s+v\d/mg)) output.add(match[1]!);
}

async function addMavenDependencies(file: string, output: Set<string>): Promise<void> {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/<artifactId>\s*([^<]+)\s*<\/artifactId>/g)) output.add(match[1]!);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRepositoryPath(value: string): string {
  return value.split(path.sep).join("/");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
