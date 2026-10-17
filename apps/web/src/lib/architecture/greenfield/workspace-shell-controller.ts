import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  layoutArchitectureGraph,
  type ArchitectureLayoutProjection,
  type LayoutEngine,
  type LayoutResult,
  type LayoutState
} from "@coding-cad/architecture-layout";

import {
  ImplementationValidator,
  createImplementationModel,
  type ComplianceReport
} from "@coding-cad/implementation-validator";
import { BrowserWorkerLayoutEngine } from "$lib/layout/worker/browser-worker-layout-engine.js";
import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";
import { CandidateFlow } from "./candidate-flow.js";
import type { ArchitectureCommand } from "../commands/architecture-command.js";
import { CommandApplication, type CommandPreparation } from "../commands/command-application.js";
import {
  WorkspaceRequestError,
  createProject as createProjectViaBridge,
  saveProject as saveProjectViaBridge,
  openProject as openProjectViaBridge,
  analyzeRepository as analyzeRepositoryViaBridge
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
  loadExpectedArchitecture(project: ArchitectureProject): void;
  loadExpectedArchitectureJson(json: string): void;
  clearExpectedArchitecture(): void;
  reset(): void;
  saveProject(): Promise<string>;
  openProject(id: string): Promise<void>;
  analyzeRepository(repositoryPath: string): Promise<void>;
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
    const before = this.shell;
    const previousCommand = this.pendingCommand;
    this.pendingCommand = undefined;
    this.shell = { ...this.shell, status: "generating", message: "" };
    try {
      const result = await this.flow.generate(requirement, before.accepted);
      if (signal?.aborted) {
        this.pendingCommand = previousCommand;
        this.shell = before;
        return;
      }
      this.shell = {
        ...before, candidate: result.candidate, validation: result.validation,
        proposal: result.proposal, status: "layout", message: ""
      };
      await this.layoutCandidate(result.candidate, signal);
      if (signal?.aborted) {
        this.pendingCommand = previousCommand;
        this.shell = before;
      }
    } catch (error) {
      this.pendingCommand = previousCommand;
      this.shell = { ...before, status: "error", message: error instanceof Error ? error.message : "Generation failed." };
    }
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
        proposal: result.proposal, isCommandProposal: undefined, status: "layout", message: ""
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
      this.pendingCommand = undefined;
      this.shell = {
        ...this.shell,
        proposal: result.proposal,
        status: "ready",
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
    if (this.pendingCommand !== undefined || this.shell.proposal?.status === "draft" || this.shell.proposal?.status === "in-review") {
      this.shell = { ...this.shell, status: "error", message: "Review the pending candidate before editing." };
      return;
    }
    try {
      const prepared = this.commands.prepare(this.shell.accepted, command);
      this.pendingCommand = prepared;
      this.shell = {
        ...this.shell,
        candidate: prepared.candidate,
        validation: prepared.validation,
        proposal: prepared.proposal,
        isCommandProposal: true,
        status: "ready",
        message: prepared.validation.valid ? "Command candidate awaits review." : "Command candidate has validation errors."
      };
      // In D-007 Option B (Local Extension), command editing proposals do NOT re-layout
      // the formal architecture with the solver. The formal layout remains stable, and
      // Ghost elements/markers are projected locally by the Web adapter layer.
      if (this.layoutValue === undefined) {
        await this.layoutCandidate(this.shell.accepted);
      }
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
    this.shell = (this.shell.candidate === undefined || this.shell.isCommandProposal)
      ? { ...this.shell, layoutState: next }
      : { ...this.shell, candidateLayoutState: next };
  }

  selectNodeIds(nodeIds: readonly string[]): void {
    this.shell = { ...this.shell, selectedNodeIds: [...nodeIds] };
  }

  loadExpectedArchitecture(project: ArchitectureProject): void {
    if (!project || typeof project !== "object" || !project.architecture || !Array.isArray(project.architecture.components)) {
      this.shell = {
        ...this.shell,
        status: "error",
        message: "Invalid ArchitectureProject: Expected an object with architecture.components array."
      };
      return;
    }

    let complianceReport: ComplianceReport | undefined = undefined;
    if (this.shell.inspection !== undefined) {
      const validator = new ImplementationValidator();
      const implementation = createImplementationModel(this.shell.inspection, this.shell.accepted);
      complianceReport = validator.validate({
        architecture: project,
        implementation
      });
    }

    this.shell = {
      ...this.shell,
      expectedArchitecture: project,
      complianceReport,
      message: complianceReport !== undefined
        ? `Loaded expected architecture: ${project.intent?.purpose || "Baseline"} (${complianceReport.issues.length} compliance issue${complianceReport.issues.length === 1 ? "" : "s"}).`
        : `Loaded expected architecture: ${project.intent?.purpose || "Baseline"}.`
    };
  }

  loadExpectedArchitectureJson(json: string): void {
    try {
      const project = JSON.parse(json) as ArchitectureProject;
      this.loadExpectedArchitecture(project);
    } catch (err) {
      this.shell = {
        ...this.shell,
        status: "error",
        message: `Failed to parse expected architecture JSON: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }

  clearExpectedArchitecture(): void {
    this.shell = {
      ...this.shell,
      expectedArchitecture: undefined,
      complianceReport: undefined,
      message: "Expected architecture cleared. Compliance check unavailable."
    };
  }

  reset(): void {
    this.pendingCommand = undefined;
    this.shell = {
      accepted: this.shell.accepted,
      status: "idle",
      message: "",
      selectedNodeIds: [],
      expectedArchitecture: undefined,
      complianceReport: undefined
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
      // Only a missing project permits create; never overwrite on network/server failure.
      if (!(error instanceof WorkspaceRequestError) || error.status !== 404) throw error;
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
    await this.layoutCandidate(architecture, undefined, this.shell.layoutState);
    this.shell = {
      ...this.shell,
      status: "ready",
      message: `Project opened: ${response.project.name}.`
    };
  }

  async analyzeRepository(repositoryPath: string): Promise<void> {
    this.pendingCommand = undefined;
    this.shell = {
      ...this.shell,
      status: "layout",
      message: "Analyzing local repository..."
    };
    const response = await analyzeRepositoryViaBridge({ repositoryPath });
    const architecture = JSON.parse(response.architectureJson) as ArchitectureProject;
    this.shell = {
      accepted: architecture,
      status: "layout",
      message: "Repository analyzed. Running semantic layout...",
      selectedNodeIds: [],
      inspection: response.inspection
    };
    await this.layoutCandidate(architecture);
    const issueCount = response.inspection.unsupportedStructures.length;
    const truncated = response.inspection.truncated;

    let complianceReport: ComplianceReport | undefined = undefined;
    if (this.shell.expectedArchitecture !== undefined) {
      const validator = new ImplementationValidator();
      const implementation = createImplementationModel(response.inspection, architecture);
      complianceReport = validator.validate({
        architecture: this.shell.expectedArchitecture,
        implementation
      });
    }

    let finishMsg = `Repository analyzed (${architecture.architecture.components.length} components).`;
    if (truncated) {
      finishMsg += ` [TRUNCATED: ${truncated.hitLimit}]`;
    }
    if (issueCount > 0) {
      finishMsg += ` (${issueCount} unsupported structure warning${issueCount > 1 ? "s" : ""})`;
    }
    this.shell = {
      ...this.shell,
      complianceReport,
      status: "ready",
      message: finishMsg
    };
  }

  private currentProposal(id: string) {
    return this.pendingCommand === undefined ? this.flow.getProposal(id) : this.commands.getProposal(id);
  }

  private async layoutCandidate(architecture: ArchitectureProject, signal?: AbortSignal, restoredState?: LayoutState): Promise<void> {
    const projection = compileArchitectureProjection(architecture);
    const engine = this.engineFactory();
    try {
      const { result: layout } = await layoutArchitectureGraph(projection.layoutGraph, {
        mode: "INCREMENTAL", previousState: this.shell.layoutState, signal, timeoutMs: 5_000
      }, engine);

      if (signal?.aborted) return;
      const generatedState = resetToGeneratedLayout(layout);
      const validSaved = restoredState?.version === 1 && restoredState.direction === generatedState.direction && Array.isArray(restoredState.nodes)
        ? restoredState.nodes.filter((node) => Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y))
        : [];
      const prior = new Map(validSaved.map((node) => [node.id, node.position]));
      const nextState = {
        ...generatedState,
        nodes: generatedState.nodes.map((node) => ({ ...node, position: prior.get(node.id) ?? node.position }))
      };
      this.projectionValue = projection;
      this.layoutValue = layout;
      this.shell = {
        ...this.shell,
        layoutWarning: layout.status === "fallback" ? layout.diagnostics.map((diagnostic) => diagnostic.message).join("; ") : undefined,
        ...(this.shell.candidate === undefined
          ? { layoutState: nextState }
          : { candidateLayoutState: nextState }),
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
    case "inspector-add-contract": return `Add contract ${command.contract.name} to ${command.componentId}`;
    case "inspector-remove-contract": return `Remove contract ${command.contractName} from ${command.componentId}`;
    case "inspector-add-limitation": return "Add limitation " + command.limitation + " to " + command.componentId;
  }
  return "Unknown command";
}

/** Narrow worker-backed engines that expose a dispose() lifecycle hook. */
function isDisposable(engine: unknown): engine is { dispose(): void } {
  return typeof engine === "object" && engine !== null && "dispose" in engine &&
    typeof (engine as { dispose?: unknown }).dispose === "function";
}
