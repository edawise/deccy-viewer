/**
 * Gate check: the release entry point (wrowytry) carries the release version into
 * the packaged vsix and leaves nothing of it behind, taking three standards as
 * given.
 *
 * sppkuruw records that a release's version is one value given at release time —
 * an explicit argument to the release, never committed; vqultolm records which
 * files the packaged vsix contains and nothing else; srlrwowp records the shell
 * and the manifest that names it, and owns the manifest's committed placeholder.
 * What this edge adds, and what this check runs for, is the release entry point
 * itself: one program that takes the version as an argument, produces the
 * packaged vsix carrying that value, and leaves the tree as it was. The two
 * halves are one act, so they are checked together and neither is checked alone:
 * an artifact carrying the value that the tree still holds is a commit, and a
 * tree left clean with no artifact is no release.
 *
 * The check runs the entry point in a throwaway copy of the tree, outside the
 * repository, so that a run that stamps and forgets to restore is observed rather
 * than concealed, and never touches the tree the check itself lives in:
 *
 * - the version is an explicit argument: with no value on the command line the
 *   entry point refuses and produces no artifact, so the value it ships cannot
 *   be the committed placeholder or a default the tree supplies (`sppkuruw`).
 * - the artifact is the packaged vsix: the run's new `.vsix` is opened as the zip
 *   it is, the manifest inside it carries exactly the value that was given — not
 *   the manifest's committed value, and not a value re-derived from it — and so
 *   does the container's own identity, the `extension.vsixmanifest` `Identity`
 *   that a host reads to install the vsix and display its version. Its `Id` and
 *   `Publisher` stay the tree's own manifest's, so the artifact is this extension
 *   packaged. A release that stamps the packaged manifest and leaves the identity
 *   holding the committed placeholder ships the placeholder, because the identity
 *   version is the one a host installs.
 * - nothing persists: every file the tree held before the run is byte-identical
 *   after it — the manifest above all — and the run adds no file apart from the
 *   artifact. A leftover working file, a staged manifest, a backup, a lockfile, a
 *   build output is residue whether or not it carries the release value, so the
 *   check reads the tree's shape and not only its contents. No file the run added
 *   or rewrote carries the value either.
 *
 * The packager is not named: whatever the entry point packs with, the check reads
 * only the artifact it produces. It fixes no flag spelling — a positional value
 * and a `--version` value are both explicit arguments, and either is accepted. It
 * names no artifact filename, asserts nothing about the packaged payload or about
 * the manifest's fields beyond the extension's name and the version it ships
 * (they are `vqultolm`'s and `srlrwowp`'s own recorded content, and the subject of
 * their other checks), asserts nothing of the identity but that it names this
 * extension under the value it was given, and forbids no step the release may
 * take, provided the tree it leaves behind is the tree it found.
 * A rewrite of the decision that keeps the same commitment leaves this file
 * intact; which element fails is what the run reports, never what this file names
 * in advance.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	cpSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

import { afterAll, describe, expect, test } from "vitest";

/** The tree the release entry point is run against. */
const PROJECT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * The value handed to the release. Distinctive on purpose: it appears nowhere in
 * the tree, so finding it anywhere afterwards is the release's own doing, and it
 * differs from the committed placeholder the manifest holds, so an artifact that
 * carries it can only have taken it from the argument.
 */
const RELEASE_VERSION = "12.34.567";

/** How long one packaging run may take; the run is local and reads no network. */
const RUN_TIMEOUT_MS = 300_000;

/** Directories of the tree that are not the release's input and are not copied. */
const NOT_COPIED = new Set([".git", ".jj", ".deccy", "node_modules"]);

/** Lockfiles a release could pin the value into if it stamped by installing. */
const LOCKFILES = [
	"package-lock.json",
	"npm-shrinkwrap.json",
	"pnpm-lock.yaml",
	"yarn.lock",
];

const MISSING_ENTRY_POINT =
	"the release entry point is absent: this edge adds a program under scripts/ that takes the " +
	"release version as an explicit argument, produces the packaged vsix carrying that value and " +
	"leaves the tree as it was. No such entry point exists in the tree, so there is nothing to run.";

const scratch: string[] = [];

afterAll(() => {
	for (const directory of scratch.splice(0)) {
		rmSync(directory, { recursive: true, force: true });
	}
});

/** A throwaway copy of the tree, outside the repository. */
function copyOfTree(): string {
	const directory = mkdtempSync(join(tmpdir(), "skzxumuk-release-"));
	scratch.push(directory);
	cpSync(PROJECT, directory, {
		recursive: true,
		filter: (path) => path === PROJECT || !NOT_COPIED.has(basename(path)),
	});
	return directory;
}

