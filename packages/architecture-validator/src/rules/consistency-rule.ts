import {
  componentProvidesCapability,
  findComponentDefinition,
  isStorageLike
} from "../context.js";
import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

export const consistencyRule: ValidationRule = {
  id: "project.consistency-conflict",
  name: "Consistency Rule",
  description: "Checks whether selected storage components can support the project's declared consistency requirement.",
  validate(context) {
    if (context.project.intent.requirements?.consistency !== "strong") {
      return [];
    }

    const issues: ValidationIssue[] = [];
    let hasStrongConsistencyStorage = false;

    for (const component of context.project.architecture.components) {
      const definition = findComponentDefinition(component, context.registry);
      if (!isStorageLike(component, definition)) {
        continue;
      }

      if (definition !== undefined && componentProvidesCapability(definition, "strong-consistency")) {
        hasStrongConsistencyStorage = true;
        continue;
      }

      if (definition === undefined) {
        continue;
      }

      const conflictingLimitation = definition.limitations.find((limitation) =>
        limitation.id === "weak-consistency"
        || limitation.id === "eventual-consistency"
        || limitation.id === "transaction-model-complexity"
      );

      if (conflictingLimitation !== undefined) {
        issues.push({
          id: `${consistencyRule.id}.${component.id}.${conflictingLimitation.id}`,
          severity: "WARNING",
          title: `Strong consistency requirement conflicts with ${definition.name}`,
          description: `Project intent requires strong consistency, but ${component.name} uses ${definition.name}, which has limitation '${conflictingLimitation.id}': ${conflictingLimitation.description}`,
          affectedComponent: component.id,
          suggestion: "Use a component with strong-consistency or transaction capability as the source of truth, and document any exception as an architecture decision."
        });
      }
    }

    if (!hasStrongConsistencyStorage && issues.length === 0) {
      issues.push({
        id: `${consistencyRule.id}.missing-strong-consistency-storage`,
        severity: "WARNING",
        title: "Strong consistency requirement has no matching storage component",
        description: "Project intent requires strong consistency, but the architecture does not include a known storage component with strong-consistency capability.",
        suggestion: "Select or register a storage component that can provide strong consistency for the required domain state."
      });
    }

    return issues;
  }
};
