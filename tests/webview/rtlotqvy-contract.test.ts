// @vitest-environment jsdom
/**
 * Contract check: what drawing the graph (rtlotqvy) must show against the page
 * interface it draws through (ympqvvwr) and the graph model, order and layout
 * it draws (qmsmvrnr).
 *
 * The renderer is exercised directly on a fixture canvas built from the
 * contract's selectors; the page module and the interaction and presentation
 * controllers are not imported or driven, because the renderer does not own
 * them. The check reads the drawn elements and the identity the contract gives
 * them, the geometry the graph layer produced, and the elements, measured
 * heights and layout work a draw carries into the next one (tnturzro).
 *
 * The drawing is also read against the layout's own bounds origin: a graph
 * whose bounds origin is off the canvas origin on both axes is drawn, and
 * every drawn box and route is read back relative to the canvas regions it was
 * drawn into (qmsmvrnr).
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import type { GraphModel } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import type { GraphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { GraphLayout, Point } from "../../src/graph/layout";
import { createRenderer } from "../../src/webview/render";
import type { GraphRenderer, RenderTarget } from "../../src/webview/render";
import { EDGE_KEY_ATTR, NODE_ID_ATTR, SELECTORS, edgeKey } from "../../src/webview/contract";

const SVG_NS = "http://www.w3.org/2000/svg";

/** The node a one-node move drags (tnturzro). */
const MOVED = "aaaaaaaa";

/** The box a measured height change starts from (tnturzro). */
const CHANGED = "raaaaaaa";
/** The boxes below the changed one, one layer down (tnturzro). */
const BELOW = ["rbbbbbbb", "rccccccc", "rddddddd", "reeeeeee"] as const;
/** The height every box measures on the first draw (tnturzro). */
const BOX_HEIGHT = 72;
/** The height the changed box measures on the draw after it (tnturzro). */
const TALLER_HEIGHT = 120;

/**
 * A canvas with the regions the page interface names (ympqvvwr): the SVG edge
 * layer and the node box layer inside the surface of the canvas.
 */
function canvas(): RenderTarget {
	const root = document.createElement("main");
	root.className = "canvas";

	const surface = document.createElement("div");
	surface.className = "canvas__surface";

	const edges = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
	edges.setAttribute("class", "canvas__edges");

	const nodes = document.createElement("div");
	nodes.className = "canvas__nodes";

	surface.append(edges, nodes);
	root.append(surface);
	document.body.replaceChildren(root);

	const edgeLayer = document.querySelector(SELECTORS.edges) as unknown as SVGSVGElement | null;
	const nodeLayer = document.querySelector(SELECTORS.nodes) as HTMLElement | null;
	if (edgeLayer === null || nodeLayer === null) {
		throw new Error("the fixture canvas is missing a region the contract names");
	}
	return { edges: edgeLayer, nodes: nodeLayer };
}

function records(): NodeRecord[] {
	return [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "rationale of aaaaaaaa" },
		},
		{
			id: "bbbbbbbb",
			kind: "evaluation",
			dependsOn: ["aaaaaaaa"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "rationale of bbbbbbbb" },
		},
	];
}

function nodeRecord(id: string, dependsOn: readonly string[]): NodeRecord {
	return {
		id,
		kind: "decision",
		dependsOn,
		evaluates: [],
		content: { type: "text", ref: "inline", rationale: `rationale of ${id}` },
	};
}

/**
 * The graph a one-node move is drawn on (tnturzro): a root with six children
 * below it and one grandchild under the first child, so a move has nodes and an
 * edge it does not touch next to the ones it does.
 */
function wideGraph(): NodeRecord[] {
	return [
		nodeRecord(MOVED, []),
		nodeRecord("cccccccc", [MOVED]),
		nodeRecord("dddddddd", [MOVED]),
		nodeRecord("eeeeeeee", [MOVED]),
		nodeRecord("ffffffff", [MOVED]),
		nodeRecord("gggggggg", [MOVED]),
		nodeRecord("hhhhhhhh", [MOVED]),
		nodeRecord("iiiiiiii", ["cccccccc"]),
	];
}

/** The edge a one-node move re-routes: one of the moved node's own edges. */
const INCIDENT_EDGE = `depends_on:${MOVED}->dddddddd`;
/** The edge away from the change: it joins two nodes the move does not touch. */
const UNRELATED_EDGE = "depends_on:cccccccc->iiiiiiii";

