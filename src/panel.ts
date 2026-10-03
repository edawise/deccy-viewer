/**
 * The webview panel of the deccy graph viewer (srlrwowp): the shell that
 * hosts the finished page (rtlotqvy) and feeds it across the seam the page
 * declares.
 *
 * The page is media/webview.html, and its comment says what the host owes it.
 * This module serves that file with every reference in it resolved through
 * webview.asWebviewUri: the stylesheet is src/styles/grammar.css as it stands,
 * the script is the compiled entry of src/webview/main.ts, and the codicon
 * stylesheet of the workbench supplies the toolbar glyph of the fit-graph
 * action (mspmqvuk). Nothing else is loaded.
 *
 * Across the seam — the message contract in src/webview/main.ts — the host
 * hands the page what it draws and what it cannot. The node documents and the
 * change descriptions from jj are read from the workspace root (qpsnwxlu) and
 * posted as one graph message of node records and labels; when the data cannot
 * be read, one error message carries the failure as it stands, and the page
 * shows it inline while the last successfully rendered graph stays on the
 * canvas (vxmzzunt). The page says when it is listening ("ready") and
 * everything is handed over again then. The page reports its selection for
 * the panel state to record (ltrnmrsr, rmsyvtvn) and asks for node documents
 * to be opened in the editor (trxzsqpv).
 *
 * The panel is kept in its panel state (yruxqknp): open, selection, pan, zoom
 * and node positions are recorded in workspaceState (rmsyvtvn), and a panel
 * restored after the extension was activated comes back with that last
 * interaction state (vpqxkzxq), handed to the page with the graph so the
 * viewer can pick the interaction up where it left off (state.ts).
 *
 * Nothing here is viewer behaviour: the page draws (rtlotqvy), the interaction
 * drives it (noplrntp) and the states of the graph data are presented by the
 * page (yruxqknp). This module serves the page, feeds it and keeps the panel's
 * record.
 */

import { readFileSync } from "node:fs";
import * as path from "node:path";

import * as vscode from "vscode";

import { labelForChange, loadJjLabels } from "./data/jj";
import { loadNodeRecords, NODES_DIR, NODE_ID_PATTERN } from "./data/nodes";
import type { GraphMessage, PageMessage } from "./webview/main";
import { createPanelState } from "./webview/state";
import type { PanelState, PanelStateKeeper } from "./webview/state";

/**
 * The type of the webview panel. The panel title bar menu is keyed on it
 * (kzqwqptv: `activeWebviewPanelId` in package.json).
 */
export const GRAPH_PANEL_VIEW_TYPE = "vscDeccy.graph";

/** The title of the webview panel (twtvwkqm). */
export const GRAPH_PANEL_TITLE = "Deccy Graph";

/** The page the panel serves (rtlotqvy). */
const PAGE = "media/webview.html";

/**
 * The codicon stylesheet of the workbench, shipped with the extension from
 * @vscode/codicons. It supplies the toolbar glyph of the fit-graph action
 * (mspmqvuk): media/webview.html names it among the references the host
 * resolves, and nothing else is loaded.
 */
const CODICON_CSS = "node_modules/@vscode/codicons/dist/codicon.css";

/** A reference in the page, resolved through webview.asWebviewUri when served. */
const PAGE_REFERENCE = /(\b(?:href|src))="([^"]+)"/g;

/** A message from the host to the page: the seam of main.ts and the panel state it restores (vpqxkzxq). */
type HostMessage = GraphMessage | PanelStateMessage;

/**
 * The panel state handed to the page when it is ready (vpqxkzxq: restore the
 * panel with its last interaction state). It is the persisted state of the
 * panel, which the page restores into a freshly attached interaction state
 * (state.ts: "its host hands it the persisted state"). The page takes nothing
 * it does not know (main.ts), so nothing else is required of it here.
 */
interface PanelStateMessage {
	type: "panelState";
	state: Readonly<PanelState>;
}

/** The panel that hosts the finished page (srlrwowp). */
export interface DeccyPanel {
	/** The webview panel titled Deccy Graph (twtvwkqm). */
	readonly webviewPanel: vscode.WebviewPanel;
	/**
	 * The panel state the panel is kept in and restored from (yruxqknp,
	 * rmsyvtvn). Recording what the user does to the panel goes through it.
	 */
	readonly state: PanelStateKeeper;
	/** Close the panel. */
	dispose(): void;
}

