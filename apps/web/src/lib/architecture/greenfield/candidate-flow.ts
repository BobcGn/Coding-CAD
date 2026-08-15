import { ArchitectureAgent } from "@coding-cad/architecture-agent";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureReview, type Proposal } from "@coding-cad/architecture-review";
import { ArchitectureValidator, type ValidationResult } from "@coding-cad/architecture-validator";

/**
 * P3.2 Requirement to Candidate flow.
 *
 * Generates a candidate ArchitectureProject from a requirement using the
 * deterministic Architecture Agent (P3-D2: zero LLM in generation), produces
 * Validator Problems, and prepares a minimal Review gate proposal. The
 * accepted ArchitectureProject is never mutated before approval.
 *
 * P3.2 Requirement 到 Candidate 流程。使用 deterministic Architecture Agent
 * （P3-D2：生成零 LLM）从 requirement 生成 candidate ArchitectureProject，
 * 产出 Validator Problems，并准备最小 Review gate proposal。accepted
 * ArchitectureProject 在批准前绝不修改。
 */

export interface CandidateFlowResult {
  readonly candidate: ArchitectureProject;
  readonly validation: ValidationResult;
  readonly proposal: Proposal;
  readonly accepted: ArchitectureProject;
}

export interface CandidateFlowOptions {
  readonly agent?: ArchitectureAgent;
  readonly validator?: ArchitectureValidator;
  readonly review?: ArchitectureReview;
}

/** Produce a candidate from a requirement; accepted IR is unchanged. */
export class CandidateFlow {
  private readonly agent: ArchitectureAgent;
  private readonly validator: ArchitectureValidator;
  private readonly review: ArchitectureReview;
  private version = 1;

  constructor(options: CandidateFlowOptions = {}) {
    this.agent = options.agent ?? new ArchitectureAgent();
    this.validator = options.validator ?? new ArchitectureValidator();
    this.review = options.review ?? new ArchitectureReview({
      idGenerator: browserSafeIdGenerator
    });
  }

  async generate(requirement: string, accepted: ArchitectureProject): Promise<CandidateFlowResult> {
    const candidate = await this.agent.design(requirement);
    const validation = this.validator.validate(candidate);
    const proposal = this.review.createProposal({
      title: `Greenfield from requirement`,
      summary: requirement.slice(0, 120),
      author: "coding-cad-web",
      baseVersion: this.version,
      baseArchitecture: accepted,
      proposedArchitecture: candidate,
      validation,
      requiredApprovals: 1
    });
    return { candidate, validation, proposal, accepted };
  }
}

/**
 * Browser-safe id generator for the Review gate. Avoids importing the
 * Node-only default randomUUID from @coding-cad/architecture-review so the
 * client bundle stays free of node:* (P3-D1).
 */
function browserSafeIdGenerator(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject !== undefined && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
