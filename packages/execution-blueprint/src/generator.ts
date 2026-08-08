import type {
  ArchitectureDecision,
  ArchitectureProject,
  Component,
  Connection,
  Constraint
} from "@coding-cad/architecture-ir";
import {
  ArchitectureValidator,
  type ValidationIssue,
  type ValidationResult
} from "@coding-cad/architecture-validator";
import {
  createComponentRegistry,
  type ComponentDefinition,
  type ComponentRegistry
} from "@coding-cad/component-registry";
import type { ExecutionBlueprint } from "./blueprint.js";
import type { ImplementationConstraint } from "./constraint.js";
import type { AgentGuide } from "./guide.js";
import type { ImplementationTask } from "./task.js";

export interface GenerateExecutionBlueprintOptions {
  readonly validationResult?: ValidationResult;
}

export interface ExecutionBlueprintGeneratorOptions {
  readonly registry?: ComponentRegistry;
  readonly validator?: ArchitectureValidator;
}

export class ExecutionBlueprintGenerator {
  private readonly registry: ComponentRegistry;
  private readonly validator: ArchitectureValidator;

  constructor(options: ExecutionBlueprintGeneratorOptions = {}) {
    this.registry = options.registry ?? createComponentRegistry();
    this.validator = options.validator ?? new ArchitectureValidator(undefined, {
      registry: this.registry
    });
  }

  generate(
    architecture: ArchitectureProject,
    options: GenerateExecutionBlueprintOptions = {}
  ): ExecutionBlueprint {
    const validationResult = options.validationResult ?? this.validator.validate(architecture);
    const componentDefinitions = this.registry.list();
    const tasks = generateTasks(architecture);
    const constraints = generateConstraints(architecture, validationResult, componentDefinitions);

    return {
      projectName: architecture.intent.name,
      architectureReference: architectureReference(architecture),
      tasks,
      constraints,
      agentGuide: generateAgentGuide(architecture, validationResult, constraints)
    };
  }
}

export function generateExecutionBlueprint(
  architecture: ArchitectureProject,
  options: GenerateExecutionBlueprintOptions = {}
): ExecutionBlueprint {
  return new ExecutionBlueprintGenerator().generate(architecture, options);
}

function architectureReference(architecture: ArchitectureProject): string {
  return `${architecture.intent.name}@architecture-ir:${architecture.version}`;
}

function generateTasks(architecture: ArchitectureProject): readonly ImplementationTask[] {
  const componentTasks = architecture.architecture.components.map((component) =>
    taskForComponent(component, architecture)
  );
  const connectionTasks = architecture.architecture.connections.map((connection) =>
    taskForConnection(connection, architecture)
  );
  const consistencyTasks = architecture.constraints
    .filter((constraint) => constraint.type === "consistency")
    .map((constraint) => taskForConsistencyConstraint(constraint, architecture));

  return dedupeTasks([...componentTasks, ...connectionTasks, ...consistencyTasks]);
}

function taskForComponent(component: Component, architecture: ArchitectureProject): ImplementationTask {
  const componentId = component.id;
  const requirements = [
    `Respect Architecture IR component '${component.name}'.`,
    ...(component.description ? [component.description] : []),
    ...component.capabilities.map((capability) => `Provide capability: ${capability}.`),
    ...architecture.decisions
      .filter((decision) => mentionsComponent(decision, component))
      .map((decision) => `Preserve decision: ${decision.decision}`)
  ];

  return {
    id: `implement-${componentId}`,
    title: componentTaskTitle(component),
    description: component.description ?? `Implement the logical architecture component '${component.name}'.`,
    relatedComponents: [componentId],
    requirements,
    dependencies: []
  };
}

function componentTaskTitle(component: Component): string {
  if (component.type === "service") {
    return `Create ${component.name}`;
  }
  if (component.type === "gateway") {
    return `Create ${component.name} boundary`;
  }
  if (component.type === "cache") {
    return `Add ${component.name} cache layer`;
  }
  if (component.type === "database" || component.type === "storage") {
    return `Create ${component.name} persistence layer`;
  }

  return `Implement ${component.name}`;
}

