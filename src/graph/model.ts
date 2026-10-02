/**
 * The deccy graph assembled from the validated node records (qpsnwxlu):
 * the nodes, their typed edges, and the roots the graph hangs from.
 *
 * The graph is a directed acyclic graph (mmsmukkk) over the two node kinds
 * (zkvxornu) and the two edge kinds (mkyoyqvt). Every edge runs from parent to
 * child (mnovnnot): a depends_on edge runs from the listed prerequisite to the
 * declaring node, an evaluates edge runs from the declaring evaluator to the
 * listed node.
 *
 * Neither kind of bookkeeping end may leak downstream. The repo root
 * {@link ROOT_NODE_ID} marks a decision with no prerequisites (tmmynypo): it is
 * not a node of the graph, and the edges to it are dropped here so they are
 * never rendered and never reported as a broken link (xrxmwrxz). Any other edge
 * end that names a node id without a node document is kept as an unresolved
 * edge whose {@link GraphEdge.danglingEnd} marks the missing end, so the viewer
 * can render the edge and mark it visibly (tqxvykwn).
 *
 * Everything downstream works on this model: order.ts reads it into the
 * deterministic graph order (ruqsmuxz) and layout.ts turns that order into
 * geometry (zqwxlzxm).
 *
 * The model also carries the adjacency indexes the graph layer serves geometry
 * from (msvoysvz): one entry per node id listing the edges incident to it, in
 * edge order. The index is built once, when the graph revision is built, and
 * read by {@link neighbourhood} and {@link incidentEdges}, so a lookup never
 * scans the edge set.
 */

import { ROOT_NODE_ID } from "../data/nodes";
import type { NodeContent, NodeKind, NodeRecord } from "../data/nodes";

/** The two edge kinds (mkyoyqvt). */
export type EdgeKind = "depends_on" | "evaluates";

/** A node of the rendered graph: one jj change (mmsmukkk). */
export interface GraphNode {
	id: string;
	kind: NodeKind;
	/** The node's content, rationale included (schemas/node.json, ulpvslov). */
	content: NodeContent;
}

/** One edge of the graph, directed from parent to child (mnovnnot). */
export interface GraphEdge {
	kind: EdgeKind;
	/** Parent end: the listed prerequisite (depends_on) or the evaluator (evaluates). */
	from: string;
	/** Child end: the declaring node (depends_on) or the listed node (evaluates). */
	to: string;
	/**
	 * The end that names a node id with no node in the graph, or undefined when
	 * both ends name nodes of the graph. An edge with a dangling end is an
	 * unresolved edge: it is rendered and marked visibly (tqxvykwn), and it
	 * attaches only one box, so it never contributes depth (order.ts).
	 */
	danglingEnd: "from" | "to" | undefined;
}

/** The assembled graph. */
export interface GraphModel {
	/** The nodes, in the order of the records they were built from. */
	nodes: readonly GraphNode[];
	/**
	 * The edges, in declaration order (record by record, then the ids that
	 * record lists). Edges to the repo root are already dropped (xrxmwrxz) and
	 * edges to a missing node id are kept as unresolved edges (tqxvykwn).
	 */
	edges: readonly GraphEdge[];
	/**
	 * The nodes with no incoming edge from another node of the graph: the roots
	 * the graph hangs from (tmmynypo). These are the decisions whose only
	 * prerequisite is the repo root (tmmynypo, xrxmwrxz), the evaluations whose
	 * edges all run outward (mkyoyqvt, mnovnnot), and the nodes whose declared
	 * prerequisites are all missing (tqxvykwn).
	 */
	roots: readonly string[];
}

/**
 * The incidence index of one graph revision (msvoysvz): node id to the edges
 * incident to it, in the model's edge order.
 */
type IncidentIndex = ReadonlyMap<string, readonly GraphEdge[]>;

/**
 * The incidence index of each assembled model. The model is the graph revision
 * in hand (msvoysvz), so keying by the model keeps every revision's index valid
 * and free of any state that a later revision could overwrite.
 */
const incidentIndexes = new WeakMap<GraphModel, IncidentIndex>();

/**
 * Assemble the graph from the validated node records (qpsnwxlu).
 *
 * The records are the output of `parseNodeDocument` and `validateNodeGraph`
 * (src/data/nodes.ts), so ids are unique and no edge closes a cycle (mmsmukkk).
 */
