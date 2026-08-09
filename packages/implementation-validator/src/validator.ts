import { componentExistenceRule } from "./rules/component-rule.js";
import { componentConstraintRule } from "./rules/constraint-rule.js";
import { contractComplianceRule } from "./rules/contract-rule.js";
import { dependencyComplianceRule } from "./rules/dependency-rule.js";
import { technologyComplianceRule } from "./rules/technology-rule.js";
import type { ComplianceContext, ComplianceReport, ComplianceRule } from "./types.js";

export const builtinComplianceRules: readonly ComplianceRule[] = [
  componentExistenceRule,
  technologyComplianceRule,
  componentConstraintRule,
  dependencyComplianceRule,
  contractComplianceRule
];

export class ImplementationValidator {
  constructor(private readonly rules: readonly ComplianceRule[] = builtinComplianceRules) {}

  validate(context: ComplianceContext): ComplianceReport {
    const issues = this.rules.flatMap((rule) => rule.validate(context));
    const errors = issues.filter((issue) => issue.severity === "ERROR").length;
    const warnings = issues.filter((issue) => issue.severity === "WARNING").length;
    const info = issues.filter((issue) => issue.severity === "INFO").length;
    return {
      passed: errors === 0,
      issues,
      summary: issues.length === 0
        ? "Implementation complies with the approved architecture."
        : `Implementation compliance found ${errors} error(s), ${warnings} warning(s), and ${info} info item(s).`
    };
  }
}

export function validateImplementation(context: ComplianceContext): ComplianceReport {
  return new ImplementationValidator().validate(context);
}
