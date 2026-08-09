import type { Component, Contract } from "@coding-cad/architecture-ir";
import type { ComplianceIssue, ComplianceRule } from "../types.js";
import { findActualComponent, normalize } from "./matching.js";

export const contractComplianceRule: ComplianceRule = {
  id: "contract-compliance",
  name: "Contract Compliance Rule",
  description: "Checks that required component contracts appear in Analyzer output.",
  validate(context): readonly ComplianceIssue[] {
    return context.architecture.architecture.components.flatMap((expected) => {
      const actual = findActualComponent(expected, context.implementation);
      if (actual === undefined) return [];
      return [
        ...contractIssues(expected, actual),
        ...interfaceIssues(expected, actual)
      ];
    });
  }
};

function contractIssues(expected: Component, actual: Component): ComplianceIssue[] {
  return (expected.contracts ?? []).flatMap((contract) => {
    const detected = (actual.contracts ?? []).find((candidate) =>
      normalize(candidate.name) === normalize(contract.name)
    );
    if (detected === undefined) return [missingContractIssue(expected, actual, contract)];
    if (normalize(detected.protocol) === normalize(contract.protocol)) return [];
    return [{
      id: `contract.protocol.${expected.id}.${normalize(contract.name)}`,
      severity: "ERROR",
      title: `Contract protocol mismatch: ${contract.name}`,
      description: `The implementation exposes '${contract.name}' with ${detected.protocol}, not approved protocol ${contract.protocol}.`,
      architectureExpectation: `Component '${expected.name}' requires contract '${contract.name}' over ${contract.protocol}.`,
      implementationEvidence: `Implementation Analyzer detected '${detected.name}' over ${detected.protocol}.`,
      recommendation: `Implement '${contract.name}' over ${contract.protocol} or approve a contract change.`
    }];
  });
}

function interfaceIssues(expected: Component, actual: Component): ComplianceIssue[] {
  return (expected.interfaces ?? []).flatMap((required) => {
    const detected = (actual.interfaces ?? []).find((candidate) =>
      normalize(candidate.id) === normalize(required.id)
      || normalize(candidate.name) === normalize(required.name)
    );
    if (detected !== undefined) return [];
    return [{
      id: `contract.missing.${expected.id}.${normalize(required.id)}`,
      severity: "ERROR",
      title: `Required interface not implemented: ${required.name}`,
      description: `Approved interface '${required.name}' was not detected on implementation component '${actual.name}'.`,
      architectureExpectation: `Component '${expected.name}' requires interface '${required.name}'.`,
      implementationEvidence: interfaceEvidence(actual),
      recommendation: `Implement required interface '${required.name}' or approve an Architecture IR contract change.`
    }];
  });
}

function missingContractIssue(
  expected: Component,
  actual: Component,
  contract: Contract
): ComplianceIssue {
  return {
    id: `contract.missing.${expected.id}.${normalize(contract.name)}`,
    severity: "ERROR",
    title: `Required contract not implemented: ${contract.name}`,
    description: `Approved contract '${contract.name}' was not detected on implementation component '${actual.name}'.`,
    architectureExpectation: `Component '${expected.name}' requires ${contract.protocol} contract '${contract.name}'.`,
    implementationEvidence: contractEvidence(actual),
    recommendation: `Implement required contract '${contract.name}' or approve an Architecture IR contract change.`
  };
}

function contractEvidence(component: Component): string {
  const contracts = component.contracts ?? [];
  return contracts.length === 0
    ? `Implementation Analyzer detected no contracts on '${component.name}'.`
    : `Implementation Analyzer detected contracts: ${contracts.map((contract) => contract.name).join(", ")}.`;
}

function interfaceEvidence(component: Component): string {
  const interfaces = component.interfaces ?? [];
  return interfaces.length === 0
    ? `Implementation Analyzer detected no interfaces on '${component.name}'.`
    : `Implementation Analyzer detected interfaces: ${interfaces.map((value) => value.name).join(", ")}.`;
}
