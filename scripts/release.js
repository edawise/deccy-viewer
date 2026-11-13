#!/usr/bin/env node
/**
 * The release entry point: stamps the release version into the packaged vsix and
 * persists it nowhere.
 *
 * The version is one value handed to this program at release time (sppkuruw):
 * positional or `--version` / `--version=`; both are explicit arguments. Given
 * none, it refuses and packs nothing — there is no default, no value read from
 * the manifest, no value derived from a tag, a date or a counter.
 *
 * The manifest inside the vsix is stamped in memory: the tree's package.json is
 * read, parsed, its `version` replaced in the parsed copy, and the copy is
 * written into the archive. The file on disk is never opened for writing, so the
 * committed placeholder (srlrwowp) survives the release untouched and no lockfile
 * is ever produced. Nothing but the artifact is written: no temporary manifest,
 * no backup, no build output, no install.
 *
 * The vsix is assembled offline with the zip writer below (node:zlib deflate),
 * so the release needs no packager, no network, no npm and no build step. What
 * it packs is the packaged set vqultolm records — out/extension.js,
 * media/webview.html, src/styles/*.css, src/webview/main.js, the codicons
 * stylesheet and the font it loads, the manifest and the README — and it ships
 * each of those the tree actually carries, under the `extension/` directory the
 * vsix format puts them in. A tree without the build outputs or node_modules
 * packs what it holds rather than inventing the rest. Two further entries sit at
 * the archive root, not under `extension/`: `extension.vsixmanifest` and
 * `[Content_Types].xml`, the container's own description of the archive, which
 * is what makes the file a vsix a host installs rather than a bare zip. They are
 * not extension files, and `extension/` carries exactly vqultolm's set.
 *
 * Usage: node scripts/release.js <version>
 *        node scripts/release.js --version <version>
 */

"use strict";

const {
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} = require("node:fs");
const { deflateRawSync } = require("node:zlib");
const { join, resolve } = require("node:path");

/** The tree the release works in: the root the scripts directory sits under. */
const ROOT = resolve(__dirname, "..");

/** The release value's shape. Which shape is the release's own business; a triple is what a host installs. */
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * The runtime payload vqultolm records, as paths relative to the tree. Entries
 * the tree does not carry are left out rather than fabricated.
 */
const PAYLOAD = [
	"out/extension.js",
	"media/webview.html",
	"src/webview/main.js",
	"node_modules/@vscode/codicons/dist/codicon.css",
	"node_modules/@vscode/codicons/dist/codicon.ttf",
];

/** The stylesheet directory the page interface names; every CSS file in it ships. */
const STYLES = "src/styles";

const USAGE =
	"usage: node scripts/release.js <version>\n" +
	"       node scripts/release.js --version <version>\n" +
	"\n" +
	"the release version is an argument, never a value the tree supplies: pass the\n" +
	"version to stamp into the vsix.";

const REFUSALS = {
	absent: "no release version was given, so there is nothing to stamp into the vsix",
	ambiguous: "more than one release version was given",
	empty: "the release version is empty",
	shape: "the release version is not a version this release can stamp",
	unknownFlag: "the release takes a version and nothing else",
	missingValue: "the --version flag was given no version",
};

/** The release refusing: says what it is missing, ships nothing, exits non-zero. */
function refuse(reason) {
	process.stderr.write(`release: ${reason}\n\n${USAGE}\n`);
	process.exit(1);
}

/** Where the release value came from: a positional argument or the --version flag. */
function parseArgs(argv) {
	const given = [];
	const words = [];
	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];
		if (argument === "--") {
			words.push(...argv.slice(index + 1));
			break;
		}
		if (argument === "--version") {
			const value = argv[index + 1];
			if (value === undefined) {
				refuse(REFUSALS.missingValue);
			}
			given.push(value);
			index++;
			continue;
		}
		if (argument.startsWith("--version=")) {
			given.push(argument.slice("--version=".length));
			continue;
		}
		if (argument === "-h" || argument === "--help") {
			process.stdout.write(`${USAGE}\n`);
			process.exit(0);
		}
		if (argument.startsWith("-")) {
			refuse(`${REFUSALS.unknownFlag} (${argument})`);
		}
		words.push(argument);
	}
	given.push(...words);
	if (given.length === 0) {
		refuse(REFUSALS.absent);
	}
	if (given.length > 1) {
		refuse(`${REFUSALS.ambiguous} (${given.join(", ")})`);
	}
	const version = given[0].trim();
	if (version === "") {
		refuse(REFUSALS.empty);
	}
	if (!VERSION.test(version)) {
		refuse(`${REFUSALS.shape}: ${JSON.stringify(given[0])}`);
	}
	return version;
}

