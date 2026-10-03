/**
 * The page interface of the deccy graph viewer (ympqvvwr): the single
 * contract the page (rtlotqvy), the interaction state (noplrntp) and the
 * presentation and panel state (yruxqknp) all implement, so the compiler —
 * not prose — keeps them aligned.
 *
 * - the regions of the page (media/webview.html) and the selectors that reach
 *   them ({@link SELECTORS});
 * - the identity of the drawn elements: every node box carries
 *   `data-node-id="<id>"` and every drawn part of an edge carries
 *   `data-edge-key="<key>"` with the value of {@link edgeKey}, so one edge
 *   may be drawn as several elements;
 * - the emphasis vocabulary ({@link EmphasisClasses}), styled by
 *   styles/interact.css;
 * - the views each controller attaches to ({@link InteractionView},
 *   {@link StatesView}) and the delegate the interaction drives the renderer
 *   through ({@link InteractionDelegate}).
 *
 * The composition assignment: the page attaches the interaction, keyboard and
 * state controllers to these elements; nothing else does.
 */

import type { GraphEdge, GraphModel } from "../graph/model";
import type { GraphOrder } from "../graph/order";
import type { GraphLayout, Point } from "../graph/layout";

/** The selectors of the page regions (media/webview.html). */
export const SELECTORS = {
	canvas: "main.canvas",
	surface: ".canvas__surface",
	edges: "svg.canvas__edges",
	nodes: "div.canvas__nodes",
	banner: "div.panel__banner",
	fitAction: ".panel__action",
	detailBody: ".detail__body",
} as const;

/** The node id a drawn box carries (its `data-node-id` value). */
export const NODE_ID_ATTR = "data-node-id";
/** The edge key a drawn edge part carries (its `data-edge-key` value). */
export const EDGE_KEY_ATTR = "data-edge-key";

/**
 * The key of one edge, used as its `data-edge-key` value so the drawn parts of
 * an edge can be told apart from every other edge (mkyoyqvt, mnovnnot).
 */
export function edgeKey(edge: GraphEdge): string {
	return `${edge.kind}:${edge.from}->${edge.to}`;
}

/**
 * The state classes set on the drawn elements (noplrntp). Their
 * appearance lives in styles/interact.css.
 */
export const EmphasisClasses = {
	/** node/selected: the selected node (ortyupqp). */
	selected: "is-selected",
	/** node/related, edge/related: the context of a selection (zkwypuor). */
	related: "is-related",
	/** node/related, edge/related: the neighbourhood under the pointer (moklnvms). */
	hoverNeighbour: "is-hover-neighbour",
	/** *: elements unrelated to the selection (ksywwktl). */
	dimmed: "is-dimmed",
	/** node/dragging: the node being dragged (xslqyywt). */
	dragging: "is-dragging",
	/** node/focus: the node keyboard traversal is on (ozxnxzus). */
	focus: "is-focus",
	/** The canvas while it is being panned (srsnqppq, uswruqlq). */
	panning: "is-panning",
} as const;

/** Where the viewport sits: the pan in canvas pixels and the zoom scale. */
export interface Viewport {
	x: number;
	y: number;
	scale: number;
}

/** The drawn elements the pointer behaviours run on (contract above). */
export interface InteractionView {
	/** The element that clips the graph; carries the class `canvas`. */
	canvas: HTMLElement;
	/** The element inside the canvas that carries the pan/zoom transform. */
	surface: HTMLElement;
}

/** The elements the presentation appears in (contract above). */
export interface StatesView {
	/**
	 * The element that clips the graph and carries the class `canvas`
	 * (noplrntp): the progress indicator overlays it (vmruuytr) and the
	 * empty-state message stands on it (utyvzkwu).
	 */
	canvas: HTMLElement;
	/**
	 * The region directly below the toolbar (zrqxuzzy), where the inline error
	 * banner lives (utzyzwmu).
	 */
	banner: HTMLElement;
}

/**
 * The queue of user interaction input during a load (ywullzun): input is
 * queued while the graph data is loading and applied when the load finishes,
 * in the order it arrived. It is never dropped.
 */
export interface InputQueue {
	/**
	 * Run `action` at once, or queue it while the graph data is loading and run
	 * it when the load finishes (ywullzun).
	 */
	run(action: () => void): void;
	/** How many queued actions are waiting for the load to finish. */
	pending(): number;
	/** Drop everything queued. Teardown only (ywullzun drops input nowhere else). */
	clear(): void;
}

