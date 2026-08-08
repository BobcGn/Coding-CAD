import { createComponentRegistry, type ComponentRegistry } from "@coding-cad/component-registry";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { builtinValidationRules } from "./builtin-rules.js";
import type { ValidatorContext } from "./context.js";
import type { ValidationResult } from "./issue.js";
import type { ValidationRule } from "./rule.js";

export interface ArchitectureValidatorOptions {
  readonly registry?: ComponentRegistry;
}

export class ArchitectureValidator {
  private readonly registry: ComponentRegistry;

  constructor(
    private readonly rules: readonly ValidationRule[] = builtinValidationRules,
    options: ArchitectureValidatorOptions = {}
  ) {
    this.registry = options.registry ?? createComponentRegistry();
  }

  validate(project: ArchitectureProject): ValidationResult {
    const context: ValidatorContext = {
      project,
      registry: this.registry
    };

    const issues = this.rules.flatMap((rule) => rule.validate(context));
    const errorCount = issues.filter((issue) => issue.severity === "ERROR").length;
    const warningCount = issues.filter((issue) => issue.severity === "WARNING").length;
    const infoCount = issues.filter((issue) => issue.severity === "INFO").length;

    return {
      valid: errorCount === 0,
      issues,
      summary: buildSummary(errorCount, warningCount, infoCount)
    };
  }
}

function buildSummary(errorCount: number, warningCount: number, infoCount: number): string {
  if (errorCount === 0 && warningCount === 0 && infoCount === 0) {
    return "Architecture validation passed with no issues.";
  }

  return `Architecture validation found ${errorCount} error(s), ${warningCount} warning(s), and ${infoCount} info item(s).`;
}
