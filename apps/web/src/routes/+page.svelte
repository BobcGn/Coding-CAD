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
  import {
    applyTheme,
    loadUiSettings,
    saveUiSettings,
    systemPrefersDark,
    uiText,
    type ThemeMode,
    type UiLocale
  } from "$lib/cad/workspace/ui-settings.js";

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
  let settings = $state(loadUiSettings());
  let settingsOpen = $state(false);

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

  // --- Personal settings (language / theme) ---
  function t(key: Parameters<typeof uiText>[1]): string {
    return uiText(settings.locale, key);
  }

  function applyCurrentTheme(): void {
    applyTheme(settings.theme, systemPrefersDark());
  }

  function setTheme(theme: ThemeMode): void {
    settings = { ...settings, theme };
    saveUiSettings(settings);
    applyCurrentTheme();
  }

  function setLocale(locale: UiLocale): void {
    settings = { ...settings, locale };
    saveUiSettings(settings);
  }

  function toggleSettings(): void {
    settingsOpen = !settingsOpen;
  }

  function closeSettings(): void {
    settingsOpen = false;
  }

  function handleSystemThemeChange(event: MediaQueryListEvent): void {
    if (settings.theme === "system") {
      applyTheme("system", event.matches);
    }
  }

  onMount(() => {
    const next = new WorkspaceShellController(pointsSystemFixture);
    controller = next;
    syncFromController();
    applyCurrentTheme();
    globalThis.matchMedia?.("(prefers-color-scheme: dark)")
      .addEventListener("change", handleSystemThemeChange);
  });
</script>

<svelte:head>
  <title>Coding CAD — Greenfield Workspace</title>
</svelte:head>

