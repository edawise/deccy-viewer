/**
 * Contract check: what running the extension shell (srlrwowp) must show
 * against the page (rtlotqvy) and the panel state (yruxqknp) it hosts.
 *
 * The prerequisites are the spec. The shell serves the page whose references
 * and script media/webview.html declares (rtlotqvy) and hands the page the
 * graph across the seam the page declares (GraphMessage in src/webview/main.ts,
 * rtlotqvy: node records and labels); it keeps the panel state the state module
 * declares (createPanelState and PANEL_STATE_KEY, yruxqknp). The page the shell
 * serves is the composition's page (tpztomkv: media/webview.html and the entry
 * point src/webview/main.ts it loads), so the check reads the page the panel's
 * webview really carries beside the page the extension ships. These are the
 * extension-host suites the runner split gives them (nrwunqtx: vitest.config.ts,
 * which leaves them to `npx vscode-test`), so the check also reads the two
 * runner configurations rather than trusting the run it happens to be in. It also answers
 * the page's request to open a content ref path (rptlovpt): the request names
 * a repo-relative path, and the shell resolves it inside the workspace root
 * and opens that file in the editor, reporting a failure instead of opening
 * anything else. The checks run inside the extension host the launch
 * configuration opens, so the page is asked for where the shell serves it (the
 * extension's own files), the state is asked for where the shell keeps it (the
 * state module the panel imports), and the open request is handed to the
 * panel's own message channel while the editor and the reported failures are
 * observed.
 *
 * The shell module the last of those checks exercises is compiled from
 * src/panel.ts with the esbuild the extension's own build uses and loaded as a
 * module of this extension, so the `vscode` it requires is the instance these
 * checks observe through (shellModule below).
 */
import * as assert from "node:assert";
import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import * as path from "node:path";

import esbuild from "esbuild";
import * as vscode from "vscode";

import { PANEL_STATE_KEY, createPanelState } from "../../src/webview/state.ts";

/**
 * The extension as the host installed it: the publisher and the package name
 * the shell's manifest (srlrwowp) declares for it. Everything below is observed
 * through this extension — its files and the `vscode` its modules require.
 */
const EXTENSION_ID = "edawise.deccy-viewer";

function extensionRoot(): string {
	return vscode.extensions.getExtension(EXTENSION_ID)?.extensionPath ?? "";
}

function workspaceRoot(): string {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
}

function page(): string {
	return readFileSync(path.join(extensionRoot(), "media/webview.html"), "utf8");
}

/**
 * The page's request that a repo-relative path be opened (the seam the page
 * declares in src/webview/main.ts, beside `openNode`). The request is the
 * interface this amendment introduces: no recorded node fixes its shape, so
 * the check names it here and the shell is free to answer it in whatever way
 * it resolves and opens the file.
 */
interface OpenRefRequest {
	type: "openRef";
	path: string;
}

/** The panel the shell opens, as the shell module offers it. */
interface ShellPanel {
	readonly webviewPanel: vscode.WebviewPanel;
	dispose(): void;
}

/** The part of the shell module the check opens a panel through. */
interface ShellModule {
	openDeccyPanel(context: vscode.ExtensionContext): ShellPanel;
}

let shell: ShellModule | undefined;

/**
 * The file a `require("vscode")` is attributed to when nothing else is known:
 * this check's own module, which the extension host runs as part of the
 * extension. Only the shell's own file name matters (shellModule), and this is
 * the file the loader is asked from.
 */
function checkModule(): string {
	return path.join(workspaceRoot(), "tests/integration/srlrwowp.test.ts");
}

/**
 * The shell module as this tree carries it: src/panel.ts compiled with the
 * extension's own esbuild, because the extension host's module loader does not
 * take the sources' extensionless imports further than the build does.
 *
 * The compiled module is written inside the extension — out/, the directory
 * the extension's build writes to — and removed as soon as it is loaded. The
 * extension host attributes the `vscode` a module requires to the file that
 * module lives in: a module outside the extension's files is handed the host's
 * default API instance, while the checks below observe the shell through the
 * extension's instance. Loading the shell beside the extension's own files is
 * what makes the API it requires the extension's — the same `window` these
 * checks patch, so the failures the shell reports are the ones they read. The
 * file exists only while it is being loaded.
 */
