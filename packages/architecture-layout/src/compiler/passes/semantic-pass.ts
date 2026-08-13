import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { classifyComponent } from "../../semantic/classifier.js";
import type { SemanticClassification } from "../../semantic/roles.js";

export function runSemanticPass(project: ArchitectureProject): readonly SemanticClassification[] {
  return project.architecture.components.map(classifyComponent);
}
