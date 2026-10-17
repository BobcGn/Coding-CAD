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
  import { formatLayerPriorExplanation } from "@coding-cad/implementation-analyzer/codec";
  import {
    applyTheme,
    loadUiSettings,
    saveUiSettings,
    systemPrefersDark,
    uiText,
    type ThemeMode,
    type UiLocale
  } from "$lib/cad/workspace/ui-settings.js";
  import type { ArchitectureProject } from "@coding-cad/architecture-ir";
  import {
    isCannotVerifyIssue,
    isContractIssue,
    isTechnologyUndetectedIssue,
    resolveIssueTarget,
    type ComplianceIssue
  } from "@coding-cad/implementation-validator";
  import {
    CODING_CAD_EXPECTED_BASELINE,
    CODING_CAD_DRIFTED_BASELINE
  } from "$lib/architecture/compliance/baseline-presets.js";

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
  let removeComponentId = $state("");
  let confirmCascade = $state(false);
  let connectionId = $state("");
  let connectionFrom = $state("");
  let connectionTo = $state("");
  let connectionProtocol = $state("REST");
  let expectedModalOpen = $state(false);
  let expectedCustomJson = $state("");
  const pendingReview = $derived(shell?.proposal?.status === "draft" || shell?.proposal?.status === "in-review");
  const removalConnections = $derived(shell?.accepted.architecture.connections.filter(
    (edge) => edge.from === removeComponentId || edge.to === removeComponentId
  ) ?? []);
  let reviewRationale = $state("");
  let contractName = $state("");
  let contractProtocol = $state<"REST" | "RPC" | "EVENT" | "SQL" | "MESSAGE">("REST");
  let editLimitation = $state("");
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
    const nextInspector = projectInspector(component, state.validation?.issues ?? []);
    inspector = nextInspector;
    editDescription = nextInspector.description;
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
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
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

  function handleRemove(): void {
    if (removalConnections.length > 0 && !confirmCascade) {
      errorMessage = "Confirm cascade removal of connected edges before removing this component.";
      return;
    }
    void runInspectorCommand({ type: "remove-component", componentId: removeComponentId });
    confirmCascade = false;
  }

  function handleConnect(): void {
    void runInspectorCommand({
      type: "connect-components",
      connection: { id: connectionId, from: connectionFrom, to: connectionTo, protocol: connectionProtocol }
    });
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
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
    }
  }

  async function handleAccept(): Promise<void> {
    if (controller === undefined || busy) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.acceptCandidate(reviewRationale);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Accept failed.";
    } finally {
      busy = false;
      syncFromController();
    }
  }

  function handleReject(): void {
    if (controller === undefined || busy) return;
    controller.rejectCandidate(reviewRationale);
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
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
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
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
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
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
    }
  }

  let repoPathInput = $state("");
  let repoModalOpen = $state(false);

  async function handleAnalyzeRepository(): Promise<void> {
    if (controller === undefined || busy || repoPathInput.trim().length === 0) return;
    busy = true;
    errorMessage = "";
    try {
      await controller.analyzeRepository(repoPathInput.trim());
      repoModalOpen = false;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Repository analysis failed.";
    } finally {
      const failure = errorMessage;
      syncFromController();
      if (failure) errorMessage = failure;
      busy = false;
    }
  }

  function handleLoadExpected(project: ArchitectureProject): void {
    if (controller === undefined) return;
    controller.loadExpectedArchitecture(project);
    syncFromController();
    expectedModalOpen = false;
  }

  function handleLoadCustomJson(): void {
    if (controller === undefined || expectedCustomJson.trim().length === 0) return;
    controller.loadExpectedArchitectureJson(expectedCustomJson.trim());
    syncFromController();
    expectedModalOpen = false;
  }

  function handleClearExpected(): void {
    if (controller === undefined) return;
    controller.clearExpectedArchitecture();
    syncFromController();
  }

  function handleFocusTarget(targetId: string): void {
    if (controller === undefined) return;
    selectedNodeIds = [targetId];
    controller.selectNodeIds([targetId]);
    updateInspector();
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
    if (import.meta.env.DEV || import.meta.env.MODE === "layout-acceptance") {
      void import("$lib/layout/testing/layout-acceptance.js").then(({ installLayoutAcceptance }) => installLayoutAcceptance(next));
    }
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
          <button type="button" class="sidebar-action" data-testid="open-repository-btn" onclick={() => { repoModalOpen = true; }} disabled={busy}>
            {settings.locale === "zh" ? "打开代码仓库" : "Analyze Repository"}
          </button>
          <button type="button" class="sidebar-action" data-testid="sidebar-load-expected" onclick={() => { expectedModalOpen = true; }} disabled={busy}>
            {settings.locale === "zh" ? "加载期望架构基线" : "Load Expected Baseline"}
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

    {#if repoModalOpen}
      <div class="settings-overlay" role="presentation" onclick={() => { repoModalOpen = false; }}></div>
      <div class="settings-panel" role="dialog" aria-label="Open Repository">
        <div class="settings-panel-header">
          <h3>{settings.locale === "zh" ? "打开本地代码仓库" : "Open Local Repository"}</h3>
          <button type="button" class="settings-close" aria-label="Close" onclick={() => { repoModalOpen = false; }}>×</button>
        </div>
        <div class="setting-row">
          <label for="repo-path-input">{settings.locale === "zh" ? "仓库绝对路径" : "Repository Path"}</label>
          <input
            id="repo-path-input"
            data-testid="repo-path-input"
            bind:value={repoPathInput}
            placeholder="/path/to/repository"
            disabled={busy}
          />
        </div>
        <div class="actions" style="margin-top: 1rem;">
          <button
            type="button"
            data-testid="repo-analyze-submit"
            onclick={handleAnalyzeRepository}
            disabled={busy || repoPathInput.trim().length === 0}
          >
            {busy ? (settings.locale === "zh" ? "分析中..." : "Analyzing...") : (settings.locale === "zh" ? "开始反演分析" : "Analyze Repository")}
          </button>
        </div>
      </div>
    {/if}

    {#if expectedModalOpen}
      <div class="settings-overlay" role="presentation" onclick={() => { expectedModalOpen = false; }}></div>
      <div class="settings-panel" role="dialog" aria-label="Load Expected Architecture" data-testid="load-expected-modal">
        <div class="settings-panel-header">
          <h3>{settings.locale === "zh" ? "加载已批准期望架构基线" : "Load Expected Architecture Baseline"}</h3>
          <button type="button" class="settings-close" aria-label="Close" onclick={() => { expectedModalOpen = false; }}>×</button>
        </div>
        <p class="muted" style="margin: 0.5rem 0; font-size: 0.85rem;">
          {settings.locale === "zh"
            ? "选择权威的 ArchitectureProject 作为合规检查基线（严禁系统自动伪造期望）："
            : "Select an authoritative ArchitectureProject baseline (no synthetic auto-expectations):"}
        </p>
        <div class="sidebar-actions" style="margin-bottom: 1rem; display: grid; gap: 0.5rem;">
          <div class="preset-notice" data-testid="preset-notice" style="font-size: 0.75rem; color: #b45309; background: #fffbeb; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #fde68a;">
            <strong>{settings.locale === "zh" ? "注意" : "Note"}:</strong>
            {settings.locale === "zh"
              ? "以下为 Coding-CAD 本仓库的示例基线，仅适用于本仓库测试与演示，不适用于其他仓库。"
              : "The presets below are example baselines for the Coding-CAD repository only, designed for tests and demos, not for other repositories."}
          </div>
          <button
            type="button"
            class="sidebar-action"
            data-testid="load-preset-golden"
            onclick={() => handleLoadExpected(CODING_CAD_EXPECTED_BASELINE)}
          >
            <strong>Coding-CAD Golden Baseline</strong>
            <small style="display:block; color: var(--muted);">{settings.locale === "zh" ? "示例基线，仅适用于本仓库（完全合规基线）" : "Example baseline, only applies to this repository (Fully compliant baseline)"}</small>
          </button>
          <button
            type="button"
            class="sidebar-action"
            data-testid="load-preset-drifted"
            onclick={() => handleLoadExpected(CODING_CAD_DRIFTED_BASELINE)}
          >
            <strong>Coding-CAD Drifted Baseline</strong>
            <small style="display:block; color: var(--muted);">{settings.locale === "zh" ? "示例基线，仅适用于本仓库（人工偏离基线）" : "Example baseline, only applies to this repository (Drifted baseline)"}</small>
          </button>
        </div>
        <div class="setting-row" style="display: grid; gap: 0.5rem;">
          <label for="custom-expected-json">{settings.locale === "zh" ? "或粘贴自定义 ArchitectureProject JSON" : "Or Paste Custom ArchitectureProject JSON"}</label>
          <textarea
            id="custom-expected-json"
            data-testid="custom-expected-json"
            bind:value={expectedCustomJson}
            rows="4"
            placeholder={`{ "version": "1.0", "intent": { ... }, "architecture": { ... } }`}
          ></textarea>
          <button
            type="button"
            data-testid="load-custom-submit"
            onclick={handleLoadCustomJson}
            disabled={expectedCustomJson.trim().length === 0}
          >
            {settings.locale === "zh" ? "解析并加载" : "Parse & Load JSON"}
          </button>
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
    <section class="error" role="alert" data-testid="error-banner">{errorMessage}</section>
  {:else if noticeMessage}
    <section class="notice" aria-live="polite">{noticeMessage}</section>
  {/if}

  {#if shell?.layoutWarning}
    <p role="status" class="warn">Layout fallback: {shell.layoutWarning}</p>
  {/if}

  {#if shell?.inspection?.truncated}
    <section class="truncation-banner warn" role="alert" data-testid="truncation-banner">
      <strong>{settings.locale === "zh" ? "分析已被截断" : "Analysis Truncated"}:</strong>
      {shell.inspection.truncated.message}
    </section>
  {/if}

  {#if shell?.inspection?.unsupportedStructures && shell.inspection.unsupportedStructures.length > 0}
    <section class="unsupported-structures-banner warn" aria-label="Unsupported structures" data-testid="unsupported-structures-banner">
      <strong>{settings.locale === "zh" ? "检测到不支持的仓库结构" : "Unsupported structures detected"} ({shell.inspection.unsupportedStructures.length}):</strong>
      <ul>
        {#each shell.inspection.unsupportedStructures as item}
          <li>
            <code>{item.type}</code>: {item.reason} ({item.scope})
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if shell?.status === "generating" || shell?.status === "layout"}
    <section class="status" aria-busy="true" aria-live="polite">Generating and laying out architecture…</section>
  {:else if shell && projection && layout && (shell.candidateLayoutState || shell.layoutState)}
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
                disabled={busy || pendingReview}
              >
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </button>
            </li>
          {/each}
        </ul>
        <section aria-label="Architecture editing">
          <h3>Remove component</h3>
          <label for="remove-component-id">Component to remove</label>
          <input id="remove-component-id" bind:value={removeComponentId} list="component-ids" disabled={busy || pendingReview} />
          <datalist id="component-ids">
            {#each shell.accepted.architecture.components as component (component.id)}
              <option value={component.id}>{component.name}</option>
            {/each}
          </datalist>
          {#if removalConnections.length > 0}
            <p>Removing this component also removes {removalConnections.length} connected edge(s): {removalConnections.map((edge) => edge.id).join(", ")}.</p>
            <label><input type="checkbox" bind:checked={confirmCascade} />Confirm cascade removal</label>
          {/if}
          <button type="button" onclick={handleRemove} disabled={busy || pendingReview || !removeComponentId.trim()}>Remove component</button>
          <h3>Connect components</h3>
          <label for="connection-id">Connection id</label>
          <input id="connection-id" bind:value={connectionId} disabled={busy || pendingReview} />
          <label for="connection-from">Source component id</label>
          <input id="connection-from" bind:value={connectionFrom} list="component-ids" disabled={busy || pendingReview} />
          <label for="connection-to">Target component id</label>
          <input id="connection-to" bind:value={connectionTo} list="component-ids" disabled={busy || pendingReview} />
          <label for="connection-protocol">Connection protocol</label>
          <input id="connection-protocol" bind:value={connectionProtocol} disabled={busy || pendingReview} />
          <button type="button" onclick={handleConnect} disabled={busy || pendingReview || !connectionId.trim()}>Connect components</button>
        </section>
      </aside>
      <section class="canvas">
        <ArchitectureCanvas
          projection={projection}
          layout={layout}
          viewState={(shell.candidate ? shell.candidateLayoutState : shell.layoutState) ?? shell.layoutState!}
          selectedNodeIds={selectedNodeIds}
          onViewStateChange={(next) => controller?.updateLayoutState(next)}
          onSelectionChange={(nodeIds) => {
            selectedNodeIds = [...nodeIds];
            controller?.selectNodeIds(nodeIds);
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
              <dd>
                <select aria-label="Component type" value={inspector.type ?? ""} disabled={busy || pendingReview}
                  onchange={(event) => {
                    if (inspector) void runInspectorCommand({ type: "inspector-update-type", componentId: inspector.componentId, componentType: event.currentTarget.value });
                  }}>
                  <option value="" disabled>unset</option>
                  {#each ["service", "database", "cache", "queue", "gateway", "storage", "external-service"] as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              </dd>
              <dt>Description</dt>
              <dd>
                <textarea bind:value={editDescription} rows="2" disabled={busy}></textarea>
                <button type="button" onclick={handleSaveDescription} disabled={busy || pendingReview}>Save Description</button>
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
                        disabled={busy || pendingReview}
                      >×</button>
                    </li>
                  {/each}
                </ul>
                <div class="capability-add">
                  <input bind:value={editCapability} placeholder="capability" disabled={busy} />
                  <button type="button" onclick={handleAddCapability} disabled={busy || pendingReview || editCapability.trim().length === 0}>Add</button>
                </div>
              </dd>
              <dt>Limitations</dt>
              <dd>
                <ul>{#each inspector.limitations as limitation}<li>{limitation}</li>{/each}</ul>
                <label for="limitation">New limitation</label>
                <input id="limitation" bind:value={editLimitation} disabled={busy || pendingReview} />
                <button type="button" disabled={busy || pendingReview || !editLimitation.trim()}
                  onclick={() => {
                    if (inspector) void runInspectorCommand({ type: "inspector-add-limitation", componentId: inspector.componentId, limitation: editLimitation.trim() });
                  }}>Add limitation</button>
              </dd>
              <dt>Contracts</dt>
              <dd>
                <ul>
                  {#each inspector.contracts as contract, index (index)}
                    <li>{contract.name} ({contract.protocol})
                      <button type="button" aria-label={`Remove contract ${contract.name}`} disabled={busy || pendingReview}
                        onclick={() => {
                          if (inspector) void runInspectorCommand({ type: "inspector-remove-contract", componentId: inspector.componentId, contractName: contract.name });
                        }}>Remove</button>
                    </li>
                  {/each}
                </ul>
                <label for="contract-name">Contract name</label>
                <input id="contract-name" bind:value={contractName} disabled={busy || pendingReview} />
                <label for="contract-protocol">Contract protocol</label>
                <select id="contract-protocol" bind:value={contractProtocol} disabled={busy || pendingReview}>
                  {#each ["REST", "RPC", "EVENT", "SQL", "MESSAGE"] as protocol}<option value={protocol}>{protocol}</option>{/each}
                </select>
                <button type="button" disabled={busy || pendingReview || !contractName.trim()}
                  onclick={() => {
                    if (inspector) void runInspectorCommand({ type: "inspector-add-contract", componentId: inspector.componentId, contract: { name: contractName.trim(), protocol: contractProtocol } });
                  }}>Add contract</button>
              </dd>
            </dl>
            {#if inspector.evidence}
              <div class="evidence-panel" data-testid="evidence-panel">
                <h3>{settings.locale === "zh" ? "代码证据与反演来源" : "Implementation Evidence"}</h3>
                <dl>
                  <dt>{settings.locale === "zh" ? "来源类型" : "Provenance"}</dt>
                  <dd data-testid="evidence-source">{inspector.evidence.source}</dd>
                  <dt>{settings.locale === "zh" ? "层级先验" : "Layer Prior"}</dt>
                  <dd data-testid="evidence-confidence">
                    {inspector.evidence.confidence.toFixed(2)}
                    <small class="muted" style="display: block;">
                      {formatLayerPriorExplanation(inspector.evidence.source, inspector.evidence.confidence)}
                    </small>
                  </dd>
                  <dt>{settings.locale === "zh" ? "相对路径" : "Relative Path"}</dt>
                  <dd data-testid="evidence-path"><code>{inspector.evidence.path}</code></dd>
                  {#if inspector.evidence.exports.length > 0}
                    <dt>{settings.locale === "zh" ? "公共导出符号" : "Exported Symbols"}</dt>
                    <dd>
                      <ul class="chips">
                        {#each inspector.evidence.exports as exp (exp)}
                          <li>{exp}</li>
                        {/each}
                      </ul>
                    </dd>
                  {/if}
                </dl>
              </div>
            {/if}
            {#if inspector.issues.length > 0}
              <p class="warn">This component has {inspector.issues.length} validation issue(s).</p>
            {/if}
            {#if shell?.complianceReport && selectedNodeIds.length > 0}
              {@const currentId = selectedNodeIds[0]}
              {@const relatedIssues = shell.complianceReport.issues.filter((issue) => {
                const target = resolveIssueTarget(issue);
                return target?.targetId === currentId || target?.from === currentId || target?.to === currentId;
              })}
              {#if relatedIssues.length > 0}
                <div class="inspector-compliance-section" data-testid="inspector-compliance-section">
                  <h3>{settings.locale === "zh" ? "关联的合规问题" : "Associated Compliance Issues"} ({relatedIssues.length})</h3>
                  <ul class="compliance-issues-list">
                    {#each relatedIssues as issue}
                      <li class={`compliance-issue ${issue.severity.toLowerCase()}`} data-testid="inspector-compliance-issue">
                        <span class={`badge severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                        <strong>{issue.title}</strong>
                        <p class="issue-desc">{issue.description}</p>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/if}
          </section>
        {/if}
        <h2>{t("problems")}</h2>
        {#if shell.inspection !== undefined}
          <!-- Brownfield Compliance Mode -->
          {#if !shell.expectedArchitecture}
            <div class="compliance-unavailable-banner warn" data-testid="compliance-unavailable-banner">
              <h4>{settings.locale === "zh" ? "合规检查不可用：未加载期望架构" : "Compliance check unavailable: No expected architecture loaded"}</h4>
              <p>{settings.locale === "zh" ? "请加载已批准的架构基线（ArchitectureProject）以进行实现偏离核对。" : "Please load an approved ArchitectureProject baseline to check implementation drift."}</p>
              <button type="button" class="btn-sm" data-testid="load-expected-btn" onclick={() => { expectedModalOpen = true; }}>
                {settings.locale === "zh" ? "加载期望架构" : "Load Expected Baseline"}
              </button>
            </div>
          {:else}
            {@const cannotVerifyCount = shell.complianceReport?.issues.filter(i => isCannotVerifyIssue(i)).length ?? 0}
            {@const pendingCount = shell.complianceReport?.issues.filter(i => !isCannotVerifyIssue(i) && (
              i.implementationEvidence.includes("inferred") ||
              i.implementationEvidence.includes("0.6") ||
              i.implementationEvidence.includes("0.5") ||
              i.implementationEvidence.includes("0.4") ||
              i.implementationEvidence.includes("Undeclared")
            )).length ?? 0}
            {@const errorCount = shell.complianceReport?.issues.filter(i => !isCannotVerifyIssue(i) && i.severity === "ERROR").length ?? 0}
            {@const warningCount = shell.complianceReport?.issues.filter(i => !isCannotVerifyIssue(i) && i.severity === "WARNING" && !(
              i.implementationEvidence.includes("inferred") ||
              i.implementationEvidence.includes("0.6") ||
              i.implementationEvidence.includes("0.5") ||
              i.implementationEvidence.includes("0.4") ||
              i.implementationEvidence.includes("Undeclared")
            )).length ?? 0}
            <div class="compliance-header" data-testid="compliance-header">
              <div class="compliance-header-title">
                <h3>{settings.locale === "zh" ? "实现合规检查" : "Compliance Verification"}</h3>
                <span class="compliance-count">
                  {shell.complianceReport?.issues.length ?? 0} {settings.locale === "zh" ? "个项" : "item(s)"}
                </span>
              </div>
              <div class="compliance-category-counters" data-testid="compliance-category-counters">
                <span class="badge severity error" data-testid="counter-error">{settings.locale === "zh" ? "错误" : "Errors"}: {errorCount}</span>
                <span class="badge severity warning" data-testid="counter-warning">{settings.locale === "zh" ? "警告" : "Warnings"}: {warningCount}</span>
                <span class="badge pending-confirmation" data-testid="counter-pending">{settings.locale === "zh" ? "待人工确认" : "Pending"}: {pendingCount}</span>
                <span class="badge cannot-verify" data-testid="counter-cannot-verify">{settings.locale === "zh" ? "无法验证" : "Cannot Verify"}: {cannotVerifyCount}</span>
              </div>
              <button type="button" class="btn-sm" data-testid="clear-expected-btn" onclick={handleClearExpected}>
                {settings.locale === "zh" ? "清除基线" : "Clear Baseline"}
              </button>
            </div>
            {#if shell.complianceReport && shell.complianceReport.issues.length > 0}
              <ul class="compliance-issues-list" data-testid="compliance-issues-list">
                {#each shell.complianceReport.issues as issue (issue.id)}
                  {@const target = resolveIssueTarget(issue)}
                  {@const isContract = isContractIssue(issue)}
                  {@const isTechUndetected = isTechnologyUndetectedIssue(issue)}
                  {@const isCannotVerify = isCannotVerifyIssue(issue)}
                  {@const isPending = !isCannotVerify && (
                    issue.implementationEvidence.includes("inferred") ||
                    issue.implementationEvidence.includes("0.6") ||
                    issue.implementationEvidence.includes("0.5") ||
                    issue.implementationEvidence.includes("0.4") ||
                    issue.implementationEvidence.includes("Undeclared")
                  )}
                  <li class={`compliance-issue ${isCannotVerify ? "cannot-verify" : issue.severity.toLowerCase()}`} data-testid="compliance-issue-item">
                    <div class="issue-header">
                      {#if !isCannotVerify}
                        <span class={`badge severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                      {/if}
                      {#if isContract}
                        <span class="badge cannot-verify" data-testid="badge-cannot-verify">
                          {settings.locale === "zh" ? "无法验证 (Analyzer 未提取契约)" : "Cannot Verify (Contracts not extracted)"}
                        </span>
                      {:else if isTechUndetected}
                        <span class="badge cannot-verify" data-testid="badge-cannot-verify">
                          {settings.locale === "zh" ? "无法验证 (Analyzer 未检出技术)" : "Cannot Verify (Technology undetected)"}
                        </span>
                      {/if}
                      {#if isPending}
                        <span class="badge pending-confirmation" data-testid="badge-pending-confirmation">
                          {settings.locale === "zh" ? "待人工确认" : "Pending Confirmation"}
                        </span>
                      {/if}
                      <strong>{issue.title}</strong>
                    </div>
                    {#if target}
                      <div class="issue-target">
                        <button
                          type="button"
                          class="link"
                          data-testid="issue-target-link"
                          onclick={() => handleFocusTarget(target.targetId)}
                        >
                          {settings.locale === "zh" ? "定位元素" : "Focus"}: <code>{target.targetId}</code>
                        </button>
                      </div>
                    {/if}
                    <p class="issue-desc">{issue.description}</p>
                    {#if issue.architectureExpectation}
                      <p class="issue-expectation"><small><strong>{settings.locale === "zh" ? "架构期望" : "Expectation"}:</strong> {issue.architectureExpectation}</small></p>
                    {/if}
                    {#if issue.implementationEvidence}
                      <p class="issue-evidence"><small><strong>{settings.locale === "zh" ? "实现证据" : "Evidence"}:</strong> {issue.implementationEvidence}</small></p>
                    {/if}
                    {#if issue.recommendation}
                      <p class="issue-recommendation"><small><strong>{settings.locale === "zh" ? "修复建议" : "Recommendation"}:</strong> {issue.recommendation}</small></p>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else if shell.complianceReport}
              <p class="compliance-passed" data-testid="compliance-passed">
                {settings.locale === "zh" ? "实现完全符合已批准架构（0 项偏差）。" : "Implementation matches approved architecture baseline (0 deviations)."}
              </p>
            {/if}
          {/if}
        {:else}
          <!-- Greenfield Validation Mode -->
          {#if shell.validation && shell.validation.issues.length > 0}
            <ul>
              {#each shell.validation.issues as issue (issue.id)}
                <li class={issue.severity.toLowerCase()}>
                  <strong>{issue.title}</strong>
                  {#if issue.affectedComponent}
                    <button
                      type="button"
                      class="link"
                      onclick={() => { selectedNodeIds = [issue.affectedComponent!]; updateInspector(); }}
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
        {/if}

        {#if shell.candidate}
          <div class="review">
            <h2>Review</h2>
            <p class="muted">Proposal status: {shell.proposal?.status}. Reviewer: local-user.</p>
            <label for="review-rationale">Review rationale</label>
            <textarea id="review-rationale" bind:value={reviewRationale} rows="2" disabled={busy}></textarea>
            <div class="actions">
              <button type="button" onclick={handleAccept} disabled={busy || shell.validation?.valid !== true || !reviewRationale.trim() || shell.proposal?.status === "rejected"}>
                Accept
              </button>
              <button type="button" onclick={handleReject} disabled={busy || !reviewRationale.trim() || shell.proposal?.status === "rejected"}>Reject</button>
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
  .evidence-panel { margin-top: 1rem; padding: 0.75rem; border-radius: 8px; background: var(--panel); border: 1px solid var(--panel-border); }
  .evidence-panel h3 { margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--fg); }
  .unsupported-structures-banner, .truncation-banner { border: 1px solid #fde68a; background: #fffbeb; color: #92400e; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.75rem; }
  .unsupported-structures-banner ul { margin: 0.25rem 0 0; padding-left: 1.25rem; font-size: 0.85rem; }
  .compliance-unavailable-banner { border: 1px solid #fde68a; background: #fffbeb; color: #92400e; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; }
  .compliance-unavailable-banner h4 { margin: 0 0 0.25rem; font-size: 0.9rem; }
  .compliance-unavailable-banner p { margin: 0 0 0.5rem; font-size: 0.8rem; }
  .compliance-header { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.5rem; }
  .compliance-header-title { display: flex; align-items: center; justify-content: space-between; }
  .compliance-category-counters { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.2rem 0; }
  .compliance-count { font-size: 0.8rem; color: var(--muted); }
  .btn-sm { font-size: 0.75rem; padding: 0.2rem 0.5rem; border: 1px solid var(--panel-border); border-radius: 6px; background: var(--panel-bg); cursor: pointer; color: var(--fg); align-self: flex-start; }
  .compliance-issues-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
  .compliance-issue { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; background: var(--panel-bg); }
  .compliance-issue.cannot-verify { border-color: #cbd5e1; background: #f8fafc; }
  .compliance-issue.error { border-color: #fecaca; background: #fef2f2; }
  .compliance-issue.warning { border-color: #fde68a; background: #fffbeb; }
  .compliance-issue.info { border-color: #bfdbfe; background: #eff6ff; }
  .issue-header { display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.3rem; }
  .badge { font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.35rem; border-radius: 4px; text-transform: uppercase; }
  .badge.severity.error { background: #dc2626; color: #ffffff; }
  .badge.severity.warning { background: #d97706; color: #ffffff; }
  .badge.severity.info { background: #2563eb; color: #ffffff; }
  .badge.cannot-verify { background: #64748b; color: #ffffff; text-transform: none; }
  .badge.pending-confirmation { background: #8b5cf6; color: #ffffff; text-transform: none; }
  .issue-target { margin-bottom: 0.25rem; }
  .issue-desc { margin: 0.2rem 0; font-size: 0.85rem; }
  .issue-expectation, .issue-evidence, .issue-recommendation { margin: 0.15rem 0; font-size: 0.8rem; color: var(--muted); }
  .compliance-passed { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.5rem; font-size: 0.85rem; }
  .inspector-compliance-section { margin-top: 0.75rem; border-top: 1px solid var(--panel-border); padding-top: 0.5rem; }
  .inspector-compliance-section h3 { margin: 0 0 0.4rem; font-size: 0.85rem; }
</style>

