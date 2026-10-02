/**
 * The deterministic graph order of the deccy graph (ruqsmuxz) and the
 * layered arrangement it is read from (zqwxlzxm).
 *
 * The graph order is the order keyboard focus walks in: by topological depth
 * from the roots, then the initial left-to-right position, then the node id
 * (ruqsmuxz). The arrangement is layered-topological (zqwxlzxm): the layer of a
 * node is its topological depth from the roots and the nodes of a layer are
 * arranged left-to-right, each one next to the nodes it is attached to above,
 * with the node id breaking ties.
 *
 * Both are derived from the model (model.ts) alone and never from rendered
 * positions, so moving a node while dragging cannot change the order
 * (spllzqlw, ruqsmuxz). layout.ts turns the layer and the left-to-right
 * position of every node into coordinates (zqwxlzxm).
 */

import type { GraphModel } from "./model";

/** The graph order and the ranks it is derived from. */
export interface GraphOrder {
	/** Every node id of the model, in graph order (ruqsmuxz). */
	ids: readonly string[];
	/**
	 * The topological depth of each node: its layer in the layered arrangement
	 * (zqwxlzxm). Depth counts along the longest path from the roots, so every
	 * edge leaves its layer for a strictly deeper one and the layers read as
	 * ranks.
	 */
	depth: ReadonlyMap<string, number>;
	/**
	 * The initial left-to-right position of each node inside its layer, numbered
	 * from the left (ruqsmuxz). This is the position layout.ts multiplies into
	 * an x coordinate, and dragging a node leaves it alone (spllzqlw).
	 */
	column: ReadonlyMap<string, number>;
}

/**
 * Order the nodes of the graph deterministically (ruqsmuxz): by topological
 * depth from the roots, then by the initial left-to-right position, then by
 * node id. The id key keeps the order total even where the ranks agree.
 */
export function graphOrder(model: GraphModel): GraphOrder {
	// Only an edge that connects two nodes of the graph carries depth: the
	// dangling end of an unresolved edge names a node that is not in the graph
	// and cannot be placed (tqxvykwn).
	const parents = new Map<string, Set<string>>();
	const children = new Map<string, Set<string>>();
	for (const node of model.nodes) {
		parents.set(node.id, new Set());
		children.set(node.id, new Set());
	}
	for (const edge of model.edges) {
		if (edge.danglingEnd !== undefined) {
			continue;
		}
		children.get(edge.from)?.add(edge.to);
		parents.get(edge.to)?.add(edge.from);
	}

	const depth = depthFromRoots(model, parents, children);
	const column = leftToRightPositions(model, depth, parents);

	const ids = model.nodes.map((node) => node.id);
	ids.sort((a, b) => {
		const depthA = depth.get(a) ?? 0;
		const depthB = depth.get(b) ?? 0;
		if (depthA !== depthB) {
			return depthA - depthB;
		}
		const columnA = column.get(a) ?? 0;
		const columnB = column.get(b) ?? 0;
		if (columnA !== columnB) {
			return columnA - columnB;
		}
		return compareIds(a, b);
	});

	return { ids, depth, column };
}

/**
 * The depth of every node: its longest distance from a root (zqwxlzxm).
 *
 * The roots start at depth 0 (model.ts) and a node sits one layer below the
 * deepest node it depends on or evaluates. The graph is acyclic (mmsmukkk), so
 * every node is reached.
 */
function depthFromRoots(
	model: GraphModel,
	parents: ReadonlyMap<string, Set<string>>,
	children: ReadonlyMap<string, Set<string>>,
): Map<string, number> {
	const depth = new Map<string, number>();
	const waitingOn = new Map<string, number>();
	const ready: string[] = [];

	for (const node of model.nodes) {
		const count = parents.get(node.id)?.size ?? 0;
		depth.set(node.id, 0);
		waitingOn.set(node.id, count);
		if (count === 0) {
			ready.push(node.id);
		}
	}

	for (let i = 0; i < ready.length; i++) {
		const id = ready[i];
		const next = (depth.get(id) ?? 0) + 1;
		for (const child of children.get(id) ?? []) {
			if (next > (depth.get(child) ?? 0)) {
				depth.set(child, next);
			}
			const left = (waitingOn.get(child) ?? 0) - 1;
			waitingOn.set(child, left);
			if (left === 0) {
				ready.push(child);
			}
		}
	}

	return depth;
}

/**
 * The initial left-to-right position of every node inside its layer
 * (ruqsmuxz): the nodes of a layer are arranged left-to-right (zqwxlzxm), each
 * one as close as it can be to the nodes above it that it is attached to, with
 * ties broken by node id so the arrangement is deterministic.
 */
function leftToRightPositions(
	model: GraphModel,
	depth: ReadonlyMap<string, number>,
	parents: ReadonlyMap<string, Set<string>>,
): Map<string, number> {
	const layers = new Map<number, string[]>();
	for (const node of model.nodes) {
		const layer = depth.get(node.id) ?? 0;
		const ids = layers.get(layer) ?? [];
		ids.push(node.id);
		layers.set(layer, ids);
	}

	const column = new Map<string, number>();
	const layerNumbers = [...layers.keys()].sort((a, b) => a - b);
	for (const layer of layerNumbers) {
		const ids = layers.get(layer) ?? [];
		const key = new Map<string, number>();
		for (const id of ids) {
			key.set(id, attachment(id, column, parents));
		}
		ids.sort((a, b) => {
			// A node without attached nodes above it (a root, model.ts) sorts by
			// id alone, so no subtraction of equal keys can lose the tie-break.
			const keyA = key.get(a) ?? Number.POSITIVE_INFINITY;
			const keyB = key.get(b) ?? Number.POSITIVE_INFINITY;
			if (keyA !== keyB) {
				return keyA < keyB ? -1 : 1;
			}
			return compareIds(a, b);
		});
		ids.forEach((id, index) => column.set(id, index));
	}

	return column;
}

/**
 * The mean left-to-right position of the nodes a node is attached to above it,
 * or Infinity when there are none: such nodes are arranged by id alone.
 */
function attachment(
	id: string,
	column: ReadonlyMap<string, number>,
	parents: ReadonlyMap<string, Set<string>>,
): number {
	const attached = parents.get(id);
	if (attached === undefined || attached.size === 0) {
		return Number.POSITIVE_INFINITY;
	}
	let sum = 0;
	for (const parent of attached) {
		sum += column.get(parent) ?? 0;
	}
	return sum / attached.size;
}

/** Node ids are lowercase alphanumerics, so lexicographic order is stable. */
function compareIds(a: string, b: string): number {
	if (a === b) {
		return 0;
	}
	return a < b ? -1 : 1;
}
