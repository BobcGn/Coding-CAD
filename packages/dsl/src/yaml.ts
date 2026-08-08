import { parse, stringify } from "yaml";
import type {
  ArchitectureGraph,
  ArchitectureIR,
  Component,
  ComponentInterface,
  Connection,
  DomainEntity,
  DomainField,
  DomainModel,
  EvolutionChange,
  EvolutionPlan,
  ProjectIntent,
  ProjectRequirements,
  ProjectScale,
  TechnologyBinding
} from "@coding-cad/architecture-ir";

type UnknownRecord = Record<string, unknown>;

/**
 * Parses the human-authored YAML projection into the canonical ArchitectureIR.
 * The parser accepts a small amount of YAML-friendly sugar, but the return
 * value must stay normalized so validators and Agents do not need DSL knowledge.
 */
export function parseArchitectureYaml(source: string): ArchitectureIR {
  const raw = parse(source) as unknown;
  const record = asRecord(raw, "DSL document");

  return compact<ArchitectureIR>({
    schemaVersion: asOptionalString(record.schemaVersion) ?? "0.1",
    project: parseProject(asRecord(record.project, "project")),
    domain: record.domain === undefined ? undefined : parseDomain(asRecord(record.domain, "domain")),
    architecture: parseArchitecture(asRecord(record.architecture, "architecture")),
    technologyBindings: parseTechnologyBindings(record.technologyBindings ?? record.technology_bindings),
    constraints: asOptionalArray(record.constraints) as ArchitectureIR["constraints"],
    decisions: asOptionalArray(record.decisions) as ArchitectureIR["decisions"],
    evolution: record.evolution === undefined ? undefined : parseEvolution(asRecord(record.evolution, "evolution")),
    metadata: asOptionalRecord(record.metadata) as ArchitectureIR["metadata"]
  });
}

export function stringifyArchitectureYaml(ir: ArchitectureIR): string {
  return stringify(ir, {
    aliasDuplicateObjects: false,
    lineWidth: 100
  });
}

function parseProject(record: UnknownRecord): ProjectIntent {
  return compact<ProjectIntent>({
    name: requiredString(record.name, "project.name"),
    mission: asOptionalString(record.mission),
    scale: parseScale(asOptionalRecord(record.scale)),
    requirements: normalizeRequirements(asOptionalRecord(record.requirements)),
    stakeholders: asOptionalStringArray(record.stakeholders),
    nonGoals: asOptionalStringArray(record.nonGoals ?? record.non_goals)
  });
}

function parseScale(record: UnknownRecord | undefined): ProjectScale | undefined {
  if (record === undefined) {
    return undefined;
  }

  return compact<ProjectScale>({
    users: asOptionalNumber(record.users),
    peakQps: asOptionalNumber(record.peakQps ?? record.peak_qps),
    dataVolumeGb: asOptionalNumber(record.dataVolumeGb ?? record.data_volume_gb),
    availabilityTarget: asOptionalString(record.availabilityTarget ?? record.availability_target)
  });
}

function normalizeRequirements(record: UnknownRecord | undefined): ProjectRequirements | undefined {
  if (record === undefined) {
    return undefined;
  }

  return compact<ProjectRequirements>({
    consistency: asOptionalString(record.consistency) as ProjectRequirements["consistency"],
    latencyMsP95: asOptionalNumber(record.latencyMsP95 ?? record.latency_ms_p95),
    compliance: asOptionalStringArray(record.compliance),
    deployment: asOptionalStringArray(record.deployment),
    extensibility: asOptionalString(record.extensibility) as ProjectRequirements["extensibility"]
  });
}

function parseDomain(record: UnknownRecord): DomainModel {
  return compact<DomainModel>({
    boundedContexts: asOptionalArray(record.boundedContexts ?? record.bounded_contexts) as DomainModel["boundedContexts"],
    entities: parseEntities(record.entities),
    valueObjects: asOptionalArray(record.valueObjects ?? record.value_objects) as DomainModel["valueObjects"],
    events: asOptionalArray(record.events) as DomainModel["events"]
  });
}

function parseEntities(value: unknown): readonly DomainEntity[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => parseEntity(asRecord(item, `domain.entities[${index}]`)));
  }

  // Object form keeps YAML concise; the object key becomes the default id/name.
  return Object.entries(asRecord(value, "domain.entities")).map(([name, item]) => {
    const record = asRecord(item, `domain.entities.${name}`);
    return parseEntity({ ...record, name: record.name ?? name, id: record.id ?? name });
  });
}

function parseEntity(record: UnknownRecord): DomainEntity {
  return compact<DomainEntity>({
    id: requiredString(record.id, "entity.id"),
    name: requiredString(record.name, "entity.name"),
    contextId: asOptionalString(record.contextId ?? record.context_id),
    fields: parseFields(record.fields),
    invariants: asOptionalStringArray(record.invariants)
  });
}

function parseFields(value: unknown): readonly DomainField[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => parseField(asRecord(item, `fields[${index}]`)));
  }

  return Object.entries(asRecord(value, "fields")).map(([name, item]) => {
    const record = asRecord(item, `fields.${name}`);
    return compact<DomainField>({
      name,
      type: requiredString(record.type, `fields.${name}.type`),
      required: asOptionalBoolean(record.required),
      description: asOptionalString(record.description)
    });
  });
}

function parseField(record: UnknownRecord): DomainField {
  return compact<DomainField>({
    name: requiredString(record.name, "field.name"),
    type: requiredString(record.type, "field.type"),
    required: asOptionalBoolean(record.required),
    description: asOptionalString(record.description)
  });
}

