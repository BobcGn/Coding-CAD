import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import { ClaudeCodeGuideAdapter } from "./providers/claude-code.js";
import { CodexPromptAdapter } from "./providers/codex.js";
import { GenericMarkdownAdapter } from "./providers/generic.js";
import type { AgentAdapter, AgentInstruction } from "./types.js";

export type SupportedAgentAdapter = "generic" | "codex" | "claude-code";

export class AgentAdapterRegistry {
  private readonly adapters: ReadonlyMap<SupportedAgentAdapter, AgentAdapter>;

  constructor(adapters: Partial<Record<SupportedAgentAdapter, AgentAdapter>> = {}) {
    this.adapters = new Map([
      ["generic", adapters.generic ?? new GenericMarkdownAdapter()],
      ["codex", adapters.codex ?? new CodexPromptAdapter()],
      ["claude-code", adapters["claude-code"] ?? new ClaudeCodeGuideAdapter()]
    ]);
  }

  get(adapter: SupportedAgentAdapter): AgentAdapter {
    const selected = this.adapters.get(adapter);
    if (!selected) {
      throw new Error(`Agent adapter '${adapter}' is not registered.`);
    }
    return selected;
  }

  generate(adapter: SupportedAgentAdapter, blueprint: ExecutionBlueprint): AgentInstruction {
    return this.get(adapter).generate(blueprint);
  }
}

export function generateAgentInstruction(
  adapter: SupportedAgentAdapter,
  blueprint: ExecutionBlueprint
): AgentInstruction {
  return new AgentAdapterRegistry().generate(adapter, blueprint);
}
