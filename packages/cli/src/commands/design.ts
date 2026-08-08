import { ArchitectureAgent } from "@coding-cad/architecture-agent";
import { generateDSL } from "@coding-cad/architecture-dsl";
import type { ArchitectureDecision, ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";
import { buildInspectSummary, formatList } from "../output/console.js";
import type { CommandResult } from "./validate.js";

export interface DesignOptions {
  readonly json?: boolean;
  readonly yaml?: boolean;
}

export async function runDesign(requirement: string, options: DesignOptions = {}): Promise<CommandResult> {
  const agent = new ArchitectureAgent();
  const project = await agent.design(requirement);
  const validation = agent.validate(project);

  if (options.json === true) {
    return {
      output: JSON.stringify({ project, validation }, null, 2),
      exitCode: validation.valid ? 0 : 1
    };
  }

  if (options.yaml === true) {
    return {
      output: generateDSL(project),
      exitCode: validation.valid ? 0 : 1
    };
  }

  return {
    output: reportDesignConsole(project, validation),
    exitCode: validation.valid ? 0 : 1
  };
}

function reportDesignConsole(project: ArchitectureProject, validation: ValidationResult): string {
  const summary = buildInspectSummary(project);

  return [
    "Coding CAD Architecture Design",
    "",
    "Project:",
    project.intent.name,
    "",
    "Components:",
    ...project.architecture.components.map((component) => `[OK] ${component.name}`),
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
    "Connections:",
    ...formatList(summary.connections),
    "",
    "Architecture Decisions:",
    ...formatDecisions(project.decisions),
    "",
    "Validation:",
    validation.summary
  ].join("\n");
}

function formatDecisions(decisions: readonly ArchitectureDecision[]): readonly string[] {
  if (decisions.length === 0) {
    return ["- none"];
  }

  return decisions.flatMap((decision) => [
    `- ${decision.title}`,
    `  Decision: ${decision.decision}`,
    `  Rationale: ${decision.rationale}`
  ]);
}
