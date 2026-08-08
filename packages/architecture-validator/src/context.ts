import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { ComponentDefinition, ComponentRegistry } from "@coding-cad/component-registry";

export interface ValidatorContext {
  readonly project: ArchitectureProject;
  readonly registry: ComponentRegistry;
}

export function findComponentDefinition(
  component: Component,
  registry: ComponentRegistry
): ComponentDefinition | undefined {
  const candidates = [
    component.technology,
    component.id,
    component.name
  ].filter((value): value is string => value !== undefined);

  for (const candidate of candidates) {
    const exact = registry.get(candidate);
    if (exact !== undefined) {
      return exact;
    }
  }

  const normalizedName = normalize(component.name);
  return registry.list().find((definition) => normalize(definition.name) === normalizedName);
}

export function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
}

export function componentText(component: Component): string {
  return [
    component.id,
    component.name,
    component.description,
    component.logicalRole,
    component.technology,
    ...component.capabilities,
    ...(component.tags ?? [])
  ]
    .filter((value): value is string => value !== undefined)
    .join(" ")
    .toLowerCase();
}

export function isStorageLike(component: Component, definition?: ComponentDefinition): boolean {
  return component.type === "database"
    || component.type === "storage"
    || component.type === "cache"
    || definition?.category === "database"
    || definition?.category === "cache"
    || definition?.category === "storage";
}

export function isPrimaryStorageCandidate(component: Component): boolean {
  const text = componentText(component);

  return component.type === "database"
    || component.type === "storage"
    || text.includes("primary-storage")
    || text.includes("primary storage")
    || text.includes("source-of-truth")
    || text.includes("source of truth")
    || text.includes("system-of-record")
    || text.includes("system of record")
    || text.includes("ledger")
    || text.includes("balance")
    || text.includes("transactional-storage")
    || text.includes("transactional storage");
}

export function componentProvidesCapability(
  definition: ComponentDefinition,
  capability: string
): boolean {
  const query = normalize(capability);

  return definition.capabilities.some((candidate) =>
    normalize(candidate.id) === query
    || normalize(candidate.name) === query
    || normalize(candidate.description).includes(query)
  );
}
