import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import type { RepositorySnapshot } from "../repository/snapshot.js";

export type EvidenceSourceType = "declared" | "resolved" | "inferred";

export interface ImplementationModule {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly files: readonly string[];
  readonly confidence: number;
  readonly evidence: string;
  readonly sourceType: EvidenceSourceType;
  readonly exports?: readonly string[];
  readonly packageJsonName?: string;
}

const SOURCE_EXTENSION = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const SERVICE_FILE = /(?:^|\/)([^/]+)\.service\.(?:ts|js)$/;

export class ModuleAnalyzer {
  async analyze(snapshot: RepositorySnapshot): Promise<readonly ImplementationModule[]> {
    let modules: ImplementationModule[];

    if (snapshot.workspacePackages && snapshot.workspacePackages.length > 0) {
      modules = await this.analyzeWorkspacePackages(snapshot);
    } else {
      modules = await this.analyzeSingleRepository(snapshot);
    }

    // Extract public exports for each module using TS Compiler API (L3)
    const enrichedModules: ImplementationModule[] = [];
    for (const mod of modules) {
      const publicExports = await extractModuleExports(snapshot.rootPath, mod);
      enrichedModules.push({
        ...mod,
        exports: publicExports
      });
    }

    return dedupeModules(enrichedModules);
  }

  private async analyzeWorkspacePackages(
    snapshot: RepositorySnapshot
  ): Promise<ImplementationModule[]> {
    const workspaceModules: ImplementationModule[] = [];

    for (const pkg of snapshot.workspacePackages ?? []) {
      const pkgFiles = snapshot.files.filter(
        (file) => file === pkg.path || file.startsWith(`${pkg.path}/`)
      );
      const serviceFiles = pkgFiles.filter((file) => SERVICE_FILE.test(file));
      const pkgStem = path.posix.basename(pkg.path);

      if (serviceFiles.length > 1) {
        // Multiple services within package (e.g. synthetic large fixture)
        for (const serviceFile of serviceFiles) {
          const match = SERVICE_FILE.exec(serviceFile);
          const serviceStem = match ? match[1]! : "service";
          const id = `${kebabCase(pkgStem)}-${kebabCase(serviceStem)}-service`;
          const name = `${pkgStem.replace(/[^a-zA-Z0-9]/g, "")}_${serviceStem}Service`;
          workspaceModules.push({
            id,
            name,
            path: path.posix.dirname(serviceFile),
            files: [serviceFile],
            confidence: 1.0,
            sourceType: "declared",
            evidence: `Declared workspace package in ${pkg.packageJsonFile} containing service ${serviceFile}.`,
            packageJsonName: pkg.name
          });
        }
      } else if (serviceFiles.length === 1) {
        // Single service in package (e.g. small-monorepo)
        const serviceFile = serviceFiles[0]!;
        const match = SERVICE_FILE.exec(serviceFile);
        const serviceStem = match ? match[1]! : pkgStem;
        const id = `${kebabCase(serviceStem)}-service`;
        const name = `${pascalCase(serviceStem)}Service`;
        workspaceModules.push({
          id,
          name,
          path: pkg.path,
          files: pkgFiles,
          confidence: 1.0,
          sourceType: "declared",
          evidence: `Declared workspace package in ${pkg.packageJsonFile} with service ${serviceFile}.`,
          packageJsonName: pkg.name
        });
      } else {
        // Dedicated package without service files (e.g. Coding-CAD core packages and apps)
        const id = kebabCase(pkgStem);
        const name = pascalCase(pkgStem);
        workspaceModules.push({
          id,
          name,
          path: pkg.path,
          files: pkgFiles,
          confidence: 1.0,
          sourceType: "declared",
          evidence: `Declared workspace package in ${pkg.packageJsonFile} (name: ${pkg.name}).`,
          packageJsonName: pkg.name
        });
      }
    }

    return workspaceModules;
  }

