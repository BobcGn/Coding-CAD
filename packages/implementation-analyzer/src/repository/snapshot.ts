export interface WorkspacePackageInfo {
  readonly name: string;
  readonly path: string;
  readonly packageJsonFile: string;
  readonly dependencies: readonly string[];
  readonly devDependencies: readonly string[];
  readonly peerDependencies: readonly string[];
  readonly main?: string | undefined;
  readonly types?: string | undefined;
}

export type UnsupportedStructureType =
  | "unsupported-manifest"
  | "unparseable-syntax"
  | "unsupported-language"
  | "unknown-workspace-layout"
  | "missing-entry-point";

export interface UnsupportedStructureReport {
  readonly type: UnsupportedStructureType;
  readonly reason: string;
  readonly scope: string;
}

export interface TsconfigPathsConfig {
  readonly baseUrl?: string | undefined;
  readonly paths?: Readonly<Record<string, readonly string[]>> | undefined;
}

/** Filesystem and manifest evidence collected without interpreting architecture. */
export interface RepositorySnapshot {
  readonly rootPath: string;
  readonly files: readonly string[];
  readonly languages: readonly string[];
  readonly configFiles: readonly string[];
  readonly dependencies: readonly string[];
  readonly workspacePackages?: readonly WorkspacePackageInfo[] | undefined;
  readonly unsupportedStructures?: readonly UnsupportedStructureReport[] | undefined;
  readonly tsconfigPaths?: TsconfigPathsConfig | undefined;
}

