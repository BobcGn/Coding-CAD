import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

export const dependencyRule: ValidationRule = {
  id: "dependency.circular",
  name: "Dependency Cycle Rule",
  description: "Detects circular component dependencies in the architecture graph.",
  validate(context) {
    const graph = new Map<string, string[]>();
    for (const component of context.project.architecture.components) {
      graph.set(component.id, []);
    }

    for (const connection of context.project.architecture.connections) {
      if (graph.has(connection.from) && graph.has(connection.to)) {
        graph.get(connection.from)?.push(connection.to);
      }
    }

    const issues: ValidationIssue[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const path: string[] = [];

    const visit = (node: string): void => {
      if (visiting.has(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = [...path.slice(cycleStart), node];
        issues.push({
          id: `${dependencyRule.id}.${cycle.join(".")}`,
          severity: "ERROR",
          title: "Circular dependency detected",
          description: `Architecture graph contains a circular dependency: ${cycle.join(" -> ")}.`,
          affectedComponent: node,
          suggestion: "Break the cycle by introducing an event boundary, moving shared behavior into a separate component, or reversing one dependency."
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

    return dedupeIssues(issues);
  }
};

function dedupeIssues(issues: readonly ValidationIssue[]): readonly ValidationIssue[] {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = `${issue.title}:${issue.description}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
