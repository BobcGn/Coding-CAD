import { ArchitectureDSLError, formatInvalidField, formatMissingField } from "./error.js";

export type UnknownRecord = Record<string, unknown>;

export interface DSLDocument {
  readonly version: string;
  readonly project: DSLProject;
  readonly domain: DSLDomain;
  readonly architecture: DSLArchitecture;
  readonly constraints?: readonly DSLConstraint[];
  readonly decisions?: readonly DSLDecision[];
  readonly evolution?: DSLEvolution;
}

export interface DSLProject {
  readonly name: string;
  readonly intent: DSLProjectIntent;
}

export interface DSLProjectIntent {
  readonly purpose: readonly string[];
  readonly scale?: {
    readonly users?: number;
    readonly peakQps?: number;
  };
  readonly requirements?: {
    readonly consistency?: string;
    readonly availability?: string;
    readonly latencyMs?: number;
  };
}

export interface DSLDomain {
  readonly entities: readonly DSLEntity[];
}

export interface DSLEntity {
  readonly name: string;
  readonly description?: string;
  readonly fields: readonly DSLField[];
}

export interface DSLField {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly description?: string;
}

export interface DSLArchitecture {
  readonly components: readonly DSLComponent[];
  readonly connections?: readonly DSLConnection[];
}

export interface DSLComponent {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly description?: string;
  readonly capabilities?: readonly string[];
  readonly limitations?: readonly string[];
  readonly contracts?: readonly DSLContract[];
}

export interface DSLContract {
  readonly name: string;
  readonly protocol: string;
  readonly inputs?: readonly DSLField[];
  readonly outputs?: readonly DSLField[];
}

export interface DSLConnection {
  readonly id?: string;
  readonly from: string;
  readonly to: string;
  readonly protocol: string;
  readonly description?: string;
}

export interface DSLConstraint {
  readonly type: string;
  readonly value?: string | number | boolean | null;
  readonly description: string;
}

export interface DSLDecision {
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly rationale: string;
  readonly alternatives?: readonly string[];
}

export interface DSLEvolution {
  readonly phases: readonly DSLEvolutionPhase[];
}

export interface DSLEvolutionPhase {
  readonly name: string;
  readonly description?: string;
  readonly changes: readonly string[];
}

/**
 * Runtime validation for the external DSL shape.
 * It is intentionally handwritten for v0.1 so parser errors can use the same
 * field paths that humans see in YAML.
 */
export function validateDSLDocument(value: unknown): DSLDocument {
  const issues: string[] = [];
  const document = asRecord(value, "document", issues);

  if (document !== undefined) {
    requireString(document.version, "version", issues);
    validateProject(document.project, issues);
    validateDomain(document.domain, issues);
    validateArchitecture(document.architecture, issues);
    validateOptionalArray(document.constraints, "constraints", issues, validateConstraint);
    validateOptionalArray(document.decisions, "decisions", issues, validateDecision);
    validateEvolution(document.evolution, issues);
  }

  if (issues.length > 0) {
    throw new ArchitectureDSLError(issues);
  }

  return value as DSLDocument;
}

function validateProject(value: unknown, issues: string[]): void {
  const project = asRecord(value, "project", issues);
  if (project === undefined) {
    return;
  }

  requireString(project.name, "project.name", issues);

  const intent = asRecord(project.intent, "project.intent", issues);
  if (intent === undefined) {
    return;
  }

  requireStringArray(intent.purpose, "project.intent.purpose", issues);
  validateOptionalRecord(intent.scale, "project.intent.scale", issues, (scale) => {
    optionalNumber(scale.users, "project.intent.scale.users", issues);
    optionalNumber(scale.peakQps ?? scale.peak_qps, "project.intent.scale.peakQps", issues);
  });
  validateOptionalRecord(intent.requirements, "project.intent.requirements", issues, (requirements) => {
    optionalString(requirements.consistency, "project.intent.requirements.consistency", issues);
    optionalString(requirements.availability, "project.intent.requirements.availability", issues);
    optionalNumber(requirements.latencyMs ?? requirements.latency_ms, "project.intent.requirements.latencyMs", issues);
  });
}

function validateDomain(value: unknown, issues: string[]): void {
  const domain = asRecord(value, "domain", issues);
  if (domain === undefined) {
    return;
  }

  validateRequiredArray(domain.entities, "domain.entities", issues, validateEntity);
}

function validateEntity(value: unknown, path: string, issues: string[]): void {
  const entity = asRecord(value, path, issues);
  if (entity === undefined) {
    return;
  }

  requireString(entity.name, `${path}.name`, issues);
  optionalString(entity.description, `${path}.description`, issues);
  validateRequiredArray(entity.fields, `${path}.fields`, issues, validateField);
}

function validateField(value: unknown, path: string, issues: string[]): void {
  const field = asRecord(value, path, issues);
  if (field === undefined) {
    return;
  }

  requireString(field.name, `${path}.name`, issues);
  requireString(field.type, `${path}.type`, issues);
  optionalBoolean(field.required, `${path}.required`, issues);
  optionalString(field.description, `${path}.description`, issues);
}

function validateArchitecture(value: unknown, issues: string[]): void {
  const architecture = asRecord(value, "architecture", issues);
  if (architecture === undefined) {
    return;
  }

  validateRequiredArray(architecture.components, "architecture.components", issues, validateComponent);
  validateOptionalArray(architecture.connections, "architecture.connections", issues, validateConnection);
}

