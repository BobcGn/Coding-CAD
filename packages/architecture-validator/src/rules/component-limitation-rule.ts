import {
  findComponentDefinition,
  isPrimaryStorageCandidate
} from "../context.js";
import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

export const componentLimitationRule: ValidationRule = {
  id: "component.limitation-conflict",
  name: "Component Limitation Validation",
  description: "Checks whether selected components are used in ways their registry limitations warn against.",
  validate(context) {
    const issues: ValidationIssue[] = [];

    for (const component of context.project.architecture.components) {
      const definition = findComponentDefinition(component, context.registry);
      if (definition === undefined) {
        continue;
      }

      for (const limitation of definition.limitations) {
        if (limitation.id !== "not-primary-storage" || !isPrimaryStorageCandidate(component)) {
          continue;
        }

        issues.push({
          id: `${componentLimitationRule.id}.${component.id}.${limitation.id}`,
          severity: "WARNING",
          title: `${definition.name} should not be used as primary storage`,
          description: `${component.name} appears to own primary or ledger-like storage, but ${definition.name} has limitation '${limitation.id}': ${limitation.description}`,
          affectedComponent: component.id,
          suggestion: "Use durable transactional storage as the source of truth, and keep this component for cache or temporary state."
        });
      }
    }

    return issues;
  }
};
