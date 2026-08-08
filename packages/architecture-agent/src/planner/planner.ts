import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { DecisionMaker } from "../reasoning/decision-maker.js";
import type { RequirementAnalysis } from "../requirement/analyzer.js";

export interface ArchitecturePlanner {
  plan(analysis: RequirementAnalysis): Promise<ArchitectureProject>;
}

export interface HeuristicArchitecturePlannerOptions {
  readonly decisionMaker: DecisionMaker;
}

export class HeuristicArchitecturePlanner implements ArchitecturePlanner {
  constructor(private readonly options: HeuristicArchitecturePlannerOptions) {}

  async plan(analysis: RequirementAnalysis): Promise<ArchitectureProject> {
    const decisions = await this.options.decisionMaker.decide(analysis);

    const scale = buildScale(analysis);
    const requirements = buildRequirements(analysis);

    const includeReadCache = analysis.capabilities.includes("read-cache");

    return {
      version: "0.1",
      intent: {
        name: inferProjectName(analysis),
        purpose: [
          "Provide a validated architecture blueprint from user requirements.",
          "Keep critical domain state consistent before any code generation is considered."
        ],
        ...(scale !== undefined ? { scale } : {}),
        requirements
      },
      domain: {
        entities: buildDomainEntities(analysis)
      },
      architecture: {
        components: buildComponents(analysis),
        connections: [
          {
            id: "rest-api-to-point-service",
            from: "rest-api",
            to: "point-service",
            protocol: "REST",
            description: "Expose point commands and queries to external callers.",
            contractName: "Point API"
          },
          {
            id: "point-service-to-postgresql",
            from: "point-service",
            to: "postgresql",
            protocol: "SQL",
            description: "Persist point accounts and point transactions in the system of record."
          },
          ...(includeReadCache ? [{
            id: "point-service-to-redis",
            from: "point-service",
            to: "redis",
            protocol: "Redis protocol",
            description: "Read and refresh derived point summaries for fast query paths."
          }] : [])
        ]
      },
      constraints: analysis.constraints,
      decisions,
      evolution: {
        phases: [
          {
            name: "V1",
            description: "Launch with a point service, transactional ledger storage, and optional read cache.",
            changes: ["Create PointService", "Use PostgreSQL as source of truth", "Use Redis for derived read cache"]
          },
          {
            name: "V2",
            description: "Add campaign redemption once the point ledger is stable.",
            changes: analysis.futureNeeds.length > 0 ? ["Add RewardCampaign and redemption workflow"] : ["Refine domain boundaries from production feedback"]
          }
        ]
      }
    };
  }
}

function inferProjectName(analysis: RequirementAnalysis): string {
  return analysis.domain.includes("Point") ? "PointSystem" : "ArchitectureProject";
}

function buildScale(analysis: RequirementAnalysis): ArchitectureProject["intent"]["scale"] {
  const scale = {
    ...(analysis.scaleRequirements?.users !== undefined ? { users: analysis.scaleRequirements.users } : {}),
    ...(analysis.scaleRequirements?.qps !== undefined ? { peakQps: analysis.scaleRequirements.qps } : {})
  };

  return Object.keys(scale).length > 0 ? scale : undefined;
}

function buildRequirements(analysis: RequirementAnalysis): NonNullable<ArchitectureProject["intent"]["requirements"]> {
  return {
    ...(analysis.constraints.some((constraint) => constraint.type === "consistency") ? { consistency: "strong" as const } : {}),
    extensibility: analysis.futureNeeds.length > 0 ? "high" : "medium"
  };
}

function buildDomainEntities(analysis: RequirementAnalysis): ArchitectureProject["domain"]["entities"] {
  if (analysis.entities.includes("PointAccount")) {
    return [
      {
        name: "User",
        description: "Participant that owns a point account.",
        fields: [
          {
            name: "userId",
            type: "UserId",
            required: true
          }
        ]
      },
      {
        name: "PointAccount",
        description: "Owns the current point balance for one user.",
        fields: [
          {
            name: "userId",
            type: "UserId",
            required: true
          },
          {
            name: "balance",
            type: "Integer",
            required: true
          }
        ],
        relations: [
          {
            name: "transactions",
            targetEntity: "PointTransaction",
            type: "one-to-many"
          }
        ],
        invariants: ["Balance changes must be derived from durable point transactions."]
      },
      {
        name: "PointTransaction",
        description: "Auditable record of one point balance change.",
        fields: [
          {
            name: "amount",
            type: "Integer",
            required: true
          },
          {
            name: "reason",
            type: "String",
            required: true
          }
        ],
        invariants: ["A transaction must be recorded before the visible balance changes."]
      },
      {
        name: "RewardCampaign",
        description: "Future redemption campaign that can consume points under explicit rules.",
        fields: [
          {
            name: "campaignId",
            type: "CampaignId",
            required: true
          }
        ]
      }
    ];
  }

  return analysis.entities.map((entity) => ({
    name: entity,
    fields: []
  }));
}

function buildComponents(analysis: RequirementAnalysis): readonly Component[] {
  const components: Component[] = [
    {
      id: "rest-api",
      name: "REST API",
      description: "Public API boundary for architecture-level user interactions.",
      type: "gateway",
      technology: "rest-api",
      capabilities: ["api"],
      limitations: ["does-not-own-domain-state"],
      contracts: [
        {
          name: "Point API",
          protocol: "REST",
          inputs: [
            {
              name: "AddPointRequest",
              fields: [
                {
                  name: "userId",
                  type: "UserId",
                  required: true
                },
                {
                  name: "amount",
                  type: "Integer",
                  required: true
                }
              ]
            }
          ],
          outputs: [
            {
              name: "PointBalance",
              fields: [
                {
                  name: "balance",
                  type: "Integer",
                  required: true
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "point-service",
      name: "PointService",
      description: "Owns point commands, balance invariants, and transaction orchestration.",
      type: "service",
      capabilities: ["domain-service", "transactional-command-handling"],
      limitations: ["does-not-store-ledger-directly"],
      logicalRole: "point-ledger-owner",
      tags: ["point", "ledger", "balance"]
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      description: "Transactional source of truth for point accounts and point transaction ledger.",
      type: "database",
      technology: "postgresql",
      capabilities: ["transaction", "relational-storage", "strong-consistency", "source-of-truth"],
      limitations: ["horizontal-scaling-complex"],
      logicalRole: "primary-storage",
      tags: ["ledger", "balance", "transactional-storage"]
    }
  ];

  if (analysis.capabilities.includes("read-cache")) {
    components.push({
      id: "redis",
      name: "Redis",
      description: "Derived cache for hot point balance reads; never the source of truth.",
      type: "cache",
      technology: "redis",
      capabilities: ["cache", "key-value", "high-performance-read"],
      limitations: ["not-primary-storage", "weak-consistency"],
      logicalRole: "read-cache",
      tags: ["cache", "derived-read-model"]
    });
  }

  return components;
}
