import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepositorySnapshot } from "../repository/snapshot.js";
import type { ImplementationModule } from "../structure/module-analyzer.js";

export interface ModuleDependency {
  readonly fromModuleId: string;
  readonly toModuleId: string;
  readonly evidence: string;
  readonly confidence: number;
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
}

const IMPORT_PATTERN = /(?:from\s+|require\s*\(|import\s*\()\s*["']([^"']+)["']/g;

export class DependencyGraphBuilder {
  async build(
    snapshot: RepositorySnapshot,
    modules: readonly ImplementationModule[]
  ): Promise<DependencyGraph> {
    const moduleDependencies: ModuleDependency[] = [];
    const externalDependencies: ExternalDependencyUsage[] = [];

    for (const module of modules) {
      for (const file of module.files) {
        const source = await readFile(path.join(snapshot.rootPath, file), "utf8");
        for (const match of source.matchAll(IMPORT_PATTERN)) {
          const specifier = match[1];
          if (specifier === undefined) continue;
          if (specifier.startsWith(".")) {
            const target = findTargetModule(file, specifier, modules);
            if (target !== undefined && target.id !== module.id) {
              moduleDependencies.push({
                fromModuleId: module.id,
                toModuleId: target.id,
                evidence: `${file} imports ${specifier}.`,
                confidence: 0.9
              });
            }
          } else {
            externalDependencies.push({
              moduleId: module.id,
              dependency: packageName(specifier),
              evidence: `${file} imports ${specifier}.`,
              confidence: 0.95
            });
          }
        }
      }
    }

    return {
      moduleDependencies: dedupe(moduleDependencies, (edge) => `${edge.fromModuleId}:${edge.toModuleId}`),
      externalDependencies: dedupe(
        externalDependencies,
        (usage) => `${usage.moduleId}:${usage.dependency}`
      )
    };
  }
}

function findTargetModule(
  importingFile: string,
  specifier: string,
  modules: readonly ImplementationModule[]
): ImplementationModule | undefined {
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(importingFile), specifier));
  return modules.find((module) =>
    resolved === module.path || resolved.startsWith(`${module.path}/`)
  );
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
