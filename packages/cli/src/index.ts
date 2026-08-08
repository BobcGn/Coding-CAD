#!/usr/bin/env node

import { ArchitectureDSLError } from "@coding-cad/architecture-dsl";
import { runFormat } from "./commands/format.js";
import { runInspect } from "./commands/inspect.js";
import { runValidate, type CommandResult } from "./commands/validate.js";
import { CliFileError } from "./utils/files.js";

const helpText = `Coding CAD CLI

Usage:
  coding-cad validate <architecture.yaml> [--json]
  coding-cad inspect <architecture.yaml> [--json]
  coding-cad format <architecture.yaml>
  coding-cad --help

Commands:
  validate  Parse DSL and run architecture validation.
  inspect   Print architecture components and connections.
  format    Print canonical Architecture DSL YAML.
`;

export function runCli(args: readonly string[]): CommandResult {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      output: helpText.trimEnd(),
      exitCode: 0
    };
  }

  const json = rest.includes("--json");
  const positional = rest.filter((arg) => arg !== "--json");
  const path = positional[0];

  if (path === undefined) {
    return {
      output: `Missing architecture file.\n\n${helpText.trimEnd()}`,
      exitCode: 1
    };
  }

  switch (command) {
    case "validate":
      return runValidate(path, { json });
    case "inspect":
      return runInspect(path, { json });
    case "format":
      return runFormat(path);
    default:
      return {
        output: `Unknown command: ${command}\n\n${helpText.trimEnd()}`,
        exitCode: 1
      };
  }
}

function main(): void {
  try {
    const result = runCli(process.argv.slice(2));
    writeResult(result);
  } catch (error) {
    const result = handleCliError(error);
    writeResult(result, true);
  }
}

function handleCliError(error: unknown): CommandResult {
  if (error instanceof ArchitectureDSLError || error instanceof CliFileError) {
    return {
      output: error.message,
      exitCode: 1
    };
  }

  return {
    output: error instanceof Error ? error.message : String(error),
    exitCode: 1
  };
}

function writeResult(result: CommandResult, stderr = false): void {
  const stream = stderr ? process.stderr : process.stdout;
  stream.write(result.output.endsWith("\n") ? result.output : `${result.output}\n`);
  process.exitCode = result.exitCode;
}

main();
