import * as vscode from "vscode";

const SECTIONS = ["identity", "preferences", "project", "style", "other"];

let terminal: vscode.Terminal | undefined;

/** Get (or create) a reusable integrated terminal for portcontext commands. */
function getTerminal(): vscode.Terminal {
  if (!terminal || terminal.exitStatus !== undefined) {
    terminal = vscode.window.createTerminal("portcontext");
  }
  terminal.show();
  return terminal;
}

/** Quote an argument for the shell (wrap in double quotes, escape inner quotes). */
function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function run(args: string): void {
  getTerminal().sendText(`portcontext ${args}`);
}

async function addEntry(): Promise<void> {
  const section = await vscode.window.showQuickPick(SECTIONS, {
    placeHolder: "Which section?",
  });
  if (!section) {
    return;
  }
  const text = await vscode.window.showInputBox({
    prompt: "Context fact to remember",
    placeHolder: "e.g. Prefer TypeScript, strict mode",
  });
  if (!text) {
    return;
  }
  const tags = await vscode.window.showInputBox({
    prompt: "Tags (comma-separated, optional)",
    placeHolder: "formatting, backend",
  });
  let cmd = `add --section ${section} --text ${quote(text)}`;
  if (tags) {
    cmd += ` --tags ${quote(tags)}`;
  }
  run(cmd);
}

async function sync(): Promise<void> {
  const action = await vscode.window.showQuickPick(
    [
      { label: "push", description: "Back up / share your context" },
      { label: "pull", description: "Get the latest on this machine" },
      { label: "status", description: "Show sync remote and last commit" },
    ],
    { placeHolder: "Sync action" },
  );
  if (!action) {
    return;
  }
  run(`sync ${action.label}`);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("portcontext.addEntry", addEntry),
    vscode.commands.registerCommand("portcontext.exportAll", () =>
      run("export --to all"),
    ),
    vscode.commands.registerCommand("portcontext.import", () => run("import")),
    vscode.commands.registerCommand("portcontext.list", () => run("list")),
    vscode.commands.registerCommand("portcontext.sync", sync),
  );
}

export function deactivate(): void {
  terminal?.dispose();
}
