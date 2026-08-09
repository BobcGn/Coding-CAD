import type { ComplianceIssue, ComplianceRule } from "../types.js";
import { findActualComponent, normalize, technologyName } from "./matching.js";

export const technologyComplianceRule: ComplianceRule = {
  id: "technology-compliance",
  name: "Technology Compliance Rule",
  description: "Checks that detected component technologies match approved architecture choices.",
  validate(context): readonly ComplianceIssue[] {
    return context.architecture.architecture.components.flatMap((expected) => {
      const expectedTechnology = technologyName(expected);
      const actual = findActualComponent(expected, context.implementation);
      const actualTechnology = actual === undefined ? undefined : technologyName(actual);
      if (
        expectedTechnology === undefined
        || actualTechnology === undefined
        || normalize(expectedTechnology) === normalize(actualTechnology)
      ) return [];

      return [{
        id: `technology.deviation.${expected.id}`,
        severity: "WARNING",
        title: `Technology deviation detected for ${expected.name}`,
        description: `Implementation technology '${actualTechnology}' differs from approved architecture technology '${expectedTechnology}'.`,
        architectureExpectation: `Architecture requires ${expectedTechnology} for component '${expected.name}'.`,
        implementationEvidence: `Implementation Analyzer detected ${actualTechnology}. Repository technologies: ${context.implementation.technology.databases.join(", ") || "none"}.`,
        recommendation: `Use ${expectedTechnology}, or document and approve the ${actualTechnology} substitution through Architecture Review.`
      }];
    });
  }
};
