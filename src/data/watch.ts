/**
 * Watches the node documents under `nodes/` and reports which ones were
 * created, modified or deleted, so the viewer can reload the graph (uvmutyww).
 *
 * Node documents are the graph data (qpsnwxlu): a reload also refreshes the
 * jj labels (jj.ts), so one batch of changes here is one reload downstream.
 * Failures surface as {@link GraphDataError} or through `onError`, both meant
 * to be shown to the user inline while the last rendered graph is kept
 * (vxmzzunt).
 */

import { readdirSync, watch } from "node:fs";
import type { Dirent, FSWatcher } from "node:fs";
import { promises as fsp } from "node:fs";
import * as path from "node:path";

import { GraphDataError, NODES_DIR } from "./nodes";

/** A single change to a node document. */
export interface NodeFileChange {
	/**
	 * The node id (the file name without its `.json` extension), or null when the
	 * platform did not report which file changed; the whole set of node documents
	 * must then be treated as possibly changed.
	 */
	id: string | null;
	type: "created" | "modified" | "deleted";
}

export interface NodeFileWatcher {
	/** Stop watching. Safe to call more than once. */
	dispose(): void;
}

export interface WatchOptions {
	/** Window over which change events are coalesced. Defaults to 50 ms. */
	debounceMs?: number;
	/** Called when watching itself fails after it has started. */
	onError?: (error: Error) => void;
}

/**
 * Watch `nodes/*.json` under `workspaceRoot` and call `onChange` with the
 * changes once the directory has settled for `debounceMs`.
 *
 * Throws a {@link GraphDataError} when the directory cannot be watched at all.
 */
export function watchNodeFiles(
	workspaceRoot: string,
	onChange: (changes: readonly NodeFileChange[]) => void,
	options: WatchOptions = {},
): NodeFileWatcher {
	const { debounceMs = 50, onError } = options;
	const directory = path.join(workspaceRoot, NODES_DIR);

	let known = listNodeFiles(directory);
	let disposed = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let batch = new Set<string>(); // node ids named by the events in this batch
	let unattributed = false;

	const fail = (error: Error): void => {
		if (!disposed && onError !== undefined) {
			onError(error);
		}
	};

	let watcher: FSWatcher;
	try {
		// The event type is not used: which node changed is decided by diffing
		// the directory listing in flush(), which is more reliable across platforms.
		watcher = watch(directory, { persistent: true }, (_eventType, filename) => {
			if (disposed) {
				return;
			}
			const name = typeof filename === "string" ? filename : null;
			if (name === null) {
				unattributed = true;
			} else if (name.endsWith(".json")) {
				batch.add(name.slice(0, -".json".length));
			}
			if (timer !== undefined) {
				clearTimeout(timer);
			}
			timer = setTimeout(flush, debounceMs);
		});
	} catch (error) {
		throw new GraphDataError(`cannot watch ${NODES_DIR}/: ${errorMessage(error)}`);
	}

	watcher.on("error", (error) => {
		fail(new GraphDataError(`cannot watch ${NODES_DIR}/: ${errorMessage(error)}`));
	});

	async function flush(): Promise<void> {
		timer = undefined;
		const events = batch;
		const hadUnattributed = unattributed;
		batch = new Set();
		unattributed = false;

		let current: Set<string>;
		try {
			current = await listNodeFilesAsync(directory);
		} catch (error) {
			fail(new GraphDataError(`cannot read ${NODES_DIR}/: ${errorMessage(error)}`));
			return;
		}

		const changes: NodeFileChange[] = [];
		const reported = new Set<string>();
		const report = (id: string, type: NodeFileChange["type"]): void => {
			reported.add(id);
			changes.push({ id, type });
		};

		for (const name of events) {
			if (current.has(name) && !known.has(name)) {
				report(name, "created");
			} else if (current.has(name)) {
				report(name, "modified");
			} else if (known.has(name)) {
				report(name, "deleted");
			}
		}
		// The platform does not always name the file, so close the gap by diffing
		// the directory: anything that appeared or vanished is a create or delete.
		for (const name of current) {
			if (!known.has(name) && !reported.has(name)) {
				report(name, "created");
			}
		}
		for (const name of known) {
			if (!current.has(name) && !reported.has(name)) {
				report(name, "deleted");
			}
		}
		if (changes.length === 0 && hadUnattributed) {
			changes.push({ id: null, type: "modified" });
		}

		known = current;
		if (changes.length > 0 && !disposed) {
			onChange(changes);
		}
	}

	return {
		dispose(): void {
			if (disposed) {
				return;
			}
			disposed = true;
			if (timer !== undefined) {
				clearTimeout(timer);
				timer = undefined;
			}
			watcher.close();
		},
	};
}

function listNodeFiles(directory: string): Set<string> {
	// Synchronous on purpose: the watcher must observe every change from the
	// moment it is returned, so the baseline cannot wait on a promise.
	try {
		return nodeIds(readdirSync(directory, { withFileTypes: true }));
	} catch (error) {
		throw new GraphDataError(`cannot read ${NODES_DIR}/: ${errorMessage(error)}`);
	}
}

async function listNodeFilesAsync(directory: string): Promise<Set<string>> {
	return nodeIds(await fsp.readdir(directory, { withFileTypes: true }));
}

/** The node ids of the node documents among a directory listing. */
function nodeIds(entries: readonly Dirent[]): Set<string> {
	return new Set(
		entries
			.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
			.map((entry) => entry.name.slice(0, -".json".length)),
	);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
