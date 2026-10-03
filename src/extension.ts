/**
 * The extension entry point of the deccy graph viewer (srlrwowp): the
 * shell that hosts the finished page.
 *
 * vsc-deccy visualises the deccy graph of a project (uuutyrzs). This
 * module does only what the extension does around the panel, before anything
 * is drawn:
 *
 * - it contributes the command vscDeccy.openGraph (kzqwqptv; contributed
 *   in package.json to the Command Palette and the panel title bar);
 * - invoking the command opens the webview panel titled Deccy Graph
 *   (twtvwkqm, src/panel.ts);
 * - when the extension is activated and the panel was previously open, the
 *   panel is restored with its last interaction state (vpqxkzxq).
 *
 * Nothing here is viewer behaviour: the page draws the graph (rtlotqvy), the
 * interaction drives it (noplrntp) and what the user does to the panel is
 * recorded in workspaceState (yruxqknp, rmsyvtvn). This module only decides
 * when the panel opens; the panel itself is src/panel.ts.
 */

import * as vscode from "vscode";

import { openDeccyPanel } from "./panel";
import { readPanelState } from "./webview/state";

/** The command the extension contributes (kzqwqptv). */
export const OPEN_GRAPH_COMMAND = "vscDeccy.openGraph";

/**
 * Register the command and restore the panel of a previous session.
 *
 * The panel state is what the user did to the panel and would not want to lose
 * (yruxqknp), and it persists in workspaceState (rmsyvtvn). Its `open` field
 * records that the panel was open, so a panel the user left open is restored —
 * with its last interaction state (vpqxkzxq) — and a panel the user closed
 * stays closed.
 */
export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand(OPEN_GRAPH_COMMAND, () => {
			// Invoking the command opens the webview panel titled Deccy
			// Graph (twtvwkqm).
			openDeccyPanel(context);
		}),
	);

	// The extension is activated and the panel was previously open: restore
	// the panel with its last interaction state (vpqxkzxq). The panel is
	// opened on the state recorded of it (src/panel.ts) and hands that state
	// to the page, so the interaction comes back as the user left it.
	if (readPanelState(context.workspaceState).open) {
		openDeccyPanel(context);
	}
}