/** The graph the measured height change is drawn on (tnturzro). */
function layeredGraph(): NodeRecord[] {
	return [nodeRecord(CHANGED, []), ...BELOW.map((id) => nodeRecord(id, [CHANGED]))];
}

interface Drawn {
	target: RenderTarget;
	renderer: GraphRenderer;
	model: GraphModel;
	order: GraphOrder;
	layout: GraphLayout;
	labels: ReadonlyMap<string, string>;
}

/** Draw a graph into a fresh canvas with one renderer kept for later draws. */
function draw(recordsToDraw: readonly NodeRecord[]): Drawn {
	const target = canvas();
	const model = buildGraph(recordsToDraw);
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);
	const labels = new Map<string, string>();
	const renderer = createRenderer(target);
	renderer.draw({ model, order, layout, labels });
	return { target, renderer, model, order, layout, labels };
}

function box(id: string): HTMLElement | null {
	return document.querySelector(`[${NODE_ID_ATTR}="${id}"]`);
}

/** A drawn part of one edge, keyed the way the contract keys edges. */
function drawnEdge(key: string): Element | null {
	return document.querySelector(`[${EDGE_KEY_ATTR}="${key}"]`);
}

/** Where a drawn element sits, whichever way the renderer places it. */
function placement(element: Element): string {
	const style = (element as unknown as { style?: CSSStyleDeclaration }).style;
	return `${style?.left ?? ""}|${style?.top ?? ""}|${style?.transform ?? ""}`;
}

/** The route a drawn edge follows, whichever way the renderer writes it. */
function route(element: Element): string {
	const style = (element as unknown as { style?: CSSStyleDeclaration }).style;
	return `${element.getAttribute("d") ?? ""}|${style?.transform ?? ""}`;
}

/** A rectangle of `width` x `height` at the origin, as a measured element reports it. */
function measuredRect(width: number, height: number): DOMRect {
	return {
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		right: width,
		bottom: height,
		width,
		height,
		toJSON: (): Record<string, never> => ({}),
	} as DOMRect;
}

/**
 * How far down an element's own inline placement puts it, in CSS pixels: its
 * top plus the vertical part of its translate and transform, so the check
 * reads where a group is drawn without fixing which property carries the
 * displacement.
 */
function verticalOffset(element: Element): number {
	const style = (element as unknown as { style?: CSSStyleDeclaration }).style;
	if (style === undefined) {
		return 0;
	}
	return (
		pixels(style.top) +
		pixels(style.marginTop) +
		pixels(style.paddingTop) +
		translationOffset(style.translate) +
		transformOffset(style.transform)
	);
}

/** The pixel length in an inline style value, or 0 when it carries none. */
function pixels(value: string | undefined): number {
	if (value === undefined) {
		return 0;
	}
	const match = /(-?\d+(?:\.\d+)?)px/.exec(value);
	return match === null ? 0 : Number(match[1]);
}

/** The vertical part of the CSS `translate` property (`<x> <y>`). */
function translationOffset(value: string | undefined): number {
	if (value === undefined) {
		return 0;
	}
	const parts = value.trim().split(/\s+/).filter((part) => part !== "");
	return parts.length > 1 ? pixels(parts[1]) : 0;
}

/** The vertical part of an inline CSS `transform` list. */
function transformOffset(value: string | undefined): number {
	if (value === undefined) {
		return 0;
	}
	const transform = value.trim();
	if (transform === "" || transform === "none") {
		return 0;
	}
	const translateY = /translateY\(\s*(-?\d+(?:\.\d+)?)px/.exec(transform);
	if (translateY !== null) {
		return Number(translateY[1]);
	}
	const translate3d = /translate3d\(\s*[^,]+,\s*(-?\d+(?:\.\d+)?)px/.exec(transform);
	if (translate3d !== null) {
		return Number(translate3d[1]);
	}
	const translate = /translate\(\s*[^,)]+,\s*(-?\d+(?:\.\d+)?)px/.exec(transform);
	if (translate !== null) {
		return Number(translate[1]);
	}
	const matrix3d = /matrix3d\(([^)]*)\)/.exec(transform);
	if (matrix3d !== null) {
		return Number(matrix3d[1].split(",")[13] ?? 0);
	}
	const matrix = /matrix\(([^)]*)\)/.exec(transform);
	if (matrix !== null) {
		return Number(matrix[1].split(",")[5] ?? 0);
	}
	return 0;
}

/**
 * The elements between the boxes below a change and the container that also
 * holds the changed box (tnturzro): the groups that can be displaced as one.
 */
