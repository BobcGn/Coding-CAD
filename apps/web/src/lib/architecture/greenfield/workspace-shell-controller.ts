import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  layoutArchitectureGraph,
  type ArchitectureLayoutProjection,
  type LayoutEngine,
  type LayoutResult,
  type LayoutState,
  type MovementReport
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
import { ArchitectureReview } from "@coding-cad/architecture-review";
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
  updateAcceptedArchitecture(project: ArchitectureProject): Promise<void>;
  movement(): MovementReport | undefined;
  waitForPrediction(): Promise<void>;
}

/**
 * 试算布局超时上限常量（毫秒）
 * 标注：未经批准的临时值（Unapproved temporary value），待用户裁定。
 * 超时后将回退为启发式放置，并标记为“预测不可用”。
 */
export const PREDICTION_TIMEOUT_MS = 5000;

export interface ShellControllerOptions {
  readonly flow?: CandidateFlow;
  readonly engineFactory?: () => LayoutEngine;
  readonly review?: ArchitectureReview;
  readonly onStateChange?: (state: GreenfieldShellState) => void;
}

export class WorkspaceShellController implements ShellController {
  private shell: GreenfieldShellState;
  private projectionValue: ArchitectureLayoutProjection | undefined;
  private layoutValue: LayoutResult | undefined;
  private readonly flow: CandidateFlow;
  private readonly engineFactory: () => LayoutEngine;
  private pendingCommand: CommandPreparation | undefined;
  private readonly commands: CommandApplication;
  private predictionToken = 0;
  private inFlightPrediction: Promise<void> | undefined;
  private readonly onStateChange?: (state: GreenfieldShellState) => void;

