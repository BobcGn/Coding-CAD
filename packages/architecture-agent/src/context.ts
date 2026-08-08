import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ComponentDefinition } from "@coding-cad/component-registry";
import type { ValidationResult } from "@coding-cad/architecture-validator";

export interface AgentContext {
  readonly requirement: string;
  readonly currentArchitecture?: ArchitectureProject;
  readonly availableComponents: readonly ComponentDefinition[];
  readonly validationResult?: ValidationResult;
}
