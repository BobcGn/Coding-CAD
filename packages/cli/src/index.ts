#!/usr/bin/env node

import { ArchitectureDSLError } from "@coding-cad/architecture-dsl";
import { runDesign } from "./commands/design.js";
import { runFormat } from "./commands/format.js";
import { runInspect } from "./commands/inspect.js";
import { runValidate, type CommandResult } from "./commands/validate.js";
import { CliFileError } from "./utils/files.js";

const helpText = `Coding CAD CLI

Usage:
  coding-cad design <requirement> [--json|--yaml|--format yaml|--format json]
  coding-cad validate <architecture.yaml> [--json]
  coding-cad inspect <architecture.yaml> [--json]
  coding-cad format <architecture.yaml>
  coding-cad --help

Commands:
  design    Generate Architecture IR from a user requirement.
  validate  Parse DSL and run architecture validation.
  inspect   Print architecture components and connections.
  format    Print canonical Architecture DSL YAML.
`;

export async function runCli(args: readonly string[]): Promise<CommandResult> {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      output: helpText.trimEnd(),
      exitCode: 0
    };
  }

  if (command === "design") {
    const options = parseOutputOptions(rest);
    const requirement = options.positional.join(" ").trim();

    if (requirement.length === 0) {
      return {
        output: `Missing requirement.\n\n${helpText.trimEnd()}`,
        exitCode: 1
      };
    }

    return runDesign(requirement, {
      json: options.format === "json",
      yaml: options.format === "yaml"
    });
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

interface OutputOptions {
  readonly format: "console" | "json" | "yaml";
  readonly positional: readonly string[];
}

function parseOutputOptions(args: readonly string[]): OutputOptions {
  let format: OutputOptions["format"] = "console";
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      format = "json";
      continue;
    }

    if (arg === "--yaml") {
      format = "yaml";
      continue;
    }

    if (arg === "--format") {
      const requestedFormat = args[index + 1];
      if (requestedFormat === "json" || requestedFormat === "yaml") {
        format = requestedFormat;
        index += 1;
        continue;
      }
    }

    if (arg !== undefined) {
      positional.push(arg);
    }
  }

  return { format, positional };
}

async function main(): Promise<void> {
  try {
    const result = await runCli(process.argv.slice(2));
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

void main();