function regionChain(below: readonly Element[], changed: Element): Element[] {
	const chain: Element[] = [];
	let candidate = below[0]?.parentElement ?? null;
	while (candidate !== null && candidate !== document.body) {
		const element: Element = candidate;
		if (element.contains(changed) || !below.every((belowBox) => element.contains(belowBox))) {
			break;
		}
		chain.push(element);
		candidate = element.parentElement;
	}
	return chain;
}

describe("the renderer draws through the page interface (ympqvvwr)", () => {
	test("every node and every edge is drawn into the canvas regions with its contract identity", () => {
		const drawn = draw(records());
		const edges = document.querySelector(SELECTORS.edges);
		const nodes = document.querySelector(SELECTORS.nodes);

		expect(edges).not.toBeNull();
		expect(nodes).not.toBeNull();
		for (const node of drawn.model.nodes) {
			expect(nodes!.querySelector(`[${NODE_ID_ATTR}="${node.id}"]`)).not.toBeNull();
		}
		for (const edge of drawn.model.edges) {
			const key = edgeKey(edge);
			const parts = [...edges!.querySelectorAll(`[${EDGE_KEY_ATTR}="${key}"]`)];
			expect(parts.length).toBeGreaterThan(0);
			for (const part of parts) {
				expect(part.getAttribute(EDGE_KEY_ATTR)).toBe(key);
			}
		}
	});
});

describe("the renderer draws the graph layer's model, order and layout (qmsmvrnr)", () => {
	test("every node of the order and every route of the layout is drawn at its geometry", () => {
		const drawn = draw(records());

		for (const id of drawn.order.ids) {
			expect(box(id)).not.toBeNull();
		}
		for (const route of drawn.layout.edges) {
			const line = document.querySelector(
				`path.edge[${EDGE_KEY_ATTR}="${edgeKey(route.edge)}"]`,
			);
			expect(line).not.toBeNull();
			expect(line?.getAttribute("d")).toBe(
				`M ${route.start.x} ${route.start.y} C ${route.control1.x} ${route.control1.y}, ${route.control2.x} ${route.control2.y}, ${route.end.x} ${route.end.y}`,
			);
		}
		// qmsmvrnr: a node without a label is drawn under its id.
		expect(box("bbbbbbbb")?.querySelector(".node__label")?.textContent).toBe("bbbbbbbb");
	});
});

