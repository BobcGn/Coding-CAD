import type { Component, Connection } from "@coding-cad/architecture-ir";

/** Renderer-neutral user intent. UI events must be translated into one of these commands. */
export type ArchitectureCommand =
  | { readonly type: "add-component"; readonly component: Component }
  | { readonly type: "remove-component"; readonly componentId: string }
  | { readonly type: "connect-components"; readonly connection: Connection };
