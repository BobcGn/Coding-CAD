import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ImplementationAnalyzer } from "@coding-cad/implementation-analyzer";
import { createImplementationModel, isContractIssue, resolveIssueTarget } from "./types.js";
import { ImplementationValidator } from "./validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const expectedFixturePath = path.join(__dirname, "../fixtures/coding-cad-expected.json");
const driftedFixturePath = path.join(__dirname, "../fixtures/coding-cad-drifted.json");

async function runTests() {
  console.log("Running brownfield compliance tests...");

  // Test 1: resolveIssueTarget unit tests
  const missingCompIssue = {
    id: "component.missing.audit-logger",
    severity: "ERROR" as const,
    title: "Missing implementation: AuditLogger",
    description: "",
    architectureExpectation: "",
    implementationEvidence: "",
    recommendation: ""
  };
  const targetComp = resolveIssueTarget(missingCompIssue);
  assert.equal(targetComp?.type, "component");
  assert.equal(targetComp?.targetId, "audit-logger");

  const techDevIssue = {
    id: "technology.undetected.server",
    severity: "WARNING" as const,
    title: "Cannot Verify: Technology undetected for Server",
    description: "",
    architectureExpectation: "",
    implementationEvidence: "",
    recommendation: ""
  };
  const targetTech = resolveIssueTarget(techDevIssue);
  assert.equal(targetTech?.type, "component");
  assert.equal(targetTech?.targetId, "server");

  const unapprovedDepIssue = {
    id: "dependency.unapproved.cli.component-registry",
    severity: "WARNING" as const,
    title: "Unapproved dependency: cli -> component-registry",
    description: "",
    architectureExpectation: "",
    implementationEvidence: "",
    recommendation: ""
  };
  const targetUnapproved = resolveIssueTarget(unapprovedDepIssue);
  assert.equal(targetUnapproved?.type, "connection");
  assert.equal(targetUnapproved?.targetId, "cli->component-registry");
  assert.equal(targetUnapproved?.from, "cli");
  assert.equal(targetUnapproved?.to, "component-registry");

  const missingDepIssue = {
    id: "dependency.missing.web-to-server",
    severity: "WARNING" as const,
    title: "Required dependency not detected",
    description: "",
    architectureExpectation: "",
    implementationEvidence: "",
    recommendation: ""
  };
  const targetMissingDep = resolveIssueTarget(missingDepIssue);
  assert.equal(targetMissingDep?.type, "connection");
  assert.equal(targetMissingDep?.targetId, "web-to-server");
  assert.equal(targetMissingDep?.from, "web");
  assert.equal(targetMissingDep?.to, "server");

  const contractIssue = {
    id: "contract.protocol.server.get-health",
    severity: "ERROR" as const,
    title: "Contract protocol mismatch",
    description: "",
    architectureExpectation: "",
    implementationEvidence: "",
    recommendation: ""
  };
  assert.ok(isContractIssue(contractIssue));
  const targetContract = resolveIssueTarget(contractIssue);
  assert.equal(targetContract?.type, "component");
  assert.equal(targetContract?.targetId, "server");

  // Test 2: Golden expected architecture against Coding-CAD reverse-engineered implementation
  const expectedArchitecture = JSON.parse(fs.readFileSync(expectedFixturePath, "utf8")) as ArchitectureProject;
  const analyzer = new ImplementationAnalyzer();
  const inspection = await analyzer.inspect(repoRoot);
  const actualArchitecture = await analyzer.analyze(repoRoot);
  const implementationModel = createImplementationModel(inspection, actualArchitecture);

  const validator = new ImplementationValidator();
  const goldenReport = validator.validate({
    architecture: expectedArchitecture,
    implementation: implementationModel
  });

  // Structural rules (component, technology, limitation, dependency) must produce 0 issues
  const nonContractIssues = goldenReport.issues.filter((i) => !isContractIssue(i));
  assert.equal(
    nonContractIssues.length,
    0,
    `Golden expected architecture must produce 0 structural issues against Coding-CAD implementation, got: ${JSON.stringify(nonContractIssues)}`
  );

  // Test 3: Drifted expected architecture against Coding-CAD implementation
  const driftedArchitecture = JSON.parse(fs.readFileSync(driftedFixturePath, "utf8")) as ArchitectureProject;
  const driftedReport = validator.validate({
    architecture: driftedArchitecture,
    implementation: implementationModel
  });

  assert.ok(!driftedReport.passed, "Drifted report must not pass");

  // Verify missing component was caught
  assert.ok(
    driftedReport.issues.some((i) => i.id === "component.missing.audit-logger"),
    "Must report missing audit-logger component"
  );

  // Verify undetected technology was caught and marked cannot verify
  assert.ok(
    driftedReport.issues.some((i) => i.id === "technology.undetected.server"),
    "Must report undetected technology for server as cannot verify"
  );

  // Verify missing required dependency was caught
  assert.ok(
    driftedReport.issues.some((i) => i.id === "dependency.missing.web-to-server"),
    "Must report missing web -> server dependency"
  );

  // Verify unapproved dependency was caught (cli -> component-registry removed from drifted expected)
  assert.ok(
    driftedReport.issues.some((i) => i.id === "dependency.unapproved.cli.component-registry"),
    "Must report unapproved cli -> component-registry dependency"
  );

  // Verify contract rule issue is identified as contract issue
  const contractIssues = driftedReport.issues.filter(isContractIssue);
  assert.ok(contractIssues.length > 0, "Must identify contract issues for components defining contracts");

  console.log("brownfield compliance tests passed!");
}

runTests().catch((err) => {
  console.error("brownfield compliance test failed:", err);
  process.exit(1);
});
