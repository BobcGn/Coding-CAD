import type { ComplianceIssue, ComplianceRule } from "../types.js";
import { findActualComponent } from "./matching.js";

export const componentExistenceRule: ComplianceRule = {
  id: "component-existence",
  name: "Component Existence Rule",
  description: "Checks that every approved architecture component has an implementation counterpart.",
  validate(context): readonly ComplianceIssue[] {
    const detected = context.implementation.architecture.architecture.components;
    return context.architecture.architecture.components.flatMap((expected) => {
      if (findActualComponent(expected, context.implementation) !== undefined) return [];
      return [{
        id: `component.missing.${expected.id}`,
        severity: "ERROR",
        title: `Missing implementation: ${expected.name}`,
        description: `Approved architecture component '${expected.name}' was not detected in the implementation model.`,
        architectureExpectation: `Architecture requires component '${expected.name}' (${expected.id}).`,
        implementationEvidence: detected.length === 0
          ? "Implementation Analyzer detected no components."
          : `Implementation Analyzer detected: ${detected.map((component) => component.name).join(", ")}.`,
        recommendation: `Implement required architecture component '${expected.name}' or approve a new architecture proposal.`
      }];
    });
  }
};
