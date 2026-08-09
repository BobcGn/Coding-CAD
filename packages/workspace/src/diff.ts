import type { ArchitectureProject, Component, Connection, Constraint } from "@coding-cad/architecture-ir";
import type { ArchitectureVersion } from "./version.js";

export interface ChangedValue<T> {
  readonly before: T;
  readonly after: T;
}

export interface ArchitectureDiff {
  readonly fromVersion: ArchitectureVersion;
  readonly toVersion: ArchitectureVersion;
  readonly components: {
    readonly added: readonly Component[];
    readonly removed: readonly Component[];
    readonly changed: readonly ChangedValue<Component>[];
  };
  readonly connections: {
    readonly added: readonly Connection[];
    readonly removed: readonly Connection[];
    readonly changed: readonly ChangedValue<Connection>[];
  };
  readonly constraints: {
    readonly added: readonly Constraint[];
    readonly removed: readonly Constraint[];
    readonly changed: readonly ChangedValue<Constraint>[];
  };
}

export function compareArchitectures(
  before: ArchitectureProject,
  after: ArchitectureProject,
  fromVersion: ArchitectureVersion,
  toVersion: ArchitectureVersion
): ArchitectureDiff {
  const components = compareById(before.architecture.components, after.architecture.components);
  const connections = compareById(before.architecture.connections, after.architecture.connections);
  const constraints = compareConstraints(before.constraints, after.constraints);

  return {
    fromVersion,
    toVersion,
    components: {
      added: components.added,
      removed: components.removed,
      changed: components.changed
    },
    connections,
    constraints
  };
}

function compareById<T extends { readonly id: string }>(
  before: readonly T[],
  after: readonly T[]
): { readonly added: readonly T[]; readonly removed: readonly T[]; readonly changed: readonly ChangedValue<T>[] } {
  const beforeById = new Map(before.map((value) => [value.id, value]));
  const afterById = new Map(after.map((value) => [value.id, value]));

  return {
    added: after.filter((value) => !beforeById.has(value.id)),
    removed: before.filter((value) => !afterById.has(value.id)),
    changed: before.flatMap((value) => {
      const next = afterById.get(value.id);
      return next !== undefined && !sameValue(value, next) ? [{ before: value, after: next }] : [];
    })
  };
}

function compareConstraints(
  before: readonly Constraint[],
  after: readonly Constraint[]
): ArchitectureDiff["constraints"] {
  const unmatchedBefore = [...before];
  const unmatchedAfter = [...after];

  removeExactMatches(unmatchedBefore, unmatchedAfter);

  const changed: ChangedValue<Constraint>[] = [];
  for (let beforeIndex = unmatchedBefore.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    const previous = unmatchedBefore[beforeIndex];
    if (previous === undefined) continue;
    const afterIndex = unmatchedAfter.findIndex((candidate) => candidate.type === previous.type);
    if (afterIndex < 0) continue;
    const next = unmatchedAfter[afterIndex];
    if (next === undefined) continue;
    changed.unshift({ before: previous, after: next });
    unmatchedBefore.splice(beforeIndex, 1);
    unmatchedAfter.splice(afterIndex, 1);
  }

  return {
    added: unmatchedAfter,
    removed: unmatchedBefore,
    changed
  };
}

function removeExactMatches(before: Constraint[], after: Constraint[]): void {
  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    const previous = before[beforeIndex];
    const afterIndex = after.findIndex((candidate) => sameValue(previous, candidate));
    if (afterIndex >= 0) {
      before.splice(beforeIndex, 1);
      after.splice(afterIndex, 1);
    }
  }
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
