// @vitest-environment jsdom
/**
 * Composition check for the page (tpztomkv): the page composition owns
 * `media/webview.html` and `src/webview/main.ts` and mounts the renderer, the
 * interactions, the presentation, the detail panel and the search module on
 * the page it serves.
 *
 * The real page is parsed from `media/webview.html`, its body is adopted into
 * jsdom, and the real entry point (`src/webview/main.ts`) is loaded into it —
 * the source entry, not the built `src/webview/main.js` beside it. A graph is
 * posted across the page seam the way the extension host posts it, and the
 * page is driven as a user drives it: a node box is clicked, the toolbar's fit
 * action is pressed, `/` is typed, the query is typed into the field, Enter
 * and Esc are pressed. Nothing between the message and the page's own elements
 * is stubbed.
 *
 * What the check reads is the page as composed:
 *
 * - the page regions the page interface names (ympqvvwr, zrqxuzzy) exist and
 *   the renderer has drawn the graph into the canvas layers (rtlotqvy);
 * - clicking a node updates the detail region (noplrntp, vqwoptmu, yrtrqutm,
 *   qwzwpxws, rmovtvkt) and a graph's warnings reach the banner (yruxqknp);
 * - the toolbar's fit action is wired to the interaction state (mspmqvuk);
 * - the search module (uryrrttr) is mounted: `/` opens a focused field,
 *   typing marks the matching node boxes, Enter selects a marked node and
 *   updates the detail region, Esc closes the field and clears the marks and
 *   the selection;
 * - a reload posts a new graph and the active query and its marks are applied
 *   to the new graph without losing the selection (ukuppmko, luqwqrll);
 * - the page links the search stylesheet, and the composition attaches the
 *   search once and leaves no search state behind when the page is torn down.
 * - an id the detail panel lists in one of its four relationship sections is
 *   activated as an entry of the page — a pointer press and release, and the
 *   compatibility click a browser adds after them — and the activation reaches
 *   the interaction state the same way clicking the node's box does: the named
 *   node becomes the selection and its detail is shown, while an id whose edge
 *   names no node document stays listed and changes nothing (kwxutvpw,
 *   rusopkql). The gesture is a user's: jsdom keeps no pointer capture of its
 *   own, so the harness supplies the browser's bookkeeping and addresses the
 *   click the way a browser does — to the element that captured the pointer if
 *   one holds it for that pointer, otherwise to the nearest common inclusive
 *   ancestor of the press and the release — so an entry the page can only
 *   reach by a click dispatched at it by hand is not activated here.
 * - every listed entry is marked with the class its case is named by
 *   (sqwusxql): an id that names a node document carries "detail__entry" and
 *   an id that names none carries "detail__entry--inert", exactly one of the
 *   two on any listed entry, in a section listing both cases as well as in one
 *   listing a single case. Each entry's class list is read whole rather than
 *   filtered down to the two names, so the vocabulary is exactly what the
 *   entry is marked with: a name beside the case class, a further modifier
 *   spelled out of the two, or a second entry name is read as the extra name
 *   it is. The names are the record's and are quoted here as
 *   it spells them; which element of the entry carries the class is not fixed,
 *   so it is read from the element that shows the id and the wrappers around
 *   it that show nothing else. The declarations those classes select are the
 *   stylesheet's own commitments and are not read here.
 * - a Content ref path is an entry of its own inside the section's monospaced
 *   block, marked "detail__ref" as its whole class (ppkkmxxu), and is a
 *   control of the page: a pointer press and release, or Enter or Space while
 *   it has the focus, posts the page's request for that repo-relative path to
 *   be opened, through the seam the page already declares (rptlovpt). The
 *   request is read as one page message carrying that path as a value of its
 *   own — one request per activation, naming neither the node nor the list's
 *   other path — so no message name, field name or host-side rule is fixed
 *   here.
 *
 * The check names no function, class, tag or nesting the record does not fix:
 * it finds the regions through the page interface's own selectors, finds the
 * marks through the search module's exported match class, finds the query
 * field as the focused input the page put over the canvas, and finds a listed
 * id as the element that shows it inside the section the panel labels.
 */
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { EmphasisClasses, NODE_ID_ATTR, SELECTORS } from "../../src/webview/contract";
import { SEARCH_MATCH_CLASS } from "../../src/webview/search";
import type * as Main from "../../src/webview/main";

