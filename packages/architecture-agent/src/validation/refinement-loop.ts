import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";

export interface RefinementLoop {
  refine(
    architecture: ArchitectureProject,
    validation: ValidationResult
  ): Promise<ArchitectureProject>;
}

export class ValidatorFeedbackRefinementLoop implements RefinementLoop {
  async refine(
    architecture: ArchitectureProject,
    validation: ValidationResult
  ): Promise<ArchitectureProject> {
    let refined = architecture;

    for (const issue of validation.issues) {
      if (!isRedisPrimaryStorageIssue(issue.title, issue.description)) {
        continue;
      }

      refined = movePrimaryStorageFromRedisToPostgreSQL(refined);
    }

    return refined;
  }
}

function isRedisPrimaryStorageIssue(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes("redis") && (text.includes("primary storage") || text.includes("source of truth"));
}

function movePrimaryStorageFromRedisToPostgreSQL(project: ArchitectureProject): ArchitectureProject {
  const components = ensurePostgreSQL(
    project.architecture.components.map((component) => refineComponent(component))
  );

  return {
    ...project,
    architecture: {
      ...project.architecture,
      components,
      connections: ensurePointServiceToPostgreSQL(project.architecture.connections)
    },
    decisions: [
      ...project.decisions,
      {
        title: "Move ledger source of truth out of Redis",
        context: "Validator feedback identified Redis being used as primary or ledger-like storage.",
        decision: "Use PostgreSQL as the durable transactional source of truth and keep Redis only as a derived cache.",
        alternatives: ["Keep Redis as primary storage", "Remove cache entirely"],
        rationale: "The component registry marks Redis with the not-primary-storage limitation. PostgreSQL provides transaction and strong-consistency capabilities required for ledger-like point data."
      }
    ]
  };
}

function refineComponent(component: Component): Component {
  if (component.technology !== "redis" && component.name.toLowerCase() !== "redis") {
    return component;
  }

  return {
    ...component,
    type: "cache",
    capabilities: ["cache", "key-value", "high-performance-read"],
    limitations: ["not-primary-storage", "weak-consistency"],
    logicalRole: "read-cache",
    description: "Derived cache for fast reads; not the source of truth."
  };
}

function ensurePostgreSQL(components: readonly Component[]): readonly Component[] {
  if (components.some((component) => component.technology === "postgresql" || component.name.toLowerCase() === "postgresql")) {
    return components;
  }

  return [
    ...components,
    {
      id: "postgresql",
      name: "PostgreSQL",
      description: "Transactional source of truth introduced from Validator feedback.",
      type: "database",
      technology: "postgresql",
      capabilities: ["transaction", "relational-storage", "strong-consistency", "source-of-truth"],
      limitations: ["horizontal-scaling-complex"],
      logicalRole: "primary-storage",
      tags: ["ledger", "transactional-storage"]
    }
  ];
}

function ensurePointServiceToPostgreSQL(
  connections: ArchitectureProject["architecture"]["connections"]
): ArchitectureProject["architecture"]["connections"] {
  if (connections.some((connection) => connection.to === "postgresql")) {
    return connections;
  }

  const source = connections.find((connection) => connection.to === "redis")?.from ?? "point-service";

  return [
    ...connections,
    {
      id: `${source}-to-postgresql`,
      from: source,
      to: "postgresql",
      protocol: "SQL",
      description: "Persist durable ledger state in transactional storage."
    }
  ];
}
