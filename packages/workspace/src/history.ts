import type { ValidationResult } from "@coding-cad/architecture-validator";
import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import type { ArchitectureVersion } from "./version.js";

export interface ValidationRecord {
  readonly id: string;
  readonly architectureVersion: ArchitectureVersion;
  readonly createdAt: string;
  readonly result: ValidationResult;
}

export interface BlueprintRecord {
  readonly id: string;
  readonly architectureVersion: ArchitectureVersion;
  readonly createdAt: string;
  readonly blueprint: ExecutionBlueprint;
}
