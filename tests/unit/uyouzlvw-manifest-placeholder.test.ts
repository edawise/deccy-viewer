/**
 * Gate check: the extension manifest (srlrwowp) commits the fixed placeholder
 * as its `version`, taking the release version (sppkuruw) as given.
 *
 * sppkuruw records that a release's version is one value given at release time —
 * an explicit argument to the release — and never committed. The manifest is the
 * installable document the host reads, so it cannot go without a `version` at
 * all; what this edge adds is the value that field holds while no release is in
 * hand: the fixed placeholder. The check runs in both directions, because a
 * manifest can honour that rule by the wrong means as easily as by breaking it:
 *
 * - no looser: the committed value is the placeholder and nothing else. A value
 *   that is a release number, or a dated, channelled or build-stamped value, is a
 *   release version committed, which is what the standard forbids. Which value
 *   is at issue is what the run reports, not what this file names in advance.
 * - no stricter: the manifest still declares a version a dev host installs — the
 *   field is not deleted, emptied or replaced to keep release numbers out of the
 *   file, and the placeholder is a plain `major.minor.patch` triple rather than a
 *   value a host refuses.
 *
 * The check reads the manifest document alone — the field and its committed
 * value, not the decision's wording. It runs no build, installs nothing, loads
 * no extension host, and asserts nothing about how the extension is named,
 * activated, served or bundled: that is srlrwowp's own recorded content and the
 * subject of its other checks. It looks for a release number nowhere else in the
 * manifest, so a release procedure that takes its version as an explicit
 * argument — the mechanism sppkuruw settles — stays allowed.
 */
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

/** The manifest the evaluated decision carries (its `ref`). */
const MANIFEST = new URL("../../package.json", import.meta.url);

/** The value this edge fixes for the committed field, while no release is in hand. */
const PLACEHOLDER = "0.0.1";

/**
 * A plain version triple and nothing wider: no prerelease channel, no build
 * stamp, no date. A channelled or stamped value is what a release supplies with
 * an explicit argument, at release time.
 */
const PLAIN_VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

function manifest(): Record<string, unknown> {
	const text = readFileSync(MANIFEST, "utf8");
	return JSON.parse(text) as Record<string, unknown>;
}

describe("the manifest's committed version is the fixed placeholder", () => {
	test("the manifest still declares a version a dev host can install", () => {
		const version = manifest().version;
		expect(typeof version).toBe("string");
		expect(version).not.toBe("");
	});

	test("the committed value is the placeholder, not a release number", () => {
		expect(manifest().version).toBe(PLACEHOLDER);
	});

	test("the placeholder is a plain triple, not a release-time value", () => {
		const version = manifest().version;
		expect(typeof version).toBe("string");
		expect(version as string).toMatch(PLAIN_VERSION);
	});
});
