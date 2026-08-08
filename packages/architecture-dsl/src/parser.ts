import type {
  ArchitectureProject,
  Component,
  ComponentType,
  CommunicationProtocol,
  Connection,
  ConsistencyLevel,
  Constraint,
  ConstraintType,
  Contract,
  DataSchema,
  DomainEntity,
  DomainField,
  ArchitectureDecision,
  ProjectIntent
} from "@coding-cad/architecture-ir";
import { parseYamlDocument } from "./serializer.js";
import {
  validateDSLDocument,
  type DSLComponent,
  type DSLConnection,
  type DSLConstraint,
  type DSLContract,
  type DSLDecision,
  type DSLDocument,
  type DSLEntity,
  type DSLField
} from "./schema.js";

export function parseDSL(yaml: string): ArchitectureProject {
  const document = validateDSLDocument(parseYamlDocument(yaml));

  return compact<ArchitectureProject>({
    version: document.version,
    intent: parseProjectIntent(document),
    domain: {
      entities: document.domain.entities.map(parseEntity)
    },
    architecture: {
      components: document.architecture.components.map(parseComponent),
      connections: (document.architecture.connections ?? []).map(parseConnection)
    },
    constraints: (document.constraints ?? []).map(parseConstraint),
    decisions: (document.decisions ?? []).map(parseDecision),
    evolution: document.evolution === undefined
      ? undefined
      : {
        phases: document.evolution.phases.map((phase) => ({
          name: phase.name,
          description: phase.description ?? phase.name,
          changes: phase.changes
        }))
      }
  });
}

function parseProjectIntent(document: DSLDocument): ProjectIntent {
  return compact<ProjectIntent>({
    name: document.project.name,
    purpose: document.project.intent.purpose,
    scale: document.project.intent.scale === undefined ? undefined : compact({
      users: document.project.intent.scale.users,
      peakQps: document.project.intent.scale.peakQps
    }),
    requirements: document.project.intent.requirements === undefined ? undefined : compact({
      consistency: document.project.intent.requirements.consistency as ConsistencyLevel | undefined,
      availability: document.project.intent.requirements.availability,
      latencyMs: document.project.intent.requirements.latencyMs
    })
  });
}

function parseEntity(entity: DSLEntity): DomainEntity {
  return compact<DomainEntity>({
    name: entity.name,
    description: entity.description,
    fields: entity.fields.map(parseDomainField)
  });
}

function parseDomainField(field: DSLField): DomainField {
  return compact<DomainField>({
    name: field.name,
    type: field.type,
    required: field.required,
    description: field.description
  });
}

function parseComponent(component: DSLComponent): Component {
  return compact<Component>({
    id: component.id,
    name: component.name,
    type: component.type as ComponentType,
    description: component.description,
    capabilities: component.capabilities ?? [],
    limitations: component.limitations,
    contracts: component.contracts?.map(parseContract)
  });
}

function parseContract(contract: DSLContract): Contract {
  return compact<Contract>({
    name: contract.name,
    protocol: contract.protocol as CommunicationProtocol,
    inputs: fieldsToSchema(`${contract.name}Input`, contract.inputs),
    outputs: fieldsToSchema(`${contract.name}Output`, contract.outputs)
  });
}

function fieldsToSchema(name: string, fields: readonly DSLField[] | undefined): readonly DataSchema[] | undefined {
  if (fields === undefined) {
    return undefined;
  }

  return [
    {
      name,
      fields: fields.map((field) => compact({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description
      }))
    }
  ];
}

function parseConnection(connection: DSLConnection): Connection {
  return compact<Connection>({
    id: connection.id ?? `${connection.from}__to__${connection.to}`,
    from: connection.from,
    to: connection.to,
    protocol: connection.protocol,
    description: connection.description
  });
}

function parseConstraint(constraint: DSLConstraint): Constraint {
  return compact<Constraint>({
    type: constraint.type as ConstraintType,
    value: constraint.value,
    description: constraint.description
  });
}

function parseDecision(decision: DSLDecision): ArchitectureDecision {
  return compact<ArchitectureDecision>({
    title: decision.title,
    context: decision.context,
    decision: decision.decision,
    alternatives: decision.alternatives,
    rationale: decision.rationale
  });
}

function compact<T extends object>(value: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}