function validateComponent(value: unknown, path: string, issues: string[]): void {
  const component = asRecord(value, path, issues);
  if (component === undefined) {
    return;
  }

  requireString(component.id, `${path}.id`, issues);
  requireString(component.name, `${path}.name`, issues);
  requireString(component.type, `${path}.type`, issues);
  optionalString(component.description, `${path}.description`, issues);
  optionalStringArray(component.capabilities, `${path}.capabilities`, issues);
  optionalStringArray(component.limitations, `${path}.limitations`, issues);
  validateOptionalArray(component.contracts, `${path}.contracts`, issues, validateContract);
}

function validateContract(value: unknown, path: string, issues: string[]): void {
  const contract = asRecord(value, path, issues);
  if (contract === undefined) {
    return;
  }

  requireString(contract.name, `${path}.name`, issues);
  requireString(contract.protocol, `${path}.protocol`, issues);
  validateOptionalArray(contract.inputs, `${path}.inputs`, issues, validateField);
  validateOptionalArray(contract.outputs, `${path}.outputs`, issues, validateField);
}

function validateConnection(value: unknown, path: string, issues: string[]): void {
  const connection = asRecord(value, path, issues);
  if (connection === undefined) {
    return;
  }

  optionalString(connection.id, `${path}.id`, issues);
  requireString(connection.from, `${path}.from`, issues);
  requireString(connection.to, `${path}.to`, issues);
  requireString(connection.protocol, `${path}.protocol`, issues);
  optionalString(connection.description, `${path}.description`, issues);
}

function validateConstraint(value: unknown, path: string, issues: string[]): void {
  const constraint = asRecord(value, path, issues);
  if (constraint === undefined) {
    return;
  }

  requireString(constraint.type, `${path}.type`, issues);
  requireString(constraint.description, `${path}.description`, issues);
}

function validateDecision(value: unknown, path: string, issues: string[]): void {
  const decision = asRecord(value, path, issues);
  if (decision === undefined) {
    return;
  }

  requireString(decision.title, `${path}.title`, issues);
  requireString(decision.context, `${path}.context`, issues);
  requireString(decision.decision, `${path}.decision`, issues);
  requireString(decision.rationale, `${path}.rationale`, issues);
  optionalStringArray(decision.alternatives, `${path}.alternatives`, issues);
}

function validateEvolution(value: unknown, issues: string[]): void {
  if (value === undefined) {
    return;
  }

  const evolution = asRecord(value, "evolution", issues);
  if (evolution === undefined) {
    return;
  }

  validateRequiredArray(evolution.phases, "evolution.phases", issues, (phaseValue, path, phaseIssues) => {
    const phase = asRecord(phaseValue, path, phaseIssues);
    if (phase === undefined) {
      return;
    }

    requireString(phase.name, `${path}.name`, phaseIssues);
    optionalString(phase.description, `${path}.description`, phaseIssues);
    requireStringArray(phase.changes, `${path}.changes`, phaseIssues);
  });
}

export function asRecord(value: unknown, path: string, issues: string[]): UnknownRecord | undefined {
  if (value === undefined) {
    issues.push(formatMissingField(path));
    return undefined;
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    issues.push(formatInvalidField(path, "object"));
    return undefined;
  }

  return value as UnknownRecord;
}

function validateOptionalRecord(
  value: unknown,
  path: string,
  issues: string[],
  validate: (record: UnknownRecord) => void
): void {
  if (value === undefined) {
    return;
  }

  const record = asRecord(value, path, issues);
  if (record !== undefined) {
    validate(record);
  }
}

function validateRequiredArray(
  value: unknown,
  path: string,
  issues: string[],
  validate: (entry: unknown, entryPath: string, issues: string[]) => void
): void {
  if (value === undefined) {
    issues.push(formatMissingField(path));
    return;
  }

  validateOptionalArray(value, path, issues, validate);
}

function validateOptionalArray(
  value: unknown,
  path: string,
  issues: string[],
  validate: (entry: unknown, entryPath: string, issues: string[]) => void
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    issues.push(formatInvalidField(path, "array"));
    return;
  }

  value.forEach((entry, index) => validate(entry, `${path}[${index}]`, issues));
}

function requireString(value: unknown, path: string, issues: string[]): void {
  if (value === undefined) {
    issues.push(formatMissingField(path));
    return;
  }

  optionalString(value, path, issues);
}

function optionalString(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && typeof value !== "string") {
    issues.push(formatInvalidField(path, "string"));
  }
}

function optionalNumber(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && typeof value !== "number") {
    issues.push(formatInvalidField(path, "number"));
  }
}

function optionalBoolean(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && typeof value !== "boolean") {
    issues.push(formatInvalidField(path, "boolean"));
  }
}

function requireStringArray(value: unknown, path: string, issues: string[]): void {
  if (value === undefined) {
    issues.push(formatMissingField(path));
    return;
  }

  optionalStringArray(value, path, issues);
}

function optionalStringArray(value: unknown, path: string, issues: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    issues.push(formatInvalidField(path, "array"));
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      issues.push(formatInvalidField(`${path}[${index}]`, "string"));
    }
  });
}
