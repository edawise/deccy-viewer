/**
 * Conformance check: what running the launch configuration (yxnoktrx) must
 * show for the debug-session requirement (usunynqx) to hold.
 *
 * Every expectation is that sentence — an Extension Development Host session
 * (usunynqx), started with this repository open, with both bundles
 * (out/extension.js, src/webview/main.js) built from the current sources
 * before the host starts — read from the launch configuration and the manifest
 * as the workbench does. The checks run inside the extension host the
 * configuration starts.
 */
import * as assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

interface LaunchConfiguration {
	name: string;
	type: string;
	request: string;
	args: string[];
	outFiles: string[];
	preLaunchTask: string;
}

function workspaceRoot(): string {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
}

function launchConfigurations(): LaunchConfiguration[] {
	const file = path.join(workspaceRoot(), ".vscode", "launch.json");
	return (JSON.parse(readFileSync(file, "utf8")) as { configurations: LaunchConfiguration[] })
		.configurations;
}

function scripts(): Record<string, string> {
	return (
		JSON.parse(readFileSync(path.join(workspaceRoot(), "package.json"), "utf8")) as {
			scripts: Record<string, string>;
		}
	).scripts;
}

suite("the debug session hosts the extension in a development host (usunynqx)", () => {
	test("an extensionHost configuration is declared", () => {
		const configurations = launchConfigurations();

		// usunynqx: the debug session is an Extension Development Host, so its
		// configurations are extension-host launch configurations.
		assert.ok(configurations.length > 0);
		assert.ok(
			configurations.every(
				(configuration) =>
					configuration.type === "extensionHost" && configuration.request === "launch",
			),
		);
	});

	test("the development host is started on this repository", () => {
		const configuration = launchConfigurations()[0];
		assert.ok(configuration);

		// usunynqx: the host is started with this repository open ...
		assert.ok(
			configuration.args.includes("--extensionDevelopmentPath=${workspaceFolder}"),
			`args: ${configuration.args.join(" ")}`,
		);
		const folder = workspaceRoot();
		// ... and the opened folder is the repository that carries the graph.
		assert.ok(existsSync(path.join(folder, "nodes")), "the opened folder carries the repository");
	});
});

suite("both bundles are built before the host starts (usunynqx)", () => {
	test("the launch configuration runs the build before it launches", () => {
		const configuration = launchConfigurations()[0];
		assert.ok(configuration);

		// usunynqx: the bundles are built before the host starts, so the launch
		// configuration runs the build as its pre-launch task ...
		assert.strictEqual(configuration.preLaunchTask, "npm: build");
		// ... which must name a script of the manifest.
		assert.ok("build" in scripts(), "the pre-launch task names a script of the manifest");
	});

	test("the build writes both bundles the requirement names", () => {
		const build = scripts();

		// usunynqx: both bundles — out/extension.js and src/webview/main.js —
		// are built from the current sources.
		assert.match(build["build"] ?? "", /build:extension/);
		assert.match(build["build"] ?? "", /build:page/);
		assert.match(build["build:extension"] ?? "", /outfile=out\/extension\.js/);
		assert.match(build["build:page"] ?? "", /outfile=src\/webview\/main\.js/);
	});

	test("the out files the configuration points at cover the built bundles", () => {
		const configuration = launchConfigurations()[0];
		assert.ok(configuration);

		// usunynqx: the debugger maps the built bundles, so the out files it
		// points at are the built bundles under out/.
		assert.ok(configuration.outFiles.length > 0);
		for (const pattern of configuration.outFiles) {
			assert.match(pattern.replace("${workspaceFolder}/", ""), /^out\/.*\.js$/);
		}
	});
});
