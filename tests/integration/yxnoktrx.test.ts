/**
 * Contract check: what running the launch configuration (yxnoktrx) must show
 * against the extension shell it starts (srlrwowp).
 *
 * The shell is the spec: the extension the manifest (package.json, srlrwowp)
 * declares — its id, its entry point, its activation event and the command it
 * contributes — is the one the configuration must develop and host. The checks
 * run inside the extension host the configuration started, so the artifact
 * under the configuration is the one actually being hosted.
 */
import * as assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

const EXTENSION_ID = "edawise.deccy-viewer";
const OPEN_GRAPH_COMMAND = "deccyViewer.openGraph";

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

function launchConfigurations(): { outFiles: string[] }[] {
	return (
		JSON.parse(readFileSync(path.join(extensionRoot(), ".vscode/launch.json"), "utf8")) as {
			configurations: { outFiles: string[] }[];
		}
	).configurations;
}

suite("the shell the configuration starts is the extension it develops (srlrwowp)", () => {
	test("the extension the development path names is loaded from this folder", () => {
		// srlrwowp: the manifest declares the extension's id, and the
		// development path of the configuration is this folder.
		const extension = vscode.extensions.getExtension(EXTENSION_ID);

		assert.ok(extension, `${EXTENSION_ID} is loaded from the development path`);
		assert.strictEqual(extension.extensionPath, vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
	});

	test("the entry point the manifest declares is built and covered by the configuration", () => {
		// srlrwowp: the manifest declares the shell's entry point ...
		const entry = manifest().main;
		// ... which the build has written ...
		assert.ok(existsSync(path.join(extensionRoot(), entry)), "the entry point has been built");

		// ... and which the configuration's out files cover, so the debugger
		// maps the bundle the shell declares.
		const outFiles = launchConfigurations()[0]?.outFiles ?? [];
		const built = entry.replace(/^\.\//, "");
		assert.ok(
			outFiles.some((pattern) =>
				built.startsWith(pattern.replace(/\*.*$/, "").replace("${workspaceFolder}/", "")),
			),
			`out files ${outFiles.join(", ")} cover ${built}`,
		);
	});
});

suite("the shell activates in the host the configuration opens (srlrwowp)", () => {
	test("the activation event matches the folder the host opened, so the shell really activates", async () => {
		// srlrwowp: the shell declares the activation event that fires for the
		// folder the host opened ...
		const events = manifest().activationEvents;

		assert.ok(events.includes("workspaceContains:nodes/*.json"));
		const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
		assert.ok(existsSync(path.join(folder, "nodes")), "the opened folder carries the nodes the event names");

		// ... so the shell activates.
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});

	test("the shell registers the command it contributes once it is hosted", async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		await extension?.activate();

		// srlrwowp: the command the manifest contributes is a command the shell
		// registers once it is hosted.
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes(OPEN_GRAPH_COMMAND));
	});
});
