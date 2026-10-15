/**
 * Conformance check: what running the extension shell (srlrwowp) must show for
 * its requirement sentences (kzqwqptv, twtvwkqm, vpqxkzxq) to hold.
 *
 * Every expectation is one of those sentences — the command deccyViewer.openGraph
 * contributed to the Command Palette and the panel title bar (kzqwqptv), the
 * webview panel titled Deccy Graph it opens (twtvwkqm), the activation of the
 * extension on this repository (vpqxkzxq) — or the workspace the check runs in.
 * The checks run inside the extension host the launch configuration opens, so
 * what is observed is the extension as the workbench runs it.
 *
 * The title-bar entry is read as a predicate, not as a bag of names: the entry
 * must be shown exactly when the active webview panel is the panel the command
 * opens, which is a single positive equality between the when-clause variable
 * that names the active panel's view type and the view type the panel module
 * declares (GRAPH_PANEL_VIEW_TYPE of src/panel.ts), never restated here. A
 * negation, a compound condition or a different variable selects other panels
 * and fails, and the view type is read out of the module so that moving the
 * panel's type moves this expectation with it.
 *
 * The manifest's display name is read from the identity decision's own node
 * (uuutyrzs, a prerequisite of the shell) instead of a string restated here: the
 * name the extension is displayed under is that sentence's, so the check
 * measures the manifest against the record rather than echoing a literal.
 */
import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";

import esbuild from "esbuild";
import * as vscode from "vscode";

/** kzqwqptv: the command the extension contributes. */
const OPEN_GRAPH_COMMAND = "deccyViewer.openGraph";
/** uuutyrzs: the decision that records the extension's identity and display form. */
const IDENTITY_DECISION = "uuutyrzs";
/** The when-clause variable that names the active webview panel's view type (kzqwqptv). */
const WHEN_VIEW_TYPE_VARIABLE = "activeWebviewPanelId";
/** twtvwkqm: the title of the webview panel the command opens. */
const PANEL_TITLE = "Deccy Graph";
/** The id the manifest declares (srlrwowp). */
const EXTENSION_ID = "edawise.deccy-viewer";

function workspaceRoot(): string {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
}

function manifest(): Record<string, unknown> {
	return JSON.parse(
		readFileSync(path.join(workspaceRoot(), "package.json"), "utf8"),
	) as Record<string, unknown>;
}

interface TitleBarEntry {
	command: string;
	when?: string;
	group?: string;
}

function titleBarEntries(): TitleBarEntry[] {
	const contributes = manifest().contributes as {
		menus?: { "editor/title"?: TitleBarEntry[] };
	};
	return contributes.menus?.["editor/title"] ?? [];
}

/**
 * The display form the identity decision records, read from its node: the
 * sentence of uuutyrzs says what the extension is displayed as, and the manifest
 * has to carry that name. Nothing here restates it, so a record that renames the
 * extension moves the expectation with the record.
 */
function recordedDisplayName(): string {
	const nodePath = path.join(workspaceRoot(), "nodes", `${IDENTITY_DECISION}.json`);
	const node = JSON.parse(readFileSync(nodePath, "utf8")) as {
		content?: { content?: unknown };
	};
	const recorded = node.content?.content;
	assert.strictEqual(
		typeof recorded,
		"string",
		`the identity decision ${IDENTITY_DECISION} records its identity in words (${nodePath})`,
	);
	const display = /displayed as "([^"]+)"/.exec(recorded as string);
	assert.ok(
		display,
		`the identity decision ${IDENTITY_DECISION} records the form the extension is displayed as: ${String(recorded)}`,
	);
	return display[1];
}

/**
 * Strip the parentheses that wrap a whole condition; a condition they do not
 * wrap keeps its text and is rejected by the shape check below.
 */
