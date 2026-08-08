import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { ArchitectureAgent } from "./agent.js";
import { HeuristicRequirementAnalyzer } from "./requirement/analyzer.js";
import { HeuristicDecisionMaker } from "./reasoning/decision-maker.js";
import { ValidatorFeedbackRefinementLoop } from "./validation/refinement-loop.js";

const agent = new ArchitectureAgent();
const requirement = "设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。";

const project = await agent.design(requirement);
const componentNames = project.architecture.components.map((component) => component.name);

assert.equal(project.intent.name, "PointSystem");
assert.ok(componentNames.includes("PointService"));
assert.ok(componentNames.includes("PostgreSQL"));
assert.ok(componentNames.includes("Redis"));

const analyzer = new HeuristicRequirementAnalyzer();
const analysis = await analyzer.analyze(requirement);
const decisions = await new HeuristicDecisionMaker().decide(analysis);

assert.ok(decisions.length > 0);
assert.ok(decisions[0]?.decision.includes("PostgreSQL"));
assert.ok(decisions[0]?.rationale.includes("strong consistency"));

class CountingValidator extends ArchitectureValidator {
  calls = 0;

  override validate(projectToValidate: ArchitectureProject) {
    this.calls += 1;
    return super.validate(projectToValidate);
  }
}

const countingValidator = new CountingValidator();
const validatingAgent = new ArchitectureAgent({
  validator: countingValidator
});

await validatingAgent.design(requirement);
assert.equal(countingValidator.calls, 2);

const invalidRedisPrimary: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "BrokenPointSystem",
    purpose: ["Track point balances."],
    requirements: {
      consistency: "strong"
    }
  },
  domain: {
    entities: [
      {
        name: "PointAccount",
        fields: [
          {
            name: "balance",
            type: "Integer",
            required: true
          }
        ]
      }
    ]
  },
  architecture: {
    components: [
      {
        id: "point-service",
        name: "PointService",
        type: "service",
        capabilities: ["domain-service"]
      },
      {
        id: "redis",
        name: "Redis",
        type: "database",
        technology: "redis",
        description: "Primary ledger storage for point balances.",
        capabilities: ["primary-storage", "strong-consistency"],
        logicalRole: "primary-storage",
        tags: ["ledger", "balance"]
      }
    ],
    connections: [
      {
        id: "point-service-to-redis",
        from: "point-service",
        to: "redis",
        protocol: "Redis protocol",
        description: "Persist point balances."
      }
    ]
  },
  constraints: [
    {
      type: "consistency",
      description: "Point balance must be strongly consistent.",
      value: "strong"
    }
  ],
  decisions: []
};

const initialValidation = agent.validate(invalidRedisPrimary);
assert.ok(initialValidation.issues.some((issue) => issue.title.includes("Redis")));

const refined = await new ValidatorFeedbackRefinementLoop().refine(invalidRedisPrimary, initialValidation);
const refinedRedis = refined.architecture.components.find((component) => component.id === "redis");

assert.equal(refinedRedis?.type, "cache");
assert.ok(refined.architecture.components.some((component) => component.name === "PostgreSQL"));
assert.ok(refined.decisions.some((decision) => decision.title.includes("Move ledger source of truth")));

console.log("architecture-agent tests passed");
