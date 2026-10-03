/**
 * Bootstrap of the interactive HTML page (media/webview.html, vylxkuxr,
 * uprztqnr): it attaches to the page regions of the panel chrome (zrqxuzzy),
 * receives the graph across the webview seam and draws it.
 *
 * The seam is the message contract below. The extension host reads the node
 * documents and the jj change descriptions (qpsnwxlu) and posts them here as
 * node records and labels; this module assembles the graph (model.ts), orders
 * it deterministically (order.ts), lays it out (layout.ts) and hands the
 * geometry to the renderer (render.ts). Nothing on this side reads the
 * workspace: the page only ever sees what the host posts it.
 *
 * This module is the composition root of the page interface (ympqvvwr): on
 * the first graph it attaches the interaction state (noplrntp), the keyboard
 * equivalents (ykvrkysl), the loading, empty and error presentation (yruxqknp)
 * and the fit-graph action (mspmqvuk) to the regions of the page, and restores
 * the persisted panel state the host hands it (vpqxkzxq, state.ts). A later
 * graph swaps the data out from under the interactions without losing the
 * selection, pan or zoom (luqwqrll).
 */

import type { NodeRecord } from "../data/nodes";
import { buildGraph } from "../graph/model";
import type { GraphModel } from "../graph/model";
import { graphOrder } from "../graph/order";
import type { GraphOrder } from "../graph/order";
import { layoutGraph } from "../graph/layout";
import type { GraphLayout, Point } from "../graph/layout";
import { renderGraph } from "./render";
import type { RenderTarget } from "./render";
import { attachInteractions } from "./interact";
import { attachKeyboard } from "./keyboard";
import { attachStates, queueInput } from "./states";
import type {
	InteractionController,
	InteractionDelegate,
	InteractionGraph,
	InteractionView,
	StatesController,
} from "./contract";
import { SELECTORS } from "./contract";
import { applyPanelState } from "./state";
import type { PanelState } from "./state";

/** A message from the extension host to the page. */
export type GraphMessage =
	| {
			type: "graph";
			/** The validated node records the graph is built from (qpsnwxlu). */
			records: readonly NodeRecord[];
			/** The jj change descriptions by node id, used as node labels (qpsnwxlu). */
			labels: Readonly<Record<string, string>>;
	  }
	| {
			type: "error";
			/** The user-facing failure to show inline (vxmzzunt). */
			message: string;
	  };

/**
 * The persisted panel state handed to the page when it is ready (vpqxkzxq).
 * The host defines the same envelope (panel.ts); the two stay in step as the
 * seam grows.
 */
export type PanelStateMessage = {
	type: "panelState";
	state: PanelState;
};

/**
 * A message from the page to the extension host. The page posts "ready" once
 * its listener is attached (see below); selection and open requests answer
 * through the same channel, and the host records what the page reports
 * (srlrwowp).
 */
export type PageMessage =
	| { type: "ready" }
	| { type: "selection"; id: string | null }
	| { type: "openNode"; id: string };