function unwrapped(condition: string): string {
	let text = condition.trim();
	while (text.startsWith("(") && text.endsWith(")")) {
		let depth = 0;
		let wrapsWhole = true;
		for (let index = 0; index < text.length; index += 1) {
			if (text[index] === "(") {
				depth += 1;
			} else if (text[index] === ")") {
				depth -= 1;
				if (depth === 0 && index < text.length - 1) {
					wrapsWhole = false;
					break;
				}
			}
		}
		if (!wrapsWhole) {
			break;
		}
		text = text.slice(1, -1).trim();
	}
	return text;
}

/**
 * Decompose a title-bar when-condition into the single test it has to be: one
 * variable, strictly equal to one quoted literal. The whole condition must be
 * that test, so a negation (`!=`), a compound condition (`&&`, `||`) or any
 * other operator leaves the entry visible on panels that are not this one and
 * fails here; the caller then pins which variable and which literal.
 */
function strictEquality(condition: string): { variable: string; literal: string } {
	const text = unwrapped(condition);
	assert.ok(text.length > 0, "the title-bar entry carries a when-condition");

	const name = "[A-Za-z_][A-Za-z0-9_.]*";
	const forward = new RegExp(`^(${name})\\s*={2,3}\\s*(['"])(.*)\\2$`).exec(text);
	const reverse = forward
		? null
		: new RegExp(`^(['"])(.*)\\1\\s*={2,3}\\s*(${name})$`).exec(text);
	const variable = forward?.[1] ?? reverse?.[3];
	const literal = forward?.[3] ?? reverse?.[2];

	assert.ok(
		variable !== undefined && literal !== undefined,
		`the when-condition "${text}" is one equality between the active webview panel's view type and one quoted type; a negation (!=), a compound condition (&&, ||) or any other operator shows the entry on panels that are not this one`,
	);
	return { variable, literal };
}

let panelType: string | undefined;

/**
 * The view type the panel module declares: GRAPH_PANEL_VIEW_TYPE of
 * src/panel.ts, read out of the module itself (kzqwqptv, twtvwkqm). Nothing
 * here restates the name, so renaming the panel type moves this expectation
 * with the module instead of leaving a second copy of it behind.
 *
 * The extension host's module loader does not take the sources' extensionless
 * imports any further than the build does, so the module is compiled with the
 * esbuild the extension's own build uses and evaluated in this file, with the
 * host's `vscode` handed to it and no file written. Only the view type the
 * module exports is read from what it evaluates.
 */
async function panelViewType(): Promise<string> {
	if (panelType !== undefined) {
		return panelType;
	}
	const root = workspaceRoot();
	const compiled = await esbuild.build({
		entryPoints: [path.join(root, "src/panel.ts")],
		bundle: true,
		platform: "node",
		format: "cjs",
		external: ["vscode"],
		write: false,
		logLevel: "silent",
	});
	const evaluate = new Function(
		"require",
		"module",
		"exports",
		compiled.outputFiles[0].text,
	) as (
		require: (id: string) => unknown,
		module: { exports: Record<string, unknown> },
		exports: Record<string, unknown>,
	) => void;
	const hostRequire = createRequire(
		path.join(root, "tests/integration/srlrwowp-conformance.test.ts"),
	);
	const evaluated = { exports: {} as Record<string, unknown> };
	evaluate((id) => (id === "vscode" ? vscode : hostRequire(id)), evaluated, evaluated.exports);

	const declared = evaluated.exports["GRAPH_PANEL_VIEW_TYPE"];
	assert.strictEqual(typeof declared, "string", "the panel module declares its view type");
	panelType = declared as string;
	return panelType;
}

