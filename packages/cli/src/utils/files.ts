import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export class CliFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliFileError";
  }
}

export function readTextFile(path: string): string {
  const resolvedPath = resolve(path);

  if (!existsSync(resolvedPath)) {
    throw new CliFileError(`File not found:\n${path}`);
  }

  return readFileSync(resolvedPath, "utf8");
}
