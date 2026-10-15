/**
 * Contract check: what running the page interface's artifacts (ympqvvwr) must
 * show against the graph model they describe (qmsmvrnr).
 *
 * The model, its order and its geometry are built here, so the check observes
 * that the interface's keys and shapes are defined over exactly them.
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

describe("the interface is defined over the graph model", () => {
	test("the interaction graph is the model and the order the layout is built from", () => {
		const model = buildGraph(records());
		const order = graphOrder(model);
		const graph: InteractionGraph = { model, order };

		const layout = layoutGraph(graph.model, graph.order);

		expect([...layout.nodes.keys()].sort()).toEqual(
			graph.model.nodes.map((node) => node.id).sort(),
		);
		expect(layout.edges).toHaveLength(graph.model.edges.length);
	});

	test("the edge key tells every edge of the model apart", () => {
		const model = buildGraph(records());

		const keys = model.edges.map((edge) => edgeKey(edge));

		expect(new Set(keys).size).toBe(model.edges.length);
		expect(keys).toContain("depends_on:aaaaaaaa->bbbbbbbb");
		expect(keys).toContain("depends_on:cccccccc->bbbbbbbb");
	});

	test("an unresolved edge of the model still has a key, so it can be drawn and targeted", () => {
		const model = buildGraph(records());

		const dangling = model.edges.find((edge) => edge.danglingEnd !== undefined);

		expect(dangling).toBeDefined();
		expect(edgeKey(dangling!)).toBe("depends_on:cccccccc->bbbbbbbb");
	});

	test("the drawn identity attributes are the ones the interface names", () => {
		expect(NODE_ID_ATTR).toBe("data-node-id");
		expect(EDGE_KEY_ATTR).toBe("data-edge-key");
	});
});
