import { detectFrameworks } from "./framework-detector.js";

export interface TechnologyInfo {
  readonly languages: readonly string[];
  readonly frameworks: readonly string[];
  readonly databases: readonly string[];
  readonly libraries: readonly string[];
}

const DATABASES: Readonly<Record<string, string>> = {
  pg: "PostgreSQL",
  postgres: "PostgreSQL",
  redis: "Redis",
  ioredis: "Redis",
  mongodb: "MongoDB",
  mongoose: "MongoDB",
  mysql: "MySQL",
  mysql2: "MySQL",
  sqlite3: "SQLite",
  "better-sqlite3": "SQLite"
};

const NAMED_LIBRARIES: Readonly<Record<string, string>> = {
  "@prisma/client": "Prisma",
  prisma: "Prisma",
  typeorm: "TypeORM",
  sequelize: "Sequelize",
  zod: "Zod"
};

export class DependencyDetector {
  detect(languages: readonly string[], dependencies: readonly string[]): TechnologyInfo {
    const databases = dependencies.flatMap((dependency) => {
      const database = databaseForDependency(dependency);
      return database === undefined ? [] : [database];
    });
    const frameworks = detectFrameworks(dependencies);
    const knownFrameworks = new Set(frameworks);
    const libraries = dependencies.flatMap((dependency) => {
      const named = NAMED_LIBRARIES[dependency.toLowerCase()];
      if (named !== undefined) return [named];
      if (databaseForDependency(dependency) !== undefined) return [];
      const detectedFramework = detectFrameworks([dependency])[0];
      return detectedFramework !== undefined && knownFrameworks.has(detectedFramework) ? [] : [dependency];
    });

    return {
      languages: [...languages],
      frameworks,
      databases: [...new Set(databases)].sort(),
      libraries: [...new Set(libraries)].sort()
    };
  }
}

export function databaseForDependency(dependency: string): string | undefined {
  return DATABASES[dependency.toLowerCase()];
}
