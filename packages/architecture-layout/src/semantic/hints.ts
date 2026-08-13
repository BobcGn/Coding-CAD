import type { LayoutSemanticRole } from "./roles.js";

export type PreferredRank = "entry" | "application" | "async" | "data" | "external";
export type PortDirection = "incoming" | "outgoing" | "bidirectional";

export interface SemanticLayoutHints {
  readonly preferredRank: PreferredRank;
  readonly portDirection: PortDirection;
  readonly infrastructure: boolean;
  readonly externalBoundary: boolean;
}

export function hintsForRole(role: LayoutSemanticRole): SemanticLayoutHints {
  switch (role) {
    case "actor":
    case "gateway":
      return { preferredRank: "entry", portDirection: "outgoing", infrastructure: false, externalBoundary: false };
    case "database":
    case "storage":
    case "cache":
      return { preferredRank: "data", portDirection: "incoming", infrastructure: true, externalBoundary: false };
    case "queue":
      return { preferredRank: "async", portDirection: "bidirectional", infrastructure: true, externalBoundary: false };
    case "external":
      return { preferredRank: "external", portDirection: "bidirectional", infrastructure: true, externalBoundary: true };
    case "service":
    case "unknown":
      return { preferredRank: "application", portDirection: "bidirectional", infrastructure: false, externalBoundary: false };
  }
}
