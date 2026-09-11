import type { Component, Connection } from "@coding-cad/architecture-ir";

/**
 * Renderer-neutral user intent. UI events must be translated into one of
 * these commands. Inspector edits are explicit field-specific commands
 * (P3-D3); no generic JSON patch exists.
 */
export type ArchitectureCommand =
  | { readonly type: "add-component"; readonly component: Component }
  | { readonly type: "remove-component"; readonly componentId: string }
  | { readonly type: "connect-components"; readonly connection: Connection }
  | { readonly type: "inspector-update-description"; readonly componentId: string; readonly description: string }
  | { readonly type: "inspector-update-type"; readonly componentId: string; readonly componentType: string }
  | { readonly type: "inspector-add-capability"; readonly componentId: string; readonly capability: string }
  | { readonly type: "inspector-remove-capability"; readonly componentId: string; readonly capability: string }
  | { readonly type: "inspector-add-limitation"; readonly componentId: string; readonly limitation: string };
