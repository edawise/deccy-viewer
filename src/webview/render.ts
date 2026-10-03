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
 */

import type { GraphEdge, GraphModel } from "../graph/model";
import type { GraphOrder } from "../graph/order";
import type { GraphLayout, Rect } from "../graph/layout";
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
 * Draw the graph (model.ts, order.ts, layout.ts) into the canvas layers and
 * return the measured height of every node box, keyed by node id.
 *
 * The heights are what a layout pass needs to honour (owtptzpl): a label
 * wraps inside its box and may grow it past the minimum, so the caller lays
 * the graph out once, measures with the heights returned here and draws again.
 */
export function renderGraph(target: RenderTarget, state: RenderState): Map<string, number> {
	const bounds = state.layout.bounds;
	renderEdges(target.edges, state.layout.edges, bounds);
	renderNodes(target.nodes, state, bounds);
	return measureHeights(target.nodes);
}

/**
 * Draw every routed edge (layout.ts, vvqvvwzk) with its arrowhead at the child
 * end (mnovnnot, vlvmrkzr), and an invisible hit stroke over every route so
 * each edge is reliably targetable (wtywxppt). Every drawn part of an edge
 * carries its key (ympqvvwr, contract.ts) so the interaction can resolve it.
 */
function renderEdges(svg: SVGSVGElement, routes: GraphLayout["edges"], bounds: Rect): void {
	svg.setAttribute("width", String(bounds.width));
	svg.setAttribute("height", String(bounds.height));
	svg.replaceChildren();

	const defs = document.createElementNS(SVG_NS, "defs");
	for (const role of ["depends_on", "evaluates", "unresolved"] as const) {
		defs.appendChild(arrowhead(role));
	}
	svg.appendChild(defs);

	const layer = document.createElementNS(SVG_NS, "g");
	layer.setAttribute("transform", `translate(${-bounds.x} ${-bounds.y})`);
	for (const route of routes) {
		const d = `M ${route.start.x} ${route.start.y} C ${route.control1.x} ${route.control1.y}, ${route.control2.x} ${route.control2.y}, ${route.end.x} ${route.end.y}`;

		const hit = document.createElementNS(SVG_NS, "path");
		hit.setAttribute("class", "edge__hit");
		hit.setAttribute(EDGE_KEY_ATTR, edgeKey(route.edge));
		hit.setAttribute("d", d);
		layer.appendChild(hit);

		const edge = document.createElementNS(SVG_NS, "path");
		edge.setAttribute("class", edgeClasses(route.edge));
		edge.setAttribute(EDGE_KEY_ATTR, edgeKey(route.edge));
		edge.setAttribute("d", d);
		// The route runs from the parent end to the child end (mnovnnot), so the
		// arrowhead at its end is the one at the child end (vlvmrkzr). An
		// unresolved edge keeps it at the stub end that stands in for the
		// missing node (tqxvykwn).
		edge.setAttribute("marker-end", `url(#${arrowheadId(route.edge)})`);
		layer.appendChild(edge);
	}
	svg.appendChild(layer);
}

/** Draw every node box at the coordinates the layout gave it (zqwxlzxm). */
function renderNodes(layer: HTMLElement, state: RenderState, bounds: Rect): void {
	layer.style.width = `${bounds.width}px`;
	layer.style.height = `${bounds.height}px`;
	layer.replaceChildren();

	const kinds = new Map(state.model.nodes.map((node) => [node.id, node.kind]));
	for (const id of state.order.ids) {
		const box = state.layout.nodes.get(id);
		const kind = kinds.get(id);
		if (box === undefined || kind === undefined) {
			continue;
		}

		const element = document.createElement("div");
		// Decisions are rectangles and evaluations rounded rectangles
		// (vznnxtor, sullyqzs, twotxvqp).
		element.className = `node node--${kind}`;
		element.dataset.nodeId = id;
		element.style.left = `${box.x - bounds.x}px`;
		element.style.top = `${box.y - bounds.y}px`;
		element.style.width = `${box.width}px`;

		const label = document.createElement("div");
		label.className = "node__label";
		label.textContent = state.labels.get(id) ?? id;

		const secondary = document.createElement("div");
		secondary.className = "node__label-secondary";
		secondary.textContent = id;

		element.append(label, secondary);
		layer.appendChild(element);
	}
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

/** The rendered height of every node box: how far its label wrapped (owtptzpl). */
function measureHeights(layer: HTMLElement): Map<string, number> {
	const heights = new Map<string, number>();
	// Array.from keeps this compilable against the DOM lib alone: a node list is
	// array-like but iterable only with DOM.Iterable.
	for (const element of Array.from(layer.querySelectorAll<HTMLElement>(".node"))) {
		const id = element.dataset.nodeId;
		if (id !== undefined) {
			heights.set(id, Math.ceil(element.getBoundingClientRect().height));
		}
	}
	return heights;
}
