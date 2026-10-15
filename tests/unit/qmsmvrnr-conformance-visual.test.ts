/**
 * Conformance check: what running the layout (qmsmvrnr) must show for its
 * visual-spec prerequisites (zqwxlzxm, owtptzpl, qmnttlqk, vvqvvwzk) to hold.
 *
 * The geometry is run against a graph built here and its fixed values are read
 * from the artifact's own exports, so no sketch dimension is restated.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import {
	LAYER_SPACING,
	NODE_GAP,
	NODE_MIN_HEIGHT,
	NODE_WIDTH,
	layoutGraph,
} from "../../src/graph/layout";

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

describe("the arrangement is layered and deterministic", () => {
	test("a node sits one layer below the deepest node it depends on", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);

		expect(layout.nodes.get("aaaaaaaa")?.layer).toBe(0);
		expect(layout.nodes.get("bbbbbbbb")?.layer).toBe(1);
		expect(layout.nodes.get("bbbbbbbb")?.y).toBe(
			(layout.nodes.get("aaaaaaaa")?.y ?? 0) + NODE_MIN_HEIGHT + LAYER_SPACING,
		);
	});

	test("the boxes of one layer run left to right in the order's columns", () => {
		const { layout, order } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", []),
			decision("cccccccc", ["aaaaaaaa"]),
		]);

		expect(layout.nodes.get("aaaaaaaa")?.column).toBe(order.column.get("aaaaaaaa"));
		expect((layout.nodes.get("bbbbbbbb")?.x ?? 0) - (layout.nodes.get("aaaaaaaa")?.x ?? 0)).toBe(
			NODE_WIDTH + NODE_GAP,
		);
		expect(layout.nodes.get("aaaaaaaa")?.x).toBe(0);
	});

	test("the same inputs give the same coordinates", () => {
		const records = [decision("aaaaaaaa", []), decision("bbbbbbbb", ["aaaaaaaa"])];

		const first = arranged(records).layout;
		const second = arranged(records).layout;

		expect([...second.nodes]).toEqual([...first.nodes]);
		expect(second.edges.map((route) => route.end)).toEqual(first.edges.map((route) => route.end));
	});
});

describe("the boxes are the fixed node boxes", () => {
	test("every box is the fixed width and at least the minimum height", () => {
		const { layout } = arranged([decision("aaaaaaaa", [])]);
		const box = layout.nodes.get("aaaaaaaa");

		expect(box?.width).toBe(NODE_WIDTH);
		expect(box?.height).toBe(NODE_MIN_HEIGHT);
	});

	test("a measured label grows its own box and its layer", () => {
		const { layout } = arranged(
			[decision("aaaaaaaa", []), decision("bbbbbbbb", ["aaaaaaaa"])],
			{ heights: new Map([["aaaaaaaa", NODE_MIN_HEIGHT + 40]]) },
		);

		expect(layout.nodes.get("aaaaaaaa")?.height).toBe(NODE_MIN_HEIGHT + 40);
		expect(layout.nodes.get("bbbbbbbb")?.y).toBe(NODE_MIN_HEIGHT + 40 + LAYER_SPACING);
	});

	test("a dragged node is drawn where it was put, in the same place in the order", () => {
		const { layout, order } = arranged([decision("aaaaaaaa", [])], {
			dragged: new Map([["aaaaaaaa", { x: 321, y: 123 }]]),
		});

		expect(layout.nodes.get("aaaaaaaa")?.x).toBe(321);
		expect(layout.nodes.get("aaaaaaaa")?.y).toBe(123);
		expect(order.column.get("aaaaaaaa")).toBe(0);
	});
});

describe("the edges are routed from the parent end to the child end", () => {
	test("a route leaves the bottom of the parent box and meets the top of the child box", () => {
		const { layout } = arranged([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);
		const route = layout.edges[0];
		const parent = layout.nodes.get("aaaaaaaa");
		const child = layout.nodes.get("bbbbbbbb");

		const middle = ((route?.start.y ?? 0) + (route?.end.y ?? 0)) / 2;

		expect(route?.start).toEqual({
			x: (parent?.x ?? 0) + NODE_WIDTH / 2,
			y: (parent?.y ?? 0) + (parent?.height ?? 0),
		});
		expect(route?.end).toEqual({ x: (child?.x ?? 0) + NODE_WIDTH / 2, y: child?.y });
		expect(route?.control1).toEqual({ x: route?.start.x, y: middle });
		expect(route?.control2).toEqual({ x: route?.end.x, y: middle });
	});

	test("an unresolved edge becomes a stub at the end that is missing", () => {
		const { layout } = arranged([decision("aaaaaaaa", ["eeeeeeee"])]);
		const route = layout.edges[0];
		const child = layout.nodes.get("aaaaaaaa");

		expect(route?.end).toEqual({ x: (child?.x ?? 0) + NODE_WIDTH / 2, y: child?.y });
		expect(route?.start.y).toBe((child?.y ?? 0) - LAYER_SPACING);
	});

	test("the bounds cover every box and the stub of an unresolved edge", () => {
		const { layout } = arranged([decision("aaaaaaaa", ["eeeeeeee"])]);

		expect(layout.bounds.x).toBe(0);
		expect(layout.bounds.y).toBeLessThanOrEqual(-LAYER_SPACING);
		expect(layout.bounds.width).toBeGreaterThanOrEqual(NODE_WIDTH);
	});
});
