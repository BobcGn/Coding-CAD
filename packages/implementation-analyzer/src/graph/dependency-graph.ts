import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import type { DependencyKind, UsageStatus } from "../codec/evidence-codec.js";
import type { RepositorySnapshot, TsconfigPathsConfig, UnsupportedStructureReport } from "../repository/snapshot.js";
import type { EvidenceSourceType, ImplementationModule } from "../structure/module-analyzer.js";

export interface ModuleDependency {
  readonly fromModuleId: string;
  readonly toModuleId: string;
  readonly evidence: string;
  readonly confidence: number;
  readonly sourceType: EvidenceSourceType;
  readonly dependencyKind?: DependencyKind | undefined;
  readonly usageStatus?: UsageStatus | undefined;
  readonly evidencePath?: string | undefined;
}

export interface ExternalDependencyUsage {
  readonly moduleId: string;
  readonly dependency: string;
  readonly evidence: string;
  readonly confidence: number;
}

export interface DependencyGraph {
  readonly moduleDependencies: readonly ModuleDependency[];
  readonly externalDependencies: readonly ExternalDependencyUsage[];
  readonly unsupportedReports?: readonly UnsupportedStructureReport[];
}

export class DependencyGraphBuilder {
  async build(
    snapshot: RepositorySnapshot,
    modules: readonly ImplementationModule[]
  ): Promise<DependencyGraph> {
    const declaredDependencies: ModuleDependency[] = [];
    const resolvedDependencies: ModuleDependency[] = [];
    const externalDependencies: ExternalDependencyUsage[] = [];
    const syntaxReports: UnsupportedStructureReport[] = [];
    const isWorkspace = (snapshot.workspacePackages?.length ?? 0) > 0;

    // L1: Collect declared inter-package dependencies from workspace package.json manifests
    if (snapshot.workspacePackages && snapshot.workspacePackages.length > 0) {
      const packageMap = new Map(
        snapshot.workspacePackages.map((pkg) => [pkg.name, pkg])
      );

      for (const fromPkg of snapshot.workspacePackages) {
        const fromModules = modules.filter(
          (m) => m.packageJsonName === fromPkg.name || m.path === fromPkg.path
        );
        if (fromModules.length !== 1) {
          // If a package has multiple sub-services, inter-package dependencies are resolved from source imports
          continue;
        }
        const fromModule = fromModules[0]!;

        const depKindMap = new Map<string, DependencyKind>();
        for (const dep of fromPkg.dependencies) depKindMap.set(dep, "runtime");
        for (const dep of fromPkg.devDependencies) depKindMap.set(dep, "dev");
        for (const dep of fromPkg.peerDependencies) depKindMap.set(dep, "peer");

        const allDeps = [
          ...fromPkg.dependencies,
          ...fromPkg.devDependencies,
          ...fromPkg.peerDependencies
        ];

        for (const dep of allDeps) {
          const targetPkg = packageMap.get(dep);
          if (targetPkg !== undefined) {
            const targetModules = modules.filter(
              (m) => m.packageJsonName === targetPkg.name || m.path === targetPkg.path
            );
            if (targetModules.length === 1 && targetModules[0]!.id !== fromModule.id) {
              const targetModule = targetModules[0]!;
              const kind = depKindMap.get(dep) ?? "runtime";
              declaredDependencies.push({
                fromModuleId: fromModule.id,
                toModuleId: targetModule.id,
                evidence: `Declared in ${fromPkg.packageJsonFile} (${kind}) dependencies: "${dep}".`,
                confidence: 1.0,
                sourceType: "declared",
                dependencyKind: kind,
                evidencePath: fromPkg.packageJsonFile
              });
            }
          }
        }
      }
    }

    // L2: Parse AST using TypeScript Compiler API to resolve file-level imports
    for (const module of modules) {
      for (const file of module.files) {
        const absolutePath = path.join(snapshot.rootPath, file);
        let source: string;
        try {
          source = await readFile(absolutePath, "utf8");
        } catch {
          continue;
        }

        let sf: ts.SourceFile;
        try {
          sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
        } catch (error) {
          syntaxReports.push({
            type: "unparseable-syntax",
            reason: `Compiler API failed to parse syntax: ${errorMessage(error)}`,
            scope: file
          });
          continue;
        }

        // Check parse diagnostics for severe syntax errors
        const parseDiagnostics = (sf as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics;
        if (parseDiagnostics && parseDiagnostics.length > 0) {
          syntaxReports.push({
            type: "unparseable-syntax",
            reason: `Syntax diagnostic: ${ts.flattenDiagnosticMessageText(parseDiagnostics[0]?.messageText ?? "syntax error", "\n")}`,
            scope: file
          });
        }

        const imports = extractImportsFromAst(sf);

        for (const imp of imports) {
          let target: ImplementationModule | undefined;

          if (imp.specifier.startsWith(".")) {
            // Relative import
            target = findTargetModule(file, imp.specifier, modules);
          } else {
            // Check tsconfig path alias
            const aliased = resolveTsconfigPath(imp.specifier, snapshot.tsconfigPaths);
            if (aliased) {
              target = findTargetModule(file, aliased, modules);
            }
            // Non-relative import: check if it resolves to a workspace package
            if (!target) {
              target = findWorkspaceTargetModule(imp.specifier, imp.symbols, modules);
            }
          }

          if (target !== undefined && target.id !== module.id) {
            resolvedDependencies.push({
              fromModuleId: module.id,
              toModuleId: target.id,
              evidence: `${file} imports ${imp.specifier} resolving to ${target.path}.`,
              confidence: 0.9,
              sourceType: "resolved",
              evidencePath: file
            });
          } else if (!target && !imp.specifier.startsWith(".")) {
            if (!resolveTsconfigPath(imp.specifier, snapshot.tsconfigPaths)) {
              externalDependencies.push({
                moduleId: module.id,
                dependency: packageName(imp.specifier),
                evidence: `${file} imports ${imp.specifier}.`,
                confidence: 0.95
              });
            }
          }
        }
      }
    }

    // Merge L1 declared and L2 resolved dependencies with usage cross-validation
    const mergedDependencies = mergeDependencies(declaredDependencies, resolvedDependencies, isWorkspace);

    return {
      moduleDependencies: dedupe(mergedDependencies, (edge) => `${edge.fromModuleId}:${edge.toModuleId}`),
      externalDependencies: dedupe(
        externalDependencies,
        (usage) => `${usage.moduleId}:${usage.dependency}`
      ),
      unsupportedReports: syntaxReports
    };
  }
}

interface AstImport {
  readonly specifier: string;
  readonly symbols: readonly string[];
}

function extractImportsFromAst(sf: ts.SourceFile): AstImport[] {
  const imports: AstImport[] = [];

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      const symbols: string[] = [];

      if (node.importClause) {
        if (node.importClause.name) {
          symbols.push(node.importClause.name.text);
        }
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const elem of node.importClause.namedBindings.elements) {
              symbols.push((elem.propertyName ?? elem.name).text);
            }
          }
        }
      }

      imports.push({ specifier, symbols });
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({ specifier: node.moduleSpecifier.text, symbols: [] });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0]!)
    ) {
      imports.push({ specifier: node.arguments[0]!.text, symbols: [] });
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return imports;
}

