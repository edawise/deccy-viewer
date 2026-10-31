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
 *
 * The ids the relationship sections list are also driven as entries of the
 * composed page, the way the committed activation behaviour reads (kwxutvpw,
 * rusopkql): an id the panel lists is activated with a pointer gesture and with
 * Enter and Space while it holds the focus, and must land on the same detail
 * that clicking the node's own box shows; an id whose edge names no node
 * document stays listed and leaves the detail untouched whichever way it is
 * activated. Nothing about the entry's markup is fixed either: the id is
 * found as the element that shows it inside the section its label names, and
 * the control is whatever element around it takes the keyboard focus.
 *
 * The pointer gesture is a user's, not a program's: a primary press and release
 * with a pointer id and a point, and then the compatibility `click` a browser
 * adds after them — addressed to the element that captured the pointer if one
 * holds it for that pointer, and otherwise to the nearest common inclusive
 * ancestor of the press and the release target. jsdom keeps no pointer capture
 * of its own, so the harness supplies the browser's bookkeeping for it: an
 * entry the page can only reach by a click dispatched at it by hand — one whose
 * element sits inside the element the page captures the pointer on, where a
 * browser addresses the click to the capturing element instead — is not
 * activated here, which is the point of driving the gesture rather than the
 * click.
 *
 * What the entries are marked with is also driven: the vocabulary a listed
 * entry's case is named by (sqwusxql) is read from the composed panel, so an
 * id that names a node document must carry "detail__entry" and an id that
 * names none must carry "detail__entry--inert", exactly one of the two on
 * every listed entry. Each entry's class list is read whole rather than
 * filtered down to the two names, so the vocabulary is exactly what the entry
 * is marked with: a name beside the case class, a further modifier spelled out
 * of the two, or a second entry name is read as the extra name it is. The
 * class names are the record's and are quoted here as
 * it spells them; which element of the entry carries the class is not fixed,
 * so it is read from the element that shows the id and the wrappers around it
 * that show nothing else. The declarations those classes select are the
 * stylesheet's own commitments and are not read here.
 *
 * The Content section's ref paths are read the same way, as the entries the
 * layer marks (ppkkmxxu): a path of a `content.ref` list is shown as an entry of
 * its own inside the section's monospaced block, and that entry carries
 * "detail__ref" as its whole class — no name beside it, no further name spelled
 * out of it, and never one of the two listed-entry names, which belong to the
 * relationship sections. The mark is read from the element that shows the path
 * and nothing else, so a page that keeps the block and marks each path in it
 * inside passes, whatever element carries the mark. What the name selects is
 * the stylesheet's own commitment and is not read here.
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

/** An id no node document names: the other end of a dangling edge (rusopkql). */
const MISSING_ID = "gone0000";

/**
 * The graph the entry checks post: the base graph plus one evaluation that
 * lists a real node and an id with no node document among the nodes it
 * evaluates, so one section shows both kinds of id.
 */
