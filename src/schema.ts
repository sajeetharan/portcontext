export type ContextSection =
  | "identity"
  | "preferences"
  | "project"
  | "style"
  | "other";

export interface ContextEntry {
  id: string;
  section: ContextSection;
  text: string;
  tags?: string[];
  createdAt: string;
}

export interface PortContext {
  version: 1;
  owner?: string;
  updatedAt: string;
  entries: ContextEntry[];
}
