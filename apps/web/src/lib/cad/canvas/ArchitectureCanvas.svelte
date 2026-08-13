<script lang="ts">
  import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    SvelteFlow,
    type NodeTargetEventWithPointer,
    type OnMove,
    type OnSelectionChange
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import type { ArchitectureLayoutProjection, LayoutResult, LayoutState } from "@coding-cad/architecture-layout";
  import ArchitectureNode from "./nodes/ArchitectureNode.svelte";
  import {
    toSvelteFlowProjection,
    type ArchitectureFlowEdge,
    type ArchitectureFlowNode
  } from "$lib/layout/adapters/svelte-flow-adapter.js";
  import { persistDraggedPosition } from "$lib/architecture/state/workspace-view-state.js";

  interface Props {
    projection: ArchitectureLayoutProjection;
    layout: LayoutResult;
    viewState: LayoutState;
    onViewStateChange?: (state: LayoutState) => void;
    onSelectionChange?: (nodeIds: readonly string[], edgeIds: readonly string[]) => void;
    onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  }

  let {
    projection,
    layout,
    viewState,
    onViewStateChange,
    onSelectionChange,
    onViewportChange
  }: Props = $props();

  let flowNodes = $state.raw<ArchitectureFlowNode[]>([]);
  let flowEdges = $state.raw<ArchitectureFlowEdge[]>([]);
  let compact = $state(false);
  const nodeTypes = { architecture: ArchitectureNode };

  $effect(() => {
    const adapted = toSvelteFlowProjection(projection, layout, viewState);
    flowNodes = [...adapted.nodes];
    flowEdges = [...adapted.edges];
  });

  const handleDragStop: NodeTargetEventWithPointer<MouseEvent | TouchEvent, ArchitectureFlowNode> = ({ nodes }) => {
    const moved = nodes[0];
    if (moved === undefined) return;
    onViewStateChange?.(persistDraggedPosition(viewState, moved.id, moved.position));
  };

  const handleSelection: OnSelectionChange<ArchitectureFlowNode, ArchitectureFlowEdge> = ({ nodes, edges }) => {
    onSelectionChange?.(nodes.map(({ id }) => id), edges.map(({ id }) => id));
  };

  const handleMove: OnMove = (_event, viewport) => {
    compact = viewport.zoom < 0.65;
    onViewportChange?.(viewport);
  };
</script>

<section class:semantic-compact={compact} data-density={compact ? "compact" : "standard"} aria-label="Architecture Canvas">
  <SvelteFlow
    bind:nodes={flowNodes}
    bind:edges={flowEdges}
    {nodeTypes}
    fitView
    minZoom={0.2}
    maxZoom={2}
    nodesConnectable={false}
    onnodedragstop={handleDragStop}
    onselectionchange={handleSelection}
    onmove={handleMove}
  >
    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
    <Controls />
    <MiniMap pannable zoomable />
  </SvelteFlow>
</section>

<style>
  section {
    width: 100%;
    height: 100%;
    min-height: 36rem;
    overflow: hidden;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    background: #f1f5f9;
  }
</style>
