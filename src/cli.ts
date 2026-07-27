#!/usr/bin/env node
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContext, saveContext, emptyContext, DEFAULT_PATH } from "./store.js";
import { fromMarkdown } from "./adapters/markdown.js";
import { TARGETS, ALL_TOOL_TARGETS } from "./adapters/tools.js";
import { discoverContextFiles } from "./discover.js";
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
  portcontext export --to <markdown|json|copilot|cursor|claude|all> [--out <file>]
  portcontext import [--from <file>] [--section <name>] [--dry-run]

Examples:
  portcontext init --owner "Jane Dev"
  portcontext add --section preferences --text "Prefer TypeScript, strict mode"
  portcontext export --to all              # write every tool's file at once
  portcontext export --to copilot          # .github/copilot-instructions.md
  portcontext import                        # auto-detect & pull existing files
  portcontext import --from AGENTS.md       # import one specific file

Export targets & default paths:
  markdown -> AGENTS.md
  copilot  -> .github/copilot-instructions.md
  cursor   -> .cursor/rules/portcontext.mdc
  claude   -> CLAUDE.md
  json     -> context.json (canonical)

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

      const writeTarget = async (key: string, path: string) => {
        const output = TARGETS[key].render(ctx);
        const text = output.endsWith("\n") ? output : output + "\n";
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, text, "utf8");
        console.log(`Wrote ${path} (${key})`);
      };

      if (to === "all") {
        for (const key of ALL_TOOL_TARGETS) {
          await writeTarget(key, TARGETS[key].defaultPath);
        }
        break;
      }

      const target = TARGETS[to];
      if (!target) {
        console.error(
          `Unknown --to "${to}". Use one of: ${Object.keys(TARGETS).join(", ")}, all`,
        );
        process.exit(1);
      }

      if (opts.out) {
        await writeTarget(to, opts.out);
      } else {
        process.stdout.write(target.render(ctx).replace(/\n?$/, "\n"));
      }
      break;
    }

    case "import": {
      const override = opts.section as ContextSection | undefined;
      if (override && !SECTIONS.includes(override)) {
        console.error(`Invalid --section. Use one of: ${SECTIONS.join(", ")}`);
        process.exit(1);
      }
      const dryRun = opts["dry-run"] === "true" || opts.dry === "true";

      // Determine which files to import: explicit --from, or auto-detect.
      let files: string[];
      if (opts.from) {
        files = [opts.from];
      } else {
        files = discoverContextFiles();
        if (files.length === 0) {
          console.log(
            "No instruction files found here. Looked for: AGENTS.md, .github/copilot-instructions.md, CLAUDE.md, .cursorrules, .cursor/rules/*.mdc",
          );
          console.log("Tip: point at a specific file with --from <file>.");
          break;
        }
        console.log(`Found ${files.length} file(s): ${files.join(", ")}`);
      }

      const ctx = await loadContext();
      const seen = new Set(
        ctx.entries.map((e) => `${e.section}\u0000${e.text}`),
      );
      let added = 0;
      let skipped = 0;

      for (const file of files) {
        let raw: string;
        try {
          raw = await readFile(file, "utf8");
        } catch {
          console.error(`Could not read file: ${file}`);
          if (opts.from) process.exit(1);
          continue;
        }
        const parsed = fromMarkdown(raw);
        let fileAdded = 0;
        for (const p of parsed) {
          const section = override ?? p.section;
          const key = `${section}\u0000${p.text}`;
          if (seen.has(key)) {
            skipped++;
            continue;
          }
          seen.add(key);
          fileAdded++;
          added++;
          if (!dryRun) {
            ctx.entries.push({
              id: makeId("e_"),
              section,
              text: p.text,
              tags: p.tags,
              createdAt: new Date().toISOString(),
            });
          }
        }
        console.log(`  ${file}: ${fileAdded} new`);
      }

      if (dryRun) {
        console.log(
          `Dry run: would import ${added} new entr${added === 1 ? "y" : "ies"} (${skipped} duplicate(s) skipped). Nothing written.`,
        );
        break;
      }
      if (added === 0) {
        console.log(`Nothing to import (${skipped} duplicate(s) skipped).`);
        break;
      }
      await saveContext(ctx);
      console.log(
        `Imported ${added} new entr${added === 1 ? "y" : "ies"}${skipped ? `, skipped ${skipped} duplicate(s)` : ""}.`,
      );
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
