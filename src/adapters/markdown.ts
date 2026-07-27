import type { PortContext, ContextSection } from "../schema.js";

const SECTION_TITLES: Record<ContextSection, string> = {
  identity: "Identity",
  preferences: "Preferences",
  project: "Project Facts",
  style: "Coding Style",
  other: "Other",
};

const ORDER: ContextSection[] = [
  "identity",
  "preferences",
  "project",
  "style",
  "other",
];

/**
 * Render a portable context as an `AGENTS.md`-style markdown file that most
 * AI coding tools (Copilot, Cursor, Claude, ...) can read as instructions.
 */
export function toMarkdown(ctx: PortContext): string {
  const lines: string[] = ["# AI Context", ""];
  if (ctx.owner) lines.push(`> Owner: ${ctx.owner}`, "");

  for (const section of ORDER) {
    const entries = ctx.entries.filter((e) => e.section === section);
    if (entries.length === 0) continue;
    lines.push(`## ${SECTION_TITLES[section]}`, "");
    for (const e of entries) {
      const tags = e.tags?.length ? ` _(#${e.tags.join(" #")})_` : "";
      lines.push(`- ${e.text}${tags}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
