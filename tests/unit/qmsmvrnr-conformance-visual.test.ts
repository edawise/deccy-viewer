/**
 * Conformance check: what running the layout (qmsmvrnr) must show for its
 * visual-spec prerequisites (zqwxlzxm, owtptzpl, qmnttlqk, vvqvvwzk) to hold.
 *
 * The dimensions are the literals the specs pin — "240px wide, min-height
 * 72px" (owtptzpl) and "96px" layer spacing (qmnttlqk); the arrangement is the
 * layered-topological one zqwxlzxm fixes and the geometry is read off the graph
 * built here. The layout is imported for its entry point only: none of its
 * constants is asserted back. vvqvvwzk names the routing as "cubic-bezier"
 * without pinning control points, so the routes are checked for their shape
 * and their endpoints only.
 *
 * The last block is the incremental-geometry clause of msvoysvz: a change
 * recomputes the moved node's box and its incident routes and nothing else,
 * and neighbour/incident-edge lookups answer from the graph revision in hand.
 * The check pins one minimal entry point for that clause — the prior layout is
 * handed to the layout call — and no index, counter or control-point constant.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph, neighbourhood } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import type { EdgeRoute, GraphLayout, Point } from "../../src/graph/layout";
import { layoutGraph } from "../../src/graph/layout";

/** owtptzpl: node/* size — "240px wide, min-height 72px". */
const NODE_WIDTH = 240;
const NODE_MIN_HEIGHT = 72;

/** qmnttlqk: graph layer-spacing — "96px". */
const LAYER_SPACING = 96;

/** The height this check measures for a wrapped label where it measures one. */
const MEASURED_HEIGHT = 112;

function decision(id: string, dependsOn: string[]): NodeRecord {
	return {
		id,
		kind: "decision",
		dependsOn,
		evaluates: [],
		content: { type: "text", ref: "inline", rationale: `r ${id}` },
	};
}

function arranged(records: NodeRecord[], options = {}) {
	const model = buildGraph(records);
	const order = graphOrder(model);
	return { model, order, layout: layoutGraph(model, order, options) };
}

describe("the arrangement is layered and deterministic (zqwxlzxm)", () => {
	test("a node sits one layer below the deepest node it depends on", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);
		const root = layout.nodes.get("aaaaaaaa");
		const child = layout.nodes.get("bbbbbbbb");

		// zqwxlzxm: layers = topological depth from roots.
		expect(root?.layer).toBe(0);
		expect(child?.layer).toBe(1);
		// owtptzpl (min-height 72px) + qmnttlqk (96px): the layer below sits one
		// box height and one layer spacing further down.
		expect((child?.y ?? 0) - (root?.y ?? 0)).toBe(NODE_MIN_HEIGHT + LAYER_SPACING);
	});

	test("the boxes of one layer run left to right", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", []),
			decision("cccccccc", ["aaaaaaaa"]),
		]);
		const first = layout.nodes.get("aaaaaaaa");
		const second = layout.nodes.get("bbbbbbbb");
		const child = layout.nodes.get("cccccccc");

		// zqwxlzxm: the two nodes nothing depends on both start at depth 0.
		expect(first?.layer).toBe(0);
		expect(second?.layer).toBe(0);
		expect(first?.y).toBe(second?.y);
		// zqwxlzxm (left-to-right within layer) + owtptzpl (240px wide): the two
		// boxes of the layer take two slots and never overlap.
		expect(new Set([first?.x, second?.x]).size).toBe(2);
		expect(Math.abs((first?.x ?? 0) - (second?.x ?? 0))).toBeGreaterThanOrEqual(NODE_WIDTH);
		expect(first?.width).toBe(NODE_WIDTH);
		expect(second?.width).toBe(NODE_WIDTH);
		// zqwxlzxm: the node that depends on one of them is one layer below.
		expect(child?.layer).toBe(1);
		expect(child?.y).toBeGreaterThan(first?.y ?? 0);
	});

	test("the same inputs give the same coordinates", () => {
		const records = [decision("aaaaaaaa", []), decision("bbbbbbbb", ["aaaaaaaa"])];

		const first = arranged(records).layout;
		const second = arranged(records).layout;

		// zqwxlzxm: the arrangement is deterministic.
		expect([...second.nodes]).toEqual([...first.nodes]);
		expect(second.edges.map((route) => route.edge)).toEqual(first.edges.map((route) => route.edge));
		expect(second.edges.map((route) => route.end)).toEqual(first.edges.map((route) => route.end));
	});
});