const PAGE = readFileSync("media/webview.html", "utf8");
/**
 * The stylesheets the page links, read from the page's own head: the body is
 * adopted into jsdom, the head is not, so the links are read here.
 */
const PAGE_STYLESHEETS = Array.from(
	new DOMParser()
		.parseFromString(PAGE, "text/html")
		.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
).map((link) => link.getAttribute("href") ?? "");

/** The query the check types: it appears in two labels of the base graph. */
const QUERY = "matchme";

/** The nodes of the base graph and the node a reload adds. */
const ALPHA = "aaaa0001";
const BETA = "bbbb0002";
const GAMMA = "cccc0003";
const DELTA = "dddd0004";
const EPSILON = "eeee0005";
const BASE = [ALPHA, BETA, GAMMA, DELTA] as const;

/** An id no node document names: the other end of a dangling edge (rusopkql). */
const MISSING = "ffff9999";
/** The node that lists the id no node document names among its prerequisites. */
const ZETA = "gggg0006";
/**
 * The node whose prerequisites hold both cases at once: an id that names a
 * node document beside one that names none, in one relationship section.
 */
const ETA = "hhhh0007";

/**
 * The node whose content lives in two repo-relative files (qwzwpxws): the ref
 * paths the layer's check shows as entries and activates (rptlovpt,
 * ppkkmxxu).
 */
const THETA = "iiii0008";
/** The repo-relative paths THETA's content.ref lists, in the order it lists them. */
const REF_PATHS = ["schemas/node.json", "docs/format.md"] as const;

/** The labels the host posts with the graph, keyed by node id. */
const LABELS: Readonly<Record<string, string>> = {
	[ALPHA]: "alpha matchme",
	[BETA]: "beta",
	[GAMMA]: "gamma matchme",
	[DELTA]: "delta",
	[EPSILON]: "epsilon matchme",
};

/** The body marker the detail region shows for each node the query marks. */
const MARKERS: Readonly<Record<string, string>> = {
	[ALPHA]: "ALPHA-BODY",
	[GAMMA]: "GAMMA-BODY",
};

/** The full record set; a posted graph is this set filtered to its ids. */
function allRecords(): NodeRecord[] {
	return [
		{
			id: ALPHA,
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "ALPHA-BODY the first node.",
				rationale: "RATIONALE-ALPHA why alpha exists",
			},
		},
		{
			id: BETA,
			kind: "evaluation",
			dependsOn: [ALPHA],
			evaluates: [ALPHA],
			content: {
				type: "test",
				ref: ["tests/alpha.test.ts"],
				rationale: "RATIONALE-BETA why beta exists",
			},
		},
		{
			id: GAMMA,
			kind: "decision",
			dependsOn: [ALPHA],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "GAMMA-BODY the third node.",
				rationale: "RATIONALE-GAMMA why gamma exists",
			},
		},
		{
			id: DELTA,
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "DELTA-BODY the fourth node.",
				rationale: "RATIONALE-DELTA why delta exists",
			},
		},
		{
			id: EPSILON,
			kind: "decision",
			dependsOn: [GAMMA],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "EPSILON-BODY the node the reload adds.",
				rationale: "RATIONALE-EPSILON why epsilon exists",
			},
		},
		{
			id: ZETA,
			kind: "decision",
			dependsOn: [MISSING],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "ZETA-BODY the node whose prerequisite has no node document.",
				rationale: "RATIONALE-ZETA why zeta exists",
			},
		},
		{
			id: ETA,
			kind: "decision",
			dependsOn: [ALPHA, MISSING],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "ETA-BODY the node whose prerequisites hold both cases.",
				rationale: "RATIONALE-ETA why eta exists",
			},
		},
		{
			id: THETA,
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "json-schema",
				ref: [...REF_PATHS],
				rationale: "RATIONALE-THETA why theta exists",
			},
		},
	];
}

// --------------------------------------------------------------- the page

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

