import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";

export interface AgentInstructionMetadata {
  readonly tasks: number;
}

export interface AgentInstruction {
  readonly format: string;
  readonly content: string;
  readonly metadata?: AgentInstructionMetadata;
}

export interface AgentAdapter {
  readonly name: string;
  generate(blueprint: ExecutionBlueprint): AgentInstruction;
}