/** What the viewer presents alongside the graph (vmruuytr, utyvzkwu, utzyzwmu). */
export interface Presentation {
	/** The graph data is being loaded or reloaded (ywullzun, vmruuytr). */
	loading: boolean;
	/** The data is loaded and the repo contains no nodes (twslmwvn, utyvzkwu). */
	empty: boolean;
	/** The graph data could not be read (vxmzzunt, utzyzwmu), or null when it could. */
	error: string | null;
}

/** The presentation states of the viewer (vmruuytr, utyvzkwu, utzyzwmu). */
export interface StatesController {
	/** The presentation applied now. */
	state(): Readonly<Presentation>;
	/**
	 * The graph data is being loaded or reloaded (ywullzun): the progress
	 * indicator overlays the canvas (vmruuytr) and user interaction input is
	 * queued until the load ends (ywullzun).
	 */
	beginLoading(): void;
	/**
	 * The graph data was read and `nodeCount` nodes came out of it (luqwqrll):
	 * the progress indicator goes (ywullzun), the empty-state message stands in
	 * for the blank canvas when there are no nodes (twslmwvn, utyvzkwu), a
	 * stale error banner goes with it (vxmzzunt), and the queued input runs.
	 */
	loaded(nodeCount: number): void;
	/**
	 * The graph data could not be read (vxmzzunt): the inline error banner
	 * carries the message (utzyzwmu) and the canvas is left exactly as it is,
	 * so the last successfully rendered graph stays (vxmzzunt). The queued
	 * input runs against it.
	 */
	failed(message: string): void;
	/** User interaction input, queued while the data is loading (ywullzun). */
	readonly input: InputQueue;
	/** Remove the presentation elements and drop the queued input. */
	dispose(): void;
}

/** The graph the interactions run on (model.ts, order.ts). */
export interface InteractionGraph {
	model: GraphModel;
	order: GraphOrder;
}

/**
 * The renderer (rtlotqvy), reached from the interaction state. Everything
 * outside pointer and keyboard behaviour lives behind it.
 */
export interface InteractionDelegate {
	/**
	 * Re-lay out and re-draw the graph with `dragged` overriding the positions
	 * the arrangement assigned (spllzqlw, zqwxlzxm), and return the drawn
	 * geometry. Called once when the interactions attach and again whenever a
	 * node moves.
	 */
	relayout(dragged: ReadonlyMap<string, Point>): GraphLayout;
	/**
	 * The selection changed (ltrnmrsr). `id` is null when the selection was
	 * cleared (oumoznwq, zpkmkvts).
	 */
	onSelectionChanged(id: string | null): void;
	/** Open `nodes/<id>.json` in the editor (trxzsqpv). */
	openNodeDocument(id: string): void;
}

/**
 * The interaction state, driven from the pointer in interact.ts and from the
 * keyboard in keyboard.ts.
 */
export interface InteractionController {
	/** The current pan and zoom. */
	viewport(): Readonly<Viewport>;
	/** The selected node, or null (ltrnmrsr). */
	selected(): string | null;
	/** The node keyboard focus is on (ruqsmuxz), or null. */
	focused(): string | null;
	/** Select a node, or null to clear (ltrnmrsr). */
	select(id: string | null): void;
	/** Clear the selection (oumoznwq, zpkmkvts). */
	clearSelection(): void;
	/** Move keyboard focus to a node (ruqsmuxz), or null to drop it. */
	focusNode(id: string | null): void;
	/** Move keyboard focus one step through the graph order, wrapping (ruqsmuxz, rwonulnq). */
	focusStep(reverse: boolean): void;
	/** Pan the viewport by canvas pixels (srsnqppq, zvokurzw). */
	panBy(dx: number, dy: number): void;
	/** Zoom by `factor` about a point in canvas pixels (kyokxuml, pposortu). */
	zoomAt(factor: number, at: Point): void;
	/** Zoom by `factor` about the centre of the viewport (pposortu). */
	zoomAboutCentre(factor: number): void;
	/** Reset pan and zoom to frame all nodes (lntrymms, muvkrvuu). */
	fitGraph(): void;
	/** Move a node by graph pixels and re-route its edges (spllzqlw, nyxwutoo). */
	moveNodeBy(id: string, dx: number, dy: number): void;
	/** Swap the graph out from under the interactions (a reload of the node documents). */
	setGraph(graph: InteractionGraph): void;
	/** Detach the listeners and remove the tooltip. */
	dispose(): void;
}