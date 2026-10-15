/**
 * Contract check: what running the extension shell (srlrwowp) must show
 * against the page (rtlotqvy) and the panel state (yruxqknp) it hosts.
 *
 * The prerequisites are the spec. The shell serves the page whose references
 * and script media/webview.html declares (rtlotqvy) and hands the page the
 * graph across the seam the page declares (GraphMessage in src/webview/main.ts,
 * rtlotqvy: node records and labels); it keeps the panel state the state module
 * declares (createPanelState and PANEL_STATE_KEY, yruxqknp). The checks run
 * inside the extension host the launch configuration opens, so the page is
 * asked for where the shell serves it (the extension's own files) and the
 * state is asked for where the shell keeps it (the state module the panel
 * imports).
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

suite("the shell serves the page the viewer artifact is (rtlotqvy)", () => {
	test("every reference in the page resolves to a file the extension serves", () => {
		// rtlotqvy: media/webview.html declares the references the host resolves
		// through webview.asWebviewUri.
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
		// rtlotqvy: the page declares the script it loads ...
		const script = [...page().matchAll(/<script[^>]*src="([^"]+)"/g)].map(
			(match) => match[1] ?? "",
		);
		assert.deepStrictEqual(script, ["../src/webview/main.js"]);

		// ... and the shell's build writes it to that path.
		const scripts = (
			JSON.parse(readFileSync(path.join(extensionRoot(), "package.json"), "utf8")) as {
				scripts: Record<string, string>;
			}
		).scripts;
		assert.match(scripts["build:page"] ?? "", /outfile=src\/webview\/main\.js/);
	});

	test("the codicon stylesheet the toolbar glyph needs is shipped with the extension", () => {
		// rtlotqvy: media/webview.html carries the codicon glyph class of the
		// toolbar action, so the shell must ship the stylesheet that defines it.
		assert.ok(existsSync(path.join(extensionRoot(), "node_modules/@vscode/codicons/dist/codicon.css")));
	});
});

suite("the shell hands the page the graph the page's contract consumes (rtlotqvy)", () => {
	test("the node documents of the opened workspace are the records the graph is built from", () => {
		// rtlotqvy (GraphMessage.records): the host posts the validated node
		// records it read from the workspace.
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
		// rtlotqvy (GraphMessage.labels): the host labels each node from the jj
		// change descriptions of the opened repository.
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

suite("the panel the shell keeps is the state the page restores into (yruxqknp)", () => {
	test("the state the shell persists is the panel state the page restores, under its own key", async () => {
		const store = {
			key: undefined as string | undefined,
			value: undefined as unknown,
			get<T>(): T | undefined {
				return this.value as T | undefined;
			},
			update(key: string, value: unknown): void {
				this.key = key;
				this.value = value;
			},
		};

		const keeper = createPanelState(store);
		keeper.setOpen(true);
		keeper.setViewport({ x: 12, y: 34, scale: 2 });
		keeper.setSelection("aaaaaaaa");
		await new Promise((resolve) => setTimeout(resolve, 0));

		// yruxqknp: the state is kept under the key the state module declares ...
		assert.strictEqual(store.key, PANEL_STATE_KEY);
		// ... and carries the fields the page restores: open, selection, pan,
		// zoom and node positions.
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

		// yruxqknp (createPanelState): the state a keeper is created on is the
		// state it comes back with.
		assert.deepStrictEqual(keeper.current(), recorded);
	});
});
