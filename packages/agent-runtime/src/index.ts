import type { ArchitectureDiagnostic, ArchitectureIR } from "@coding-cad/architecture-ir";

export type AgentRole = "architecture-agent" | "coding-agent" | "testing-agent";

/**
 * Boundary object for future Agent orchestration.
 * Tasks carry the architecture and known diagnostics explicitly so concrete
 * runtimes do not need to fetch hidden global state.
 */
export interface AgentTask {
  readonly id: string;
  readonly role: AgentRole;
  readonly architecture: ArchitectureIR;
  readonly objective: string;
  readonly diagnostics?: readonly ArchitectureDiagnostic[];
}

export interface AgentRuntime {
  readonly dispatch: (task: AgentTask) => Promise<AgentTaskResult>;
}

export interface AgentTaskResult {
  readonly taskId: string;
  readonly role: AgentRole;
  readonly status: "completed" | "needs-human-decision" | "failed";
  readonly summary: string;
  readonly artifacts?: readonly string[];
}
