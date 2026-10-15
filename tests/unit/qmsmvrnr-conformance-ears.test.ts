/**
 * Conformance check: what running the graph construction (qmsmvrnr) must show
 * for its requirement sentences (xrxmwrxz, tqxvykwn, ruqsmuxz) to hold.
 *
 * The graph and its order are run against records built here, so the check
 * observes the artifact's own model, never a particular workspace.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { ROOT_NODE_ID } from "../../src/data/nodes";
import { buildGraph, neighbourhood } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";

function decision(id: string, dependsOn: string[]): NodeRecord {
	return {
		id,
		kind: "decision",
		dependsOn,
		evaluates: [],
		content: { type: "text", ref: "inline", rationale: `r ${id}` },
	};
}

function evaluation(id: string, dependsOn: string[], evaluates: string[]): NodeRecord {
	return {
		id,
		kind: "evaluation",
		dependsOn,
		evaluates,
		content: { type: "test", ref: ["t"], rationale: `r ${id}` },
	};
}

describe("the graph answers to its records", () => {
	test("the edges to the repo root are dropped, both kinds", () => {
		const model = buildGraph([
			decision("aaaaaaaa", [ROOT_NODE_ID]),
			evaluation("bbbbbbbb", [ROOT_NODE_ID], ["aaaaaaaa"]),
		]);

		expect(model.edges.map((edge) => [edge.kind, edge.from, edge.to])).toEqual([
			["evaluates", "bbbbbbbb", "aaaaaaaa"],
		]);
		expect(model.nodes.map((node) => node.id)).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("an edge naming a node with no document is kept and marked at its dangling end", () => {
		const model = buildGraph([decision("aaaaaaaa", ["cccccccc"])]);

		expect(model.edges).toHaveLength(1);
		expect(model.edges[0]?.from).toBe("cccccccc");
		expect(model.edges[0]?.danglingEnd).toBe("from");
	});

	test("the roots are the nodes no other node of the graph attaches to", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			decision("cccccccc", ["dddddddd"]),
		]);

		expect(model.roots).toEqual(["aaaaaaaa", "cccccccc"]);
	});

	test("hovering a node lists its incident edges and its neighbours, never itself", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			evaluation("cccccccc", ["aaaaaaaa"], ["bbbbbbbb"]),
		]);

		const near = neighbourhood(model, "bbbbbbbb");

		expect(near.nodes.sort()).toEqual(["aaaaaaaa", "cccccccc"]);
		expect(near.edges.map((edge) => edge.kind)).toEqual(["depends_on", "evaluates"]);
	});
});

describe("the graph order is the deterministic order keyboard focus walks", () => {
	test("every node of the model is ordered once", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			decision("cccccccc", ["bbbbbbbb"]),
		]);

		const order = graphOrder(model);

		expect([...order.ids].sort()).toEqual(["aaaaaaaa", "bbbbbbbb", "cccccccc"]);
	});

	test("the depth of a node is its longest distance from a root", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			decision("cccccccc", ["aaaaaaaa", "bbbbbbbb"]),
		]);

		const order = graphOrder(model);

		expect(order.depth.get("aaaaaaaa")).toBe(0);
		expect(order.depth.get("bbbbbbbb")).toBe(1);
		expect(order.depth.get("cccccccc")).toBe(2);
	});

	test("the order is by depth, then left-to-right position, then node id, and repeats", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", []),
			decision("cccccccc", ["aaaaaaaa"]),
		]);

		const order = graphOrder(model);

		expect(order.ids[0]).toBe("aaaaaaaa");
		expect(order.ids[1]).toBe("bbbbbbbb");
		expect(order.ids[2]).toBe("cccccccc");
		expect(graphOrder(model).ids).toEqual(order.ids);
	});

	test("an unresolved edge carries no depth", () => {
		const model = buildGraph([decision("aaaaaaaa", []), decision("bbbbbbbb", ["eeeeeeee"])]);

		const order = graphOrder(model);

		expect(order.depth.get("bbbbbbbb")).toBe(0);
	});
});
