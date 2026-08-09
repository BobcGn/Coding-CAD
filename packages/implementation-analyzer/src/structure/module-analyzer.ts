import path from "node:path";
import type { RepositorySnapshot } from "../repository/snapshot.js";

export interface ImplementationModule {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly files: readonly string[];
  readonly confidence: number;
  readonly evidence: string;
}

const SOURCE_EXTENSION = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const SERVICE_FILE = /(?:^|\/)([^/]+)\.service\.(?:ts|js)$/;

export class ModuleAnalyzer {
  analyze(snapshot: RepositorySnapshot): readonly ImplementationModule[] {
    const sourceFiles = snapshot.files.filter((file) => file.startsWith("src/") && SOURCE_EXTENSION.test(file));
    const serviceModules = sourceFiles.flatMap((file) => {
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
        evidence: `Detected service file ${file}.`
      }];
    });

    const coveredPaths = new Set(serviceModules.map((module) => module.path));
    const directoryModules = [...new Set(sourceFiles.flatMap((file) => {
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
          evidence: `Inferred module from source directory ${directory}.`
        };
      });

    return dedupeModules([...serviceModules, ...directoryModules]);
  }
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
