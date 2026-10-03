/**
 * Drawing of the deccy graph into the canvas of media/webview.html: the
 * routed edges beneath the node boxes.
 *
 * This module only turns the geometry of layout.ts into markup, so everything
 * it draws stays inside the static visual grammar (src/styles/grammar.css).
 * Decisions and evaluations read as boxes and rounded boxes (vznnxtor,
 * sullyqzs, twotxvqp), depends_on and evaluates edges read as solid and dashed
 * lines (vznnxtor, rwxywllw, otyqzpxn), and every edge carries a single
 * arrowhead at its child end (mnovnnot, vlvmrkzr).
 *
 * An edge whose other end names a node id with no node is drawn as the stub
 * layout.ts routed for it and marked visibly as unresolved (tqxvykwn,
 * ymnkpuvl).
 *
 * A renderer is kept for the life of a canvas (tnturzro): it holds the element
 * it drew for every node and every edge, the heights it measured for those
 * boxes and the static arrowheads, so a draw updates only the elements whose
 * box or route changed instead of rebuilding the layer. The boxes are drawn
 * inside one container per layer, so a change of a node's height moves the
 * layers below it by one translation of their container rather than by
 * repositioning, remeasuring or laying out their boxes one by one.
 */

import type { GraphEdge, GraphModel } from "../graph/model";
import type { GraphOrder } from "../graph/order";
import type { EdgeRoute, GraphLayout } from "../graph/layout";
import { EDGE_KEY_ATTR, edgeKey } from "./contract";

/** Size of the single arrowhead at the child end of every edge (sszrrpwn). */
export const ARROWHEAD_SIZE = 8;

const SVG_NS = "http://www.w3.org/2000/svg";

/** The canvas layers the graph is drawn into (media/webview.html). */
export interface RenderTarget {
	/** The SVG edge layer, beneath the node boxes. */
	edges: SVGSVGElement;
	/** The node box layer, above the edge layer. */
	nodes: HTMLElement;
}

/** What is drawn: the model, its deterministic order (order.ts) and its layout. */
export interface RenderState {
	model: GraphModel;
	order: GraphOrder;
	layout: GraphLayout;
	/**
	 * The node labels keyed by node id (qpsnwxlu): the jj change description of
	 * that change. A node without one falls back to its id.
	 */
	labels: ReadonlyMap<string, string>;
}

/**
 * A height change one draw carries into the region below it (tnturzro): the
 * row of `layer` grew (or shrank) by `delta` graph pixels, so every layer
 * deeper than it is drawn that much further down (or up).
 */
export interface HeightDisplacement {
	/** The layer whose row height changed. */
	layer: number;
	/** How much that row grew: negative when it shrank. */
	delta: number;
}

/** What a draw is told about the change it applies (tnturzro). */
export interface DrawOptions {
	/**
	 * The height changes the layout in hand does not carry itself. The layout
	 * of an incremental draw carries the boxes below a change over untouched,
	 * so the renderer displaces their layers as one instead of laying them
	 * out (tnturzro).
	 */
	displace?: readonly HeightDisplacement[];
}

/**
 * The renderer kept for one canvas (tnturzro). It owns the elements it has
 * already drawn and the heights it has already measured, so successive draws
 * reuse them.
 */
export interface GraphRenderer {
	/**
	 * Draw `state` and return the measured height of every node box. Only the
	 * first draw of a graph revision — and any draw whose labels or model
	 * changed — measures every box; a later draw reads the heights in hand,
	 * updates only the elements whose geometry the layout changed, and applies
	 * the height changes it is told about as one displacement of the layers
	 * below them.
	 */
	draw(state: RenderState, options?: DrawOptions): Map<string, number>;
	/**
	 * Measure the current height of one box and keep it (tnturzro): a move
	 * takes this for the box it moves and no other.
	 */
	measure(id: string): number | undefined;
	/** The heights measured for the graph in hand, keyed by node id. */
	heights(): ReadonlyMap<string, number>;
	/**
	 * Forget everything drawn, so the next draw starts from a clean canvas.
	 * This is what a new graph revision (or new labels) takes.
	 */
	reset(): void;
}