function entryRecords(): NodeRecord[] {
	return [
		...records(),
		{
			id: "dang0012",
			kind: "evaluation",
			dependsOn: ["pros0001"],
			evaluates: ["schm0005", MISSING_ID],
			content: {
				type: "test",
				ref: ["tests/dang0012.test.ts"],
				rationale: "RATIONALE-DANGLING",
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

/** Post a graph across the seam and let the page draw it. */
function post(posted: NodeRecord[]): void {
	main.receive({ type: "graph", records: posted, labels: {}, warnings: [] });
}

/** Post the base graph and let the page draw it. */
function show(): void {
	post(records());
}

/** Select a node the way a user does: a click on its drawn box. */
function select(id: string): void {
	const box = document.querySelector(`[data-node-id="${id}"]`);
	if (box === null) {
		throw new Error(`the graph drew no box for ${id}`);
	}
	clickPointer(box);
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

// ------------------------------------------------ acting on a listed id

/** An element's text as a reader sees it, whitespace collapsed. */
function collapsed(element: Element): string {
	return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** The text the whole detail region shows now, whitespace collapsed. */
function detailText(): string {
	return collapsed(detail());
}

/**
 * The deepest element of a section that shows `id`: the id's own element when
 * the page marks the entry up, else the block that carries it. The section's
 * label elements are left out, so a label is never mistaken for an entry.
 */
function entryShown(label: Label, id: string): Element {
	const labels = labelNodes().map((match) => match.element);
	const candidates: Element[] = [];
	for (const part of sectionOf(label)) {
		for (const element of [part, ...Array.from(part.querySelectorAll("*"))]) {
			if (labels.some((ownLabel) => element === ownLabel || element.contains(ownLabel))) {
				continue;
			}
			if (collapsed(element).includes(id)) {
				candidates.push(element);
			}
		}
	}
	const innermost = candidates.filter(
		(element) => !candidates.some((other) => other !== element && element.contains(other)),
	);
	expect(
		innermost.length,
		`the detail region shows no ${id} in its ${label} section`,
	).toBeGreaterThan(0);
	return innermost[0];
}

/** Whether `element` takes the keyboard focus (the entry may be any focusable element). */
function takesFocus(element: Element): boolean {
	if (!(element instanceof HTMLElement)) {
		return false;
	}
	const before = document.activeElement;
	element.focus();
	const focused = document.activeElement === element;
	if (!focused && before instanceof HTMLElement) {
		before.focus();
	}
	return focused;
}

/**
 * The control an id is listed as: the element that carries it, or the element
 * around it that takes the keyboard focus — the page may wrap the id in a
 * button, a link or any focusable element rather than make the id's own
 * element the control.
 */
function entryControl(label: Label, id: string): Element | undefined {
	const entry = entryShown(label, id);
	const region = sectionOf(label);
	for (
		let candidate: Element | null = entry;
		candidate !== null;
		candidate = candidate.parentElement
	) {
		if (takesFocus(candidate)) {
			return candidate;
		}
		if (region.includes(candidate)) {
			break;
		}
	}
	return undefined;
}

// ------------------------------------------------------- the pointer gesture

/**
 * The pointer capture a browser keeps while a gesture runs, modelled here.
 *
 * jsdom implements no pointer capture: `Element.prototype` carries none of
 * `setPointerCapture`, `releasePointerCapture` or `hasPointerCapture`, so a
 * page that captures the pointer on its own press keeps working here for a
 * reason a browser does not give it — and a check that addressed the click to
 * the entry by hand would not notice. The model keeps the browser's
 * bookkeeping: the element each pointer id was captured on, until it is
 * released, explicitly by the page or implicitly by the `pointerup` that ends
 * the gesture.
 */
const CAPTURED_ON = new Map<number, Element>();

/** Install the capture model the gesture below reads, in place of jsdom's silence. */
function capturePointers(): void {
	Element.prototype.setPointerCapture = function (this: Element, pointerId: number): void {
		CAPTURED_ON.set(pointerId, this);
	};
	Element.prototype.releasePointerCapture = function (this: Element, pointerId: number): void {
		if (CAPTURED_ON.get(pointerId) === this) {
			CAPTURED_ON.delete(pointerId);
		}
	};
	Element.prototype.hasPointerCapture = function (this: Element, pointerId: number): boolean {
		return CAPTURED_ON.get(pointerId) === this;
	};
}

/** The pointer id the next gesture runs under: each gesture gets its own. */
let NEXT_POINTER_ID = 0;

/** Where a gesture lands: jsdom has no layout, so the point is the origin. */
const AT = { clientX: 0, clientY: 0 };

/** The nearest ancestor of `a` that also holds `b`, the two included. */
function commonAncestor(a: Element, b: Element): Element {
	if (a.contains(b)) {
		return a;
	}
	if (b.contains(a)) {
		return b;
	}
	for (let candidate = a.parentElement; candidate !== null; candidate = candidate.parentElement) {
		if (candidate.contains(b)) {
			return candidate;
		}
	}
	return document.documentElement;
}

/**
 * Press and release the primary pointer on `target` — what a user does with a
 * mouse, a pen or a finger — and answer the element a browser addresses the
 * compatibility `click` to: the element that captured the pointer if one holds
 * it for this pointer, otherwise the nearest common inclusive ancestor of the
 * press and of the release target.
 */
function pressAndRelease(target: Element): Element {
	NEXT_POINTER_ID += 1;
	const pointerId = NEXT_POINTER_ID;
	const press = {
		pointerId,
		isPrimary: true,
		pointerType: "mouse",
		button: 0,
		buttons: 1,
		bubbles: true,
		cancelable: true,
		composed: true,
		...AT,
	};
	const down = new PointerEvent("pointerdown", press);
	target.dispatchEvent(down);
	const up = new PointerEvent("pointerup", { ...press, buttons: 0 });
	target.dispatchEvent(up);
	const from = down.target instanceof Element ? down.target : target;
	const to = up.target instanceof Element ? up.target : target;
	// The capture ends with the release: implicit release of pointer capture.
	const capturing = CAPTURED_ON.get(pointerId);
	CAPTURED_ON.delete(pointerId);
	return capturing ?? commonAncestor(from, to);
}

/**
 * Click `target` the way a user does: a primary press and release, then the
 * compatibility click a browser adds after them, addressed where a browser
 * addresses it. Handing the click to the entry is not a click: a page whose
 * entry sits inside the element the page captures the pointer on receives no
 * click at the entry, and this helper does not invent one.
 */
function clickPointer(target: Element): void {
	pressAndRelease(target).dispatchEvent(
		new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			composed: true,
			button: 0,
			detail: 1,
			...AT,
		}),
	);
}

// ------------------------------------------- the case class of a listed id

/**
 * The two class names the entry vocabulary fixes (sqwusxql), quoted as the
 * record spells them: one for a listed entry whose id names a node document,
 * one for a listed entry whose id names none.
 */
const ENTRY_CASE = "detail__entry";
const INERT_CASE = "detail__entry--inert";

/** The case classes an element carries, out of the two the vocabulary fixes. */
function caseClassesOf(element: Element): string[] {
	return [ENTRY_CASE, INERT_CASE].filter((name) => element.classList.contains(name));
}

/**
 * The elements that hold one listed entry: the element that shows the id and
 * the wrappers around it that show nothing else. The vocabulary fixes the two
 * class names, not the element that carries them, so the class is read from
 * the run of elements that hold this id and no other text.
 */
function entryHolders(label: Label, id: string): Element[] {
	const labels = labelNodes().map((match) => match.element);
	const holders: Element[] = [];
	for (const part of sectionOf(label)) {
		for (const element of [part, ...Array.from(part.querySelectorAll("*"))]) {
			if (labels.some((own) => element === own || element.contains(own))) {
				continue;
			}
			if (collapsed(element) === id) {
				holders.push(element);
			}
		}
	}
	return holders;
}

/** The case classes found on an entry, said in words for a failure message. */
function describeClasses(found: readonly string[]): string {
	if (found.length === 0) {
		return `no entry class (neither ${ENTRY_CASE} nor ${INERT_CASE})`;
	}
	return found.join(" and ");
}

/** The case classes the elements holding one listed entry carry, in all. */
function entryCaseClasses(label: Label, id: string): string[] {
	const holders = entryHolders(label, id);
	expect(
		holders.length,
		`the ${label} of the detail region shows no element that holds ${id} on its own`,
	).toBeGreaterThan(0);
	const found = new Set<string>();
	for (const holder of holders) {
		for (const name of caseClassesOf(holder)) {
			found.add(name);
		}
	}
	return [...found];
}

/** The whole class list an element carries, said in words for a failure message. */
function describeWholeClassList(element: Element): string {
	const names = [...element.classList];
	return names.length === 0 ? "no class at all" : names.join(" and ");
}

/**
 * The class list of a listed entry is the one name its case carries and
 * nothing beside it (sqwusxql): the element of the entry that shows the id
 * carries that name alone — no third class, no further modifier on either
 * name, and never both names — and no element of the entry spells a further
 * name out of the two, so the two recorded names are the whole of what an
 * entry is marked with.
 */
function expectExactCaseClass(label: Label, id: string, expected: string): void {
	const holders = entryHolders(label, id);
	expect(
		holders.length,
		`the ${label} of the detail region shows no element that holds ${id} on its own`,
	).toBeGreaterThan(0);

	// The element of the entry that shows the id: its class list is exactly the
	// name of its case, so nothing sits beside it and the other case is absent.
	const innermost = holders.filter(
		(holder) => !holders.some((other) => other !== holder && holder.contains(other)),
	);
	for (const holder of innermost) {
		const names = [...holder.classList];
		expect(
			names,
			`${id} in the ${label} shows it with ${describeWholeClassList(holder)}, where its class list is ${expected} alone`,
		).toEqual(names.includes(expected) ? [expected] : []);
	}

	// The whole entry: the two recorded names are the vocabulary, so the entry
	// carries its own case's name as the only entry name on it.
	const marked = new Set<string>();
	for (const holder of holders) {
		for (const name of holder.classList) {
			if (name === ENTRY_CASE || name.startsWith(`${ENTRY_CASE}--`)) {
				marked.add(name);
			}
		}
	}
	expect(
		[...marked].sort(),
		`${id} in the ${label} is marked ${describeClasses([...marked])}, where the vocabulary names it ${expected} alone`,
	).toEqual([expected]);
}

/** An id as the fixtures spell them: four letters and four digits. */
const ID_SHAPE = /^[a-z]{4}[0-9]{4}$/;

/**
 * Every entry a section lists: the innermost elements that show an id and
 * nothing else, so a wrapper is told apart from the element showing the id.
 */
function listedEntries(label: Label): { id: string; holder: Element }[] {
	const labels = labelNodes().map((match) => match.element);
	const holders: Element[] = [];
	for (const part of sectionOf(label)) {
		for (const element of [part, ...Array.from(part.querySelectorAll("*"))]) {
			if (labels.some((own) => element === own || element.contains(own))) {
				continue;
			}
			if (ID_SHAPE.test(collapsed(element))) {
				holders.push(element);
			}
		}
	}
	return holders
		.filter((element) => !holders.some((other) => other !== element && element.contains(other)))
		.map((element) => ({ id: collapsed(element), holder: element }));
}

/**
 * Whether the browser itself turns a keypress on `element` into a click: the
 * native controls that activate on Enter/Space and fire their own click — a
 * button, a link that has an href to follow, a submit/button/reset/image form
 * control, and a summary in a details.
 */
function activatesItselfOnKey(element: Element): boolean {
	const summary = (
		globalThis as unknown as { HTMLSummaryElement?: typeof HTMLElement }
	).HTMLSummaryElement;
	if (summary !== undefined && element instanceof summary) {
		return true;
	}
	// jsdom defines no HTMLSummaryElement interface, so a summary is recognised
	// by its tag name as well: it is the one control the browser activates that
	// has no constructor here to test against.
	if (element.tagName === "SUMMARY") {
		return true;
	}
	if (element instanceof HTMLButtonElement) {
		return true;
	}
	if (element instanceof HTMLAnchorElement) {
		return (element.getAttribute("href") ?? "") !== "";
	}
	if (element instanceof HTMLInputElement) {
		return ["submit", "button", "reset", "image"].includes(element.type);
	}
	return false;
}

/**
 * Press `key` on a focused entry.
 *
 * A native control gets the click as well, because the browser itself activates
 * it on Enter/Space and jsdom runs none of that activation, so the click the
 * browser would fire has to be dispatched once the key event left the detail as
 * it was — the same way the summary activation above applies a toggle jsdom did
 * not apply.
 *
 * Any other element — a span with a button role, a div, anything custom — gets
 * no click: nothing in a browser activates it on a keypress, so its keyboard
 * activation is the page's own obligation, and a fallback click would hide an
 * entry that has no keyboard handler at all by letting the click do the work.
 */
function pressKey(entry: Element, key: string): void {
	const before = detailText();
	entry.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
	if (activatesItselfOnKey(entry) && detailText() === before) {
		entry.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
	}
}

/** What the page shows for `id` when its own box is clicked, on `posted`. */
function clickedDetail(posted: NodeRecord[], id: string): string {
	post(posted);
	select(id);
	return detailText();
}

// ------------------------------------------- the entry a ref path is shown as

/**
 * The class a ref-path entry is named by (ppkkmxxu), quoted as the record
 * spells it: the entry's whole class, one whole name whose rules the stylesheet
 * writes, so the entry never reads as a listed-entry case or as a name with a
 * modifier beside it.
 */
const REF_PATH_ENTRY = "detail__ref";

/**
 * The deepest element of the Content section that shows `path`: the entry the
 * panel gives that path, or — when the panel shows the list as one block of
 * bare text — the block that shows the type and every path at once.
 */
function shownPathElement(path: string): Element | undefined {
	const candidates: Element[] = [];
	for (const part of sectionOf("content")) {
		for (const element of [part, ...Array.from(part.querySelectorAll("*"))]) {
			if (collapsed(element).includes(path)) {
				candidates.push(element);
			}
		}
	}
	return candidates.find(
		(element) => !candidates.some((other) => other !== element && element.contains(other)),
	);
}

/**
 * The entry one ref path is shown as: the element that holds that path and
 * nothing else. A block of bare text that holds the type and every path is not
 * an entry for any of them.
 */
function refPathEntry(path: string): Element {
	const shown = shownPathElement(path);
	expect(shown, `the detail region's Content section shows no ${path} at all`).toBeDefined();
	expect(
		collapsed(shown!),
		`the Content section shows ${path} with "${collapsed(shown!)}", where a ref path is an entry of its own and not bare text in the block`,
	).toBe(path);
	return shown!;
}

/**
 * The elements of the Content section that hold one ref path: the entry and the
 * wrappers around it that show nothing else. The record fixes the class, not
 * the element that carries it, so the mark is read from that run.
 */
function refPathHolders(path: string): Element[] {
	const holders: Element[] = [];
	for (const part of sectionOf("content")) {
		for (const element of [part, ...Array.from(part.querySelectorAll("*"))]) {
			if (collapsed(element) === path) {
				holders.push(element);
			}
		}
	}
	return holders;
}

beforeAll(async () => {
	const parsed = new DOMParser().parseFromString(PAGE, "text/html");
	document.body.replaceChildren(
		...[...parsed.body.children].map((child) => document.adoptNode(child)),
	);
	const canvas = document.querySelector(SELECTORS.canvas) as unknown as HTMLElement;
	Object.defineProperty(canvas, "clientWidth", { value: 800 });
	Object.defineProperty(canvas, "clientHeight", { value: 600 });
	// jsdom runs no pointer capture; the gesture model keeps the browser's.
	capturePointers();
	(globalThis as unknown as Record<string, unknown>).acquireVsCodeApi = (): unknown => ({
		postMessage: (): void => undefined,
		getState: (): unknown => undefined,
		setState: (): void => undefined,
	});
	// The source entry, not the built src/webview/main.js beside it: the gate
	// must drive the page module this unit owns.
	main = await import("../../src/webview/main.ts");
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

describe("a listed relationship id activates the node it names (kwxutvpw)", () => {
	/** One id each of the four relationship sections lists, and how to reach it. */
	const LISTED: readonly (readonly [string, Label, string])[] = [
		["pros0001", "depends_on", "schm0005"],
		["pros0001", "dependents", "eval0011"],
		["eval0011", "evaluates", "schm0005"],
		["schm0005", "evaluators", "eval0011"],
	];

	test("a pointer click on a listed id shows the detail of the node it names, as its box does", () => {
		for (const [from, label, listed] of LISTED) {
			// What the page shows when the node's own box is clicked.
			const byBox = clickedDetail(records(), listed);

			post(records());
			select(from);
			clickPointer(entryShown(label, listed));

			expect(
				detailText(),
				`clicking ${listed} in the ${label} of ${from} did not show ${listed}'s detail`,
			).toBe(byBox);
		}
	});

	test("Enter and Space on a focused listed id show the detail of the node it names", () => {
		for (const [from, label, listed] of LISTED) {
			const byBox = clickedDetail(records(), listed);

			for (const key of ["Enter", " "]) {
				post(records());
				select(from);

				const control = entryControl(label, listed);
				expect(
					control,
					`the ${label} of ${from} lists ${listed} as text, not as a focusable entry`,
				).toBeDefined();
				expect(
					takesFocus(control!),
					`the entry for ${listed} in the ${label} of ${from} did not take the focus`,
				).toBe(true);

				pressKey(control!, key);

				expect(
					detailText(),
					`${key === " " ? "Space" : key} on ${listed} in the ${label} of ${from} did not show ${listed}'s detail`,
				).toBe(byBox);
			}
		}
	});
});

describe("an id whose other edge end names no node document is listed but inert (rusopkql)", () => {
	test("it is listed, and neither a click nor a key on it changes the detail", () => {
		post(entryRecords());
		select("dang0012");

		// Listed: the section shows the id no node document names beside a real one.
		expect(entriesOf("evaluates")).toContain(MISSING_ID);
		expect(entriesOf("evaluates")).toContain("schm0005");

		const before = detailText();
		const entry = entryShown("evaluates", MISSING_ID);

		clickPointer(entry);
		expect(detailText(), `clicking the dangling id ${MISSING_ID} changed the detail`).toBe(before);

		for (const key of ["Enter", " "]) {
			entry.dispatchEvent(
				new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
			);
		}
		expect(detailText(), `a key on the dangling id ${MISSING_ID} changed the detail`).toBe(before);

		// The real id beside it still activates: the inertness is the missing id's.
		clickPointer(entryShown("evaluates", "schm0005"));
		expect(sectionText("rationale")).toContain("RATIONALE-SCHEMA");
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

describe("each listed id is marked with the class of its case (sqwusxql)", () => {
	/**
	 * One listed id per section, and whether its id names a node document. The
	 * graph posted is the entry graph, so one evaluation lists a real id beside
	 * one no node document names.
	 */
	const CASES: readonly (readonly [string, Label, string, boolean])[] = [
		["dang0012", "depends_on", "pros0001", true],
		["dang0012", "evaluates", "schm0005", true],
		["dang0012", "evaluates", MISSING_ID, false],
		["pros0001", "depends_on", "schm0005", true],
		["pros0001", "dependents", "eval0011", true],
		["pros0001", "dependents", "dang0012", true],
		["eval0011", "depends_on", "pros0001", true],
		["eval0011", "evaluates", "schm0005", true],
		["schm0005", "dependents", "pros0001", true],
		["schm0005", "evaluators", "eval0011", true],
		["schm0005", "evaluators", "dang0012", true],
	];

	test("an id that names a node document carries detail__entry, an id that names none detail__entry--inert", () => {
		for (const [from, label, id, names] of CASES) {
			post(entryRecords());
			select(from);

			const found = entryCaseClasses(label, id);
			expect(
				found,
				`${id} in the ${label} of ${from} carries ${describeClasses(found)}`,
			).toEqual([names ? ENTRY_CASE : INERT_CASE]);
			expectExactCaseClass(label, id, names ? ENTRY_CASE : INERT_CASE);
		}
	});

	test("no listed entry is left unclassified, and none carries both classes", () => {
		for (const from of ["pros0001", "eval0011", "schm0005", "dang0012"]) {
			post(entryRecords());
			select(from);

			let seen = 0;
			for (const label of ["depends_on", "evaluates", "dependents", "evaluators"] as const) {
				for (const entry of listedEntries(label)) {
					seen += 1;
					const found = caseClassesOf(entry.holder);
					expect(
						found,
						`${entry.id} in the ${label} of ${from} carries ${describeClasses(found)}`,
					).toHaveLength(1);
					expectExactCaseClass(
						label,
						entry.id,
						entry.id === MISSING_ID ? INERT_CASE : ENTRY_CASE,
					);
				}
			}
			expect(seen, `the detail of ${from} lists no relationship entry at all`).toBeGreaterThan(0);
		}
	});
});

describe("a Content ref path is an entry marked detail__ref (ppkkmxxu)", () => {
	/** The two repo-relative paths the fixture node's content lives in. */
	const PATHS = ["schemas/node.json", "docs/format.md"] as const;

	test("each path of a ref list is an entry of its own inside the monospaced block", () => {
		show();
		select("path0009");

		const blocks = monoBlocks("content");
		expect(
			blocks.length,
			"the ref path list is not shown in the Content section's monospaced block",
		).toBeGreaterThan(0);

		for (const path of PATHS) {
			const entry = refPathEntry(path);
			// The path keeps its place in that block, where the content type is
			// shown with it (qwzwpxws).
			expect(
				blocks.some((block) => block.contains(entry)),
				`${path} is shown outside the Content section's monospaced block`,
			).toBe(true);
			// It is an entry for that path alone: the type and the other path of
			// the list are not part of it.
			expect(
				collapsed(entry),
				`${path} is shown holding more than its own path`,
			).toBe(path);
		}

		// The block still carries the type and both paths (qwzwpxws).
		const listed = blocks
			.map((block) => blockText(block))
			.find((text) => text.includes(PATHS[0]));
		expect(listed, `the block shows no ${PATHS[0]}`).toBeDefined();
		expect(listed).toContain(PATHS[1]);
		expect(listed).toContain("json-schema");
	});

	test("the entry carries detail__ref as its whole class, and no further name", () => {
		show();
		select("path0009");

		for (const path of PATHS) {
			const entry = refPathEntry(path);

			// The class list of the element that shows the path is that one name.
			expect(
				[...entry.classList],
				`${path} is shown with ${describeWholeClassList(entry)}, where its whole class is ${REF_PATH_ENTRY}`,
			).toEqual([REF_PATH_ENTRY]);

			// The entry carries no further name out of that one, and the two
			// listed-entry names stay the relationship sections' (sqwusxql): a
			// modifier, a second ref-path name or a listed-entry case beside it is
			// read as the extra name it is.
			for (const holder of refPathHolders(path)) {
				const names = [...holder.classList];
				expect(
					names.filter(
						(name) =>
							(name.startsWith(REF_PATH_ENTRY) && name !== REF_PATH_ENTRY) ||
							name === ENTRY_CASE ||
							name.startsWith(`${ENTRY_CASE}--`),
					),
					`${path} is marked with ${describeWholeClassList(holder)}, where a ref path is marked ${REF_PATH_ENTRY} and nothing beside it`,
				).toEqual([]);
			}
		}
	});
});