/** The tree's manifest, read once and never written. */
function manifest() {
	const path = join(ROOT, "package.json");
	let text;
	try {
		text = readFileSync(path, "utf8");
	} catch {
		process.stderr.write(`release: the tree carries no ${path} to package\n`);
		process.exit(1);
	}
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		process.stderr.write(`release: ${path} is not readable JSON (${error.message})\n`);
		process.exit(1);
	}
	if (typeof parsed.name !== "string" || parsed.name === "") {
		process.stderr.write(`release: ${path} names no extension\n`);
		process.exit(1);
	}
	return parsed;
}

function isFile(path) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

/** The files the run adds to a directory, or none when it is absent. */
function filesIn(directory) {
	let entries;
	try {
		entries = readdirSync(directory, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.sort();
}

/** The packaged set vqultolm records, limited to the files this tree holds. */
function packagedSet(pkg) {
	const candidates = [...PAYLOAD];
	for (const name of filesIn(join(ROOT, STYLES))) {
		if (name.endsWith(".css")) {
			candidates.push(`${STYLES}/${name}`);
		}
	}
	for (const name of filesIn(ROOT)) {
		if (/^readme(\.[A-Za-z0-9]+)?$/i.test(name)) {
			candidates.push(name);
		}
	}
	const packaged = [];
	const absent = [];
	for (const relative of candidates) {
		if (isFile(join(ROOT, relative))) {
			packaged.push(relative);
		} else {
			absent.push(relative);
		}
	}
	if (packaged.length === 0) {
		process.stderr.write(
			`release: the tree carries none of the packaged set (${candidates.join(", ")})\n`,
		);
		process.exit(1);
	}
	for (const relative of absent) {
		process.stderr.write(
			`release: the tree carries no ${relative}; it is not packaged\n`,
		);
	}
	return packaged;
}

function xml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** The archive's description of itself: the manifest a host reads to install the vsix. */
function vsixManifest(pkg, version) {
	const publisher = typeof pkg.publisher === "string" ? pkg.publisher : "";
	const displayName = typeof pkg.displayName === "string" ? pkg.displayName : pkg.name;
	const description = typeof pkg.description === "string" ? pkg.description : "";
	return (
		'<?xml version="1.0" encoding="utf-8"?>\n' +
		'<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" ' +
		'xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">\n' +
		"  <Metadata>\n" +
		`    <Identity Language="en-US" Id="${xml(pkg.name)}" Version="${xml(version)}" ` +
		`Publisher="${xml(publisher)}" />\n` +
		`    <DisplayName>${xml(displayName)}</DisplayName>\n` +
		`    <Description xml:space="preserve">${xml(description)}</Description>\n` +
		"  </Metadata>\n" +
		"  <Installation>\n" +
		'    <InstallationTarget Id="Microsoft.VisualStudio.Code" />\n' +
		"  </Installation>\n" +
		"  <Dependencies />\n" +
		"  <Assets>\n" +
		'    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" ' +
		'Addressable="true" />\n' +
		"  </Assets>\n" +
		"</PackageManifest>\n"
	);
}

function contentTypes(extensions) {
	const defaults = {
		json: "application/json",
		js: "application/javascript",
		css: "text/css",
		html: "text/html",
		ttf: "application/font-sfnt",
		md: "text/markdown",
		vsixmanifest: "text/xml",
	};
	const types = [
		...new Set(
			extensions.map((extension) => extension.replace(/^\./, "").toLowerCase()),
		),
	]
		.filter((extension) => defaults[extension] !== undefined)
		.sort();
	const declared = types
		.map(
			(extension) =>
				`  <Default Extension=".${xml(extension)}" ContentType="${defaults[extension]}"/>`,
		)
		.join("\n");
	return (
		'<?xml version="1.0" encoding="utf-8"?>\n' +
		'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
		`${declared}\n` +
		"</Types>\n"
	);
}

/* ---------------------------------------------------------------- zip ---- */

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let index = 0; index < 256; index++) {
		let value = index;
		for (let bit = 0; bit < 8; bit++) {
			value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
		}
		table[index] = value;
	}
	return table;
})();

