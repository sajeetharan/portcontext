import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile, chmod } from "node:fs/promises";

const execFileP = promisify(execFile);

const MARKER = "# portcontext:auto-export";

const HOOK_BODY = `${MARKER}
# Regenerate AI tool files on commit so they never drift.
if command -v portcontext >/dev/null 2>&1; then
  portcontext export --to all >/dev/null 2>&1
else
  npx --yes portcontext export --to all >/dev/null 2>&1
fi
git add AGENTS.md .github/copilot-instructions.md CLAUDE.md .cursor/rules/portcontext.mdc >/dev/null 2>&1 || true
`;

/** Install (or refresh) a git pre-commit hook that runs `export --to all`. */
export async function installHook(): Promise<string> {
  let gitDir: string;
  try {
    const { stdout } = await execFileP("git", ["rev-parse", "--git-dir"]);
    gitDir = stdout.trim();
  } catch {
    throw new Error("Not a git repository. Run `git init` first.");
  }

  const hooksDir = join(gitDir, "hooks");
  const hookPath = join(hooksDir, "pre-commit");

  if (existsSync(hookPath)) {
    const current = await readFile(hookPath, "utf8");
    if (current.includes(MARKER)) {
      return "pre-commit hook already installed.";
    }
    // Append to the existing hook rather than clobbering it.
    const appended = current.replace(/\n*$/, "\n\n") + HOOK_BODY;
    await writeFile(hookPath, appended, "utf8");
    await chmod(hookPath, 0o755).catch(() => {});
    return `Appended portcontext step to existing hook: ${hookPath}`;
  }

  await writeFile(hookPath, `#!/bin/sh\n${HOOK_BODY}`, "utf8");
  await chmod(hookPath, 0o755).catch(() => {});
  return `Installed pre-commit hook: ${hookPath}`;
}