describe("the boxes are the fixed node boxes (owtptzpl)", () => {
	test("every box is 240px wide and at least 72px tall", () => {
		const { layout } = arranged([decision("aaaaaaaa", [])]);
		const box = layout.nodes.get("aaaaaaaa");

		// owtptzpl: "240px wide, min-height 72px".
		expect(box?.width).toBe(NODE_WIDTH);
		expect(box?.height).toBeGreaterThanOrEqual(NODE_MIN_HEIGHT);
	});

	test("a measured label grows its own box and the layer below it", () => {
		const { layout } = arranged(
			[decision("aaaaaaaa", []), decision("bbbbbbbb", ["aaaaaaaa"])],
			{ heights: new Map([["aaaaaaaa", MEASURED_HEIGHT]]) },
		);
		const parent = layout.nodes.get("aaaaaaaa");
		const child = layout.nodes.get("bbbbbbbb");

		// owtptzpl note: the label wraps inside the box, so a label measured
		// taller than the minimum grows its box.
		expect(parent?.height).toBeGreaterThanOrEqual(MEASURED_HEIGHT);
		// qmnttlqk (96px): the layer below moves down with the grown box.
		expect((child?.y ?? 0) - (parent?.y ?? 0)).toBe((parent?.height ?? 0) + LAYER_SPACING);
	});

	test("a dragged node is drawn where it was put", () => {
		const { layout } = arranged([decision("aaaaaaaa", [])], {
			dragged: new Map([["aaaaaaaa", { x: 321, y: 123 }]]),
		});

		// zqwxlzxm note: dragged positions override the position the arrangement
		// assigned.
		expect(layout.nodes.get("aaaaaaaa")?.x).toBe(321);
		expect(layout.nodes.get("aaaaaaaa")?.y).toBe(123);
	});
});

describe("the edges are routed as cubics between the boxes (vvqvvwzk)", () => {
	test("a route leaves the parent box and meets the child box", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);
		const route = layout.edges[0];
		const parent = layout.nodes.get("aaaaaaaa");
		const child = layout.nodes.get("bbbbbbbb");

		// zqwxlzxm + owtptzpl: the route runs from the parent box to the child
		// box, both 240px wide, so it starts and ends on the box centres.
		expect(route?.start.x).toBe((parent?.x ?? 0) + NODE_WIDTH / 2);
		expect(route?.start.y).toBe((parent?.y ?? 0) + (parent?.height ?? 0));
		expect(route?.end.x).toBe((child?.x ?? 0) + NODE_WIDTH / 2);
		expect(route?.end.y).toBe(child?.y);

		// vvqvvwzk: the route is a cubic-bezier. The spec pins no control-point
		// values, so only the shape is checked: two control points between the
		// two ends.
		const start = { x: route?.start.x ?? 0, y: route?.start.y ?? 0 };
		const end = { x: route?.end.x ?? 0, y: route?.end.y ?? 0 };
		const between = (value: number, a: number, b: number): boolean =>
			value >= Math.min(a, b) && value <= Math.max(a, b);
		expect(route?.control1).toBeDefined();
		expect(route?.control2).toBeDefined();
		expect(between(route?.control1.x ?? 0, start.x, end.x)).toBe(true);
		expect(between(route?.control1.y ?? 0, start.y, end.y)).toBe(true);
		expect(between(route?.control2.x ?? 0, start.x, end.x)).toBe(true);
		expect(between(route?.control2.y ?? 0, start.y, end.y)).toBe(true);
	});

	test("an unresolved edge becomes a stub at the end that is missing", () => {
		const { layout } = arranged([decision("aaaaaaaa", ["eeeeeeee"])]);
		const route = layout.edges[0];
		const child = layout.nodes.get("aaaaaaaa");

		// zqwxlzxm + owtptzpl: the route still meets the box it names.
		expect(route?.end.x).toBe((child?.x ?? 0) + NODE_WIDTH / 2);
		expect(route?.end.y).toBe(child?.y);
		// qmnttlqk (96px): the missing end is one layer spacing away.
		expect(route?.start.x).toBe((child?.x ?? 0) + NODE_WIDTH / 2);
		expect(route?.start.y).toBe((child?.y ?? 0) - LAYER_SPACING);
	});

	test("the bounds cover every box and every route", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", ["eeeeeeee"]),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);

		// zqwxlzxm + owtptzpl: the bounds cover every box, so they are at least
		// one 240px box wide ...
		expect(layout.bounds.width).toBeGreaterThanOrEqual(NODE_WIDTH);
		for (const box of layout.nodes.values()) {
			expect(box.x).toBeGreaterThanOrEqual(layout.bounds.x);
			expect(box.y).toBeGreaterThanOrEqual(layout.bounds.y);
			expect(box.x + box.width).toBeLessThanOrEqual(layout.bounds.x + layout.bounds.width);
			expect(box.y + box.height).toBeLessThanOrEqual(layout.bounds.y + layout.bounds.height);
		}
		// ... and they cover the routes, including the 96px stub of the
		// unresolved edge (qmnttlqk).
		for (const route of layout.edges) {
			expect(Math.min(route.start.y, route.end.y)).toBeGreaterThanOrEqual(layout.bounds.y);
		}
		expect(layout.bounds.y).toBeLessThanOrEqual(-LAYER_SPACING);
	});
});