export function buildGraph(records: readonly NodeRecord[]): GraphModel {
	const nodes: GraphNode[] = [];
	const known = new Set<string>();
	for (const record of records) {
		nodes.push({ id: record.id, kind: record.kind, content: record.content });
		known.add(record.id);
	}

	const edges: GraphEdge[] = [];
	const add = (kind: EdgeKind, from: string, to: string): void => {
		// The repo root marks a node with no prerequisites (tmmynypo) and is
		// dropped with its edges instead of being rendered or flagged as a
		// broken link (xrxmwrxz).
		if (from === ROOT_NODE_ID || to === ROOT_NODE_ID) {
			return;
		}
		let danglingEnd: GraphEdge["danglingEnd"];
		if (!known.has(from)) {
			danglingEnd = "from";
		} else if (!known.has(to)) {
			danglingEnd = "to";
		}
		edges.push({ kind, from, to, danglingEnd });
	};

	for (const record of records) {
		// A depends_on edge runs from the listed prerequisite to the declaring
		// node (mnovnnot).
		for (const prerequisite of record.dependsOn) {
			add("depends_on", prerequisite, record.id);
		}
		// An evaluates edge runs from the declaring evaluator to the listed node
		// (mnovnnot).
		for (const evaluated of record.evaluates) {
			add("evaluates", record.id, evaluated);
		}
	}

	const hasParent = new Set<string>();
	for (const edge of edges) {
		if (edge.danglingEnd === undefined) {
			hasParent.add(edge.to);
		}
	}
	const roots = nodes.filter((node) => !hasParent.has(node.id)).map((node) => node.id);

	const model: GraphModel = { nodes, edges, roots };
	// The incidence index belongs to this graph revision (msvoysvz): a later
	// revision is a different model object with its own index, so an earlier
	// model keeps answering from the edges it was built with.
	incidentIndexes.set(model, indexIncidentEdges(edges));
	return model;
}

/**
 * The edges incident to each id, in the model's edge order (msvoysvz).
 *
 * The map is keyed by every end an edge names, not only by the ids that have a
 * node document, so a lookup for a dangling end answers exactly as a scan of
 * the edge set would.
 */
function indexIncidentEdges(edges: readonly GraphEdge[]): IncidentIndex {
	const index = new Map<string, GraphEdge[]>();
	const add = (id: string, edge: GraphEdge): void => {
		const list = index.get(id);
		if (list === undefined) {
			index.set(id, [edge]);
		} else {
			list.push(edge);
		}
	};
	for (const edge of edges) {
		add(edge.from, edge);
		if (edge.to !== edge.from) {
			add(edge.to, edge);
		}
	}
	return index;
}

/**
 * The incidence index held for `model` (msvoysvz). A model assembled by
 * {@link buildGraph} carries its index; anything else falls back to scanning,
 * so the lookup stays total without the index being derivable from the shape.
 */
function indexOf(model: GraphModel): IncidentIndex {
	return incidentIndexes.get(model) ?? indexIncidentEdges(model.edges);
}

/**
 * The edges incident to `id` — those that leave it or enter it — in the model's
 * edge order (msvoysvz). The answer comes from the index built with the graph
 * revision in hand, so it costs no scan of the edge set.
 */
export function incidentEdges(model: GraphModel, id: string): readonly GraphEdge[] {
	return indexOf(model).get(id) ?? [];
}

/** The elements associated with a node: its incident edges and its neighbours. */
export interface Neighbourhood {
	/** The edges that leave or enter the node, in edge order. */
	edges: readonly GraphEdge[];
	/** The node ids at the other end of those edges. The node itself is not listed. */
	nodes: readonly string[];
}

/**
 * The edges and nodes associated with `id`: the context the viewer highlights
 * when the pointer is over a node (kwovtsuv).
 *
 * The incident edges come from the model's incidence index (msvoysvz), so the
 * lookup reads the revision in hand instead of scanning the edge set. An
 * unresolved edge contributes no neighbour, because its dangling end names a
 * node that is not in the graph (tqxvykwn); the edge itself is still listed, so
 * the highlighted context stays complete.
 */
export function neighbourhood(model: GraphModel, id: string): Neighbourhood {
	const edges = incidentEdges(model, id);
	const nodes: string[] = [];
	const seen = new Set<string>();

	const add = (other: string): void => {
		if (other !== id && !seen.has(other)) {
			seen.add(other);
			nodes.push(other);
		}
	};

	for (const edge of edges) {
		if (edge.from === id) {
			if (edge.danglingEnd !== "to") {
				add(edge.to);
			}
		} else if (edge.danglingEnd !== "from") {
			add(edge.from);
		}
	}

	return { edges, nodes };
}
