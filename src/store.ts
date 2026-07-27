import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import type { PortContext } from "./schema.js";

export const DEFAULT_PATH = ".portcontext/context.json";

export function emptyContext(owner?: string): PortContext {
  return {
    version: 1,
    owner,
    updatedAt: new Date().toISOString(),
    entries: [],
  };
}

export async function loadContext(path = DEFAULT_PATH): Promise<PortContext> {
  if (!existsSync(path)) return emptyContext();
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as PortContext;
}

export async function saveContext(
  ctx: PortContext,
  path = DEFAULT_PATH,
): Promise<void> {
  ctx.updatedAt = new Date().toISOString();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(ctx, null, 2) + "\n", "utf8");
}
