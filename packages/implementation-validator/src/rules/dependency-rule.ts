import type { Component, Connection } from "@coding-cad/architecture-ir";
import type { ComplianceIssue, ComplianceRule, ImplementationModel } from "../types.js";
import { findExpectedComponent } from "./matching.js";

interface ObservedConnection {
  readonly from: string;
  readonly to: string;
  readonly evidence: string;
}

export const dependencyComplianceRule: ComplianceRule = {
  id: "dependency-compliance",
  name: "Dependency Compliance Rule",
  description: "Checks detected implementation dependencies against approved architecture connections.",
  validate(context): readonly ComplianceIssue[] {
    const expectedComponents = context.architecture.architecture.components;
    const expectedConnections = context.architecture.architecture.connections;
    const observed = observedConnections(context.implementation);
    const actualComponents = context.implementation.architecture.architecture.components;
    const canonicalObserved = observed.map((connection) => ({
      connection,
      from: canonicalComponentId(connection.from, actualComponents, expectedComponents),
      to: canonicalComponentId(connection.to, actualComponents, expectedComponents)
    }));
    const expectedPairs = new Set(expectedConnections.map(connectionKey));
    const observedPairs = new Set(canonicalObserved.map((value) => `${value.from}->${value.to}`));
    const issues: ComplianceIssue[] = [];

    for (const value of canonicalObserved) {
      const key = `${value.from}->${value.to}`;
      if (expectedPairs.has(key)) continue;
      issues.push({
        id: `dependency.unapproved.${value.from}.${value.to}`,
        severity: "WARNING",
        title: `Unapproved dependency: ${value.from} -> ${value.to}`,
        description: "Implementation Analyzer detected a dependency that is absent from the approved architecture graph.",
        architectureExpectation: `Approved architecture has no connection from '${value.from}' to '${value.to}'.`,
        implementationEvidence: value.connection.evidence,
        recommendation: "Remove or route the dependency through an approved boundary, or submit an Architecture Review proposal."
      });
    }

    for (const expected of expectedConnections) {
      const key = connectionKey(expected);
      if (observedPairs.has(key)) continue;
      issues.push({
        id: `dependency.missing.${expected.id}`,
        severity: "WARNING",
        title: `Required dependency not detected: ${expected.from} -> ${expected.to}`,
        description: "The approved architecture connection was not present in Analyzer dependency evidence.",
        architectureExpectation: `Architecture requires connection '${expected.id}' from '${expected.from}' to '${expected.to}'.`,
        implementationEvidence: observed.length === 0
          ? "Implementation Analyzer detected no dependencies."
          : `Detected dependencies: ${observed.map((value) => `${value.from} -> ${value.to}`).join(", ")}.`,
        recommendation: "Implement the approved dependency or review whether the architecture connection is still required."
      });
    }

    return dedupeIssues(issues);
  }
};

function observedConnections(implementation: ImplementationModel): readonly ObservedConnection[] {
  const architectureConnections = implementation.architecture.architecture.connections.map((connection) => ({
    from: connection.from,
    to: connection.to,
    evidence: connection.description ?? `Analyzer Architecture IR contains connection '${connection.id}'.`
  }));
  const graphConnections = implementation.dependencyGraph.moduleDependencies.map((connection) => ({
    from: connection.fromModuleId,
    to: connection.toModuleId,
    evidence: connection.evidence
  }));
  return dedupeObserved([...architectureConnections, ...graphConnections]);
}

function canonicalComponentId(
  componentId: string,
  actualComponents: readonly Component[],
  expectedComponents: readonly Component[]
): string {
  const actual = actualComponents.find((component) => component.id === componentId);
  if (actual === undefined) return componentId;
  return findExpectedComponent(actual, expectedComponents)?.id ?? componentId;
}

function connectionKey(connection: Connection): string {
  return `${connection.from}->${connection.to}`;
}

function dedupeObserved(connections: readonly ObservedConnection[]): readonly ObservedConnection[] {
  return [...new Map(connections.map((value) => [`${value.from}->${value.to}`, value])).values()];
}

function dedupeIssues(issues: readonly ComplianceIssue[]): readonly ComplianceIssue[] {
  return [...new Map(issues.map((issue) => [issue.id, issue])).values()];
}
