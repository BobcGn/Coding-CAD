<script lang="ts">
  import { onMount } from "svelte";
  import ArchitectureCanvas from "$lib/cad/canvas/ArchitectureCanvas.svelte";
  import { WorkspaceShellController } from "$lib/architecture/greenfield/workspace-shell-controller.js";
  import { pointsSystemFixture } from "$lib/architecture/projection/points-system-fixture.js";
  import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";
  import type { GreenfieldShellState } from "$lib/architecture/greenfield/workspace-shell.js";

  let controller = $state<WorkspaceShellController>();
  let shell = $state<GreenfieldShellState>();
  let projection = $state<ReturnType<WorkspaceShellController["projection"]>>();
  let layout = $state<ReturnType<WorkspaceShellController["layout"]>>();
  let requirement = $state("设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。");
  let busy = $state(false);
  let errorMessage = $state("");
  let selectedNodeIds = $state<string[]>([]);

  function syncFromController(): void {
    if (controller === undefined) return;
    shell = controller.state();
    projection = controller.projection();
    layout = controller.layout();
    selectedNodeIds = [...shell.selectedNodeIds];
    errorMessage = shell.status === "error" ? shell.message : "";
    busy = shell.status === "generating" || shell.status === "layout";
  }

  async function handleGenerate(): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.generateFromRequirement(requirement);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Generation failed.";
    } finally {
      syncFromController();
    }
  }

  function handleAccept(): void {
    if (controller === undefined || busy) return;
    busy = true;
    void controller.acceptCandidate().finally(() => { busy = false; syncFromController(); });
  }

  function handleReject(): void {
    if (controller === undefined || busy) return;
    controller.rejectCandidate();
    syncFromController();
  }

  function handleNewProject(): void {
    if (controller === undefined || busy) return;
    controller.reset();
    requirement = "设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。";
    syncFromController();
  }

  function handleAutoLayout(): void {
    if (controller === undefined || controller.layout() === undefined) return;
    const layout = controller.layout()!;
    controller.updateLayoutState(resetToGeneratedLayout(layout));
    syncFromController();
  }

  onMount(() => {
    const next = new WorkspaceShellController(pointsSystemFixture);
    controller = next;
    syncFromController();
  });
</script>

<svelte:head>
  <title>Coding CAD — Greenfield Workspace</title>
</svelte:head>

