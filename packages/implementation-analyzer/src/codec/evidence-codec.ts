/**
 * Typed Evidence Codec for reverse-engineered Architecture IR.
 *
 * Encodes and decodes evidence provenance, layer priors, dependency kinds,
 * usage cross-validation status, and public exports into IR tags and constraints.
 *
 * NOTE ON CONFIDENCE:
 * Confidence values represent Layer Priors (层级先验) based on extraction authority,
 * not statistical empirical accuracy:
 * - declared (1.00): explicitly declared in package manifests or workspace configuration.
 * - resolved (0.85 - 0.90): verified by TypeScript Compiler API syntactic AST resolution.
 * - inferred (0.60 - 0.70): directory grouping or naming pattern heuristics.
 */

export type EvidenceSource = "declared" | "resolved" | "inferred";
export type DependencyKind = "runtime" | "dev" | "peer";
export type UsageStatus = "declared-and-used" | "declared-unused" | "undeclared-used";

export interface ComponentEvidence {
  readonly source: EvidenceSource;
  /** Layer prior (层级先验), not empirical statistical accuracy. */
  readonly confidence: number;
  readonly path: string;
  readonly exports: readonly string[];
}

export interface ConnectionEvidence {
  readonly source: EvidenceSource;
  /** Layer prior (层级先验), not empirical statistical accuracy. */
  readonly confidence: number;
  readonly dependencyKind?: DependencyKind | undefined;
  readonly usageStatus?: UsageStatus | undefined;
  readonly evidencePath?: string | undefined;
  readonly humanDescription?: string | undefined;
}

const TAG_PREFIX_SOURCE = "source:";
const TAG_PREFIX_CONFIDENCE = "confidence:";
const TAG_PREFIX_PATH = "path:";
const TAG_PREFIX_EXPORT = "export:";

const CONSTRAINT_PREFIX_SOURCE = "source:";
const CONSTRAINT_PREFIX_CONFIDENCE = "Detection confidence: ";
const CONSTRAINT_PREFIX_KIND = "kind:";
const CONSTRAINT_PREFIX_USAGE = "usage:";
const CONSTRAINT_PREFIX_EVIDENCE = "evidence:";

/**
 * Encodes ComponentEvidence into tags.
 * Preserves the base "implementation-analyzer" tag and adds typed tags.
 */
export function encodeComponentTags(evidence: ComponentEvidence): string[] {
  const tags: string[] = [
    "implementation-analyzer",
    `${TAG_PREFIX_SOURCE}${evidence.source}`,
    `${TAG_PREFIX_CONFIDENCE}${evidence.confidence.toFixed(2)}`,
    `${TAG_PREFIX_PATH}${evidence.path}`
  ];

  for (const exp of evidence.exports) {
    tags.push(`${TAG_PREFIX_EXPORT}${exp}`);
  }

  return tags;
}

/**
 * Decodes ComponentEvidence from a Component's tags and description.
 */
export function decodeComponentEvidence(component: {
  readonly tags?: readonly string[] | undefined;
  readonly description?: string | undefined;
}): ComponentEvidence {
  const tags = component.tags ?? [];

  let source: EvidenceSource = "inferred";
  let confidence = 0.65;
  let path = "";
  const exports: string[] = [];

  for (const tag of tags) {
    if (tag.startsWith(TAG_PREFIX_SOURCE)) {
      const raw = tag.slice(TAG_PREFIX_SOURCE.length) as EvidenceSource;
      if (raw === "declared" || raw === "resolved" || raw === "inferred") {
        source = raw;
      }
    } else if (tag.startsWith(TAG_PREFIX_CONFIDENCE)) {
      const num = parseFloat(tag.slice(TAG_PREFIX_CONFIDENCE.length));
      if (!isNaN(num)) confidence = num;
    } else if (tag.startsWith(TAG_PREFIX_PATH)) {
      path = tag.slice(TAG_PREFIX_PATH.length);
    } else if (tag.startsWith(TAG_PREFIX_EXPORT)) {
      exports.push(tag.slice(TAG_PREFIX_EXPORT.length));
    }
  }

  // Fallback path from description if not tagged
  if (!path && component.description) {
    const pathMatch = /Repository path:\s*([^.\s]+)/.exec(component.description);
    if (pathMatch) path = pathMatch[1]!;
  }

  return { source, confidence, path, exports };
}