describe("a draw carries its elements and measured heights into the next (tnturzro)", () => {
	test("the first draw measures every box and a later draw keeps the elements and heights", () => {
		const drawn = draw(wideGraph());
		const elements = new Map(drawn.order.ids.map((id) => [id, box(id)!]));
		const heights = drawn.renderer.heights();

		// tnturzro: the first draw of a graph revision measures every box.
		expect([...heights.keys()].sort()).toEqual([...drawn.order.ids].sort());

		// The same graph drawn again has changed nothing, so the renderer keeps
		// every drawn element and the heights it already has.
		const again = drawn.renderer.draw({
			model: drawn.model,
			order: drawn.order,
			layout: drawn.layout,
			labels: drawn.labels,
		});
		expect([...again.entries()].sort()).toEqual([...heights.entries()].sort());
		for (const id of drawn.order.ids) {
			expect(box(id)).toBe(elements.get(id));
		}
	});

	test("a one-node move updates the elements it already occupies and measures only the moved box", () => {
		const drawn = draw(wideGraph());
		const moved = box(MOVED)!;
		const incident = drawnEdge(INCIDENT_EDGE)!;
		const unrelated = box("hhhhhhhh")!;
		const unrelatedEdge = drawnEdge(UNRELATED_EDGE)!;
		const movedPlacement = placement(moved);
		const unrelatedPlacement = placement(unrelated);
		const incidentRoute = route(incident);
		const unrelatedRoute = route(unrelatedEdge);

		const previousBox = drawn.layout.nodes.get(MOVED)!;
		const next = layoutGraph(drawn.model, drawn.order, {
			dragged: new Map<string, Point>([[MOVED, { x: previousBox.x + 60, y: previousBox.y }]]),
			previous: drawn.layout,
		});

		// Every box a draw measures goes through getBoundingClientRect; the
		// window opens after the draw the graph arrived in, so only what the
		// move takes is counted.
		const measured: string[] = [];
		const original = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
			const id = this.getAttribute(NODE_ID_ATTR);
			if (id !== null) {
				measured.push(id);
			}
			return original.call(this);
		};
		try {
			// Only the box the move moved is measured (tnturzro).
			drawn.renderer.measure(MOVED);
			drawn.renderer.draw({
				model: drawn.model,
				order: drawn.order,
				layout: next,
				labels: drawn.labels,
			});
		} finally {
			Element.prototype.getBoundingClientRect = original;
		}

		// tnturzro: a drawn box is carried across the draw, so the move updates
		// the element the previous draw made instead of replacing it.
		expect(box(MOVED)).toBe(moved);
		// tnturzro: the update is the change the move made.
		expect(placement(moved)).not.toBe(movedPlacement);
		// tnturzro: the moved node's own edges are re-routed in place.
		expect(drawnEdge(INCIDENT_EDGE)).toBe(incident);
		expect(route(incident)).not.toBe(incidentRoute);
		// tnturzro: a node and an edge the move does not reach keep the elements
		// and the geometry they already had.
		expect(box("hhhhhhhh")).toBe(unrelated);
		expect(placement(unrelated)).toBe(unrelatedPlacement);
		expect(drawnEdge(UNRELATED_EDGE)).toBe(unrelatedEdge);
		expect(route(unrelatedEdge)).toBe(unrelatedRoute);
		// tnturzro: the heights already measured are still in hand, so a move
		// takes no measurement of a node it did not change.
		expect(measured.filter((id) => id !== MOVED)).toEqual([]);
	});

	test("a taller box displaces the region below it as one, not box by box", () => {
		const heights = new Map<string, number>(
			BELOW.map((id): [string, number] => [id, BOX_HEIGHT]),
		);
		heights.set(CHANGED, BOX_HEIGHT);
		const measuredBelow: string[] = [];
		let recording = false;

		// The rendered height of a box is whatever the page measures it as; the
		// stub gives every box a height that draws can differ on.
		const original = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
			const id = this.getAttribute(NODE_ID_ATTR);
			if (id === null) {
				return original.call(this);
			}
			if (recording && BELOW.some((below) => below === id)) {
				measuredBelow.push(id);
			}
			return measuredRect(240, heights.get(id) ?? BOX_HEIGHT);
		};
		try {
			const drawn = draw(layeredGraph());

			const belowPlacement = BELOW.map((id) => placement(box(id)!));
			const regionOffset = regionChain(BELOW.map((id) => box(id)!), box(CHANGED)!).reduce(
				(total, element) => total + verticalOffset(element),
				0,
			);

			// The draw the one-node move causes measures the changed box taller
			// than the draw before it, so the boxes below it have to sit 48px
			// lower than they do. The layout carries them over untouched, and
			// the height change is handed to the renderer as a displacement.
			heights.set(CHANGED, TALLER_HEIGHT);
			const previousBox = drawn.layout.nodes.get(CHANGED)!;
			const next = layoutGraph(drawn.model, drawn.order, {
				dragged: new Map<string, Point>([
					[CHANGED, { x: previousBox.x + 60, y: previousBox.y }],
				]),
				heights: new Map([[CHANGED, TALLER_HEIGHT]]),
				previous: drawn.layout,
			});

			recording = true;
			drawn.renderer.measure(CHANGED);
			drawn.renderer.draw(
				{ model: drawn.model, order: drawn.order, layout: next, labels: drawn.labels },
				{ displace: [{ layer: 0, delta: TALLER_HEIGHT - BOX_HEIGHT }] },
			);
			recording = false;

			// tnturzro: the boxes below the change keep the placement they had —
			// none of them is repositioned for the taller box above ...
			expect(BELOW.map((id) => placement(box(id)!))).toEqual(belowPlacement);
			// ... the region they share carries the whole height difference as
			// one displacement ...
			const displaced = regionChain(BELOW.map((id) => box(id)!), box(CHANGED)!);
			expect(displaced.reduce((total, element) => total + verticalOffset(element), 0)).toBe(
				regionOffset + (TALLER_HEIGHT - BOX_HEIGHT),
			);
			// ... and no box in it is measured again.
			expect(measuredBelow).toEqual([]);
		} finally {
			Element.prototype.getBoundingClientRect = original;
		}
	});
});

/**
 * The x or y part of an inline CSS `translate` value (`<x>` or `<x> <y>`), in
 * CSS pixels.
 */
