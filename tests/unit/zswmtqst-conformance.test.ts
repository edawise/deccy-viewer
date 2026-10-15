/**
 * Conformance check: what running the data loading (zswmtqst) must show for
 * the requirement sentences and the spec it answers to (krvyoumy, qpsnwxlu,
 * tqxvykwn, uvmutyww, vxmzzunt, xrxmwrxz, mnovnnot) to hold.
 *
 * Every expectation is one of those records — the documents read from
 * `nodes/*.json` and the change descriptions read from the jj log (qpsnwxlu),
 * the warning that names the file and the problem (krvyoumy, against
 * schemas/node.json), the edge kept as unresolved (tqxvykwn), the reload on a
 * file change (uvmutyww), the user-facing read failure (vxmzzunt), the repo
 * root omitted as a node (xrxmwrxz), each edge kind handed over in its render
 * direction (mnovnnot) — or the workspace this check builds itself. The
 * loading is imported for its entry points only: none of its constants is
 * asserted back. The checks run the loading against workspaces of their own
 * making, so they observe the artifact and never the workspace they live in.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { GraphDataError, loadNodeRecords } from "../../src/data/nodes";
import { labelForChange, loadJjLabels } from "../../src/data/jj";
import { watchNodeFiles } from "../../src/data/watch";

/** qpsnwxlu: the node documents are read from `nodes/*.json` in the root. */
const NODES = "nodes";

const workspaces: string[] = [];

function workspace(files: Record<string, string>): string {
	const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
	workspaces.push(root);
	mkdirSync(path.join(root, NODES));
	for (const [file, text] of Object.entries(files)) {
		writeFileSync(path.join(root, NODES, file), text);
	}
	return root;
}

/** A decision document: a decision must declare depends_on (schemas/node.json). */
function decision(dependsOn: string[]): string {
	return JSON.stringify({
		kind: "decision",
		depends_on: dependsOn,
		content: { type: "text", ref: "inline", content: "<content>", rationale: "<rationale>" },
	});
}

/** An evaluation document: an evaluation must declare evaluates (schemas/node.json). */
function evaluation(evaluates: string[], dependsOn: string[] = []): string {
	return JSON.stringify({
		kind: "evaluation",
		...(dependsOn.length > 0 ? { depends_on: dependsOn } : {}),
		evaluates,
		content: { type: "test", ref: ["tests/x.ts"], rationale: "<rationale>" },
	});
}

/** The failure the loading reports, or undefined when it succeeds. */
async function loadFailure(root: string): Promise<unknown> {
	return loadNodeRecords(root).then(
		() => undefined,
		(error: unknown) => error,
	);
}