function crc32(bytes) {
	let crc = -1;
	for (let index = 0; index < bytes.length; index++) {
		crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ -1) >>> 0;
}

/** A fixed timestamp, so the same tree and value always pack to the same bytes. */
const DOS_TIME = 0;
const DOS_DATE = 0x0021; // 1980-01-01

/**
 * A zip archive of the named entries: local headers, the data, then the central
 * directory and its end record. Built whole in memory; the caller writes it once.
 */
function zip(entries) {
	const locals = [];
	const central = [];
	let offset = 0;
	for (const entry of entries) {
		const name = Buffer.from(entry.name, "utf8");
		const raw = entry.data;
		const deflated = deflateRawSync(raw);
		const store = deflated.length >= raw.length;
		const body = store ? raw : deflated;
		const method = store ? 0 : 8;
		const checksum = crc32(raw);

		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(0x0800, 6);
		local.writeUInt16LE(method, 8);
		local.writeUInt16LE(DOS_TIME, 10);
		local.writeUInt16LE(DOS_DATE, 12);
		local.writeUInt32LE(checksum, 14);
		local.writeUInt32LE(body.length, 18);
		local.writeUInt32LE(raw.length, 22);
		local.writeUInt16LE(name.length, 26);
		local.writeUInt16LE(0, 28);
		locals.push(local, name, body);

		const header = Buffer.alloc(46);
		header.writeUInt32LE(0x02014b50, 0);
		header.writeUInt16LE(20, 4);
		header.writeUInt16LE(20, 6);
		header.writeUInt16LE(0x0800, 8);
		header.writeUInt16LE(method, 10);
		header.writeUInt16LE(DOS_TIME, 12);
		header.writeUInt16LE(DOS_DATE, 14);
		header.writeUInt32LE(checksum, 16);
		header.writeUInt32LE(body.length, 20);
		header.writeUInt32LE(raw.length, 24);
		header.writeUInt16LE(name.length, 28);
		header.writeUInt16LE(0, 30);
		header.writeUInt16LE(0, 32);
		header.writeUInt16LE(0, 34);
		header.writeUInt16LE(0, 36);
		header.writeUInt32LE(0, 38);
		header.writeUInt32LE(offset, 42);
		central.push(header, name);

		offset += local.length + name.length + body.length;
	}

	const directory = Buffer.concat(central);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(0, 4);
	end.writeUInt16LE(0, 6);
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(directory.length, 12);
	end.writeUInt32LE(offset, 16);
	end.writeUInt16LE(0, 20);

	return Buffer.concat([...locals, directory, end]);
}

/* ------------------------------------------------------------- release ---- */

function main() {
	const version = parseArgs(process.argv.slice(2));
	const pkg = manifest();
	const packaged = packagedSet(pkg);

	// The stamped manifest is a parsed copy held in memory. The tree's file is
	// never written, so the release value reaches the artifact and nothing else.
	const stamped = { ...pkg, version };
	const entries = [
		{
			name: "extension.vsixmanifest",
			data: Buffer.from(vsixManifest(pkg, version), "utf8"),
		},
		{
			name: "[Content_Types].xml",
			data: Buffer.from(
				contentTypes([
					"vsixmanifest",
					...packaged.map((relative) =>
						relative.slice(relative.lastIndexOf(".")),
					),
				]),
				"utf8",
			),
		},
		{
			name: "extension/package.json",
			data: Buffer.from(`${JSON.stringify(stamped, null, "\t")}\n`, "utf8"),
		},
	];
	for (const relative of packaged) {
		entries.push({
			name: `extension/${relative}`,
			data: readFileSync(join(ROOT, relative)),
		});
	}

	const artifact = `${pkg.name}-${version}.vsix`;
	writeFileSync(join(ROOT, artifact), zip(entries));

	process.stdout.write(
		`release: packed ${entries.length} files into ${artifact}, ` +
			`stamping ${pkg.name} ${version}\n` +
			"the tree's manifest is unchanged and no other file was written\n",
	);
}

main();
