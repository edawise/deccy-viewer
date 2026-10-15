/**
 * Contract check: what running the page interface's artifacts (ympqvvwr) must
 * show against the graph model they describe (qmsmvrnr).
 *
 * The prerequisite's declared interface is the spec: the graph, its order and
 * its geometry — `GraphModel`, `GraphOrder`, `GraphLayout` and `GraphEdge` —
 * are imported here and built by the prerequisite's own entry points. The
 * interface is checked for being defined over exactly them, and no value the
 * model's interface does not fix is asserted.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { InteractionGraph } from "../../src/webview/contract";
import { EDGE_KEY_ATTR, NODE_ID_ATTR, edgeKey } from "../../src/webview/contract";

function records(): NodeRecord[] {
	return [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "a" },
		},
		{
			id: "bbbbbbbb",
			kind: "decision",
			dependsOn: ["aaaaaaaa", "cccccccc"],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "b" },
		},
	];
}

describe("the interface is defined over the graph model (qmsmvrnr)", () => {
	test("the interaction graph is the model and the order the layout is built from", () => {
		const model = buildGraph(records());
		const order = graphOrder(model);
		const graph: InteractionGraph = { model, order };

		const layout = layoutGraph(graph.model, graph.order);

		// qmsmvrnr: GraphLayout gives a box to every node of the GraphModel ...
		expect([...layout.nodes.keys()].sort()).toEqual(
			graph.model.nodes.map((node) => node.id).sort(),
		);
		// ... and routes one edge per edge of the GraphModel.
		expect(layout.edges).toHaveLength(graph.model.edges.length);
	});

	test("the edge key tells every edge of the model apart", () => {
		const model = buildGraph(records());

		const keys = model.edges.map((edge) => edgeKey(edge));

		// qmsmvrnr: a GraphEdge is told from another by its kind and its two ends,
		// so the interface's key is defined for every edge of the model ...
		expect(keys).toHaveLength(model.edges.length);
		// ... and names its ends, so two edges sharing a child are told apart.
		for (const edge of model.edges) {
			expect(edgeKey(edge)).toContain(edge.from);
			expect(edgeKey(edge)).toContain(edge.to);
		}
		expect(new Set(keys).size).toBe(model.edges.length);
	});

	test("an unresolved edge of the model still has a key, so it can be drawn and targeted", () => {
		const model = buildGraph(records());

		const dangling = model.edges.find((edge) => edge.danglingEnd !== undefined);

		// qmsmvrnr: an edge whose GraphEdge.danglingEnd names the missing end is an
		// edge of the model like any other, so the interface gives it a key that
		// is told apart from the rest.
		expect(dangling).toBeDefined();
		expect(edgeKey(dangling!)).not.toBe("");
		expect(new Set(model.edges.map((edge) => edgeKey(edge))).size).toBe(model.edges.length);
	});

	test("the interface names a distinct attribute for a node and for an edge", () => {
		// qmsmvrnr fixes no attribute name: all the interface owes the model is an
		// identity for the drawn boxes and one for the drawn edge parts, told
		// apart from each other.
		expect(NODE_ID_ATTR).toBeTypeOf("string");
		expect(EDGE_KEY_ATTR).toBeTypeOf("string");
		expect(NODE_ID_ATTR.length).toBeGreaterThan(0);
		expect(EDGE_KEY_ATTR.length).toBeGreaterThan(0);
		expect(NODE_ID_ATTR).not.toBe(EDGE_KEY_ATTR);
	});
});