function translateProperty(value: string | undefined, axis: 0 | 1): number {
	if (value === undefined) {
		return 0;
	}
	const parts = value.trim().split(/\s+/).filter((part) => part !== "");
	if (parts.length === 0) {
		return 0;
	}
	if (parts.length === 1) {
		return axis === 0 ? pixels(parts[0]) : 0;
	}
	return pixels(parts[axis]);
}

/** The x or y displacement an inline CSS `transform` list applies, in CSS pixels. */
function transformDisplacement(value: string | undefined, axis: 0 | 1): number {
	if (value === undefined) {
		return 0;
	}
	const transform = value.trim();
	if (transform === "" || transform === "none") {
		return 0;
	}
	const threeDimensional = /translate3d\(\s*(-?\d+(?:\.\d+)?)px\s*,\s*(-?\d+(?:\.\d+)?)px/.exec(
		transform,
	);
	if (threeDimensional !== null) {
		return Number(threeDimensional[axis + 1]);
	}
	const twoDimensional =
		/translate\(\s*(-?\d+(?:\.\d+)?)px(?:\s*,\s*|\s+)(-?\d+(?:\.\d+)?)px/.exec(transform);
	if (twoDimensional !== null) {
		return Number(twoDimensional[axis + 1]);
	}
	const oneDimensional = /translate\(\s*(-?\d+(?:\.\d+)?)px\s*\)/.exec(transform);
	if (oneDimensional !== null) {
		return axis === 0 ? Number(oneDimensional[1]) : 0;
	}
	const alongOneAxis =
		axis === 0
			? /translateX\(\s*(-?\d+(?:\.\d+)?)px/.exec(transform)
			: /translateY\(\s*(-?\d+(?:\.\d+)?)px/.exec(transform);
	if (alongOneAxis !== null) {
		return Number(alongOneAxis[1]);
	}
	const matrix3d = /matrix3d\(([^)]*)\)/.exec(transform);
	if (matrix3d !== null) {
		return Number(matrix3d[1].split(",")[axis === 0 ? 12 : 13] ?? 0);
	}
	const matrix = /matrix\(([^)]*)\)/.exec(transform);
	if (matrix !== null) {
		return Number(matrix[1].split(",")[axis === 0 ? 4 : 5] ?? 0);
	}
	return 0;
}

/** The x or y displacement of an SVG `transform` attribute's own translate, in user units. */
function attributeDisplacement(element: Element, axis: 0 | 1): number {
	const value = element.getAttribute("transform");
	if (value === null) {
		return 0;
	}
	const translate = /translate\(\s*(-?\d+(?:\.\d+)?)(?:[,\s]+(-?\d+(?:\.\d+)?))?\s*\)/.exec(
		value,
	);
	if (translate === null) {
		return 0;
	}
	return Number(translate[axis + 1] ?? 0);
}

/**
 * Where an element is drawn relative to one of the canvas regions: every
 * placement its own inline style and the inline styles and SVG transforms of
 * its containers add, whatever property each of them carries it in.
 */
function drawnOffset(element: Element, region: Element): Point {
	let x = 0;
	let y = 0;
	let node: Element | null = element;
	while (node !== null && node !== region) {
		const style = (node as unknown as { style?: CSSStyleDeclaration }).style;
		if (style !== undefined && style !== null) {
			x +=
				pixels(style.left) +
				pixels(style.marginLeft) +
				translateProperty(style.translate, 0) +
				transformDisplacement(style.transform, 0);
			y +=
				pixels(style.top) +
				pixels(style.marginTop) +
				translateProperty(style.translate, 1) +
				transformDisplacement(style.transform, 1);
		}
		x += attributeDisplacement(node, 0);
		y += attributeDisplacement(node, 1);
		node = node.parentElement;
	}
	return { x, y };
}

/** The numbers of a route's `d` read as points: the ends and control points in order. */
function routePoints(element: Element): Point[] {
	const d = element.getAttribute("d") ?? "";
	const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
	const points: Point[] = [];
	for (let index = 0; index + 1 < numbers.length; index += 2) {
		points.push({ x: numbers[index], y: numbers[index + 1] });
	}
	return points;
}

/** Where a drawn route is drawn, read relative to the canvas region it sits in. */
function drawnRoutePoints(element: Element, region: Element): Point[] {
	const offset = drawnOffset(element, region);
	return routePoints(element).map((point) => ({
		x: point.x + offset.x,
		y: point.y + offset.y,
	}));
}

/** The visible path one drawn edge's route is written into. */
function drawnRoute(key: string): Element | null {
	return document.querySelector(`path.edge[${EDGE_KEY_ATTR}="${key}"]`);
}

function expectPoint(actual: Point, expected: Point): void {
	expect(actual.x).toBeCloseTo(expected.x, 6);
	expect(actual.y).toBeCloseTo(expected.y, 6);
}

describe("the graph is drawn at the layout's bounds origin (qmsmvrnr)", () => {
	/** The box a dangling prerequisite leaves a stub above. */
	const STUBBED = "aaaaaaaa";
	/** The id no record of the graph names, so the stub hangs one layer above. */
	const MISSING = "qqqqqqqq";
	/** The node one layer below the stubbed box. */
	const CHILD = "bbbbbbbb";
	/** Where the stubbed box is dropped: left of column 0, so the bounds x is below 0. */
	const DRAGGED_TO = { x: -140, y: 0 };

	/**
	 * A graph whose layout bounds origin is off the canvas origin on both axes:
	 * a stub standing one layer above a layer-0 box (a negative bounds y) and
	 * that box dropped left of column 0 (a negative bounds x).
	 */
	function offOriginGraph(): NodeRecord[] {
		return [nodeRecord(STUBBED, [MISSING]), nodeRecord(CHILD, [STUBBED])];
	}

	/** Draw the off-origin graph: a stub above layer 0 and a box left of column 0. */
	function drawOffOrigin(): Drawn {
		const recordsToDraw = offOriginGraph();
		const target = canvas();
		const model = buildGraph(recordsToDraw);
		const order = graphOrder(model);
		const layout = layoutGraph(model, order, {
			dragged: new Map<string, Point>([[STUBBED, DRAGGED_TO]]),
		});
		const labels = new Map<string, string>();
		const renderer = createRenderer(target);
		renderer.draw({ model, order, layout, labels });
		return { target, renderer, model, order, layout, labels };
	}

	test("every drawn box and route sits at its layout geometry less the bounds origin", () => {
		const drawn = drawOffOrigin();
		const origin = drawn.layout.bounds;

		// The fixture's bounds origin is off the canvas origin on both axes, so
		// the layout geometry and the drawn geometry do not coincide.
		expect(origin.x).not.toBe(0);
		expect(origin.y).not.toBe(0);

		for (const [id, layoutBox] of drawn.layout.nodes) {
			const element = box(id);
			expect(element).not.toBeNull();
			expectPoint(drawnOffset(element!, drawn.target.nodes), {
				x: layoutBox.x - origin.x,
				y: layoutBox.y - origin.y,
			});
		}

		for (const route of drawn.layout.edges) {
			const key = edgeKey(route.edge);
			const path = drawnRoute(key);
			expect(path).not.toBeNull();
			const expected = [route.start, route.control1, route.control2, route.end].map(
				(point) => ({ x: point.x - origin.x, y: point.y - origin.y }),
			);
			const actual = drawnRoutePoints(path!, drawn.target.edges);
			expect(actual.length).toBe(expected.length);
			for (let index = 0; index < expected.length; index++) {
				expectPoint(actual[index], expected[index]);
			}
		}
	});

	test("the drawn graph runs from the canvas origin to the layout's bounds size", () => {
		const drawn = drawOffOrigin();
		const origin = drawn.layout.bounds;
		expect(origin.width).toBeGreaterThan(0);
		expect(origin.height).toBeGreaterThan(0);

		// Every corner the drawn boxes cover and every point the drawn routes
		// reach, read relative to the region each one was drawn into.
		const corners: Point[] = [];
		for (const [id, layoutBox] of drawn.layout.nodes) {
			const element = box(id);
			expect(element).not.toBeNull();
			const at = drawnOffset(element!, drawn.target.nodes);
			corners.push(at, { x: at.x + layoutBox.width, y: at.y + layoutBox.height });
		}
		for (const route of drawn.layout.edges) {
			const key = edgeKey(route.edge);
			const path = drawnRoute(key);
			expect(path).not.toBeNull();
			corners.push(...drawnRoutePoints(path!, drawn.target.edges));
		}

		const xs = corners.map((corner) => corner.x);
		const ys = corners.map((corner) => corner.y);
		expect(Math.min(...xs)).toBeCloseTo(0, 6);
		expect(Math.min(...ys)).toBeCloseTo(0, 6);
		expect(Math.max(...xs)).toBeCloseTo(origin.width, 6);
		expect(Math.max(...ys)).toBeCloseTo(origin.height, 6);
	});
});