async function until(predicate: () => boolean): Promise<void> {
	const deadline = Date.now() + 5_000;
	while (!predicate() && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
}

afterEach(() => {
	for (const root of workspaces.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

describe("the node documents are read from the workspace root (qpsnwxlu)", () => {
	test("every document under nodes/ comes back as a record", async () => {
		const root = workspace({
			"aaaaaaaa.json": decision(["cccccccc"]),
			"bbbbbbbb.json": evaluation(["aaaaaaaa"]),
		});

		const records = (await loadNodeRecords(root)).records;

		expect(records.map((record) => record.id).sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
		const record = records.find((candidate) => candidate.id === "aaaaaaaa");
		expect(record?.dependsOn).toEqual(["cccccccc"]);
		expect(record?.kind).toBe("decision");
		expect(record?.content.type).toBe("text");
	});

	test("a document which is not valid JSON is omitted and warned about, naming the file and the problem (krvyoumy)", async () => {
		const root = workspace({
			"aaaaaaaa.json": "{ not json",
			"bbbbbbbb.json": decision(["cccccccc"]),
		});

		const { records, warnings } = await loadNodeRecords(root);

		expect(records.map((record) => record.id)).toEqual(["bbbbbbbb"]);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatch(/nodes\/aaaaaaaa\.json/);
		expect(warnings[0]).toMatch(/invalid JSON/);
	});

	test("a file name which is not a node id is omitted and warned about, naming the file and the problem (krvyoumy)", async () => {
		const root = workspace({
			"NotAnId.json": decision(["bbbbbbbb"]),
			"bbbbbbbb.json": decision(["cccccccc"]),
		});

		const { records, warnings } = await loadNodeRecords(root);

		expect(records.map((record) => record.id)).toEqual(["bbbbbbbb"]);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatch(/nodes\/NotAnId\.json/);
		expect(warnings[0]).toMatch(/not a node id/);
	});

	test("a document which does not conform to schemas/node.json is omitted and warned about, naming the file and the problem (krvyoumy)", async () => {
		const root = workspace({
			"aaaaaaaa.json": JSON.stringify({ kind: "decision" }),
			"bbbbbbbb.json": decision(["cccccccc"]),
		});

		const { records, warnings } = await loadNodeRecords(root);

		expect(records.map((record) => record.id)).toEqual(["bbbbbbbb"]);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatch(/nodes\/aaaaaaaa\.json/);
		expect(warnings[0]).toMatch(/depends_on/);
	});

	test("the edge ownership of schemas/node.json is enforced on both kinds (krvyoumy)", async () => {
		const content = { type: "text", ref: "inline", content: "<content>", rationale: "<rationale>" };
		const root = workspace({
			// a decision must declare depends_on ...
			"aaaaaaaa.json": JSON.stringify({ kind: "decision", content }),
			// ... and must not declare evaluates ...
			"bbbbbbbb.json": JSON.stringify({
				kind: "decision",
				depends_on: ["cccccccc"],
				evaluates: ["cccccccc"],
				content,
			}),
			// ... and an evaluation must declare evaluates.
			"dddddddd.json": JSON.stringify({ kind: "evaluation", depends_on: ["cccccccc"], content }),
		});

		const { records, warnings } = await loadNodeRecords(root);

		expect(records).toEqual([]);
		expect(warnings).toHaveLength(3);
		const problem = (file: string): string | undefined =>
			warnings.find((warning) => warning.startsWith(`nodes/${file}.json`));
		expect(problem("aaaaaaaa")).toMatch(/depends_on/);
		expect(problem("bbbbbbbb")).toMatch(/evaluates/);
		expect(problem("dddddddd")).toMatch(/evaluates/);
	});

	test("an edge naming a node with no document is kept, not failed on (tqxvykwn)", async () => {
		const root = workspace({ "aaaaaaaa.json": decision(["cccccccc"]) });

		const records = (await loadNodeRecords(root)).records;

		expect(records[0]?.dependsOn).toEqual(["cccccccc"]);
	});

	test("the repo root is not a node: no record is handed over for it and its absence is not a warning (xrxmwrxz)", async () => {
		// tmmynypo: a decision with no prerequisite lists the root, so the root
		// is named by an edge while no document carries it.
		const root = workspace({
			"aaaaaaaa.json": decision(["zzzzzzzz"]),
			"bbbbbbbb.json": evaluation(["aaaaaaaa"], ["zzzzzzzz"]),
		});

		const { records, warnings } = await loadNodeRecords(root);

		// The root is bookkeeping, not a node: what is handed over holds no node
		// for it, and its having no document is not a malformed document.
		expect(records.map((record) => record.id)).toEqual(["aaaaaaaa", "bbbbbbbb"]);
		expect(warnings).toEqual([]);
	});

	test("the edge to the root is handed over on the declaring node, so the viewer can omit it from the rendered graph (xrxmwrxz)", async () => {
		const root = workspace({
			"aaaaaaaa.json": decision(["zzzzzzzz"]),
			"bbbbbbbb.json": evaluation(["aaaaaaaa"], ["zzzzzzzz"]),
		});

		const { records } = await loadNodeRecords(root);
		const declaring = (id: string) => records.find((record) => record.id === id);

		// The root is neither invented into a node nor quietly dropped with the
		// ids that depend on it: both kinds hand the edge over as declared, and
		// it is the root that is absent, not the edge.
		expect(declaring("aaaaaaaa")?.dependsOn).toEqual(["zzzzzzzz"]);
		expect(declaring("bbbbbbbb")?.dependsOn).toEqual(["zzzzzzzz"]);
	});

	test("a depends_on edge is handed over on the declaring child and names its prerequisite, never the other way round (mnovnnot)", async () => {
		const root = workspace({
			"aaaaaaaa.json": decision(["bbbbbbbb"]),
			"bbbbbbbb.json": decision(["cccccccc"]),
		});

		const { records } = await loadNodeRecords(root);
		const declaring = (id: string) => records.find((record) => record.id === id);

		// The arrow runs from the listed prerequisite to the declaring node, so
		// the declaring node is the child and carries the parent's id (bbbbbbbb
		// is a child of cccccccc and the parent of aaaaaaaa).
		expect(declaring("aaaaaaaa")?.dependsOn).toEqual(["bbbbbbbb"]);
		expect(declaring("bbbbbbbb")?.dependsOn).toEqual(["cccccccc"]);
		// The parent end names no child: the direction is not recoverable from
		// the prerequisite's own record.
		expect(declaring("bbbbbbbb")?.dependsOn).not.toContain("aaaaaaaa");
	});

	test("an evaluates edge is handed over on the declaring evaluator and names the evaluated node, never the other way round (mnovnnot)", async () => {
		const root = workspace({
			"aaaaaaaa.json": evaluation(["bbbbbbbb"], ["cccccccc"]),
			"bbbbbbbb.json": decision(["dddddddd"]),
		});

		const { records } = await loadNodeRecords(root);
		const declaring = (id: string) => records.find((record) => record.id === id);

		// The arrow runs from the declaring evaluator to the listed node, so the
		// evaluator carries the evaluated node's id while its own prerequisites
		// stay on the depends_on side of the same record.
		expect(declaring("aaaaaaaa")?.evaluates).toEqual(["bbbbbbbb"]);
		expect(declaring("aaaaaaaa")?.dependsOn).toEqual(["cccccccc"]);
		// The evaluated child names neither its evaluator nor the edge back.
		expect(declaring("bbbbbbbb")?.dependsOn).toEqual(["dddddddd"]);
	});

	test("a graph which closes a cycle fails (mmsmukkk)", async () => {
		const root = workspace({
			"aaaaaaaa.json": decision(["bbbbbbbb"]),
			"bbbbbbbb.json": decision(["aaaaaaaa"]),
		});

		const failure = await loadFailure(root);

		expect(failure).toBeInstanceOf(GraphDataError);
		expect((failure as Error).message).toMatch(/cycle/);
	});

	test("a nodes/ directory which cannot be read fails with a user-facing message (vxmzzunt)", async () => {
		const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
		workspaces.push(root);

		const failure = await loadFailure(root);

		expect(failure).toBeInstanceOf(GraphDataError);
		expect((failure as Error).message).toMatch(/nodes/);
	});
});

describe("the change descriptions come from the jj log (qpsnwxlu)", () => {
	test("the label of a node id is the change description jj reports for it", () => {
		const labels = new Map([
			["aaaaaaaa", "first"],
			["aaaaaaab", "second"],
			["bbbbbbbb", "third"],
		]);

		// qpsnwxlu: change descriptions from jj are the node labels.
		expect(labelForChange(labels, "aaaaaaaa")).toBe("first");
		expect(labelForChange(labels, "bbbbbbbb")).toBe("third");
		// The label must be found for the node id even where jj reports the
		// longer change id ...
		expect(labelForChange(labels, "bbbb")).toBe("third");
		expect(labelForChange(labels, "cccccccc")).toBeUndefined();
		// ... and two changes sharing the prefix leave no single label to answer.
		expect(labelForChange(labels, "aaaa")).toBeUndefined();
	});

	test("a jj log which cannot be read fails with a user-facing message (vxmzzunt)", async () => {
		const root = mkdtempSync(path.join(tmpdir(), "deccy-data-"));
		workspaces.push(root);

		const failure = await loadJjLabels(root).then(
			() => undefined,
			(error: unknown) => error,
		);

		expect(failure).toBeInstanceOf(GraphDataError);
		expect((failure as Error).message).toMatch(/jj/);
	});
});

describe("the node documents are watched (uvmutyww)", () => {
	test("a document created, modified or deleted is reported with its node id", async () => {
		const root = workspace({ "aaaaaaaa.json": decision(["bbbbbbbb"]) });
		const seen: string[] = [];

		const watcher = watchNodeFiles(
			root,
			(changes) => seen.push(...changes.map((change) => `${change.type} ${change.id}`)),
			{ debounceMs: 10 },
		);
		try {
			// uvmutyww: creating a file under nodes/ reloads the graph ...
			writeFileSync(path.join(root, NODES, "dddddddd.json"), decision(["bbbbbbbb"]));
			await until(() => seen.includes("created dddddddd"));
			// ... so does modifying one ...
			writeFileSync(path.join(root, NODES, "dddddddd.json"), decision(["aaaaaaaa"]));
			await until(() => seen.includes("modified dddddddd"));
			// ... and so does deleting one.
			rmSync(path.join(root, NODES, "dddddddd.json"));
			await until(() => seen.includes("deleted dddddddd"));
		} finally {
			watcher.dispose();
		}

		expect(seen).toContain("created dddddddd");
		expect(seen).toContain("modified dddddddd");
		expect(seen).toContain("deleted dddddddd");
	});
});