/** The two drawn parts of one edge: the hit stroke and the visible route. */
interface EdgeParts {
	hit: SVGPathElement;
	line: SVGPathElement;
	/** The route currently written into both paths (`d`). */
	d: string;
	/** The class list currently written into the visible path. */
	classes: string;
	/** The arrowhead marker currently written into the visible path. */
	marker: string;
}

/**
 * The drawn elements of one layer and the translation they are drawn under
 * (tnturzro): the boxes sit at their coordinates relative to the layer's own
 * origin, so moving the layer is one transform on `element`.
 */
interface DrawnLayer {
	element: HTMLElement;
	/** The graph y the layer's container is translated to, once drawn. */
	offset: number | undefined;
}

/**
 * Draw the graph (model.ts, order.ts, layout.ts) into the canvas layers and
 * return the measured height of every node box, keyed by node id.
 *
 * The heights are what a layout pass needs to honour (owtptzpl): a label
 * wraps inside its box and may grow it past the minimum, so the caller lays
 * the graph out once, measures with the heights returned here and draws again.
 *
 * This is the one-shot form: a fresh renderer draws the whole graph. A caller
 * that draws the same canvas more than once keeps a renderer from
 * {@link createRenderer} so the elements and heights are carried across draws
 * (tnturzro).
 */
export function renderGraph(target: RenderTarget, state: RenderState): Map<string, number> {
	return createRenderer(target).draw(state);
}

/**
 * The renderer of one canvas (tnturzro): every draw reuses the elements and
 * measured heights of the draw before it, and touches only what the layout
 * changed. A graph revision — a new model, order or label map — resets it
 * first, because every drawn element then belongs to a graph that is gone.
 */
