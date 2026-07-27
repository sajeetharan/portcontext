# portcontext

**Your personal AI context — owned by you, portable across every tool and machine.**

[![npm version](https://img.shields.io/npm/v/portcontext.svg)](https://www.npmjs.com/package/portcontext)
[![npm downloads](https://img.shields.io/npm/dw/portcontext.svg)](https://www.npmjs.com/package/portcontext)
[![GitHub stars](https://img.shields.io/github/stars/sajeetharan/portcontext.svg?style=social)](https://github.com/sajeetharan/portcontext)
[![license](https://img.shields.io/npm/l/portcontext.svg)](LICENSE)

![portcontext demo](demo/portcontext.gif)

Every AI tool — GitHub Copilot, Cursor, Claude, ChatGPT — keeps its own siloed
memory of who you are and how you work. There's no standard, user-owned "context
passport" you can carry *between* tools **and between machines**. `portcontext`
is that missing layer: you describe your preferences, project facts, and coding
style **once**, keep it in a plain file you own, and take it everywhere.

> Set up your context once. Take it everywhere.

---

## How this is different

There are good tools — like [Ruler](https://github.com/intellectronica/ruler)
and [rulesync](https://github.com/dyoshikawa/rulesync) — that generate
*per-project, per-team rule files* for many coding agents. `portcontext`
solves a different problem:

- **Personal, not per-project.** It's about *you* — your identity, preferences,
  and working style — not a repo's team conventions. One context follows you
  into every project.
- **Portable across machines.** Your context lives in a single file you own and
  can `sync` over any git remote, so a new laptop knows how you work in seconds.
- **Live via MCP, not just files.** The bundled `portcontext-mcp` server lets
  agents read *and enrich* your context at runtime — no generated files to drift.

It still exports the usual `AGENTS.md` / Copilot / Cursor / Claude files when you
want them — but the source of truth is *yours*, and it travels with you.

## Install

```bash
npm install -g portcontext
```

Or run from source:

```bash
npm install
npm run build
node dist/cli.js --help
```

## Quick start

```bash
# 1. Create your context file (.portcontext/context.json)
portcontext init --owner "Jane Dev"

# 2. Add facts about how you work
portcontext add --section preferences --text "Prefer TypeScript, strict mode, no default exports"
portcontext add --section style --text "2-space indent, trailing commas" --tags formatting
portcontext add --section project --text "API base URL comes from API_BASE_URL env var"

# 3. See what you've captured
portcontext list

# 4. Export it to every AI tool at once
portcontext export --to all
#   -> AGENTS.md
#   -> .github/copilot-instructions.md
#   -> .cursor/rules/portcontext.mdc
#   -> CLAUDE.md

# ...or one tool at a time
portcontext export --to copilot
portcontext export --to json           # the canonical, portable format

# Already have an instructions file? Pull it in.
portcontext import --from AGENTS.md

# Never let the files drift: regenerate them on every commit.
portcontext install-hook
```

## Live access via MCP

Instead of generating files, let an MCP-capable agent read your context at
runtime. Point your MCP client at the `portcontext-mcp` server:

```json
{
  "mcpServers": {
    "portcontext": { "command": "portcontext-mcp" }
  }
}
```

It exposes `get_context`, `list_entries`, `add_entry`, and `export` — so agents
can read *and* enrich your context directly, with no file drift.


## Concepts

- **Canonical file** — a single `context.json` you own and can commit, sync, or back up.
- **Sections** — `identity`, `preferences`, `project`, `style`, `other`.
- **Adapters** — render the canonical file into each tool's expected format.
  Ships with `markdown` (AGENTS.md), `copilot`, `cursor`, `claude`, and `json`.
  `export --to all` writes every tool's file to its conventional path in one command.
- **Import** — parse an existing `AGENTS.md`-style file back into your context so
  you can adopt portcontext without starting from scratch. Run `import` with no
  arguments to auto-detect Copilot/Cursor/Claude/AGENTS files in the current folder.
- **Sync** — back up and share your context across machines via any git remote
  (`portcontext sync setup --remote <url>`, then `push` / `pull`).
- **Auto-sync hook** — `portcontext install-hook` adds a git pre-commit hook so
  your tool files are regenerated on every commit and never drift.
- **MCP server** — `portcontext-mcp` exposes your context to any MCP-capable
  agent (Copilot, Claude, Cursor) live at runtime — no file generation needed.

## Roadmap

- [x] Adapters for Copilot, Cursor, and Claude
- [x] `import` from existing instruction files (with auto-detect)
- [x] Sync between machines (git-based)
- [x] Git pre-commit hook (`install-hook`) so files never drift
- [x] MCP server for live, runtime context access
- [ ] Encrypted, opt-in sync
- [ ] Per-entry scoping (global vs. per-project)

## Programmatic use

```ts
import { loadContext, toMarkdown } from "portcontext";

const ctx = await loadContext();
console.log(toMarkdown(ctx));
```

## Sponsor this project

`portcontext` is built and maintained independently. If it saves you from
re-teaching every AI tool who you are, please consider sponsoring — it funds new
adapters, sync, and long-term maintenance. See [FUNDING](.github/FUNDING.yml).

## License

[MIT](LICENSE)
