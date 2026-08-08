import type { ValidationResult } from "@coding-cad/architecture-validator";

export function reportValidationJson(result: ValidationResult): string {
  return JSON.stringify({
    valid: result.valid,
    summary: result.summary,
    issues: result.issues.map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      message: issue.title,
      description: issue.description,
      affectedComponent: issue.affectedComponent,
      suggestion: issue.suggestion
    }))
  }, null, 2);
}

export function reportInspectJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
