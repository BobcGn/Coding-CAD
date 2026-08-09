import type { Component } from "@coding-cad/architecture-ir";
import type { ImplementationModel } from "../types.js";

const INFRASTRUCTURE_TYPES = new Set(["database", "cache", "queue", "storage"]);

export function findActualComponent(
  expected: Component,
  implementation: ImplementationModel
): Component | undefined {
  const actualComponents = implementation.architecture.architecture.components;
  const expectedKeys = componentKeys(expected);
  const exact = actualComponents.find((actual) =>
    componentKeys(actual).some((key) => expectedKeys.includes(key))
  );
  if (exact !== undefined) return exact;

  return expected.type !== undefined && INFRASTRUCTURE_TYPES.has(expected.type)
    ? actualComponents.find((actual) => actual.type === expected.type)
    : undefined;
}

export function findExpectedComponent(
  actual: Component,
  expectedComponents: readonly Component[]
): Component | undefined {
  const actualKeys = componentKeys(actual);
  const exact = expectedComponents.find((expected) =>
    componentKeys(expected).some((key) => actualKeys.includes(key))
  );
  if (exact !== undefined) return exact;

  return actual.type !== undefined && INFRASTRUCTURE_TYPES.has(actual.type)
    ? expectedComponents.find((expected) => expected.type === actual.type)
    : undefined;
}

export function technologyName(component: Component): string | undefined {
  if (component.technology !== undefined) return component.technology;
  return component.type !== undefined && INFRASTRUCTURE_TYPES.has(component.type)
    ? component.name
    : undefined;
}

export function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function componentKeys(component: Component): string[] {
  const identityValues: Array<string | undefined> = [component.id, component.name];
  if (component.type !== undefined && INFRASTRUCTURE_TYPES.has(component.type)) {
    identityValues.push(component.technology);
  }
  return identityValues
    .filter((value): value is string => value !== undefined)
    .map(normalize);
}
