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

export class ClaudeCodeGuideAdapter implements AgentAdapter {
  readonly name = "claude-code";

  generate(blueprint: ExecutionBlueprint): AgentInstruction {
    return {
      format: "claude-md",
      content: [
        heading(1, `CLAUDE.md — ${blueprint.projectName}`),
        heading(2, "System Context"),
        renderProjectContext(blueprint),
        heading(2, "Architecture Summary"),
        renderArchitectureSummary(blueprint),
        heading(2, "Engineering Rules"),
        renderGuideRules(blueprint.agentGuide),
        heading(2, "Architecture Constraints"),
        renderConstraints(blueprint.constraints),
        heading(2, "Design Principles and Decisions"),
        renderDecisions(blueprint.agentGuide),
        heading(2, "Implementation Tasks"),
        renderTasks(blueprint.tasks),
        heading(2, "Acceptance Criteria"),
        renderAcceptanceCriteria(blueprint.agentGuide)
      ].join("\n\n"),
      metadata: { tasks: blueprint.tasks.length }
    };
  }
}
