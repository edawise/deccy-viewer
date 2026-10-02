/**
 * Validated deccy node records read from `nodes/*.json` in the workspace
 * root (qpsnwxlu).
 *
 * A node maps 1:1 to a jj change (mmsmukkk): the node id is the change id and
 * lives in the file name (`nodes/<id>.json`), never in the document
 * (schemas/node.json). Documents are validated against schemas/node.json
 * (ulpvslov) and the edge rules (zkvxornu, mkyoyqvt, lnqowznu), and the result
 * is checked to be a directed acyclic graph (mmsmukkk) before it is handed
 * downstream.
 *
 * Every failure is reported as a {@link GraphDataError} whose message is meant
 * to be shown to the user as-is (vxmzzunt).
 */

import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import * as path from "node:path";

/** Directory holding the node documents, relative to the workspace root. */
export const NODES_DIR = "nodes";

/** Glob matching every node document (qpsnwxlu). */
export const NODES_GLOB = "nodes/*.json";

/** A node id is a jj change id: at least eight lowercase alphanumerics. */
export const NODE_ID_PATTERN = /^[0-9a-z]{8,}$/;

/**
 * Id of the repo root: the pseudo-node every decision with no dependencies
 * lists as its dependency (tmmynypo). It has no node document, and the viewer
 * omits it and the edges to it from the rendered graph (xrxmwrxz).
 */
export const ROOT_NODE_ID = "zzzzzzzz";

/** The two node kinds (zkvxornu). */
export type NodeKind = "decision" | "evaluation";

/**
 * The node's content (schemas/node.json). Unknown keys are allowed by the
 * schema so new content types can be added, and are preserved here.
 */
export interface NodeContent {
	/** Content type, e.g. "text", "json-schema", "ears", "implementation". */
	type: string;
	/** "inline" when the content is embedded, otherwise repo-relative paths. */
	ref: "inline" | readonly string[];
	/** Why this node exists. */
	rationale: string;
	/** Inline content, present only when ref is "inline". */
	content?: string;
	[key: string]: unknown;
}

/** A validated node document plus the id its file name encodes. */
export interface NodeRecord {
	/** The jj change id this node maps to (mmsmukkk). */
	id: string;
	kind: NodeKind;
	/** Ids of the nodes this node depends on (its prerequisites). */
	dependsOn: readonly string[];
	/** Ids of the nodes this node evaluates. */
	evaluates: readonly string[];
	content: NodeContent;
}

/**
 * A failure to read or validate the graph data. The message is user-facing: the
 * viewer shows it inline and keeps the last successfully rendered graph
 * (vxmzzunt).
 */
export class GraphDataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GraphDataError";
	}
}

/**
 * Validate a single node document against schemas/node.json and return it as a
 * node record. `id` is the file's base name and must itself be a valid node id.
 *
 * Throws a {@link GraphDataError} listing every violation in the document.
 */
export function parseNodeDocument(id: string, document: unknown): NodeRecord {
	const where = `${NODES_DIR}/${id}.json`;
	const problems: string[] = [];

	if (!NODE_ID_PATTERN.test(id)) {
		problems.push(`"${id}" is not a node id (expected at least eight lowercase alphanumerics)`);
	}
	if (!isPlainObject(document)) {
		throw new GraphDataError(`${where}: node document must be a JSON object`);
	}

	const allowedKeys = ["kind", "depends_on", "evaluates", "content"];
	for (const key of Object.keys(document)) {
		if (!allowedKeys.includes(key)) {
			problems.push(`unexpected key "${key}"`);
		}
	}

	const kind = document.kind;
	if (kind !== "decision" && kind !== "evaluation") {
		problems.push(`"kind" must be "decision" or "evaluation"`);
	}

	const dependsOn = checkEdges("depends_on", document.depends_on, problems);
	const evaluates = checkEdges("evaluates", document.evaluates, problems);

	// Edge ownership (lnqowznu), mirroring the conditionals in schemas/node.json:
	// decisions must carry depends_on and never evaluates; evaluations must
	// carry evaluates and may additionally carry depends_on (eval sandwich).
	if (kind === "decision") {
		if (dependsOn === undefined) {
			problems.push(`a decision must declare "depends_on"`);
		}
		if (evaluates !== undefined) {
			problems.push(`a decision must not declare "evaluates"`);
		}
	} else if (kind === "evaluation") {
		if (evaluates === undefined) {
			problems.push(`an evaluation must declare "evaluates"`);
		}
	}

	const content = parseContent(document.content, problems);

	if (problems.length > 0) {
		throw new GraphDataError(`${where}: ${problems.join("; ")}`);
	}

	return {
		id,
		kind: kind as NodeKind,
		dependsOn: dependsOn ?? [],
		evaluates: evaluates ?? [],
		content,
	};
}

/**
 * Check the set of node records as a whole: ids must be unique and the edges
 * must not form a cycle, because deccy is a directed acyclic graph
 * (mmsmukkk). Throws a {@link GraphDataError} listing every violation.
 *
 * Edges are *not* required to target an existing node: an edge to the repo root
 * {@link ROOT_NODE_ID} or to a missing id is kept as-is so the viewer can
 * render it as an unresolved edge (tmmynypo, tqxvykwn).
 */
export function validateNodeGraph(records: readonly NodeRecord[]): void {
	const problems: string[] = [];
	const byId = new Set<string>();

	for (const record of records) {
		if (byId.has(record.id)) {
			problems.push(`duplicate node id "${record.id}"`);
		}
		byId.add(record.id);
	}

	problems.push(...findCycleProblems(records));

	if (problems.length > 0) {
		throw new GraphDataError(problems.join("; "));
	}
}

