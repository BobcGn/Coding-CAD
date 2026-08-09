import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ArchitectureVersion } from "./version.js";

/** A point-in-time Architecture IR document owned by one workspace. */
export interface ArchitectureSnapshot {
  readonly version: ArchitectureVersion;
  readonly createdAt: string;
  readonly architecture: ArchitectureProject;
}