/**
 * The messages the page posted through its seam (PageMessage in main.ts): the
 * check reads what the page asks the host for, not a host-side rule for
 * answering it.
 */
const POSTED: unknown[] = [];

let main: typeof Main;
let canvas: HTMLElement;
let surface: HTMLElement;
let nodesLayer: HTMLElement;
let edgesLayer: SVGSVGElement;
let banner: HTMLElement;
let detailBody: HTMLElement;
let fitButton: HTMLButtonElement;

beforeAll(async () => {
	const parsed = new DOMParser().parseFromString(PAGE, "text/html");
	document.body.replaceChildren(
		...[...parsed.body.children].map((child) => document.adoptNode(child)),
	);

	canvas = mustGet<HTMLElement>(SELECTORS.canvas);
	surface = mustGet<HTMLElement>(SELECTORS.surface);
	nodesLayer = mustGet<HTMLElement>(SELECTORS.nodes);
	edgesLayer = mustGet<SVGSVGElement>(SELECTORS.edges);
	banner = mustGet<HTMLElement>(SELECTORS.banner);
	detailBody = mustGet<HTMLElement>(SELECTORS.detailBody);
	fitButton = mustGet<HTMLButtonElement>(SELECTORS.fitAction);

	// The page is a live webview region; jsdom has no layout, so the size the
	// interactions fit, pan and zoom against is given to it. jsdom runs no
	// pointer capture either; the gesture model keeps the browser's.
	Object.defineProperty(canvas, "clientWidth", { value: 800, configurable: true });
	Object.defineProperty(canvas, "clientHeight", { value: 600, configurable: true });
	capturePointers();

	(globalThis as unknown as Record<string, unknown>).acquireVsCodeApi = (): unknown => ({
		postMessage: (message: unknown): void => {
			POSTED.push(message);
		},
		getState: (): unknown => undefined,
		setState: (): void => undefined,
	});

	main = await import("../../src/webview/main.ts");
});

function mustGet<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (element === null) {
		throw new Error(`media/webview.html is missing ${selector}`);
	}
	return element;
}

/** Post a graph across the page seam, the way the host posts it. */
function postGraph(ids: readonly string[], warnings: readonly string[] = []): void {
	const wanted = new Set(ids);
	main.receive({
		type: "graph",
		records: allRecords().filter((record) => wanted.has(record.id)),
		labels: LABELS,
		warnings,
	});
}

/** The drawn node boxes, in the order the renderer drew them. */
function boxes(): HTMLElement[] {
	return Array.from(nodesLayer.querySelectorAll<HTMLElement>(`[${NODE_ID_ATTR}]`));
}

function boxIds(): string[] {
	return boxes()
		.map((box) => box.getAttribute(NODE_ID_ATTR) ?? "")
		.filter((id) => id.length > 0);
}

function boxOf(id: string): HTMLElement {
	const box = boxes().find((candidate) => candidate.getAttribute(NODE_ID_ATTR) === id);
	if (box === undefined) {
		throw new Error(`the page drew no box for ${id}`);
	}
	return box;
}

/** The node box carrying the selection emphasis, if one does. */
function selectedId(): string | null {
	const selected = boxes().find((box) => box.classList.contains(EmphasisClasses.selected));
	return selected?.getAttribute(NODE_ID_ATTR) ?? null;
}

/** The id of every box the active query marks. */
function markedIds(): string[] {
	return boxes()
		.filter((box) => box.classList.contains(SEARCH_MATCH_CLASS))
		.map((box) => box.getAttribute(NODE_ID_ATTR) ?? "")
		.filter((id) => id.length > 0);
}

/** The query field the page put over the canvas, if the search is open. */
function field(): HTMLInputElement | null {
	return canvas.querySelector<HTMLInputElement>("input");
}

/** Select a node the way a user does: a click on its drawn box. */
function select(id: string): void {
	clickPointer(boxOf(id));
}

/** Press a key on `target`; the page binds the search on the document. */
function pressKey(target: EventTarget, key: string, shiftKey = false): void {
	target.dispatchEvent(
		new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }),
	);
}

