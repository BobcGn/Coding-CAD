import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { LayoutState } from "@coding-cad/architecture-layout";
import type { ValidationResult } from "@coding-cad/architecture-validator";
import type { Proposal } from "@coding-cad/architecture-review";

/**
 * P3.3 Workspace shell state.
 *
 * Explicit lifecycle separation (P3.0 matrix):
 * - accepted: the accepted ArchitectureProject (never mutated by UI).
 * - candidate: the pending candidate ArchitectureProject (in-memory only).
 * - evidence: validation and proposal records for the current candidate.
 * - view: LayoutState plus ephemeral UI state (selection, status, error).
 *
 * P3.3 Workspace shell 状态。显式生命周期分离（P3.0 矩阵）：accepted 是已接受
 * ArchitectureProject（UI 绝不修改）；candidate 是待决 candidate（仅内存）；
 * evidence 是当前 candidate 的 validation 与 proposal 记录；view 是 LayoutState
 * 与瞬时 UI 状态（selection、status、error）。
 */

export type ShellStatus = "idle" | "generating" | "layout" | "ready" | "error";

export interface GreenfieldShellState {
  readonly accepted: ArchitectureProject;
  readonly candidate?: ArchitectureProject;
  readonly validation?: ValidationResult;
  readonly proposal?: Proposal;
  readonly layoutState?: LayoutState;
  readonly status: ShellStatus;
  readonly message: string;
  readonly selectedNodeIds: readonly string[];
}

export interface GreenfieldShellActions {
  generateFromRequirement(requirement: string): Promise<void>;
  acceptCandidate(): Promise<void>;
  rejectCandidate(): Promise<void>;
  updateLayoutState(next: LayoutState): void;
  selectNodeIds(nodeIds: readonly string[]): void;
  reset(): void;
}

/** Initial shell state with the empty-greenfield baseline. */
export function createInitialShellState(accepted: ArchitectureProject): GreenfieldShellState {
  return {
    accepted,
    status: "idle",
    message: "",
    selectedNodeIds: []
  };
}
