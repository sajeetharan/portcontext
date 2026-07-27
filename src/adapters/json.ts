import type { PortContext } from "../schema.js";

/** Render the canonical, tool-agnostic JSON representation. */
export function toJson(ctx: PortContext): string {
  return JSON.stringify(ctx, null, 2);
}
