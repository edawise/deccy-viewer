// @vitest-environment jsdom
/**
 * Conformance check: what the detail panel of the viewer page (rtlotqvy) must
 * show for the detail-section decisions (vqwoptmu, yrtrqutm, qwzwpxws,
 * rmovtvkt) to hold.
 *
 * The page the panel serves is set up here and the page module is loaded into
 * it, so the composed panel is driven: a graph is posted across the seam, a
 * node is selected, and the detail region is read back from the DOM. Nothing
 * is stubbed between the message and the panel.
 *
 * The decisions fix the sections by the label each one carries, by the order
 * of the three core sections, by which value each one shows, by how a value is
 * rendered for its content type, and by which ids each relationship section
 * lists. They fix no tag, class or nesting, so the check finds a section by
 * its label word and reads that section's own region: any markup that shows
 * the committed behaviour passes, and a layout the decisions leave open is not
 * asserted against.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { SELECTORS } from "../../src/webview/contract";
import type * as Main from "../../src/webview/main";

const PAGE = readFileSync("media/webview.html", "utf8");
let main: typeof Main;

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

/** The labels the detail panel commits to, compared case-insensitively. */
const LABELS = [
	"kind",
	"content",
	"rationale",
	"depends_on",
	"evaluates",
	"dependents",
	"evaluators",
] as const;
type Label = (typeof LABELS)[number];

/** A body of each prose type: one paragraph per line, so wrapping is free. */
const PROSE = "PROSE-BODY first paragraph.\n\nPROSE-BODY second paragraph.";
const EARS = "EARS-BODY the viewer shall present the graph.";
const CRITERIA = "CRITERIA-BODY a reviewer checks the panel.";
/** Bodies of the code types, with the indentation the panel must keep. */
const VISUAL = "VISUAL-BODY\n  indented line\n  second line";
const SCHEMA = '{\n  "type": "object",\n  "required": ["kind"]\n}';
const TEST_BODY = "TEST-BODY\texpect(panel).toBeVisible();";
const RUST = "fn main() {\n    let nodes = 1;\n}";
const RAW = "RAW-BODY an unnamed content type still displays.";

/**
 * The graph the check posts. Every content type the decisions name has a node,
 * plus an unnamed type, a ref path list, an empty value, and the relationship
 * shapes: `pros0001` is depended on by `eval0011` and evaluated by nothing,
 * while `schm0005` is evaluated by `eval0011` and depended on by `pros0001`.
 */
function records(): NodeRecord[] {
	return [
		{
			id: "pros0001",
			kind: "decision",
			dependsOn: ["schm0005"],
			evaluates: [],
			content: { type: "text", ref: "inline", content: PROSE, rationale: "RATIONALE-PROSE" },
		},
		{
			id: "ears0002",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "ears", ref: "inline", content: EARS, rationale: "RATIONALE-EARS" },
		},
		{
			id: "crit0003",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "review-criteria",
				ref: "inline",
				content: CRITERIA,
				rationale: "RATIONALE-CRITERIA",
			},
		},
		{
			id: "spec0004",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "visual-spec", ref: "inline", content: VISUAL, rationale: "RATIONALE-SPEC" },
		},
		{
			id: "schm0005",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "json-schema", ref: "inline", content: SCHEMA, rationale: "RATIONALE-SCHEMA" },
		},
		{
			id: "test0006",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "test", ref: "inline", content: TEST_BODY, rationale: "RATIONALE-TEST" },
		},
		{
			id: "rust0007",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "rust", ref: "inline", content: RUST, rationale: "RATIONALE-RUST" },
		},
		{
			id: "prov0008",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "provenance", ref: "inline", content: RAW, rationale: "RATIONALE-RAW" },
		},
		{
			id: "path0009",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "json-schema",
				ref: ["schemas/node.json", "docs/format.md"],
				rationale: "RATIONALE-PATH",
			},
		},
		{
			id: "empt0010",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "provenance", ref: "inline", rationale: "" },
		},
		{
			id: "eval0011",
			kind: "evaluation",
			dependsOn: ["pros0001"],
			evaluates: ["schm0005"],
			content: {
				type: "test",
				ref: ["tests/schm0005.test.ts"],
				rationale: "RATIONALE-EVAL",
			},
		},
	];
}

