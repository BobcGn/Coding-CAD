import type { ImplementationConstraint } from "./constraint.js";
import type { AgentGuide } from "./guide.js";
import type { ImplementationTask } from "./task.js";

export interface ExecutionBlueprint {
  readonly projectName: string;
  readonly architectureReference: string;
  readonly tasks: readonly ImplementationTask[];
  readonly constraints: readonly ImplementationConstraint[];
  readonly agentGuide: AgentGuide;
}
