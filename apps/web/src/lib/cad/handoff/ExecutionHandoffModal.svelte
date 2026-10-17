<script lang="ts">
  import type { SupportedAgentAdapter } from "@coding-cad/agent-adapter";
  import {
    formatHandoffExport,
    getHandoffExportFilename,
    type HandoffViewModel
  } from "$lib/architecture/handoff/execution-handoff.js";

  interface Props {
    model: HandoffViewModel;
    onClose: () => void;
    onRegenerate: () => void;
    onFocusTarget: (targetId: string) => void;
  }

  let { model, onClose, onRegenerate, onFocusTarget }: Props = $props();

  type TabType = "blueprint" | SupportedAgentAdapter;
  let activeTab = $state<TabType>("blueprint");
  let copyFeedback = $state("");

  const currentPreviewContent = $derived.by(() => {
    if (!model) return "";
    if (activeTab === "blueprint") {
      return model.blueprint ? JSON.stringify(model.blueprint, null, 2) : "";
    }
    return model.guides?.[activeTab]?.content ?? "";
  });

  async function handleCopy(): Promise<void> {
    const textToCopy = currentPreviewContent;
    if (!textToCopy) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      copyFeedback = "已复制全文 (Copied to clipboard)";
      setTimeout(() => {
        copyFeedback = "";
      }, 2500);
    } catch {
      copyFeedback = "复制失败 (Copy failed)";
      setTimeout(() => {
        copyFeedback = "";
      }, 2500);
    }
  }

  function handleExport(): void {
    const text = currentPreviewContent;
    if (!text) return;

    const exported = formatHandoffExport(text, {
      format: activeTab,
      architectureReference: model.architectureReference,
      generatedAt: model.generatedAt
    });

    const filename = getHandoffExportFilename(model.projectName, activeTab);
    const mimeType = activeTab === "blueprint" ? "application/json" : "text/markdown";

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const blob = new Blob([exported], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
</script>

<div class="modal-overlay" role="presentation" onclick={onClose}></div>

<div class="handoff-modal" role="dialog" aria-label="Execution Handoff" data-testid="execution-handoff-modal">
  <div class="modal-header">
    <div class="header-title">
      <h2>执行交接 / Execution Handoff</h2>
      <code class="arch-ref" data-testid="handoff-arch-ref">{model.architectureReference}</code>
      <span class="timestamp" data-testid="handoff-generated-at">Snapshot: {model.generatedAt}</span>
    </div>
    <button type="button" class="btn-close" aria-label="Close" data-testid="handoff-close-btn" onclick={onClose}>×</button>
  </div>

  {#if model.status === "stale"}
    <div class="banner warn" data-testid="handoff-stale-banner">
      <div class="banner-content">
        <strong>⚠️ 已过期 (Stale):</strong>
        <span>正式架构已发生变更，当前 Handoff 预览已过期，请重新生成以匹配最新架构。</span>
      </div>
      <button type="button" class="btn-regenerate" data-testid="handoff-regenerate-btn" onclick={onRegenerate}>
        重新生成 (Regenerate)
      </button>
    </div>
  {/if}

  {#if model.warning}
    <div class="banner info" data-testid="handoff-pending-candidate-banner">
      <strong>⚠️ 注意 / Notice:</strong> {model.warning}
    </div>
  {/if}

  {#if model.inferredNotice}
    <div class="banner inferred" data-testid="handoff-inferred-banner">
      <strong>ℹ️ 代码反演证据 / Inferred Evidence:</strong> {model.inferredNotice}
    </div>
  {/if}

  {#if model.status === "error" || model.error}
    <div class="banner error" data-testid="handoff-error-banner">
      <strong>❌ 错误 / Error:</strong> {model.error}
    </div>
  {:else}
    <div class="tabs-nav" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "blueprint"}
        class:active={activeTab === "blueprint"}
        data-testid="tab-blueprint"
        onclick={() => { activeTab = "blueprint"; }}
      >
        Blueprint 蓝图
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "generic"}
        class:active={activeTab === "generic"}
        data-testid="tab-generic"
        onclick={() => { activeTab = "generic"; }}
      >
        Generic Guide
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "codex"}
        class:active={activeTab === "codex"}
        data-testid="tab-codex"
        onclick={() => { activeTab = "codex"; }}
      >
        Codex Prompt
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "claude-code"}
        class:active={activeTab === "claude-code"}
        data-testid="tab-claude"
        onclick={() => { activeTab = "claude-code"; }}
      >
        Claude Code (CLAUDE.md)
      </button>
    </div>

    <div class="tab-body">
      {#if activeTab === "blueprint" && model.blueprint}
        <div class="blueprint-view" data-testid="blueprint-view">
          <div class="blueprint-section">
            <h3>实施任务 / Implementation Tasks ({model.blueprint.tasks.length})</h3>
            <div class="task-cards">
              {#each model.blueprint.tasks as task, i (task.id)}
                {@const provenance = model.taskProvenances[i]}
                <div class="card task-card" data-testid="handoff-task-item">
                  <div class="card-header">
                    <span class="badge index">#{i + 1}</span>
                    <strong class="task-title">{task.title}</strong>
                    <code class="task-id">{task.id}</code>
                  </div>
                  <p class="task-desc">{task.description}</p>
                  
                  <div class="provenance-row">
                    <span class="prov-label">来源架构组件 / Source Components:</span>
                    {#if provenance && provenance.relatedComponents.length > 0}
                      <div class="prov-chips">
                        {#each provenance.relatedComponents as comp (comp.id)}
                          <button
                            type="button"
                            class="chip-link"
                            data-testid="task-source-link"
                            title={`在画布上聚焦定位 ${comp.name} (${comp.id})`}
                            onclick={() => {
                              onFocusTarget(comp.id);
                              onClose();
                            }}
                          >
                            🎯 <code>{comp.name}</code> ({comp.id})
                          </button>
                        {/each}
                      </div>
                    {:else}
                      <span class="muted">无指定组件</span>
                    {/if}
                  </div>

                  {#if task.dependencies.length > 0}
                    <div class="task-deps">
                      <span class="dep-label">前置依赖 / Dependencies:</span>
                      <code>{task.dependencies.join(", ")}</code>
                    </div>
                  {/if}

                  <details class="task-reqs">
                    <summary>详细要求 ({task.requirements.length})</summary>
                    <ul>
                      {#each task.requirements as req}
                        <li>{req}</li>
                      {/each}
                    </ul>
                  </details>
                </div>
              {/each}
            </div>
          </div>

          <div class="blueprint-section">
            <h3>实施约束 / Implementation Constraints ({model.blueprint.constraints.length})</h3>
            <div class="constraint-cards">
              {#each model.blueprint.constraints as constraint, ci (ci)}
                {@const prov = model.constraintProvenances[ci]}
                <div class="card constraint-card" data-testid="handoff-constraint-item">
                  <div class="card-header">
                    <span class={`badge severity ${constraint.severity.toLowerCase()}`}>{constraint.severity}</span>
                    <strong>{constraint.type}</strong>
                    {#if constraint.source}
                      <span class="source-tag">Source: {constraint.source}</span>
                    {/if}
                  </div>
                  <p class="constraint-desc">{constraint.description}</p>
                  {#if constraint.sourceReference}
                    <div class="provenance-row">
                      <span class="prov-label">来源索引 / Reference:</span>
                      {#if prov?.targetComponentId}
                        <button
                          type="button"
                          class="chip-link"
                          data-testid="constraint-source-link"
                          onclick={() => {
                            onFocusTarget(prov.targetComponentId!);
                            onClose();
                          }}
                        >
                          🎯 <code>{constraint.sourceReference}</code>
                        </button>
                      {:else}
                        <code>{constraint.sourceReference}</code>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <div class="blueprint-section">
            <h3>Agent 规则与验收标准 / Agent Guide & Acceptance Criteria</h3>
            <div class="card guide-summary-card">
              <h4>禁止修改项 / Forbidden Changes:</h4>
              <ul>
                {#each model.blueprint.agentGuide.forbiddenChanges as forbidden}
                  <li>{forbidden}</li>
                {/each}
              </ul>
              <h4>验收标准 / Acceptance Criteria:</h4>
              <ul>
                {#each model.blueprint.agentGuide.acceptanceCriteria as criteria}
                  <li>{criteria}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      {:else if activeTab !== "blueprint" && model.guides}
        {@const currentGuide = model.guides[activeTab]}
        <div class="guide-view" data-testid="guide-view">
          <div class="guide-meta-bar">
            <span class="meta-item">
              格式 / Format: <strong>{currentGuide?.format}</strong>
            </span>
            <span class="meta-item" data-testid="guide-tasks-count">
              包含任务 / Tasks: <strong>{currentGuide?.metadata?.tasks ?? 0} 项</strong>
            </span>
            <span class="meta-item">
              段落来源 / Provenance: <strong>100% 映射自已批准 Execution Blueprint</strong>
            </span>
          </div>
          <pre class="guide-display" data-testid="guide-content-display"><code>{currentPreviewContent}</code></pre>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      {#if copyFeedback}
        <span class="copy-feedback" data-testid="copy-feedback" role="status">{copyFeedback}</span>
      {/if}
      <button type="button" class="btn-action" data-testid="handoff-copy-btn" onclick={handleCopy}>
        📋 复制全文 (Copy)
      </button>
      <button type="button" class="btn-action primary" data-testid="handoff-export-btn" onclick={handleExport}>
        💾 导出文件 (Export)
      </button>
      <button type="button" class="btn-action" data-testid="handoff-footer-close-btn" onclick={onClose}>
        关闭 (Close)
      </button>
    </div>
  {/if}
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgb(0 0 0 / 45%);
    backdrop-filter: blur(2px);
  }

  .handoff-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 70;
    width: min(92vw, 56rem);
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    background: var(--panel-bg);
    color: var(--fg);
    box-shadow: 0 20px 45px rgb(0 0 0 / 30%);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .header-title {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .header-title h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .arch-ref {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .btn-close {
    border: none;
    background: none;
    color: var(--muted);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.3rem;
  }

  .banner {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid transparent;
  }

  .banner.warn {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }

  .banner.info {
    background: #eff6ff;
    color: #1e40af;
    border-color: #bfdbfe;
  }

  .banner.inferred {
    background: #f5f3ff;
    color: #5b21b6;
    border-color: #ddd6fe;
  }

  .banner.error {
    background: #fef2f2;
    color: #991b1b;
    border-color: #fecaca;
  }

  .btn-regenerate {
    border: 1px solid #d97706;
    background: #f59e0b;
    color: #ffffff;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    font-size: 0.8rem;
  }

  .tabs-nav {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 1rem 0;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel);
    overflow-x: auto;
  }

  .tabs-nav button {
    border: 1px solid transparent;
    border-bottom: none;
    background: none;
    color: var(--muted);
    padding: 0.45rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
  }

  .tabs-nav button.active {
    background: var(--panel-bg);
    color: var(--fg);
    border-color: var(--panel-border);
    font-weight: 600;
  }

  .tab-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    min-height: 18rem;
  }

  .blueprint-view {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .blueprint-section h3 {
    margin: 0 0 0.6rem;
    font-size: 0.95rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .task-cards, .constraint-cards {
    display: grid;
    gap: 0.6rem;
  }

  .card {
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--panel);
  }

  .card-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  .badge.index {
    background: #0284c7;
    color: #ffffff;
  }

  .badge.severity.required {
    background: #dc2626;
    color: #ffffff;
  }

  .badge.severity.warning {
    background: #d97706;
    color: #ffffff;
  }

  .badge.severity.info {
    background: #2563eb;
    color: #ffffff;
  }

  .task-title {
    font-size: 0.9rem;
  }

  .task-id {
    font-size: 0.75rem;
    color: var(--muted);
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    padding: 0.05rem 0.3rem;
    border-radius: 4px;
    margin-left: auto;
  }

  .task-desc, .constraint-desc {
    margin: 0.2rem 0 0.4rem;
    font-size: 0.85rem;
  }

  .provenance-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.35rem;
    font-size: 0.8rem;
  }

  .prov-label {
    color: var(--muted);
    font-size: 0.75rem;
  }

  .prov-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .chip-link {
    border: 1px solid #93c5fd;
    background: #eff6ff;
    color: #1d4ed8;
    padding: 0.15rem 0.4rem;
    border-radius: 999px;
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .chip-link:hover {
    background: #dbeafe;
    text-decoration: underline;
  }

  .task-deps {
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .task-reqs {
    margin-top: 0.4rem;
    font-size: 0.8rem;
  }

  .task-reqs summary {
    cursor: pointer;
    color: #0f766e;
  }

  .task-reqs ul {
    margin: 0.3rem 0 0;
    padding-left: 1.25rem;
  }

  .source-tag {
    font-size: 0.75rem;
    color: var(--muted);
    margin-left: auto;
  }

  .guide-summary-card h4 {
    margin: 0.5rem 0 0.2rem;
    font-size: 0.85rem;
  }

  .guide-summary-card ul {
    margin: 0 0 0.5rem;
    padding-left: 1.25rem;
    font-size: 0.8rem;
  }

  .guide-view {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    height: 100%;
  }

  .guide-meta-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    background: var(--panel);
    font-size: 0.75rem;
    color: var(--muted);
  }

  .meta-item strong {
    color: var(--fg);
  }

  .guide-display {
    margin: 0;
    padding: 1rem;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--fg);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-y: auto;
    max-height: 50vh;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .copy-feedback {
    margin-right: auto;
    font-size: 0.8rem;
    color: #166534;
    font-weight: 500;
  }

  .btn-action {
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    background: var(--panel-bg);
    color: var(--fg);
    padding: 0.4rem 0.85rem;
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-action:hover {
    background: var(--panel);
  }

  .btn-action.primary {
    background: #0f766e;
    color: #ffffff;
    border-color: #0d9488;
  }

  .btn-action.primary:hover {
    background: #115e59;
  }
</style>
