import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";

export interface Reporter {
  report(result: ValidationResult): string;
}

export class ConsoleValidationReporter implements Reporter {
  constructor(private readonly project: ArchitectureProject) {}

  report(result: ValidationResult): string {
    const lines: string[] = [
      "Coding CAD Validation Report",
      "",
      "Project:",
      this.project.intent.name,
      "",
      "Components:",
      ...this.project.architecture.components.map((component) => `[OK] ${component.name}`)
    ];

    lines.push("", "Issues:");
    if (result.issues.length === 0) {
      lines.push("No issues found.");
    } else {
      for (const issue of result.issues) {
        lines.push(
          "",
          issue.severity,
          issue.title,
          "",
          "Reason:",
          issue.description
        );

        if (issue.affectedComponent !== undefined) {
          lines.push("", "Affected component:", issue.affectedComponent);
        }

        if (issue.suggestion !== undefined) {
          lines.push("", "Suggestion:", issue.suggestion);
        }
      }
    }

    lines.push("", "Summary:", summarizeCounts(result));
    return lines.join("\n");
  }
}

export interface InspectSummary {
  readonly project: string;
  readonly services: readonly string[];
  readonly databases: readonly string[];
  readonly caches: readonly string[];
  readonly queues: readonly string[];
  readonly externalServices: readonly string[];
  readonly connections: readonly string[];
}

export function buildInspectSummary(project: ArchitectureProject): InspectSummary {
  return {
    project: project.intent.name,
    services: namesByType(project.architecture.components, "service"),
    databases: namesByType(project.architecture.components, "database"),
    caches: namesByType(project.architecture.components, "cache"),
    queues: namesByType(project.architecture.components, "queue"),
    externalServices: namesByType(project.architecture.components, "external-service"),
    connections: project.architecture.connections.map((connection) => `${connection.from} -> ${connection.to}`)
  };
}

export function reportInspectConsole(summary: InspectSummary): string {
  return [
    "Architecture:",
    "",
    "Project:",
    summary.project,
    "",
    "Services:",
    ...formatList(summary.services),
    "",
    "Databases:",
    ...formatList(summary.databases),
    "",
    "Caches:",
    ...formatList(summary.caches),
    "",
    "Queues:",
    ...formatList(summary.queues),
    "",
    "External Services:",
    ...formatList(summary.externalServices),
    "",
    "Connections:",
    ...formatList(summary.connections)
  ].join("\n");
}

function namesByType(components: readonly Component[], type: Component["type"]): readonly string[] {
  return components
    .filter((component) => component.type === type)
    .map((component) => component.name);
}

function formatList(values: readonly string[]): readonly string[] {
  return values.length === 0 ? ["- none"] : values.map((value) => `- ${value}`);
}

function summarizeCounts(result: ValidationResult): string {
  const errors = result.issues.filter((issue) => issue.severity === "ERROR").length;
  const warnings = result.issues.filter((issue) => issue.severity === "WARNING").length;
  const info = result.issues.filter((issue) => issue.severity === "INFO").length;

  return `Errors: ${errors}\nWarnings: ${warnings}\nInfo: ${info}`;
}
