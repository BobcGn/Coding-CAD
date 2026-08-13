import type { ArchitectureProject } from "@coding-cad/architecture-ir";
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
  }

  return {
    ...structuredClone(accepted),
    architecture: { components, connections }
  };
}
