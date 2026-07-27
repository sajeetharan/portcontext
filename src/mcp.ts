#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadContext, saveContext } from "./store.js";
import { toMarkdown } from "./adapters/markdown.js";
import { TARGETS, ALL_TOOL_TARGETS } from "./adapters/tools.js";
import { makeId } from "./util.js";
import type { ContextSection } from "./schema.js";

const SECTIONS: ContextSection[] = [
  "identity",
  "preferences",
  "project",
  "style",
  "other",
];

const server = new Server(
  { name: "portcontext", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_context",
      description:
        "Get the user's portable AI context (identity, preferences, project facts, style) as markdown.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_entries",
      description: "List all stored context entries with their ids and sections.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "add_entry",
      description: "Add a new context entry the agent learned about the user.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: SECTIONS },
          text: { type: "string", description: "The fact to remember." },
          tags: { type: "string", description: "Optional comma-separated tags." },
        },
        required: ["section", "text"],
      },
    },
    {
      name: "export",
      description:
        "Render the context for a specific tool, or write files for all tools when to='all'.",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string", enum: [...Object.keys(TARGETS), "all"] },
        },
        required: ["to"],
      },
    },
  ],
}));

function text(t: string) {
  return { content: [{ type: "text" as const, text: t }] };
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name } = req.params;
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;

  switch (name) {
    case "get_context": {
      const ctx = await loadContext();
      return text(toMarkdown(ctx));
    }

    case "list_entries": {
      const ctx = await loadContext();
      if (ctx.entries.length === 0) return text("No entries yet.");
      return text(
        ctx.entries
          .map((e) => `${e.id}  (${e.section})  ${e.text}`)
          .join("\n"),
      );
    }

    case "add_entry": {
      const section = String(args.section) as ContextSection;
      if (!SECTIONS.includes(section)) {
        return text(`Invalid section. Use one of: ${SECTIONS.join(", ")}`);
      }
      if (!args.text) return text("`text` is required.");
      const ctx = await loadContext();
      ctx.entries.push({
        id: makeId("e_"),
        section,
        text: String(args.text),
        tags: args.tags
          ? String(args.tags)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        createdAt: new Date().toISOString(),
      });
      await saveContext(ctx);
      return text(`Added entry to "${section}".`);
    }

    case "export": {
      const ctx = await loadContext();
      const to = String(args.to);
      if (to === "all") {
        const written: string[] = [];
        for (const key of ALL_TOOL_TARGETS) {
          const path = TARGETS[key].defaultPath;
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, TARGETS[key].render(ctx).replace(/\n?$/, "\n"), "utf8");
          written.push(path);
        }
        return text(`Wrote: ${written.join(", ")}`);
      }
      const target = TARGETS[to];
      if (!target) {
        return text(`Unknown target "${to}". Use: ${Object.keys(TARGETS).join(", ")}, all`);
      }
      return text(target.render(ctx));
    }

    default:
      return text(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