<main>
  <header>
    <p>{t("appName")}</p>
    <h1>Greenfield Architecture Workspace</h1>
    <span aria-live="polite">{selectedNodeIds.length === 0 ? t("noSelection") : `${t('selected')}: ${selectedNodeIds.join(", ")}`}</span>
  </header>

  <div class="app-shell">
    <aside class="workspace-sidebar" aria-label={t("workspace")}>
      <h2>{t("workspace")}</h2>

      <section class="sidebar-block">
        <h3>{t("workspace")}</h3>
        <div class="sidebar-actions">
          <button type="button" class="sidebar-action" onclick={handleNewProject} disabled={busy}>
            {t("newProject")}
          </button>
          <button type="button" class="sidebar-action" onclick={handleSave} disabled={busy || !shell?.accepted}>
            {t("save")}
          </button>
          <button type="button" class="sidebar-action" onclick={handleOpen} disabled={busy}>
            {t("open")}
          </button>
          <button type="button" class="sidebar-action" onclick={handleAutoLayout} disabled={busy || !layout}>
            {t("autoLayout")}
          </button>
        </div>
      </section>

      <div class="sidebar-footer">
        <button
          type="button"
          class="settings-gear"
          aria-label={t("settings")}
          title={t("settings")}
          onclick={toggleSettings}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </aside>

    {#if settingsOpen}
      <div class="settings-overlay" role="presentation" onclick={closeSettings}></div>
      <div class="settings-panel" role="dialog" aria-label={t("settings")}>
        <div class="settings-panel-header">
          <h3>{t("settings")}</h3>
          <button type="button" class="settings-close" aria-label="Close" onclick={closeSettings}>×</button>
        </div>
        <div class="setting-row">
          <label for="locale-setting">{t("language")}</label>
          <select
            id="locale-setting"
            value={settings.locale}
            onchange={(event) => setLocale((event.currentTarget as HTMLSelectElement).value as UiLocale)}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="setting-row">
          <span>{t("theme")}</span>
          <div class="theme-options" role="radiogroup" aria-label={t("theme")}>
            <label>
              <input type="radio" name="theme" value="light" checked={settings.theme === "light"} onchange={() => setTheme("light")} />
              {t("themeLight")}
            </label>
            <label>
              <input type="radio" name="theme" value="dark" checked={settings.theme === "dark"} onchange={() => setTheme("dark")} />
              {t("themeDark")}
            </label>
            <label>
              <input type="radio" name="theme" value="system" checked={settings.theme === "system"} onchange={() => setTheme("system")} />
              {t("themeSystem")}
            </label>
          </div>
        </div>
      </div>
    {/if}

    <div class="content">
      <section class="requirement">
        <label for="requirement">{t("requirement")}</label>
        <textarea id="requirement" bind:value={requirement} rows="2" disabled={busy}></textarea>
        <button type="button" onclick={handleGenerate} disabled={busy || requirement.trim().length === 0}>
          {busy ? t("generating") : t("generateArchitecture")}
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
        <h2>{t("palette")}</h2>
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
          <section class="inspector" aria-label={t("inspector")}>
            <h2>{t("inspector")}</h2>
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
        <h2>{t("problems")}</h2>
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
          <p>{t("noValidationIssues")}</p>
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
    <section class="status">{t("emptyRequirementError")}</section>
  {/if}
      </div>
    </div>
</main>

<style>
  :global(html) { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  :global(html[data-theme="light"]) { --bg: #e2e8f0; --fg: #0f172a; --panel: #f8fafc; --panel-border: #cbd5e1; --panel-bg: #ffffff; --muted: #64748b; }
  :global(html[data-theme="dark"]) { --bg: #0f172a; --fg: #e2e8f0; --panel: #1e293b; --panel-border: #334155; --panel-bg: #0f172a; --muted: #94a3b8; }
  :global(body) { margin: 0; background: var(--bg); color: var(--fg); }
  main { box-sizing: border-box; min-height: 100vh; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 1rem; }
  .app-shell { display: grid; grid-template-columns: 14rem minmax(0, 1fr); gap: 0.75rem; min-height: 30rem; }
  @media (max-width: 1000px) { .app-shell { grid-template-columns: 1fr; } .workspace-sidebar { order: -1; } }
  .workspace-sidebar { position: relative; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid var(--panel-border); border-radius: 12px; background: var(--panel); padding: 0.75rem; overflow: visible; }
  .workspace-sidebar h2 { margin: 0 0 0.5rem; font-size: 1rem; }
  .sidebar-block { display: grid; gap: 0.5rem; }
  .sidebar-block h3 { margin: 0; font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .sidebar-actions { display: grid; gap: 0.4rem; }
  button.sidebar-action { width: 100%; border: 1px solid var(--panel-border); border-radius: 8px; background: var(--panel-bg); padding: 0.45rem 0.6rem; text-align: left; color: var(--fg); cursor: pointer; }
  button.sidebar-action:disabled { opacity: 0.55; cursor: not-allowed; }
  .sidebar-footer { margin-top: auto; border-top: 1px solid var(--panel-border); padding-top: 0.6rem; }
  button.settings-gear { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--panel-border); border-radius: 8px; background: var(--panel-bg); color: var(--fg); cursor: pointer; }
  button.settings-gear:hover { background: var(--panel); }
  .settings-overlay { position: fixed; inset: 0; z-index: 40; background: rgb(0 0 0 / 40%); }
  .settings-panel { position: fixed; left: 1rem; bottom: 1rem; z-index: 50; width: 15rem; border: 1px solid var(--panel-border); border-radius: 12px; background: var(--panel-bg); color: var(--fg); padding: 0.75rem; display: grid; gap: 0.6rem; box-shadow: 0 12px 32px rgb(0 0 0 / 25%); }
  .settings-panel-header { display: flex; align-items: center; justify-content: space-between; }
  .settings-panel-header h3 { margin: 0; font-size: 0.95rem; }
  button.settings-close { border: none; background: none; color: var(--muted); font-size: 1.1rem; cursor: pointer; padding: 0 0.2rem; }
  .setting-row { display: grid; gap: 0.3rem; }
  .setting-row label { font-size: 0.85rem; }
  .setting-row select { border: 1px solid var(--panel-border); border-radius: 6px; background: var(--panel-bg); color: var(--fg); padding: 0.3rem; }
  .theme-options { display: grid; gap: 0.3rem; font-size: 0.85rem; }
  .theme-options label { display: flex; align-items: center; gap: 0.35rem; }
  .content { display: grid; grid-template-rows: auto auto 1fr; gap: 0.75rem; min-width: 0; }
  header { display: flex; align-items: baseline; gap: 1rem; }
  header p { margin: 0; color: #0f766e; font-weight: 700; }
  h1 { margin: 0; font-size: 1.25rem; }
  header span { margin-left: auto; color: var(--muted); }
  .requirement { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; }
  .requirement label { font-weight: 600; }
  textarea { resize: vertical; border: 1px solid var(--panel-border); border-radius: 0.5rem; padding: 0.4rem; background: var(--panel-bg); color: var(--fg); }
  button { border: 1px solid var(--panel-border); border-radius: 0.5rem; background: var(--panel); padding: 0.4rem 0.7rem; cursor: pointer; color: var(--fg); }
  button:disabled { opacity: 0.55; cursor: not-allowed; }
  .workspace { display: grid; grid-template-columns: 12rem minmax(0, 1fr) 18rem; gap: 0.75rem; min-height: 30rem; }
  @media (max-width: 1100px) { .workspace { grid-template-columns: 10rem minmax(0, 1fr); } .workspace .problems { display: none; } }
  .canvas { height: 30rem; border-radius: 12px; background: var(--panel); overflow: hidden; pointer-events: none; }
  .canvas :global(.svelte-flow) { width: 100%; height: 100%; pointer-events: auto; }
  .canvas :global(.svelte-flow__nodes) { height: 100%; z-index: 5; position: relative; }
  .canvas :global(.svelte-flow__pane) { z-index: 0; }
  .canvas :global(.svelte-flow__node) { pointer-events: auto !important; }
  .palette { border: 1px solid var(--panel-border); border-radius: 12px; background: var(--panel); padding: 0.75rem; overflow: auto; }
  .palette h2 { margin: 0 0 0.5rem; font-size: 1rem; }
  .palette ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
  .palette li { margin: 0; }
  button.palette-item { width: 100%; display: grid; gap: 0.2rem; text-align: left; border: 1px solid var(--panel-border); border-radius: 8px; background: var(--panel-bg); padding: 0.5rem; cursor: pointer; color: var(--fg); }
  button.palette-item span { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; }
  .problems { border: 1px solid var(--panel-border); border-radius: 12px; background: var(--panel); padding: 0.75rem; overflow: auto; }
  .inspector { border: 1px solid var(--panel-border); border-radius: 10px; background: var(--panel-bg); padding: 0.6rem; margin-bottom: 0.75rem; color: var(--fg); }
  .inspector h2 { margin: 0 0 0.4rem; font-size: 0.95rem; }
  .inspector dl { margin: 0; display: grid; gap: 0.4rem; }
  .inspector dt { font-weight: 600; font-size: 0.8rem; color: var(--muted); text-transform: uppercase; }
  .inspector dd { margin: 0; font-size: 0.85rem; }
  .inspector textarea { width: 100%; resize: vertical; border: 1px solid var(--panel-border); border-radius: 6px; padding: 0.3rem; background: var(--panel); color: var(--fg); }
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
  .problems p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--muted); }
  button.link { border: none; background: none; padding: 0; color: #0f766e; text-decoration: underline; cursor: pointer; }
  .review { margin-top: 1rem; border-top: 1px solid var(--panel-border); padding-top: 0.75rem; }
  .review .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .muted { color: var(--muted); }
  .warn { color: #b45309; }
  .status { display: grid; place-items: center; min-height: 20rem; border-radius: 12px; background: var(--panel); color: var(--muted); }
  .error { border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; padding: 0.5rem 0.75rem; }
  .notice { border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; color: #166534; padding: 0.5rem 0.75rem; }
</style>

