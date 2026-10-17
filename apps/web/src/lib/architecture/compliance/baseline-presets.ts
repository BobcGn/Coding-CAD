import type { ArchitectureProject } from "@coding-cad/architecture-ir";

export const CODING_CAD_EXPECTED_BASELINE: ArchitectureProject = {
  version: "1.0",
  intent: {
    name: "Coding-CAD",
    purpose: [
      "Coding CAD Monorepo Software Architecture Workspace",
      "Provide an auditable single source of truth for software architectures",
      "Support deterministic architecture reverse-engineering and compliance validation"
    ]
  },
  domain: {
    entities: []
  },
  architecture: {
    components: [
      { id: "agent-adapter", name: "AgentAdapter", type: "service", capabilities: ["prompt-rendering"] },
      { id: "architecture-agent", name: "ArchitectureAgent", type: "service", capabilities: ["architecture-synthesis"] },
      { id: "architecture-dsl", name: "ArchitectureDsl", type: "service", capabilities: ["dsl-parsing"] },
      { id: "architecture-ir", name: "ArchitectureIr", type: "service", capabilities: ["architecture-model"] },
      { id: "architecture-layout", name: "ArchitectureLayout", type: "service", capabilities: ["semantic-layout"] },
      { id: "architecture-review", name: "ArchitectureReview", type: "service", capabilities: ["review-gate"] },
      { id: "architecture-validator", name: "ArchitectureValidator", type: "service", capabilities: ["architecture-validation"] },
      { id: "cli", name: "Cli", type: "service", capabilities: ["command-line-interface"] },
      { id: "component-registry", name: "ComponentRegistry", type: "service", capabilities: ["component-definitions"] },
      { id: "execution-blueprint", name: "ExecutionBlueprint", type: "service", capabilities: ["execution-planning"] },
      { id: "implementation-analyzer", name: "ImplementationAnalyzer", type: "service", capabilities: ["codebase-reverse-engineering"] },
      { id: "implementation-validator", name: "ImplementationValidator", type: "service", capabilities: ["compliance-verification"] },
      { id: "server", name: "Server", type: "service", capabilities: ["dsl-analysis-services"] },
      { id: "web", name: "Web", type: "service", capabilities: ["architecture-workspace-ui"] },
      { id: "workspace", name: "Workspace", type: "service", capabilities: ["project-lifecycle-storage"] }
    ],
    connections: [
      { id: "agent-adapter-to-execution-blueprint", from: "agent-adapter", to: "execution-blueprint", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-dsl", from: "architecture-agent", to: "architecture-dsl", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-ir", from: "architecture-agent", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-validator", from: "architecture-agent", to: "architecture-validator", protocol: "module-import" },
      { id: "architecture-agent-to-component-registry", from: "architecture-agent", to: "component-registry", protocol: "module-import" },
      { id: "architecture-dsl-to-architecture-ir", from: "architecture-dsl", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-layout-to-architecture-ir", from: "architecture-layout", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-review-to-architecture-ir", from: "architecture-review", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-review-to-architecture-validator", from: "architecture-review", to: "architecture-validator", protocol: "module-import" },
      { id: "architecture-review-to-execution-blueprint", from: "architecture-review", to: "execution-blueprint", protocol: "module-import" },
      { id: "architecture-review-to-workspace", from: "architecture-review", to: "workspace", protocol: "module-import" },
      { id: "architecture-validator-to-architecture-ir", from: "architecture-validator", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-validator-to-component-registry", from: "architecture-validator", to: "component-registry", protocol: "module-import" },
      { id: "cli-to-architecture-agent", from: "cli", to: "architecture-agent", protocol: "module-import" },
      { id: "cli-to-architecture-dsl", from: "cli", to: "architecture-dsl", protocol: "module-import" },
      { id: "cli-to-architecture-ir", from: "cli", to: "architecture-ir", protocol: "module-import" },
      { id: "cli-to-architecture-validator", from: "cli", to: "architecture-validator", protocol: "module-import" },
      { id: "cli-to-component-registry", from: "cli", to: "component-registry", protocol: "module-import" },
      { id: "component-registry-to-architecture-ir", from: "component-registry", to: "architecture-ir", protocol: "module-import" },
      { id: "execution-blueprint-to-architecture-ir", from: "execution-blueprint", to: "architecture-ir", protocol: "module-import" },
      { id: "execution-blueprint-to-architecture-validator", from: "execution-blueprint", to: "architecture-validator", protocol: "module-import" },
      { id: "execution-blueprint-to-component-registry", from: "execution-blueprint", to: "component-registry", protocol: "module-import" },
      { id: "implementation-analyzer-to-architecture-ir", from: "implementation-analyzer", to: "architecture-ir", protocol: "module-import" },
      { id: "implementation-validator-to-architecture-ir", from: "implementation-validator", to: "architecture-ir", protocol: "module-import" },
      { id: "implementation-validator-to-execution-blueprint", from: "implementation-validator", to: "execution-blueprint", protocol: "module-import" },
      { id: "implementation-validator-to-implementation-analyzer", from: "implementation-validator", to: "implementation-analyzer", protocol: "module-import" },
      { id: "server-to-architecture-dsl", from: "server", to: "architecture-dsl", protocol: "module-import" },
      { id: "server-to-architecture-validator", from: "server", to: "architecture-validator", protocol: "module-import" },
      { id: "web-to-architecture-agent", from: "web", to: "architecture-agent", protocol: "module-import" },
      { id: "web-to-architecture-ir", from: "web", to: "architecture-ir", protocol: "module-import" },
      { id: "web-to-architecture-layout", from: "web", to: "architecture-layout", protocol: "module-import" },
      { id: "web-to-architecture-review", from: "web", to: "architecture-review", protocol: "module-import" },
      { id: "web-to-architecture-validator", from: "web", to: "architecture-validator", protocol: "module-import" },
      { id: "web-to-component-registry", from: "web", to: "component-registry", protocol: "module-import" },
      { id: "web-to-implementation-analyzer", from: "web", to: "implementation-analyzer", protocol: "module-import" },
      { id: "web-to-implementation-validator", from: "web", to: "implementation-validator", protocol: "module-import" },
      { id: "web-to-agent-adapter", from: "web", to: "agent-adapter", protocol: "module-import" },
      { id: "web-to-execution-blueprint", from: "web", to: "execution-blueprint", protocol: "module-import" },
      { id: "web-to-workspace", from: "web", to: "workspace", protocol: "module-import" },
      { id: "workspace-to-architecture-ir", from: "workspace", to: "architecture-ir", protocol: "module-import" },
      { id: "workspace-to-architecture-validator", from: "workspace", to: "architecture-validator", protocol: "module-import" },
      { id: "workspace-to-execution-blueprint", from: "workspace", to: "execution-blueprint", protocol: "module-import" }
    ]
  },
  constraints: [],
  decisions: [],
  evolution: {
    phases: []
  }
};

export const CODING_CAD_DRIFTED_BASELINE: ArchitectureProject = {
  version: "1.0",
  intent: {
    name: "Coding-CAD (Drifted)",
    purpose: [
      "Coding CAD Monorepo Software Architecture Workspace (Drifted Baseline)",
      "Demonstrate explainable compliance drift detection"
    ]
  },
  domain: {
    entities: []
  },
  architecture: {
    components: [
      { id: "agent-adapter", name: "AgentAdapter", type: "service", capabilities: ["prompt-rendering"] },
      { id: "architecture-agent", name: "ArchitectureAgent", type: "service", capabilities: ["architecture-synthesis"] },
      { id: "architecture-dsl", name: "ArchitectureDsl", type: "service", capabilities: ["dsl-parsing"] },
      { id: "architecture-ir", name: "ArchitectureIr", type: "service", capabilities: ["architecture-model"] },
      { id: "architecture-layout", name: "ArchitectureLayout", type: "service", capabilities: ["semantic-layout"] },
      { id: "architecture-review", name: "ArchitectureReview", type: "service", capabilities: ["review-gate"] },
      { id: "architecture-validator", name: "ArchitectureValidator", type: "service", capabilities: ["architecture-validation"] },
      { id: "cli", name: "Cli", type: "service", capabilities: ["command-line-interface"] },
      { id: "component-registry", name: "ComponentRegistry", type: "service", capabilities: ["component-definitions"] },
      { id: "execution-blueprint", name: "ExecutionBlueprint", type: "service", capabilities: ["execution-planning"] },
      { id: "implementation-analyzer", name: "ImplementationAnalyzer", type: "service", capabilities: ["codebase-reverse-engineering"] },
      { id: "implementation-validator", name: "ImplementationValidator", type: "service", capabilities: ["compliance-verification"] },
      {
        id: "server",
        name: "Server",
        type: "service",
        technology: "FastAPI",
        capabilities: ["dsl-analysis-services"],
        contracts: [
          { name: "GET /api/v1/health", protocol: "REST" }
        ]
      },
      { id: "web", name: "Web", type: "service", capabilities: ["architecture-workspace-ui"] },
      { id: "workspace", name: "Workspace", type: "service", capabilities: ["project-lifecycle-storage"] },
      {
        id: "audit-logger",
        name: "AuditLogger",
        type: "service",
        capabilities: ["audit-logging"]
      }
    ],
    connections: [
      { id: "agent-adapter-to-execution-blueprint", from: "agent-adapter", to: "execution-blueprint", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-dsl", from: "architecture-agent", to: "architecture-dsl", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-ir", from: "architecture-agent", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-agent-to-architecture-validator", from: "architecture-agent", to: "architecture-validator", protocol: "module-import" },
      { id: "architecture-agent-to-component-registry", from: "architecture-agent", to: "component-registry", protocol: "module-import" },
      { id: "architecture-dsl-to-architecture-ir", from: "architecture-dsl", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-layout-to-architecture-ir", from: "architecture-layout", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-review-to-architecture-ir", from: "architecture-review", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-review-to-architecture-validator", from: "architecture-review", to: "architecture-validator", protocol: "module-import" },
      { id: "architecture-review-to-execution-blueprint", from: "architecture-review", to: "execution-blueprint", protocol: "module-import" },
      { id: "architecture-review-to-workspace", from: "architecture-review", to: "workspace", protocol: "module-import" },
      { id: "architecture-validator-to-architecture-ir", from: "architecture-validator", to: "architecture-ir", protocol: "module-import" },
      { id: "architecture-validator-to-component-registry", from: "architecture-validator", to: "component-registry", protocol: "module-import" },
      { id: "cli-to-architecture-agent", from: "cli", to: "architecture-agent", protocol: "module-import" },
      { id: "cli-to-architecture-dsl", from: "cli", to: "architecture-dsl", protocol: "module-import" },
      { id: "cli-to-architecture-ir", from: "cli", to: "architecture-ir", protocol: "module-import" },
      { id: "cli-to-architecture-validator", from: "cli", to: "architecture-validator", protocol: "module-import" },
      { id: "component-registry-to-architecture-ir", from: "component-registry", to: "architecture-ir", protocol: "module-import" },
      { id: "execution-blueprint-to-architecture-ir", from: "execution-blueprint", to: "architecture-ir", protocol: "module-import" },
      { id: "execution-blueprint-to-architecture-validator", from: "execution-blueprint", to: "architecture-validator", protocol: "module-import" },
      { id: "execution-blueprint-to-component-registry", from: "execution-blueprint", to: "component-registry", protocol: "module-import" },
      { id: "implementation-analyzer-to-architecture-ir", from: "implementation-analyzer", to: "architecture-ir", protocol: "module-import" },
      { id: "implementation-validator-to-architecture-ir", from: "implementation-validator", to: "architecture-ir", protocol: "module-import" },
      { id: "implementation-validator-to-execution-blueprint", from: "implementation-validator", to: "execution-blueprint", protocol: "module-import" },
      { id: "implementation-validator-to-implementation-analyzer", from: "implementation-validator", to: "implementation-analyzer", protocol: "module-import" },
      { id: "server-to-architecture-dsl", from: "server", to: "architecture-dsl", protocol: "module-import" },
      { id: "server-to-architecture-validator", from: "server", to: "architecture-validator", protocol: "module-import" },
      { id: "web-to-architecture-agent", from: "web", to: "architecture-agent", protocol: "module-import" },
      { id: "web-to-architecture-ir", from: "web", to: "architecture-ir", protocol: "module-import" },
      { id: "web-to-architecture-layout", from: "web", to: "architecture-layout", protocol: "module-import" },
      { id: "web-to-architecture-review", from: "web", to: "architecture-review", protocol: "module-import" },
      { id: "web-to-architecture-validator", from: "web", to: "architecture-validator", protocol: "module-import" },
      { id: "web-to-component-registry", from: "web", to: "component-registry", protocol: "module-import" },
      { id: "web-to-implementation-analyzer", from: "web", to: "implementation-analyzer", protocol: "module-import" },
      { id: "web-to-implementation-validator", from: "web", to: "implementation-validator", protocol: "module-import" },
      { id: "web-to-workspace", from: "web", to: "workspace", protocol: "module-import" },
      { id: "web-to-agent-adapter", from: "web", to: "agent-adapter", protocol: "module-import" },
      { id: "web-to-execution-blueprint", from: "web", to: "execution-blueprint", protocol: "module-import" },
      { id: "web-to-server", from: "web", to: "server", protocol: "module-import" },
      { id: "workspace-to-architecture-ir", from: "workspace", to: "architecture-ir", protocol: "module-import" },
      { id: "workspace-to-architecture-validator", from: "workspace", to: "architecture-validator", protocol: "module-import" },
      { id: "workspace-to-execution-blueprint", from: "workspace", to: "execution-blueprint", protocol: "module-import" }
    ]
  },
  constraints: [],
  decisions: [],
  evolution: {
    phases: []
  }
};