const IDS = records().map((record) => record.id);

// ---------------------------------------------------------------- the page

function detail(): HTMLElement {
	const body = document.querySelector(SELECTORS.detailBody);
	if (body === null) {
		throw new Error(`the page has no detail body (${SELECTORS.detailBody})`);
	}
	return body as HTMLElement;
}

/** Post the graph and let the page draw it. */
function show(): void {
	main.receive({ type: "graph", records: records(), labels: {}, warnings: [] });
}

/** Select a node the way a user does: a click on its drawn box. */
function select(id: string): void {
	const box = document.querySelector(`[data-node-id="${id}"]`);
	if (box === null) {
		throw new Error(`the graph drew no box for ${id}`);
	}
	box.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
	box.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
}

// ------------------------------------------------------- reading a section

/** Class tokens a collapse adds to the value it hides (a CSS-only collapse). */
const COLLAPSED = ["collapsed", "is-collapsed", "hidden", "is-hidden", "closed"];

/** Whether the element's own state hides it from the reader. */
function hiddenByState(element: Element): boolean {
	if (element.hasAttribute("hidden")) {
		return true;
	}
	if (element.getAttribute("aria-hidden") === "true") {
		return true;
	}
	if (element instanceof HTMLElement) {
		if (element.style.display === "none" || element.style.visibility === "hidden") {
			return true;
		}
		if (COLLAPSED.some((token) => element.classList.contains(token))) {
			return true;
		}
	}
	return false;
}

/** The text an element shows, leaving out what its own collapse or state hides. */
function shownText(root: Element | null | undefined): string {
	if (root === null || root === undefined) {
		return "";
	}
	const parts: string[] = [];
	const walk = (node: Node): void => {
		if (node.nodeType === Node.TEXT_NODE) {
			parts.push(node.nodeValue ?? "");
			return;
		}
		if (!(node instanceof Element)) {
			return;
		}
		if (hiddenByState(node)) {
			return;
		}
		// A closed <details> shows its summary only, never its body.
		if (node.tagName === "DETAILS" && !(node as HTMLDetailsElement).open) {
			const summary = Array.from(node.children).find((child) => child.tagName === "SUMMARY");
			if (summary !== undefined) {
				walk(summary);
			}
			return;
		}
		for (const child of Array.from(node.childNodes)) {
			walk(child);
		}
	};
	walk(root);
	return parts.join("");
}

/**
 * The elements that carry one section label, innermost first: an element whose
 * own text is the label word. A wrapper that repeats a label (a button around
 * a span) is the same label and is dropped.
 */
function labelNodes(): { label: Label; element: Element }[] {
	const matches: { label: Label; element: Element }[] = [];
	for (const element of Array.from(detail().querySelectorAll("*"))) {
		const text = (element.textContent ?? "").trim().toLowerCase();
		const label = LABELS.find((candidate) => candidate === text);
		if (label !== undefined) {
			matches.push({ label, element });
		}
	}
	return matches.filter(
		(match) =>
			!matches.some(
				(other) => other.element !== match.element && match.element.contains(other.element),
			),
	);
}

function labelNode(label: Label): Element | undefined {
	return labelNodes().find((match) => match.label === label)?.element;
}

function labelIndex(label: Label): number {
	return labelNodes().findIndex((match) => match.label === label);
}

/**
 * The region that is one labelled section: the smallest element around the
 * label that holds no other section label, or — when the labels share one
 * parent — the label and the siblings that follow it up to the next label.
 */
function sectionOf(label: Label): Element[] {
	const labels = labelNodes();
	const index = labels.findIndex((match) => match.label === label);
	if (index < 0) {
		return [];
	}
	const own = labels[index].element;
	const others = labels.filter((_, other) => other !== index).map((match) => match.element);
	const parent = own.parentElement;
	if (parent !== null && !others.some((other) => parent.contains(other))) {
		return [parent];
	}
	const parts: Element[] = [own];
	for (let sibling = own.nextElementSibling; sibling !== null; sibling = sibling.nextElementSibling) {
		if (others.some((other) => other === sibling || sibling!.contains(other))) {
			break;
		}
		parts.push(sibling);
	}
	return parts;
}

