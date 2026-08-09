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

export class CodexPromptAdapter implements AgentAdapter {
  readonly name = "codex";

  generate(blueprint: ExecutionBlueprint): AgentInstruction {
    return {
      format: "codex-prompt",
      content: [
        heading(1, `Implement ${blueprint.projectName}`),
        "You are an external Coding Agent. Implement only the approved Execution Blueprint below.",
        heading(2, "Background"),
        renderProjectContext(blueprint),
        heading(2, "Architecture Summary"),
        renderArchitectureSummary(blueprint),
        heading(2, "File Modification Requirements"),
        "Modify only files required to complete the listed implementation tasks. Preserve the Architecture IR, Execution Blueprint, architecture decisions, and stated constraints unless a human provides an approved architecture change.",
        heading(2, "Architecture Constraints"),
        renderConstraints(blueprint.constraints),
        heading(2, "Architecture Decisions"),
        renderDecisions(blueprint.agentGuide),
        heading(2, "Implementation Tasks"),
        renderTasks(blueprint.tasks),
        heading(2, "Forbidden Changes"),
        renderGuideRules(blueprint.agentGuide),
        heading(2, "Acceptance Criteria"),
        renderAcceptanceCriteria(blueprint.agentGuide)
      ].join("\n\n"),
      metadata: { tasks: blueprint.tasks.length }
    };
  }
}
