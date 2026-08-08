import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

/**
 * Cross-reference integrity is checked here rather than in the IR package:
 * Architecture IR remains a technology-independent data model, while the
 * validator explains malformed graph relationships without mutating them.
 */
export const graphIntegrityRule: ValidationRule = {
  id: "graph.integrity",
  name: "Architecture Graph Integrity Rule",
  description: "Checks component identity uniqueness and connection endpoint references.",
  validate(context) {
    const issues: ValidationIssue[] = [];
    const componentIds = new Set<string>();

    for (const component of context.project.architecture.components) {
      if (componentIds.has(component.id)) {
        issues.push({
          id: `${graphIntegrityRule.id}.duplicate-component.${component.id}`,
          severity: "ERROR",
          title: `Duplicate component id: ${component.id}`,
          description: `Architecture component ids are graph identity keys, but '${component.id}' is declared more than once. Connections and diagnostics cannot resolve that id unambiguously.`,
          affectedComponent: component.id,
          suggestion: "Give every component a unique stable id and update its connection references."
        });
        continue;
      }

      componentIds.add(component.id);
    }

    for (const connection of context.project.architecture.connections) {
      if (!componentIds.has(connection.from)) {
        issues.push(missingEndpointIssue(connection.id, "source", connection.from));
      }

      if (!componentIds.has(connection.to)) {
        issues.push(missingEndpointIssue(connection.id, "target", connection.to));
      }
    }

    return issues;
  }
};

function missingEndpointIssue(
  connectionId: string,
  endpoint: "source" | "target",
  componentId: string
): ValidationIssue {
  return {
    id: `${graphIntegrityRule.id}.missing-${endpoint}.${connectionId}`,
    severity: "ERROR",
    title: `Connection ${connectionId} has an unknown ${endpoint} component`,
    description: `Connection '${connectionId}' references '${componentId}' as its ${endpoint}, but no architecture component declares that id.`,
    affectedComponent: componentId,
    suggestion: "Add the missing component or update the connection to reference an existing component id."
  };
}
