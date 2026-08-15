import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { ArchitectureCommand } from "./architecture-command.js";

/** Produces an immutable candidate. Acceptance is handled by the application boundary. */
export function applyArchitectureCommand(
  accepted: ArchitectureProject,
  command: ArchitectureCommand
): ArchitectureProject {
  const components = [...accepted.architecture.components];
  const connections = [...accepted.architecture.connections];

  switch (command.type) {
    case "add-component":
      if (components.some(({ id }) => id === command.component.id)) {
        throw new Error(`Component ${command.component.id} already exists.`);
      }
      components.push(structuredClone(command.component));
      break;
    case "remove-component": {
      const index = components.findIndex(({ id }) => id === command.componentId);
      if (index < 0) throw new Error(`Component ${command.componentId} does not exist.`);
      components.splice(index, 1);
      for (let connectionIndex = connections.length - 1; connectionIndex >= 0; connectionIndex -= 1) {
        const connection = connections[connectionIndex];
        if (connection?.from === command.componentId || connection?.to === command.componentId) {
          connections.splice(connectionIndex, 1);
        }
      }
      break;
    }
    case "connect-components":
      if (connections.some(({ id }) => id === command.connection.id)) {
        throw new Error(`Connection ${command.connection.id} already exists.`);
      }
      connections.push(structuredClone(command.connection));
      break;
    case "inspector-update-description":
      replaceComponent(components, command.componentId, (component) => ({
        ...component,
        description: command.description
      }));
      break;
    case "inspector-update-type":
      replaceComponent(components, command.componentId, (component) => ({
        ...component,
        type: command.componentType as Component["type"]
      }));
      break;
    case "inspector-add-capability":
      replaceComponent(components, command.componentId, (component) => ({
        ...component,
        capabilities: component.capabilities.includes(command.capability)
          ? component.capabilities
          : [...component.capabilities, command.capability]
      }));
      break;
    case "inspector-remove-capability":
      replaceComponent(components, command.componentId, (component) => ({
        ...component,
        capabilities: component.capabilities.filter((capability) => capability !== command.capability)
      }));
      break;
    case "inspector-add-limitation":
      replaceComponent(components, command.componentId, (component) => ({
        ...component,
        limitations: component.limitations === undefined
          ? [command.limitation]
          : component.limitations.includes(command.limitation)
            ? component.limitations
            : [...component.limitations, command.limitation]
      }));
      break;
  }

  return {
    ...structuredClone(accepted),
    architecture: { components, connections }
  };
}

function replaceComponent(
  components: Component[],
  componentId: string,
  update: (component: Component) => Component
): void {
  const index = components.findIndex(({ id }) => id === componentId);
  if (index < 0) throw new Error(`Component ${componentId} does not exist.`);
  components[index] = update(components[index]!);
}