/** The text of a section, hidden state included: what it carries, not what it shows. */
function sectionText(label: Label): string {
	const parts = sectionOf(label);
	expect(parts.length, `the detail region has no "${label}" section label`).toBeGreaterThan(0);
	return parts.map((part) => part.textContent ?? "").join("\n");
}

/** The text of a section as the reader sees it now, collapse state included. */
function visibleSectionText(label: Label): string {
	const parts = sectionOf(label);
	expect(parts.length, `the detail region has no "${label}" section label`).toBeGreaterThan(0);
	return parts.map((part) => shownText(part)).join("\n");
}

/** A section's own content, with the label word taken off. */
function entriesOf(label: Label): string {
	const text = sectionText(label);
	const at = text.toLowerCase().indexOf(label);
	const withoutLabel = at < 0 ? text : text.slice(0, at) + text.slice(at + label.length);
	return withoutLabel.trim();
}

/** The monospaced blocks of a section: preformatted or code elements, outermost. */
function monoBlocks(label: Label): Element[] {
	const candidates: Element[] = [];
	for (const part of sectionOf(label)) {
		const found = [part, ...Array.from(part.querySelectorAll("pre, code"))];
		for (const element of found) {
			if (element.tagName === "PRE" || element.tagName === "CODE") {
				candidates.push(element);
			}
		}
	}
	return candidates.filter(
		(element) => !candidates.some((other) => other !== element && other.contains(element)),
	);
}

