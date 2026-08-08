import type {
  ArchitectureDiagnostic,
  ArchitectureIR,
  Component,
  Connection
} from "@coding-cad/architecture-ir";

export function validateArchitecture(ir: ArchitectureIR): readonly ArchitectureDiagnostic[] {
  return [
    ...validateTechnologyMisuse(ir),
    ...validateServiceCycles(ir)
  ];
}

/**
 * Flags technology choices that conflict with the declared architectural role.
 * These rules intentionally use conservative heuristics until the IR contains
 * richer semantic annotations for storage ownership and consistency boundaries.
 */
function validateTechnologyMisuse(ir: ArchitectureIR): readonly ArchitectureDiagnostic[] {
  const diagnostics: ArchitectureDiagnostic[] = [];

  for (const component of ir.architecture.components) {
    const technology = normalize(component.technology ?? component.name);
    const capabilities = component.capabilities.map(normalize);
    const logicalRole = normalize(component.logicalRole ?? "");

    if (technology === "redis" && indicatesTransactionalStorage(component, capabilities, logicalRole)) {
      diagnostics.push({
        id: "technology.redis-transactional-storage",
        severity: "error",
        componentId: component.id,
        message: `${component.name} uses Redis as transactional storage.`,
        rationale: "Redis is suitable for cache and high-frequency ephemeral access, but it should not be the system of record for strong transactional data."
      });
    }

    if (technology === "mongodb" && indicatesStrongTransactionBoundary(ir, component, capabilities, logicalRole)) {
      diagnostics.push({
        id: "technology.mongodb-strong-transaction-boundary",
        severity: "warning",
        componentId: component.id,
        message: `${component.name} appears to carry a strong transaction boundary on MongoDB.`,
        rationale: "MongoDB can support transactions in specific cases, but Coding CAD should make strong transaction boundaries explicit and compare alternatives such as PostgreSQL."
      });
    }
  }

  for (const binding of ir.technologyBindings ?? []) {
    const technology = normalize(binding.technology);
    const role = normalize(binding.logicalRole);

    if (technology === "redis" && role.includes("transaction")) {
      diagnostics.push({
        id: "binding.redis-transactional-storage",
        severity: "error",
        ...optionalComponentId(binding.componentId),
        message: `Technology binding ${binding.id} maps transactional storage to Redis.`,
        rationale: "A technology binding should separate logical intent from implementation and prevent Redis from becoming the strong transaction store."
      });
    }

    if (technology === "mongodb" && role.includes("strong-transaction")) {
      diagnostics.push({
        id: "binding.mongodb-strong-transaction",
        severity: "warning",
        ...optionalComponentId(binding.componentId),
        message: `Technology binding ${binding.id} maps strong transactions to MongoDB.`,
        rationale: "Strong transaction requirements need an explicit architecture decision when using MongoDB."
      });
    }
  }

  return diagnostics;
}

function indicatesTransactionalStorage(
  component: Component,
  capabilities: readonly string[],
  logicalRole: string
): boolean {
  return component.kind === "database"
    || logicalRole.includes("transaction")
    || logicalRole.includes("system-of-record")
    || capabilities.some((capability) =>
      capability.includes("transaction")
      || capability.includes("system-of-record")
      || capability.includes("ledger")
    );
}

function indicatesStrongTransactionBoundary(
  ir: ArchitectureIR,
  component: Component,
  capabilities: readonly string[],
  logicalRole: string
): boolean {
  return ir.project.requirements?.consistency === "strong"
    || logicalRole.includes("strong-transaction")
    || capabilities.some((capability) => capability.includes("strong-transaction"));
}

function validateServiceCycles(ir: ArchitectureIR): readonly ArchitectureDiagnostic[] {
  const serviceIds = new Set(
    ir.architecture.components
      .filter((component) => component.kind === "backend-service" || component.kind === "worker" || component.kind === "ai-agent")
      .map((component) => component.id)
  );

  const graph = new Map<string, string[]>();
  for (const id of serviceIds) {
    graph.set(id, []);
  }

  for (const connection of ir.architecture.connections ?? []) {
    if (serviceIds.has(connection.from) && serviceIds.has(connection.to)) {
      graph.get(connection.from)?.push(connection.to);
    }
  }

  const diagnostics: ArchitectureDiagnostic[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const path: string[] = [];

  // Track the active DFS path so the diagnostic can name the cycle, not only fail.
  const visit = (node: string): void => {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = [...path.slice(cycleStart), node];
      diagnostics.push({
        id: "dependency.service-cycle",
        severity: "error",
        message: `Service dependency cycle detected: ${cycle.join(" -> ")}.`,
        rationale: "Service cycles make ownership, deployment, and agent-driven implementation harder to reason about."
      });
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visiting.add(node);
    path.push(node);

    for (const next of graph.get(node) ?? []) {
      visit(next);
    }

    path.pop();
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of graph.keys()) {
    visit(node);
  }

  return dedupeDiagnostics(diagnostics);
}

function dedupeDiagnostics(diagnostics: readonly ArchitectureDiagnostic[]): readonly ArchitectureDiagnostic[] {
  const seen = new Set<string>();

  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.id}:${diagnostic.message}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
}

function optionalComponentId(componentId: string | undefined): Pick<ArchitectureDiagnostic, "componentId"> | Record<string, never> {
  return componentId === undefined ? {} : { componentId };
}