/**
 * Read every node document under `nodes/` in the workspace root and return the
 * validated records, ordered by file name (qpsnwxlu).
 *
 * Throws a {@link GraphDataError} when the directory cannot be read, when any
 * document is invalid, or when the records do not form a directed acyclic
 * graph.
 */
export async function loadNodeRecords(workspaceRoot: string): Promise<NodeRecord[]> {
	const directory = path.join(workspaceRoot, NODES_DIR);

	let entries: Dirent[];
	try {
		entries = await fs.readdir(directory, { withFileTypes: true });
	} catch (error) {
		throw new GraphDataError(`cannot read ${NODES_DIR}/: ${errorMessage(error)}`);
	}

	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
		.map((entry) => entry.name)
		.sort();

	const results = await Promise.all(files.map((file) => readNodeFile(directory, file)));

	const records: NodeRecord[] = [];
	const problems: string[] = [];
	for (const result of results) {
		if ("record" in result) {
			records.push(result.record);
		} else {
			problems.push(result.problem);
		}
	}
	if (problems.length > 0) {
		throw new GraphDataError(problems.join("; "));
	}

	validateNodeGraph(records);
	return records;
}

type FileResult = { record: NodeRecord } | { problem: string };

async function readNodeFile(directory: string, file: string): Promise<FileResult> {
	const id = file.slice(0, -".json".length);
	try {
		const text = await fs.readFile(path.join(directory, file), "utf8");
		let document: unknown;
		try {
			document = JSON.parse(text);
		} catch (error) {
			throw new GraphDataError(`${NODES_DIR}/${file}: invalid JSON (${errorMessage(error)})`);
		}
		return { record: parseNodeDocument(id, document) };
	} catch (error) {
		return {
			problem:
				error instanceof GraphDataError
					? error.message
					: `${NODES_DIR}/${file}: cannot read (${errorMessage(error)})`,
		};
	}
}

function parseContent(value: unknown, problems: string[]): NodeContent {
	if (!isPlainObject(value)) {
		problems.push(`"content" must be an object`);
		return { type: "", ref: "inline", rationale: "" };
	}

	const { type, ref, rationale, content } = value;

	if (typeof type !== "string" || type.length === 0) {
		problems.push(`content "type" must be a non-empty string`);
	}
	if (typeof rationale !== "string" || rationale.length === 0) {
		problems.push(`content "rationale" must be a non-empty string`);
	}

	const refIsPaths = Array.isArray(ref) && ref.length > 0 && ref.every((p) => typeof p === "string" && p.length > 0) && new Set(ref).size === ref.length;
	const refIsInline = ref === "inline";
	if (!refIsInline && !refIsPaths) {
		problems.push(`content "ref" must be "inline" or a non-empty list of distinct paths`);
	}

	if (refIsInline) {
		if (content === undefined) {
			problems.push(`content "content" is required when "ref" is "inline"`);
		} else if (typeof content !== "string") {
			problems.push(`content "content" must be a string`);
		}
	} else if (content !== undefined) {
		problems.push(`content "content" is only allowed when "ref" is "inline"`);
	}

	return value as unknown as NodeContent;
}

function checkEdges(key: string, value: unknown, problems: string[]): string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	const items = Array.isArray(value) ? value : [];
	if (!Array.isArray(value)) {
		problems.push(`"${key}" must be an array`);
		return [];
	}
	if (items.length === 0) {
		problems.push(`"${key}" must list at least one node id`);
	}
	for (const item of items) {
		if (typeof item !== "string" || !NODE_ID_PATTERN.test(item)) {
			problems.push(`"${key}" entries must be node ids, got ${JSON.stringify(item)}`);
		}
	}
	if (new Set(items).size !== items.length) {
		problems.push(`"${key}" must not repeat node ids`);
	}
	return items as string[];
}

/** Report the directed cycles that run through the existing nodes (mmsmukkk).
 *
 * Edges follow the render direction (mnovnnot): a depends_on edge runs from
 * the listed prerequisite to the declaring node, an evaluates edge runs from
 * the declaring evaluator to the listed node.
 */
function findCycleProblems(records: readonly NodeRecord[]): string[] {
	const outgoing = new Map<string, string[]>();
	for (const record of records) {
		outgoing.set(record.id, [...record.evaluates]);
	}
	for (const record of records) {
		for (const prerequisite of record.dependsOn) {
			// Missing ids and the repo root have no node document, so there is
			// no node to traverse from (tmmynypo, tqxvykwn, xrxmwrxz).
			if (outgoing.has(prerequisite)) {
				outgoing.get(prerequisite)!.push(record.id);
			}
		}
	}

	const problems: string[] = [];
	const state = new Map<string, "visiting" | "done">();
	const stack: string[] = [];

	const visit = (id: string): void => {
		const seen = state.get(id);
		if (seen === "done") {
			return;
		}
		if (seen === "visiting") {
			const cycle = [...stack.slice(stack.indexOf(id)), id];
			problems.push(`cycle: ${cycle.join(" -> ")}`);
			return;
		}
		state.set(id, "visiting");
		stack.push(id);
		for (const target of outgoing.get(id) ?? []) {
			if (outgoing.has(target)) {
				visit(target);
			}
		}
		stack.pop();
		state.set(id, "done");
	};

	for (const record of records) {
		visit(record.id);
	}
	return problems;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
