import {
  compileArchitectureProjection,
  type ArchitectureLayoutProjection,
  type LayoutResult
} from "@coding-cad/architecture-layout";
import { BrowserWorkerLayoutEngine } from "$lib/layout/worker/browser-worker-layout-engine.js";
import { pointsSystemFixture } from "./points-system-fixture.js";

export interface LoadedArchitectureFixture {
  readonly projection: ArchitectureLayoutProjection;
  readonly layout: LayoutResult;
}

export async function loadPointsSystemFixture(signal?: AbortSignal): Promise<LoadedArchitectureFixture> {
  const projection = compileArchitectureProjection(pointsSystemFixture);
  const engine = new BrowserWorkerLayoutEngine();
  try {
    const layout = await engine.layout(projection.layoutGraph, { signal, timeoutMs: 5_000 });
    return { projection, layout };
  } finally {
    engine.dispose();
  }
}
