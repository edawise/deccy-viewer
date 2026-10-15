/**
 * Conformance check: what running the graph construction (qmsmvrnr) must show
 * for its requirement sentences (xrxmwrxz, tqxvykwn, ruqsmuxz) to hold.
 *
 * The expectations are the sentences' — the repo root and the edges to it are
 * omitted (xrxmwrxz), an edge to a missing node id is kept and marked
 * (tqxvykwn), and the order keyboard focus walks is by topological depth, then
 * left-to-right position, then node id (ruqsmuxz) — or the records this check
 * builds itself. The graph construction is imported for its entry points only:
 * none of its constants is asserted back.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph, neighbourhood } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";

/** xrxmwrxz: the repo root whose node and edges the graph omits. */
const ROOT = "zzzzzzzz";

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

describe("the graph omits the repo root (xrxmwrxz)", () => {
	test("the edges to the repo root are dropped, both kinds", () => {
		const model = buildGraph([
			decision("aaaaaaaa", [ROOT]),
			evaluation("bbbbbbbb", [ROOT], ["aaaaaaaa"]),
		]);

		// xrxmwrxz: the repo root and the edges to it are omitted from the graph.
		expect(model.edges.map((edge) => [edge.kind, edge.from, edge.to])).toEqual([
			["evaluates", "bbbbbbbb", "aaaaaaaa"],
		]);
		expect(model.nodes.map((node) => node.id)).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("the repo root is not a root of the graph, and the node that listed it is", () => {
		const model = buildGraph([
			decision("aaaaaaaa", [ROOT]),
			decision("bbbbbbbb", ["aaaaaaaa"]),
		]);

		// xrxmwrxz: the repo root is no node of the rendered graph, so it is no
		// root of it either.
		expect(model.roots).not.toContain(ROOT);
		expect(model.roots).toEqual(["aaaaaaaa"]);
	});
});

describe("an edge naming a missing node id is kept and marked (tqxvykwn)", () => {
	test("a dependency referencing a missing node id", () => {
		const model = buildGraph([decision("aaaaaaaa", ["cccccccc"])]);

		// tqxvykwn: the edge is rendered as unresolved, marked at the end that is
		// missing.
		expect(model.edges).toHaveLength(1);
		expect(model.edges[0]?.from).toBe("cccccccc");
		expect(model.edges[0]?.danglingEnd).toBe("from");
	});

	test("an evaluation referencing a missing node id", () => {
		const model = buildGraph([evaluation("aaaaaaaa", [], ["dddddddd"])]);

		// tqxvykwn: the same holds for an evaluates edge.
		expect(model.edges).toHaveLength(1);
		expect(model.edges[0]?.to).toBe("dddddddd");
		expect(model.edges[0]?.danglingEnd).toBe("to");
	});

	test("the context of a node keeps its unresolved edge and lists no missing node beside it", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa", "eeeeeeee"]),
			evaluation("cccccccc", ["aaaaaaaa"], ["bbbbbbbb"]),
		]);

		const near = neighbourhood(model, "bbbbbbbb");

		// tqxvykwn: the unresolved edge is still an edge of the graph, so it is
		// listed with the node's edges ...
		expect(near.edges.map((edge) => `${edge.kind} ${edge.from} ${edge.to}`).sort()).toEqual([
			"depends_on aaaaaaaa bbbbbbbb",
			"depends_on eeeeeeee bbbbbbbb",
			"evaluates cccccccc bbbbbbbb",
		]);
		// ... and its missing end names no node of the graph, so it is no
		// neighbour of the node.
		expect([...near.nodes].sort()).toEqual(["aaaaaaaa", "cccccccc"]);
	});
});

describe("the graph order is the one keyboard focus walks (ruqsmuxz)", () => {
	test("every node of the model is ordered once", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			decision("cccccccc", ["bbbbbbbb"]),
		]);

		const order = graphOrder(model);

		// ruqsmuxz: focus walks the graph order, so it holds every node once.
		expect([...order.ids].sort()).toEqual(["aaaaaaaa", "bbbbbbbb", "cccccccc"]);
	});

	test("the depth of a node is its longest distance from a root", () => {
		const model = buildGraph([
			decision("aaaaaaaa", []),
			decision("bbbbbbbb", ["aaaaaaaa"]),
			decision("cccccccc", ["aaaaaaaa", "bbbbbbbb"]),
		]);

		const order = graphOrder(model);

		// ruqsmuxz: focus walks by topological depth from the roots.
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

		// ruqsmuxz: the two nodes of depth 0 come first, in their left-to-right
		// position (aaaa) then by node id (bbbb), then the node of depth 1.
		expect(order.ids).toEqual(["aaaaaaaa", "bbbbbbbb", "cccccccc"]);
		// ruqsmuxz: "wrapping at the last node" is the walk of this order, so the
		// check is that the order itself repeats.
		expect(graphOrder(model).ids).toEqual(order.ids);
	});

	test("an unresolved edge carries no depth (tqxvykwn)", () => {
		const model = buildGraph([decision("aaaaaaaa", []), decision("bbbbbbbb", ["eeeeeeee"])]);

		const order = graphOrder(model);

		// tqxvykwn: the unresolved edge attaches no node of the graph, so it
		// carries no depth and its node stays at the top.
		expect(order.depth.get("bbbbbbbb")).toBe(0);
	});
});
