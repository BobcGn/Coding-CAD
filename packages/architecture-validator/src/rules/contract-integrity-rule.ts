import type { ValidationIssue } from "../issue.js";
import type { ValidationRule } from "../rule.js";

const protocols = new Set(["REST", "RPC", "EVENT", "SQL", "MESSAGE"]);

/** Structural checks for existing IR contracts, not runtime implementation proof. */
export const contractIntegrityRule: ValidationRule = {
  id: "contract.integrity",
  name: "Contract Integrity",
  description: "Checks names, protocols and schema field integrity of existing IR contracts.",
  validate({ project }) {
    const issues: ValidationIssue[] = [];
    for (const component of project.architecture.components) {
      const names = new Set<string>();
      for (const [index, contract] of (component.contracts ?? []).entries()) {
        const problems: string[] = [];
        if (!contract.name.trim()) problems.push("Contract name must not be empty.");
        if (names.has(contract.name)) problems.push("Contract names must be unique within a component.");
        names.add(contract.name);
        if (!protocols.has(contract.protocol)) problems.push("Contract protocol must be REST, RPC, EVENT, SQL, or MESSAGE.");
        for (const schema of [...(contract.inputs ?? []), ...(contract.outputs ?? [])]) {
          if (!schema.name.trim()) problems.push("Schema name must not be empty.");
          const fields = new Set<string>();
          for (const field of schema.fields ?? []) {
            if (!field.name.trim() || !field.type.trim()) problems.push("Schema fields require a name and type.");
            if (fields.has(field.name)) problems.push("Schema field names must be unique.");
            fields.add(field.name);
          }
        }
        if (problems.length > 0) issues.push({
          id: `contract.integrity.${component.id}.${index}`,
          severity: "ERROR", title: `Invalid contract on ${component.id}: ${contract.name || "(empty)"}`,
          description: problems.join(" "), affectedComponent: component.id,
          suggestion: "Correct the contract before requesting approval."
        });
      }
    }
    return issues;
  }
};
