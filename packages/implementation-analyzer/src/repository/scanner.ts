import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { detectLanguages } from "../detector/language-detector.js";
import type { RepositorySnapshot, TsconfigPathsConfig, UnsupportedStructureReport, WorkspacePackageInfo } from "./snapshot.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".svn",
  ".hg",
  ".turbo",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "target",
  "vendor",
  "fixtures",
  "fixture"
]);

function isIgnoredFile(name: string): boolean {
  return name.startsWith(".env") || name.endsWith(".pem") || name.endsWith(".key") || name.startsWith("id_rsa");
}

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
    const languages = detectLanguages(files);

    const unsupportedStructures: UnsupportedStructureReport[] = [];

    // Detect unsupported languages
    for (const language of languages) {
      if (!["TypeScript", "JavaScript"].includes(language)) {
        unsupportedStructures.push({
          type: "unsupported-language",
          reason: `Language '${language}' detected. Phase 4 analyzer extracts module and dependency structure for TypeScript/JavaScript repositories.`,
          scope: rootPath
        });
      }
    }

    // Detect unsupported manifests
    for (const configFile of configFiles) {
      const base = path.posix.basename(configFile);
      if (["pom.xml", "go.mod", "Cargo.toml", "requirements.txt", "pyproject.toml", "composer.json"].includes(base)) {
        unsupportedStructures.push({
          type: "unsupported-manifest",
          reason: `Manifest '${base}' is not supported for module resolution in Phase 4.`,
          scope: configFile
        });
      }
    }

    // Discover workspace packages (L1)
    const { workspacePackages, workspaceReports } = await discoverWorkspacePackages(absoluteRoot, files);
    unsupportedStructures.push(...workspaceReports);

    // Read tsconfig paths for alias resolution (L2)
    const tsconfigPaths = await readTsconfigPaths(absoluteRoot, files);

    return {
      rootPath: absoluteRoot,
      files,
      languages,
      configFiles,
      dependencies,
      workspacePackages,
      unsupportedStructures,
      tsconfigPaths
    };
  }
}