export function createRenderer(target: RenderTarget): GraphRenderer {
	/** The box drawn for each node, carried across draws (tnturzro). */
	const boxes = new Map<string, HTMLElement>();
	/** The drawn parts of each edge, keyed the way contract.ts keys edges. */
	const parts = new Map<string, EdgeParts>();
	/** The container of each layer's boxes, with the origin it is drawn at. */
	const layers = new Map<number, DrawnLayer>();

	/** The container of every node layer; it carries the canvas origin shift. */
	let graph: HTMLElement | undefined;
	/** The one node of the edge layer: the routes, carried across draws. */
	let edgeGroup: SVGGElement | undefined;
	let model: GraphModel | undefined;
	let order: GraphOrder | undefined;
	let labels: ReadonlyMap<string, string> | undefined;
	/** The layout the drawn elements show, so a draw can tell what changed. */
	let last: GraphLayout | undefined;
	/** The heights measured for the boxes in hand (tnturzro). */
	let measured = new Map<string, number>();
	/**
	 * The height changes applied since the graph came in, kept so every later
	 * draw of the same graph stays displaced by them (tnturzro). Each entry
	 * moves every layer deeper than its own.
	 */
	let displacements: HeightDisplacement[] = [];

	function reset(): void {
		boxes.clear();
		parts.clear();
		layers.clear();
		graph = undefined;
		edgeGroup = undefined;
		model = undefined;
		order = undefined;
		labels = undefined;
		last = undefined;
		measured = new Map();
		displacements = [];
		target.edges.replaceChildren();
		target.nodes.replaceChildren();
	}

	/**
	 * How far down the layers deeper than `layer` are drawn because of the
	 * height changes applied so far (tnturzro): one sum over the changes, read
	 * per layer, never a per-node position.
	 */
	function displacementOf(layer: number): number {
		let total = 0;
		for (const change of displacements) {
			if (change.layer < layer) {
				total += change.delta;
			}
		}
		return total;
	}

	/** The extra height the displaced region reaches past the layout's bounds. */
	function displacedExtent(): number {
		let extent = 0;
		for (const layer of layers.keys()) {
			const displaced = displacementOf(layer);
			if (displaced > extent) {
				extent = displaced;
			}
		}
		return extent;
	}

	/**
	 * Build the static parts of the drawing once per canvas: the arrowhead
	 * definitions (mnovnnot, vlvmrkzr, sszrrpwn) and the two layers the graph
	 * is drawn into. They are not rebuilt by a draw (tnturzro).
	 */
	function begin(): void {
		const defs = document.createElementNS(SVG_NS, "defs");
		for (const role of ["depends_on", "evaluates", "unresolved"] as const) {
			defs.appendChild(arrowhead(role));
		}
		edgeGroup = document.createElementNS(SVG_NS, "g");
		edgeGroup.setAttribute("class", "edge-layer");
		target.edges.replaceChildren(defs, edgeGroup);

		graph = document.createElement("div");
		graph.className = "node-graph";
		target.nodes.replaceChildren(graph);
	}

	function draw(state: RenderState, options: DrawOptions = {}): Map<string, number> {
		// A different graph or a different set of labels is a new revision: the
		// elements in hand describe a graph that is gone, so they are dropped
		// and the draw below builds the new one (tnturzro).
		if (state.model !== model || state.order !== order || state.labels !== labels) {
			reset();
		}
		if (graph === undefined) {
			begin();
		}

		const previous = last;
		model = state.model;
		order = state.order;
		labels = state.labels;
		// A height change the layout carried over is displaced here, and kept
		// for every later draw of the same graph (tnturzro).
		if (options.displace !== undefined) {
			displacements.push(...options.displace);
		}

		drawNodes(state, previous);
		drawEdges(state.layout, previous);

		// The heights are measured on the draw that brings a graph in, and
		// carried across every later draw of it (tnturzro): a move measures the
		// box it moved and updates the elements it changed, and no other box.
		if (previous === undefined) {
			measured = measure(boxes);
		}
		last = state.layout;
		return measured;
	}

	/**
	 * Draw every node box at its layout coordinates, updating only the boxes a
	 * draw changed (tnturzro). The boxes are grouped by layer: a layer whose
	 * boxes keep their relative positions but whose origin moved — the effect
	 * of a height change above it — is moved by one translation of its
	 * container, and none of its boxes is touched.
	 */
	function drawNodes(state: RenderState, previous: GraphLayout | undefined): void {
		const layout = state.layout;
		const origins = layerOrigins(layout);
		const previousOrigins =
			previous === undefined ? new Map<number, number>() : layerOrigins(previous);

		// The node layer keeps the graph's size, including the region a height
		// change displaced past the layout's bounds, and the container puts the
		// graph at the canvas origin, as the edge layer does below it.
		const extent = displacedExtent();
		target.nodes.style.width = `${layout.bounds.width}px`;
		target.nodes.style.height = `${layout.bounds.height + extent}px`;
		const container = graph;
		if (container !== undefined) {
			container.style.transform = `translate(${-layout.bounds.x}px, ${-layout.bounds.y}px)`;
		}

		for (const layer of [...origins.keys()].sort((a, b) => a - b)) {
			let drawn = layers.get(layer);
			if (drawn === undefined) {
				const element = document.createElement("div");
				element.className = "node-layer";
				element.dataset.layer = String(layer);
				drawn = { element, offset: undefined };
				layers.set(layer, drawn);
				container?.appendChild(element);
			}
			// The container is drawn at the layer's origin plus whatever height
			// change above it displaced it by (tnturzro): one write, whatever
			// the number of boxes it holds.
			const origin = origins.get(layer) ?? 0;
			const offset = origin + displacementOf(layer);
			if (drawn.offset !== offset) {
				drawn.element.style.transform = `translate(0px, ${offset}px)`;
				drawn.offset = offset;
			}
		}

		const kinds = new Map(state.model.nodes.map((node) => [node.id, node.kind]));
		for (const id of state.order.ids) {
			const box = layout.nodes.get(id);
			const kind = kinds.get(id);
			if (box === undefined || kind === undefined) {
				continue;
			}
			const origin = origins.get(box.layer) ?? 0;
			const old = previous?.nodes.get(id);
			const oldOrigin = previousOrigins.get(old?.layer ?? box.layer) ?? origin;

			let element = boxes.get(id);
			if (element === undefined) {
				// Decisions are rectangles and evaluations rounded rectangles
				// (vznnxtor, sullyqzs, twotxvqp).
				element = document.createElement("div");
				element.className = `node node--${kind}`;
				element.dataset.nodeId = id;

				const label = document.createElement("div");
				label.className = "node__label";
				label.textContent = state.labels.get(id) ?? id;

				const secondary = document.createElement("div");
				secondary.className = "node__label-secondary";
				secondary.textContent = id;

				element.append(label, secondary);
				boxes.set(id, element);
				layers.get(box.layer)?.element.appendChild(element);
				element.style.left = `${box.x}px`;
				element.style.top = `${box.y - origin}px`;
				element.style.width = `${box.width}px`;
				continue;
			}

			// A carried element is written only where its box changed. A box
			// whose coordinates relative to its layer are the same as before is
			// left alone even when a height change moved the layer: the layer's
			// own translation carries it (tnturzro).
			if (old === undefined || box.x !== old.x) {
				element.style.left = `${box.x}px`;
			}
			if (old === undefined || box.width !== old.width) {
				element.style.width = `${box.width}px`;
			}
			if (old === undefined || box.y - origin !== old.y - oldOrigin) {
				element.style.top = `${box.y - origin}px`;
			}
		}
	}

	/**
	 * Draw every routed edge (layout.ts, vvqvvwzk) with its arrowhead at the
	 * child end (mnovnnot, vlvmrkzr), and an invisible hit stroke over every
	 * route so each edge is reliably targetable (wtywxppt). Every drawn part
	 * of an edge carries its key (ympqvvwr, contract.ts) so the interaction can
	 * resolve it. A route the layout carried over is not written again
	 * (tnturzro).
	 */
	function drawEdges(layout: GraphLayout, previous: GraphLayout | undefined): void {
		target.edges.setAttribute("width", String(layout.bounds.width));
		target.edges.setAttribute(
			"height",
			String(layout.bounds.height + displacedExtent()),
		);
		edgeGroup?.setAttribute(
			"transform",
			`translate(${-layout.bounds.x} ${-layout.bounds.y})`,
		);

		const group = edgeGroup;
		if (group === undefined) {
			return;
		}

		const seen = new Set<string>();
		for (const route of layout.edges) {
			const key = edgeKey(route.edge);
			seen.add(key);

			let drawn = parts.get(key);
			if (drawn === undefined) {
				const hit = document.createElementNS(SVG_NS, "path");
				hit.setAttribute("class", "edge__hit");
				hit.setAttribute(EDGE_KEY_ATTR, key);

				const line = document.createElementNS(SVG_NS, "path");
				line.setAttribute(EDGE_KEY_ATTR, key);

				drawn = { hit, line, d: "", classes: "", marker: "" };
				parts.set(key, drawn);
				group.appendChild(hit);
				group.appendChild(line);
			}

			// An end that sits in a displaced layer is drawn displaced with it
			// (tnturzro): the route follows the region, it is not routed again.
			const fromBox = layout.nodes.get(route.edge.from);
			const toBox = layout.nodes.get(route.edge.to);
			let fromShift = fromBox === undefined ? undefined : displacementOf(fromBox.layer);
			let toShift = toBox === undefined ? undefined : displacementOf(toBox.layer);
			// A stub with one end missing moves with the box it hangs off.
			fromShift ??= toShift ?? 0;
			toShift ??= fromShift;

			const d = pathData(route, fromShift, toShift);
			if (drawn.d !== d) {
				drawn.d = d;
				drawn.hit.setAttribute("d", d);
				drawn.line.setAttribute("d", d);
			}

			const classes = edgeClasses(route.edge);
			if (drawn.classes !== classes) {
				drawn.classes = classes;
				drawn.line.setAttribute("class", classes);
			}

			// The route runs from the parent end to the child end (mnovnnot),
			// so the arrowhead at its end is the one at the child end
			// (vlvmrkzr). An unresolved edge keeps it at the stub end that
			// stands in for the missing node (tqxvykwn).
			const marker = `url(#${arrowheadId(route.edge)})`;
			if (drawn.marker !== marker) {
				drawn.marker = marker;
				drawn.line.setAttribute("marker-end", marker);
			}
		}

		// A graph revision resets the renderer, so this only runs for a layout
		// that dropped an edge the elements in hand still draw.
		if (previous !== undefined) {
			for (const [key, drawn] of parts) {
				if (!seen.has(key)) {
					drawn.hit.remove();
					drawn.line.remove();
					parts.delete(key);
				}
			}
		}
	}

	/**
	 * Measure one drawn box and keep the height with the others (tnturzro): a
	 * move takes this for the box it moved, so the rest keep the heights they
	 * were drawn with.
	 */
	function measureBox(id: string): number | undefined {
		const element = boxes.get(id);
		if (element === undefined) {
			return undefined;
		}
		const height = Math.ceil(element.getBoundingClientRect().height);
		measured.set(id, height);
		return height;
	}

	return {
		draw,
		measure: measureBox,
		heights: () => measured,
		reset,
	};
}