function taskForConnection(connection: Connection, architecture: ArchitectureProject): ImplementationTask {
  const from = findComponent(architecture, connection.from);
  const to = findComponent(architecture, connection.to);
  const fromName = from?.name ?? connection.from;
  const toName = to?.name ?? connection.to;

  return {
    id: `connect-${connection.from}-to-${connection.to}`,
    title: connectionTaskTitle(connection, architecture),
    description: connection.description ?? `Implement architecture connection from ${fromName} to ${toName}.`,
    relatedComponents: [connection.from, connection.to],
    requirements: [
      `Implement communication from ${fromName} to ${toName}.`,
      `Use protocol: ${connection.protocol}.`,
      ...(connection.contractName ? [`Respect contract: ${connection.contractName}.`] : []),
      ...(connection.description ? [connection.description] : [])
    ],
    dependencies: [`implement-${connection.from}`, `implement-${connection.to}`]
  };
}

function connectionTaskTitle(connection: Connection, architecture: ArchitectureProject): string {
  const from = findComponent(architecture, connection.from);
  const to = findComponent(architecture, connection.to);

  if ((to?.type === "database" || to?.type === "storage") && from?.type === "service") {
    return `Create ${domainPrefix(from.name)} repository`;
  }
  if (to?.type === "cache") {
    return `Add ${to.name} cache integration`;
  }

  return `Connect ${from?.name ?? connection.from} to ${to?.name ?? connection.to}`;
}

function taskForConsistencyConstraint(
  constraint: Constraint,
  architecture: ArchitectureProject
): ImplementationTask {
  const services = architecture.architecture.components
    .filter((component) => component.type === "service")
    .map((component) => component.id);
  const durableStores = architecture.architecture.components
    .filter((component) => component.type === "database" || component.type === "storage")
    .map((component) => component.id);
  const relatedComponents = [...services, ...durableStores];

  return {
    id: `implement-${constraint.type}-logic`,
    title: "Implement transaction logic",
    description: constraint.description,
    relatedComponents,
    requirements: [
      constraint.description,
      ...(constraint.value !== undefined ? [`Required value: ${String(constraint.value)}.`] : []),
      "Durable state changes must follow the Architecture Decisions before code-level shortcuts are introduced."
    ],
    dependencies: relatedComponents.map((componentId) => `implement-${componentId}`)
  };
}

function generateConstraints(
  architecture: ArchitectureProject,
  validationResult: ValidationResult,
  componentDefinitions: readonly ComponentDefinition[]
): readonly ImplementationConstraint[] {
  return dedupeConstraints([
    ...architecture.constraints.map(constraintFromArchitectureConstraint),
    ...architecture.decisions.flatMap(constraintsFromDecision),
    ...validationResult.issues.map(constraintFromValidationIssue),
    ...architecture.architecture.components.flatMap((component) =>
      constraintsFromComponentLimitations(component, componentDefinitions)
    )
  ]);
}

function constraintFromArchitectureConstraint(constraint: Constraint): ImplementationConstraint {
  return {
    type: constraint.type,
    description: constraint.description,
    severity: "required",
    source: "architecture-constraint",
    sourceReference: constraint.type
  };
}

function constraintsFromDecision(decision: ArchitectureDecision): readonly ImplementationConstraint[] {
  return [
    {
      type: "architecture-decision",
      description: `${decision.decision} Rationale: ${decision.rationale}`,
      severity: "required",
      source: "architecture-decision",
      sourceReference: decision.title
    }
  ];
}

function constraintFromValidationIssue(issue: ValidationIssue): ImplementationConstraint {
  return {
    type: "validator-result",
    description: `${issue.title}: ${issue.description}${issue.suggestion ? ` Suggestion: ${issue.suggestion}` : ""}`,
    severity: issue.severity.toLowerCase(),
    source: "validator-result",
    sourceReference: issue.id
  };
}

function constraintsFromComponentLimitations(
  component: Component,
  componentDefinitions: readonly ComponentDefinition[]
): readonly ImplementationConstraint[] {
  const definition = findComponentDefinition(component, componentDefinitions);
  const limitations = [
    ...(component.limitations ?? []).map((limitation) => ({
      id: limitation,
      description: `${component.name} limitation: ${limitation}.`,
      severity: "warning"
    })),
    ...(definition?.limitations ?? [])
  ];

  return limitations.map((limitation) => ({
    type: "component-limitation",
    description: `${component.name}: ${limitation.description}`,
    severity: limitation.severity ?? "warning",
    source: "component-limitation" as const,
    sourceReference: `${component.id}:${limitation.id}`
  }));
}

