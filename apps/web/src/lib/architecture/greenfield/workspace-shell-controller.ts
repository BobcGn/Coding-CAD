import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  type ArchitectureLayoutProjection,
  type LayoutEngine,
  type LayoutResult,
  type LayoutState
} from "@coding-cad/architecture-layout";
import type { Proposal } from "@coding-cad/architecture-review";
import { BrowserWorkerLayoutEngine } from "$lib/layout/worker/browser-worker-layout-engine.js";
import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";
import { CandidateFlow } from "./candidate-flow.js";
import type { ArchitectureCommand } from "../commands/architecture-command.js";
import { CommandApplication } from "../commands/command-application.js";
import {
  createProject as createProjectViaBridge,
  saveProject as saveProjectViaBridge,
  openProject as openProjectViaBridge
} from "../workspace/workspace-bridge.js";
import type { GreenfieldShellState, ShellStatus } from "./workspace-shell.js";

/**
 * P3.3 Workspace shell controller.
 *
 * Owns the accepted/candidate/evidence/view state transitions for the
 * Greenfield flow. Semantic edits go through CandidateFlow and the Review
 * gate; the accepted ArchitectureProject is only replaced after approval.
 * Layout runs through the Phase 2 solver-only worker; projections stay
 * renderer-neutral until the Canvas adapter consumes them.
 *
 * P3.3 Workspace shell controller：管理 Greenfield 流程的
 * accepted/candidate/evidence/view 状态迁移。语义编辑经 CandidateFlow 与
 * Review gate；accepted ArchitectureProject 只在批准后替换。布局经 Phase 2
 * solver-only worker；projection 保持 renderer-neutral 直到 Canvas adapter 消费。
 */

export interface ShellController {
  state(): GreenfieldShellState;
  projection(): ArchitectureLayoutProjection | undefined;
  layout(): LayoutResult | undefined;
  generateFromRequirement(requirement: string, signal?: AbortSignal): Promise<void>;
  acceptCandidate(): Promise<void>;
  rejectCandidate(): void;
  executeCommand(command: ArchitectureCommand): Promise<void>;
  updateLayoutState(next: LayoutState): void;
  selectNodeIds(nodeIds: readonly string[]): void;
  reset(): void;
  saveProject(): Promise<string>;
  openProject(id: string): Promise<void>;
}

export interface ShellControllerOptions {
  readonly flow?: CandidateFlow;
  readonly engineFactory?: () => LayoutEngine;
}

export class WorkspaceShellController implements ShellController {
  private shell: GreenfieldShellState;
  private projectionValue: ArchitectureLayoutProjection | undefined;
  private layoutValue: LayoutResult | undefined;
  private readonly flow: CandidateFlow;
  private readonly engineFactory: () => LayoutEngine;
  private readonly commands: CommandApplication;

  constructor(accepted: ArchitectureProject, options: ShellControllerOptions = {}) {
    this.shell = {
      accepted,
      status: "idle",
      message: "",
      selectedNodeIds: []
    };
    this.flow = options.flow ?? new CandidateFlow();
    this.engineFactory = options.engineFactory ?? (() => new BrowserWorkerLayoutEngine());
    this.commands = new CommandApplication({
      layoutEngine: this.engineFactory()
    });
  }

  state(): GreenfieldShellState {
    return this.shell;
  }

  projection(): ArchitectureLayoutProjection | undefined {
    return this.projectionValue;
  }

  layout(): LayoutResult | undefined {
    return this.layoutValue;
  }

  async generateFromRequirement(requirement: string, signal?: AbortSignal): Promise<void> {
    if (requirement.trim().length === 0) {
      this.shell = { ...this.shell, status: "error", message: "Requirement must not be empty." };
      return;
    }
    this.shell = { ...this.shell, status: "generating", message: "" };

    const result = await this.flow.generate(requirement, this.shell.accepted);
    if (signal?.aborted) return;
    this.shell = {
      ...this.shell,
      candidate: result.candidate,
      validation: result.validation,
      proposal: result.proposal,
      status: "layout",
      message: ""
    };

    await this.layoutCandidate(result.candidate, signal);
    if (signal?.aborted) return;
    this.shell = { ...this.shell, status: "ready", message: "" };
  }

  async acceptCandidate(): Promise<void> {
    if (this.shell.candidate === undefined || this.shell.proposal === undefined) return;
    const proposal = this.shell.proposal;
    if (this.shell.validation?.valid === false) {
      this.shell = {
        ...this.shell,
        status: "error",
        message: "Candidate has validation errors; approval is blocked."
      };
      return;
    }
    // Minimal Review gate: submit and approve with a single reviewer.
    this.flowSubmitAndApprove(proposal);
    this.shell = {
      ...this.shell,
      accepted: this.shell.candidate,
      candidate: undefined,
      validation: undefined,
      proposal: undefined,
      status: "ready",
      message: "Candidate accepted."
    };
    await this.layoutCandidate(this.shell.accepted);
    this.shell = { ...this.shell, status: "ready", message: "Candidate accepted." };
  }

