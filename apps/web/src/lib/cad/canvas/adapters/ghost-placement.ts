/**
 * Ghost placement adapter (D-007 Option B: Local Extension).
 *
 * Computes local placement coordinates for a proposed Ghost component
 * ensuring ZERO overlap with all formal nodes and containers, and without
 * altering the positions of formal nodes.
 *
 * Pure function: runs in both Node.js (tests) and browser (runtime).
 */

export interface Rect {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly parentId?: string | undefined;
  readonly kind?: "component" | "group" | undefined;
}

export interface GhostPlacementInput {
  readonly ghostId: string;
  readonly ghostSize?: { readonly width: number; readonly height: number } | undefined;
  /** IDs of formal components connected to this ghost component */
  readonly relatedComponentIds?: readonly string[] | undefined;
  /** Formal nodes currently placed on the canvas */
  readonly formalNodes: readonly Rect[];
  /** Margin/gap to maintain around nodes in pixels (default 24) */
  readonly padding?: number | undefined;
  /** Primary layout direction ("LR" or "TB", default "LR") */
  readonly direction?: "LR" | "TB" | undefined;
  /** Optional container ID if ghost is declared inside a container */
  readonly targetContainerId?: string | undefined;
}

export interface GhostPlacementResult {
  readonly position: { readonly x: number; readonly y: number };
  readonly parentId?: string | undefined;
  readonly placedOutsideContainer?: boolean | undefined;
  readonly containerNotice?: string | undefined;
}

const DEFAULT_GHOST_SIZE = { width: 220, height: 90 };
const DEFAULT_PADDING = 24;

/**
 * Checks whether two rectangles intersect, taking optional padding into account.
 */
export function intersects(a: Rect, b: Rect, padding = 0): boolean {
  return (
    a.x < b.x + b.width + padding &&
    a.x + a.width + padding > b.x &&
    a.y < b.y + b.height + padding &&
    a.y + a.height + padding > b.y
  );
}

/**
 * Checks whether a candidate rectangle intersects with any rectangle in a list.
 */
export function hasAnyOverlap(candidate: Rect, others: readonly Rect[], padding = 0): boolean {
  for (const other of others) {
    if (other.id === candidate.id) continue;
    if (intersects(candidate, other, padding)) {
      return true;
    }
  }
  return false;
}

/**
 * Computes deterministic, local placement for a Ghost node with zero formal overlap.
 */
export function calculateGhostPlacement(input: GhostPlacementInput): GhostPlacementResult {
  const ghostSize = input.ghostSize ?? DEFAULT_GHOST_SIZE;
  const padding = input.padding ?? DEFAULT_PADDING;
  const direction = input.direction ?? "LR";
  const formalComponents = input.formalNodes.filter((n) => n.kind !== "group");
  const formalContainers = input.formalNodes.filter((n) => n.kind === "group");

  // If there are no formal nodes, place at origin with default margin
  if (input.formalNodes.length === 0) {
    return {
      position: { x: 100, y: 100 }
    };
  }

  // Find primary anchor node from relatedComponentIds
  let anchor: Rect | undefined;
  if (input.relatedComponentIds && input.relatedComponentIds.length > 0) {
    for (const relatedId of input.relatedComponentIds) {
      const match = formalComponents.find((n) => n.id === relatedId);
      if (match) {
        anchor = match;
        break;
      }
    }
  }

  // If targetContainerId is specified, check if free space exists inside the container
  if (input.targetContainerId) {
    const targetContainer = formalContainers.find((c) => c.id === input.targetContainerId);
    if (targetContainer) {
      const containerChildren = formalComponents.filter((c) => c.parentId === targetContainer.id);
      const insidePlacement = findInsideContainerSlot(
        targetContainer,
        containerChildren,
        ghostSize,
        padding
      );
      if (insidePlacement) {
        return {
          position: insidePlacement,
          parentId: targetContainer.id
        };
      }
      // If container has no free space, place immediately outside to the right of the container
      const outsideCandidate: Rect = {
        id: input.ghostId,
        x: targetContainer.x + targetContainer.width + padding * 2,
        y: targetContainer.y,
        width: ghostSize.width,
        height: ghostSize.height
      };
      if (!hasAnyOverlap(outsideCandidate, input.formalNodes, padding)) {
        return {
          position: { x: outsideCandidate.x, y: outsideCandidate.y },
          placedOutsideContainer: true,
          containerNotice: `所属容器 '${targetContainer.id}' 内部无可用空间，Ghost 放置于容器外侧`
        };
      }
      // Fall through to general placement using container as anchor
      anchor = targetContainer;
    }
  }

  // If we have an anchor (related node or container)
  if (anchor) {
    const candidateSlots = generateAnchorSlots(anchor, ghostSize, padding, direction);
    for (const slot of candidateSlots) {
      const candidate: Rect = {
        id: input.ghostId,
        x: slot.x,
        y: slot.y,
        width: ghostSize.width,
        height: ghostSize.height
      };
      if (!hasAnyOverlap(candidate, input.formalNodes, padding)) {
        return {
          position: slot
        };
      }
    }
  }

  // Fallback: Place in clean staging area adjacent to the global bounding box of all formal nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of input.formalNodes) {
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.x + node.width > maxX) maxX = node.x + node.width;
    if (node.y + node.height > maxY) maxY = node.y + node.height;
  }

  // In LR direction, place to the right of the full graph; in TB, place below
  const fallbackBase = direction === "LR"
    ? { x: maxX + padding * 2, y: minY }
    : { x: minX, y: maxY + padding * 2 };

  for (let step = 0; step < 50; step++) {
    const candidatePos = direction === "LR"
      ? { x: fallbackBase.x, y: fallbackBase.y + step * (ghostSize.height + padding) }
      : { x: fallbackBase.x + step * (ghostSize.width + padding), y: fallbackBase.y };

    const candidate: Rect = {
      id: input.ghostId,
      x: candidatePos.x,
      y: candidatePos.y,
      width: ghostSize.width,
      height: ghostSize.height
    };

    if (!hasAnyOverlap(candidate, input.formalNodes, padding)) {
      return { position: candidatePos };
    }
  }

  // Mathematically guaranteed non-overlapping position
  return {
    position: { x: maxX + padding * 4, y: minY }
  };
}

