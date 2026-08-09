import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkspaceData, WorkspaceStorage } from "../workspace.js";

const WORKSPACE_FILE = "workspace.json";

/** JSON file persistence for a local Coding CAD workspace directory. */
export class FileWorkspaceStorage implements WorkspaceStorage {
  readonly filePath: string;

  constructor(readonly directory: string) {
    this.filePath = path.join(directory, WORKSPACE_FILE);
  }

  async exists(): Promise<boolean> {
    try {
      return (await stat(this.filePath)).isFile();
    } catch (error) {
      if (isMissingFile(error)) return false;
      throw error;
    }
  }

  async load(): Promise<WorkspaceData> {
    let source: string;
    try {
      source = await readFile(this.filePath, "utf8");
    } catch (error) {
      if (isMissingFile(error)) {
        throw new Error(`Coding CAD workspace does not exist at ${this.filePath}.`);
      }
      throw error;
    }

    try {
      return JSON.parse(source) as WorkspaceData;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid Coding CAD workspace at ${this.filePath}: ${reason}`);
    }
  }

  async save(data: WorkspaceData): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