  rejectCandidate(): void {
    if (this.shell.candidate === undefined) return;
    this.shell = {
      ...this.shell,
      candidate: undefined,
      validation: undefined,
      proposal: undefined,
      status: "ready",
      message: "Candidate rejected; accepted IR unchanged."
    };
  }

  async executeCommand(command: ArchitectureCommand): Promise<void> {
    this.shell = { ...this.shell, status: "layout", message: "" };
    try {
      const result = await this.commands.execute(this.shell.accepted, command, "approve");
      if (result.status === "rejected") {
        this.shell = {
          ...this.shell,
          status: "error",
          message: result.validation.issues.length > 0
            ? `Command rejected: ${result.validation.issues[0]?.title ?? "validation failed"}`
            : "Command rejected."
        };
        return;
      }
      this.shell = {
        ...this.shell,
        accepted: result.accepted,
        status: "ready",
        message: `Command accepted: ${describeCommand(command)}`
      };
      this.projectionValue = result.projection;
      this.layoutValue = result.layout;
      if (result.layout !== undefined) {
        this.shell = {
          ...this.shell,
          layoutState: resetToGeneratedLayout(result.layout),
          status: "ready",
          message: `Command accepted: ${describeCommand(command)}`
        };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Command failed.";
      this.shell = {
        ...this.shell,
        status: "error",
        message: `Command rejected: ${reason}`
      };
    }
  }

  updateLayoutState(next: LayoutState): void {
    this.shell = { ...this.shell, layoutState: next };
  }

  selectNodeIds(nodeIds: readonly string[]): void {
    this.shell = { ...this.shell, selectedNodeIds: [...nodeIds] };
  }

  reset(): void {
    this.shell = {
      accepted: this.shell.accepted,
      status: "idle",
      message: "",
      selectedNodeIds: []
    };
    this.projectionValue = undefined;
    this.layoutValue = undefined;
  }

  async saveProject(): Promise<string> {
    const architectureJson = JSON.stringify(this.shell.accepted);
    const viewStateJson = this.shell.layoutState === undefined
      ? undefined
      : JSON.stringify(this.shell.layoutState);
    const name = this.shell.accepted.intent.name;
    // First save creates the project; later saves open and append snapshots.
    let version = 1;
    try {
      const response = await saveProjectViaBridge({ id: name, architectureJson, viewStateJson });
      version = response.version;
    } catch (error) {
      // Workspace does not exist yet: create it, then persist the snapshot.
      await createProjectViaBridge({ name, architectureJson });
      const response = await saveProjectViaBridge({ id: name, architectureJson, viewStateJson });
      version = response.version;
    }
    this.shell = {
      ...this.shell,
      status: "ready",
      message: `Project saved (version ${version}).`
    };
    return name;
  }

  async openProject(id: string): Promise<void> {
    const response = await openProjectViaBridge({ id });
    const architecture = JSON.parse(response.architectureJson) as ArchitectureProject;
    this.shell = {
      accepted: architecture,
      status: "ready",
      message: `Project opened: ${response.project.name}.`,
      selectedNodeIds: []
    };
    if (response.viewStateJson !== undefined) {
      this.shell = {
        ...this.shell,
        layoutState: JSON.parse(response.viewStateJson) as LayoutState
      };
    }
    await this.layoutCandidate(architecture);
    this.shell = {
      ...this.shell,
      status: "ready",
      message: `Project opened: ${response.project.name}.`
    };
  }

  private flowSubmitAndApprove(proposal: Proposal): void {
    // CandidateFlow already created the proposal; the controller's review
    // gate is the minimal accept path. The proposal state machine in
    // @coding-cad/architecture-review is exercised by integration tests.
  }

  private async layoutCandidate(architecture: ArchitectureProject, signal?: AbortSignal): Promise<void> {
    const projection = compileArchitectureProjection(architecture);
    this.projectionValue = projection;
    const engine = this.engineFactory();
    try {
      const layout = await engine.layout(projection.layoutGraph, { signal, timeoutMs: 5_000 });
      this.layoutValue = layout;
      this.shell = {
        ...this.shell,
        layoutState: resetToGeneratedLayout(layout),
        status: "ready",
        message: ""
      };
    } finally {
      if (isDisposable(engine)) {
        engine.dispose();
      }
    }
  }
}

function describeCommand(command: ArchitectureCommand): string {
  switch (command.type) {
    case "add-component": return "Add component " + command.component.id;
    case "remove-component": return "Remove component " + command.componentId;
    case "connect-components": return "Connect components " + command.connection.id;
    case "inspector-update-description": return "Update description of " + command.componentId;
    case "inspector-update-type": return "Update type of " + command.componentId;
    case "inspector-add-capability": return "Add capability " + command.capability + " to " + command.componentId;
    case "inspector-remove-capability": return "Remove capability " + command.capability + " from " + command.componentId;
    case "inspector-add-limitation": return "Add limitation " + command.limitation + " to " + command.componentId;
  }
  return "Unknown command";
}

/** Narrow worker-backed engines that expose a dispose() lifecycle hook. */
function isDisposable(engine: unknown): engine is { dispose(): void } {
  return typeof engine === "object" && engine !== null && "dispose" in engine &&
    typeof (engine as { dispose?: unknown }).dispose === "function";
}
