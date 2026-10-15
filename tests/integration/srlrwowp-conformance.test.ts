/**
 * Conformance check: what running the extension shell (srlrwowp) must show
 * for its requirement sentences (kzqwqptv, twtvwkqm, vpqxkzxq) to hold.
 *
 * The checks run inside the extension host the launch configuration opens, so
 * what is observed is the extension as the workbench runs it.
 */
import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

const OPEN_GRAPH_COMMAND = "vscDeccy.openGraph";
const PANEL_TITLE = "Deccy Graph";

function manifest(): Record<string, unknown> {
	const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
	return JSON.parse(readFileSync(path.join(folder, "package.json"), "utf8")) as Record<string, unknown>;
}

suite("the extension contributes the command that opens the graph", () => {
	test("the invocation of the command is contributed to the workbench", async () => {
		const contributes = manifest().contributes as {
			commands?: { command: string; title: string }[];
			menus?: { "commandPalette"?: { command: string }[]; "editor/title"?: { command: string }[] };
		};

		assert.ok(contributes.commands?.some((entry) => entry.command === OPEN_GRAPH_COMMAND));
		assert.ok(
			contributes.menus?.["commandPalette"]?.some((entry) => entry.command === OPEN_GRAPH_COMMAND),
		);
	});

	test("the extension is activated and the command is registered", async () => {
		const extension = vscode.extensions.getExtension("edawise.vsc-deccy");
		assert.ok(extension, "the extension under development is loaded");

		await extension.activate();

		assert.ok((await vscode.commands.getCommands(true)).includes(OPEN_GRAPH_COMMAND));
	});
});

suite("invoking the command opens the panel", () => {
	test("a webview panel titled Deccy Graph is open after the command", async () => {
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const titles = vscode.window.tabGroups.all.flatMap((group) =>
			group.tabs.map((tab) => tab.label),
		);
		assert.ok(titles.includes(PANEL_TITLE), `open tabs: ${titles.join(", ")}`);
	});

	test("invoking the command again reveals the same panel instead of opening another", async () => {
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const panels = vscode.window.tabGroups.all
			.flatMap((group) => group.tabs)
			.filter((tab) => tab.label === PANEL_TITLE);

		assert.strictEqual(panels.length, 1);
	});
});

suite("the extension activates on a folder that carries the graph", () => {
	test("the activation event of the manifest matches the opened folder", () => {
		const events = manifest().activationEvents as string[];

		assert.ok(events.includes("workspaceContains:nodes/*.json"));
		const folder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(folder, "a workspace folder is open");
	});
});
