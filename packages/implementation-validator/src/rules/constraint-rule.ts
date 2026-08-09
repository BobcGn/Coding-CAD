import type { Component } from "@coding-cad/architecture-ir";
import type { ComplianceIssue, ComplianceRule } from "../types.js";
import { findActualComponent, normalize } from "./matching.js";

export const componentConstraintRule: ComplianceRule = {
  id: "component-capability-constraint",
  name: "Component Capability Constraint Rule",
  description: "Checks detected usage against approved component limitations and Blueprint limitations.",
  validate(context): readonly ComplianceIssue[] {
    const issues = context.architecture.architecture.components.flatMap((expected) => {
      const actual = findActualComponent(expected, context.implementation);
      if (actual === undefined) return [];
      return (expected.limitations ?? []).flatMap((limitation) =>
        violatesLimitation(actual, limitation)
          ? [limitationIssue(expected, actual, limitation)]
          : []
      );
    });

    const blueprintIssues = (context.blueprint?.constraints ?? []).flatMap((constraint) => {
      if (constraint.source !== "component-limitation" || !describesPrimaryStorageLimit(constraint.description)) {
        return [];
      }
      const componentId = constraint.sourceReference?.split(":", 1)[0];
      const actual = componentId === undefined
        ? undefined
        : context.implementation.architecture.architecture.components.find((component) => component.id === componentId);
      if (actual === undefined || !isPrimaryStorage(actual)) return [];
      return [limitationIssue(actual, actual, constraint.description)];
    });

    return dedupeIssues([...issues, ...blueprintIssues]);
  }
};

function violatesLimitation(actual: Component, limitation: string): boolean {
  const normalized = normalize(limitation);
  if (describesPrimaryStorageLimit(limitation) && isPrimaryStorage(actual)) return true;
  if (normalized.startsWith("not")) {
    const prohibited = normalized.slice(3);
    return actual.capabilities.some((capability) => normalize(capability) === prohibited);
  }
  return false;
}

function describesPrimaryStorageLimit(value: string): boolean {
  const normalized = normalize(value);
  return normalized.includes("notprimarystorage")
    || normalized.includes("cacheonly")
    || normalized.includes("notsourceoftruth")
    || normalized.includes("cannotbesourceoftruth");
}

function isPrimaryStorage(component: Component): boolean {
  const indicators = [
    ...component.capabilities,
    component.logicalRole,
    ...(component.tags ?? [])
  ].filter((value): value is string => value !== undefined).map(normalize);
  return indicators.some((indicator) =>
    indicator.includes("primarystorage")
    || indicator.includes("sourceoftruth")
    || indicator.includes("authoritativestorage")
  );
}

function limitationIssue(expected: Component, actual: Component, limitation: string): ComplianceIssue {
  return {
    id: `constraint.violation.${expected.id}.${normalize(limitation)}`,
    severity: "ERROR",
    title: `${expected.name} usage violates component limitation`,
    description: `Detected usage of '${actual.name}' conflicts with the approved limitation '${limitation}'.`,
    architectureExpectation: `Architecture requires '${expected.name}' to respect limitation: ${limitation}.`,
    implementationEvidence: `Implementation Analyzer classified '${actual.name}' as '${actual.logicalRole ?? actual.capabilities.join(", ")}'.`,
    recommendation: `Remove authoritative storage responsibility from '${actual.name}' or approve an architecture change.`
  };
}

function dedupeIssues(issues: readonly ComplianceIssue[]): readonly ComplianceIssue[] {
  return [...new Map(issues.map((issue) => [issue.id, issue])).values()];
}