/**
 * The cubic bezier of one route, as the `d` of its paths (vvqvvwzk). The ends
 * are displaced by the height changes above their own layer, so a route that
 * reaches into a displaced region follows it (tnturzro).
 */
function pathData(route: EdgeRoute, fromShift: number, toShift: number): string {
	return `M ${route.start.x} ${route.start.y + fromShift} C ${route.control1.x} ${route.control1.y + fromShift}, ${route.control2.x} ${route.control2.y + toShift}, ${route.end.x} ${route.end.y + toShift}`;
}

/** The origin of each layer: the smallest y its boxes occupy (zqwxlzxm). */
function layerOrigins(layout: GraphLayout): Map<number, number> {
	const origins = new Map<number, number>();
	for (const box of layout.nodes.values()) {
		const origin = origins.get(box.layer);
		if (origin === undefined || box.y < origin) {
			origins.set(box.layer, box.y);
		}
	}
	return origins;
}

/**
 * The class list of one edge: its kind (rwxywllw, otyqzpxn) and the unresolved
 * marking when an end of it names a node id with no node (tqxvykwn, ymnkpuvl).
 */
function edgeClasses(edge: GraphEdge): string {
	const classes = ["edge", `edge--${edge.kind}`];
	if (edge.danglingEnd !== undefined) {
		classes.push("edge--unresolved");
	}
	return classes.join(" ");
}

