/**
 * The loading, empty and error presentation of the deccy graph viewer
 * (yruxqknp), and the input queue that runs alongside the loading one.
 *
 * Three things can be true of the graph data while the viewer runs, and the
 * panel must say so instead of showing a blank or a stale frame:
 *
 * - the data is being loaded or reloaded (ywullzun): a progress indicator
 *   overlays the canvas in the workbench progress styling (vmruuytr), and user
 *   interaction input arriving meanwhile is queued and applied when the load
 *   finishes — queued, never dropped (ywullzun);
 * - the data is loaded and the repo contains no nodes (twslmwvn): an
 *   empty-state message stands in for the blank canvas (utyvzkwu);
 * - the data cannot be read (vxmzzunt): an inline error banner below the
 *   toolbar (utzyzwmu, zrqxuzzy) carries the failure message as-is, and the
 *   last successfully rendered graph stays on the canvas (vxmzzunt) — the
 *   banner never replaces or blocks it.
 *
 * Nothing is drawn here beyond the three presentation elements; the graph
 * itself belongs to the renderer (rtlotqvy). They live under the page
 * interface (ympqvvwr): the `canvas` and `banner` of {@link StatesView} —
 * the progress indicator (vmruuytr) and the empty-state message (utyvzkwu)
 * go on the canvas without taking pointer input, so interaction carries on
 * underneath them, and the inline error banner (utzyzwmu, zrqxuzzy) goes
 * below the toolbar.
 *
 * The input queue is the other half of the loading state (ywullzun): while the
 * data loads, {@link StatesController.input} holds every action handed to it
 * and runs them, in order, when the load ends. {@link queueInput} routes the
 * user interaction input of an interaction controller (noplrntp) through such
 * a queue, so keyboard and programmatic input is queued rather than dropped.
 */

import type {
	InputQueue,
	InteractionController,
	Presentation,
	StatesController,
	StatesView,
} from "./contract";

/** The empty-state message (twslmwvn, utyvzkwu). */
export const EMPTY_STATE_MESSAGE = "This repository contains no nodes.";

/** The accessible label of the progress indicator (vmruuytr). */
export const LOADING_LABEL = "Loading graph\u2026";

/**
 * The presentation, the input queue and the states view live in the page
 * interface (ympqvvwr, contract.ts); this module implements them for the
 * loading, empty and error states.
 */

/**
 * Create the presentation elements, put them under the contract above and
 * return the states they present. Every transition is idempotent: the elements
 * follow the {@link Presentation}, and nothing else about the panel changes.
 */
export function attachStates(view: StatesView): StatesController {
	const owner = view.canvas.ownerDocument;
	const progress = createProgress(owner);
	const empty = createEmpty(owner);
	const error = createBanner(owner);
	view.canvas.append(progress, empty);
	view.banner.append(error);

	let presentation: Presentation = { loading: false, empty: false, error: null };

	// --- input queue (ywullzun) --------------------------------------------

	/** Input held while the data is loading, in the order it arrived. */
	const queued: (() => void)[] = [];

	const flush = (): void => {
		const actions = queued.splice(0, queued.length);
		for (const action of actions) {
			action();
		}
	};

	const input: InputQueue = {
		run(action: () => void): void {
			if (presentation.loading) {
				queued.push(action);
			} else {
				action();
			}
		},
		pending: (): number => queued.length,
		clear: (): void => {
			queued.length = 0;
		},
	};

	// --- presentation (vmruuytr, utyvzkwu, utzyzwmu) ------------------------

	function beginLoading(): void {
		presentation = { ...presentation, loading: true };
		progress.hidden = false;
	}

	function loaded(nodeCount: number): void {
		// A successful read settles whatever the last one left behind: the
		// progress indicator goes (ywullzun), the empty-state message stands in
		// for a blank canvas when the repo holds no nodes (twslmwvn), and a
		// stale error banner goes with it (vxmzzunt).
		presentation = { loading: false, empty: nodeCount === 0, error: null };
		progress.hidden = true;
		empty.hidden = !presentation.empty;
		error.hidden = true;
		view.banner.hidden = true;
		flush();
	}

	function failed(message: string): void {
		// The canvas keeps whatever was rendered last (vxmzzunt); only the
		// banner appears, below the toolbar and without blocking the canvas
		// (utzyzwmu, zrqxuzzy). The empty-state message stands as it was: it
		// too is the last successful read.
		presentation = { ...presentation, loading: false, error: message };
		progress.hidden = true;
		error.textContent = message;
		error.hidden = false;
		view.banner.hidden = false;
		flush();
	}

	function state(): Readonly<Presentation> {
		return presentation;
	}

	function dispose(): void {
		queued.length = 0;
		progress.remove();
		empty.remove();
		error.remove();
		view.banner.hidden = true;
	}

	return { state, beginLoading, loaded, failed, input, dispose };
}

/**
 * Route the user interaction input of an interaction controller through an
 * input queue (ywullzun): while the graph data is loading, every command the
 * user drives is queued and run, in order, when the load finishes, and the
 * reads pass straight through. Swapping the graph in and tearing the
 * controller down are not user input and run at once.
 */
export function queueInput(
	controller: InteractionController,
	input: InputQueue,
): InteractionController {
	return {
		viewport: () => controller.viewport(),
		selected: () => controller.selected(),
		focused: () => controller.focused(),
		select: (id) => input.run(() => controller.select(id)),
		clearSelection: () => input.run(() => controller.clearSelection()),
		focusNode: (id) => input.run(() => controller.focusNode(id)),
		focusStep: (reverse) => input.run(() => controller.focusStep(reverse)),
		panBy: (dx, dy) => input.run(() => controller.panBy(dx, dy)),
		zoomAt: (factor, at) => input.run(() => controller.zoomAt(factor, at)),
		zoomAboutCentre: (factor) => input.run(() => controller.zoomAboutCentre(factor)),
		fitGraph: () => input.run(() => controller.fitGraph()),
		moveNodeBy: (id, dx, dy) => input.run(() => controller.moveNodeBy(id, dx, dy)),
		setGraph: (graph) => controller.setGraph(graph),
		dispose: () => controller.dispose(),
	};
}

// --- helpers ----------------------------------------------------------------

/**
 * The progress indicator over the canvas (vmruuytr): the workbench progress
 * styling, with no surface of its own so input reaches the canvas under it and
 * is queued rather than swallowed (ywullzun).
 */
function createProgress(document: Document): HTMLElement {
	const overlay = document.createElement("div");
	overlay.className = "state-progress";
	overlay.setAttribute("role", "status");
	overlay.setAttribute("aria-label", LOADING_LABEL);
	overlay.hidden = true;
	const bar = document.createElement("div");
	bar.className = "state-progress-bar";
	overlay.appendChild(bar);
	return overlay;
}

/**
 * The empty-state message on the canvas (utyvzkwu), shown instead of a blank
 * canvas when the repo contains no nodes (twslmwvn).
 */
function createEmpty(document: Document): HTMLElement {
	const message = document.createElement("div");
	message.className = "state-empty";
	message.setAttribute("role", "status");
	message.textContent = EMPTY_STATE_MESSAGE;
	message.hidden = true;
	return message;
}

/**
 * The inline error banner below the toolbar (utzyzwmu, zrqxuzzy), carrying the
 * failure message as-is (vxmzzunt).
 */
function createBanner(document: Document): HTMLElement {
	const banner = document.createElement("div");
	banner.className = "state-error";
	banner.setAttribute("role", "alert");
	banner.hidden = true;
	return banner;
}