/** Type `text` into the field as a user does: its value changes on input. */
function type(input: HTMLInputElement, text: string): void {
	input.value = text;
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Start every test from the base graph with nothing selected and the search closed. */
function reset(): void {
	if (field() !== null) {
		pressKey(document.body, "Escape");
	}
	postGraph(BASE);
	// A click on empty canvas clears the selection (oumoznwq).
	clickPointer(canvas);
	// Only what a check does from here on is read off the seam.
	POSTED.length = 0;
}

beforeEach(reset);

// ------------------------------------------------- acting on a listed id

/** The detail panel's relationship sections, by the label word each one shows. */
const RELATIONSHIP_LABELS = ["depends_on", "evaluates", "dependents", "evaluators"] as const;
type Relationship = (typeof RELATIONSHIP_LABELS)[number];

/**
 * The sections this check reads by their label word: the four relationship
 * sections and the Content section, whose ref-path entries the layer's check
 * activates. The label word is all it reads of the panel's framing.
 */
const SECTION_LABELS = ["content", ...RELATIONSHIP_LABELS] as const;
type SectionLabel = (typeof SECTION_LABELS)[number];

/** An element's text as a reader sees it, whitespace collapsed. */
function collapsed(element: Element): string {
	return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** The detail region's text now, whitespace collapsed. */
function detailText(): string {
	return collapsed(detailBody);
}

/**
 * The elements that carry one section label, innermost first: an element whose
 * own text is the label word. A wrapper that repeats a label is the same
 * label and is dropped.
 */
function labelNodes(): { label: SectionLabel; element: Element }[] {
	const matches: { label: SectionLabel; element: Element }[] = [];
	for (const element of Array.from(detailBody.querySelectorAll("*"))) {
		const text = (element.textContent ?? "").trim().toLowerCase();
		const label = SECTION_LABELS.find((candidate) => candidate === text);
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

/**
 * The region of one labelled section: the smallest element around the label
 * that holds no other section label, or — when the labels share one parent —
 * the label and the siblings that follow it up to the next label.
 */
function sectionOf(label: SectionLabel): Element[] {
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
	for (
		let sibling = own.nextElementSibling;
		sibling !== null;
		sibling = sibling.nextElementSibling
	) {
		if (others.some((other) => other === sibling || sibling!.contains(other))) {
			break;
		}
		parts.push(sibling);
	}
	return parts;
}

/** The text of one section, as the reader sees it now. */
function sectionText(label: SectionLabel): string {
	const parts = sectionOf(label);
	expect(parts.length, `the detail region has no ${label} section`).toBeGreaterThan(0);
	return parts.map((part) => collapsed(part)).join(" ");
}

/**
 * The deepest element of a section that shows `id`: the id's own element when
 * the page marks the entry up, else the block that carries it. The section's
 * label elements are left out, so a label is never mistaken for an entry.
 */
function entryShown(label: SectionLabel, id: string): Element {
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

/** The case classes found on an entry, said in words for a failure message. */
function describeClasses(found: readonly string[]): string {
	if (found.length === 0) {
		return `no entry class (neither ${ENTRY_CASE} nor ${INERT_CASE})`;
	}
	return found.join(" and ");
}

/**
 * The elements that hold one listed entry: the element that shows the id and
 * the wrappers around it that show nothing else. The vocabulary fixes the two
 * class names, not the element that carries them, so the class is read from
 * the run of elements that hold this id and no other text.
 */
function entryHolders(label: SectionLabel, id: string): Element[] {
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

/** The case classes the elements holding one listed entry carry, in all. */
function entryCaseClasses(label: SectionLabel, id: string): string[] {
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
function expectExactCaseClass(label: SectionLabel, id: string, expected: string): void {
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
function listedEntries(label: Relationship): { id: string; holder: Element }[] {
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

// ------------------------------------------- acting on a Content ref path

/**
 * The class a ref-path entry is named by (ppkkmxxu), quoted as the record
 * spells it: the entry's whole class, one whole name whose rules the stylesheet
 * writes.
 */
const REF_PATH_ENTRY = "detail__ref";

/** The monospaced blocks of a section: preformatted or code elements, outermost. */
function monoBlocks(label: SectionLabel): Element[] {
	const candidates: Element[] = [];
	for (const part of sectionOf(label)) {
		for (const element of [part, ...Array.from(part.querySelectorAll("pre, code"))]) {
			if (element.tagName === "PRE" || element.tagName === "CODE") {
				candidates.push(element);
			}
		}
	}
	return candidates.filter(
		(element) => !candidates.some((other) => other !== element && other.contains(element)),
	);
}

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
		`the Content section of the detail region shows ${path} with "${collapsed(shown!)}", where a ref path is an entry of its own and not bare text in the block`,
	).toBe(path);
	return shown!;
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
 * The control a ref path is: the element that carries it, or the element around
 * it that takes the keyboard focus — the page may make the path's own element
 * the control or wrap it in one.
 */
function refPathControl(path: string): Element | undefined {
	const entry = refPathEntry(path);
	const region = sectionOf("content");
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

/** The page messages posted while `act` ran. */
function postedDuring(act: () => void): unknown[] {
	const from = POSTED.length;
	act();
	return POSTED.slice(from);
}

/** The string values a page message carries, however the seam nests them. */
function stringValues(value: unknown, found: string[] = []): string[] {
	if (typeof value === "string") {
		found.push(value);
		return found;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			stringValues(item, found);
		}
		return found;
	}
	if (typeof value === "object" && value !== null) {
		for (const item of Object.values(value)) {
			stringValues(item, found);
		}
	}
	return found;
}

/** The requests to open one path: the messages that carry it as a value of their own. */
function requestsFor(path: string, posted: readonly unknown[]): unknown[] {
	return posted.filter((message) => stringValues(message).includes(path));
}

/** Page messages said in words for a failure message. */
function describePosts(posted: readonly unknown[]): string {
	return posted.length === 0
		? "no page message at all"
		: posted.map((message) => JSON.stringify(message)).join(", ");
}

/**
 * Press `key` on a focused entry.
 *
 * A native control gets the click as well, because the browser itself activates
 * it on Enter/Space and jsdom runs none of that activation, so the click the
 * browser would fire has to be dispatched once the key left the seam as it was.
 * Any other element gets no click: nothing in a browser activates it on a
 * keypress, so its keyboard activation is the page's own obligation, and a
 * fallback click would hide an entry that has no keyboard handler at all.
 */
function pressKeyOn(control: Element, key: string): void {
	const before = POSTED.length;
	control.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
	if (activatesItselfOnKey(control) && POSTED.length === before) {
		control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
	}
}

// ---------------------------------------------------------------- the checks

describe("the page serves the regions the composition mounts into (ympqvvwr, zrqxuzzy)", () => {
	test("every page region exists and the page links the search stylesheet", () => {
		for (const [name, selector] of Object.entries(SELECTORS)) {
			expect(document.querySelector(selector), `the page has no ${name} region (${selector})`).not
				.toBeNull();
		}

		const stylesheets = PAGE_STYLESHEETS;
		expect(
			stylesheets.some((href) => /(^|\/)styles\/search\.css$/.test(href)),
			`media/webview.html does not link src/styles/search.css (links: ${stylesheets.join(", ")})`,
		).toBe(true);
	});
});

describe("the page draws and presents the graph it is posted (rtlotqvy, noplrntp, yruxqknp)", () => {
	test("the renderer draws into the canvas layers and a click updates the detail region", () => {
		postGraph(BASE, ["nodes/aaaa0001.json: WARNING-MARK unreadable"]);

		// The renderer mounted: one box for each node in the node layer and
		// routed edges in the edge layer.
		expect(boxIds().sort()).toEqual([...BASE].sort());
		expect(
			edgesLayer.querySelectorAll("[data-edge-key]").length,
			"the renderer drew no edge into the edge layer",
		).toBeGreaterThan(0);

		// The presentation mounted: a posted warning reaches the banner.
		expect(banner.hidden, "the warning banner stayed hidden").toBe(false);
		expect(banner.textContent).toContain("WARNING-MARK");
		postGraph(BASE);
		expect(banner.hidden, "the banner did not clear on the next graph").toBe(true);

		expect(detailBody.textContent, "the detail region is not empty before a selection").toBe("");

		// The interactions mounted: clicking a box selects it and the page's
		// presentation renders its detail.
		select(ALPHA);
		expect(selectedId()).toBe(ALPHA);
		expect(detailBody.textContent).toContain("ALPHA-BODY");
		expect(detailBody.textContent).toContain("RATIONALE-ALPHA");
	});
});

describe("the toolbar's fit action is wired (mspmqvuk)", () => {
	test("pressing fit reframes the drawn graph", () => {
		postGraph(BASE);
		const before = surface.style.transform;
		expect(before).toMatch(/scale\(/);

		fitButton.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));

		const after = surface.style.transform;
		expect(after, "the fit action left the viewport where it was").not.toBe(before);
		expect(after).toMatch(/translate\([^)]*\) scale\([^)]*\)/);
	});
});

describe("the page mounts the search module (uryrrttr)", () => {
	test("`/` opens a focused field and typing marks the matching boxes", () => {
		postGraph(BASE);
		select(DELTA);

		pressKey(document.body, "/");

		const input = field();
		expect(input, "the page opened no search field on `/`").not.toBeNull();
		expect(document.activeElement, "the search field did not take focus").toBe(input);
		expect(input?.type).toBe("text");

		type(input!, QUERY);
		expect(markedIds().sort()).toEqual([ALPHA, GAMMA].sort());

		// Opening and typing the query leave the selection alone (nvxuyzot).
		expect(selectedId()).toBe(DELTA);
	});

	test("Enter selects a marked node and updates the detail region; Esc clears the search", () => {
		postGraph(BASE);

		pressKey(document.body, "/");
		const input = field();
		expect(input, "the page opened no search field on `/`").not.toBeNull();
		type(input!, QUERY);

		pressKey(input!, "Enter");

		const selected = selectedId();
		expect(selected, "Enter selected no marked node").not.toBeNull();
		expect([ALPHA, GAMMA]).toContain(selected);
		expect(boxOf(selected!).classList.contains(SEARCH_MATCH_CLASS)).toBe(true);
		expect(detailBody.textContent).toContain(MARKERS[selected!]);

		pressKey(input!, "Escape");

		expect(field(), "Esc did not close the search field").toBeNull();
		expect(markedIds(), "Esc left match marks behind").toEqual([]);
		expect(selectedId(), "Esc did not clear the selection").toBeNull();
		expect(detailBody.textContent, "Esc left the selected node's detail behind").toBe("");
	});

	test("a reload keeps the query, re-marks the new graph and keeps the selection (ukuppmko)", () => {
		postGraph(BASE);

		pressKey(document.body, "/");
		const input = field();
		expect(input, "the page opened no search field on `/`").not.toBeNull();
		type(input!, QUERY);
		pressKey(input!, "Enter");
		const selected = selectedId();
		expect(selected, "Enter selected no marked node").not.toBeNull();

		// The host reloads the node documents: the same graph plus one node the
		// active query also matches.
		postGraph([...BASE, EPSILON]);

		expect(field(), "the reload closed or replaced the search field").toBe(input);
		expect(input!.value, "the reload lost the active query").toBe(QUERY);
		expect(markedIds().sort()).toEqual([ALPHA, EPSILON, GAMMA].sort());
		expect(
			boxOf(EPSILON).classList.contains(SEARCH_MATCH_CLASS),
			"the reloaded graph was not marked by the active query",
		).toBe(true);
		expect(
			boxOf(DELTA).classList.contains(SEARCH_MATCH_CLASS),
			"a non-matching node of the reloaded graph was marked",
		).toBe(false);
		expect(selectedId(), "the reload lost the selection").toBe(selected);
		expect(detailBody.textContent).toContain(MARKERS[selected!]);

		// One controller, not one attached per graph.
		expect(canvas.querySelectorAll("input")).toHaveLength(1);
	});

	test("the page leaves no search state behind when it is torn down", () => {
		postGraph(BASE);
		pressKey(document.body, "/");
		const input = field();
		expect(input, "the page opened no search field on `/`").not.toBeNull();
		type(input!, QUERY);
		expect(markedIds().length).toBeGreaterThan(0);

		// A page may be torn down through any standard lifecycle notification.
		for (const name of ["pagehide", "beforeunload", "unload"]) {
			window.dispatchEvent(new Event(name));
		}

		expect(field(), "the search field survived the page teardown").toBeNull();
		expect(markedIds(), "the match marks survived the page teardown").toEqual([]);
	});
});

describe("activating a listed relationship id selects the node it names (kwxutvpw)", () => {
	/** One id each of the four relationship sections lists, and where it is listed. */
	const LISTED: readonly (readonly [string, Relationship, string])[] = [
		[ALPHA, "dependents", GAMMA],
		[ALPHA, "evaluators", BETA],
		[GAMMA, "depends_on", ALPHA],
		[BETA, "evaluates", ALPHA],
	];

	test("a click on a listed id selects it and shows its detail, as clicking its box does", () => {
		for (const [from, label, listed] of LISTED) {
			// What the page does when the node's own box is clicked.
			postGraph(BASE);
			select(listed);
			const byBox = detailText();
			expect(selectedId()).toBe(listed);

			postGraph(BASE);
			select(from);
			expect(selectedId()).toBe(from);

			clickPointer(entryShown(label, listed));

			expect(
				selectedId(),
				`clicking ${listed} in the ${label} of ${from} did not select it`,
			).toBe(listed);
			expect(
				detailText(),
				`clicking ${listed} in the ${label} of ${from} did not show its detail`,
			).toBe(byBox);
		}
	});
});

describe("an id whose other edge end names no node document is listed but inert (rusopkql)", () => {
	test("it is listed, and neither a click nor a key on it selects anything", () => {
		postGraph([...BASE, ZETA]);
		select(ZETA);
		expect(selectedId()).toBe(ZETA);

		// Listed: the section shows the id no node document names.
		expect(sectionText("depends_on")).toContain(MISSING);

		const before = detailText();
		const entry = entryShown("depends_on", MISSING);

		clickPointer(entry);
		for (const key of ["Enter", " "]) {
			entry.dispatchEvent(
				new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
			);
		}

		expect(selectedId(), `activating the dangling id ${MISSING} changed the selection`).toBe(ZETA);
		expect(detailText(), `activating the dangling id ${MISSING} changed the detail region`).toBe(
			before,
		);
	});
});

describe("each listed id is marked with the class of its case (sqwusxql)", () => {
	/**
	 * Listed ids that name a node document, and where the panel lists them: each
	 * of the four relationship sections, and a node as well as an evaluation.
	 */
	const RESOLVED: readonly (readonly [readonly string[], string, Relationship, string])[] = [
		[BASE, ALPHA, "dependents", GAMMA],
		[BASE, ALPHA, "evaluators", BETA],
		[BASE, BETA, "depends_on", ALPHA],
		[BASE, BETA, "evaluates", ALPHA],
		[BASE, GAMMA, "depends_on", ALPHA],
		[[...BASE, EPSILON], EPSILON, "depends_on", GAMMA],
	];

	test("an id that names a node document carries detail__entry, an id that names none detail__entry--inert", () => {
		for (const [ids, from, label, listed] of RESOLVED) {
			postGraph(ids);
			select(from);

			const found = entryCaseClasses(label, listed);
			expect(
				found,
				`${listed} in the ${label} of ${from} carries ${describeClasses(found)}`,
			).toEqual([ENTRY_CASE]);
			expectExactCaseClass(label, listed, ENTRY_CASE);
		}

		// The id no node document names is the other case, in its own section.
		postGraph([...BASE, ZETA]);
		select(ZETA);
		const dangling = entryCaseClasses("depends_on", MISSING);
		expect(
			dangling,
			`${MISSING} in the depends_on of ${ZETA} carries ${describeClasses(dangling)}`,
		).toEqual([INERT_CASE]);
		expectExactCaseClass("depends_on", MISSING, INERT_CASE);

		// One section that lists both cases at once: each entry is marked with its
		// own case, so neither class is the section's and neither leaks sideways.
		postGraph([...BASE, ETA]);
		select(ETA);
		const resolved = entryCaseClasses("depends_on", ALPHA);
		expect(
			resolved,
			`${ALPHA} in the depends_on of ${ETA} carries ${describeClasses(resolved)}`,
		).toEqual([ENTRY_CASE]);
		expectExactCaseClass("depends_on", ALPHA, ENTRY_CASE);
		const unresolved = entryCaseClasses("depends_on", MISSING);
		expect(
			unresolved,
			`${MISSING} in the depends_on of ${ETA} carries ${describeClasses(unresolved)}`,
		).toEqual([INERT_CASE]);
		expectExactCaseClass("depends_on", MISSING, INERT_CASE);
	});

	test("no listed entry is left unclassified, and none carries both classes", () => {
		postGraph([...BASE, EPSILON, ZETA, ETA]);

		for (const from of [ALPHA, BETA, GAMMA, EPSILON, ZETA, ETA]) {
			select(from);

			let seen = 0;
			for (const label of RELATIONSHIP_LABELS) {
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
						entry.id === MISSING ? INERT_CASE : ENTRY_CASE,
					);
				}
			}
			expect(seen, `the detail of ${from} lists no relationship entry at all`).toBeGreaterThan(0);
		}
	});
});

describe("a Content ref path is a control that opens its file (rptlovpt, ppkkmxxu)", () => {
	/**
	 * The path and the request one activation of it posts: exactly one page
	 * message carrying that repo-relative path as a value of its own, and not
	 * the list's other path.
	 */
	function expectRequestFor(path: string, posted: readonly unknown[], how: string): void {
		const requests = requestsFor(path, posted);
		expect(
			requests,
			`${how} on ${path} posted ${describePosts(posted)}; the page's request to open ${path} is one message carrying that repo-relative path`,
		).toHaveLength(1);
		const other = REF_PATHS.find((candidate) => candidate !== path);
		expect(
			stringValues(requests[0]),
			`${how} on ${path} posted a request that also names ${other}`,
		).not.toContain(other);
	}

	test("each ref path is an entry of its own inside the block, marked detail__ref", () => {
		postGraph([...BASE, THETA]);
		select(THETA);
		expect(selectedId()).toBe(THETA);

		const blocks = monoBlocks("content");
		expect(
			blocks.length,
			`the Content section of ${THETA} shows its ref list in no monospaced block`,
		).toBeGreaterThan(0);

		for (const path of REF_PATHS) {
			const entry = refPathEntry(path);
			expect(
				blocks.some((block) => block.contains(entry)),
				`${path} is shown outside the Content section's monospaced block`,
			).toBe(true);
			expect(
				[...entry.classList],
				`${path} is shown with ${describeWholeClassList(entry)}, where a ref path carries ${REF_PATH_ENTRY} as its whole class`,
			).toEqual([REF_PATH_ENTRY]);
		}
	});

	test("a pointer click on a ref path posts the page's request for that repo-relative path", () => {
		postGraph([...BASE, THETA]);
		select(THETA);
		const before = detailText();

		for (const path of REF_PATHS) {
			const control = refPathControl(path);
			expect(
				control,
				`the Content section of ${THETA} shows ${path} as text, not as a control`,
			).toBeDefined();

			const posted = postedDuring(() => clickPointer(control!));
			expectRequestFor(path, posted, "a pointer click");
		}

		// A ref path opens a file; it is not one of the listed ids whose
		// activation selects (kwxutvpw), so the page stays where it was.
		expect(selectedId(), "activating a ref path changed the selection").toBe(THETA);
		expect(detailText(), "activating a ref path changed the detail region").toBe(before);
	});

	test("Enter and Space on a focused ref path post the same request", () => {
		for (const key of ["Enter", " "] as const) {
			const how = key === " " ? "Space" : key;
			for (const path of REF_PATHS) {
				postGraph([...BASE, THETA]);
				select(THETA);

				const control = refPathControl(path);
				expect(
					control,
					`the Content section of ${THETA} shows ${path} as text, not as a control`,
				).toBeDefined();
				expect(
					takesFocus(control!),
					`the entry for ${path} did not take the focus`,
				).toBe(true);

				const posted = postedDuring(() => pressKeyOn(control!, key));
				expectRequestFor(path, posted, how);
				expect(selectedId(), `${how} on a ref path changed the selection`).toBe(THETA);
			}
		}
	});
});
