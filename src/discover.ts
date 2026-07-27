import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Well-known instruction files portcontext can import from. */
export const KNOWN_FILES = [
  "AGENTS.md",
  ".github/copilot-instructions.md",
  "CLAUDE.md",
  ".cursorrules",
];

/**
 * Find existing AI-instruction files in `cwd` (including any
 * `.cursor/rules/*.mdc`). Returns paths relative to `cwd`.
 */
export function discoverContextFiles(cwd: string = process.cwd()): string[] {
  const found: string[] = [];
  for (const rel of KNOWN_FILES) {
    if (existsSync(join(cwd, rel))) found.push(rel);
  }
  const cursorRules = join(cwd, ".cursor", "rules");
  if (existsSync(cursorRules)) {
    for (const f of readdirSync(cursorRules)) {
      if (f.endsWith(".mdc")) found.push(join(".cursor", "rules", f));
    }
  }
  return found;
}
