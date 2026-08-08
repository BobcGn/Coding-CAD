export type ImplementationConstraintSource =
  | "architecture-constraint"
  | "architecture-decision"
  | "validator-result"
  | "component-limitation";

export interface ImplementationConstraint {
  readonly type: string;
  readonly description: string;
  readonly severity: string;
  readonly source?: ImplementationConstraintSource;
  readonly sourceReference?: string;
}
