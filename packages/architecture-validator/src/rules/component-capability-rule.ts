import {
  componentProvidesCapability,
  findComponentDefinition
} from "../context.js";
import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

export const componentCapabilityRule: ValidationRule = {
  id: "component.capability-mismatch",
  name: "Component Capability Validation",
  description: "Checks whether concrete component choices provide the capabilities declared by the architecture.",
  validate(context) {
    const issues: ValidationIssue[] = [];

    for (const component of context.project.architecture.components) {
      const definition = findComponentDefinition(component, context.registry);
      if (definition === undefined) {
        continue;
      }

      for (const capability of component.capabilities) {
        if (componentProvidesCapability(definition, capability)) {
          continue;
        }

        if (!isArchitectureRequirementCapability(capability)) {
          continue;
        }

        issues.push({
          id: `${componentCapabilityRule.id}.${component.id}.${capability}`,
          severity: "ERROR",
          title: `${definition.name} does not provide ${capability} capability`,
          description: `${component.name} declares the '${capability}' capability, but the registry entry for ${definition.name} does not list that capability.`,
          affectedComponent: component.id,
          suggestion: `Choose a component with '${capability}' capability or change the architecture role assigned to ${component.name}.`
        });
      }
    }

    return issues;
  }
};

function isArchitectureRequirementCapability(capability: string): boolean {
  const normalized = capability.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");

  return normalized.includes("transaction")
    || normalized.includes("strong-consistency")
    || normalized.includes("primary-storage")
    || normalized.includes("source-of-truth")
    || normalized.includes("system-of-record");
}
