import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  layoutArchitectureGraph,
  type ArchitectureLayoutProjection,
  type LayoutEngine,
  type LayoutResult,
  type LayoutState
} from "@coding-cad/architecture-layout";

import { BrowserWorkerLayoutEngine } from "$lib/layout/worker/browser-worker-layout-engine.js";
import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";
import { CandidateFlow } from "./candidate-flow.js";
import type { ArchitectureCommand } from "../commands/architecture-command.js";
import { CommandApplication, type CommandPreparation } from "../commands/command-application.js";
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
  acceptCandidate(rationale: string): Promise<void>;
  rejectCandidate(rationale: string): void;
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
  private pendingCommand: CommandPreparation | undefined;
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
    this.pendingCommand = undefined;
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

  async acceptCandidate(rationale: string): Promise<void> {
    const { candidate, proposal, validation } = this.shell;
    if (candidate === undefined || proposal === undefined || proposal.status === "rejected") return;
    if (validation?.valid !== true) {
      this.shell = { ...this.shell, status: "error", message: "Candidate has validation errors; approval is blocked." };
      return;
    }
    try {
      const input = { reviewer: "local-user", decision: "approve" as const, rationale };
      const result = this.pendingCommand === undefined
        ? this.flow.decide(proposal.id, input)
        : this.commands.decide(this.pendingCommand, input);
      if (result.accepted === undefined || result.proposal.status !== "approved") {
        this.shell = { ...this.shell, proposal: result.proposal, status: "ready", message: "Approval is still pending." };
        return;
      }
      this.pendingCommand = undefined;
      this.shell = {
        ...this.shell, accepted: result.accepted, candidate: undefined, candidateLayoutState: undefined,
        proposal: result.proposal, status: "layout", message: ""
      };
      await this.layoutCandidate(result.accepted);
      this.shell = { ...this.shell, status: "ready", message: "Candidate accepted." };
    } catch (error) {
      this.shell = {
        ...this.shell, proposal: this.shell.proposal?.status === "approved" ? this.shell.proposal : this.currentProposal(proposal.id), status: "error",
        message: error instanceof Error ? error.message : "Approval failed."
      };
    }
  }

  rejectCandidate(rationale: string): void {
    const { candidate, proposal } = this.shell;
    if (candidate === undefined || proposal === undefined || proposal.status === "rejected") return;
    try {
      const input = { reviewer: "local-user", decision: "reject" as const, rationale };
      const result = this.pendingCommand === undefined
        ? this.flow.decide(proposal.id, input)
        : this.commands.decide(this.pendingCommand, input);
      this.shell = {
        ...this.shell, proposal: result.proposal, status: "ready",
        message: "Candidate rejected; accepted IR unchanged."
      };
    } catch (error) {
      this.shell = {
        ...this.shell, proposal: this.shell.proposal?.status === "approved" ? this.shell.proposal : this.currentProposal(proposal.id), status: "error",
        message: error instanceof Error ? error.message : "Rejection failed."
      };
    }
  }

  async executeCommand(command: ArchitectureCommand): Promise<void> {
    if (this.shell.proposal?.status === "draft" || this.shell.proposal?.status === "in-review") {
      this.shell = { ...this.shell, status: "error", message: "Review the pending candidate before editing." };
      return;
    }
    try {
      const prepared = this.commands.prepare(this.shell.accepted, command);
      this.pendingCommand = prepared;
      this.shell = {
        ...this.shell, candidate: prepared.candidate, validation: prepared.validation,
        proposal: prepared.proposal, status: "ready",
        message: prepared.validation.valid ? "Command candidate awaits review." : "Command candidate has validation errors."
      };
      // Invalid endpoints must remain inspectable in Problems, never reach the solver.
      if (prepared.validation.valid) await this.layoutCandidate(prepared.candidate);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Command failed.";
      this.shell = {
        ...this.shell, status: "error", message: `Command rejected: ${reason}`,
        validation: { valid: false, summary: reason, issues: [{
          id: "command.application", severity: "ERROR", title: "Command rejected", description: reason
        }] }
      };
    }
  }

  updateLayoutState(next: LayoutState): void {
    this.shell = this.shell.candidate === undefined
      ? { ...this.shell, layoutState: next }
      : { ...this.shell, candidateLayoutState: next };
  }

  selectNodeIds(nodeIds: readonly string[]): void {
    this.shell = { ...this.shell, selectedNodeIds: [...nodeIds] };
  }

  reset(): void {
    this.pendingCommand = undefined;
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
    this.pendingCommand = undefined;
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

  private currentProposal(id: string) {
    return this.pendingCommand === undefined ? this.flow.getProposal(id) : this.commands.getProposal(id);
  }

  private async layoutCandidate(architecture: ArchitectureProject, signal?: AbortSignal): Promise<void> {
    const projection = compileArchitectureProjection(architecture);
    this.projectionValue = projection;
    const engine = this.engineFactory();
    try {
      const { result: layout } = await layoutArchitectureGraph(projection.layoutGraph, {
        mode: "INCREMENTAL", previousState: this.shell.layoutState, signal, timeoutMs: 5_000
      }, engine);

      this.layoutValue = layout;
      this.shell = {
        ...this.shell,
        layoutWarning: layout.status === "fallback" ? layout.diagnostics.map((diagnostic) => diagnostic.message).join("; ") : undefined,
        ...(this.shell.candidate === undefined
          ? { layoutState: resetToGeneratedLayout(layout) }
          : { candidateLayoutState: resetToGeneratedLayout(layout) }),
        status: "ready",
        message: ""
      };
    } catch (error) {
      this.shell = { ...this.shell, status: "error", message: error instanceof Error ? error.message : "Layout failed." };
      throw error;
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
