import { parseArchitectureYaml } from "@coding-cad/dsl";
import { validateArchitecture } from "@coding-cad/validator";

export function analyzeArchitectureDsl(source: string) {
  const ir = parseArchitectureYaml(source);
  const diagnostics = validateArchitecture(ir);

  return {
    ir,
    diagnostics
  };
}
