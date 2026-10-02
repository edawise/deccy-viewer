/**
 * Geometry for the deccy graph: the layered arrangement (zqwxlzxm), the
 * node boxes (owtptzpl) and the cubic-bezier routes of the edges (vvqvvwzk).
 *
 * The arrangement is layered-topological and deterministic (zqwxlzxm): the
 * layer of a node is its topological depth from the roots and its position in
 * the layer is the left-to-right position, both read from the graph order
 * (order.ts) instead of being recomputed here. Layers stack downwards with the
 * layer spacing between them (qmnttlqk) and the boxes of a layer run
 * left-to-right, 240px wide and at least 72px tall (owtptzpl).
 *
 * A dragged node keeps its place in the graph order (ruqsmuxz): only its box
 * moves, and its edges are re-routed from the moved box (spllzqlw, vvqvvwzk).
 * An unresolved edge has a box at one end only, so it is routed as a stub that
 * hangs off that box and is marked visibly at its dangling end (tqxvykwn).
 */

import type { GraphEdge, GraphModel } from "./model";
import type { GraphOrder } from "./order";

/** Width of every node box; the label wraps inside it (owtptzpl). */
export const NODE_WIDTH = 240;

/** Height of a node box at minimum; a wrapped label grows the box (owtptzpl). */
export const NODE_MIN_HEIGHT = 72;

/** Space between two layers (qmnttlqk). */
export const LAYER_SPACING = 96;

/**
 * Space between the boxes of one layer. The visual specs fix no horizontal
 * spacing, so the layer spacing (qmnttlqk) is reused and the arrangement stays
 * a grid of equally spaced slots.
 */
export const NODE_GAP = 96;

/** A position on the canvas. */
export interface Point {
	x: number;
	y: number;
}

/** A rectangle on the canvas. */
export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Where a node is drawn: its slot in the layered arrangement (zqwxlzxm). */
export interface NodeBox extends Rect {
	id: string;
	/** The layer, i.e. the topological depth from the roots (order.ts). */
	layer: number;
	/** The left-to-right position inside the layer (order.ts). */
	column: number;
}

/**
 * How one edge is drawn: a cubic bezier from the parent end to the child end
 * (vvqvvwzk, mnovnnot). The arrowhead sits at the child end when the renderer
 * draws one; the coordinates here are the route only.
 */
export interface EdgeRoute {
	edge: GraphEdge;
	/** The parent end of the route. */
	start: Point;
	/** The control point at the parent end. */
	control1: Point;
	/** The control point at the child end. */
	control2: Point;
	/** The child end of the route. */
	end: Point;
}

export interface LayoutOptions {
	/**
	 * Box heights measured by the renderer. A label wraps inside its box and may
	 * grow it past the minimum (owtptzpl); a node without a measured height gets
	 * the minimum.
	 */
	heights?: ReadonlyMap<string, number>;
	/**
	 * The current top-left corner of each dragged node, overriding the slot the
	 * arrangement assigned to it (zqwxlzxm, spllzqlw).
	 */
	dragged?: ReadonlyMap<string, Point>;
}

/** The drawn graph. */
export interface GraphLayout {
	/** The box of every node, keyed by node id and in graph order (order.ts). */
	nodes: ReadonlyMap<string, NodeBox>;
	/** One route per edge of the model, in the model's edge order. */
	edges: readonly EdgeRoute[];
	/** Everything the graph covers, for framing it in the viewport. */
	bounds: Rect;
}

/**
 * Lay the graph out (zqwxlzxm): give every node of the graph order its box and
 * every edge of the model its route (vvqvvwzk).
 *
 * The result depends only on the model, the graph order and the options, so it
 * is repeatable: the same inputs give the same coordinates.
 */