function shellModule(): ShellModule {
	if (shell !== undefined) {
		return shell;
	}
	const root = extensionRoot();
	assert.ok(root.length > 0, `the extension host runs the deccy extension under its id ${EXTENSION_ID}`);
	const outfile = path.join(root, "out", `.srlrwowp-suite-${process.pid}-${Date.now()}.cjs`);
	mkdirSync(path.dirname(outfile), { recursive: true });
	esbuild.buildSync({
		entryPoints: [path.join(workspaceRoot(), "src/panel.ts")],
		bundle: true,
		platform: "node",
		format: "cjs",
		external: ["vscode"],
		outfile,
		logLevel: "silent",
	});
	try {
		shell = createRequire(checkModule())(outfile) as ShellModule;
	} finally {
		rmSync(outfile, { force: true });
	}
	return shell;
}

/** The panel state store a check's own panel is opened on. */
function panelStateStore(): vscode.Memento {
	const values = new Map<string, unknown>();
	return {
		keys: (): readonly string[] => [...values.keys()],
		get: <T>(key: string, fallback?: T): T | undefined =>
			values.has(key) ? (values.get(key) as T) : fallback,
		update: async (key: string, value: unknown): Promise<void> => {
			values.set(key, value);
		},
		setKeysForSync: (): void => {},
	} as unknown as vscode.Memento;
}

/** The context a check's own panel is opened on: this repository is the extension's tree. */
function panelContext(): vscode.ExtensionContext {
	const root = workspaceRoot();
	return {
		subscriptions: [],
		extensionPath: root,
		extensionUri: vscode.Uri.file(root),
		workspaceState: panelStateStore(),
		globalState: panelStateStore(),
	} as unknown as vscode.ExtensionContext;
}

/**
 * Hand a message to the panel where VS Code hands it the page's messages: the
 * message emitter of the webview the panel serves. A check cannot run script
 * in the page, so it delivers the request to the listener the page's
 * postMessage reaches; everything the shell does from there is the shell's own
 * code.
 */
function fromPage(panel: vscode.WebviewPanel, message: unknown): void {
	const webview = panel.webview as unknown as {
		_onMessageEmitter?: { fire(message: unknown): void };
	};
	assert.ok(
		webview._onMessageEmitter,
		"the extension host hands the page's messages to the webview's message emitter",
	);
	webview._onMessageEmitter?.fire(message);
}

/** The documents the workbench opens while a check runs. */
function openedDocuments(): { documents: vscode.TextDocument[]; stop(): void } {
	const documents: vscode.TextDocument[] = [];
	const subscription = vscode.workspace.onDidOpenTextDocument((document) => {
		documents.push(document);
	});
	return {
		documents,
		stop: (): void => subscription.dispose(),
	};
}

/**
 * The failures the shell reports to the user, as they are reported. How the
 * shell reports a failure is its own (rptlovpt), so both channels the extension
 * host offers the shell are observed and a report on either counts: the
 * workbench's message notifications, and the message channel to the page, whose
 * failure presentation is painted inline (main.ts: HostMessage, "error").
 */
function reportedFailures(panel: vscode.WebviewPanel): { messages: string[]; stop(): void } {
	const messages: string[] = [];
	const window = vscode.window as unknown as Record<string, unknown>;
	const notifications = ["showErrorMessage", "showWarningMessage", "showInformationMessage"] as const;
	const notificationsBefore = notifications.map((name) => [name, window[name]] as const);
	for (const name of notifications) {
		window[name] = (message: string): Thenable<unknown> => {
			messages.push(message);
			return Promise.resolve(undefined);
		};
	}
	const webview = panel.webview as unknown as {
		postMessage(message: unknown): Thenable<unknown>;
	};
	const postMessageBefore = webview.postMessage;
	webview.postMessage = (message: unknown): Thenable<unknown> => {
		if (isFailureMessage(message)) {
			messages.push(message.message);
		}
		return Promise.resolve(true);
	};
	return {
		messages,
		stop: (): void => {
			for (const [name, original] of notificationsBefore) {
				window[name] = original;
			}
			webview.postMessage = postMessageBefore;
		},
	};
}