/** The part of the VS Code webview API the page uses. */
interface VsCodeApi {
	postMessage(message: PageMessage): void;
	getState(): unknown;
	setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const target: RenderTarget = {
	edges: mustGet<SVGSVGElement>(SELECTORS.edges),
	nodes: mustGet<HTMLElement>(SELECTORS.nodes),
};

const canvas = mustGet<HTMLElement>(SELECTORS.canvas);
const surface = mustGet<HTMLElement>(SELECTORS.surface);
const banner = mustGet<HTMLDivElement>(SELECTORS.banner);
const detailBody = mustGet<HTMLElement>(SELECTORS.detailBody);
const fitButton = mustGet<HTMLButtonElement>(SELECTORS.fitAction);

/**
 * The graph reaches the page as a message from the extension host. When the
 * page runs outside the workbench there is no host to post it, so the API is
 * optional and only the reply channel goes without it.
 */
const vscode: VsCodeApi | undefined =
	typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

/** The presentation of the loading, empty and error states (yruxqknp). */
const states: StatesController = attachStates({ canvas, banner });
states.beginLoading();

let model: GraphModel | undefined;
let order: GraphOrder | undefined;
let labels = new Map<string, string>();
/** The persisted panel state, however it arrived (vpqxkzxq, state.ts). */
let persisted: PanelState | undefined;
let controller: InteractionController | undefined;
let queued: InteractionController | undefined;

/**
 * The renderer (rtlotqvy), reached from the interaction state. The recorded
 * node positions come first and the live drag positions override them, so a
 * reload keeps where the user put nodes (luqwqrll, rmsyvtvn).
 */
const delegate: InteractionDelegate = {
	relayout(dragged: ReadonlyMap<string, Point>): GraphLayout {
		if (model === undefined || order === undefined) {
			throw new Error("the graph has not arrived yet");
		}
		const merged = new Map<string, Point>();
		if (persisted !== undefined) {
			for (const [id, position] of Object.entries(persisted.positions)) {
				merged.set(id, { x: position.x, y: position.y });
			}
		}
		for (const [id, position] of dragged) {
			merged.set(id, position);
		}
		// The layout is computed twice: the first pass draws the boxes at
		// their minimum height (owtptzpl) so the renderer can measure how far
		// each label wrapped, and the second pass re-routes the edges from
		// the measured boxes (layout.ts).
		let layout = layoutGraph(model, order, { dragged: merged });
		const heights = renderGraph(target, { model, order, layout, labels });
		layout = layoutGraph(model, order, { dragged: merged, heights });
		renderGraph(target, { model, order, layout, labels });
		return layout;
	},
	onSelectionChanged(id: string | null): void {
		// The selection shows the node's kind, content and rationale
		// (ltrnmrsr) and is reported so the host can record it (srlrwowp).
		renderDetail(id);
		post({ type: "selection", id });
	},
	openNodeDocument(id: string): void {
		post({ type: "openNode", id });
	},
};

/**
 * Draw the graph of `records` and label its nodes from `labels`.
 *
 * The first graph attaches the interactions, keyboard, presentation queue
 * and fit action to the page (ympqvvwr) and restores the persisted panel
 * state into them; every later graph swaps the data out from under the
 * interactions, keeping the selection, pan and zoom (luqwqrll).
 */
export function showGraph(
	records: readonly NodeRecord[],
	names: Readonly<Record<string, string>>,
): void {
	model = buildGraph(records);
	order = graphOrder(model);
	labels = new Map(Object.entries(names));

	if (controller === undefined || queued === undefined) {
		const view: InteractionView = { canvas, surface };
		const graph: InteractionGraph = { model, order };
		controller = attachInteractions(view, delegate, graph);
		queued = queueInput(controller, states.input);
		attachKeyboard(queued, view);
		fitButton.addEventListener("click", (): void => {
			queued?.fitGraph();
		});
		states.loaded(records.length);
		if (persisted !== undefined) {
			applyPanelState(queued, persisted);
		}
		renderDetail(controller.selected());
	} else {
		controller.setGraph({ model, order });
		states.loaded(records.length);
		renderDetail(controller.selected());
	}
}

/** Show the kind, content and rationale of the selected node (ltrnmrsr). */
function renderDetail(id: string | null): void {
	detailBody.replaceChildren();
	if (id === null || model === undefined) {
		return;
	}
	const node = model.nodes.find((candidate) => candidate.id === id);
	if (node === undefined) {
		return;
	}
	const kind = document.createElement("div");
	kind.className = "detail__kind";
	kind.textContent = node.kind;
	const rationale = document.createElement("div");
	rationale.className = "detail__rationale";
	rationale.textContent = node.content.rationale;
	const content = document.createElement("div");
	content.className = "detail__content";
	content.textContent =
		typeof node.content.content === "string" ? node.content.content : JSON.stringify(node.content);
	detailBody.append(kind, rationale, content);
}

/** Restore the persisted panel state, now or at attach (vpqxkzxq). */
function restorePanelState(state: PanelState): void {
	persisted = state;
	if (queued !== undefined) {
		applyPanelState(queued, state);
	}
}

/** Act on one message from the extension host. */
export function receive(message: GraphMessage | PanelStateMessage): void {
	if (message.type === "panelState") {
		restorePanelState(message.state);
	} else if (message.type === "graph") {
		showGraph(message.records, message.labels);
	} else {
		states.failed(message.message);
	}
}

/** Hand one message to the host (the seam in the header). */
function post(message: PageMessage): void {
	vscode?.postMessage(message);
}

window.addEventListener("message", (event: MessageEvent<unknown>): void => {
	const message = event.data;
	if (isHostMessage(message)) {
		receive(message);
	}
});

// The listener above is attached synchronously while this module runs, but the
// host may already have posted the first graph state by then and lost the
// message. Announcing that the page is listening lets the host post it again.
post({ type: "ready" });

/**
 * A shallow check of a message from the host. Its fields are trusted as data
 * only: they are rendered as text and never interpreted.
 */
function isHostMessage(value: unknown): value is GraphMessage | PanelStateMessage {
	if (typeof value !== "object" || value === null || !("type" in value)) {
		return false;
	}
	const type = (value as { type: unknown }).type;
	return type === "graph" || type === "error" || type === "panelState";
}

/** One of the page regions the graph is drawn or reported into (media/webview.html). */
function mustGet<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (element === null) {
		throw new Error(`media/webview.html is missing ${selector}`);
	}
	return element;
}
