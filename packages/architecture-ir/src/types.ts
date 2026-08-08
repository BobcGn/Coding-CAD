export type Identifier = string;

export type RequirementLevel = "low" | "medium" | "high" | "strong";

export type ComponentKind =
  | "frontend-app"
  | "backend-service"
  | "worker"
  | "database"
  | "cache"
  | "message-broker"
  | "external-system"
  | "library"
  | "ai-agent"
  | "unknown";

export type ConnectionProtocol =
  | "HTTP"
  | "REST"
  | "GraphQL"
  | "gRPC"
  | "SQL"
  | "Redis"
  | "Kafka"
  | "Event"
  | "Queue"
  | "SDK"
  | "File"
  | "Unknown";

export type ConstraintCategory =
  | "consistency"
  | "availability"
  | "scalability"
  | "security"
  | "dependency"
  | "technology"
  | "domain"
  | "operational";

export type DiagnosticSeverity = "info" | "warning" | "error";

/**
 * Stable architecture model shared by DSL, validators, UI, and future Agents.
 * Keep this package behavior-free so every other surface can depend on the
 * same vocabulary without inheriting parser or runtime concerns.
 */
export interface ArchitectureIR {
  readonly schemaVersion: string;
  readonly project: ProjectIntent;
  readonly domain?: DomainModel;
  readonly architecture: ArchitectureGraph;
  readonly technologyBindings?: readonly TechnologyBinding[];
  readonly constraints?: readonly ArchitectureConstraint[];
  readonly decisions?: readonly ArchitectureDecision[];
  readonly evolution?: EvolutionPlan;
  readonly metadata?: ArchitectureMetadata;
}

export interface ArchitectureMetadata {
  readonly source?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly tags?: readonly string[];
}

export interface ProjectIntent {
  readonly name: string;
  readonly mission?: string;
  readonly scale?: ProjectScale;
  readonly requirements?: ProjectRequirements;
  readonly stakeholders?: readonly string[];
  readonly nonGoals?: readonly string[];
}

export interface ProjectScale {
  readonly users?: number;
  readonly peakQps?: number;
  readonly dataVolumeGb?: number;
  readonly availabilityTarget?: string;
}

export interface ProjectRequirements {
  readonly consistency?: RequirementLevel;
  readonly latencyMsP95?: number;
  readonly compliance?: readonly string[];
  readonly deployment?: readonly string[];
  readonly extensibility?: RequirementLevel;
}

export interface DomainModel {
  readonly boundedContexts?: readonly BoundedContext[];
  readonly entities?: readonly DomainEntity[];
  readonly valueObjects?: readonly ValueObject[];
  readonly events?: readonly DomainEvent[];
}

export interface BoundedContext {
  readonly id: Identifier;
  readonly name: string;
  readonly responsibilities: readonly string[];
}

export interface DomainEntity {
  readonly id: Identifier;
  readonly name: string;
  readonly contextId?: Identifier;
  readonly fields: readonly DomainField[];
  readonly invariants?: readonly string[];
}

export interface ValueObject {
  readonly id: Identifier;
  readonly name: string;
  readonly fields: readonly DomainField[];
}

export interface DomainField {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly description?: string;
}

export interface DomainEvent {
  readonly id: Identifier;
  readonly name: string;
  readonly producer?: Identifier;
  readonly payload?: readonly DomainField[];
  readonly meaning?: string;
}

export interface ArchitectureGraph {
  readonly components: readonly Component[];
  readonly connections?: readonly Connection[];
}

/**
 * A deployable, logical, or external architecture element.
 * `kind` describes architectural role; `technology` is optional because early
 * design should be able to express intent before a concrete tool is chosen.
 */
export interface Component {
  readonly id: Identifier;
  readonly name: string;
  readonly kind: ComponentKind;
  readonly purpose?: string;
  readonly capabilities: readonly string[];
  readonly limitations?: readonly string[];
  readonly interfaces?: readonly ComponentInterface[];
  readonly contract?: ComponentContract;
  readonly logicalRole?: string;
  readonly technology?: string;
  readonly tags?: readonly string[];
}

export interface ComponentInterface {
  readonly id: Identifier;
  readonly name: string;
  readonly direction: "provided" | "required";
  readonly protocol?: ConnectionProtocol | string;
  readonly contract?: string;
}

export interface ComponentContract {
  readonly guarantees?: readonly string[];
  readonly requires?: readonly string[];
  readonly forbidden?: readonly string[];
  readonly dataOwnership?: readonly string[];
}

export interface Connection {
  readonly id: Identifier;
  readonly from: Identifier;
  readonly to: Identifier;
  readonly protocol: ConnectionProtocol | string;
  readonly purpose?: string;
  readonly mode?: "sync" | "async" | "batch";
  readonly data?: readonly string[];
  readonly constraints?: readonly string[];
}

export interface TechnologyBinding {
  readonly id: Identifier;
  readonly logicalRole: string;
  readonly technology: string;
  readonly componentId?: Identifier;
  readonly rationale?: string;
  readonly alternatives?: readonly string[];
  readonly phase?: string;
}

export interface ArchitectureConstraint {
  readonly id: Identifier;
  readonly category: ConstraintCategory;
  readonly severity: DiagnosticSeverity;
  readonly statement: string;
  readonly appliesTo?: readonly Identifier[];
  readonly rationale?: string;
}

export interface ArchitectureDecision {
  readonly id: Identifier;
  readonly title: string;
  readonly status: "proposed" | "accepted" | "rejected" | "superseded";
  readonly context: string;
  readonly decision: string;
  readonly consequences?: readonly string[];
  readonly supersedes?: Identifier;
}

export interface EvolutionPlan {
  readonly phases: readonly EvolutionPhase[];
}

export interface EvolutionPhase {
  readonly id: Identifier;
  readonly name: string;
  readonly trigger?: string;
  readonly changes: readonly EvolutionChange[];
  readonly decisions?: readonly Identifier[];
}

export interface EvolutionChange {
  readonly type: "add" | "replace" | "remove" | "scale" | "split" | "merge";
  readonly target: Identifier | string;
  readonly description: string;
}

/**
 * Validator output is part of the product contract, not just logging.
 * `rationale` should explain the architectural risk so humans and Agents can
 * make a decision without reverse-engineering the rule implementation.
 */
export interface ArchitectureDiagnostic {
  readonly id: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly componentId?: Identifier;
  readonly connectionId?: Identifier;
  readonly rationale?: string;
}