function sha256(bytes: Buffer): string {
	return createHash("sha256").update(bytes).digest("hex");
}

/** Every file of the tree, keyed by its path relative to the tree, with its digest. */
function snapshot(root: string): Map<string, string> {
	const files = new Map<string, string>();
	const walk = (directory: string): void => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const full = join(directory, entry.name);
			if (entry.isDirectory()) {
				walk(full);
				continue;
			}
			files.set(relative(root, full), sha256(readFileSync(full)));
		}
	};
	walk(root);
	return files;
}

const SCRIPT_FILE = /\.(?:mjs|cjs|js|mts|cts|ts)$/;

/**
 * The one program under scripts/ that performs the release: named for the release
 * when there is one, otherwise the only script the directory holds.
 */
function releaseEntryPoint(root: string): string | null {
	const scripts = join(root, "scripts");
	const found: string[] = [];
	const walk = (directory: string): void => {
		let entries;
		try {
			entries = readdirSync(directory, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const full = join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!NOT_COPIED.has(entry.name)) {
					walk(full);
				}
				continue;
			}
			if (SCRIPT_FILE.test(entry.name)) {
				found.push(full);
			}
		}
	};
	walk(scripts);
	const named = found.filter((path) => /release|pack|vsix/i.test(basename(path)));
	if (named.length === 1) {
		return named[0];
	}
	return named.length === 0 && found.length === 1 ? found[0] : null;
}

type Run = { status: number | null; output: string };

function run(root: string, script: string, args: string[]): Run {
	const result = spawnSync(process.execPath, [script, ...args], {
		cwd: root,
		encoding: "utf8",
		timeout: RUN_TIMEOUT_MS,
	});
	return {
		status: result.status,
		output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
	};
}

/**
 * The release value is an explicit argument, so either spelling of one is
 * accepted; both are reported when neither works.
 */
function runWithVersion(root: string, script: string): Run {
	const positional = run(root, script, [RELEASE_VERSION]);
	if (positional.status === 0) {
		return positional;
	}
	const flagged = run(root, script, ["--version", RELEASE_VERSION]);
	if (flagged.status === 0) {
		return flagged;
	}
	return {
		status: positional.status,
		output:
			`released with "<version>":\n${positional.output}\n` +
			`released with "--version <version>":\n${flagged.output}`,
	};
}

type ZipEntry = {
	name: string;
	method: number;
	compressedSize: number;
	offset: number;
};

/** The entries a zip archive's central directory lists. */
function zipEntries(zip: Buffer): ZipEntry[] {
	let end = -1;
	for (let at = zip.length - 22; at >= Math.max(0, zip.length - 22 - 0xffff); at--) {
		if (zip.readUInt32LE(at) === 0x06054b50) {
			end = at;
			break;
		}
	}
	if (end < 0) {
		throw new Error(
			"the artifact the run produced carries no zip central directory, so it is not a vsix",
		);
	}
	const count = zip.readUInt16LE(end + 10);
	let at = zip.readUInt32LE(end + 16);
	const entries: ZipEntry[] = [];
	for (let index = 0; index < count; index++) {
		if (zip.readUInt32LE(at) !== 0x02014b50) {
			throw new Error(`the artifact's central directory is unreadable at entry ${index}`);
		}
		const method = zip.readUInt16LE(at + 10);
		const compressedSize = zip.readUInt32LE(at + 20);
		const nameLength = zip.readUInt16LE(at + 28);
		const extraLength = zip.readUInt16LE(at + 30);
		const commentLength = zip.readUInt16LE(at + 32);
		const offset = zip.readUInt32LE(at + 42);
		const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
		if (compressedSize === 0xffffffff) {
			throw new Error(`the artifact's entry ${name} needs a zip64 archive, which a vsix is not`);
		}
		entries.push({ name, method, compressedSize, offset });
		at += 46 + nameLength + extraLength + commentLength;
	}
	return entries;
}

function zipContent(zip: Buffer, entry: ZipEntry): Buffer {
	if (zip.readUInt32LE(entry.offset) !== 0x04034b50) {
		throw new Error(`the artifact's entry ${entry.name} has no local header`);
	}
	const nameLength = zip.readUInt16LE(entry.offset + 26);
	const extraLength = zip.readUInt16LE(entry.offset + 28);
	const start = entry.offset + 30 + nameLength + extraLength;
	const data = zip.subarray(start, start + entry.compressedSize);
	if (entry.method === 0) {
		return Buffer.from(data);
	}
	if (entry.method === 8) {
		return inflateRawSync(data);
	}
	throw new Error(`the artifact's entry ${entry.name} uses compression method ${entry.method}`);
}

