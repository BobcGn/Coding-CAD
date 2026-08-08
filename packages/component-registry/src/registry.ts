import type { ComponentDefinition } from "./component-definition.js";

export interface ComponentRegistry {
  register(component: ComponentDefinition): void;
  get(id: string): ComponentDefinition | undefined;
  list(): readonly ComponentDefinition[];
  searchByCapability(capability: string): readonly ComponentDefinition[];
}

/**
 * In-memory registry for built-in and user-defined component knowledge.
 * The implementation keeps matching deliberately simple and deterministic so
 * future loaders or plugins can reuse the same behavior in tests and tooling.
 */
export class InMemoryComponentRegistry implements ComponentRegistry {
  private readonly components = new Map<string, ComponentDefinition>();

  constructor(components: readonly ComponentDefinition[] = []) {
    for (const component of components) {
      this.register(component);
    }
  }

  register(component: ComponentDefinition): void {
    this.components.set(normalize(component.id), component);
  }

  get(id: string): ComponentDefinition | undefined {
    return this.components.get(normalize(id));
  }

  list(): readonly ComponentDefinition[] {
    return [...this.components.values()];
  }

  searchByCapability(capability: string): readonly ComponentDefinition[] {
    const query = normalize(capability);

    return this.list().filter((component) =>
      component.capabilities.some((candidate) =>
        normalize(candidate.id) === query
        || normalize(candidate.name) === query
        || normalize(candidate.description).includes(query)
      )
    );
  }
}

export function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
}
