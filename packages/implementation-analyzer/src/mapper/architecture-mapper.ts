import path from "node:path";
import type { ArchitectureProject, Component, Connection } from "@coding-cad/architecture-ir";
import { databaseForDependency, type TechnologyInfo } from "../detector/dependency-detector.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";
import type { RepositorySnapshot } from "../repository/snapshot.js";
import type { ImplementationModule } from "../structure/module-analyzer.js";

export interface RepositoryAnalysisEvidence {
  readonly snapshot: RepositorySnapshot;
  readonly technology: TechnologyInfo;
  readonly modules: readonly ImplementationModule[];
  readonly dependencyGraph: DependencyGraph;
}

export class ArchitectureMapper {
  map(evidence: RepositoryAnalysisEvidence): ArchitectureProject {
    const moduleComponents = evidence.modules.map((module) => moduleComponent(module, evidence.technology));
    const technologyComponents = evidence.technology.databases.map(technologyComponent);
    const components = [...moduleComponents, ...technologyComponents];
    const connections = [
      ...moduleConnections(evidence.dependencyGraph),
      ...technologyConnections(evidence.dependencyGraph, evidence.technology)
    ];
    const projectName = path.basename(evidence.snapshot.rootPath);

    return {
      version: "0.1",
      intent: {
        name: projectName,
        purpose: [`Describe the architecture reverse-engineered from repository ${projectName}.`]
      },
      domain: { entities: [] },
      architecture: {
        components,
        connections: dedupeConnections(connections)
      },
      constraints: [],
      decisions: []
    };
  }
}

function moduleComponent(module: ImplementationModule, technology: TechnologyInfo): Component {
  return {
    id: module.id,
    name: module.name,
    description: `${module.evidence} Repository path: ${module.path}.`,
    type: "service",
    capabilities: ["repository-derived-module"],
    logicalRole: "implementation-module",
    ...(technology.frameworks.length > 0 ? { technology: technology.frameworks.join(", ") } : {}),
    tags: [
      "implementation-analyzer",
      `confidence:${module.confidence.toFixed(2)}`
    ]
  };
}

function technologyComponent(technology: string): Component {
  if (technology === "Redis") {
    return {
      id: "redis",
      name: "Redis",
      type: "cache",
      capabilities: ["cache", "key-value"],
      limitations: ["not-primary-storage"],
      technology: "redis",
      tags: ["implementation-analyzer", "detected-from-dependency"]
    };
  }

  return {
    id: technologyId(technology),
    name: technology,
    type: "database",
    capabilities: databaseCapabilities(technology),
    technology: technology.toLowerCase(),
    tags: ["implementation-analyzer", "detected-from-dependency"]
  };
}

function databaseCapabilities(technology: string): readonly string[] {
  if (technology === "PostgreSQL" || technology === "MySQL" || technology === "SQLite") {
    return ["relational-storage", "durable-storage"];
  }
  return ["document-storage", "durable-storage"];
}

function moduleConnections(graph: DependencyGraph): Connection[] {
  return graph.moduleDependencies.map((edge) => ({
    id: `${edge.fromModuleId}-to-${edge.toModuleId}`,
    from: edge.fromModuleId,
    to: edge.toModuleId,
    protocol: "module-import",
    description: edge.evidence,
    mode: "sync",
    constraints: [`Detection confidence: ${edge.confidence.toFixed(2)}`]
  }));
}

function technologyConnections(
  graph: DependencyGraph,
  technology: TechnologyInfo
): Connection[] {
  return graph.externalDependencies.flatMap((usage) => {
    let database = databaseForDependency(usage.dependency);
    if (database === undefined && isOrm(usage.dependency)) {
      database = technology.databases.find((candidate) => candidate !== "Redis");
    }
    if (database === undefined) return [];
    const target = technologyId(database);
    return [{
      id: `${usage.moduleId}-to-${target}`,
      from: usage.moduleId,
      to: target,
      protocol: database === "Redis" ? "Redis protocol" : "database-client",
      description: usage.evidence,
      constraints: [`Detection confidence: ${usage.confidence.toFixed(2)}`]
    }];
  });
}

function technologyId(technology: string): string {
  return technology.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function isOrm(dependency: string): boolean {
  return ["@prisma/client", "prisma", "typeorm", "sequelize"].includes(dependency.toLowerCase());
}

function dedupeConnections(connections: readonly Connection[]): readonly Connection[] {
  const byId = new Map<string, Connection>();
  for (const connection of connections) if (!byId.has(connection.id)) byId.set(connection.id, connection);
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}
