<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import type { ArchitectureNodeData } from "$lib/layout/adapters/svelte-flow-adapter.js";

  let { data }: { data: ArchitectureNodeData } = $props();
</script>

<article
  class="architecture-node"
  class:group={data.kind === "group"}
  class:collapsed={data.collapsed}
  class:ghost-proposed={data.ghostStatus === "proposed"}
  class:ghost-pending-change={data.ghostStatus === "pending-change"}
  class:ghost-pending-deletion={data.ghostStatus === "pending-deletion"}
  class:ghost-predicting={data.ghostPredictionStatus === "predicting"}
  class:ghost-predicted={data.ghostPredictionStatus === "predicted"}
  class:ghost-unavailable={data.ghostPredictionStatus === "unavailable"}
  data-role={data.role}
  data-kind={data.kind}
  data-ghost={data.isGhost ? "true" : undefined}
  data-ghost-status={data.ghostStatus}
  data-ghost-prediction-status={data.ghostPredictionStatus}
  data-ghost-reason-code={data.ghostReasonCode}
  data-ghost-heuristic-x={data.ghostHeuristicPosition?.x}
  data-ghost-heuristic-y={data.ghostHeuristicPosition?.y}
  aria-label={data.ghostNotice ? `${data.ghostLabel} ${data.label}, ${data.role} - ${data.ghostNotice}` : (data.ghostLabel ? `${data.ghostLabel} ${data.label}, ${data.role}` : `${data.label}, ${data.role}`)}
>
  {#if data.ghostStatus}
    <div
      class="ghost-badge-bar {data.ghostPredictionStatus ?? data.ghostStatus}"
      data-testid="ghost-badge"
      aria-label={data.ghostLabel}
    >
      <span class="ghost-badge-text">{data.ghostLabel}</span>
    </div>
  {/if}
  {#if data.ghostNotice}
    <div class="ghost-notice" data-testid="ghost-notice" title={data.ghostNotice}>
      {data.ghostNotice}
    </div>
  {/if}
  {#if data.kind === "group"}
    <div class="group-header">
      <span class="group-label">{data.label}</span>
      {#if data.memberCount !== undefined && data.memberCount > 0}
        <span class="group-count" data-testid="group-hidden-count">
          {data.collapsed ? `(${data.hiddenCount} hidden)` : `(${data.memberCount})`}
        </span>
        <button
          type="button"
          class="group-toggle nodrag nopan"
          data-testid="group-toggle-collapse"
          onclick={(e) => {
            e.stopPropagation();
            if (data.groupId) data.onToggleCollapse?.(data.groupId);
          }}
          aria-label={data.collapsed ? `Expand ${data.label}` : `Collapse ${data.label}`}
        >
          {data.collapsed ? "+" : "−"}
        </button>
      {/if}
    </div>
  {:else}
  <Handle type="target" position={Position.Left} />
  <span class="compact" aria-hidden="true">{data.compactLabel}</span>
  <div class="standard">
    <strong class:strikethrough={data.ghostStatus === "pending-deletion"}>{data.label}</strong>
    <span>{data.role}</span>
  </div>
  <Handle type="source" position={Position.Right} />
  {/if}
</article>

<style>
  .architecture-node {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 180px;
    min-height: 76px;
    display: grid;
    place-items: center;
    border: 1px solid #334155;
    border-radius: 10px;
    background: #f8fafc;
    color: #0f172a;
    box-shadow: 0 8px 20px rgb(15 23 42 / 10%);
  }

  .group { position: relative; background: rgb(226 232 240 / 35%); border-style: dashed; box-shadow: none; }
  .group-header {
    position: absolute;
    top: 4px;
    left: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 11px;
    color: #475569;
    z-index: 10;
    pointer-events: auto;
  }
  .group-label { font-weight: 600; }
  .group-count { font-size: 10px; color: #64748b; font-weight: 500; }
  .group-toggle {
    background: transparent;
    border: 1px solid #94a3b8;
    border-radius: 4px;
    padding: 0 4px;
    font-size: 10px;
    line-height: 14px;
    cursor: pointer;
    color: #475569;
    position: relative;
    z-index: 20;
    pointer-events: auto;
  }
  .group-toggle:hover {
    background: #e2e8f0;
  }
  .collapsed {
    min-height: 48px;
    border-style: solid;
  }

  .standard {
    display: grid;
    gap: 0.35rem;
    text-align: center;
  }

  .standard span {
    color: #475569;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .compact {
    display: none;
    font-weight: 700;
  }

  :global(.semantic-compact) .standard { display: none; }
  :global(.semantic-compact) .compact { display: inline; }
  :global(.semantic-compact) .architecture-node { min-width: 56px; min-height: 42px; }

  .ghost-proposed {
    border: 2px dashed #8b5cf6 !important;
    background: #f5f3ff !important;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25) !important;
  }
  .ghost-pending-change {
    border: 2px dashed #f59e0b !important;
    background: #fefce8 !important;
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2) !important;
  }
  .ghost-pending-deletion {
    border: 2px dashed #ef4444 !important;
    background: #fef2f2 !important;
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2) !important;
  }
  .ghost-badge-bar {
    position: absolute;
    top: -12px;
    left: 8px;
    right: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 14px;
    z-index: 15;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  .ghost-badge-bar.proposed {
    background: #7c3aed;
    color: #ffffff;
  }
  .ghost-badge-bar.predicting {
    background: #0284c7;
    color: #ffffff;
  }
  .ghost-badge-bar.predicted {
    background: #059669;
    color: #ffffff;
  }
  .ghost-badge-bar.unavailable {
    background: #64748b;
    color: #ffffff;
  }
  .ghost-badge-bar.pending-change {
    background: #d97706;
    color: #ffffff;
  }
  .ghost-badge-bar.pending-deletion {
    background: #dc2626;
    color: #ffffff;
  }
  .ghost-notice {
    font-size: 9px;
    color: #6d28d9;
    padding: 0 4px;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .strikethrough {
    text-decoration: line-through;
    opacity: 0.65;
  }
</style>