  private async analyzeSingleRepository(
    snapshot: RepositorySnapshot
  ): Promise<ImplementationModule[]> {
    const sourceFiles = snapshot.files.filter((file) => file.startsWith("src/") && SOURCE_EXTENSION.test(file));

    // L2: Resolved service modules
    const serviceModules: ImplementationModule[] = sourceFiles.flatMap((file) => {
      const match = SERVICE_FILE.exec(file);
      if (match === null) return [];
      const stem = match[1]!;
      const modulePath = path.posix.dirname(file);
      return [{
        id: `${kebabCase(stem)}-service`,
        name: `${pascalCase(stem)}Service`,
        path: modulePath,
        files: [file],
        confidence: 0.9,
        sourceType: "resolved",
        evidence: `Detected service file ${file}.`
      }];
    });

    // L4: Inferred directory modules
    const coveredPaths = new Set(serviceModules.map((module) => module.path));
    const directoryModules: ImplementationModule[] = [...new Set(sourceFiles.flatMap((file) => {
      const segments = file.split("/");
      return segments.length > 2 ? [`src/${segments[1]}`] : [];
    }))]
      .filter((directory) => ![...coveredPaths].some((covered) =>
        covered === directory || covered.startsWith(`${directory}/`)
      ))
      .map((directory) => {
        const stem = path.posix.basename(directory);
        return {
          id: `${kebabCase(stem)}-service`,
          name: `${pascalCase(stem)}Service`,
          path: directory,
          files: sourceFiles.filter((file) => file.startsWith(`${directory}/`)),
          confidence: 0.65,
          sourceType: "inferred",
          evidence: `Inferred module from source directory ${directory}.`
        };
      });

    return [...serviceModules, ...directoryModules];
  }
}

async function extractModuleExports(
  rootPath: string,
  mod: ImplementationModule
): Promise<readonly string[]> {
  const exports = new Set<string>();

  // Candidates: entry point or files in module
  const candidateFiles = mod.files.filter((file) =>
    file.endsWith("index.ts") ||
    file.endsWith("index.js") ||
    SERVICE_FILE.test(file) ||
    mod.files.length <= 5
  );

  const filesToScan = candidateFiles.length > 0 ? candidateFiles : mod.files.slice(0, 5);

  for (const relativeFile of filesToScan) {
    const absolutePath = path.join(rootPath, relativeFile);
    try {
      const source = await readFile(absolutePath, "utf8");
      const sf = ts.createSourceFile(relativeFile, source, ts.ScriptTarget.Latest, true);

      for (const statement of sf.statements) {
        if (ts.isExportDeclaration(statement)) {
          if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
            for (const elem of statement.exportClause.elements) {
              exports.add(elem.name.text);
            }
          } else if (!statement.exportClause && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
            // Re-export star (export * from "./sub")
            const subSpecifier = statement.moduleSpecifier.text;
            if (subSpecifier.startsWith(".")) {
              const subRelative = resolveRelativePath(relativeFile, subSpecifier);
              if (subRelative) {
                const subAbsolute = path.join(rootPath, subRelative);
                try {
                  const subSource = await readFile(subAbsolute, "utf8");
                  const subSf = ts.createSourceFile(subRelative, subSource, ts.ScriptTarget.Latest, true);
                  extractExportsFromSourceFile(subSf, exports);
                } catch {
                  // ignore
                }
              }
            }
          }
        } else {
          extractExportsFromStatement(statement, exports);
        }
      }
    } catch {
      // ignore
    }
  }

  return [...exports].sort();
}

function extractExportsFromSourceFile(sf: ts.SourceFile, exports: Set<string>): void {
  for (const statement of sf.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const elem of statement.exportClause.elements) {
          exports.add(elem.name.text);
        }
      }
    } else {
      extractExportsFromStatement(statement, exports);
    }
  }
}

function extractExportsFromStatement(statement: ts.Statement, exports: Set<string>): void {
  const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
  if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      exports.add(statement.name.text);
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      exports.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) exports.add(decl.name.text);
      }
    } else if (ts.isInterfaceDeclaration(statement)) {
      exports.add(statement.name.text);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      exports.add(statement.name.text);
    }
  } else if (ts.isExportAssignment(statement)) {
    exports.add("default");
  }
}

function resolveRelativePath(fromFile: string, specifier: string): string | undefined {
  const dir = path.posix.dirname(fromFile);
  let resolved = path.posix.normalize(path.posix.join(dir, specifier));
  if (resolved.endsWith(".js")) {
    resolved = resolved.replace(/\.js$/, ".ts");
  } else if (!path.posix.extname(resolved)) {
    resolved = `${resolved}.ts`;
  }
  return resolved;
}

function dedupeModules(modules: readonly ImplementationModule[]): readonly ImplementationModule[] {
  const byId = new Map<string, ImplementationModule>();
  for (const module of modules) if (!byId.has(module.id)) byId.set(module.id, module);
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function pascalCase(value: string): string {
  return value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}

function kebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
