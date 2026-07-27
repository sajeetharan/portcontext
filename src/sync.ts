import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, copyFile } from "node:fs/promises";
import { DEFAULT_PATH } from "./store.js";

const execFileP = promisify(execFile);

/** Directory holding the synced context repo. Override with PORTCONTEXT_SYNC_DIR. */
export function syncDir(): string {
  return process.env.PORTCONTEXT_SYNC_DIR ?? join(homedir(), ".portcontext-sync");
}

function syncFile(): string {
  return join(syncDir(), "context.json");
}

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileP("git", args, { cwd });
  return stdout.trim();
}

async function isRepo(dir: string): Promise<boolean> {
  return existsSync(join(dir, ".git"));
}

/** Initialize the sync repo, optionally wiring a remote and pulling from it. */
export async function syncSetup(remote?: string): Promise<string[]> {
  const dir = syncDir();
  const log: string[] = [];
  await mkdir(dir, { recursive: true });

  if (!(await isRepo(dir))) {
    await git(["init", "-b", "main"], dir);
    log.push(`Initialized sync repo at ${dir}`);
  }

  if (remote) {
    try {
      await git(["remote", "remove", "origin"], dir);
    } catch {
      /* no existing remote */
    }
    await git(["remote", "add", "origin", remote], dir);
    log.push(`Set remote origin -> ${remote}`);
    try {
      await git(["pull", "origin", "main"], dir);
      log.push("Pulled existing context from remote.");
    } catch {
      log.push("Remote empty or unreachable; will push on first `sync push`.");
    }
  }
  return log;
}

/** Copy the local context into the sync repo and push it to the remote. */
export async function syncPush(message?: string): Promise<string> {
  const dir = syncDir();
  if (!(await isRepo(dir))) {
    throw new Error("Sync not set up. Run: portcontext sync setup --remote <git-url>");
  }
  if (!existsSync(DEFAULT_PATH)) {
    throw new Error(`No local context at ${DEFAULT_PATH}. Run \`portcontext init\` first.`);
  }
  await copyFile(DEFAULT_PATH, syncFile());
  await git(["add", "-A"], dir);

  const status = await git(["status", "--porcelain"], dir);
  if (!status) return "Already up to date; nothing to push.";

  await git(["commit", "-m", message ?? `Update context ${new Date().toISOString()}`], dir);
  try {
    await git(["push", "-u", "origin", "main"], dir);
  } catch (err) {
    throw new Error(
      `Committed locally but push failed. Check the remote is set: portcontext sync setup --remote <git-url>\n${(err as Error).message}`,
    );
  }
  return "Pushed context to remote.";
}

/** Pull the latest context from the remote into the local project. */
export async function syncPull(): Promise<string> {
  const dir = syncDir();
  if (!(await isRepo(dir))) {
    throw new Error("Sync not set up. Run: portcontext sync setup --remote <git-url>");
  }
  await git(["pull", "origin", "main"], dir);
  if (!existsSync(syncFile())) {
    throw new Error("Remote has no context.json yet. Push from another machine first.");
  }
  await mkdir(dirname(DEFAULT_PATH), { recursive: true });
  await copyFile(syncFile(), DEFAULT_PATH);
  return `Pulled context into ${DEFAULT_PATH}.`;
}

/** Report the sync repo location, remote, and last commit. */
export async function syncStatus(): Promise<string[]> {
  const dir = syncDir();
  const out: string[] = [`Sync dir: ${dir}`];
  if (!(await isRepo(dir))) {
    out.push("Not set up. Run: portcontext sync setup --remote <git-url>");
    return out;
  }
  try {
    out.push(`Remote:   ${await git(["remote", "get-url", "origin"], dir)}`);
  } catch {
    out.push("Remote:   (none)");
  }
  try {
    out.push(`Last:     ${await git(["log", "-1", "--pretty=%h %s (%cr)"], dir)}`);
  } catch {
    out.push("Last:     (no commits yet)");
  }
  return out;
}
