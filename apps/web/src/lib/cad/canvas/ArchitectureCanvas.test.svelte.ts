import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import ArchitectureCanvas from "./ArchitectureCanvas.svelte";

vi.mock("@xyflow/svelte", async () => {
  const SvelteFlow = (await import("./test/SvelteFlowStub.svelte")).default;
  const Empty = (await import("./test/EmptyStub.svelte")).default;
  return {
    SvelteFlow,
    Background: Empty,
    Controls: Empty,
    MiniMap: Empty,
    BackgroundVariant: { Dots: "dots" }
  };
});

describe("Architecture Canvas", () => {
  it("exposes the architecture canvas as an accessible region", () => {
    render(ArchitectureCanvas, {
      projection: {
        classifications: [], abstraction: { groups: [], parentByComponentId: {} },
        visualGraph: { nodes: [], edges: [] },
        layoutGraph: { direction: "LR", nodes: [], edges: [], constraints: [] }
      },
      layout: { status: "success", direction: "LR", size: { width: 0, height: 0 }, nodes: [], edges: [], diagnostics: [] },
      viewState: { version: 1, direction: "LR", nodes: [], edges: [] }
    });
    expect(screen.getByRole("application", { name: "Architecture Canvas" })).toBeInTheDocument();
  });
});
