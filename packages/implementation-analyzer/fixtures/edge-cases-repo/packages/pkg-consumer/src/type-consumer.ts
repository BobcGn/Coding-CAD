import type { SharedContext } from "@edge/pkg-core";

export function processContext(ctx: SharedContext): string {
  return ctx.id;
}
