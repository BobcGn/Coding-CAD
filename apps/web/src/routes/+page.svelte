<script lang="ts">
  import { onMount } from "svelte";
  import type { ArchitectureLayoutProjection, LayoutResult, LayoutState } from "@coding-cad/architecture-layout";
  import ArchitectureCanvas from "$lib/cad/canvas/ArchitectureCanvas.svelte";
  import { loadPointsSystemFixture } from "$lib/architecture/projection/layout-fixture.js";
  import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";

  let status = $state<"loading" | "ready" | "error">("loading");
  let message = $state("");
  let projection = $state.raw<ArchitectureLayoutProjection>();
  let layout = $state.raw<LayoutResult>();
  let viewState = $state.raw<LayoutState>();
  let selected = $state<string[]>([]);

  function resetLayout(): void {
    if (layout === undefined) return;
    viewState = resetToGeneratedLayout(layout);
  }

  onMount(() => {
    const controller = new AbortController();
    loadPointsSystemFixture(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        projection = loaded.projection;
        layout = loaded.layout;
        viewState = resetToGeneratedLayout(loaded.layout);
        status = "ready";
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        message = error instanceof Error ? error.message : "Architecture layout failed.";
        status = "error";
      });
    return () => controller.abort();
  });
</script>

<svelte:head>
  <title>Coding CAD — Architecture Canvas</title>
</svelte:head>

<main>
  <header>
    <p>Coding CAD</p>
    <h1>Architecture Canvas</h1>
    <button type="button" onclick={resetLayout} disabled={layout === undefined}>Auto Layout</button>
    <span aria-live="polite">{selected.length === 0 ? "No selection" : `Selected: ${selected.join(", ")}`}</span>
  </header>

  {#if status === "loading"}
    <section class="status" aria-busy="true" aria-live="polite">Loading architecture layout…</section>
  {:else if status === "error"}
    <section class="status error" role="alert">{message}</section>
  {:else if projection && layout && viewState}
    <ArchitectureCanvas
      {projection}
      {layout}
      {viewState}
      onViewStateChange={(next) => viewState = next}
      onSelectionChange={(nodeIds, edgeIds) => selected = [...nodeIds, ...edgeIds]}
    />
  {/if}
</main>

<style>
  :global(html) { font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #e2e8f0; color: #0f172a; }
  :global(body) { margin: 0; }
  main { box-sizing: border-box; min-height: 100vh; display: grid; grid-template-rows: auto 1fr; gap: 1rem; padding: 1.25rem; }
  header { display: flex; align-items: baseline; gap: 1rem; }
  header p { margin: 0; color: #0f766e; font-weight: 700; }
  h1 { margin: 0; font-size: 1.5rem; }
  header span { margin-left: auto; color: #475569; }
  header button { margin-left: auto; border: 1px solid #94a3b8; border-radius: 0.5rem; background: #f8fafc; padding: 0.45rem 0.75rem; color: #0f172a; cursor: pointer; }
  header button + span { margin-left: 0; }
  .status { display: grid; place-items: center; min-height: 36rem; border-radius: 14px; background: #f8fafc; }
  .error { color: #b91c1c; }
</style>
