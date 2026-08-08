import { parseDSL } from "@coding-cad/architecture-dsl";
import { buildInspectSummary, reportInspectConsole } from "../output/console.js";
import { reportInspectJson } from "../output/json.js";
import { readTextFile } from "../utils/files.js";
import type { CommandResult } from "./validate.js";

export interface InspectOptions {
  readonly json?: boolean;
}

export function runInspect(path: string, options: InspectOptions = {}): CommandResult {
  const project = parseDSL(readTextFile(path));
  const summary = buildInspectSummary(project);

  return {
    output: options.json ? reportInspectJson(summary) : reportInspectConsole(summary),
    exitCode: 0
  };
}
