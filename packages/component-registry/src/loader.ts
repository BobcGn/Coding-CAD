import { builtinComponentDefinitions } from "./builtin/index.js";
import type { ComponentDefinition } from "./component-definition.js";
import { InMemoryComponentRegistry, type ComponentRegistry } from "./registry.js";

export function loadBuiltinComponents(registry: ComponentRegistry): ComponentRegistry {
  for (const component of builtinComponentDefinitions) {
    registry.register(component);
  }

  return registry;
}

export function createComponentRegistry(
  components: readonly ComponentDefinition[] = builtinComponentDefinitions
): ComponentRegistry {
  return new InMemoryComponentRegistry(components);
}
