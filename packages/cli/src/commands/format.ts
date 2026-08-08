import { generateDSL, parseDSL } from "@coding-cad/architecture-dsl";
import { readTextFile } from "../utils/files.js";
import type { CommandResult } from "./validate.js";

export function runFormat(path: string): CommandResult {
  return {
    output: generateDSL(parseDSL(readTextFile(path))),
    exitCode: 0
  };
}
