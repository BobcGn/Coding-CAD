<script lang="ts">
  import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    SvelteFlow,
    type NodeEventWithPointer,
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

  // onselectionchange can be unreliable across Svelte Flow versions, so node
  // clicks explicitly report selection via the node DOM data-id (P3.3
  // selection navigation). This is a fallback that always works.
  const handleNodeClick: NodeEventWithPointer<MouseEvent | TouchEvent, ArchitectureFlowNode> = ({ node }) => {
    onSelectionChange?.([node.id], []);
  };

  function selectNodeFromTarget(target: EventTarget | null): void {
    const element = target as Element | null;
    const nodeElement = element?.closest?.(".svelte-flow__node");
    const nodeId = nodeElement?.getAttribute("data-id");
    if (nodeId !== undefined && nodeId !== null) {
      onSelectionChange?.([nodeId], []);
    }
  }

  function handleSectionClick(event: MouseEvent): void {
    selectNodeFromTarget(event.target);
  }

  function handleSectionKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNodeFromTarget(event.target);
    }
  }

  const handleMove: OnMove = (_event, viewport) => {
    compact = viewport.zoom < 0.65;
    onViewportChange?.(viewport);
  };
</script>

<div
  class:semantic-compact={compact}
  data-density={compact ? "compact" : "standard"}
  aria-label="Architecture Canvas"
  role="application"
  onclick={handleSectionClick}
  onkeydown={handleSectionKeyDown}
>
  <SvelteFlow
    bind:nodes={flowNodes}
    bind:edges={flowEdges}
    {nodeTypes}
    fitView
    style="width: 100%; height: 100%;"
    minZoom={0.2}
    maxZoom={2}
    nodesConnectable={false}
    onnodedragstop={handleDragStop}
    onnodeclick={handleNodeClick}
    onselectionchange={handleSelection}
    onmove={handleMove}
  >
    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
    <Controls />
    <MiniMap pannable zoomable />
  </SvelteFlow>
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    min-height: 36rem;
    overflow: hidden;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    background: #f1f5f9;
  }
</style>