<main>
  <header>
    <p>Coding CAD</p>
    <h1>Greenfield Architecture Workspace</h1>
    <button type="button" onclick={handleNewProject} disabled={busy}>New Project</button>
    <button type="button" onclick={handleAutoLayout} disabled={busy || !layout}>Auto Layout</button>
    <span aria-live="polite">{selectedNodeIds.length === 0 ? "No selection" : `Selected: ${selectedNodeIds.join(", ")}`}</span>
  </header>

  <section class="requirement">
    <label for="requirement">Requirement</label>
    <textarea id="requirement" bind:value={requirement} rows="2" disabled={busy}></textarea>
    <button type="button" onclick={handleGenerate} disabled={busy || requirement.trim().length === 0}>
      {busy ? "Generating…" : "Generate Architecture"}
    </button>
  </section>

  {#if errorMessage}
    <section class="error" role="alert">{errorMessage}</section>
  {:else if shell?.message}
    <section class="notice" aria-live="polite">{shell.message}</section>
  {/if}

  {#if shell?.status === "generating" || shell?.status === "layout"}
    <section class="status" aria-busy="true" aria-live="polite">Generating and laying out architecture…</section>
  {:else if shell && projection && layout && shell.layoutState}
    <div class="workspace">
      <section class="canvas">
        <ArchitectureCanvas
          projection={projection}
          layout={layout}
          viewState={shell.layoutState}
          onViewStateChange={(next) => controller?.updateLayoutState(next)}
          onSelectionChange={(nodeIds) => { selectedNodeIds = [...nodeIds]; }}
        />
      </section>
      <aside class="problems">
        <h2>Problems</h2>
        {#if shell.validation && shell.validation.issues.length > 0}
          <ul>
            {#each shell.validation.issues as issue (issue.id)}
              <li class={issue.severity.toLowerCase()}>
                <strong>{issue.title}</strong>
                {#if issue.affectedComponent}
                  <button
                    type="button"
                    class="link"
                    onclick={() => { selectedNodeIds = [issue.affectedComponent!]; }}
                  >
                    {issue.affectedComponent}
                  </button>
                {/if}
                <p>{issue.description}</p>
              </li>
            {/each}
          </ul>
        {:else}
          <p>No validation issues.</p>
        {/if}

        {#if shell.candidate}
          <div class="review">
            <h2>Review</h2>
            <p class="muted">A candidate ArchitectureProject is awaiting your decision.</p>
            <div class="actions">
              <button type="button" onclick={handleAccept} disabled={busy || shell.validation?.valid === false}>
                Accept
              </button>
              <button type="button" onclick={handleReject} disabled={busy}>Reject</button>
            </div>
            {#if shell.validation?.valid === false}
              <p class="warn">Approval is blocked while the candidate has validation errors.</p>
            {/if}
          </div>
        {/if}
      </aside>
    </div>
  {:else}
    <section class="status">Enter a requirement and generate an architecture to begin.</section>
  {/if}
</main>

<style>
  :global(html) { font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #e2e8f0; color: #0f172a; }
  :global(body) { margin: 0; }
  main { box-sizing: border-box; min-height: 100vh; display: grid; grid-template-rows: auto auto auto 1fr; gap: 0.75rem; padding: 1rem; }
  header { display: flex; align-items: baseline; gap: 1rem; }
  header p { margin: 0; color: #0f766e; font-weight: 700; }
  h1 { margin: 0; font-size: 1.25rem; }
  header span { margin-left: auto; color: #475569; }
  header button { margin-left: auto; border: 1px solid #94a3b8; border-radius: 0.5rem; background: #f8fafc; padding: 0.4rem 0.7rem; color: #0f172a; cursor: pointer; }
  header button + span { margin-left: 0; }
  .requirement { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; }
  .requirement label { font-weight: 600; }
  textarea { resize: vertical; border: 1px solid #94a3b8; border-radius: 0.5rem; padding: 0.4rem; }
  button { border: 1px solid #94a3b8; border-radius: 0.5rem; background: #f8fafc; padding: 0.4rem 0.7rem; cursor: pointer; }
  button:disabled { opacity: 0.55; cursor: not-allowed; }
  .workspace { display: grid; grid-template-columns: 1fr 22rem; gap: 0.75rem; min-height: 30rem; }
  .canvas { height: 30rem; border-radius: 12px; background: #f8fafc; overflow: hidden; }
  .canvas :global(.svelte-flow) { width: 100%; height: 100%; }
  .canvas :global(.svelte-flow__nodes) { height: 100%; z-index: 5; position: relative; }
  .problems { border: 1px solid #cbd5e1; border-radius: 12px; background: #f8fafc; padding: 0.75rem; overflow: auto; }
  .problems h2 { margin: 0 0 0.5rem; font-size: 1rem; }
  .problems ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
  .problems li { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; }
  .problems li.error { border-color: #fecaca; background: #fef2f2; }
  .problems li.warning { border-color: #fde68a; background: #fffbeb; }
  .problems li.info { border-color: #bfdbfe; background: #eff6ff; }
  .problems p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #334155; }
  button.link { border: none; background: none; padding: 0; color: #0f766e; text-decoration: underline; cursor: pointer; }
  .review { margin-top: 1rem; border-top: 1px solid #cbd5e1; padding-top: 0.75rem; }
  .review .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .muted { color: #64748b; }
  .warn { color: #b45309; }
  .status { display: grid; place-items: center; min-height: 20rem; border-radius: 12px; background: #f8fafc; color: #475569; }
  .error { border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; padding: 0.5rem 0.75rem; }
  .notice { border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; color: #166534; padding: 0.5rem 0.75rem; }
</style>

