import type {
  AgentGuide,
  ExecutionBlueprint,
  ImplementationConstraint,
  ImplementationTask
} from "@coding-cad/execution-blueprint";

export function heading(level: 1 | 2 | 3, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

export function bulletList(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None specified.";
}

export function renderProjectContext(blueprint: ExecutionBlueprint): string {
  return [
    `Project: ${blueprint.projectName}`,
    `Architecture reference: ${blueprint.architectureReference}`,
    blueprint.agentGuide.systemContext
  ].join("\n");
}

export function renderArchitectureSummary(blueprint: ExecutionBlueprint): string {
  return blueprint.agentGuide.architectureSummary;
}

export function renderTasks(tasks: readonly ImplementationTask[]): string {
  if (tasks.length === 0) {
    return "No implementation tasks were supplied by the Execution Blueprint.";
  }

  return tasks
    .map((task, index) => renderTask(task, index + 1))
    .join("\n\n");
}

export function renderConstraints(constraints: readonly ImplementationConstraint[]): string {
  if (constraints.length === 0) {
    return "No implementation constraints were supplied by the Execution Blueprint.";
  }

  return constraints
    .map((constraint) => {
      const source = constraint.source ? ` Source: ${constraint.source}.` : "";
      const reference = constraint.sourceReference
        ? ` Reference: ${constraint.sourceReference}.`
        : "";
      return `- [${constraint.severity.toUpperCase()}] ${constraint.description}${source}${reference}`;
    })
    .join("\n");
}

export function renderGuideRules(guide: AgentGuide): string {
  return bulletList(guide.forbiddenChanges);
}

export function renderAcceptanceCriteria(guide: AgentGuide): string {
  return bulletList(guide.acceptanceCriteria);
}

export function renderDecisions(guide: AgentGuide): string {
  return bulletList(guide.decisions);
}

function renderTask(task: ImplementationTask, number: number): string {
  const components = task.relatedComponents.length > 0
    ? task.relatedComponents.join(", ")
    : "None specified";
  const dependencies = task.dependencies.length > 0
    ? task.dependencies.join(", ")
    : "None";

  return [
    `### ${number}. ${task.title}`,
    task.description,
    `Task ID: ${task.id}`,
    `Related architecture components: ${components}`,
    `Dependencies: ${dependencies}`,
    "Requirements:",
    bulletList(task.requirements)
  ].join("\n");
}
