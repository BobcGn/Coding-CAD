import type {
  ArchitectureProject,
  Component,
  Constraint,
  Contract,
  DataSchema,
  DomainEntity
} from "@coding-cad/architecture-ir";
import { stringifyYamlDocument } from "./serializer.js";
import type {
  DSLArchitecture,
  DSLComponent,
  DSLConstraint,
  DSLContract,
  DSLDecision,
  DSLDocument,
  DSLEntity,
  DSLField
} from "./schema.js";

export function generateDSL(project: ArchitectureProject): string {
  return stringifyYamlDocument(toDSLDocument(project));
}

export function toDSLDocument(project: ArchitectureProject): DSLDocument {
  return compact<DSLDocument>({
    version: project.version,
    project: {
      name: project.intent.name,
      intent: compact({
        purpose: project.intent.purpose,
        scale: project.intent.scale === undefined ? undefined : compact({
          users: project.intent.scale.users,
          peakQps: project.intent.scale.peakQps
        }),
        requirements: project.intent.requirements === undefined ? undefined : compact({
          consistency: project.intent.requirements.consistency,
          availability: project.intent.requirements.availability,
          latencyMs: project.intent.requirements.latencyMs
        })
      })
    },
    domain: {
      entities: project.domain.entities.map(entityToDSL)
    },
    architecture: architectureToDSL(project),
    constraints: project.constraints.map(constraintToDSL),
    decisions: project.decisions.map((decision): DSLDecision => compact({
      title: decision.title,
      context: decision.context,
      decision: decision.decision,
      alternatives: decision.alternatives,
      rationale: decision.rationale
    })),
    evolution: project.evolution === undefined
      ? undefined
      : {
        phases: project.evolution.phases.map((phase) => ({
          name: phase.name,
          description: phase.description,
          changes: phase.changes.map((change) => typeof change === "string" ? change : change.description)
        }))
      }
  });
}

function entityToDSL(entity: DomainEntity): DSLEntity {
  return compact<DSLEntity>({
    name: entity.name,
    description: entity.description,
    fields: entity.fields.map(fieldToDSL)
  });
}

function fieldToDSL(field: { readonly name: string; readonly type: string; readonly required?: boolean; readonly description?: string }): DSLField {
  return compact<DSLField>({
    name: field.name,
    type: field.type,
    required: field.required,
    description: field.description
  });
}

function architectureToDSL(project: ArchitectureProject): DSLArchitecture {
  return {
    components: project.architecture.components.map(componentToDSL),
    connections: project.architecture.connections.map((connection) => compact({
      id: connection.id,
      from: connection.from,
      to: connection.to,
      protocol: String(connection.protocol),
      description: connection.description
    }))
  };
}

function componentToDSL(component: Component): DSLComponent {
  return compact<DSLComponent>({
    id: component.id,
    name: component.name,
    type: component.type ?? "service",
    description: component.description,
    capabilities: component.capabilities,
    limitations: component.limitations,
    contracts: component.contracts?.map(contractToDSL)
  });
}

function contractToDSL(contract: Contract): DSLContract {
  return compact<DSLContract>({
    name: contract.name,
    protocol: contract.protocol,
    inputs: schemaToFields(contract.inputs),
    outputs: schemaToFields(contract.outputs)
  });
}

function schemaToFields(schemas: readonly DataSchema[] | undefined): readonly DSLField[] | undefined {
  if (schemas === undefined) {
    return undefined;
  }

  return schemas.flatMap((schema) => (schema.fields ?? []).map(fieldToDSL));
}

function constraintToDSL(constraint: Constraint): DSLConstraint {
  return compact<DSLConstraint>({
    type: constraint.type,
    value: isScalar(constraint.value) ? constraint.value : undefined,
    description: constraint.description
  });
}

function isScalar(value: unknown): value is string | number | boolean | null | undefined {
  return value === undefined || value === null || ["string", "number", "boolean"].includes(typeof value);
}

function compact<T extends object>(value: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}