function resolveTsconfigPath(
  specifier: string,
  tsconfigPaths: TsconfigPathsConfig | undefined
): string | undefined {
  if (!tsconfigPaths?.paths) return undefined;
  const baseUrl = tsconfigPaths.baseUrl ?? ".";

  for (const [pattern, targetPatterns] of Object.entries(tsconfigPaths.paths)) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (specifier === prefix || specifier.startsWith(`${prefix}/`)) {
        const suffix = specifier === prefix ? "" : specifier.slice(prefix.length + 1);
        for (const targetPattern of targetPatterns) {
          if (targetPattern.endsWith("/*")) {
            const targetPrefix = targetPattern.slice(0, -2);
            return path.posix.normalize(path.posix.join(baseUrl, targetPrefix, suffix));
          } else {
            return path.posix.normalize(path.posix.join(baseUrl, targetPattern));
          }
        }
      }
    } else if (pattern === specifier) {
      for (const targetPattern of targetPatterns) {
        return path.posix.normalize(path.posix.join(baseUrl, targetPattern));
      }
    }
  }

  return undefined;
}

function findTargetModule(
  importingFile: string,
  specifier: string,
  modules: readonly ImplementationModule[]
): ImplementationModule | undefined {
  const resolved = specifier.startsWith(".")
    ? path.posix.normalize(path.posix.join(path.posix.dirname(importingFile), specifier))
    : path.posix.normalize(specifier);
  const withoutExt = resolved.replace(/\.(?:ts|tsx|js|jsx|mjs|cjs)$/, "");

  // 1. First check for exact file match
  const fileMatch = modules.find((module) =>
    module.files.some((f) => {
      const fWithoutExt = f.replace(/\.(?:ts|tsx|js|jsx|mjs|cjs)$/, "");
      return f === resolved || fWithoutExt === withoutExt;
    })
  );
  if (fileMatch !== undefined) return fileMatch;

  // 2. Fall back to directory match
  return modules.find((module) => {
    const modPathWithoutExt = module.path.replace(/\.(?:ts|tsx|js|jsx|mjs|cjs)$/, "");
    if (resolved === module.path || resolved.startsWith(`${module.path}/`)) return true;
    if (withoutExt === modPathWithoutExt || withoutExt.startsWith(`${modPathWithoutExt}/`)) return true;
    return false;
  });
}

