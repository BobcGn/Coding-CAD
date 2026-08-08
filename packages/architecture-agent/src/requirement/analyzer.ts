import type { Constraint } from "@coding-cad/architecture-ir";

export interface RequirementAnalysis {
  readonly domain: readonly string[];
  readonly entities: readonly string[];
  readonly constraints: readonly Constraint[];
  readonly scaleRequirements?: {
    readonly users?: number;
    readonly qps?: number;
  };
  readonly capabilities: readonly string[];
  readonly futureNeeds: readonly string[];
}

export interface RequirementAnalyzer {
  analyze(requirement: string): Promise<RequirementAnalysis>;
}

export class HeuristicRequirementAnalyzer implements RequirementAnalyzer {
  async analyze(requirement: string): Promise<RequirementAnalysis> {
    const normalized = requirement.toLowerCase();
    const domain = inferDomain(requirement);
    const entities = inferEntities(normalized);
    const constraints = inferConstraints(normalized);
    const users = inferUserCount(requirement);
    const qps = inferQps(requirement);
    const futureNeeds = inferFutureNeeds(normalized);

    const scaleRequirements: { users?: number; qps?: number } = {};
    if (users !== undefined) {
      scaleRequirements.users = users;
    }
    if (qps !== undefined) {
      scaleRequirements.qps = qps;
    }

    return {
      domain,
      entities,
      constraints,
      ...(Object.keys(scaleRequirements).length > 0 ? { scaleRequirements } : {}),
      capabilities: inferCapabilities(normalized),
      futureNeeds
    };
  }
}

function inferDomain(requirement: string): readonly string[] {
  if (requirement.includes("积分") || requirement.toLowerCase().includes("point")) {
    return ["Point", "Reward", "Ledger"];
  }

  return ["Core Domain"];
}

function inferEntities(normalizedRequirement: string): readonly string[] {
  if (normalizedRequirement.includes("积分") || normalizedRequirement.includes("point")) {
    return ["User", "PointAccount", "PointTransaction", "RewardCampaign"];
  }

  return ["User", "BusinessRecord"];
}

function inferConstraints(normalizedRequirement: string): readonly Constraint[] {
  const constraints: Constraint[] = [];

  if (
    normalizedRequirement.includes("不能丢")
    || normalizedRequirement.includes("不丢")
    || normalizedRequirement.includes("一致")
    || normalizedRequirement.includes("strong")
    || normalizedRequirement.includes("ledger")
  ) {
    constraints.push({
      type: "consistency",
      description: "Critical domain state must be strongly consistent and durable.",
      value: "strong"
    });
  }

  if (
    normalizedRequirement.includes("100万")
    || normalizedRequirement.includes("百万")
    || normalizedRequirement.includes("million")
    || normalizedRequirement.includes("qps")
  ) {
    constraints.push({
      type: "performance",
      description: "The architecture should support high read traffic without making cache the source of truth."
    });
  }

  if (constraints.length === 0) {
    constraints.push({
      type: "availability",
      description: "The architecture should keep the core user workflow available."
    });
  }

  return constraints;
}

function inferCapabilities(normalizedRequirement: string): readonly string[] {
  const capabilities = ["api", "domain-service"];

  if (
    normalizedRequirement.includes("不能丢")
    || normalizedRequirement.includes("ledger")
    || normalizedRequirement.includes("积分")
    || normalizedRequirement.includes("point")
  ) {
    capabilities.push("transactional-storage", "strong-consistency", "source-of-truth");
  }

  if (
    normalizedRequirement.includes("100万")
    || normalizedRequirement.includes("百万")
    || normalizedRequirement.includes("million")
  ) {
    capabilities.push("read-cache");
  }

  return capabilities;
}

function inferFutureNeeds(normalizedRequirement: string): readonly string[] {
  const needs: string[] = [];

  if (normalizedRequirement.includes("未来") || normalizedRequirement.includes("future")) {
    needs.push("Plan an evolution phase instead of overloading the initial service boundary.");
  }
  if (normalizedRequirement.includes("兑换") || normalizedRequirement.includes("redeem")) {
    needs.push("Prepare a reward redemption capability as a later bounded extension.");
  }

  return needs;
}

function inferUserCount(requirement: string): number | undefined {
  if (requirement.includes("100万") || requirement.includes("一百万")) {
    return 1000000;
  }

  const millionMatch = requirement.match(/(\d+(?:\.\d+)?)\s*(million|m users)/i);
  if (millionMatch?.[1] !== undefined) {
    return Math.round(Number(millionMatch[1]) * 1000000);
  }

  const explicitMatch = requirement.match(/(\d[\d,]*)\s*(users|用户)/i);
  if (explicitMatch?.[1] !== undefined) {
    return Number(explicitMatch[1].replaceAll(",", ""));
  }

  return undefined;
}

function inferQps(requirement: string): number | undefined {
  const match = requirement.match(/(\d[\d,]*)\s*qps/i);
  if (match?.[1] === undefined) {
    return undefined;
  }

  return Number(match[1].replaceAll(",", ""));
}