suite("the extension contributes the command that opens the graph (kzqwqptv)", () => {
	test("the invocation of the command is contributed to the workbench", async () => {
		const contributes = manifest().contributes as {
			commands?: { command: string; title: string }[];
			menus?: { "commandPalette"?: { command: string }[]; "editor/title"?: { command: string }[] };
		};

		// kzqwqptv: the command is contributed so the workbench lists it ...
		assert.ok(contributes.commands?.some((entry) => entry.command === OPEN_GRAPH_COMMAND));
		// ... on the Command Palette ...
		assert.ok(
			contributes.menus?.["commandPalette"]?.some((entry) => entry.command === OPEN_GRAPH_COMMAND),
		);
		// ... and on the panel title bar.
		assert.ok(
			contributes.menus?.["editor/title"]?.some((entry) => entry.command === OPEN_GRAPH_COMMAND),
		);
	});

	test("the panel title bar entry is shown exactly while the panel module's view type is the active panel", async () => {
		const entry = titleBarEntries().find(
			(candidate) => candidate.command === OPEN_GRAPH_COMMAND,
		);
		assert.ok(entry, `${OPEN_GRAPH_COMMAND} is an entry of the panel title bar`);

		// kzqwqptv: the title-bar entry belongs to the panel the command opens and to
		// no other, so its when-condition is the positive test of that panel: shown
		// when the active webview panel is this panel's view type, hidden otherwise.
		// The condition is read as that predicate — one variable, strictly equal to
		// one type — so a negated condition (shown on every other panel), a compound
		// one (shown on extra panels) or one testing something else all fail, and it
		// is read against the type the panel module creates its panel with, so the
		// manifest and the module have to name the same panel, whatever it is called.
		const when = entry.when ?? "";
		const condition = strictEquality(when);

		assert.strictEqual(
			condition.variable,
			WHEN_VIEW_TYPE_VARIABLE,
			`the when-condition "${when}" tests the active webview panel's view type`,
		);

		const declared = await panelViewType();
		assert.strictEqual(
			condition.literal,
			declared,
			`the when-condition "${when}" against the view type the panel module declares ("${declared}")`,
		);
	});

	test("the extension is activated and the command is registered", async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		assert.ok(extension, "the extension under development is loaded");

		await extension.activate();

		// kzqwqptv: the contributed command is a command the workbench can run.
		assert.ok((await vscode.commands.getCommands(true)).includes(OPEN_GRAPH_COMMAND));
	});
});

suite("invoking the command opens the panel (twtvwkqm)", () => {
	test("a webview panel titled Deccy Graph is open after the command", async () => {
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// twtvwkqm: invoking the command opens a panel titled Deccy Graph.
		const titles = vscode.window.tabGroups.all.flatMap((group) =>
			group.tabs.map((tab) => tab.label),
		);
		assert.ok(titles.includes(PANEL_TITLE), `open tabs: ${titles.join(", ")}`);
	});

	test("invoking the command again reveals the same panel instead of opening another", async () => {
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await vscode.commands.executeCommand(OPEN_GRAPH_COMMAND);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// twtvwkqm: the command opens the panel of the graph, not a second one.
		const panels = vscode.window.tabGroups.all
			.flatMap((group) => group.tabs)
			.filter((tab) => tab.label === PANEL_TITLE);

		assert.strictEqual(panels.length, 1);
	});
});

suite("the extension is displayed under the name its identity decision records (uuutyrzs)", () => {
	test("the manifest's display name is the form the identity decision records", () => {
		// uuutyrzs: the extension is `deccy-viewer`, displayed as the name that
		// sentence gives. The manifest carries the display name the workbench shows,
		// so it has to be that recorded form and not another name left behind by an
		// earlier identity.
		const recorded = recordedDisplayName();
		const declared = manifest().displayName;

		assert.strictEqual(
			declared,
			recorded,
			`the manifest's display name "${String(declared)}" against the form ${IDENTITY_DECISION} records ("${recorded}")`,
		);
	});
});

suite("the extension activates on a folder that carries the graph (vpqxkzxq)", () => {
	test("the activation event of the manifest matches the opened folder", () => {
		const events = manifest().activationEvents as string[];

		// vpqxkzxq: the extension is activated, which needs an activation event
		// that the opened folder fires. The mechanism is the manifest's; the
		// observable is that activation happens here (the checks above).
		assert.ok(events.includes("workspaceContains:nodes/*.json"));
		const folder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(folder, "a workspace folder is open");
	});
});