  constructor(accepted: ArchitectureProject, options: ShellControllerOptions = {}) {
    this.shell = {
      accepted,
      status: "idle",
      message: "",
      selectedNodeIds: []
    };
    this.onStateChange = options.onStateChange;
    const review = options.review;
    this.flow = options.flow ?? new CandidateFlow({ ...(review ? { review } : {}) });
    this.engineFactory = options.engineFactory ?? (() => new BrowserWorkerLayoutEngine());
    this.commands = new CommandApplication({
      layoutEngine: this.engineFactory(),
      ...(review ? { review } : {})
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

  movement(): MovementReport | undefined {
    return this.shell.movement;
  }

  waitForPrediction(): Promise<void> {
    return this.inFlightPrediction ?? Promise.resolve();
  }

  private notifyState(): void {
    this.onStateChange?.(this.shell);
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
    if (candidate === undefined || proposal === undefined || proposal.status === "rejected" || proposal.status === "approved") return;
    if (this.shell.isProposalStale) {
      this.shell = {
        ...this.shell,
        status: "error",
        message: "Formal architecture has changed; the pending proposal is stale and cannot be accepted. / 正式架构已变化，提案已失效，无法接受，请重新提议。"
      };
      return;
    }
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
      this.predictionToken++;
      this.shell = {
        ...this.shell, accepted: result.accepted, candidate: undefined, candidateLayoutState: undefined,
        proposal: result.proposal, isCommandProposal: undefined, isProposalStale: undefined,
        ghostPrediction: undefined, status: "layout", message: ""
      };
      this.notifyState();
      await this.layoutCandidate(result.accepted);
      this.shell = { ...this.shell, status: "ready", message: "Candidate accepted." };
      this.notifyState();
    } catch (error) {
      this.shell = {
        ...this.shell, proposal: this.shell.proposal?.status === "approved" ? this.shell.proposal : this.currentProposal(proposal.id), status: "error",
        message: error instanceof Error ? error.message : "Approval failed."
      };
      this.notifyState();
    }
  }

  rejectCandidate(rationale: string): void {
    const { candidate, proposal } = this.shell;
    if (candidate === undefined || proposal === undefined || proposal.status === "rejected" || proposal.status === "approved") return;
    try {
      const input = { reviewer: "local-user", decision: "reject" as const, rationale };
      const result = this.pendingCommand === undefined
        ? this.flow.decide(proposal.id, input)
        : this.commands.decide(this.pendingCommand, input);
      this.pendingCommand = undefined;
      this.predictionToken++;
      this.shell = {
        ...this.shell,
        proposal: result.proposal,
        isCommandProposal: undefined,
        isProposalStale: undefined,
        ghostPrediction: undefined,
        status: "ready",
        message: "Candidate rejected; accepted IR unchanged."
      };
      this.notifyState();
    } catch (error) {
      this.shell = {
        ...this.shell, proposal: this.shell.proposal?.status === "approved" ? this.shell.proposal : this.currentProposal(proposal.id), status: "error",
        message: error instanceof Error ? error.message : "Rejection failed."
      };
      this.notifyState();
    }
  }

  async executeCommand(command: ArchitectureCommand): Promise<void> {
    if (this.pendingCommand !== undefined || this.shell.proposal?.status === "draft" || this.shell.proposal?.status === "in-review") {
      const msg = this.shell.isProposalStale
        ? "Formal architecture has changed; pending proposal is stale. Reject it before proposing new changes. / 正式架构已变化，当前提案已失效，请先拒绝清理后再发起新提议。"
        : "Review the pending candidate before editing.";
      this.shell = { ...this.shell, status: "error", message: msg };
      this.notifyState();
      return;
    }
    try {
      const prepared = this.commands.prepare(this.shell.accepted, command);
      this.pendingCommand = prepared;
      const requiresPrediction = command.type === "add-component" || command.type === "connect-components";
      const token = ++this.predictionToken;

      this.shell = {
        ...this.shell,
        candidate: prepared.candidate,
        validation: prepared.validation,
        proposal: prepared.proposal,
        isCommandProposal: true,
        ghostPrediction: requiresPrediction ? { status: "predicting", proposalId: prepared.proposal.id } : undefined,
        status: "ready",
        message: prepared.validation.valid ? "Command candidate awaits review." : "Command candidate has validation errors."
      };
      this.notifyState();

      // In D-007 Option B (Local Extension), command editing proposals do NOT re-layout
      // the formal architecture with the solver. The formal layout remains stable, and
      // Ghost elements/markers are projected locally by the Web adapter layer.
      if (this.layoutValue === undefined) {
        await this.layoutCandidate(this.shell.accepted);
      }

      if (requiresPrediction) {
        const predictionPromise = this.predictGhostPlacement(token, prepared.proposal.id, prepared.candidate, command);
        this.inFlightPrediction = predictionPromise;
        await predictionPromise;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Command failed.";
      this.shell = {
        ...this.shell, status: "error", message: `Command rejected: ${reason}`,
        validation: { valid: false, summary: reason, issues: [{
          id: "command.application", severity: "ERROR", title: "Command rejected", description: reason
        }] }
      };
      this.notifyState();
    }
  }

  async updateAcceptedArchitecture(project: ArchitectureProject): Promise<void> {
    if (!project || typeof project !== "object" || !project.architecture || !Array.isArray(project.architecture.components)) {
      this.shell = {
        ...this.shell,
        status: "error",
        message: "Invalid ArchitectureProject: Expected an object with architecture.components array."
      };
      this.notifyState();
      return;
    }
    this.predictionToken++;
    const hasPending = this.shell.candidate !== undefined && this.shell.proposal !== undefined &&
      this.shell.proposal.status !== "approved" && this.shell.proposal.status !== "rejected";
    if (hasPending) {
      this.shell = {
        ...this.shell,
        accepted: project,
        isProposalStale: true,
        ghostPrediction: undefined,
        status: "ready",
        message: "Formal architecture has changed; the pending proposal is stale and must be re-proposed. / 正式架构已变化，提案已失效，请重新提议。"
      };
      this.notifyState();
      await this.layoutCandidate(project);
      return;
    }
    this.shell = {
      ...this.shell,
      accepted: project,
      isProposalStale: undefined,
      ghostPrediction: undefined,
      status: "ready",
      message: "Formal architecture updated."
    };
    this.notifyState();
    await this.layoutCandidate(project);
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
    this.predictionToken++;
    this.shell = {
      accepted: this.shell.accepted,
      status: "idle",
      message: "",
      selectedNodeIds: [],
      expectedArchitecture: undefined,
      complianceReport: undefined,
      ghostPrediction: undefined
    };
    this.projectionValue = undefined;
    this.layoutValue = undefined;
    this.notifyState();
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

  private async runIncrementalLayout(
    architecture: ArchitectureProject,
    previousState?: LayoutState,
    signal?: AbortSignal,
    timeoutMs: number = PREDICTION_TIMEOUT_MS
  ): Promise<{ result: LayoutResult; movement?: MovementReport }> {
    const projection = compileArchitectureProjection(architecture);
    const engine = this.engineFactory();
    try {
      return await layoutArchitectureGraph(projection.layoutGraph, {
        mode: "INCREMENTAL",
        previousState,
        signal,
        timeoutMs
      }, engine);
    } finally {
      if (isDisposable(engine)) {
        engine.dispose();
      }
    }
  }

  private async predictGhostPlacement(
    token: number,
    proposalId: string,
    candidate: ArchitectureProject,
    command: ArchitectureCommand
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const { result } = await this.runIncrementalLayout(
        candidate,
        this.shell.layoutState,
        undefined,
        PREDICTION_TIMEOUT_MS
      );
      const elapsed = Date.now() - startTime;

      if (token !== this.predictionToken || this.shell.proposal?.id !== proposalId || this.shell.isProposalStale) {
        return;
      }

      if (result.status === "fallback") {
        const diag = result.diagnostics.map((d) => d.message).join("; ");
        this.shell = {
          ...this.shell,
          ghostPrediction: {
            status: "unavailable",
            proposalId,
            solver: "fallback",
            durationMs: elapsed,
            notice: `求解器降级 (${diag || "fallback"})，预测不可用已回退至启发式放置`
          }
        };
        this.notifyState();
        return;
      }

      const nodes: Record<string, { position: { x: number; y: number }; parentId?: string }> = {};
      for (const node of result.nodes) {
        nodes[node.id] = {
          position: { x: node.position.x, y: node.position.y },
          parentId: node.parentId
        };
      }

      this.shell = {
        ...this.shell,
        ghostPrediction: {
          status: "predicted",
          proposalId,
          nodes,
          solver: "elk",
          durationMs: elapsed
        }
      };
      this.notifyState();
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (token !== this.predictionToken || this.shell.proposal?.id !== proposalId || this.shell.isProposalStale) {
        return;
      }
      this.shell = {
        ...this.shell,
        ghostPrediction: {
          status: "unavailable",
          proposalId,
          durationMs: elapsed,
          notice: error instanceof Error ? error.message : "试算布局失败，已回退至启发式放置"
        }
      };
      this.notifyState();
    }
  }

  private async layoutCandidate(architecture: ArchitectureProject, signal?: AbortSignal, restoredState?: LayoutState): Promise<void> {
    try {
      const { result: layout, movement } = await this.runIncrementalLayout(
        architecture,
        this.shell.layoutState,
        signal,
        PREDICTION_TIMEOUT_MS
      );

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
      this.projectionValue = compileArchitectureProjection(architecture);
      this.layoutValue = layout;
      this.shell = {
        ...this.shell,
        movement,
        layoutWarning: layout.status === "fallback" ? layout.diagnostics.map((diagnostic) => diagnostic.message).join("; ") : undefined,
        ...(this.shell.candidate === undefined
          ? { layoutState: nextState }
          : { candidateLayoutState: nextState }),
        status: "ready",
        message: this.shell.message || ""
      };
      this.notifyState();
    } catch (error) {
      this.shell = { ...this.shell, status: "error", message: error instanceof Error ? error.message : "Layout failed." };
      this.notifyState();
      throw error;
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
