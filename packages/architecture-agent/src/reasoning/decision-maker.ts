import type { ArchitectureDecision } from "@coding-cad/architecture-ir";
import type { RequirementAnalysis } from "../requirement/analyzer.js";

export interface DecisionMaker {
  decide(analysis: RequirementAnalysis): Promise<readonly ArchitectureDecision[]>;
}

export class HeuristicDecisionMaker implements DecisionMaker {
  async decide(analysis: RequirementAnalysis): Promise<readonly ArchitectureDecision[]> {
    const decisions: ArchitectureDecision[] = [];

    if (analysis.capabilities.includes("strong-consistency")) {
      decisions.push({
        title: "Use transactional storage for durable ledger state",
        context: "The requirement says critical point data must not be lost and must remain consistent.",
        decision: "Use PostgreSQL as the transactional source of truth for point accounts and point transactions.",
        alternatives: [
          "Use Redis as the primary point store",
          "Store point balance only in service memory",
          "Use an eventually consistent event stream as the only source of truth"
        ],
        rationale: "Point transactions require atomic updates, durability, and strong consistency. PostgreSQL provides those capabilities, while Redis is better kept as a cache because its registry limitation marks it as not-primary-storage."
      });
    }

    if (analysis.capabilities.includes("read-cache")) {
      decisions.push({
        title: "Use cache only for derived read acceleration",
        context: "The system must support high user volume without weakening point correctness.",
        decision: "Use Redis as a cache for derived read models and hot point summaries, not as the ledger source of truth.",
        alternatives: [
          "Serve all reads directly from transactional storage",
          "Use Redis as the only storage component"
        ],
        rationale: "A cache can reduce read load and latency, but the Validator should still be able to verify that durable state remains owned by transactional storage."
      });
    }

    if (decisions.length === 0) {
      decisions.push({
        title: "Start with a cohesive domain service",
        context: "The requirement describes a system goal but does not yet force a distributed architecture.",
        decision: "Model one primary domain service with explicit contracts and keep storage decisions attached to stated constraints.",
        alternatives: ["Split into many services immediately"],
        rationale: "A small architecture is easier to validate and evolve when the domain boundary is still being discovered."
      });
    }

    return decisions;
  }
}
