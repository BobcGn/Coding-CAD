import { parseDSL } from "@coding-cad/architecture-dsl";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";

export function analyzeArchitectureDsl(source: string) {
  const project = parseDSL(source);
  const validation = new ArchitectureValidator().validate(project);

  return {
    project,
    validation
  };
}
