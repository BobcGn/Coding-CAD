<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import type { ArchitectureNodeData } from "$lib/layout/adapters/svelte-flow-adapter.js";

  let { data }: { data: ArchitectureNodeData } = $props();
</script>

<article class="architecture-node" data-role={data.role} aria-label={`${data.label}, ${data.role}`}>
  <Handle type="target" position={Position.Left} />
  <span class="compact" aria-hidden="true">{data.compactLabel}</span>
  <div class="standard">
    <strong>{data.label}</strong>
    <span>{data.role}</span>
  </div>
  <Handle type="source" position={Position.Right} />
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
</style>