/** The one panel of the viewer, so the extension opens at most one (twtvwkqm). */
let current: DeccyPanel | undefined;

/**
 * Open the panel of the deccy graph viewer on its recorded panel state,
 * or reveal the panel when it is already open.
 *
 * The recorded state is the last interaction state of the panel this one
 * restores (vpqxkzxq, rmsyvtvn): it is handed to the page with the graph, and
 * from then on the keeper records what happens to the panel (yruxqknp) so the
 * next restore comes back as the user left it.
 */
export function openDeccyPanel(context: vscode.ExtensionContext): DeccyPanel {
	if (current !== undefined) {
		current.webviewPanel.reveal();
		return current;
	}

	// The panel state of this workspace (rmsyvtvn): the last interaction state
	// when the panel restores a previous one (vpqxkzxq), the default otherwise.
	const state = createPanelState(context.workspaceState);

	const webviewPanel = vscode.window.createWebviewPanel(
		GRAPH_PANEL_VIEW_TYPE,
		GRAPH_PANEL_TITLE,
		// Beside the editor the user is reading: a side panel for the graph
		// (uprztqnr).
		vscode.ViewColumn.Beside,
		{
			// The page runs the compiled entry of src/webview/main.ts and loads
			// its references from the extension (serve below, rtlotqvy).
			enableScripts: true,
			localResourceRoots: [context.extensionUri],
		},
	);

	const panel: DeccyPanel = {
		webviewPanel,
		state,
		dispose: (): void => {
			webviewPanel.dispose();
		},
	};
	current = panel;

	// The panel is open: it is restored the next time the extension is
	// activated (vpqxkzxq, rmsyvtvn).
	state.setOpen(true);

	serve(webviewPanel.webview, context);

	webviewPanel.webview.onDidReceiveMessage((message: unknown): void => {
		if (isReady(message)) {
			// The page is listening: hand it the graph data (qpsnwxlu) and then the
			// panel state it restores (vpqxkzxq) again, because the posting made
			// before it was listening may have been lost (main.ts).
			void handOver(webviewPanel.webview, state);
			return;
		}
		if (isSelection(message)) {
			// The page reports its selection (ltrnmrsr, main.ts) so the panel
			// state records it (rmsyvtvn) and the next restore brings it back.
			state.setSelection(message.id);
			return;
		}
		if (isOpenNode(message)) {
			// A double-click opens the node document in the editor (trxzsqpv).
			void openNodeDocument(message.id);
			return;
		}
		// Anything else on the channel belongs to the seam as the viewer grows
		// it (main.ts); the host has nothing to answer.
	});

	webviewPanel.onDidDispose((): void => {
		// The panel is closed, so there is nothing to restore next time
		// (vpqxkzxq). Everything it held is already written through to
		// workspaceState (yruxqknp, rmsyvtvn).
		state.setOpen(false);
		state.dispose();
		current = undefined;
	});

	return panel;
}

/**
 * Serve the page in the webview (rtlotqvy): media/webview.html with every
 * reference in it resolved through webview.asWebviewUri. The stylesheet is
 * src/styles/grammar.css as it stands and the script is the compiled entry of
 * src/webview/main.ts; the codicon stylesheet of the workbench (mspmqvuk) is
 * put beside them at the head of the page, and nothing else is loaded.
 */
function serve(webview: vscode.Webview, context: vscode.ExtensionContext): void {
	// The page is part of the extension and a small file: read as it stands,
	// so the panel is whole when this returns.
	const pagePath = path.join(context.extensionPath, PAGE);
	const template = readFileSync(pagePath, "utf8");

	const resolve = (reference: string): string =>
		webview.asWebviewUri(vscode.Uri.file(path.resolve(path.dirname(pagePath), reference))).toString();
	const resolved = template.replace(
		PAGE_REFERENCE,
		(_match, attribute: string, reference: string) => `${attribute}="${resolve(reference)}"`,
	);

	const codicon = webview
		.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, CODICON_CSS)))
		.toString();
	webview.html = resolved.replace(
		"\t</head>",
		`\t\t<link rel="stylesheet" href="${codicon}" />\n\t</head>`,
	);
}

/**
 * Hand the page what it needs to come back as the user left it (vpqxkzxq):
 * first the graph data, then the panel state to restore the interaction from.
 */
