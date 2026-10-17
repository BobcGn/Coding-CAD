<script module lang="ts">
  /**
   * 默认折叠组件数阈值预留常量（未经批准的临时值，待用户裁定 / Unapproved temporary value pending user decision）
   * 说明：此常量未作为 Props 的默认值（defaultCollapseThreshold 缺省为 undefined，默认保持完全展开，不自动折叠）。
   * 若外部调用方显式传入此数值，当系统组件总数（kind === 'component'）严格大于该阈值（> threshold）时初始折叠全部模块容器。
   */
  export const DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50;
</script>

<script lang="ts">
  import { untrack } from "svelte";
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
    selectedNodeIds?: readonly string[];
    /**
     * 默认自动折叠阈值（组件数量 kind === 'component' 严格大于此阈值时初始折叠全部模块容器）。
     * 标注：当前在代码中定义为 DEFAULT_UNAPPROVED_COLLAPSE_THRESHOLD = 50，属于未经批准的临时值（Unapproved temporary value），待用户决策裁定。
     * 当前实际行为：缺省为 undefined，调用处 (+page.svelte) 未传入该参数，因此产品默认视图保持完全展开，不执行自动折叠；
     * 若未设置 (undefined) 或设置为 Infinity 则保持默认平铺展开；仅当显式传入数值且 componentCount > threshold 时折叠容器。
     */
    defaultCollapseThreshold?: number;
    onViewStateChange?: (state: LayoutState) => void;
    onSelectionChange?: (nodeIds: readonly string[], edgeIds: readonly string[]) => void;
    onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  }

  let {
    projection,
    layout,
    viewState,
    selectedNodeIds = [],
    defaultCollapseThreshold,
    onViewStateChange,
    onSelectionChange,
    onViewportChange
  }: Props = $props();

  let flowNodes = $state.raw<ArchitectureFlowNode[]>([]);
  let flowEdges = $state.raw<ArchitectureFlowEdge[]>([]);
  let compact = $state(false);
  let collapsedGroupIds = $state(new Set<string>());
  const nodeTypes = { architecture: ArchitectureNode };

  let initialCollapsedApplied = false;
  $effect(() => {
    if (!initialCollapsedApplied && defaultCollapseThreshold !== undefined) {
      const componentCount = projection.layoutGraph.nodes.filter((n) => n.kind === "component").length;
      if (componentCount > defaultCollapseThreshold) {
        const groupIds = layout.nodes.filter((n) => n.kind === "group").map((n) => n.id);
        if (groupIds.length > 0) {
          collapsedGroupIds = new Set(groupIds);
          initialCollapsedApplied = true;
        }
      }
    }
  });

  function handleToggleCollapse(groupId: string): void {
    const next = new Set(collapsedGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    collapsedGroupIds = next;
  }

  let previousSelectedNodeIds: readonly string[] = [];

  $effect(() => {
    const current = selectedNodeIds;
    if (current && current.length > 0) {
      const newlySelected = current.filter((id) => !previousSelectedNodeIds.includes(id));
      for (const selectedId of newlySelected) {
        const parentId = projection.abstraction?.parentByComponentId?.[selectedId]
          ?? layout.nodes.find((n) => n.id === selectedId)?.parentId;
        if (parentId && collapsedGroupIds.has(parentId)) {
          const next = new Set(collapsedGroupIds);
          next.delete(parentId);
          collapsedGroupIds = next;
        }
      }
    }
    previousSelectedNodeIds = current ?? [];
  });

  $effect(() => {
    const adapted = toSvelteFlowProjection(projection, layout, viewState, {
      collapsedGroupIds,
      onToggleCollapse: handleToggleCollapse
    });
    flowNodes = adapted.nodes.map((n) => ({
      ...n,
      selected: selectedNodeIds.includes(n.id)
    }));
    flowEdges = [...adapted.edges];
  });

  const handleDragStop: NodeTargetEventWithPointer<MouseEvent | TouchEvent, ArchitectureFlowNode> = ({ nodes }) => {
    const moved = nodes[0];
    if (moved === undefined) return;
    const parent = viewState.nodes.find((node) => node.id === moved.parentId);
    const absolute = parent === undefined ? moved.position : {
      x: moved.position.x + parent.position.x, y: moved.position.y + parent.position.y
    };
    onViewStateChange?.(persistDraggedPosition(viewState, moved.id, absolute));
  };

  const handleSelection: OnSelectionChange<ArchitectureFlowNode, ArchitectureFlowEdge> = ({ nodes, edges }) => {
    // Svelte Flow may emit selection from an effect. Parent Inspector reads
    // must not become dependencies of that effect (selection feedback loop).
    untrack(() => onSelectionChange?.(nodes.map(({ id }) => id), edges.map(({ id }) => id)));
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
<div
  class:semantic-compact={compact}
  data-density={compact ? "compact" : "standard"}
  data-layout-status={layout.status}
  data-layout-solver="elk"
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