function generateAnchorSlots(
  anchor: Rect,
  size: { width: number; height: number },
  gap: number,
  direction: "LR" | "TB"
): readonly { x: number; y: number }[] {
  const slots: { x: number; y: number }[] = [];

  const rightX = anchor.x + anchor.width + gap * 2;
  const leftX = anchor.x - size.width - gap * 2;
  const belowY = anchor.y + anchor.height + gap * 2;
  const aboveY = anchor.y - size.height - gap * 2;

  if (direction === "LR") {
    // Primary: immediately to the right
    slots.push({ x: rightX, y: anchor.y });
    slots.push({ x: rightX, y: belowY });
    slots.push({ x: rightX, y: aboveY });
    // Secondary: below or above
    slots.push({ x: anchor.x, y: belowY });
    slots.push({ x: anchor.x, y: aboveY });
    // Tertiary: to the left
    slots.push({ x: leftX, y: anchor.y });
    // Outward expanded columns
    for (let col = 1; col <= 5; col++) {
      const stepX = rightX + col * (size.width + gap);
      slots.push({ x: stepX, y: anchor.y });
      slots.push({ x: stepX, y: belowY });
      slots.push({ x: stepX, y: aboveY });
    }
  } else {
    // TB Primary: immediately below
    slots.push({ x: anchor.x, y: belowY });
    slots.push({ x: rightX, y: belowY });
    slots.push({ x: leftX, y: belowY });
    // Secondary: right or left
    slots.push({ x: rightX, y: anchor.y });
    slots.push({ x: leftX, y: anchor.y });
    // Outward expanded rows
    for (let row = 1; row <= 5; row++) {
      const stepY = belowY + row * (size.height + gap);
      slots.push({ x: anchor.x, y: stepY });
      slots.push({ x: rightX, y: stepY });
      slots.push({ x: leftX, y: stepY });
    }
  }

  return slots;
}

function findInsideContainerSlot(
  container: Rect,
  children: readonly Rect[],
  size: { width: number; height: number },
  padding: number
): { x: number; y: number } | undefined {
  // Container padding from header
  const headerHeight = 36;
  const minInsideX = container.x + padding;
  const minInsideY = container.y + headerHeight + padding;
  const maxInsideX = container.x + container.width - size.width - padding;
  const maxInsideY = container.y + container.height - size.height - padding;

  if (minInsideX > maxInsideX || minInsideY > maxInsideY) {
    return undefined;
  }

  // Try slots inside
  for (let y = minInsideY; y <= maxInsideY; y += size.height + padding) {
    for (let x = minInsideX; x <= maxInsideX; x += size.width + padding) {
      const candidate: Rect = {
        id: "candidate",
        x,
        y,
        width: size.width,
        height: size.height
      };
      if (!hasAnyOverlap(candidate, children, padding)) {
        return { x, y };
      }
    }
  }

  return undefined;
}