export function layoutGraph(
	model: GraphModel,
	order: GraphOrder,
	options: LayoutOptions = {},
): GraphLayout {
	const { heights, dragged } = options;

	// Each layer is as tall as its tallest box (owtptzpl) and the layers are
	// spaced apart by the layer spacing (qmnttlqk).
	const rowHeight = new Map<number, number>();
	for (const node of model.nodes) {
		const layer = order.depth.get(node.id) ?? 0;
		const height = boxHeight(node.id, heights);
		if (height > (rowHeight.get(layer) ?? 0)) {
			rowHeight.set(layer, height);
		}
	}

	const rowY = new Map<number, number>();
	let y = 0;
	const layerNumbers = [...rowHeight.keys()].sort((a, b) => a - b);
	for (const layer of layerNumbers) {
		rowY.set(layer, y);
		y += (rowHeight.get(layer) ?? NODE_MIN_HEIGHT) + LAYER_SPACING;
	}

	const nodes = new Map<string, NodeBox>();
	for (const id of order.ids) {
		const layer = order.depth.get(id) ?? 0;
		const box: NodeBox = {
			id,
			layer,
			column: order.column.get(id) ?? 0,
			x: (order.column.get(id) ?? 0) * (NODE_WIDTH + NODE_GAP),
			y: rowY.get(layer) ?? 0,
			width: NODE_WIDTH,
			height: boxHeight(id, heights),
		};
		// A dragged node keeps its rank in the graph order (ruqsmuxz) but its
		// box moves to where the user dropped it (spllzqlw, zqwxlzxm).
		const moved = dragged?.get(id);
		if (moved !== undefined) {
			box.x = moved.x;
			box.y = moved.y;
		}
		nodes.set(id, box);
	}

	const edges: EdgeRoute[] = [];
	for (const edge of model.edges) {
		const route = routeEdge(edge, nodes);
		if (route !== undefined) {
			edges.push(route);
		}
	}

	return { nodes, edges, bounds: boundsOf(nodes.values(), edges) };
}

/** A box is at least the minimum height; a measured label may be taller (owtptzpl). */
function boxHeight(id: string, heights: ReadonlyMap<string, number> | undefined): number {
	const measured = heights?.get(id) ?? 0;
	return measured > NODE_MIN_HEIGHT ? measured : NODE_MIN_HEIGHT;
}

/**
 * Route one edge (vvqvvwzk). An edge between two boxes runs from the parent box
 * to the child box; an unresolved edge has a box at one end only and becomes a
 * stub of one layer spacing that leaves that box towards the end that is
 * missing, so the viewer can mark the dangling end visibly (tqxvykwn).
 */
function routeEdge(edge: GraphEdge, nodes: ReadonlyMap<string, NodeBox>): EdgeRoute | undefined {
	const from = nodes.get(edge.from);
	const to = nodes.get(edge.to);

	if (from !== undefined && to !== undefined) {
		// Endpoints sit on the facing edges of the boxes, so the route is never
		// hidden underneath either box; dragging may flip which edge faces which
		// and the route follows (spllzqlw).
		const downwards = to.y >= from.y;
		const start = downwards
			? { x: from.x + from.width / 2, y: from.y + from.height }
			: { x: from.x + from.width / 2, y: from.y };
		const end = downwards
			? { x: to.x + to.width / 2, y: to.y }
			: { x: to.x + to.width / 2, y: to.y + to.height };
		return bezier(edge, start, end);
	}
	if (from !== undefined) {
		// The child end is missing: the stub hangs below the parent (tqxvykwn).
		const start = { x: from.x + from.width / 2, y: from.y + from.height };
		return bezier(edge, start, { x: start.x, y: start.y + LAYER_SPACING });
	}
	if (to !== undefined) {
		// The parent end is missing: the stub stands above the child (tqxvykwn).
		const end = { x: to.x + to.width / 2, y: to.y };
		return bezier(edge, { x: end.x, y: end.y - LAYER_SPACING }, end);
	}
	// Neither end names a node of the graph, so there is nothing to route from.
	return undefined;
}

/**
 * The route as a cubic bezier (vvqvvwzk): the control points sit halfway
 * between the ends and pull the route to the x of their own end, so edges
 * leaving a layer curve into the next one instead of running across the boxes.
 */
function bezier(edge: GraphEdge, start: Point, end: Point): EdgeRoute {
	const half = (end.y - start.y) / 2;
	return {
		edge,
		start,
		control1: { x: start.x, y: start.y + half },
		control2: { x: end.x, y: end.y - half },
		end,
	};
}

/**
 * Everything the graph covers: the boxes and the stubs of the unresolved edges,
 * which reach past their box (tqxvykwn). A route curves inside the rectangle
 * spanned by its ends, so the ends alone define the bounds.
 */
function boundsOf(boxes: Iterable<NodeBox>, edges: readonly EdgeRoute[]): Rect {
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	const grow = (point: Point): void => {
		if (point.x < minX) {
			minX = point.x;
		}
		if (point.y < minY) {
			minY = point.y;
		}
		if (point.x > maxX) {
			maxX = point.x;
		}
		if (point.y > maxY) {
			maxY = point.y;
		}
	};

	for (const box of boxes) {
		grow({ x: box.x, y: box.y });
		grow({ x: box.x + box.width, y: box.y + box.height });
	}
	for (const route of edges) {
		grow(route.start);
		grow(route.end);
	}

	if (minX === Number.POSITIVE_INFINITY) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}
	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
