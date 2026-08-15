import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  createLayoutEngine,
  type ArchitectureLayoutProjection,
  type LayoutEngine,
  type LayoutResult
} from "@coding-cad/architecture-layout";
import { ArchitectureReview, type Proposal } from "@coding-cad/architecture-review";
import { ArchitectureValidator, type ValidationResult } from "@coding-cad/architecture-validator";
import type { ArchitectureCommand } from "./architecture-command.js";
import { applyArchitectureCommand } from "./apply-command.js";

export type HeadlessReviewDecision = "approve" | "reject";

export interface CommandApplicationResult {
  readonly status: "accepted" | "rejected";
  readonly accepted: ArchitectureProject;
  readonly candidate: ArchitectureProject;
  readonly validation: ValidationResult;
  readonly proposal: Proposal;
  readonly projection?: ArchitectureLayoutProjection;
  readonly layout?: LayoutResult;
}

export interface CommandApplicationOptions {
  readonly validator?: ArchitectureValidator;
  readonly review?: ArchitectureReview;
  readonly layoutEngine?: LayoutEngine;
}

/** Explicit candidate -> Validator -> Review -> accepted IR -> Layout boundary. */
export class CommandApplication {
  private readonly validator: ArchitectureValidator;
  private readonly review: ArchitectureReview;
  private readonly layoutEngine: LayoutEngine;
  private version = 1;

  constructor(options: CommandApplicationOptions = {}) {
    this.validator = options.validator ?? new ArchitectureValidator();
    this.review = options.review ?? new ArchitectureReview();
    this.layoutEngine = options.layoutEngine ?? createLayoutEngine();
  }

  async execute(
    accepted: ArchitectureProject,
    command: ArchitectureCommand,
    decision: HeadlessReviewDecision,
    signal?: AbortSignal
  ): Promise<CommandApplicationResult> {
    const candidate = applyArchitectureCommand(accepted, command);
    const validation = this.validator.validate(candidate);
    const proposal = this.review.createProposal({
      title: describeCommand(command),
      summary: "Architecture command candidate",
      author: "coding-cad-web",
      baseVersion: this.version,
      baseArchitecture: accepted,
      proposedArchitecture: candidate,
      validation
    });
    this.review.submitProposal(proposal.id);

    const reviewDecision = decision === "approve" && validation.valid ? "approve" : "reject";
    this.review.recordApproval(proposal.id, {
      reviewer: "phase-2-headless-gate",
      decision: reviewDecision,
      rationale: reviewDecision === "approve" ? "Candidate passed validation." : "Candidate was rejected."
    });
    const resolvedProposal = this.review.getProposal(proposal.id);

    if (reviewDecision === "reject") {
      return { status: "rejected", accepted, candidate, validation, proposal: resolvedProposal };
    }

    const nextAccepted = this.review.getApprovedArchitecture(proposal.id);
    const projection = compileArchitectureProjection(nextAccepted);
    const layout = await this.layoutEngine.layout(projection.layoutGraph, { signal });
    this.version += 1;
    return {
      status: "accepted",
      accepted: nextAccepted,
      candidate,
      validation,
      proposal: resolvedProposal,
      projection,
      layout
    };
  }
}

function describeCommand(command: ArchitectureCommand): string {
  switch (command.type) {
    case "add-component": return `Add component ${command.component.id}`;
    case "remove-component": return `Remove component ${command.componentId}`;
    case "connect-components": return `Connect components with ${command.connection.id}`;
    case "inspector-update-description": return `Update description of ${command.componentId}`;
    case "inspector-update-type": return `Update type of ${command.componentId}`;
    case "inspector-add-capability": return `Add capability ${command.capability} to ${command.componentId}`;
    case "inspector-remove-capability": return `Remove capability ${command.capability} from ${command.componentId}`;
    case "inspector-add-limitation": return `Add limitation ${command.limitation} to ${command.componentId}`;
  }
  return "Unknown command";
}
