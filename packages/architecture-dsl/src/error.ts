export class ArchitectureDSLError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Architecture DSL Error:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "ArchitectureDSLError";
    this.issues = issues;
  }
}

export function formatMissingField(path: string): string {
  return `${path}: missing field`;
}

export function formatInvalidField(path: string, expected: string): string {
  return `${path}: expected ${expected}`;
}
