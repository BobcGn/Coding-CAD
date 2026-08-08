import type { ValidatorContext } from "./context.js";
import type { ValidationIssue } from "./issue.js";

export interface ValidationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  validate(context: ValidatorContext): readonly ValidationIssue[];
}
