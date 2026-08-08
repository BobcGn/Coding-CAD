import {
  findComponentDefinition,
  isStorageLike
} from "../context.js";
import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

const LARGE_USER_COUNT = 1_000_000;

export const scaleRule: ValidationRule = {
  id: "scale.future-planning",
  name: "Scale Rule",
  description: "Checks whether large projected scale should trigger architecture evolution planning.",
  validate(context) {
    const users = context.project.intent.scale?.users;
    if (users === undefined || users < LARGE_USER_COUNT) {
      return [];
    }

    const serviceCount = context.project.architecture.components.filter((component) =>
      component.type === "service"
      || component.kind === "backend-service"
      || component.kind === "worker"
    ).length;

    const storageCount = context.project.architecture.components.filter((component) => {
      const definition = findComponentDefinition(component, context.registry);
      return isStorageLike(component, definition);
    }).length;

    if (serviceCount <= 1 && storageCount <= 1) {
      return [
        {
          id: `${scaleRule.id}.single-service-single-storage`,
          severity: "INFO",
          title: "Large scale may require future scalability planning",
          description: `Project scale declares ${users} users, but the architecture currently has ${serviceCount} service component and ${storageCount} storage component.`,
          suggestion: "Consider documenting an evolution phase for cache, read-model, sharding, or event-driven architecture when traffic validates the need."
        }
      ];
    }

    return [];
  }
};
