#!/usr/bin/env node
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadContext, saveContext, emptyContext, DEFAULT_PATH } from "./store.js";
import { toMarkdown } from "./adapters/markdown.js";
import { toJson } from "./adapters/json.js";
import { makeId } from "./util.js";
import type { ContextSection } from "./schema.js";

async function version(): Promise<string> {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(await readFile(fileURLToPath(pkgUrl), "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const SECTIONS: ContextSection[] = [
  "identity",
  "preferences",
  "project",
  "style",
  "other",
];

function flags(args: string[]): Record<string, string> {
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith("--")) {
      opts[key] = next;
      i++;
    } else {
      opts[key] = "true";
    }
  }
  return opts;
}

function help(): void {
  console.log(`portcontext — portable, user-owned AI context

Usage:
  portcontext init [--owner <name>]
  portcontext add --section <${SECTIONS.join("|")}> --text "<fact>" [--tags a,b]
  portcontext list [--section <name>]
  portcontext remove --id <id>
  portcontext export --to <markdown|json> [--out <file>]

Examples:
  portcontext init --owner "Jane Dev"
  portcontext add --section preferences --text "Prefer TypeScript, strict mode"
  portcontext export --to markdown --out AGENTS.md

Options:
  -h, --help      Show this help
  -v, --version   Show version

Context file: ${DEFAULT_PATH}
`);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = flags(rest);

  if (cmd === "--version" || cmd === "-v") {
    console.log(await version());
    return;
  }
  if (cmd === "--help" || cmd === "-h") {
    help();
    return;
  }

  switch (cmd) {
    case "init": {
      await saveContext(emptyContext(opts.owner));
      console.log(`Initialized ${DEFAULT_PATH}`);
      console.log('Next: portcontext add --section preferences --text "..."');
      break;
    }

    case "add": {
      const section = (opts.section ?? "other") as ContextSection;
      if (!SECTIONS.includes(section)) {
        console.error(`Invalid --section. Use one of: ${SECTIONS.join(", ")}`);
        process.exit(1);
      }
      if (!opts.text) {
        console.error("--text is required");
        process.exit(1);
      }
      const ctx = await loadContext();
      ctx.entries.push({
        id: makeId("e_"),
        section,
        text: opts.text,
        tags: opts.tags
          ? opts.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        createdAt: new Date().toISOString(),
      });
      await saveContext(ctx);
      console.log(`Added entry to "${section}".`);
      break;
    }

    case "list": {
      const ctx = await loadContext();
      const entries = opts.section
        ? ctx.entries.filter((e) => e.section === opts.section)
        : ctx.entries;
      if (entries.length === 0) {
        console.log(
          opts.section
            ? `No entries in section "${opts.section}".`
            : "No entries yet. Add one with: portcontext add --section preferences --text \"...\"",
        );
        break;
      }
      for (const e of entries) {
        const tags = e.tags?.length ? ` [${e.tags.join(", ")}]` : "";
        console.log(`${e.id}  (${e.section})  ${e.text}${tags}`);
      }
      break;
    }

    case "remove": {
      if (!opts.id) {
        console.error("--id is required");
        process.exit(1);
      }
      const ctx = await loadContext();
      const before = ctx.entries.length;
      ctx.entries = ctx.entries.filter((e) => e.id !== opts.id);
      await saveContext(ctx);
      console.log(
        before === ctx.entries.length ? "No matching entry." : "Removed entry.",
      );
      break;
    }

    case "export": {
      const ctx = await loadContext();
      const to = opts.to ?? "markdown";
      const output = to === "json" ? toJson(ctx) : toMarkdown(ctx);
      if (opts.out) {
        await writeFile(opts.out, output.endsWith("\n") ? output : output + "\n", "utf8");
        console.log(`Wrote ${opts.out}`);
      } else {
        console.log(output);
      }
      break;
    }

    case "help":
    case undefined:
      help();
      break;

    default:
      console.error(`Unknown command: ${cmd}`);
      help();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
