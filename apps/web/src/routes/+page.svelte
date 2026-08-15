<script lang="ts">
  import { onMount } from "svelte";
  import ArchitectureCanvas from "$lib/cad/canvas/ArchitectureCanvas.svelte";
  import { WorkspaceShellController } from "$lib/architecture/greenfield/workspace-shell-controller.js";
  import { pointsSystemFixture } from "$lib/architecture/projection/points-system-fixture.js";
  import { resetToGeneratedLayout } from "$lib/architecture/state/workspace-view-state.js";
  import { projectPalette, type PaletteItem } from "$lib/architecture/greenfield/palette.js";
  import { toAddComponentCommand } from "$lib/architecture/greenfield/palette.js";
  import { projectInspector } from "$lib/architecture/greenfield/inspector.js";
  import type { InspectorViewModel } from "$lib/architecture/greenfield/inspector.js";
  import type { ArchitectureCommand } from "$lib/architecture/commands/architecture-command.js";
  import type { GreenfieldShellState } from "$lib/architecture/greenfield/workspace-shell.js";

  let controller = $state<WorkspaceShellController>();
  let shell = $state<GreenfieldShellState>();
  let projection = $state<ReturnType<WorkspaceShellController["projection"]>>();
  let layout = $state<ReturnType<WorkspaceShellController["layout"]>>();
  let requirement = $state("设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。");
  let busy = $state(false);
  let errorMessage = $state("");
  let selectedNodeIds = $state<string[]>([]);
  let paletteItems = $state<readonly PaletteItem[]>(projectPalette().items);
  let inspector = $state<InspectorViewModel>();
  let editDescription = $state("");
  let editCapability = $state("");
  let noticeMessage = $state("");

  function syncFromController(): void {
    if (controller === undefined) return;
    shell = controller.state();
    projection = controller.projection();
    layout = controller.layout();
    selectedNodeIds = [...shell.selectedNodeIds];
    errorMessage = shell.status === "error" ? shell.message : "";
    noticeMessage = shell.status === "error" ? "" : shell.message;
    busy = shell.status === "generating" || shell.status === "layout";
    updateInspector();
  }

  function updateInspector(): void {
    updateInspectorFor(selectedNodeIds);
  }

  function updateInspectorFor(nodeIds: readonly string[]): void {
    if (controller === undefined || nodeIds.length === 0) {
      inspector = undefined;
      return;
    }
    const state = controller.state();
    // The Canvas may show a candidate (pending) or the accepted architecture;
    // inspect whichever projection is currently rendered.
    const source = state.candidate ?? state.accepted;
    const component = source.architecture.components.find((entry) => entry.id === nodeIds[0]);
    if (component === undefined) {
      inspector = undefined;
      return;
    }
    inspector = projectInspector(component, state.validation?.issues ?? []);
    editDescription = inspector.description;
  }

  async function runInspectorCommand(command: ArchitectureCommand): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.executeCommand(command);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Inspector command failed.";
    } finally {
      syncFromController();
    }
  }

  function handleSaveDescription(): void {
    if (inspector === undefined) return;
    void runInspectorCommand({
      type: "inspector-update-description",
      componentId: inspector.componentId,
      description: editDescription
    });
  }

  function handleAddCapability(): void {
    if (inspector === undefined || editCapability.trim().length === 0) return;
    void runInspectorCommand({
      type: "inspector-add-capability",
      componentId: inspector.componentId,
      capability: editCapability.trim()
    });
    editCapability = "";
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

  async function handleAccept(): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.acceptCandidate();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Accept failed.";
    } finally {
      busy = false;
      syncFromController();
    }
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

  async function handleAddFromPalette(item: PaletteItem): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.executeCommand(toAddComponentCommand(item));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Command failed.";
    } finally {
      syncFromController();
    }
  }

  async function handleSave(): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.saveProject();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Save failed.";
    } finally {
      syncFromController();
    }
  }

  async function handleOpen(): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.openProject(controller.state().accepted.intent.name);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Open failed.";
    } finally {
      syncFromController();
    }
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
    <button type="button" onclick={handleSave} disabled={busy || !shell?.accepted}>Save</button>
    <button type="button" onclick={handleOpen} disabled={busy}>Open</button>
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
  {:else if noticeMessage}
    <section class="notice" aria-live="polite">{noticeMessage}</section>
  {/if}

  {#if shell?.status === "generating" || shell?.status === "layout"}
    <section class="status" aria-busy="true" aria-live="polite">Generating and laying out architecture…</section>
  {:else if shell && projection && layout && shell.layoutState}
    <div class="workspace">
      <aside class="palette">
        <h2>Palette</h2>
        <ul>
          {#each paletteItems as item (item.id)}
            <li>
              <button
                type="button"
                class="palette-item"
                onclick={() => handleAddFromPalette(item)}
                disabled={busy}
              >
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </button>
            </li>
          {/each}
        </ul>
      </aside>
      <section class="canvas">
        <ArchitectureCanvas
          projection={projection}
          layout={layout}
          viewState={shell.layoutState}
          onViewStateChange={(next) => controller?.updateLayoutState(next)}
          onSelectionChange={(nodeIds) => {
            selectedNodeIds = [...nodeIds];
            updateInspectorFor(nodeIds);
          }}
        />
      </section>
      <aside class="problems">
        {#if inspector}
          <section class="inspector" aria-label="Component Inspector">
            <h2>Inspector</h2>
            <dl>
              <dt>Name</dt>
              <dd>{inspector.name}</dd>
              <dt>Type</dt>
              <dd>{inspector.type ?? "unset"}</dd>
              <dt>Description</dt>
              <dd>
                <textarea bind:value={editDescription} rows="2" disabled={busy}></textarea>
                <button type="button" onclick={handleSaveDescription} disabled={busy}>Save Description</button>
              </dd>
              <dt>Capabilities</dt>
              <dd>
                <ul class="chips">
                  {#each inspector.capabilities as capability (capability)}
                    <li>
                      {capability}
                      <button
                        type="button"
                        class="chip-remove"
                        aria-label="Remove capability"
                        onclick={() => {
                          const current = inspector;
                          if (current === undefined) return;
                          void runInspectorCommand({
                            type: "inspector-remove-capability",
                            componentId: current.componentId,
                            capability
                          });
                        }}
                        disabled={busy}
                      >×</button>
                    </li>
                  {/each}
                </ul>
                <div class="capability-add">
                  <input bind:value={editCapability} placeholder="capability" disabled={busy} />
                  <button type="button" onclick={handleAddCapability} disabled={busy || editCapability.trim().length === 0}>Add</button>
                </div>
              </dd>
            </dl>
            {#if inspector.issues.length > 0}
              <p class="warn">This component has {inspector.issues.length} validation issue(s).</p>
            {/if}
          </section>
        {/if}
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
  .workspace { display: grid; grid-template-columns: 12rem minmax(0, 1fr) 18rem; gap: 0.75rem; min-height: 30rem; }
  @media (max-width: 1100px) { .workspace { grid-template-columns: 10rem minmax(0, 1fr); } .workspace .problems { display: none; } }
  .canvas { height: 30rem; border-radius: 12px; background: #f8fafc; overflow: hidden; pointer-events: none; }
  .canvas :global(.svelte-flow) { width: 100%; height: 100%; pointer-events: auto; }
  .canvas :global(.svelte-flow__nodes) { height: 100%; z-index: 5; position: relative; }
  .canvas :global(.svelte-flow__pane) { z-index: 0; }
  .canvas :global(.svelte-flow__node) { pointer-events: auto !important; }
  .palette { border: 1px solid #cbd5e1; border-radius: 12px; background: #f8fafc; padding: 0.75rem; overflow: auto; }
  .palette h2 { margin: 0 0 0.5rem; font-size: 1rem; }
  .palette ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
  .palette li { margin: 0; }
  button.palette-item { width: 100%; display: grid; gap: 0.2rem; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0.5rem; cursor: pointer; }
  button.palette-item span { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
  .problems { border: 1px solid #cbd5e1; border-radius: 12px; background: #f8fafc; padding: 0.75rem; overflow: auto; }
  .inspector { border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 0.6rem; margin-bottom: 0.75rem; }
  .inspector h2 { margin: 0 0 0.4rem; font-size: 0.95rem; }
  .inspector dl { margin: 0; display: grid; gap: 0.4rem; }
  .inspector dt { font-weight: 600; font-size: 0.8rem; color: #475569; text-transform: uppercase; }
  .inspector dd { margin: 0; font-size: 0.85rem; }
  .inspector textarea { width: 100%; resize: vertical; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.3rem; }
  .inspector button { margin-top: 0.3rem; }
  ul.chips { margin: 0.2rem 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.3rem; }
  ul.chips li { border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; padding: 0.1rem 0.4rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem; }
  button.chip-remove { margin: 0; border: none; background: none; color: #b91c1c; cursor: pointer; padding: 0; font-size: 0.8rem; }
  .capability-add { display: flex; gap: 0.3rem; margin-top: 0.3rem; }
  .capability-add input { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.25rem; font-size: 0.8rem; }
  .capability-add button { margin: 0; }
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