/** The arrowhead marker an edge takes: its own, or the unresolved one. */
function arrowheadId(edge: GraphEdge): string {
	return `arrowhead-${edge.danglingEnd === undefined ? edge.kind : "unresolved"}`;
}

/**
 * The marker of one edge role: an 8px triangle (sszrrpwn) oriented along the
 * route at the child end (vlvmrkzr), filled with the colour role of its edge
 * (grammar.css, oqotyplt, qpmyylwo, tyvynnqo).
 */
function arrowhead(role: "depends_on" | "evaluates" | "unresolved"): SVGMarkerElement {
	const marker = document.createElementNS(SVG_NS, "marker");
	marker.setAttribute("id", `arrowhead-${role}`);
	marker.setAttribute("class", `arrowhead arrowhead--${role}`);
	marker.setAttribute("markerWidth", String(ARROWHEAD_SIZE));
	marker.setAttribute("markerHeight", String(ARROWHEAD_SIZE));
	marker.setAttribute("refX", String(ARROWHEAD_SIZE));
	marker.setAttribute("refY", String(ARROWHEAD_SIZE / 2));
	marker.setAttribute("orient", "auto");
	// userSpaceOnUse keeps the arrowhead 8px at any stroke width (sszrrpwn).
	marker.setAttribute("markerUnits", "userSpaceOnUse");

	const tip = document.createElementNS(SVG_NS, "path");
	tip.setAttribute(
		"d",
		`M 0 0 L ${ARROWHEAD_SIZE} ${ARROWHEAD_SIZE / 2} L 0 ${ARROWHEAD_SIZE} Z`,
	);
	marker.appendChild(tip);
	return marker;
}

/**
 * The rendered height of every drawn box: how far its label wrapped
 * (owtptzpl). A draw that brings a graph in measures its boxes once; the
 * result is kept for the draws that follow (tnturzro).
 */
function measure(boxes: ReadonlyMap<string, HTMLElement>): Map<string, number> {
	const heights = new Map<string, number>();
	for (const [id, element] of boxes) {
		heights.set(id, Math.ceil(element.getBoundingClientRect().height));
	}
	return heights;
}