function parseArchitecture(record: UnknownRecord): ArchitectureGraph {
  return compact<ArchitectureGraph>({
    components: parseComponents(record.components),
    connections: parseConnections(record.connections)
  });
}

function parseComponents(value: unknown): readonly Component[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => parseComponent(asRecord(item, `architecture.components[${index}]`)));
  }

  // Component maps are the preferred authoring form because they make references stable.
  return Object.entries(asRecord(value, "architecture.components")).map(([name, item]) => {
    const record = asRecord(item, `architecture.components.${name}`);
    return parseComponent({ ...record, name: record.name ?? name, id: record.id ?? name });
  });
}

function parseComponent(record: UnknownRecord): Component {
  return compact<Component>({
    id: requiredString(record.id, "component.id"),
    name: requiredString(record.name, "component.name"),
    kind: requiredString(record.kind ?? record.type, "component.kind") as Component["kind"],
    purpose: asOptionalString(record.purpose),
    capabilities: asStringArray(record.capabilities ?? []),
    limitations: asOptionalStringArray(record.limitations),
    interfaces: parseInterfaces(record.interfaces),
    contract: asOptionalRecord(record.contract) as Component["contract"],
    logicalRole: asOptionalString(record.logicalRole ?? record.logical_role),
    technology: asOptionalString(record.technology),
    tags: asOptionalStringArray(record.tags)
  });
}

function parseInterfaces(value: unknown): readonly ComponentInterface[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => parseInterface(asRecord(item, `interfaces[${index}]`)));
  }

  return Object.entries(asRecord(value, "interfaces")).map(([name, item]) => ({
    ...parseInterface({
      ...asRecord(item, `interfaces.${name}`),
      id: asOptionalString(asRecord(item, `interfaces.${name}`).id) ?? name,
      name
    })
  }));
}

function parseInterface(record: UnknownRecord): ComponentInterface {
  return compact<ComponentInterface>({
    id: requiredString(record.id, "interface.id"),
    name: requiredString(record.name, "interface.name"),
    direction: (asOptionalString(record.direction) ?? "provided") as ComponentInterface["direction"],
    protocol: asOptionalString(record.protocol),
    contract: asOptionalString(record.contract)
  });
}

function parseConnections(value: unknown): readonly Connection[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return asArray(value, "architecture.connections").map((item, index) => {
    const record = asRecord(item, `architecture.connections[${index}]`);
    return compact<Connection>({
      id: asOptionalString(record.id) ?? `${requiredString(record.from, "connection.from")}__to__${requiredString(record.to, "connection.to")}`,
      from: requiredString(record.from, "connection.from"),
      to: requiredString(record.to, "connection.to"),
      protocol: requiredString(record.protocol, "connection.protocol"),
      purpose: asOptionalString(record.purpose),
      mode: asOptionalString(record.mode) as Connection["mode"],
      data: asOptionalStringArray(record.data),
      constraints: asOptionalStringArray(record.constraints)
    });
  });
}

function parseTechnologyBindings(value: unknown): readonly TechnologyBinding[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return asArray(value, "technologyBindings").map((item, index) => {
    const record = asRecord(item, `technologyBindings[${index}]`);
    return compact<TechnologyBinding>({
      id: asOptionalString(record.id) ?? `${requiredString(record.logicalRole ?? record.logical_role, "technologyBindings.logicalRole")}__${requiredString(record.technology, "technologyBindings.technology")}`,
      logicalRole: requiredString(record.logicalRole ?? record.logical_role, "technologyBindings.logicalRole"),
      technology: requiredString(record.technology, "technologyBindings.technology"),
      componentId: asOptionalString(record.componentId ?? record.component_id),
      rationale: asOptionalString(record.rationale),
      alternatives: asOptionalStringArray(record.alternatives),
      phase: asOptionalString(record.phase)
    });
  });
}

function parseEvolution(record: UnknownRecord): EvolutionPlan {
  return {
    phases: asArray(record.phases, "evolution.phases").map((item, index) => {
      const phase = asRecord(item, `evolution.phases[${index}]`);
      return compact({
        id: requiredString(phase.id, "phase.id"),
        name: requiredString(phase.name, "phase.name"),
        trigger: asOptionalString(phase.trigger),
        changes: asArray(phase.changes, "phase.changes").map((change, changeIndex) => parseEvolutionChange(asRecord(change, `phase.changes[${changeIndex}]`))),
        decisions: asOptionalStringArray(phase.decisions)
      });
    })
  };
}

function parseEvolutionChange(record: UnknownRecord): EvolutionChange {
  return {
    type: requiredString(record.type, "evolution.change.type") as EvolutionChange["type"],
    target: requiredString(record.target, "evolution.change.target"),
    description: requiredString(record.description, "evolution.change.description")
  };
}

function asRecord(value: unknown, path: string): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value as UnknownRecord;
}

function asOptionalRecord(value: unknown): UnknownRecord | undefined {
  if (value === undefined) {
    return undefined;
  }

  return asRecord(value, "optional record");
}

function asArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  return value;
}

function asOptionalArray(value: unknown): readonly unknown[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return asArray(value, "optional array");
}

function asStringArray(value: unknown): readonly string[] {
  return asArray(value, "string array").map((item) => {
    if (typeof item !== "string") {
      throw new Error("array item must be a string");
    }

    return item;
  });
}

function asOptionalStringArray(value: unknown): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return asStringArray(value);
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }

  return value;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function compact<T extends object>(value: Record<string, unknown>): T {
  // Omit absent optional fields so stringifyArchitectureYaml does not emit noisy nulls.
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}
