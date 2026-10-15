/**
 * Conformance check: what running the data loading (zswmtqst) must show for
 * the requirement sentences it answers to (krvyoumy, qpsnwxlu, tqxvykwn,
 * uvmutyww, vxmzzunt) to hold.
 *
 * The checks run the loading against workspaces of their own making, so they
 * observe the artifact and never the workspace they live in.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
	GraphDataError,
	NODES_DIR,
	NODES_GLOB,
	ROOT_NODE_ID,
	loadNodeRecords,
	parseNodeDocument,
} from "../../src/data/nodes";
import { labelForChange, loadJjLabels } from "../../src/data/jj";
import { watchNodeFiles } from "../../src/data/watch";

const workspaces: string[] = [];

function workspace(documents: Record<string, unknown>): string {
	const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
	workspaces.push(root);
	mkdirSync(path.join(root, NODES_DIR));
	for (const [id, document] of Object.entries(documents)) {
		writeFileSync(path.join(root, NODES_DIR, `${id}.json`), JSON.stringify(document));
	}
	return root;
}

function document(dependsOn: string[], kind = "decision"): unknown {
	const edges = dependsOn.length > 0 ? { depends_on: dependsOn } : {};
	return {
		kind,
		...(kind === "evaluation" ? { evaluates: ["aaaaaaaa"] } : edges),
		content: { type: "text", ref: "inline", content: "<content>", rationale: "<rationale>" },
	};
}

afterEach(() => {
	for (const root of workspaces.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

describe("the node documents are read and validated", () => {
	test("every document under nodes/ comes back as a record, ordered by file name", async () => {
		const root = workspace({
			bbbbbbbb: document([ROOT_NODE_ID]),
			aaaaaaaa: document(["bbbbbbbb"]),
		});

		const records = await loadNodeRecords(root);

		expect(records.map((record) => record.id)).toEqual(["aaaaaaaa", "bbbbbbbb"]);
		expect(records[0]?.dependsOn).toEqual(["bbbbbbbb"]);
		expect(records[0]?.kind).toBe("decision");
		expect(records[0]?.content.type).toBe("text");
		expect(NODES_GLOB).toBe("nodes/*.json");
	});

	test("a document which does not validate fails, naming the file", async () => {
		const root = workspace({ aaaaaaaa: { kind: "decision" } });

		await expect(loadNodeRecords(root)).rejects.toThrowError(
			/nodes\/aaaaaaaa\.json/,
		);
	});

	test("the edge ownership of a document is enforced on both kinds", () => {
		expect(() => parseNodeDocument("aaaaaaaa", document([], "decision"))).toThrowError(
			/a decision must declare "depends_on"/,
		);
		expect(() =>
			parseNodeDocument("aaaaaaaa", {
				kind: "decision",
				depends_on: [ROOT_NODE_ID],
				evaluates: ["bbbbbbbb"],
				content: { type: "text", ref: "inline", content: "c", rationale: "r" },
			}),
		).toThrowError(/a decision must not declare "evaluates"/);
		expect(() =>
			parseNodeDocument("aaaaaaaa", {
				kind: "evaluation",
				depends_on: [ROOT_NODE_ID],
				content: { type: "text", ref: "inline", content: "c", rationale: "r" },
			}),
		).toThrowError(/an evaluation must declare "evaluates"/);
	});

	test("an edge naming a node with no document is kept, not failed on", async () => {
		const root = workspace({ aaaaaaaa: document(["cccccccc"]) });

		const records = await loadNodeRecords(root);

		expect(records[0]?.dependsOn).toEqual(["cccccccc"]);
	});

	test("a graph which closes a cycle fails", async () => {
		const root = workspace({ aaaaaaaa: document(["bbbbbbbb"]), bbbbbbbb: document(["aaaaaaaa"]) });

		await expect(loadNodeRecords(root)).rejects.toThrowError(/cycle/);
	});

	test("a nodes/ directory which cannot be read fails with a user-facing message", async () => {
		const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
		workspaces.push(root);

		await expect(loadNodeRecords(root)).rejects.toThrowError(/cannot read nodes\//);
	});
});

describe("the change descriptions come from the jj log", () => {
	test("a label is looked up exactly, or by the unique longer id of the change", () => {
		const labels = new Map([
			["aaaaaaaa", "first"],
			["aaaaaaab", "second"],
			["bbbbbbbb", "third"],
		]);

		expect(labelForChange(labels, "aaaaaaaa")).toBe("first");
		expect(labelForChange(labels, "bbbbbbbb")).toBe("third");
		expect(labelForChange(labels, "bbbb")).toBe("third");
		expect(labelForChange(labels, "cccccccc")).toBeUndefined();
		// Two changes share the prefix, so no single label answers for it.
		expect(labelForChange(labels, "aaaa")).toBeUndefined();
	});

	test("a jj log which cannot be read fails with a user-facing message", async () => {
		const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
		workspaces.push(root);

		await expect(loadJjLabels(root)).rejects.toThrowError(/cannot read the jj log/);
		await expect(loadJjLabels(root)).rejects.toBeInstanceOf(GraphDataError);
	});
});

describe("the node documents are watched", () => {
	test("a document that appears is reported as created, with its node id", async () => {
		const root = workspace({ aaaaaaaa: document([ROOT_NODE_ID]) });
		const seen: string[] = [];

		const watcher = watchNodeFiles(
			root,
			(changes) => seen.push(...changes.map((change) => `${change.type} ${change.id}`)),
			{ debounceMs: 10 },
		);
		try {
			writeFileSync(path.join(root, NODES_DIR, "dddddddd.json"), JSON.stringify(document([ROOT_NODE_ID])));
			const deadline = Date.now() + 5_000;
			while (!seen.includes("created dddddddd") && Date.now() < deadline) {
				await new Promise((resolve) => setTimeout(resolve, 20));
			}
		} finally {
			watcher.dispose();
		}

		expect(seen).toContain("created dddddddd");
	});
});
