/**
 * Contract check: what running the graph construction (qmsmvrnr) must show
 * against the data-loading artifact it consumes (zswmtqst).
 *
 * The prerequisite's declared interface is the spec: the records it produces —
 * `NodeRecord` with its `kind`, its `dependsOn` and `evaluates` edges and its
 * `content` — and the repo root id it exports are imported here, and the graph,
 * the order and the layout are built over them. The records are produced by the
 * loading itself from documents written here, so the check runs the two
 * artifacts against each other and asserts no value the loading's declared
 * interface does not fix.
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

function evaluation(dependsOn: string[], evaluates: string[]): unknown {
	return {
		kind: "evaluation",
		depends_on: dependsOn,
		evaluates,
		content: { type: "test", ref: ["tests/x.ts"], rationale: "r" },
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
			bbbbbbbb: evaluation([ROOT_NODE_ID], ["aaaaaaaa"]),
		});

		const records = (await loadNodeRecords(root)).records;
		const model = buildGraph(records);

		// zswmtqst: a NodeRecord is {id, kind, dependsOn, evaluates, content}: the
		// graph node carries the record's id, kind and content.
		expect(model.nodes).toEqual(
			records.map((record) => ({
				id: record.id,
				kind: record.kind,
				content: record.content,
			})),
		);
	});

	test("every edge of a record is an edge of the graph, from the prerequisite to the declaring node", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: decision(["aaaaaaaa"]),
			cccccccc: decision([ROOT_NODE_ID, "aaaaaaaa"]),
		});

		const model = buildGraph((await loadNodeRecords(root)).records);

		// zswmtqst: NodeRecord.dependsOn lists the prerequisite ids and exports
		// ROOT_NODE_ID as the pseudo-node a decision with no prerequisites lists,
		// so the edges to it are no graph edges. Every other entry becomes one
		// depends_on edge, from the listed prerequisite to the declaring node.
		expect(model.edges.map((edge) => [edge.kind, edge.from, edge.to])).toEqual([
			["depends_on", "aaaaaaaa", "bbbbbbbb"],
			["depends_on", "aaaaaaaa", "cccccccc"],
		]);
	});

	test("an evaluation's record becomes an evaluates edge, from the evaluator to the node it evaluates", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: evaluation([ROOT_NODE_ID], ["aaaaaaaa"]),
		});

		const model = buildGraph((await loadNodeRecords(root)).records);

		// zswmtqst: NodeRecord.evaluates lists the evaluated node ids; every entry
		// becomes one evaluates edge from the declaring evaluator to that node.
		expect(model.edges.map((edge) => [edge.kind, edge.from, edge.to])).toEqual([
			["evaluates", "bbbbbbbb", "aaaaaaaa"],
		]);
	});

	test("an id the loading kept even though no document names it stays an unresolved edge", async () => {
		const root = workspace({ aaaaaaaa: decision(["dddddddd"]) });

		const model = buildGraph((await loadNodeRecords(root)).records);

		// zswmtqst: the loading keeps an edge to an id with no document, and the
		// graph marks it at the end that names no node.
		expect(model.edges[0]?.from).toBe("dddddddd");
		expect(model.edges[0]?.danglingEnd).toBe("from");
	});

	test("the order and the layout are defined for every node the loading produced", async () => {
		const root = workspace({
			aaaaaaaa: decision([ROOT_NODE_ID]),
			bbbbbbbb: decision(["aaaaaaaa"]),
		});

		const model = buildGraph((await loadNodeRecords(root)).records);
		const order = graphOrder(model);
		const layout = layoutGraph(model, order);

		// zswmtqst: the loading hands every document on as a record, so the order
		// and the layout are defined for every node it produced.
		expect([...order.ids].sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
		expect([...layout.nodes.keys()].sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});
});