/**
 * Encodes ConnectionEvidence into Connection constraints.
 */
export function encodeConnectionConstraints(evidence: ConnectionEvidence): string[] {
  const constraints: string[] = [
    `${CONSTRAINT_PREFIX_SOURCE}${evidence.source}`,
    `${CONSTRAINT_PREFIX_CONFIDENCE}${evidence.confidence.toFixed(2)}`
  ];

  if (evidence.dependencyKind) {
    constraints.push(`${CONSTRAINT_PREFIX_KIND}${evidence.dependencyKind}`);
  }

  if (evidence.usageStatus) {
    constraints.push(`${CONSTRAINT_PREFIX_USAGE}${evidence.usageStatus}`);
  }

  if (evidence.evidencePath) {
    constraints.push(`${CONSTRAINT_PREFIX_EVIDENCE}${evidence.evidencePath}`);
  }

  return constraints;
}

/**
 * Decodes ConnectionEvidence from a Connection's constraints and description.
 */
export function decodeConnectionEvidence(connection: {
  readonly constraints?: readonly string[] | undefined;
  readonly description?: string | undefined;
}): ConnectionEvidence {
  const constraints = connection.constraints ?? [];

  let source: EvidenceSource = "inferred";
  let confidence = 0.65;
  let dependencyKind: DependencyKind | undefined;
  let usageStatus: UsageStatus | undefined;
  let evidencePath: string | undefined;

  for (const c of constraints) {
    if (c.startsWith(CONSTRAINT_PREFIX_SOURCE)) {
      const raw = c.slice(CONSTRAINT_PREFIX_SOURCE.length) as EvidenceSource;
      if (raw === "declared" || raw === "resolved" || raw === "inferred") {
        source = raw;
      }
    } else if (c.startsWith(CONSTRAINT_PREFIX_CONFIDENCE)) {
      const num = parseFloat(c.slice(CONSTRAINT_PREFIX_CONFIDENCE.length));
      if (!isNaN(num)) confidence = num;
    } else if (c.startsWith(CONSTRAINT_PREFIX_KIND)) {
      const raw = c.slice(CONSTRAINT_PREFIX_KIND.length) as DependencyKind;
      if (raw === "runtime" || raw === "dev" || raw === "peer") {
        dependencyKind = raw;
      }
    } else if (c.startsWith(CONSTRAINT_PREFIX_USAGE)) {
      const raw = c.slice(CONSTRAINT_PREFIX_USAGE.length) as UsageStatus;
      if (raw === "declared-and-used" || raw === "declared-unused" || raw === "undeclared-used") {
        usageStatus = raw;
      }
    } else if (c.startsWith(CONSTRAINT_PREFIX_EVIDENCE)) {
      evidencePath = c.slice(CONSTRAINT_PREFIX_EVIDENCE.length);
    }
  }

  return {
    source,
    confidence,
    dependencyKind,
    usageStatus,
    evidencePath,
    humanDescription: connection.description
  };
}

/**
 * Provides a bilingual human explanation of the layer prior.
 */
export function formatLayerPriorExplanation(source: EvidenceSource, confidence: number): string {
  switch (source) {
    case "declared":
      return `Layer Prior ${confidence.toFixed(2)} (Declared): Authoritative declaration from package manifest (package.json / workspace).`;
    case "resolved":
      return `Layer Prior ${confidence.toFixed(2)} (Resolved): Syntactic AST resolution verified by TypeScript Compiler API.`;
    case "inferred":
      return `Layer Prior ${confidence.toFixed(2)} (Inferred): Structural directory or naming pattern heuristic.`;
  }
}
