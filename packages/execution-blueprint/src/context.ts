import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";
import type { ComponentDefinition } from "@coding-cad/component-registry";

export interface ExecutionBlueprintContext {
  readonly architecture: ArchitectureProject;
  readonly validationResult: ValidationResult;
  readonly componentDefinitions: readonly ComponentDefinition[];
}
