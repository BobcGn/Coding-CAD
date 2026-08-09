export type ArchitectureVersion = number;

export function nextArchitectureVersion(current?: ArchitectureVersion): ArchitectureVersion {
  return current === undefined ? 1 : current + 1;
}

export function assertArchitectureVersion(version: ArchitectureVersion): void {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error(`Architecture version must be a positive integer; received ${version}.`);
  }
}