function generateAgentGuide(
  architecture: ArchitectureProject,
  validationResult: ValidationResult,
  constraints: readonly ImplementationConstraint[]
): AgentGuide {
  return {
    systemContext: [
      "You are an external Coding Agent implementing a Coding CAD Execution Blueprint.",
      "Use the blueprint as an implementation contract. Do not redesign the architecture unless the human asks for an architecture change.",
      "Generate or modify code only within the implementation task scope."
    ].join(" "),
    architectureSummary: summarizeArchitecture(architecture, validationResult),
    decisions: architecture.decisions.map((decision) =>
      `${decision.title}: ${decision.decision} Rationale: ${decision.rationale}`
    ),
    forbiddenChanges: forbiddenChanges(constraints),
    acceptanceCriteria: acceptanceCriteria(architecture, validationResult)
  };
}

function summarizeArchitecture(
  architecture: ArchitectureProject,
  validationResult: ValidationResult
): string {
  const components = architecture.architecture.components
    .map((component) => `${component.name}${component.type ? ` (${component.type})` : ""}`)
    .join(", ");
  const connections = architecture.architecture.connections
    .map((connection) => `${connection.from} -> ${connection.to}`)
    .join(", ");

  return [
    `${architecture.intent.name} is defined by Architecture IR version ${architecture.version}.`,
    `Purpose: ${architecture.intent.purpose.join(" ")}`,
    `Components: ${components || "none"}.`,
    `Connections: ${connections || "none"}.`,
    `Validation: ${validationResult.summary}`
  ].join(" ");
}

function forbiddenChanges(constraints: readonly ImplementationConstraint[]): readonly string[] {
  const explicit = constraints
    .filter((constraint) =>
      constraint.source === "architecture-decision"
      || constraint.source === "component-limitation"
      || constraint.source === "validator-result"
    )
    .map((constraint) => constraint.description);

  return dedupeStrings([
    "Do not bypass Architecture IR as the source of truth.",
    "Do not replace architecture components with unrelated technologies without a new Architecture Decision.",
    "Do not weaken required consistency, durability, security, or availability constraints.",
    ...explicit
  ]);
}

function acceptanceCriteria(
  architecture: ArchitectureProject,
  validationResult: ValidationResult
): readonly string[] {
  return [
    `Implementation preserves Architecture IR project '${architecture.intent.name}'.`,
    "Every implementation task is completed or explicitly marked out of scope by a human.",
    "Architecture Decisions remain traceable in code structure, tests, or documentation.",
    "Component limitations are handled instead of ignored.",
    validationResult.valid
      ? "No validator ERROR findings remain in the handoff architecture."
      : "Validator findings are addressed before implementation is considered complete."
  ];
}

function findComponent(architecture: ArchitectureProject, id: string): Component | undefined {
  return architecture.architecture.components.find((component) => component.id === id);
}

function findComponentDefinition(
  component: Component,
  componentDefinitions: readonly ComponentDefinition[]
): ComponentDefinition | undefined {
  const keys = [
    component.technology,
    component.id,
    component.name,
    component.type
  ]
    .filter((value): value is string => value !== undefined)
    .map(normalize);

  return componentDefinitions.find((definition) =>
    keys.includes(normalize(definition.id))
    || keys.includes(normalize(definition.name))
    || keys.includes(normalize(definition.category))
  );
}

function mentionsComponent(decision: ArchitectureDecision, component: Component): boolean {
  const text = `${decision.title} ${decision.context} ${decision.decision} ${decision.rationale}`.toLowerCase();
  return [component.name, component.id, component.technology, component.logicalRole]
    .filter((value): value is string => value !== undefined)
    .some((value) => text.includes(value.toLowerCase()));
}

function domainPrefix(serviceName: string): string {
  return serviceName.replace(/Service$/i, "") || serviceName;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
}

function dedupeTasks(tasks: readonly ImplementationTask[]): readonly ImplementationTask[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    if (seen.has(task.id)) {
      return false;
    }
    seen.add(task.id);
    return true;
  });
}

function dedupeConstraints(
  constraints: readonly ImplementationConstraint[]
): readonly ImplementationConstraint[] {
  const seen = new Set<string>();
  return constraints.filter((constraint) => {
    const key = `${constraint.source ?? ""}:${constraint.sourceReference ?? ""}:${constraint.description}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