function findWorkspaceTargetModule(
  specifier: string,
  symbols: readonly string[],
  modules: readonly ImplementationModule[]
): ImplementationModule | undefined {
  const matchingModules = modules.filter(
    (m) => m.packageJsonName === specifier || m.id === specifier || m.path.endsWith(specifier)
  );

  if (matchingModules.length === 1) {
    return matchingModules[0];
  }

  if (matchingModules.length > 1) {
    // Disambiguate by imported symbols or service names
    for (const symbol of symbols) {
      const byExport = matchingModules.find(
        (m) => m.exports?.includes(symbol) || m.name.toLowerCase() === symbol.toLowerCase()
      );
      if (byExport) return byExport;
    }
    return matchingModules[0];
  }

  // Check prefix match for scoped packages, e.g. "@synthetic/pkg-23"
  const prefixMatches = modules.filter(
    (m) => m.packageJsonName && specifier.startsWith(m.packageJsonName)
  );
  if (prefixMatches.length === 1) return prefixMatches[0];
  if (prefixMatches.length > 1) {
    for (const symbol of symbols) {
      const byExport = prefixMatches.find(
        (m) => m.exports?.includes(symbol) || m.name.toLowerCase() === symbol.toLowerCase()
      );
      if (byExport) return byExport;
    }
    return prefixMatches[0];
  }

  return undefined;
}

function mergeDependencies(
  declared: readonly ModuleDependency[],
  resolved: readonly ModuleDependency[],
  isWorkspace: boolean
): ModuleDependency[] {
  const result: ModuleDependency[] = [];
  const resolvedByKey = new Map<string, ModuleDependency>();

  for (const edge of resolved) {
    resolvedByKey.set(`${edge.fromModuleId}:${edge.toModuleId}`, edge);
  }

  for (const edge of declared) {
    const key = `${edge.fromModuleId}:${edge.toModuleId}`;
    const matchingResolved = resolvedByKey.get(key);
    if (matchingResolved) {
      // Both declared and verified by resolved code import
      result.push({
        fromModuleId: edge.fromModuleId,
        toModuleId: edge.toModuleId,
        confidence: 1.0,
        sourceType: "declared",
        dependencyKind: edge.dependencyKind,
        usageStatus: "declared-and-used",
        evidence: `${edge.evidence} Confirmed by code import in ${matchingResolved.evidencePath ?? "source"}.`,
        evidencePath: edge.evidencePath
      });
      resolvedByKey.delete(key);
    } else {
      // Declared only (manifest dependency)
      result.push({
        fromModuleId: edge.fromModuleId,
        toModuleId: edge.toModuleId,
        confidence: 1.0,
        sourceType: "declared",
        dependencyKind: edge.dependencyKind,
        usageStatus: "declared-unused",
        evidence: `${edge.evidence} No direct code imports detected in workspace sources.`,
        evidencePath: edge.evidencePath
      });
    }
  }

  // Add remaining resolved dependencies (code import without manifest declaration or single-repo)
  for (const edge of resolvedByKey.values()) {
    if (isWorkspace) {
      result.push({
        ...edge,
        usageStatus: "undeclared-used",
        evidence: `${edge.evidence} Note: Undeclared in workspace package manifest.`
      });
    } else {
      result.push(edge);
    }
  }

  return result;
}

function packageName(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0]!;
}

function dedupe<T>(values: readonly T[], key: (value: T) => string): readonly T[] {
  const result = new Map<string, T>();
  for (const value of values) if (!result.has(key(value))) result.set(key(value), value);
  return [...result.values()];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

