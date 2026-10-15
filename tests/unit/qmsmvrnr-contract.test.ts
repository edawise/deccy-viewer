/**
 * Contract check: what running the graph construction (qmsmvrnr) must show
 * against the data-loading artifact it consumes (zswmtqst).
 *
 * The records are produced by the loading itself from documents written here,
 * so the check runs the two artifacts against each other.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { NODES_DIR, ROOT_NODE_ID, loadNodeRecords } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";

const workspaces: string[] = [];

function workspace(documents: Record<string, unknown>): string {
	const root = mkdtempSync(path.join(tmpdir(), "deccy-graph-"));
	workspaces.push(root);
	mkdirSync(path.join(root, NODES_DIR));
	for (const [id, document] of Object.entries(documents)) {
		writeFileSync(path.join(root, NODES_DIR, `${id}.json`), JSON.stringify(document));
	}
	return root;
}

function decision(dependsOn: string[]): unknown {
	return {
		kind: "decision",
		depends_on: dependsOn,
		content: { type: "text", ref: "inline", content: "c", rationale: "r" },
	};
}

afterEach(() => {
	for (const root of workspaces.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

describe("the graph is built from the loaded records", () => {
	test("every loaded record is a node of the graph, with its kind and content", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: {
				kind: "evaluation",
				depends_on: [ROOT_NODE_ID],
				evaluates: ["aaaaaaaa"],
				content: { type: "test", ref: ["tests/x.ts"], rationale: "r" },
			},
		});

		const records = await loadNodeRecords(root);
		const model = buildGraph(records);

		expect(model.nodes).toEqual(records.map((record) => ({
			id: record.id,
			kind: record.kind,
			content: record.content,
		})));
	});

	test("every edge of a record is an edge of the graph, in the render direction", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: decision(["aaaaaaaa"]),
			cccccccc: decision([ROOT_NODE_ID, "aaaaaaaa"]),
		});

		const model = buildGraph(await loadNodeRecords(root));

		expect(model.edges.map((edge) => [edge.kind, edge.from, edge.to])).toEqual([
			["depends_on", "aaaaaaaa", "bbbbbbbb"],
			["depends_on", "aaaaaaaa", "cccccccc"],
		]);
	});

	test("an id the loading kept even though no document names it stays an unresolved edge", async () => {
		const root = workspace({ aaaaaaaa: decision(["dddddddd"]) });

		const model = buildGraph(await loadNodeRecords(root));

		expect(model.edges[0]?.danglingEnd).toBe("from");
	});

	test("the order and the layout are defined for every node the loading produced", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: decision(["aaaaaaaa"]),
		});

		const model = buildGraph(await loadNodeRecords(root));
		const order = graphOrder(model);
		const layout = layoutGraph(model, order);

		expect([...order.ids].sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
		expect([...layout.nodes.keys()].sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});
});
