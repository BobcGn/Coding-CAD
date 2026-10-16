import {
  compileArchitectureProjection, layoutArchitectureGraph, MOVEMENT_BUDGET,
  type ArchitectureLayoutProjection, type IncrementalLayoutOptions, type LayoutResult, type LayoutState
} from "@coding-cad/architecture-layout";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { WorkspaceShellController } from "$lib/architecture/greenfield/workspace-shell-controller.js";
import { pointsSystemFixture } from "$lib/architecture/projection/points-system-fixture.js";
import { BrowserWorkerLayoutEngine } from "$lib/layout/worker/browser-worker-layout-engine.js";

export interface AcceptanceSnapshot {
  readonly project: ArchitectureProject;
  readonly projection?: ArchitectureLayoutProjection;
  readonly layout?: LayoutResult;
  readonly viewState?: LayoutState;
}

async function solve(project: ArchitectureProject, options: IncrementalLayoutOptions) {
  const projection = compileArchitectureProjection(project);
  const engine = new BrowserWorkerLayoutEngine();
  const started = performance.now();
  try {
    const outcome = await layoutArchitectureGraph(projection.layoutGraph, { timeoutMs: 5000, ...options }, engine);
    return { projection, ...outcome, durationMs: performance.now() - started };
  } finally { engine.dispose(); }
}

export function installLayoutAcceptance(controller: WorkspaceShellController): void {
  const snapshot = (): AcceptanceSnapshot => {
    const state = controller.state();
    return structuredClone({
      project: state.candidate ?? state.accepted,
      projection: controller.projection(), layout: controller.layout(),
      viewState: state.candidate === undefined ? state.layoutState : state.candidateLayoutState
    });
  };
  const fixture = (name: "workspace-default" | "points-system") =>
    name === "points-system" ? pointsSystemFixture : snapshot().project;

  window.__p3LayoutAcceptance = {
    snapshot,
    async runFixture(name: "workspace-default" | "points-system") {
      const project = fixture(name);
      const before = JSON.stringify(project);
      const first = await solve(project, { mode: "FULL" });
      const repeated = await solve(project, { mode: "FULL" });
      const editedId = project.architecture.components.find((node) => node.type === "service")!.id;
      const edited: ArchitectureProject = {
        ...project,
        architecture: {
          ...project.architecture,
          components: project.architecture.components.map((node) =>
            node.id === editedId ? { ...node, description: "Browser acceptance semantic edit." } : node)
        }
      };
      const incremental = await solve(edited, { mode: "INCREMENTAL", previousState: first.state });
      return { name, first, repeated, incremental, editedId, inputImmutable: JSON.stringify(project) === before, movementBudget: MOVEMENT_BUDGET };
    },
    // Diagnostic only; not called by positive tests. Uses the existing real timeout path.
    async compareFallback(name: "workspace-default" | "points-system") {
      return solve(fixture(name), { mode: "FULL", timeoutMs: 0 });
    }
  };
}

declare global {
  interface Window {
    __p3LayoutAcceptance?: {
      snapshot(): AcceptanceSnapshot;
      runFixture(name: "workspace-default" | "points-system"): Promise<{
        name: string; first: Awaited<ReturnType<typeof solve>>; repeated: Awaited<ReturnType<typeof solve>>;
        incremental: Awaited<ReturnType<typeof solve>>; editedId: string; inputImmutable: boolean;
        movementBudget: typeof MOVEMENT_BUDGET
      }>;
      compareFallback(name: "workspace-default" | "points-system"): ReturnType<typeof solve>;
    };
  }
}