async function collectFiles(rootPath: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        try {
          const resolvedTarget = await realpath(fullPath);
          if (!resolvedTarget.startsWith(rootPath + path.sep) && resolvedTarget !== rootPath) {
            // Symlink points outside root: do not follow
            continue;
          }
          const targetStat = await stat(resolvedTarget);
          if (targetStat.isDirectory()) {
            if (!IGNORED_DIRECTORIES.has(entry.name)) {
              await visit(resolvedTarget);
            }
          } else if (targetStat.isFile()) {
            if (!isIgnoredFile(entry.name)) {
              files.push(toRepositoryPath(path.relative(rootPath, resolvedTarget)));
            }
          }
        } catch {
          // ignore broken symlink
        }
      } else if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(fullPath);
      } else if (entry.isFile()) {
        if (!isIgnoredFile(entry.name)) {
          files.push(toRepositoryPath(path.relative(rootPath, fullPath)));
        }
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
    || /^yarn\.lock$/.test(name)
    || /^pnpm-workspace\.yaml$/.test(name);
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

/** Discovers workspace packages based on pnpm-workspace.yaml or root package.json workspaces. */
async function discoverWorkspacePackages(
  rootPath: string,
  files: readonly string[]
): Promise<{ workspacePackages: WorkspacePackageInfo[]; workspaceReports: UnsupportedStructureReport[] }> {
  const workspacePackages: WorkspacePackageInfo[] = [];
  const workspaceReports: UnsupportedStructureReport[] = [];

  const workspacePatterns = await readWorkspacePatterns(rootPath, files);
  if (workspacePatterns.length === 0) {
    return { workspacePackages, workspaceReports };
  }

  // Find all package.json files in subdirectories
  const packageJsonFiles = files.filter(
    (file) => file.endsWith("/package.json") && file !== "package.json"
  );

  for (const pkgFile of packageJsonFiles) {
    const pkgDir = path.posix.dirname(pkgFile);
    if (!matchesAnyPattern(pkgDir, workspacePatterns)) {
      continue;
    }

    const absolutePkgPath = path.join(rootPath, pkgFile);
    try {
      const content = await readFile(absolutePkgPath, "utf8");
      const pkg = JSON.parse(content) as Record<string, unknown>;
      const name = typeof pkg["name"] === "string" ? pkg["name"] : path.posix.basename(pkgDir);
      const dependencies = isRecord(pkg["dependencies"]) ? Object.keys(pkg["dependencies"]) : [];
      const devDependencies = isRecord(pkg["devDependencies"]) ? Object.keys(pkg["devDependencies"]) : [];
      const peerDependencies = isRecord(pkg["peerDependencies"]) ? Object.keys(pkg["peerDependencies"]) : [];
      const main = typeof pkg["main"] === "string" ? pkg["main"] : undefined;
      const types = typeof pkg["types"] === "string" ? pkg["types"] : undefined;

      workspacePackages.push({
        name,
        path: pkgDir,
        packageJsonFile: pkgFile,
        dependencies,
        devDependencies,
        peerDependencies,
        main,
        types
      });
    } catch (error) {
      workspaceReports.push({
        type: "unsupported-manifest",
        reason: `Failed to parse workspace package.json: ${errorMessage(error)}`,
        scope: pkgFile
      });
    }
  }

  if (workspacePackages.length === 0 && workspacePatterns.length > 0) {
    workspaceReports.push({
      type: "unknown-workspace-layout",
      reason: `Workspace patterns declared (${workspacePatterns.join(", ")}), but no matching package.json files found.`,
      scope: rootPath
    });
  }

  return {
    workspacePackages: workspacePackages.sort((left, right) => left.path.localeCompare(right.path)),
    workspaceReports
  };
}

async function readWorkspacePatterns(rootPath: string, files: readonly string[]): Promise<string[]> {
  const patterns: string[] = [];

  // Check pnpm-workspace.yaml
  if (files.includes("pnpm-workspace.yaml")) {
    try {
      const content = await readFile(path.join(rootPath, "pnpm-workspace.yaml"), "utf8");
      let inPackages = false;
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("packages:")) {
          inPackages = true;
          continue;
        }
        if (inPackages) {
          if (trimmed.startsWith("-")) {
            const raw = trimmed.replace(/^-\s*/, "").replace(/^['"]|['"]$/g, "").trim();
            if (raw.length > 0) patterns.push(raw);
          } else if (trimmed.length > 0 && !trimmed.startsWith("#")) {
            // Next YAML section
            inPackages = false;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Check root package.json workspaces
  if (files.includes("package.json") && patterns.length === 0) {
    try {
      const content = await readFile(path.join(rootPath, "package.json"), "utf8");
      const pkg = JSON.parse(content) as Record<string, unknown>;
      if (Array.isArray(pkg["workspaces"])) {
        for (const item of pkg["workspaces"]) {
          if (typeof item === "string") patterns.push(item);
        }
      } else if (isRecord(pkg["workspaces"]) && Array.isArray(pkg["workspaces"]["packages"])) {
        for (const item of pkg["workspaces"]["packages"]) {
          if (typeof item === "string") patterns.push(item);
        }
      }
    } catch {
      // ignore
    }
  }

  return patterns;
}

function matchesAnyPattern(dir: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    // Pattern like "packages/*"
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (dir.startsWith(`${prefix}/`)) {
        const remaining = dir.slice(prefix.length + 1);
        return !remaining.includes("/");
      }
      return false;
    }
    // Pattern like "packages/**"
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3);
      return dir === prefix || dir.startsWith(`${prefix}/`);
    }
    // Exact directory pattern
    return dir === pattern;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRepositoryPath(value: string): string {
  return value.split(path.sep).join("/");
}

async function readTsconfigPaths(
  rootPath: string,
  files: readonly string[]
): Promise<TsconfigPathsConfig | undefined> {
  const tsconfigFile = files.find((f) => f === "tsconfig.json");
  if (!tsconfigFile) return undefined;

  try {
    const content = await readFile(path.join(rootPath, tsconfigFile), "utf8");
    const result = ts.parseConfigFileTextToJson(tsconfigFile, content);
    if (result.config && typeof result.config === "object") {
      const compilerOptions = result.config["compilerOptions"];
      if (compilerOptions && typeof compilerOptions === "object") {
        const baseUrl = typeof compilerOptions["baseUrl"] === "string" ? compilerOptions["baseUrl"] : undefined;
        const rawPaths = compilerOptions["paths"];
        let paths: Record<string, string[]> | undefined;
        if (rawPaths && typeof rawPaths === "object") {
          paths = {};
          for (const [key, value] of Object.entries(rawPaths)) {
            if (Array.isArray(value)) {
              paths[key] = value.filter((v): v is string => typeof v === "string");
            }
          }
        }
        return { baseUrl, paths };
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