/** Whether a message the shell hands the page is the page's failure presentation (main.ts). */
function isFailureMessage(message: unknown): message is { type: "error"; message: string } {
	if (typeof message !== "object" || message === null) {
		return false;
	}
	const record = message as Record<string, unknown>;
	return record.type === "error" && typeof record.message === "string";
}

/**
 * The documents the workbench has open, by the file each one names. This is
 * the workbench's own record of what is open, not the active editor — the
 * workbench clears `window.activeTextEditor` while an extension awaits, which
 * says nothing about what is open or shown.
 */
function openDocumentPaths(): string[] {
	return vscode.workspace.textDocuments.map((document) => document.uri.fsPath);
}

/** The documents the workbench shows in editors, by the file each one names. */
function shownDocumentPaths(): string[] {
	return vscode.window.visibleTextEditors.map((editor) => editor.document.uri.fsPath);
}

/**
 * The files of the opened workspace the workbench has open. The workbench keeps
 * documents of its own open as well (an input box, the scm input); they are not
 * files a request to open a ref path could show, and are left out here.
 */
function openWorkspaceFiles(): string[] {
	const root = workspaceRoot();
	return openDocumentPaths().filter((file) => {
		const relative = path.relative(root, file);
		return path.isAbsolute(file) && !relative.startsWith("..") && !path.isAbsolute(relative);
	});
}

/** The files in `before` that `after` no longer carries. */
function dropped(before: readonly string[], after: readonly string[]): string[] {
	return before.filter((file) => !after.includes(file));
}

/**
 * The string literals a runner configuration gives `key` as its glob list: the
 * suites a runner claims, as the configuration states them.
 */
function runnerGlobs(configuration: string, key: string): string[] {
	const value =
		new RegExp(`${key}\\s*:\\s*(\\[[^\\]]*\\]|"[^"]*"|'[^']*')`).exec(configuration)?.[1] ?? "";
	return [...value.matchAll(/"([^"]+)"|'([^']+)'/g)].map((match) => match[1] ?? match[2] ?? "");
}

/**
 * Whether a repo-relative path is one a runner's glob names: `**` crosses
 * directories, `*` and `?` stay within a path segment.
 */
function globNames(file: string, glob: string): boolean {
	const source = glob
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*\*\//g, "\u0000")
		.replace(/\*\*/g, ".*")
		.replace(/\*/g, "[^/]*")
		.replace(/\?/g, "[^/]")
		.replace(/\u0000/g, "(?:[^/]+/)*");
	return new RegExp(`^${source}$`).test(file);
}

/** Wait for `condition` to hold, failing with `expectation` when it does not. */
async function waitFor(
	condition: () => boolean,
	expectation: string,
	timeout = 15000,
): Promise<void> {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
	assert.ok(condition(), expectation);
}

/**
 * Let the workbench finish what the request started before its records are
 * read, so a failure the shell reports and an open it performs anyway cannot
 * be read apart by timing.
 */
