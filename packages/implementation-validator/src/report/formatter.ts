import type { ComplianceReport } from "../types.js";

export function formatComplianceReport(report: ComplianceReport): string {
  const lines = [
    `Implementation Compliance: ${report.passed ? "PASSED" : "FAILED"}`,
    report.summary
  ];
  for (const issue of report.issues) {
    lines.push(
      "",
      `[${issue.severity}] ${issue.title}`,
      issue.description,
      `Architecture expectation: ${issue.architectureExpectation}`,
      `Implementation evidence: ${issue.implementationEvidence}`,
      `Recommendation: ${issue.recommendation}`
    );
  }
  return lines.join("\n");
}
