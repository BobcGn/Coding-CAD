import { parseDSL } from "@coding-cad/architecture-dsl";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { ConsoleValidationReporter } from "../output/console.js";
import { reportValidationJson } from "../output/json.js";
import { readTextFile } from "../utils/files.js";

export interface CommandResult {
  readonly output: string;
  readonly exitCode: number;
}

export interface ValidateOptions {
  readonly json?: boolean;
}

export function runValidate(path: string, options: ValidateOptions = {}): CommandResult {
  const project = parseDSL(readTextFile(path));
  const result = new ArchitectureValidator().validate(project);
  const output = options.json
    ? reportValidationJson(result)
    : new ConsoleValidationReporter(project).report(result);

  return {
    output,
    exitCode: result.valid ? 0 : 1
  };
}
