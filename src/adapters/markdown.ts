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

const TITLE_TO_SECTION: Record<string, ContextSection> = {
  identity: "identity",
  preferences: "preferences",
  "project facts": "project",
  project: "project",
  "coding style": "style",
  style: "style",
  other: "other",
};

/** Render just the section bodies (no top-level heading), shared by adapters. */
export function renderSections(ctx: PortContext): string {
  const lines: string[] = [];
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
  return lines.join("\n").trimEnd();
}

/**
 * Render a portable context as an `AGENTS.md`-style markdown file that most
 * AI coding tools (Copilot, Cursor, Claude, ...) can read as instructions.
 */
export function toMarkdown(ctx: PortContext): string {
  const head = ["# AI Context", ""];
  if (ctx.owner) head.push(`> Owner: ${ctx.owner}`, "");
  return (head.join("\n") + renderSections(ctx)).trimEnd() + "\n";
}

/**
 * Parse an `AGENTS.md`-style markdown file back into context entries. Maps
 * `## Section` headings to known sections and treats `- ` bullets as entries.
 */
export function fromMarkdown(
  text: string,
): { section: ContextSection; text: string; tags?: string[] }[] {
  const out: { section: ContextSection; text: string; tags?: string[] }[] = [];
  let current: ContextSection = "other";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("##")) {
      const title = line.replace(/^#+\s*/, "").toLowerCase().trim();
      current = TITLE_TO_SECTION[title] ?? "other";
      continue;
    }
    if (line.startsWith("- ")) {
      let body = line.slice(2).trim();
      let tags: string[] | undefined;
      const tagMatch = body.match(/_\(#(.+)\)_\s*$/);
      if (tagMatch) {
        tags = tagMatch[1]
          .split(/\s+/)
          .map((t) => t.replace(/^#/, "").trim())
          .filter(Boolean);
        body = body.replace(/_\(#(.+)\)_\s*$/, "").trim();
      }
      if (body) out.push({ section: current, text: body, tags });
    }
  }
  return out;
}
