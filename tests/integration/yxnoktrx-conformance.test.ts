/**
 * Conformance check: what running the launch configuration (yxnoktrx) must
 * show for the debug-session requirement (usunynqx) to hold.
 *
 * The checks run inside the extension host the configuration starts and read
 * the configuration and the manifest as the workbench does.
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

suite("the debug session hosts the extension in a development host", () => {
	test("an extensionHost configuration is declared", () => {
		const configurations = launchConfigurations();

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

		assert.ok(
			configuration.args.includes("--extensionDevelopmentPath=${workspaceFolder}"),
			`args: ${configuration.args.join(" ")}`,
		);
		const folder = workspaceRoot();
		assert.ok(existsSync(path.join(folder, "nodes")), "the opened folder carries the graph");
	});
});

suite("both bundles are built before the host starts", () => {
	test("the launch configuration runs the build before it launches", () => {
		const configuration = launchConfigurations()[0];
		assert.ok(configuration);

		assert.strictEqual(configuration.preLaunchTask, "npm: build");
		const scripts = (JSON.parse(readFileSync(path.join(workspaceRoot(), "package.json"), "utf8")) as {
			scripts: Record<string, string>;
		}).scripts;
		assert.ok("build" in scripts, "the pre-launch task names a script of the manifest");
	});

	test("the build writes both bundles the requirement names", () => {
		const scripts = (JSON.parse(readFileSync(path.join(workspaceRoot(), "package.json"), "utf8")) as {
			scripts: Record<string, string>;
		}).scripts;

		assert.match(scripts["build"] ?? "", /build:extension/);
		assert.match(scripts["build"] ?? "", /build:page/);
		assert.match(scripts["build:extension"] ?? "", /outfile=out\/extension\.js/);
		assert.match(scripts["build:page"] ?? "", /outfile=src\/webview\/main\.js/);
	});

	test("the out files the configuration points at are the ones the build writes", () => {
		const configuration = launchConfigurations()[0];
		assert.ok(configuration);

		assert.deepStrictEqual(configuration.outFiles, ["${workspaceFolder}/out/**/*.js"]);
	});
});
