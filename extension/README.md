# portcontext for VS Code

Manage your [portcontext](https://github.com/sajeetharan/portcontext) — portable,
user-owned AI context — without leaving the editor.

## Requirements

The `portcontext` CLI must be on your `PATH`:

```bash
npm install -g portcontext
```

## Commands

Open the Command Palette (`Ctrl+Shift+P`) and run:

- **portcontext: Add Context Entry** — pick a section, type a fact (and optional tags).
- **portcontext: Export to All Tools** — writes `AGENTS.md`, Copilot, Cursor, and Claude files.
- **portcontext: Import (auto-detect)** — pulls existing instruction files into your context.
- **portcontext: List Entries** — shows what you've captured.
- **portcontext: Sync (push/pull)** — back up or pull your context across machines.

Commands run in an integrated terminal so you can see the output.

## Build from source

```bash
cd extension
npm install
npm run compile
```

Then press `F5` in VS Code to launch an Extension Development Host.
