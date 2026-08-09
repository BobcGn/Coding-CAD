import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import {
  heading,
  renderAcceptanceCriteria,
  renderArchitectureSummary,
  renderConstraints,
  renderDecisions,
  renderGuideRules,
  renderProjectContext,
  renderTasks
} from "../formatter.js";
import type { AgentAdapter, AgentInstruction } from "../types.js";

export class GenericMarkdownAdapter implements AgentAdapter {
  readonly name = "generic-markdown";

  generate(blueprint: ExecutionBlueprint): AgentInstruction {
    return {
      format: "markdown",
      content: [
        heading(1, `${blueprint.projectName} Implementation Instructions`),
        heading(2, "Project Context"),
        renderProjectContext(blueprint),
        heading(2, "Architecture Summary"),
        renderArchitectureSummary(blueprint),
        heading(2, "Architecture Decisions"),
        renderDecisions(blueprint.agentGuide),
        heading(2, "Implementation Tasks"),
        renderTasks(blueprint.tasks),
        heading(2, "Constraints"),
        renderConstraints(blueprint.constraints),
        heading(2, "Forbidden Changes"),
        renderGuideRules(blueprint.agentGuide),
        heading(2, "Acceptance Criteria"),
        renderAcceptanceCriteria(blueprint.agentGuide)
      ].join("\n\n"),
      metadata: { tasks: blueprint.tasks.length }
    };
  }
}