describe("a change serves only the geometry it affects (msvoysvz)", () => {
	/** aaaa and bbbb are roots; cccc and dddd sit below one root each; eeee joins both. */
	const records = (): NodeRecord[] => [
		decision("aaaaaaaa", []),
		decision("bbbbbbbb", []),
		decision("cccccccc", ["aaaaaaaa"]),
		decision("dddddddd", ["bbbbbbbb"]),
		decision("eeeeeeee", ["cccccccc", "dddddddd"]),
	];

	/** The route of the edge between two nodes, or undefined when there is none. */
	function routeOf(layout: GraphLayout, from: string, to: string): EdgeRoute | undefined {
		return layout.edges.find((route) => route.edge.from === from && route.edge.to === to);
	}

	/**
	 * The layout call with a prior layout. msvoysvz does not fix a name for the
	 * handover, so the gate pins the smallest one it can observe: the option the
	 * layout already takes for the dragged positions, plus the layout in hand.
	 * The cast keeps the check runnable against a layout call that does not yet
	 * accept the prior layout; nothing else in the check depends on it.
	 */
	function withPrevious(
		model: ReturnType<typeof buildGraph>,
		order: ReturnType<typeof graphOrder>,
		dragged: ReadonlyMap<string, Point>,
		previous: GraphLayout,
	): GraphLayout {
		const options = { dragged, previous } as unknown as Parameters<typeof layoutGraph>[2];
		return layoutGraph(model, order, options);
	}

	test("moving one node re-routes its incident edges and carries every other route over", () => {
		const model = buildGraph(records());
		const order = graphOrder(model);
		const before = layoutGraph(model, order);

		// The layout in hand is the earlier layout with one unaffected route
		// perturbed. A routing pass never emits control points at the origin for
		// the routes of this graph, so a route that is carried over keeps the
		// perturbation while a re-routed edge cannot (msvoysvz: a change runs no
		// routing pass over the rest of the graph).
		const earlier = routeOf(before, "bbbbbbbb", "dddddddd");
		expect(earlier).toBeDefined();
		const carried: EdgeRoute = {
			...(earlier as EdgeRoute),
			control1: { x: 0, y: 0 },
			control2: { x: 0, y: 0 },
		};
		const previous: GraphLayout = {
			...before,
			edges: before.edges.map((route) => (route === earlier ? carried : route)),
		};

		const dragged = new Map([["cccccccc", { x: 900, y: 640 }]]);
		const incremental = withPrevious(model, order, dragged, previous);
		const full = layoutGraph(model, order, { dragged });

		// msvoysvz: the moved node's box is recomputed, and agrees with what a
		// layout of the same drag produces.
		expect(incremental.nodes.get("cccccccc")).toEqual(full.nodes.get("cccccccc"));
		expect(incremental.nodes.get("cccccccc")?.x).toBe(900);
		expect(incremental.nodes.get("cccccccc")?.y).toBe(640);

		// msvoysvz: its incident edges are the only routes recomputed, and they
		// agree with the full layout's routes for the same drag.
		for (const [from, to] of [["aaaaaaaa", "cccccccc"], ["cccccccc", "eeeeeeee"]]) {
			expect(routeOf(incremental, from, to)).toEqual(routeOf(full, from, to));
		}

		// msvoysvz: every route the change does not touch is the previous
		// layout's route, including the perturbed one, and the edges stay the
		// model's edges in the model's order.
		for (const [from, to] of [["bbbbbbbb", "dddddddd"], ["dddddddd", "eeeeeeee"]]) {
			expect(routeOf(incremental, from, to)).toEqual(routeOf(previous, from, to));
		}
		expect(routeOf(incremental, "bbbbbbbb", "dddddddd")).toEqual(carried);
		expect(incremental.edges.map((route) => route.edge)).toEqual(
			previous.edges.map((route) => route.edge),
		);

		// msvoysvz: every other box is unchanged too.
		for (const id of ["aaaaaaaa", "bbbbbbbb", "dddddddd", "eeeeeeee"]) {
			expect(incremental.nodes.get(id)).toEqual(previous.nodes.get(id));
		}
	});

	test("the neighbour and incident-edge lookups answer from the graph in hand", () => {
		const before = buildGraph(records());
		const after = buildGraph([...records(), decision("ffffffff", ["cccccccc"])]);

		// msvoysvz: the lookups are held for the graph revision in hand, so the
		// earlier revision keeps its answer and the newer one answers from the
		// edge the revision added.
		expect(neighbourhood(before, "cccccccc").nodes).toEqual(["aaaaaaaa", "eeeeeeee"]);
		expect(neighbourhood(after, "cccccccc").nodes).toEqual([
			"aaaaaaaa",
			"eeeeeeee",
			"ffffffff",
		]);
		expect(
			neighbourhood(before, "cccccccc").edges.map((edge) => [edge.from, edge.to]),
		).toEqual([
			["aaaaaaaa", "cccccccc"],
			["cccccccc", "eeeeeeee"],
		]);
	});
});