async function settle(milliseconds = 500): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, milliseconds));
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

	suite("the shell serves the page the viewer composition owns (tpztomkv)", function () {
	// The panel's webview carries the page it serves, so the comparison is
	// made once the shell has opened it.
	this.timeout(60000);

	test("the panel's page is the composed page media/webview.html, its references served from the extension", () => {
		// tpztomkv: media/webview.html is the page the panel presents, and its
		// references are what the host resolves through webview.asWebviewUri.
		const pagePath = path.join(extensionRoot(), "media/webview.html");
		const composed = readFileSync(pagePath, "utf8");
		const references = [...composed.matchAll(/(\b(?:href|src))="([^"]+)"/g)].map(
			(match) => [match[1] ?? "", match[2] ?? ""] as const,
		);
		assert.ok(references.length > 0, "the composed page declares the references it loads");

		const panel = shellModule().openDeccyPanel(panelContext());
		try {
			const webview = panel.webviewPanel.webview;
			const served = webview.html;

			// tpztomkv: the markup of the page the composition owns is the markup
			// the panel serves. References are compared apart, below, because the
			// host rewrites their values; what the shell adds beside the page (the
			// codicon stylesheet, mspmqvuk) is an addition and does not count
			// against a line the page carries.
			const withoutReferences = (html: string): string =>
				html.replace(/(\b(?:href|src))="[^"]*"/g, '$1=""');
			const servedWithoutReferences = withoutReferences(served);
			for (const line of withoutReferences(composed).split("\n")) {
				const text = line.trim();
				if (text.length === 0) {
					continue;
				}
				assert.ok(
					servedWithoutReferences.includes(text),
					`the panel serves the composed page: ${text}`,
				);
			}

			// tpztomkv: and each reference the page declares is served as the
			// file of the extension it names, resolved against the page's own
			// directory through the workbench's webview URI — not left as the
			// relative path the page carries.
			for (const [attribute, reference] of references) {
				const file = vscode.Uri.file(path.resolve(path.dirname(pagePath), reference));
				const servedUri = webview.asWebviewUri(file).toString();
				assert.ok(
					served.includes(`${attribute}="${servedUri}"`),
					`the panel serves ${reference} as ${servedUri}`,
				);
			}
		} finally {
			panel.dispose();
		}
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

suite("the shell answers the page's open request for a content ref path (rptlovpt)", function () {
	// The shell answers asynchronously (it opens a document and shows it), so
	// the suite waits longer than the check's own wait, whose failure names what
	// the shell did not do.
	this.timeout(60000);

	test("a repo-relative path opens that file, resolved inside the workspace root", async () => {
		// rptlovpt: a content ref path is a control that opens that
		// repo-relative file in the editor. src/panel.ts is a path a node of
		// this graph carries in content.ref, so it is one the panel shows and
		// one an activation can name.
		const target = path.join(workspaceRoot(), "src/panel.ts");
		assert.ok(existsSync(target), "the ref path names a file of the workspace");

		const panel = shellModule().openDeccyPanel(panelContext());
		const opened = openedDocuments();
		try {
			fromPage(panel.webviewPanel, {
				type: "openRef",
				path: "src/panel.ts",
			} satisfies OpenRefRequest);

			await waitFor(
				() => shownDocumentPaths().includes(target),
				`an editor shows ${target}: the ref path opened the file it names, resolved inside the workspace root`,
			);
			assert.ok(
				opened.documents.some((document) => document.uri.fsPath === target),
				`${target} is the document that was opened`,
			);
		} finally {
			opened.stop();
			panel.dispose();
		}
	});

	test("a repo-relative path that names no file reports a failure and opens nothing", async () => {
		const requested = path.join(workspaceRoot(), "src/webview/this-path-names-no-file.ts");
		assert.ok(!existsSync(requested), "the ref path names no file of the workspace");
		const documentsBefore = openWorkspaceFiles();
		const shownBefore = shownDocumentPaths();

		const panel = shellModule().openDeccyPanel(panelContext());
		const opened = openedDocuments();
		const reported = reportedFailures(panel.webviewPanel);
		try {
			fromPage(panel.webviewPanel, {
				type: "openRef",
				path: "src/webview/this-path-names-no-file.ts",
			} satisfies OpenRefRequest);

			await waitFor(
				() => reported.messages.length > 0,
				"the shell reports that the ref path cannot be opened",
			);
			await settle();

			assert.deepStrictEqual(
				opened.documents
					.map((document) => document.uri.fsPath)
					.filter((file) => file === requested),
				[],
				"a path that names no file opens no document",
			);
			assert.ok(!openDocumentPaths().includes(requested), "the path that names no file is not open");
			assert.ok(
				!shownDocumentPaths().includes(requested),
				"the path that names no file is shown in no editor",
			);
			// The editor keeps the document it showed: nothing the request did
			// closed it, whatever the active editor is at the moment it is read.
			assert.deepStrictEqual(
				dropped(documentsBefore, openWorkspaceFiles()),
				[],
				"the editor keeps the documents it had open",
			);
			assert.deepStrictEqual(
				dropped(shownBefore, shownDocumentPaths()),
				[],
				"the editor keeps showing what it showed",
			);
		} finally {
			reported.stop();
			opened.stop();
			panel.dispose();
		}
	});

	test("a path that resolves outside the workspace root is reported, not opened", async () => {
		// A file that exists, outside the folder the extension opened: a
		// repo-relative path resolved inside the workspace root names no such
		// file, so the request is answered with a failure and nothing else is
		// opened.
		const outside = path.join(mkdtempSync(path.join(tmpdir(), "deccy-ref-open-")), "outside.ts");
		writeFileSync(outside, "// a file outside the workspace root\n");
		const root = workspaceRoot();
		assert.ok(
			path.relative(root, outside).startsWith(".."),
			"the file the request names is outside the workspace root",
		);
		const documentsBefore = openWorkspaceFiles();
		const shownBefore = shownDocumentPaths();

		const panel = shellModule().openDeccyPanel(panelContext());
		const opened = openedDocuments();
		const reported = reportedFailures(panel.webviewPanel);
		try {
			fromPage(panel.webviewPanel, { type: "openRef", path: outside } satisfies OpenRefRequest);

			await waitFor(
				() => reported.messages.length > 0,
				"the shell reports a path it cannot resolve inside the workspace root",
			);
			await settle();

			const outsideRoot = (file: string): boolean =>
				file === outside || path.relative(root, file).startsWith("..");
			assert.deepStrictEqual(
				opened.documents.map((document) => document.uri.fsPath).filter(outsideRoot),
				[],
				"nothing outside the workspace root is opened",
			);
			assert.deepStrictEqual(
				openDocumentPaths().filter(outsideRoot),
				[],
				"no document outside the workspace root is open",
			);
			assert.deepStrictEqual(
				shownDocumentPaths().filter(outsideRoot),
				[],
				"no editor outside the workspace root is shown",
			);
			// The editor keeps the document it showed, as in the check above:
			// read from the workbench's own records, not from the active editor.
			assert.deepStrictEqual(
				dropped(documentsBefore, openWorkspaceFiles()),
				[],
				"the editor keeps the documents it had open",
			);
			assert.deepStrictEqual(
				dropped(shownBefore, shownDocumentPaths()),
				[],
				"the editor keeps showing what it showed",
			);
		} finally {
			reported.stop();
			opened.stop();
			panel.dispose();
		}
	});
});

suite("the shell's checks are the extension-host suites the runner split gives them (nrwunqtx)", () => {
	test("this suite is filed by the extension-host runner and claimed by no Vitest project", () => {
		// nrwunqtx holds vitest.config.ts: the unit and webview suites run under
		// Vitest, the extension-host suites under `npx vscode-test`
		// (.vscode-test.mjs), which is the runner this check is running in. The
		// host runner filing it is what makes the checks run against a real
		// extension host; that Vitest leaves it alone is what keeps it from being
		// run a second time in a runner without that host. Both are read from the
		// configurations rather than assumed.
		const suite = "tests/integration/srlrwowp.test.ts";
		const root = workspaceRoot();
		assert.ok(root.length > 0, "the extension host runs this check in the opened workspace");

		const hostRunner = readFileSync(path.join(root, ".vscode-test.mjs"), "utf8");
		const hostGlobs = runnerGlobs(hostRunner, "files");
		assert.ok(hostGlobs.length > 0, ".vscode-test.mjs names the suites the extension host runs");
		assert.ok(
			hostGlobs.some((glob) => globNames(suite, glob)),
			`.vscode-test.mjs files ${suite} for the extension host`,
		);

		const unitRunner = readFileSync(path.join(root, "vitest.config.ts"), "utf8");
		const unitGlobs = runnerGlobs(unitRunner, "include");
		assert.ok(unitGlobs.length > 0, "vitest.config.ts includes the suites Vitest runs");
		assert.deepStrictEqual(
			unitGlobs.filter((glob) => globNames(suite, glob)),
			[],
			`vitest.config.ts leaves ${suite} to the extension host`,
		);
	});
});
