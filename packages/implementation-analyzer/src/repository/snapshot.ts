/** Filesystem and manifest evidence collected without interpreting architecture. */
export interface RepositorySnapshot {
  readonly rootPath: string;
  readonly files: readonly string[];
  readonly languages: readonly string[];
  readonly configFiles: readonly string[];
  readonly dependencies: readonly string[];
}
