import type { ArchitectureIR } from "@coding-cad/architecture-ir";

export interface EditorDocument {
  readonly architecture: ArchitectureIR;
  readonly selectedNodeId?: string;
}

export const editorAppScope = "architecture-visual-editor";