/** A block's text with only the newline a preformatted block adds at its edges. */
function blockText(element: Element): string {
	return (element.textContent ?? "").replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

// ------------------------------------------------------ acting on a section

/**
 * The action belonging to a section: the label itself when it is a control,
 * otherwise the control the label sits in.
 */
function controlFor(label: Label): Element {
	const own = labelNode(label);
	expect(own, `the detail region has no "${label}" section label`).toBeDefined();
	let candidate: Element | null = own ?? null;
	while (candidate !== null && candidate !== detail().parentElement) {
		if (
			candidate.tagName === "SUMMARY" ||
			candidate.tagName === "BUTTON" ||
			candidate.getAttribute("role") === "button" ||
			candidate.hasAttribute("aria-expanded")
		) {
			return candidate;
		}
		candidate = candidate.parentElement;
	}
	return own!;
}

/** Collapse or expand one section through its own action. */
function activate(label: Label): void {
	const control = controlFor(label);
	const details =
		control.tagName === "SUMMARY" && control.parentElement?.tagName === "DETAILS"
			? (control.parentElement as HTMLDetailsElement)
			: undefined;
	const open = details?.open;
	control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
	// jsdom does not run the summary activation behaviour of every version, so
	// apply it when the click left the block as it was: a browser toggles it.
	if (details !== undefined && details.open === open) {
		details.open = !open;
		details.dispatchEvent(new Event("toggle"));
	}
}

beforeAll(async () => {
	const parsed = new DOMParser().parseFromString(PAGE, "text/html");
	document.body.replaceChildren(
		...[...parsed.body.children].map((child) => document.adoptNode(child)),
	);
	const canvas = document.querySelector(SELECTORS.canvas) as unknown as HTMLElement;
	Object.defineProperty(canvas, "clientWidth", { value: 800 });
	Object.defineProperty(canvas, "clientHeight", { value: 600 });
	canvas.setPointerCapture = () => undefined;
	(globalThis as unknown as Record<string, unknown>).acquireVsCodeApi = (): unknown => ({
		postMessage: (): void => undefined,
		getState: (): unknown => undefined,
		setState: (): void => undefined,
	});
	main = await import("../../src/webview/main");
});

// ---------------------------------------------------------------- the checks

describe("the detail panel presents labelled sections in the fixed order (vqwoptmu)", () => {
	test("kind, content and rationale are labelled and each shows its own value", () => {
		show();
		select("pros0001");

		// Each value sits with its field's label, so the label binds it.
		expect(sectionText("kind")).toContain("decision");
		expect(sectionText("content")).toContain("PROSE-BODY first paragraph.");
		expect(sectionText("rationale")).toContain("RATIONALE-PROSE");

		// The order is fixed at kind, content, rationale.
		expect(labelIndex("kind")).toBeGreaterThanOrEqual(0);
		expect(labelIndex("kind")).toBeLessThan(labelIndex("content"));
		expect(labelIndex("content")).toBeLessThan(labelIndex("rationale"));

		// The same frame holds for another selection: the label stays, the
		// value is the newly selected node's.
		select("ears0002");
		expect(sectionText("content")).toContain("EARS-BODY");
		expect(sectionText("rationale")).toContain("RATIONALE-EARS");
		expect(sectionText("content")).not.toContain("PROSE-BODY");
	});

	test("a section whose value is empty still appears with its label", () => {
		show();
		select("empt0010");

		expect(labelNode("kind"), "the empty node has no Kind section").toBeDefined();
		expect(labelNode("content"), "the empty node has no Content section").toBeDefined();
		expect(labelNode("rationale"), "the empty node has no Rationale section").toBeDefined();
		expect(labelIndex("kind")).toBeLessThan(labelIndex("content"));
		expect(labelIndex("content")).toBeLessThan(labelIndex("rationale"));
	});
});

describe("each detail section collapses and expands on its own (yrtrqutm)", () => {
	test("the three sections start expanded", () => {
		show();
		select("pros0001");

		expect(visibleSectionText("content")).toContain("PROSE-BODY first paragraph.");
		expect(visibleSectionText("rationale")).toContain("RATIONALE-PROSE");
		expect(visibleSectionText("kind")).toContain("decision");
	});

	test("collapsing one section hides only its value, and expanding shows it again", () => {
		show();
		select("pros0001");

		activate("content");

		// The collapsed section keeps its label and hides only its value.
		expect(visibleSectionText("content").toLowerCase()).toContain("content");
		expect(visibleSectionText("content")).not.toContain("PROSE-BODY");
		// The other two keep the state they had.
		expect(visibleSectionText("kind")).toContain("decision");
		expect(visibleSectionText("rationale")).toContain("RATIONALE-PROSE");
		expect(visibleSectionText("rationale")).not.toBe("");

		// Expanding it again shows the value, and leaves the others alone.
		activate("content");
		expect(visibleSectionText("content")).toContain("PROSE-BODY first paragraph.");
		expect(visibleSectionText("rationale")).toContain("RATIONALE-PROSE");
	});

	test("two sections collapse independently and keep their order", () => {
		show();
		select("pros0001");

		activate("rationale");
		activate("content");

		expect(visibleSectionText("content")).not.toContain("PROSE-BODY");
		expect(visibleSectionText("rationale")).not.toContain("RATIONALE-PROSE");
		expect(visibleSectionText("kind")).toContain("decision");
		expect(visibleSectionText("content").toLowerCase()).toContain("content");
		expect(visibleSectionText("rationale").toLowerCase()).toContain("rationale");
		expect(labelIndex("kind")).toBeLessThan(labelIndex("content"));
		expect(labelIndex("content")).toBeLessThan(labelIndex("rationale"));
	});

	test("the detail body is not one collapsible block", () => {
		show();
		select("pros0001");

		const body = detail();
		expect(
			body.closest("details"),
			"the detail body sits inside a whole-detail collapsible block",
		).toBeNull();

		// No action outside the body collapses it as a whole: every collapsible
		// control of the detail region belongs to a section inside it.
		const region = document.querySelector(".panel__detail") ?? body;
		const outside = Array.from(region.querySelectorAll("details, summary, [aria-expanded]"))
			.filter((element) => !body.contains(element))
			.map((element) => `${element.tagName.toLowerCase()} ${(element.textContent ?? "").trim()}`);
		expect(outside, "the detail region has a control that collapses the whole body").toEqual([]);
	});
});

describe("the Content section renders its value by content type (qwzwpxws)", () => {
	test("prose types read as prose, not as a code block", () => {
		show();

		const prose: [string, string][] = [
			["pros0001", "PROSE-BODY first paragraph."],
			["ears0002", "EARS-BODY"],
			["crit0003", "CRITERIA-BODY"],
		];
		for (const [id, marker] of prose) {
			select(id);
			expect(sectionText("content"), `${id} does not show its body in the Content section`).toContain(
				marker,
			);
			const framed = monoBlocks("content").filter((element) =>
				blockText(element).includes(marker),
			);
			expect(framed.length, `${id} is marked as code but its type is prose`).toBe(0);
		}
	});

	test("code types read verbatim in a monospaced block marked with the type", () => {
		show();

		const coded: [string, string, string][] = [
			["spec0004", "visual-spec", VISUAL],
			["schm0005", "json-schema", SCHEMA],
			["test0006", "test", TEST_BODY],
			["rust0007", "rust", RUST],
		];
		for (const [id, type, body] of coded) {
			select(id);
			const blocks = monoBlocks("content").map((element) => blockText(element));
			expect(blocks, `${id} is not shown in a monospaced block`).toContain(body);
			expect(sectionText("content"), `${id} is not marked with its content type`).toContain(type);
		}
	});

	test("an unnamed content type still reads raw, marked with the type", () => {
		show();
		select("prov0008");

		const blocks = monoBlocks("content").map((element) => blockText(element));
		expect(blocks, "an unnamed content type is not shown in a monospaced block").toContain(RAW);
		expect(sectionText("content")).toContain("provenance");
	});

	test("a ref that is a path list shows the type and the paths in the block", () => {
		show();
		select("path0009");

		const blocks = monoBlocks("content").map((element) => blockText(element));
		const listed = blocks.find(
			(text) => text.includes("schemas/node.json") && text.includes("docs/format.md"),
		);
		expect(listed, "the ref path list is not shown in a monospaced block").toBeDefined();
		expect(listed).toContain("json-schema");
		expect(sectionText("content")).toContain("schemas/node.json");
		expect(sectionText("content")).toContain("docs/format.md");
	});

	test("an empty value keeps the Content section and shows the content type", () => {
		show();
		select("empt0010");

		expect(labelNode("content"), "the empty node has no Content section").toBeDefined();
		expect(sectionText("content")).toContain("provenance");
	});
});

describe("the detail panel lists the four relationships (rmovtvkt)", () => {
	/** A section with no entries still names its emptiness and lists no id. */
	function expectEmpty(label: Label, why: string): void {
		const entries = entriesOf(label);
		expect(entries, `${why}: the ${label} section has no explicit empty state`).not.toBe("");
		for (const id of IDS) {
			expect(entries, `${why}: the ${label} section lists ${id}`).not.toContain(id);
		}
	}

	test("a decision lists its own prerequisites and its dependents, and names its empty directions", () => {
		show();
		select("pros0001");

		for (const label of ["depends_on", "evaluates", "dependents", "evaluators"] as const) {
			expect(labelNode(label), `the detail region has no ${label} section`).toBeDefined();
		}
		expect(entriesOf("depends_on")).toContain("schm0005");
		expect(entriesOf("dependents")).toContain("eval0011");
		expectEmpty("evaluates", "a decision evaluates nothing");
		expectEmpty("evaluators", "nothing evaluates pros0001");
	});

	test("an evaluation lists what it depends on and evaluates, and names its empty reverse directions", () => {
		show();
		select("eval0011");

		expect(entriesOf("depends_on")).toContain("pros0001");
		expect(entriesOf("evaluates")).toContain("schm0005");
		expectEmpty("dependents", "nothing depends on eval0011");
		expectEmpty("evaluators", "nothing evaluates eval0011");
	});

	test("the reverse directions read from the other end of the same edges", () => {
		show();
		select("schm0005");

		expect(entriesOf("dependents")).toContain("pros0001");
		expect(entriesOf("evaluators")).toContain("eval0011");
		expectEmpty("depends_on", "schm0005 has no prerequisites");
		expectEmpty("evaluates", "schm0005 is a decision");
	});
});
