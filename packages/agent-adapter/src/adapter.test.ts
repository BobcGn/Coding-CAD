import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import {
  AgentAdapterRegistry,
  ClaudeCodeGuideAdapter,
  CodexPromptAdapter,
  GenericMarkdownAdapter
} from "./index.js";

const blueprint: ExecutionBlueprint = {
  projectName: "PointSystem",
  architectureReference: "PointSystem@architecture-ir:1.0.0",
  tasks: [
    {
      id: "implement-point-service",
      title: "Create PointService",
      description: "Implement the logical point service.",
      relatedComponents: ["point-service"],
      requirements: ["Provide capability: point-ledger.", "Preserve decision: Use PostgreSQL."],
      dependencies: []
    }
  ],
  constraints: [
    {
      type: "architecture-decision",
      description: "Use PostgreSQL for the authoritative point ledger.",
      severity: "required",
      source: "architecture-decision",
      sourceReference: "Transactional storage"
    }
  ],
  agentGuide: {
    systemContext: "Use this Execution Blueprint as the implementation contract.",
    architectureSummary: "PointSystem contains PointService and PostgreSQL.",
    decisions: ["Transactional storage: Use PostgreSQL because point transactions require strong consistency."],
    forbiddenChanges: ["Do not use Redis as the authoritative point ledger."],
    acceptanceCriteria: ["Point balances are persisted in PostgreSQL."]
  }
};

const blueprintBeforeRendering = JSON.stringify(blueprint);

const generic = new GenericMarkdownAdapter().generate(blueprint);
assert(generic.format === "markdown", "Generic Adapter should produce Markdown.");
assert(generic.content.includes("Project Context"), "Generic prompt should include Project Context.");
assert(generic.content.includes("Create PointService"), "Generic prompt should include blueprint tasks.");
assert(generic.content.includes("Use PostgreSQL"), "Generic prompt should include constraints.");
assert(generic.metadata?.tasks === 1, "Generic prompt should report task metadata.");

const codex = new CodexPromptAdapter().generate(blueprint);
assert(codex.format === "codex-prompt", "Codex Adapter should produce Codex prompt format.");
assert(codex.content.includes("Background"), "Codex prompt should include background.");
assert(codex.content.includes("File Modification Requirements"), "Codex prompt should include file modification requirements.");
assert(codex.content.includes("Architecture Constraints"), "Codex prompt should include constraints.");
assert(codex.content.includes("Acceptance Criteria"), "Codex prompt should include acceptance criteria.");

const claude = new ClaudeCodeGuideAdapter().generate(blueprint);
assert(claude.format === "claude-md", "Claude Code Adapter should produce CLAUDE.md format.");
assert(claude.content.includes("CLAUDE.md"), "Claude guide should use CLAUDE.md framing.");
assert(claude.content.includes("System Context"), "Claude guide should include system context.");
assert(claude.content.includes("Engineering Rules"), "Claude guide should include engineering rules.");
assert(claude.content.includes("Design Principles and Decisions"), "Claude guide should include decisions.");

const registry = new AgentAdapterRegistry();
assert(
  registry.generate("codex", blueprint).content === codex.content,
  "Registry should route to the Codex adapter."
);
assert(JSON.stringify(blueprint) === blueprintBeforeRendering, "Adapters must not mutate the Blueprint.");

console.log("agent-adapter tests passed");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