/** The manifest the packaged vsix carries, or null when this file is not one. */
function packagedManifest(vsix: string): Record<string, unknown> | null {
	const zip = readFileSync(vsix);
	let entry: ZipEntry | undefined;
	try {
		entry = zipEntries(zip).find((candidate) => candidate.name === "extension/package.json");
	} catch {
		return null;
	}
	if (!entry) {
		return null;
	}
	return JSON.parse(zipContent(zip, entry).toString("utf8")) as Record<string, unknown>;
}

function decodeXml(value: string): string {
	return value
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
}

/** The attributes one start tag carries. */
function attributesOf(tag: string): Map<string, string> {
	const attributes = new Map<string, string>();
	const pattern = /([A-Za-z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
	for (const match of tag.matchAll(pattern)) {
		attributes.set(match[1], decodeXml(match[2] ?? match[3] ?? ""));
	}
	return attributes;
}

type Identity = { id: string; version: string; publisher: string };

/**
 * The identity a host installs the vsix by: the `Identity` element of the
 * container's own `extension.vsixmanifest`, at the archive root. Its `Version` is
 * the version the host records and displays for the installed extension, so a
 * release that stamps the packaged manifest and leaves this one holding the
 * tree's committed placeholder ships the placeholder.
 */
function packagedIdentity(vsix: string): Identity | null {
	let xml: string;
	try {
		const zip = readFileSync(vsix);
		const entry = zipEntries(zip).find(
			(candidate) => candidate.name === "extension.vsixmanifest",
		);
		if (!entry) {
			return null;
		}
		xml = zipContent(zip, entry).toString("utf8");
	} catch {
		return null;
	}
	const tag = xml.match(/<(?:[A-Za-z_][-\w.]*:)?Identity\b[^>]*>/);
	if (!tag) {
		return null;
	}
	const attributes = attributesOf(tag[0]);
	return {
		id: attributes.get("Id") ?? "",
		version: attributes.get("Version") ?? "",
		publisher: attributes.get("Publisher") ?? "",
	};
}

type Release = {
	root: string;
	before: Map<string, string>;
	after: Map<string, string>;
	artifacts: string[];
	manifests: Record<string, unknown>[];
	identities: { artifact: string; identity: Identity | null }[];
	run: Run;
};

/** One release of a throwaway copy, taken once and read by the checks below. */
let release: Release | null = null;

function released(): Release {
	if (release) {
		return release;
	}
	const root = copyOfTree();
	const before = snapshot(root);
	const script = releaseEntryPoint(root);
	if (!script) {
		throw new Error(MISSING_ENTRY_POINT);
	}
	const outcome = runWithVersion(root, script);
	const after = snapshot(root);
	const artifacts = [...after.keys()].filter(
		(path) => path.endsWith(".vsix") && !before.has(path),
	);
	const manifests: Record<string, unknown>[] = [];
	const identities: { artifact: string; identity: Identity | null }[] = [];
	for (const artifact of artifacts) {
		const manifest = packagedManifest(join(root, artifact));
		if (manifest) {
			manifests.push(manifest);
		}
		identities.push({
			artifact,
			identity: packagedIdentity(join(root, artifact)),
		});
	}
	release = { root, before, after, artifacts, manifests, identities, run: outcome };
	return release;
}

describe("the release entry point stamps the release value into the vsix and persists it nowhere", () => {
	test("an entry point exists to take the release value", { timeout: RUN_TIMEOUT_MS }, () => {
		const root = copyOfTree();
		expect(releaseEntryPoint(root), MISSING_ENTRY_POINT).not.toBeNull();
	});

	test("with no value given, it refuses and ships no artifact", { timeout: RUN_TIMEOUT_MS }, () => {
		const root = copyOfTree();
		const script = releaseEntryPoint(root);
		expect(script, MISSING_ENTRY_POINT).not.toBeNull();
		if (!script) {
			return;
		}
		const before = snapshot(root);
		const outcome = run(root, script, []);
		const after = snapshot(root);
		const shipped = [...after.keys()].filter(
			(path) => path.endsWith(".vsix") && !before.has(path),
		);
		expect(
			shipped,
			`the release shipped ${shipped.join(", ")} with no value on the command line, so the value it ` +
				"carries came from the tree or a default rather than from an explicit argument",
		).toEqual([]);
		expect(
			outcome.status,
			`the release exited ${outcome.status} with no value on the command line instead of refusing:\n` +
				outcome.output,
		).not.toBe(0);
		expect(
			outcome.output,
			"the refusal says nothing about the value it is missing, so the argument the release " +
				`takes is not named:\n${outcome.output}`,
		).toMatch(/version|semver|usage/i);
	});

	test("the packaged vsix carries exactly the value that was given", { timeout: RUN_TIMEOUT_MS }, () => {
		const outcome = released();
		expect(
			outcome.run.status,
			`the release entry point exited ${outcome.run.status}:\n${outcome.run.output}`,
		).toBe(0);
		expect(
			outcome.artifacts,
			`the release produced no .vsix:\n${outcome.run.output}`,
		).not.toEqual([]);
		expect(
			outcome.manifests.length,
			`none of the artifacts the release produced (${outcome.artifacts.join(", ")}) is a vsix ` +
				"carrying the packaged extension's manifest at extension/package.json",
		).toBeGreaterThan(0);
		const source = JSON.parse(
			readFileSync(join(outcome.root, "package.json"), "utf8"),
		) as Record<string, unknown>;
		for (const manifest of outcome.manifests) {
			expect(
				manifest.version,
				"the packaged manifest carries a value other than the one the release was given, so the " +
					"value it ships did not come from the argument alone",
			).toBe(RELEASE_VERSION);
			expect(
				manifest.name,
				"the packaged manifest names a different extension than the one the tree holds, so the " +
					"artifact is not this extension packaged",
			).toBe(source.name);
		}
	});

	test("the artifact's own identity carries the value that was given", { timeout: RUN_TIMEOUT_MS }, () => {
		const outcome = released();
		expect(
			outcome.run.status,
			`the release entry point exited ${outcome.run.status}:\n${outcome.run.output}`,
		).toBe(0);
		expect(
			outcome.artifacts,
			`the release produced no .vsix:\n${outcome.run.output}`,
		).not.toEqual([]);
		const source = JSON.parse(
			readFileSync(join(outcome.root, "package.json"), "utf8"),
		) as Record<string, unknown>;
		for (const { artifact, identity } of outcome.identities) {
			expect(
				identity,
				`the artifact the release produced (${artifact}) carries no extension.vsixmanifest ` +
					"Identity at the archive root, so a host has no packaged identity to install or to " +
					"display: the identity carries the version that is installed, and the release value " +
					"has not reached it",
			).not.toBeNull();
			if (!identity) {
				continue;
			}
			expect(
				identity.version,
				`the packaged identity (${artifact}) carries a version other than the one the release ` +
					"was given, so the version a host installs and displays is not the value the argument " +
					"supplied",
			).toBe(RELEASE_VERSION);
			expect(
				identity.id,
				`the packaged identity (${artifact}) names a different extension than the tree's ` +
					"manifest, so the artifact is not this extension packaged",
			).toBe(source.name);
			expect(
				identity.publisher,
				`the packaged identity (${artifact}) carries a publisher the tree's manifest does not, ` +
					"so the artifact is not this extension packaged",
			).toBe(source.publisher);
		}
	});

	test("the tree is left as it was, the release value persisted nowhere", { timeout: RUN_TIMEOUT_MS }, () => {
		const outcome = released();
		expect(
			outcome.run.status,
			`the release entry point exited ${outcome.run.status}:\n${outcome.run.output}`,
		).toBe(0);
		const added = [...outcome.after.keys()].filter(
			(path) => !path.endsWith(".vsix") && !outcome.before.has(path),
		);
		expect(
			added,
			`the run left ${added.join(", ")} behind in the tree it ran in: the tree it leaves behind ` +
				"is the tree it found apart from the artifact, so a file the run adds is residue whether " +
				"or not it carries the release value",
		).toEqual([]);
		const rewritten = [...outcome.after.entries()]
			.filter(
				([path, digest]) =>
					!path.endsWith(".vsix") && outcome.before.get(path) !== digest,
			)
			.map(([path]) => path);
		expect(
			rewritten,
			`the run rewrote ${rewritten.join(", ")} of the tree it ran in: the tree it leaves behind ` +
				"is the tree it found apart from the artifact, so a rewritten file is residue whether " +
				"or not it carries the release value",
		).toEqual([]);
		for (const [path, digest] of outcome.before) {
			expect(
				outcome.after.get(path),
				`${path} is not as the release found it: the run left a change behind in the tree`,
			).toBe(digest);
		}
		for (const lockfile of LOCKFILES) {
			expect(
				outcome.after.has(lockfile),
				`the release left ${lockfile} behind, holding the value it was given`,
			).toBe(outcome.before.has(lockfile));
		}
		const persisting = [...outcome.after.entries()]
			.filter(
				([path, digest]) =>
					!path.endsWith(".vsix") && outcome.before.get(path) !== digest,
			)
			.map(([path]) => path)
			.filter((path) =>
				readFileSync(join(outcome.root, path)).includes(RELEASE_VERSION),
			);
		expect(
			persisting,
			`the release value is still in the tree after the run, in ${persisting.join(", ")}: the ` +
				"value reaches the packaged vsix and nowhere else",
		).toEqual([]);
	});
});
