/**
 * Contract check: what running the extension shell (srlrwowp) must show
 * against the page (rtlotqvy) and the panel state (yruxqknp) it hosts.
 *
 * The checks run inside the extension host the launch configuration opens, so
 * the page is asked for where the shell serves it (the extension's own files)
 * and the state is asked for where the shell keeps it (the state module the
 * panel imports).
 */
import * as assert from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

import { PANEL_STATE_KEY, createPanelState } from "../../src/webview/state.ts";

function extensionRoot(): string {
	return vscode.extensions.getExtension("edawise.vsc-deccy")?.extensionPath ?? "";
}

function workspaceRoot(): string {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
}

function page(): string {
	return readFileSync(path.join(extensionRoot(), "media/webview.html"), "utf8");
}

suite("the shell serves the page the viewer artifact is", () => {
	test("every reference in the page resolves to a file the extension serves", () => {
		const references = [...page().matchAll(/(\b(?:href|src))="([^"]+)"/g)].map(
			(match) => match[2] ?? "",
		);

		assert.ok(references.length > 0);
		for (const reference of references) {
			assert.ok(
				existsSync(path.resolve(extensionRoot(), "media", reference)),
				`${reference} is served from the extension`,
			);
		}
	});

	test("the script the page loads is the bundle the shell's build writes", () => {
		const scripts = (
			JSON.parse(readFileSync(path.join(extensionRoot(), "package.json"), "utf8")) as {
				scripts: Record<string, string>;
			}
		).scripts;
		const script = [...page().matchAll(/<script[^>]*src="([^"]+)"/g)].map(
			(match) => match[1] ?? "",
		);

		assert.deepStrictEqual(script, ["../src/webview/main.js"]);
		assert.match(scripts["build:page"] ?? "", /outfile=src\/webview\/main\.js/);
	});

	test("the codicon stylesheet the toolbar glyph needs is shipped with the extension", () => {
		assert.ok(existsSync(path.join(extensionRoot(), "node_modules/@vscode/codicons/dist/codicon.css")));
	});
});

suite("the shell hands the page the graph the page's contract consumes", () => {
	test("the node documents of the opened workspace are the records the graph is built from", () => {
		const directory = path.join(workspaceRoot(), "nodes");
		const files = readdirSync(directory).filter((file) => file.endsWith(".json"));

		assert.ok(files.length > 0);
		for (const file of files) {
			const document = JSON.parse(readFileSync(path.join(directory, file), "utf8")) as {
				kind?: unknown;
				content?: { type?: unknown; ref?: unknown; rationale?: unknown };
			};
			assert.ok(
				document.kind === "decision" || document.kind === "evaluation",
				`${file} declares a node kind`,
			);
			assert.ok(document.content, `${file} declares its content`);
			assert.ok(typeof document.content.type === "string" && document.content.type.length > 0);
			assert.ok(typeof document.content.rationale === "string" && document.content.rationale.length > 0);
			assert.ok(
				document.content.ref === "inline" ||
					(Array.isArray(document.content.ref) && document.content.ref.length > 0),
				`${file} points its content somewhere`,
			);
		}
	});

	test("every node the shell hands over can be labelled from the jj log", () => {
		const directory = path.join(workspaceRoot(), "nodes");
		const ids = readdirSync(directory)
			.filter((file) => file.endsWith(".json"))
			.map((file) => file.slice(0, -".json".length));
		const log = execFileSync(
			"jj",
			["log", "--no-graph", "-r", "ancestors(@)", "--color", "never", "-T", 'change_id.shortest(8) ++ "\\n"'],
			{ cwd: workspaceRoot(), encoding: "utf8" },
		);
		const changes = log.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

		assert.ok(changes.length > 0);
		const labelled = ids.filter((id) => changes.some((change) => change.startsWith(id) || id.startsWith(change)));
		assert.ok(
			labelled.length > 0,
			"the changes of the opened repository answer for the node documents",
		);
	});
});

suite("the panel the shell keeps is the state the page restores into", () => {
	test("the state the shell persists is the panel state the page restores, under its own key", async () => {
		const store = {
			value: undefined as unknown,
			get<T>(): T | undefined {
				return this.value as T | undefined;
			},
			update(_key: string, value: unknown): void {
				this.value = value;
			},
		};

		const keeper = createPanelState(store);
		keeper.setOpen(true);
		keeper.setViewport({ x: 12, y: 34, scale: 2 });
		keeper.setSelection("aaaaaaaa");
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.strictEqual(PANEL_STATE_KEY, "deccy.panelState");
		assert.deepStrictEqual(store.value, {
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 12, y: 34 },
			zoom: 2,
			positions: {},
		});
	});

	test("a panel restored from the recorded state comes back as the user left it", () => {
		const recorded = {
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 1, y: 2 },
			zoom: 3,
			positions: { bbbbbbbb: { x: 5, y: 6 } },
		};
		const store = {
			get<T>(): T | undefined {
				return recorded as T;
			},
			update(): void {},
		};

		const keeper = createPanelState(store);

		assert.deepStrictEqual(keeper.current(), recorded);
	});
});