async function handOver(webview: vscode.Webview, state: PanelStateKeeper): Promise<void> {
	await sendGraph(webview);
	post(webview, { type: "panelState", state: state.current() });
}

/**
 * Read the graph data of the workspace root and hand it to the page across the
 * seam (qpsnwxlu): the node documents and the change descriptions from jj as
 * one graph message of node records and labels.
 *
 * When the data cannot be read from either source, one error message carries
 * the failure as it stands and the page shows it inline, keeping the last
 * successfully rendered graph (vxmzzunt).
 */
async function sendGraph(webview: vscode.Webview): Promise<void> {
	const root = workspaceRoot();
	if (root === undefined) {
		post(webview, {
			type: "error",
			message: `cannot read ${NODES_DIR}/: no workspace folder is open`,
		});
		return;
	}

	try {
		const records = await loadNodeRecords(root);
		const changes = await loadJjLabels(root);

		// The label of a node is the first line of the description of the
		// change it maps to (qpsnwxlu). The node ids are change id prefixes
		// frozen in the file names and jj may have lengthened them since, so
		// each one is looked up through the prefix fallback (jj.ts). A node
		// without a label falls back to its id on the page (render.ts).
		const labels: Record<string, string> = {};
		for (const record of records) {
			const label = labelForChange(changes, record.id);
			if (label !== undefined) {
				labels[record.id] = label;
			}
		}

		post(webview, { type: "graph", records, labels });
	} catch (error) {
		// Every failure of the data sources is user-facing as it stands
		// (vxmzzunt).
		post(webview, { type: "error", message: errorMessage(error) });
	}
}

/**
 * The workspace root the graph data is read from (qpsnwxlu): the root of the
 * first workspace folder, where the node documents live (zswmtqst) and the jj
 * repo of the change descriptions (svssunnl).
 */
function workspaceRoot(): string | undefined {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/** Hand one message to the page (the seam in src/webview/main.ts). */
function post(webview: vscode.Webview, message: HostMessage): void {
	void webview.postMessage(message);
}

/**
 * Open the node document of `id` in the editor (trxzsqpv): `nodes/<id>.json`
 * at the workspace root (zswmtqst). The id arrives from the page and is
 * trusted as data only: it must be a node id (mmsmukkk) before it is joined
 * onto the nodes directory, never interpreted, and a missing document reports
 * a failure instead of opening anything else.
 */
async function openNodeDocument(id: string): Promise<void> {
	const root = workspaceRoot();
	if (root === undefined) {
		void vscode.window.showErrorMessage(`cannot open ${id}.json: no workspace folder is open`);
		return;
	}
	const documentPath = path.join(root, NODES_DIR, `${id}.json`);
	try {
		const document = await vscode.workspace.openTextDocument(documentPath);
		await vscode.window.showTextDocument(document);
	} catch {
		void vscode.window.showErrorMessage(`cannot open ${NODES_DIR}/${id}.json`);
	}
}

/**
 * Whether the page has attached its listener and is ready to be fed. The page
 * announces itself once ("ready", PageMessage in main.ts); anything else on
 * the channel is the seam as the viewer grows it.
 */
function isReady(message: unknown): message is PageMessage {
	if (typeof message !== "object" || message === null || !("type" in message)) {
		return false;
	}
	return (message as { type: unknown }).type === "ready";
}

/**
 * Whether the page reports its selection (PageMessage in main.ts). The id is
 * recorded as-is (or cleared when null); anything else shaped is ignored.
 */
function isSelection(message: unknown): message is Extract<PageMessage, { type: "selection" }> {
	if (typeof message !== "object" || message === null) {
		return false;
	}
	const record = message as Record<string, unknown>;
	return (
		record.type === "selection" && (typeof record.id === "string" || record.id === null)
	);
}

/**
 * Whether the page asks for a node document to be opened (PageMessage in
 * main.ts). The id must already be a node id (mmsmukkk); anything else is
 * ignored before it can reach the file system (openNodeDocument).
 */
function isOpenNode(message: unknown): message is Extract<PageMessage, { type: "openNode" }> {
	if (typeof message !== "object" || message === null) {
		return false;
	}
	const record = message as Record<string, unknown>;
	return (
		record.type === "openNode" &&
		typeof record.id === "string" &&
		NODE_ID_PATTERN.test(record.id)
	);
}

/** The failure as the page shows it (vxmzzunt). */
function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
