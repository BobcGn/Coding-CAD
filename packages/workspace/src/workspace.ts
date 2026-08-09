import { randomUUID } from "node:crypto";
import type { ArchitectureDecision, ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";
import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import type { AddDecisionOptions, DecisionRecord } from "./decision-record.js";
import { compareArchitectures, type ArchitectureDiff } from "./diff.js";
import type { BlueprintRecord, ValidationRecord } from "./history.js";
import type { ArchitectureSnapshot } from "./snapshot.js";
import { FileWorkspaceStorage } from "./storage/file-storage.js";
import { assertArchitectureVersion, nextArchitectureVersion, type ArchitectureVersion } from "./version.js";

export const WORKSPACE_FORMAT_VERSION = 1;

export interface WorkspaceData {
  readonly formatVersion: typeof WORKSPACE_FORMAT_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly snapshots: readonly ArchitectureSnapshot[];
  readonly decisions: readonly DecisionRecord[];
  readonly validationHistory: readonly ValidationRecord[];
  readonly blueprintHistory: readonly BlueprintRecord[];
}

export interface WorkspaceStorage {
  exists(): Promise<boolean>;
  load(): Promise<WorkspaceData>;
  save(data: WorkspaceData): Promise<void>;
}

export interface WorkspaceOptions {
  readonly clock?: () => Date;
  readonly idGenerator?: () => string;
}

export interface WorkspaceReport {
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
  readonly currentArchitecture: ArchitectureProject;
  readonly latestVersion: ArchitectureVersion;
  readonly snapshots: readonly ArchitectureSnapshot[];
  readonly decisions: readonly DecisionRecord[];
  readonly validationHistory: readonly ValidationRecord[];
  readonly blueprintHistory: readonly BlueprintRecord[];
}

export class Workspace {
  private data: WorkspaceData;
  private readonly clock: () => Date;
  private readonly idGenerator: () => string;

  private constructor(
    private readonly storage: WorkspaceStorage,
    data: WorkspaceData,
    options: WorkspaceOptions = {}
  ) {
    this.data = data;
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? randomUUID;
  }

  static async create(
    directory: string,
    architecture: ArchitectureProject,
    options: WorkspaceOptions = {}
  ): Promise<Workspace> {
    const storage = new FileWorkspaceStorage(directory);
    if (await storage.exists()) {
      throw new Error(`Coding CAD workspace already exists at ${storage.filePath}.`);
    }

    const clock = options.clock ?? (() => new Date());
    const idGenerator = options.idGenerator ?? randomUUID;
    const timestamp = clock().toISOString();
    const snapshot: ArchitectureSnapshot = {
      version: 1,
      createdAt: timestamp,
      architecture: clone(architecture)
    };
    const data: WorkspaceData = {
      formatVersion: WORKSPACE_FORMAT_VERSION,
      id: idGenerator(),
      name: architecture.intent.name,
      createdAt: timestamp,
      updatedAt: timestamp,
      snapshots: [snapshot],
      decisions: [],
      validationHistory: [],
      blueprintHistory: []
    };
    await storage.save(data);
    return new Workspace(storage, data, { clock, idGenerator });
  }

  static async open(directory: string, options: WorkspaceOptions = {}): Promise<Workspace> {
    const storage = new FileWorkspaceStorage(directory);
    const data = await storage.load();
    validateWorkspaceData(data);
    return new Workspace(storage, data, options);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get latestVersion(): ArchitectureVersion {
    return this.latestSnapshot().version;
  }

  async saveSnapshot(architecture: ArchitectureProject): Promise<ArchitectureSnapshot> {
    const snapshot: ArchitectureSnapshot = {
      version: nextArchitectureVersion(this.latestVersion),
      createdAt: this.now(),
      architecture: clone(architecture)
    };
    await this.persist({ snapshots: [...this.data.snapshots, snapshot] });
    return clone(snapshot);
  }

  loadLatestArchitecture(): ArchitectureProject {
    return clone(this.latestSnapshot().architecture);
  }

  getSnapshot(version: ArchitectureVersion): ArchitectureSnapshot {
    assertArchitectureVersion(version);
    const snapshot = this.data.snapshots.find((candidate) => candidate.version === version);
    if (snapshot === undefined) {
      throw new Error(`Architecture version ${version} does not exist in workspace ${this.data.name}.`);
    }
    return clone(snapshot);
  }

  compareVersions(fromVersion: ArchitectureVersion, toVersion: ArchitectureVersion): ArchitectureDiff {
    const before = this.getSnapshot(fromVersion);
    const after = this.getSnapshot(toVersion);
    return compareArchitectures(before.architecture, after.architecture, fromVersion, toVersion);
  }

  async addDecision(
    decision: ArchitectureDecision,
    options: AddDecisionOptions = {}
  ): Promise<DecisionRecord> {
    const architectureVersion = options.architectureVersion ?? this.latestVersion;
    this.getSnapshot(architectureVersion);
    const record: DecisionRecord = {
      id: options.id ?? this.idGenerator(),
      architectureVersion,
      createdAt: this.now(),
      status: options.status ?? "accepted",
      decision: clone(decision)
    };
    this.assertUniqueRecordId(record.id);
    await this.persist({ decisions: [...this.data.decisions, record] });
    return clone(record);
  }

  async recordValidation(
    result: ValidationResult,
    architectureVersion: ArchitectureVersion = this.latestVersion
  ): Promise<ValidationRecord> {
    this.getSnapshot(architectureVersion);
    const record: ValidationRecord = {
      id: this.idGenerator(),
      architectureVersion,
      createdAt: this.now(),
      result: clone(result)
    };
    this.assertUniqueRecordId(record.id);
    await this.persist({ validationHistory: [...this.data.validationHistory, record] });
    return clone(record);
  }

  async recordBlueprint(
    blueprint: ExecutionBlueprint,
    architectureVersion: ArchitectureVersion = this.latestVersion
  ): Promise<BlueprintRecord> {
    this.getSnapshot(architectureVersion);
    const record: BlueprintRecord = {
      id: this.idGenerator(),
      architectureVersion,
      createdAt: this.now(),
      blueprint: clone(blueprint)
    };
    this.assertUniqueRecordId(record.id);
    await this.persist({ blueprintHistory: [...this.data.blueprintHistory, record] });
    return clone(record);
  }

  exportReport(): WorkspaceReport {
    return clone({
      workspace: {
        id: this.data.id,
        name: this.data.name,
        createdAt: this.data.createdAt,
        updatedAt: this.data.updatedAt
      },
      currentArchitecture: this.latestSnapshot().architecture,
      latestVersion: this.latestVersion,
      snapshots: this.data.snapshots,
      decisions: this.data.decisions,
      validationHistory: this.data.validationHistory,
      blueprintHistory: this.data.blueprintHistory
    });
  }

  private latestSnapshot(): ArchitectureSnapshot {
    const snapshot = this.data.snapshots.at(-1);
    if (snapshot === undefined) {
      throw new Error(`Workspace ${this.data.name} has no architecture snapshots.`);
    }
    return snapshot;
  }

  private now(): string {
    return this.clock().toISOString();
  }

  private assertUniqueRecordId(id: string): void {
    const ids = [...this.data.decisions, ...this.data.validationHistory, ...this.data.blueprintHistory]
      .map((record) => record.id);
    if (ids.includes(id)) {
      throw new Error(`Workspace record id must be unique; received ${id}.`);
    }
  }

  private async persist(changes: Partial<WorkspaceData>): Promise<void> {
    const next: WorkspaceData = {
      ...this.data,
      ...changes,
      updatedAt: this.now()
    };
    await this.storage.save(next);
    this.data = next;
  }
}

function validateWorkspaceData(data: WorkspaceData): void {
  if (data.formatVersion !== WORKSPACE_FORMAT_VERSION) {
    throw new Error(`Unsupported Coding CAD workspace format version: ${String(data.formatVersion)}.`);
  }
  if (!Array.isArray(data.snapshots) || data.snapshots.length === 0) {
    throw new Error("A Coding CAD workspace must contain at least one architecture snapshot.");
  }
  data.snapshots.forEach((snapshot, index) => {
    assertArchitectureVersion(snapshot.version);
    if (snapshot.version !== index + 1) {
      throw new Error("Coding CAD workspace architecture versions must be contiguous and ordered.");
    }
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
