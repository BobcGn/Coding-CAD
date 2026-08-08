import { parse, stringify } from "yaml";
import { ArchitectureDSLError } from "./error.js";

export function parseYamlDocument(source: string): unknown {
  try {
    return parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ArchitectureDSLError([`YAML: ${message}`]);
  }
}

export function stringifyYamlDocument(value: unknown): string {
  return stringify(value, {
    aliasDuplicateObjects: false,
    lineWidth: 100,
    sortMapEntries: false
  });
}
