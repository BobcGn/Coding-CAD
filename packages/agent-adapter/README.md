# Agent Adapter

`@coding-cad/agent-adapter` renders an `ExecutionBlueprint` into instructions that an external Coding Agent can follow. It is the final presentation boundary in the Coding CAD handoff path:

```text
Architecture IR -> Execution Blueprint -> Agent Adapter -> External Coding Agent
```

## Why an Adapter

An Execution Blueprint is a structured, agent-neutral implementation contract. A prompt or guide is a presentation of that contract for a specific external agent. Keeping these separate means Coding CAD can support new agents without changing Architecture IR, architecture reasoning, validation, or Blueprint generation.

The adapter does not generate code, edit files, infer a new architecture, or mutate the Blueprint. Every project fact, task, constraint, decision, forbidden change, and acceptance criterion in its output comes from the supplied `ExecutionBlueprint`.

## First-phase adapters

- `GenericMarkdownAdapter`: portable Markdown instruction document.
- `CodexPromptAdapter`: Coding Agent prompt with background, file modification requirements, architecture constraints, implementation tasks, and acceptance criteria.
- `ClaudeCodeGuideAdapter`: `CLAUDE.md`-style system context, engineering rules, architecture constraints, design decisions, tasks, and acceptance criteria.

## Usage

```ts
import { generateExecutionBlueprint } from "@coding-cad/execution-blueprint";
import { generateAgentInstruction } from "@coding-cad/agent-adapter";

const blueprint = generateExecutionBlueprint(architectureProject);
const instruction = generateAgentInstruction("codex", blueprint);

console.log(instruction.content);
```

`AgentInstruction.metadata.tasks` records the number of Blueprint tasks rendered. It is metadata about the instruction, not a new implementation decision.

## Extending to another Coding Agent

Implement `AgentAdapter` and render only the supplied `ExecutionBlueprint` fields:

```ts
class CursorAdapter implements AgentAdapter {
  readonly name = "cursor";

  generate(blueprint: ExecutionBlueprint): AgentInstruction {
    return { format: "cursor-prompt", content: blueprint.agentGuide.systemContext };
  }
}
```

Then register it in an application-level adapter registry. Future adapters may target Cursor, Devin, or GitHub Copilot Agent, but they must preserve the same boundary: Blueprint in, instructions out.

## Design principles

- Architecture IR remains the original source of truth; the Blueprint is its implementation handoff.
- The adapter is a pure renderer: it must not mutate the Blueprint or emit code.
- Architecture decisions and constraints remain explicit and traceable in every instruction format.
- Agent-specific wording may change, but implementation intent may not be silently added, removed, or redesigned.
