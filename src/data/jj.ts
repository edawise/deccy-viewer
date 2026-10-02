/**
 * Node labels from the jj repository log (qpsnwxlu, svssunnl).
 *
 * A node maps 1:1 to a jj change (mmsmukkk) and the change description is the
 * node's label. Ids come out of jj in the same `change_id.shortest(8)` form the
 * node file names use, so they join against {@link NodeRecord.id} directly.
 *
 * Every failure is reported as a {@link GraphDataError} whose message is meant
 * to be shown to the user as-is (vxmzzunt).
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

import { GraphDataError } from "./nodes";

/**
 * One change per line: the change id, a tab, and the label. A label is the
 * first line of the change description, so it never contains a newline and the
 * output stays line-oriented. Tab-separated rather than space-separated so
 * labels may contain spaces; the label itself is everything after the first tab.
 */
const LABEL_TEMPLATE = 'change_id.shortest(8) ++ "\\t" ++ description.first_line() ++ "\\n"';

/** How long to wait for jj before giving up and reporting a load error. */
const JJ_TIMEOUT_MS = 30_000;

/**
 * Read the change descriptions from the jj repo at `workspaceRoot` and return
 * them keyed by change id. Changes without a description map to "".
 *
 * Throws a {@link GraphDataError} when jj cannot be run or the log cannot be
 * read.
 */
export async function loadJjLabels(workspaceRoot: string): Promise<Map<string, string>> {
	const output = await runJj(workspaceRoot, [
		"log",
		"--no-graph",
		"-r",
		"ancestors(@)",
		"--color",
		"never",
		"--template",
		LABEL_TEMPLATE,
	]);

	const labels = new Map<string, string>();
	for (const line of output.split("\n")) {
		if (line === "") {
			continue;
		}
		const separator = line.indexOf("\t");
		const changeId = separator === -1 ? line : line.slice(0, separator);
		const label = separator === -1 ? "" : line.slice(separator + 1);
		labels.set(changeId, label);
	}
	return labels;
}

/**
 * Look up the label of a single change.
 *
 * Node ids are `change_id.shortest(8)` prefixes frozen in a file name, and jj
 * may lengthen that prefix later when a collision appears, so fall back to a
 * unique prefix match when there is no exact hit.
 */
export function labelForChange(labels: ReadonlyMap<string, string>, changeId: string): string | undefined {
	const exact = labels.get(changeId);
	if (exact !== undefined) {
		return exact;
	}
	let match: string | undefined;
	for (const [id, label] of labels) {
		if (id.startsWith(changeId)) {
			if (match !== undefined) {
				return undefined;
			}
			match = label;
		}
	}
	return match;
}

function runJj(cwd: string, args: readonly string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			"jj",
			args,
			{ cwd, encoding: "utf8", timeout: JJ_TIMEOUT_MS },
			(error, stdout, stderr) => {
				if (error === null) {
					resolve(stdout);
					return;
				}
				const detail = stderr.trim() || error.message;
				if ("code" in error && error.code === "ENOENT") {
					reject(
						new GraphDataError(
							existsSync(cwd)
								? "cannot read the jj log: jj is not on PATH"
								: `cannot read the jj log: workspace root ${cwd} does not exist`,
						),
					);
					return;
				}
				reject(new GraphDataError(`cannot read the jj log: ${detail}`));
			},
		);
	});
}
