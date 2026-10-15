/**
 * Contract check: what running the launch configuration (yxnoktrx) must show
 * against the extension shell it starts (srlrwowp).
 *
 * The checks run inside the extension host the configuration started, so the
 * artifact under the configuration is the one actually being hosted.
 */
import * as assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

const EXTENSION_ID = "edawise.vsc-deccy";

function extensionRoot(): string {
	return vscode.extensions.getExtension(EXTENSION_ID)?.extensionPath ?? "";
}

function manifest(): { main: string; activationEvents: string[]; publisher: string; name: string } {
	return JSON.parse(readFileSync(path.join(extensionRoot(), "package.json"), "utf8")) as {
		main: string;
		activationEvents: string[];
		publisher: string;
		name: string;
	};
}

suite("the shell the configuration starts is the extension it develops", () => {
	test("the extension the development path names is loaded from this folder", () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);

		assert.ok(extension, `${EXTENSION_ID} is loaded from the development path`);
		assert.strictEqual(extension.extensionPath, vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
	});

	test("the entry point the manifest declares is the bundle the configuration covers", () => {
		const entry = manifest().main;

		assert.strictEqual(entry, "./out/extension.js");
		assert.ok(existsSync(path.join(extensionRoot(), entry)), "the entry point has been built");
	});

	test("the entry point is what the configuration's out files cover", () => {
		const launch = JSON.parse(
			readFileSync(path.join(extensionRoot(), ".vscode/launch.json"), "utf8"),
		) as { configurations: { outFiles: string[] }[] };
		const outFiles = launch.configurations[0]?.outFiles ?? [];

		for (const pattern of outFiles) {
			assert.match(pattern.replace("${workspaceFolder}/", ""), /^out\/.*\*\.js$/);
		}
	});
});

suite("the shell activates in the host the configuration opens", () => {
	test("the activation event matches the folder the host opened, so the shell really activates", async () => {
		const events = manifest().activationEvents;

		assert.ok(events.includes("workspaceContains:nodes/*.json"));
		const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
		assert.ok(existsSync(path.join(folder, "nodes")), "the opened folder carries the nodes the event names");

		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});

	test("the shell registers the command it contributes once it is hosted", async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes("vscDeccy.openGraph"));
	});
});
