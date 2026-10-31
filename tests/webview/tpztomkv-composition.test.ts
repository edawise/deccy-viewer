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
 * - activating a listed id asks the interaction to bring the node it selects
 *   into view (wzsxvmvw), so the viewport comes to rest where the centring
 *   rule puts it: on an axis the drawn graph fits within the canvas, the
 *   selected node's centre at the canvas centre, with the margin left at the
 *   graph's edge permitted and the pan limits not holding the move back; on an
 *   axis the drawn graph overflows, the pan limit the page's own pan stops at
 *   binding, so the graph keeps covering the canvas and the node is not
 *   centred there. The zoom is left alone, and the selection and the detail
 *   region stay what the activation already gives (kwxutvpw), while an
 *   activation of an id that names no node document moves nothing (rusopkql).
 *   The expectation is derived per axis from the layout the page draws and the
 *   canvas's own size; the pan limits are read back by panning at the zoom in
 *   hand, never restated, and the check waits for the view to come to rest
 *   instead of fixing when or how smoothly the move is written. The activation
 *   is driven in every one of the panel's four relationship sections —
 *   depends_on, evaluates, dependents and evaluators — each populated by the
 *   edge that makes it and each activating an id that names a node document,
 *   at a framing the graph fits on both axes and, for the three sections
 *   depends_on is not one of, at framings that overflow one axis while the
 *   other fits and both axes at once: a page that asks for the centring only
 *   for the prerequisites it lists is read as the partial move it makes.
 * - the page is also driven where the frame the renderer draws and the frame
 *   the layout states are not the same frame (rtlotqvy, noplrntp, wzsxvmvw): a
 *   graph whose layout's bounds origin is negative on both axes — a node whose
 *   prerequisite names no node document stands its stub above a top-layer box,
 *   and a node with no edges of its own is dragged left of column 0 — is
 *   posted, the box is dragged the way a user drags it, and the drawing is
 *   read the way a reader sees it: every drawn box's own offset plus every
 *   translation between it and the node layer added up, required to be the
 *   layout's box less that origin, with the origin itself required to be
 *   negative on both axes, so the case is never credited at a zero origin. The
 *   centring clause is then read on that page in the drawn frame: on a fitted
 *   axis the selected node's drawn centre comes to the canvas centre, and on
 *   an overflowing axis the move is held where the page's own pan stops, with
 *   the drawn graph's near edge read as the resting pan itself — the place the
 *   drawn graph starts — and not as the pan plus the bounds origin, a reading
 *   that is the drawn edge only at a zero origin.
 * - the search's Enter and Shift+Enter put the viewport where the one centring
 *   move puts the node they select (uowtmmqw, wzsxvmvw): the selection the key
 *   press makes is read off the page and the viewport is required to come to
 *   rest at that node's centring, on the terms the activation clauses read at
 *   the zoom the key press found, with the zoom left alone and the drawn boxes
 *   where they were, because the move it makes is a viewport move and nothing
 *   else. The node centred is the node the selection identifies and no other;
 *   the direction the walk takes and the node it lands on are the recorded
 *   search's (yqwsztww) and are not predicted here. Both key presses are
 *   driven, so a page that answers one and not the other is read as the
 *   partial move it makes, and a key press that makes no selection — a query
 *   that marks no node — leaves the viewport exactly what it was.
 * - the ask runs behind the selection it accompanies (uowtmmqw): the page
 *   reports each selection through its own seam (srlrwowp), and the check reads
 *   the viewport at the instant of that report and requires it to be still the
 *   one the key press found, so an ask that overtook the selection it follows
 *   is read as the different order the page keeps. The node the viewport comes
 *   to rest centred on must be the node the report names, which must be the node
 *   the page emphasises as selected, at the zoom the press found. The report is
 *   read as the composition's own announcement of the selection and no moment is
 *   fixed for it beyond the press it answers; a press the page announces no
 *   selection for is read as a press that selected nothing, because a selection
 *   is reported so the host can record it (srlrwowp).
 * - the composition's own ask inventory is the activation's and nothing more
 *   (wzsxvmvw, uowtmmqw): besides the box click and a ref path's activation
 *   below, the view is parked where the centring of the node in hand would
 *   change it and the viewport is required to be exactly what it was when `/`
 *   opens the search field, when the query marks nodes, and when the search's
 *   Esc dismisses it — each case confirming that the action happened at all
 *   (the field opened and took the focus; the marks and the selection cleared),
 *   so a composition that itself asks for a centring move on the opening, on the
 *   marking or on the dismissal is read as the extra ask it makes. Those
 *   readings are negative: a page that asks for nothing on those paths reads the
 *   same before and after.
 * - the selections that are the composition's own ask inventory and nothing
 *   else move nothing of the viewport (wzsxvmvw): a pointer click on a node's
 *   own box and a ref path's activation each leave the surface transform
 *   exactly what it was, and each case is driven from a view parked where the
 *   centring of the node in hand would change it — the pan range's own end at
 *   a framing the graph fits — so a page that recentres on every selection
 *   change, or on a ref path's activation, is read as the move it makes. What
 *   the activation asks for is read beside it (kwxutvpw, rptlovpt), so a page
 *   that leaves the viewport alone by doing nothing fails there instead. The
 *   same reading is taken on the search, before its teardown clause disposes
 *   it: opening the field, typing a query and dismissing it with Esc (see
 *   above).
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
import { layoutGraph } from "../../src/graph/layout";
import type { GraphLayout, Point } from "../../src/graph/layout";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
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

/**
 * The node the drawn-frame cases drag left of column 0: it has no prerequisites
 * and evaluates nothing, so only its own box moves and no route is re-routed.
 */
const KAPPA = "pppp0015";

/**
 * The graph the per-section centring clauses drive, and the node that lists a
 * listed entry in each of the panel's four relationship sections: the sections
 * are read from the graph's edges and never from a field (rmovtvkt), so each
 * section below is populated by the edge that makes it, not by a fixture that
 * says so.
 *
 * - `SECTIONED_PRE` is a decision with no prerequisites. It is the
 *   `depends_on` entry of `SECTIONED`.
 * - `SECTIONED` is a decision whose prerequisite is `SECTIONED_PRE`. Its panel
 *   lists `SECTIONED_PRE` as depends_on, its dependents as dependents and
 *   `SECTIONED_EVAL` as evaluators.
 * - `SECTIONED_EVAL` is the evaluation that evaluates `SECTIONED`, with no
 *   depends_on of its own (an evaluation may carry none). Its panel lists
 *   `SECTIONED` as its evaluates entry, and the panel of `SECTIONED` lists
 *   `SECTIONED_EVAL` back as one of its evaluators.
 * - `SECTIONED_DEP` is a decision that depends on `SECTIONED`, so `SECTIONED`
 *   lists it as a dependent. The two beside it are dependents as well: three
 *   boxes in the bottom layer give the drawn layout the width and the depth
 *   the two overflow regimes below are reached from, the way the layered graph
 *   above is shaped for the depends_on clauses.
 *
 * Every id any of these sections lists names a node document of the posted
 * graph, so every entry the clauses activate is an activatable one and not an
 * inert one (rusopkql). No node of a deccy graph lists an entry in all four
 * sections at once: an `evaluates` entry is an evaluation's, and an evaluation
 * is never another node's prerequisite (a decision's depends_on targets are
 * decisions, an evaluation's too), so no evaluation has a dependent. The
 * clauses therefore select, per section, the node that section honestly
 * belongs to, and activate the entry it lists there.
 */
const SECTIONED_PRE = "jjjj0009";
const SECTIONED_EVAL = "kkkk0010";
const SECTIONED = "llll0011";
const SECTIONED_DEP = "mmmm0012";
const SECTIONED_DEP_TWO = "nnnn0013";
const SECTIONED_DEP_THREE = "oooo0014";

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
		{
			id: KAPPA,
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "KAPPA-BODY the node the drawn-frame cases drag.",
				rationale: "RATIONALE-KAPPA why kappa exists",
			},
		},
		{
			id: SECTIONED_PRE,
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-PRE-BODY the node the sectioned graph's depends_on lists.",
				rationale: "RATIONALE-SECTIONED-PRE why it exists",
			},
		},
		{
			id: SECTIONED_EVAL,
			kind: "evaluation",
			dependsOn: [],
			evaluates: [SECTIONED],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-EVAL-BODY the evaluation whose evaluates and evaluators sections are read.",
				rationale: "RATIONALE-SECTIONED-EVAL why it exists",
			},
		},
		{
			id: SECTIONED,
			kind: "decision",
			dependsOn: [SECTIONED_PRE],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-BODY the node that lists a section's entry on every side.",
				rationale: "RATIONALE-SECTIONED why it exists",
			},
		},
		{
			id: SECTIONED_DEP,
			kind: "decision",
			dependsOn: [SECTIONED],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-DEP-BODY the node SECTIONED lists as a dependent.",
				rationale: "RATIONALE-SECTIONED-DEP why it exists",
			},
		},
		{
			id: SECTIONED_DEP_TWO,
			kind: "decision",
			dependsOn: [SECTIONED],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-DEP-TWO-BODY another dependent of SECTIONED.",
				rationale: "RATIONALE-SECTIONED-DEP-TWO why it exists",
			},
		},
		{
			id: SECTIONED_DEP_THREE,
			kind: "decision",
			dependsOn: [SECTIONED],
			evaluates: [],
			content: {
				type: "text",
				ref: "inline",
				content: "SECTIONED-DEP-THREE-BODY a third dependent of SECTIONED.",
				rationale: "RATIONALE-SECTIONED-DEP-THREE why it exists",
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

/**
 * The surface transform at the instant the page reported each selection, in
 * the order the reports arrived. A selection is announced through the page's
 * own seam (srlrwowp), and that announcement is the one moment the check can
 * read the page between the selection and the ask that accompanies it
 * (uowtmmqw): the viewport a selection is reported from is where the page stood
 * before it asked for the move.
 */
const VIEWPORT_AT_SELECTION_REPORT: string[] = [];

/** Whether a page message is the page's report of its selection (srlrwowp). */
function isSelectionReport(
	message: unknown,
): message is { type: "selection"; id: string | null } {
	return (
		typeof message === "object" &&
		message !== null &&
		(message as { type?: unknown }).type === "selection"
	);
}

/** Read the viewport the page stands at when it reports a selection. */
function recordSelectionReport(message: unknown): void {
	if (isSelectionReport(message)) {
		VIEWPORT_AT_SELECTION_REPORT.push(surface.style.transform);
	}
}

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
			recordSelectionReport(message);
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
	VIEWPORT_AT_SELECTION_REPORT.length = 0;
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

	test("Enter and Shift+Enter bring the viewport to rest on the node they select (uowtmmqw, wzsxvmvw)", async () => {
		// The field is live here: the teardown clause below disposes it for the rest
		// of the file, so this clause is read before it. `parkedView` and the
		// centring terms beside it are the helpers the viewport clauses use.
		//
		// The two key presses are the search's (yqwsztww) and the move they start
		// is the one centring move the viewport record keeps (wzsxvmvw), whose
		// third trigger the search's rule adds (uowtmmqw). What the composed page
		// is read for is where that move leaves the viewport: the node the key
		// press selects is read off the page, and the resting view is held to that
		// node's centring. Neither the direction the walk takes nor the node it
		// lands on is predicted here.
		for (const reverse of [false, true] as const) {
			const how = reverse ? "Shift+Enter" : "Enter";
			// Each case starts from the same clean page and a view parked at one end
			// of its pan range, where the centring of a node would have to move it.
			reset();
			const { layout, limits } = parkedView(`parking the view before the search's ${how}`);

			pressKey(document.body, "/");
			const input = field();
			expect(input, "the page opened no search field on `/`").not.toBeNull();
			type(input!, QUERY);

			// The viewport at the key press, and the boxes the page has drawn at it:
			// the field's opening and the typing before it are other decisions', and
			// a centring move is a viewport move and nothing else.
			const before = panNow(`the viewport before the search's ${how}`);
			const placed = drawnBoxes();
			pressKey(input!, "Enter", reverse);

			const chosen = selectedId();
			expect(chosen, `${how} selected no marked node`).not.toBeNull();
			expect(
				boxOf(chosen!).classList.contains(SEARCH_MATCH_CLASS),
				`${how} selected ${chosen}, which the query does not mark`,
			).toBe(true);

			const why = `the search's ${how} selecting ${chosen}`;
			const resting = await rested(why);

			expect(
				drawnBoxes(),
				`${why} moved the drawn boxes, where the move the key press starts is a viewport move and nothing else`,
			).toEqual(placed);
			expectCentredOn(chosen!, layout, before.scale, limits, before, resting, why);
		}
	});

	test("a key press that makes no selection moves nothing of the viewport (uowtmmqw)", async () => {
		// A centring move arises from a selection (uowtmmqw, wzsxvmvw): where the
		// two key presses make none, as where the query marks no node, the
		// viewport is exactly what it was.
		for (const reverse of [false, true] as const) {
			const how = reverse ? "Shift+Enter" : "Enter";
			reset();

			pressKey(document.body, "/");
			const input = field();
			expect(input, "the page opened no search field on `/`").not.toBeNull();
			const chosenBefore = selectedId();
			// A query no node of the posted graph carries, so the key press walks an
			// empty set and makes no selection (yqwsztww).
			type(input!, "qqqqnomark");
			expect(
				markedIds(),
				`the query this ${how} case types marks a node of the posted graph`,
			).toEqual([]);

			const before = panNow(`the viewport before the search's ${how}`);
			pressKey(input!, "Enter", reverse);
			const why = `the search's ${how} with a query that marks no node`;
			const resting = await rested(why);

			expect(
				resting,
				`${why} moved the viewport from ${JSON.stringify(before)} to ${JSON.stringify(resting)}, where a key press that makes no selection centres nothing`,
			).toEqual(before);
			expect(selectedId(), `${why} changed the selection`).toBe(chosenBefore);
		}
	});

	test("the ask runs after the selection it accompanies (uowtmmqw)", async () => {
		// The page announces every selection it makes through its seam
		// (srlrwowp), and that announcement is the one moment the check can read
		// the page between the selection and the ask that accompanies it: the
		// viewport the page reports a selection from is where it stood before it
		// made the ask. A page whose centring overtakes the selection it follows
		// — or that centres on a node the report does not name — is therefore read
		// as the different order it keeps, and not only by where the view rests.
		for (const reverse of [false, true] as const) {
			const how = reverse ? "Shift+Enter" : "Enter";
			reset();
			const { layout, limits } = parkedView(`parking the view before the search's ${how}`);

			pressKey(document.body, "/");
			const input = field();
			expect(input, "the page opened no search field on `/`").not.toBeNull();
			type(input!, QUERY);

			const before = panNow(`the viewport before the search's ${how}`);
			VIEWPORT_AT_SELECTION_REPORT.length = 0;
			const from = POSTED.length;
			pressKey(input!, "Enter", reverse);

			// The node the page says the press selected: the selection it reported,
			// which is the node the ask that follows it is to centre on.
			const reports = POSTED.slice(from).filter(isSelectionReport);
			expect(
				reports.length,
				`the search's ${how} reported no selection to the host`,
			).toBeGreaterThan(0);
			const landed = reports[reports.length - 1].id;
			expect(typeof landed, `${how} reported a selection of no node`).toBe("string");
			expect(
				landed,
				`${how} reported ${String(landed)}, where the page emphasises ${String(selectedId())} as selected`,
			).toBe(selectedId());

			const why = `the search's ${how} selecting ${String(landed)}`;
			expect(
				VIEWPORT_AT_SELECTION_REPORT,
				`${why}: the page reported ${reports.length} selection(s), where the check read ${VIEWPORT_AT_SELECTION_REPORT.length} viewport(s)`,
			).toHaveLength(reports.length);
			for (const at of VIEWPORT_AT_SELECTION_REPORT) {
				expect(
					panOf(at, why),
					`${why}: the surface already carried ${at} when the page reported the selection, where the ask runs after the selection it accompanies and the press found ${JSON.stringify(before)}`,
				).toEqual(before);
			}

			// Once the press has been answered the view rests where the one centring
			// move puts the node the report names, at the zoom in hand.
			const resting = await rested(why);
			expectCentredOn(String(landed), layout, before.scale, limits, before, resting, why);
		}
	});

	test("opening the search field moves nothing of the viewport (uowtmmqw)", async () => {
		// The composition's own ask inventory stays the activation's, so opening
		// the field is not one of the page's asks: the view is parked where the
		// centring of the selected node would change it, so a composition that
		// asks for a centring move on the opening is read as the extra ask it
		// makes.
		for (const chosen of [ALPHA, GAMMA] as const) {
			reset();
			const why = `opening the search field with \`/\` over ${chosen}`;
			const { layout, limits, parked } = parkedView(`parking the view before ${why}`, () => {
				select(chosen);
				expect(
					selectedId(),
					`the click on ${chosen}'s own box did not select it`,
				).toBe(chosen);
			});
			expectCentringWouldMove(chosen, layout, limits, parked, why);

			pressKey(document.body, "/");
			const input = field();
			expect(input, "the page opened no search field on `/`").not.toBeNull();
			expect(document.activeElement, "the search field did not take focus").toBe(input);

			const resting = await rested(why);
			expect(
				resting,
				`${why} moved the viewport from ${JSON.stringify(parked)} to ${JSON.stringify(resting)}, where opening the search only opens a field the page's ask inventory does not cover`,
			).toEqual(parked);
			expect(selectedId(), `${why} changed the selection`).toBe(chosen);
		}
	});

	test("the query's marks and the search's Esc move nothing of the viewport (uowtmmqw)", async () => {
		// Marking selects nothing by itself, so no centring arises from it, and
		// the dismissal closes the field and clears what the search holds — none
		// of which is an ask for a move. The view is parked away from the
		// centring of the node the dismissal deselects, so a composition that
		// asks for that node's centring again on the dismissal is read as the
		// extra ask it makes.
		for (const reverse of [false, true] as const) {
			const how = reverse ? "Shift+Enter" : "Enter";
			reset();
			const { layout, limits, parked } = parkedView(
				"parking the view before the search's keys",
			);

			pressKey(document.body, "/");
			const input = field();
			expect(input, "the page opened no search field on `/`").not.toBeNull();
			type(input!, QUERY);
			expect(
				markedIds().length,
				`the query this ${how} case types marks no node of the posted graph`,
			).toBeGreaterThan(0);
			expect(
				panNow("the viewport after opening the field and typing"),
				`opening the search field and typing a query moved the viewport from ${JSON.stringify(parked)}, where the marks a query makes select nothing and ask for no move`,
			).toEqual(parked);

			pressKey(input!, "Enter", reverse);
			const chosen = selectedId();
			expect(chosen, `${how} selected no marked node`).not.toBeNull();
			// Whatever the selection asked for is at rest before the dismissal is
			// read; the dismissal is held against the view it finds.
			await rested(`the view the search's ${how} left before its Esc`);
			const parkedAgain = panByHand(
				-TO_THE_LIMIT,
				-TO_THE_LIMIT,
				`parking the view before the search's Esc`,
			);
			const why = `the search's Esc after its ${how}`;
			expectCentringWouldMove(chosen!, layout, limits, parkedAgain, why);

			pressKey(input!, "Escape");
			const resting = await rested(why);

			// The case is not credited to a page that ignores the dismissal: the
			// field goes, and with it the marks and the selection.
			expect(field(), "Esc did not close the search field").toBeNull();
			expect(markedIds(), "Esc left match marks behind").toEqual([]);
			expect(selectedId(), "Esc did not clear the selection").toBeNull();
			expect(
				resting,
				`${why} moved the viewport from ${JSON.stringify(parkedAgain)} to ${JSON.stringify(resting)}, where a dismissal clears the search and moves nothing of the viewport`,
			).toEqual(parkedAgain);
		}
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

// ------------------------------------ where an activation leaves the viewport

/**
 * The viewport the page holds, read off the surface transform it writes: the
 * pan in canvas pixels and the zoom. Every viewport change of the page is that
 * one transform (mntwwzyl) — the toolbar's fit clause above reads the same
 * surface — so nothing of the interaction's internals is named here.
 */
interface Pan {
	x: number;
	y: number;
	scale: number;
}

/** The numbers of a CSS function call in a transform, in order, when they parse. */
function argumentsOf(transform: string, call: string): number[] | undefined {
	const called = new RegExp(`${call}\\(([^)]*)\\)`).exec(transform);
	if (called === null) {
		return undefined;
	}
	const numbers: number[] = [];
	for (const argument of called[1].split(/[,\s]+/).filter((part) => part !== "")) {
		const number = /^(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(?:px)?$/.exec(argument);
		if (number === null) {
			return undefined;
		}
		numbers.push(Number(number[1]));
	}
	return numbers;
}

/** The viewport a surface transform shows, in the form every viewport change writes. */
function panOf(transform: string, why: string): Pan {
	const translate = argumentsOf(transform, "translate");
	const scale = argumentsOf(transform, "scale");
	expect(
		translate,
		`${why}: the surface transform "${transform}" carries no pan in canvas pixels`,
	).toBeDefined();
	expect(translate![0], `${why}: the surface transform "${transform}" names no pan`).toBeDefined();
	expect(scale?.[0], `${why}: the surface transform "${transform}" carries no zoom`).toBeDefined();
	// CSS `translate(<x>)` is `translate(<x>, 0)`, which is how a pan of zero on
	// one axis is written.
	return { x: translate![0], y: translate![1] ?? 0, scale: scale![0] };
}

/** The viewport the page holds now. */
function panNow(why: string): Pan {
	return panOf(surface.style.transform, why);
}

/**
 * How many turns the check gives the page to come to rest. A viewport change
 * may be written in the event that asks for it or in a frame after it, and the
 * rule fixes where the view comes to rest, not when or how smoothly it gets
 * there, so no duration, easing or smoothness is fixed here.
 */
const REST_TURNS = 40;

/** One turn of the page's own clock: an animation frame when it has one. */
function nextTurn(): Promise<void> {
	return new Promise((resolve) => {
		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(() => resolve());
			return;
		}
		globalThis.setTimeout(resolve, 0);
	});
}

/** The viewport the page comes to rest at, whatever wrote it. */
async function rested(why: string): Promise<Pan> {
	let last = surface.style.transform;
	for (let turn = 0; turn < REST_TURNS; turn += 1) {
		await nextTurn();
		const now = surface.style.transform;
		if (now === last) {
			return panOf(now, why);
		}
		last = now;
	}
	return panOf(last, why);
}

/** How far a hand's drag moves before it becomes a pan rather than a click. */
const PAST_THRESHOLD = 20;

/** How far a pan is carried to reach whatever limit is behind it. */
const TO_THE_LIMIT = 100000;

/**
 * Pan the graph by hand — a primary press on the canvas, two moves and the
 * release (srsnqppq) — and answer the viewport the page comes to rest at.
 */
function panByHand(dx: number, dy: number, why: string): Pan {
	NEXT_POINTER_ID += 1;
	const pointerId = NEXT_POINTER_ID;
	const at = (x: number, y: number): PointerEventInit => ({
		pointerId,
		isPrimary: true,
		pointerType: "mouse",
		button: 0,
		clientX: x,
		clientY: y,
		bubbles: true,
		cancelable: true,
		composed: true,
	});
	canvas.dispatchEvent(new PointerEvent("pointerdown", { ...at(0, 0), buttons: 1 }));
	// The first move crosses the drag threshold and starts the pan; the second
	// carries it to where the hand went.
	canvas.dispatchEvent(
		new PointerEvent("pointermove", { ...at(PAST_THRESHOLD, PAST_THRESHOLD), buttons: 1 }),
	);
	canvas.dispatchEvent(new PointerEvent("pointermove", { ...at(dx, dy), buttons: 1 }));
	canvas.dispatchEvent(new PointerEvent("pointerup", { ...at(dx, dy), buttons: 0 }));
	return panNow(why);
}

/** The pan the page stops at on each side, at one zoom. */
interface PanLimits {
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
}

/**
 * Drag a node's box to the left by a canvas delta — a primary press on the box,
 * a move past the drag threshold and the move that carries the hand to its
 * place (spllzqlw, srsnqppq, stppxysx) — and leave the viewport alone, because a
 * drag moves a box and not the view. The press lands on the box so the
 * gesture's subject is that node, and the moves and the release are addressed
 * to the canvas, which captured the pointer at the press. The box ends where
 * the page's own conversion of a pointer to graph pixels puts it; the check
 * reads that place back instead of predicting it, so no threshold, rounding or
 * grip offset is restated here.
 */
function dragLeftByHand(id: string, dx: number): void {
	NEXT_POINTER_ID += 1;
	const pointerId = NEXT_POINTER_ID;
	const at = (x: number, y: number): PointerEventInit => ({
		pointerId,
		isPrimary: true,
		pointerType: "mouse",
		button: 0,
		clientX: x,
		clientY: y,
		bubbles: true,
		cancelable: true,
		composed: true,
	});
	boxOf(id).dispatchEvent(new PointerEvent("pointerdown", { ...at(0, 0), buttons: 1 }));
	canvas.dispatchEvent(
		new PointerEvent("pointermove", { ...at(PAST_THRESHOLD, 0), buttons: 1 }),
	);
	canvas.dispatchEvent(new PointerEvent("pointermove", { ...at(dx, 0), buttons: 1 }));
	canvas.dispatchEvent(new PointerEvent("pointerup", { ...at(dx, 0), buttons: 0 }));
}

/**
 * Let a drag apply: a move is recorded and applied in one relayout per frame
 * (stppxysx), so the place the page wrote for the box the drag pressed on is
 * read until the frame that moved it has run. Where the box is drawn is read
 * afterwards, because the box a drag carries out past the graph's edge leaves
 * the drawn place of the box that edge was at where it was.
 */
async function dragApplied(id: string, was: string): Promise<void> {
	for (let turn = 0; turn < REST_TURNS; turn += 1) {
		await nextTurn();
		if (boxOf(id).style.left !== was) {
			return;
		}
	}
}

/**
 * The pan limits the page records, read back from it at the zoom in hand: a
 * pan far to one side and far to the other, and the viewport the page stops at
 * on each axis. No limit value is restated, so the check is held against the
 * limits the page itself keeps.
 */
function panLimitsAt(why: string): PanLimits {
	const low = panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, why);
	const high = panByHand(TO_THE_LIMIT, TO_THE_LIMIT, why);
	return {
		xMin: Math.min(low.x, high.x),
		xMax: Math.max(low.x, high.x),
		yMin: Math.min(low.y, high.y),
		yMax: Math.max(low.y, high.y),
	};
}

/** Zoom in by one notch of the wheel over the canvas's middle (kyokxuml). */
function wheelIn(why: string): Pan {
	canvas.dispatchEvent(
		new WheelEvent("wheel", {
			deltaY: -200,
			clientX: canvas.clientWidth / 2,
			clientY: canvas.clientHeight / 2,
			bubbles: true,
			cancelable: true,
		}),
	);
	return panNow(why);
}

/**
 * The layout module's geometry for the graph the check posts (qmsmvrnr): the
 * records filtered to `ids`, no measured heights (jsdom measures none) and the
 * boxes the check has dragged, when it has dragged any. This is fixture
 * geometry and a prerequisite's module, never a value read back from the code
 * the check evaluates.
 */
function layoutOf(ids: readonly string[], dragged?: ReadonlyMap<string, Point>): GraphLayout {
	const wanted = new Set(ids);
	const model = buildGraph(allRecords().filter((record) => wanted.has(record.id)));
	return layoutGraph(model, graphOrder(model), dragged === undefined ? {} : { dragged });
}

/** A length the page wrote, in pixels; an element with no offset written adds none. */
function pixels(value: string): number {
	const match = /^(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)px$/.exec(value);
	return match === null ? 0 : Number(match[1]);
}

/** An element named by its tag and its classes, for a failure message. */
function describeElement(element: Element): string {
	const names = [...element.classList];
	const tag = element.tagName.toLowerCase();
	return names.length === 0 ? `<${tag}>` : `<${tag} class="${names.join(" ")}">`;
}

/**
 * Where the page draws an element inside a region, in the region's own
 * coordinates: the element's own offset plus every translation between it and
 * the region, added up. jsdom lays nothing out, so the place a reader sees is
 * what the page writes — the offsets and the translations — and the sum is
 * where the element lands in the region, whatever the page puts between the
 * two.
 */
function drawnPlace(element: Element, region: Element, why: string): Point {
	let x = 0;
	let y = 0;
	for (let node: Element | null = element; node !== null; node = node.parentElement) {
		const style = (node as HTMLElement).style;
		x += pixels(style?.left ?? "");
		y += pixels(style?.top ?? "");
		const transform = style?.transform ?? "";
		if (transform !== "") {
			const translate = argumentsOf(transform, "translate");
			expect(
				translate,
				`${why}: ${describeElement(node)} is drawn under the transform "${transform}", which moves it somewhere this check does not read`,
			).toBeDefined();
			x += translate![0];
			y += translate![1] ?? 0;
		}
		if (node === region) {
			return { x, y };
		}
	}
	throw new Error(
		`${why}: ${describeElement(element)} is not drawn inside ${describeElement(region)}`,
	);
}

/**
 * What the page must have drawn for `layout`: the node layer the width of the
 * drawn graph and every box at its layout place less the layout's bounds origin
 * (rtlotqvy, qmsmvrnr). That is the drawn frame the viewport is written in,
 * which is the layout's own frame only where that origin is zero.
 */
function expectPageDraws(layout: GraphLayout, ids: readonly string[], why: string): void {
	// The size the page wrote, read as a length: jsdom serializes a CSS length
	// with two decimals, so the size is compared as a number and not as the
	// string the page happens to spell it with.
	expect(
		pixels(nodesLayer.style.width),
		`${why}: the page draws the graph ${nodesLayer.style.width} wide, where the layout module gives the drawn graph ${layout.bounds.width}px`,
	).toBeCloseTo(layout.bounds.width, 2);
	for (const id of ids) {
		const box = layout.nodes.get(id);
		if (box === undefined) {
			continue;
		}
		const drawn = drawnPlace(boxOf(id), nodesLayer, why);
		expect(
			drawn.x,
			`${why}: the page draws ${id} at x ${drawn.x} in the node layer, where the layout puts its box at ${box.x} and the drawn graph starts at ${layout.bounds.x}, so the drawn box belongs at ${box.x - layout.bounds.x}`,
		).toBeCloseTo(box.x - layout.bounds.x, 6);
		expect(
			drawn.y,
			`${why}: the page draws ${id} at y ${drawn.y} in the node layer, where the layout puts its box at ${box.y} and the drawn graph starts at ${layout.bounds.y}, so the drawn box belongs at ${box.y - layout.bounds.y}`,
		).toBeCloseTo(box.y - layout.bounds.y, 6);
	}
}

/**
 * The origin the page draws the graph at, read off the boxes the check did not
 * drag: the layout module's place for such a box less the place the page drew
 * it at is the origin the drawn graph starts at (rtlotqvy). Every one of them
 * must answer the same origin, because the drawing is the layout less one
 * origin and not a frame of its own. The box the check dragged is left out,
 * because where it is is where the reader dropped it.
 */
function drawnOrigin(
	layout: GraphLayout,
	ids: readonly string[],
	skipped: string,
	why: string,
): Point {
	let origin: Point | undefined;
	for (const id of ids) {
		if (id === skipped) {
			continue;
		}
		const box = layout.nodes.get(id);
		if (box === undefined) {
			continue;
		}
		const drawn = drawnPlace(boxOf(id), nodesLayer, why);
		const found = { x: box.x - drawn.x, y: box.y - drawn.y };
		if (origin === undefined) {
			origin = found;
			continue;
		}
		expect(
			found.x,
			`${why}: ${id} is drawn at x ${drawn.x}, which puts the origin the drawing starts at at ${found.x}, where a box the check did not drag already answered ${origin.x}`,
		).toBeCloseTo(origin.x, 6);
		expect(
			found.y,
			`${why}: ${id} is drawn at y ${drawn.y}, which puts the origin the drawing starts at at ${found.y}, where a box the check did not drag already answered ${origin.y}`,
		).toBeCloseTo(origin.y, 6);
	}
	if (origin === undefined) {
		throw new Error(`${why}: the page drew no box whose layout place the check knows`);
	}
	return origin;
}

/**
 * The layout the page draws for the graph the check posts: the layout module
 * the page imports (qmsmvrnr), given the same records and no measured heights
 * (jsdom measures none), cross-checked against what the page drew — the node
 * layer is the graph's own width and every box sits at the layout's own place —
 * so the expectation below is held against the layout the page came to rest on
 * and not a second one.
 */
function drawnLayout(ids: readonly string[]): GraphLayout {
	const layout = layoutOf(ids);
	expect(
		nodesLayer.style.width,
		`the page draws the graph ${nodesLayer.style.width} wide, where the layout module gives it ${layout.bounds.width}px`,
	).toBe(`${layout.bounds.width}px`);
	for (const id of ids) {
		const box = layout.nodes.get(id);
		if (box === undefined) {
			continue;
		}
		expect(
			boxOf(id).style.left,
			`the page draws ${id} at ${boxOf(id).style.left} from the graph's left edge, where the layout module puts it at ${box.x}px`,
		).toBe(`${box.x}px`);
	}
	return layout;
}

/**
 * Where the page has drawn each box, as the page wrote it: the id, the left and
 * the top of every drawn element. A centring move changes the view and nothing
 * else (wzsxvwmv), so the drawn boxes are read before and after an activation.
 */
function drawnBoxes(): string[] {
	return boxes().map(
		(box) =>
			`${box.getAttribute(NODE_ID_ATTR) ?? ""}@${box.style.left},${box.style.top}`,
	);
}

/** The canvas's own size, which a centring move centres against. */
function canvasSpan(axis: "x" | "y"): number {
	return axis === "x" ? canvas.clientWidth : canvas.clientHeight;
}

/** The extent the drawn graph covers on one axis at the zoom in hand. */
function drawnExtent(axis: "x" | "y", layout: GraphLayout, scale: number): number {
	return (axis === "x" ? layout.bounds.width : layout.bounds.height) * scale;
}

/** Whether the drawn graph overflows one axis of the canvas at the zoom in hand. */
function overflows(axis: "x" | "y", layout: GraphLayout, scale: number): boolean {
	return drawnExtent(axis, layout, scale) > canvasSpan(axis);
}

/** The centre of the node `id` in the graph the page draws, on one axis. */
function nodeCentre(axis: "x" | "y", id: string, layout: GraphLayout): number {
	const box = layout.nodes.get(id);
	if (box === undefined) {
		throw new Error(`the layout the page draws has no box for ${id}`);
	}
	return axis === "x"
		? box.x + box.width / 2 - layout.bounds.x
		: box.y + box.height / 2 - layout.bounds.y;
}

/**
 * Where one axis of a centring move on `id` must leave the pan (wzsxvmvw):
 *
 * - on an axis the drawn graph fits within the canvas, the node's centre comes
 *   to the canvas centre and the margin left at the graph's edge is permitted,
 *   so no recorded limit holds the move back;
 * - on an axis it overflows, the move is held at the pan limit the page itself
 *   stops at, so the graph keeps covering the canvas and the node is not
 *   centred there.
 *
 * A centring move leaves the zoom alone, so every term is read at the zoom in
 * hand.
 */
function centredPanOn(
	axis: "x" | "y",
	id: string,
	layout: GraphLayout,
	scale: number,
	limits: PanLimits,
): number {
	const centred = canvasSpan(axis) / 2 - nodeCentre(axis, id, layout) * scale;
	if (!overflows(axis, layout, scale)) {
		return centred;
	}
	return axis === "x"
		? Math.min(Math.max(centred, limits.xMin), limits.xMax)
		: Math.min(Math.max(centred, limits.yMin), limits.yMax);
}

/** The pan limits on one axis, said in words for a failure message. */
function describeLimits(axis: "x" | "y", limits: PanLimits): string {
	return axis === "x" ? `${limits.xMin}..${limits.xMax}` : `${limits.yMin}..${limits.yMax}`;
}

/**
 * What the page's viewport must show once an activation has centred it on `id`,
 * and what it must not: the zoom the activation started at, the pan each axis
 * of the rule gives that node at that zoom (wzsxvmvw) — and, on an overflowing
 * axis, a graph still covering the canvas.
 *
 * The pan is read off the surface transform the page writes, and jsdom
 * serializes a CSS length to a fixed number of decimals, so a reading spells the
 * pan out to as many places as that costs and no more. `precision` is how many
 * decimals the case is read at: the default is the pan written at a few hundred
 * pixels, and a case driven at a zoom that puts the pan in the thousands passes
 * the coarser reading that survives its spelling.
 */
function expectCentredOn(
	id: string,
	layout: GraphLayout,
	scale: number,
	limits: PanLimits,
	before: Pan,
	resting: Pan,
	why: string,
	precision = 2,
): void {
	expect(
		resting.scale,
		`${why}: the activation changed the zoom from ${scale} to ${resting.scale}, where a centring move leaves the zoom alone`,
	).toBeCloseTo(scale, 3);

	// A case whose view already rested where the centring belongs would read the
	// same for a page that asks and one that never does, so the case is refused
	// rather than credited.
	const expectedPan = {
		x: centredPanOn("x", id, layout, scale, limits),
		y: centredPanOn("y", id, layout, scale, limits),
	};
	expect(
		Math.abs(before.x - expectedPan.x) > 0.5 || Math.abs(before.y - expectedPan.y) > 0.5,
		`${why}: the view rested at ${JSON.stringify(before)} before the activation, where the centring belongs at ${JSON.stringify(expectedPan)}, so this case cannot tell a page that asks from one that never does`,
	).toBe(true);

	for (const axis of ["x", "y"] as const) {
		const expected = centredPanOn(axis, id, layout, scale, limits);
		const extent = drawnExtent(axis, layout, scale);
		const span = canvasSpan(axis);
		expect(
			resting[axis],
			overflows(axis, layout, scale)
				? `${why}: the drawn graph overflows the canvas on ${axis} (${extent}px at zoom ${scale} against ${span}px), so the recorded pan limit binds and the centring comes to rest at ${axis} ${expected} (limits ${describeLimits(axis, limits)}); the page rested at ${resting[axis]}`
				: `${why}: the drawn graph fits the canvas on ${axis} (${extent}px at zoom ${scale} against ${span}px), so the node's centre belongs at the canvas centre, ${axis} ${expected}, with the margin the rule permits — the recorded pan limit (${describeLimits(axis, limits)}) must not hold the centring back; the page rested at ${resting[axis]}`,
		).toBeCloseTo(expected, precision);

		if (overflows(axis, layout, scale)) {
			// The drawn graph spans from the surface origin to its extent
			// (rtlotqvy), so the near edge it reaches is the resting pan itself,
			// and not the pan plus the bounds origin: adding that origin is a
			// reading in the layout's own coordinates, which the drawn edge is
			// only where the drawn graph starts at zero.
			const near = resting[axis];
			expect(
				near,
				`${why}: the graph no longer reaches the canvas's near edge on ${axis} (${near}px at zoom ${scale})`,
			).toBeLessThanOrEqual(1e-6);
			expect(
				near + extent,
				`${why}: the graph no longer reaches the canvas's far edge on ${axis} (${near + extent}px against ${span}px at zoom ${scale})`,
			).toBeGreaterThanOrEqual(span - 1e-6);
		}
	}
}

/**
 * The control a listed id is: the element that shows it, or the element around
 * it that takes the keyboard focus — the page may make the entry itself the
 * control or wrap it in one (kwxutvpw).
 */
function listedEntryControl(label: SectionLabel, id: string): Element | undefined {
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

/**
 * Activate the entry a relationship section lists for `id` with one of the two
 * inputs an activation is (kwxutvpw): the pointer's press and release, which is
 * what a user does with a mouse, or Enter or Space on the element around the
 * entry that takes the focus.
 */
function activateListed(
	label: SectionLabel,
	id: string,
	input: "pointer" | "Enter" | " ",
): void {
	if (input === "pointer") {
		clickPointer(entryShown(label, id));
		return;
	}
	const control = listedEntryControl(label, id);
	expect(
		control,
		`the ${label} of the detail region lists ${id} as text, not as a focusable entry`,
	).toBeDefined();
	expect(
		takesFocus(control!),
		`the entry for ${id} in the ${label} of the detail region did not take the focus`,
	).toBe(true);
	pressKeyOn(control!, input);
}

/**
 * Frame the graph with the toolbar's fit action — a user's gesture (mspmqvuk) —
 * and then zoom in by the wheel until the drawn layout is the regime
 * `description` names, and answer the viewport and zoom the page reached. Each
 * case starts from the fit action's own framing so that it inherits no zoom a
 * previous case left behind, and every term afterwards is read at the zoom in
 * hand rather than assumed.
 */
function frameThenZoom(
	layout: GraphLayout,
	regime: (scale: number) => boolean,
	description: string,
	why: string,
): Pan {
	fitButton.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
	let pan = panNow(why);
	for (let step = 0; step < 12 && !regime(pan.scale); step += 1) {
		pan = wheelIn(why);
	}
	expect(
		regime(pan.scale),
		`${why}: the page's own framing and zoom (${pan.scale}) do not draw ${description}, so this case would not be the regime it checks`,
	).toBe(true);
	return pan;
}

describe("an activation asks the interaction to centre on the node it selects (wzsxvmvw)", () => {
	/**
	 * The graph every case here drives: three boxes in the top layer, then one
	 * below them, then one below that, so the drawn layout is wide and deep
	 * enough to give the check both a fitted and an overflowing axis at the
	 * zooms it reaches. Its edges run one way only — `GAMMA` depends on
	 * `ALPHA`, `EPSILON` on `GAMMA` — and every id it names a node document, so
	 * no stub reaches past the drawn boxes and the drawn graph starts at the
	 * layout's own origin. `GAMMA` is the node the check selects, and `ALPHA`
	 * the prerequisite its `depends_on` section lists, so the entry activated
	 * is one the panel lists in a relationship section.
	 */
	const LAYERED = [ALPHA, GAMMA, EPSILON, DELTA, THETA] as const;
	/** The node the check selects before it activates a listed entry. */
	const FROM = GAMMA;
	/** The listed id it activates: a prerequisite of `FROM`, a node of the graph. */
	const ACTIVATED = ALPHA;

	test("a fitted axis takes the node's centre to the canvas centre, with the margin the pan limits refuse", async () => {
		// What the activation gives the panel on its own (kwxutvpw): the detail a
		// click on the activated node's own box gives.
		postGraph(LAYERED);
		select(ACTIVATED);
		const byBox = detailText();
		expect(selectedId()).toBe(ACTIVATED);

		for (const input of ["pointer", "Enter", " "] as const) {
			const how = input === "pointer" ? "a pointer click" : input === " " ? "Space" : input;

			postGraph(LAYERED);
			const layout = drawnLayout(LAYERED);
			const framed = frameThenZoom(
				layout,
				(scale) => !overflows("x", layout, scale) && !overflows("y", layout, scale),
				"a graph that fits the canvas on both axes",
				`framing the graph ${ACTIVATED} is activated in`,
			);
			const limits = panLimitsAt("reading the pan limits back");
			// Leave the view at one end of its pan range, so the activation is
			// read from a place the centring does not already occupy.
			panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, "resting the view at one end of its pan");

			// Where the pan left the view, which the selection moves nothing of.
			select(FROM);
			const before = panNow("the viewport before the activation");
			expect(
				before.scale,
				"panning the graph to read its pan limits back changed the zoom",
			).toBeCloseTo(framed.scale, 3);

			const why = `${how} on ${ACTIVATED} in the depends_on of ${FROM}`;
			const placed = drawnBoxes();
			activateListed("depends_on", ACTIVATED, input);
			const resting = await rested(why);

			expect(
				drawnBoxes(),
				`${why} moved the drawn boxes, where centring is a viewport move and nothing else`,
			).toEqual(placed);
			expect(selectedId(), `${why} did not select ${ACTIVATED}`).toBe(ACTIVATED);
			expect(
				detailText(),
				`${why} did not show the same detail ${ACTIVATED}'s own box gives`,
			).toBe(byBox);
			expectCentredOn(ACTIVATED, layout, before.scale, limits, before, resting, why);
		}
	});

	test("an overflowing axis is held where the page's own pan stops, and the graph keeps covering the canvas", async () => {
		const REGIMES: readonly { need: readonly ("x" | "y")[]; description: string }[] = [
			{
				need: ["x"],
				description: "a graph that overflows the canvas's width and fits its height",
			},
			{ need: ["x", "y"], description: "a graph that overflows the canvas on both axes" },
		];

		for (const regime of REGIMES) {
			postGraph(LAYERED);
			const layout = drawnLayout(LAYERED);
			const framed = frameThenZoom(
				layout,
				(scale) =>
					regime.need.every((axis) => overflows(axis, layout, scale)) &&
					(["x", "y"] as const)
						.filter((axis) => !regime.need.includes(axis))
						.every((axis) => !overflows(axis, layout, scale)),
				regime.description,
				`framing the graph ${ACTIVATED} is activated in`,
			);
			const limits = panLimitsAt("reading the pan limits back");
			// Leave the view at one end of its pan range, so the activation is
			// read from a place the centring does not already occupy.
			panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, "resting the view at one end of its pan");

			// Where the pan left the view, which the selection moves nothing of.
			select(FROM);
			const before = panNow("the viewport before the activation");
			expect(
				before.scale,
				"panning the graph to read its pan limits back changed the zoom",
			).toBeCloseTo(framed.scale, 3);

			const why = `a pointer click on ${ACTIVATED} in the depends_on of ${FROM}, with the graph ${regime.description}`;
			const placed = drawnBoxes();
			activateListed("depends_on", ACTIVATED, "pointer");
			const resting = await rested(why);

			expect(
				drawnBoxes(),
				`${why} moved the drawn boxes, where centring is a viewport move and nothing else`,
			).toEqual(placed);
			expect(selectedId(), `${why} did not select ${ACTIVATED}`).toBe(ACTIVATED);
			expectCentredOn(ACTIVATED, layout, before.scale, limits, before, resting, why);
		}
	});

	/**
	 * The node whose panel lists each relationship section's entry on the
	 * sectioned graph, and the entry it lists there: one case per section, each
	 * populated by the edge that makes it (rmovtvkt) and each naming a node
	 * document of the posted graph, so the entry is an activatable one.
	 */
	const SECTION_CASES: readonly (readonly [Relationship, string, string])[] = [
		// SECTIONED depends on SECTIONED_PRE: its own prerequisite.
		["depends_on", SECTIONED, SECTIONED_PRE],
		// SECTIONED_EVAL evaluates SECTIONED: the node it evaluates.
		["evaluates", SECTIONED_EVAL, SECTIONED],
		// SECTIONED_DEP depends on SECTIONED: one of its dependents.
		["dependents", SECTIONED, SECTIONED_DEP],
		// SECTIONED_EVAL evaluates SECTIONED: one of its evaluators.
		["evaluators", SECTIONED, SECTIONED_EVAL],
	];

	const SECTIONED_GRAPH = [
		SECTIONED_PRE,
		SECTIONED_EVAL,
		SECTIONED,
		SECTIONED_DEP,
		SECTIONED_DEP_TWO,
		SECTIONED_DEP_THREE,
	] as const;

	const FITS_BOTH = "a graph that fits the canvas on both axes";

	/**
	 * Post the sectioned graph, frame it and zoom it into the regime
	 * `description` names, read the pan limits back at the zoom in hand, park the
	 * view at one end of its pan range and select `from` — the node whose panel
	 * lists the entry. Answers the layout, the limits and the viewport the
	 * activation starts from: the terms every case below reads, read the way the
	 * clauses above read them.
	 */
	function sectionedView(
		from: string,
		regime: (layout: GraphLayout, scale: number) => boolean,
		description: string,
		why: string,
	): { layout: GraphLayout; limits: PanLimits; before: Pan } {
		postGraph(SECTIONED_GRAPH);
		const layout = drawnLayout(SECTIONED_GRAPH);
		const framed = frameThenZoom(
			layout,
			(scale) => regime(layout, scale),
			description,
			why,
		);
		const limits = panLimitsAt(`${why}: reading the pan limits back`);
		// Leave the view at one end of its pan range, so the activation is read
		// from a place the centring does not already occupy.
		panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, why);

		// Where the pan left the view, which the selection moves nothing of.
		select(from);
		expect(selectedId(), `${why}: the click on ${from}'s own box did not select it`).toBe(from);
		const before = panNow(`${why}: the viewport before the activation`);
		expect(
			before.scale,
			`${why}: panning the graph to read its pan limits back changed the zoom`,
		).toBeCloseTo(framed.scale, 3);
		return { layout, limits, before };
	}

	/**
	 * Read one activation's viewport against the rule, and the rest of what the
	 * activation is (kwxutvpw): the case is refused when the parked view already
	 * rests where the centring belongs, so a page that asks and one that never
	 * does are told apart; the drawn boxes are the ones drawn before it, and the
	 * selection and the detail region are the ones the node's own box gives.
	 */
	async function expectActivationCentres(
		label: SectionLabel,
		from: string,
		listed: string,
		input: "pointer" | "Enter" | " ",
		byBox: string,
		regime: (layout: GraphLayout, scale: number) => boolean,
		description: string,
	): Promise<void> {
		const how = input === "pointer" ? "a pointer click" : input === " " ? "Space" : input;
		const why = `${how} on ${listed} in the ${label} of ${from}`;
		const { layout, limits, before } = sectionedView(from, regime, description, why);
		expectCentringWouldMove(listed, layout, limits, before, why);

		const placed = drawnBoxes();
		activateListed(label, listed, input);
		const resting = await rested(why);

		expect(
			drawnBoxes(),
			`${why} moved the drawn boxes, where centring is a viewport move and nothing else`,
		).toEqual(placed);
		expect(selectedId(), `${why} did not select ${listed}`).toBe(listed);
		expect(
			detailText(),
			`${why} did not show the same detail ${listed}'s own box gives`,
		).toBe(byBox);
		expectCentredOn(listed, layout, before.scale, limits, before, resting, why);
	}

	/**
	 * One case per section and input, so a section a page does not centre on is
	 * read as the case it is and not hidden behind the first failure of a loop:
	 * every one of the panel's four relationship sections is driven, on the
	 * sectioned graph, at a framing the drawn graph fits on both axes.
	 */
	for (const [label, from, listed] of SECTION_CASES) {
		for (const input of ["pointer", "Enter", " "] as const) {
			const how = input === "pointer" ? "a pointer click" : input === " " ? "Space" : input;
			test(`a fitted axis centres on ${how} on ${listed} in the ${label} of ${from}`, async () => {
				// What the activation gives the panel on its own (kwxutvpw): the
				// detail a click on the activated node's own box gives.
				postGraph(SECTIONED_GRAPH);
				select(listed);
				const byBox = detailText();
				expect(selectedId()).toBe(listed);

				await expectActivationCentres(
					label,
					from,
					listed,
					input,
					byBox,
					(layout, scale) => !overflows("x", layout, scale) && !overflows("y", layout, scale),
					FITS_BOTH,
				);
			});
		}
	}

	const OVERFLOW_REGIMES: readonly { need: readonly ("x" | "y")[]; description: string }[] = [
		{
			need: ["x"],
			description: "a graph that overflows the canvas's width and fits its height",
		},
		{ need: ["x", "y"], description: "a graph that overflows the canvas on both axes" },
	];

	/**
	 * The same sections, on the two overflowing framings: the depends_on pairs
	 * are driven by the clauses above on the layered graph, so these are the
	 * sections those clauses cannot reach. The axes are held independently here
	 * in the same two ways: one axis overflowing while the other fits, and both
	 * overflowing at once.
	 */
	for (const [label, from, listed] of SECTION_CASES) {
		if (label === "depends_on") {
			continue;
		}
		for (const regime of OVERFLOW_REGIMES) {
			test(`an overflowing axis (${regime.description}) is held on a pointer click on ${listed} in the ${label} of ${from}`, async () => {
				postGraph(SECTIONED_GRAPH);
				select(listed);
				const byBox = detailText();
				expect(selectedId()).toBe(listed);

				await expectActivationCentres(
					label,
					from,
					listed,
					"pointer",
					byBox,
					(layout, scale) =>
						regime.need.every((axis) => overflows(axis, layout, scale)) &&
						(["x", "y"] as const)
							.filter((axis) => !regime.need.includes(axis))
							.every((axis) => !overflows(axis, layout, scale)),
					regime.description,
				);
			});
		}
	}

	test("an id that names no node document moves nothing (rusopkql)", async () => {
		postGraph([...BASE, ZETA]);
		select(ZETA);
		const before = panNow(`the viewport before activating ${MISSING}`);
		const entry = entryShown("depends_on", MISSING);

		clickPointer(entry);
		pressKeyOn(entry, "Enter");
		pressKeyOn(entry, " ");
		const resting = await rested(`activating ${MISSING} in the depends_on of ${ZETA}`);

		expect(
			resting,
			`activating ${MISSING}, which names no node document, moved the viewport from ${JSON.stringify(before)} to ${JSON.stringify(resting)}`,
		).toEqual(before);
		expect(selectedId(), `activating ${MISSING} changed the selection`).toBe(ZETA);
	});
});

// ------------------------ the selections that are not an activation

/**
 * The graph the no-move cases are driven on: the layered graph the centring
 * clauses use, for their reason — three boxes in the top layer, then one below
 * them, then one below that, its edges running one way only — so the drawn
 * layout is deep enough to be framed into a regime the canvas fits and to give
 * the view room to be parked away from any node's centring.
 */
const PARKED_GRAPH = [ALPHA, GAMMA, EPSILON, DELTA, THETA] as const;

/**
 * The view a no-move case is read from, and the terms the centring of the node
 * in hand is read against: the graph framed so each axis fits the canvas, the
 * pan limits read back at that zoom, and then the view panned to one end of its
 * range — a place the centring of a node does not already occupy, so a page
 * that moves the view on the selection is told apart from one that never does.
 * `prepare` runs after the graph is posted and before the framing, so a case
 * whose entries only exist once a node is selected makes that selection before
 * the view is parked, and a page that recentres on the selection is still read
 * at the activation itself.
 */
function parkedView(
	why: string,
	prepare?: () => void,
): { layout: GraphLayout; limits: PanLimits; parked: Pan } {
	postGraph(PARKED_GRAPH);
	prepare?.();
	const layout = drawnLayout(PARKED_GRAPH);
	const framed = frameThenZoom(
		layout,
		(scale) => !overflows("x", layout, scale) && !overflows("y", layout, scale),
		"a graph that fits the canvas on both axes",
		why,
	);
	const limits = panLimitsAt(why);
	// Leave the view at one end of its pan range, where the centring of a node
	// would have to move it.
	panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, why);
	const parked = panNow(why);
	expect(parked.scale, `${why}: parking the view changed the zoom`).toBeCloseTo(framed.scale, 3);
	return { layout, limits, parked };
}

/**
 * Refuse a case whose parked view already rests where the centring of `id`
 * belongs: that case would read the same for a page that moved the view and for
 * one that never moved it, so it is not credited. The centring is the one the
 * rule gives that node at the zoom in hand, read per axis the way the centring
 * clauses read it.
 */
function expectCentringWouldMove(
	id: string,
	layout: GraphLayout,
	limits: PanLimits,
	parked: Pan,
	why: string,
): void {
	const target = {
		x: centredPanOn("x", id, layout, parked.scale, limits),
		y: centredPanOn("y", id, layout, parked.scale, limits),
	};
	expect(
		Math.abs(parked.x - target.x) > 0.5 || Math.abs(parked.y - target.y) > 0.5,
		`${why}: the view rested at ${JSON.stringify(parked)} before the selection, where the centring of ${id} belongs at ${JSON.stringify(target)}, so this case cannot tell a page that moves the view on the selection from one that never does`,
	).toBe(true);
}

describe("a selection that is not an activation moves nothing of the viewport (wzsxvmvw)", () => {
	test("a pointer click on a node's own box leaves the viewport exactly where it was", async () => {
		for (const clicked of [ALPHA, GAMMA] as const) {
			const why = `a pointer click on the box of ${clicked}`;
			const { layout, limits, parked } = parkedView(`parking the view before ${why}`);
			expectCentringWouldMove(clicked, layout, limits, parked, why);

			// The click on the node's own box is the selection gesture (ltrnmrsr),
			// and it centres nothing: the viewport is exactly what it was.
			select(clicked);
			const resting = await rested(why);

			expect(
				resting,
				`${why} moved the viewport from ${JSON.stringify(parked)} to ${JSON.stringify(resting)}, where a click on a node's own box selects it and moves nothing of the viewport`,
			).toEqual(parked);
			expect(selectedId(), `${why} did not select ${clicked}`).toBe(clicked);
		}
	});

	test("a ref path's activation leaves the viewport exactly where it was", async () => {
		for (const input of ["pointer", "Enter", " "] as const) {
			const how = input === "pointer" ? "a pointer click" : input === " " ? "Space" : input;
			for (const path of REF_PATHS) {
				const why = `${how} on the ref path ${path}`;
				const { layout, limits, parked } = parkedView(`parking the view before ${why}`, () => {
					// The ref paths are shown once the node that names them is
					// selected; the selection is made before the view is parked, so a
					// page that recentres on the selection is caught at the activation.
					select(THETA);
					expect(selectedId(), "the click on THETA's own box did not select it").toBe(THETA);
				});
				expectCentringWouldMove(THETA, layout, limits, parked, why);

				const control = refPathControl(path);
				expect(
					control,
					`the Content section of ${THETA} shows ${path} as text, not as a control`,
				).toBeDefined();
				if (input !== "pointer") {
					expect(takesFocus(control!), `the entry for ${path} did not take the focus`).toBe(
						true,
					);
				}

				const placed = detailText();
				const posted = postedDuring(() =>
					input === "pointer" ? clickPointer(control!) : pressKeyOn(control!, input),
				);
				const resting = await rested(why);

				expect(
					resting,
					`${why} moved the viewport from ${JSON.stringify(parked)} to ${JSON.stringify(resting)}, where a ref path opens a file and moves nothing of the viewport`,
				).toEqual(parked);
				// The activation is still the ref path's own, so the case is not
				// credited to an entry that does nothing at all: it asks for that path
				// and moves neither the selection nor the detail (rptlovpt).
				expect(
					requestsFor(path, posted).length,
					`${how} on ${path} posted ${describePosts(posted)}; the page's request to open ${path} is one message carrying that repo-relative path`,
				).toBe(1);
				expect(selectedId(), `${how} on a ref path changed the selection`).toBe(THETA);
				expect(detailText(), `${how} on a ref path changed the detail region`).toBe(placed);
			}
		}
	});
});

// -------------------- the frame the page draws the graph and its viewport in

/**
 * The frame the page draws the graph in, which is the layout's own frame only
 * where the layout's bounds start at zero (rtlotqvy): the renderer draws the
 * graph at that origin subtracted and the interaction state maps the canvas to
 * the layout through the same origin (noplrntp), so the drawing and the
 * viewport transform the one surface carries have to share one space. The cases
 * below drive the page where those two frames are not the same frame and read a
 * centring move in the drawn one (wzsxvmvw).
 */
describe("the page draws and moves the graph in the one frame the surface carries (rtlotqvy, noplrntp, wzsxvmvw)", () => {
	/**
	 * The node the check drags. It has no prerequisites and evaluates nothing,
	 * so a drag moves its box and re-routes no route of the graph.
	 */
	const DRAGGED = KAPPA;
	/** The node the check selects before it activates a listed entry. */
	const FROM = GAMMA;
	/** The listed id it activates: a prerequisite of `FROM`, a node of the graph. */
	const ACTIVATED = ALPHA;
	/**
	 * The graph these cases drive: the layered graph's three boxes in the top
	 * layer, one below them and one below that — wide and deep enough to be
	 * framed into a fitting and an overflowing regime — plus the two nodes that
	 * put the layout's bounds origin away from zero on both axes.
	 *
	 * - `ZETA`'s prerequisite `MISSING` names no node document, so that edge is
	 *   drawn as a stub standing above the box it hangs off (the box is a root of
	 *   the graph, in the top layer), and the layout's bounds start above the
	 *   boxes: a negative y origin.
	 * - `DRAGGED` is dragged left of column 0, so the layout's bounds start left
	 *   of the boxes: a negative x origin.
	 */
	const ORIGIN_GRAPH = [ALPHA, GAMMA, EPSILON, DELTA, ZETA, DRAGGED] as const;
	/** How far the hand drags the box to the left, in canvas pixels. */
	const DRAG_LEFT = 800;

	/**
	 * Post the origin graph, select the node the panel lists the activated entry
	 * in, frame the graph and drag the box of the node that has no edges of its
	 * own far to the left. Answers the layout module's geometry for the graph the
	 * page now holds, the place the page dropped the box having been read off the
	 * page through the origin it drew the boxes it did not move at — and the
	 * detail region the activated node's own box gives (kwxutvpw).
	 */
	async function draggedOriginGraph(
		why: string,
	): Promise<{ layout: GraphLayout; byBox: string }> {
		postGraph(ORIGIN_GRAPH);
		// What the activation gives the panel on its own (kwxutvpw): the detail a
		// click on the activated node's own box gives.
		select(ACTIVATED);
		expect(selectedId(), `${why}: the click on ${ACTIVATED}'s own box did not select it`).toBe(
			ACTIVATED,
		);
		const byBox = detailText();

		// Frame the graph first, so the drag below is read at the zoom the page
		// holds rather than at whatever a case before this one left behind.
		fitButton.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
		const placedBefore = boxOf(DRAGGED).style.left;
		dragLeftByHand(DRAGGED, -DRAG_LEFT);
		await dragApplied(DRAGGED, placedBefore);
		expect(
			boxOf(DRAGGED).style.left,
			`${why}: the drag moved no box, where a press past the drag threshold and a move is a drag (spllzqlw)`,
		).not.toBe(placedBefore);
		const boxAfter = drawnPlace(boxOf(DRAGGED), nodesLayer, `${why}: the box the drag moved`);

		// Where the box was dropped, in the layout's own coordinates: the place
		// the page drew it plus the origin the page drew the boxes it did not move
		// at. The layout module then lays the graph out with the box dropped there,
		// exactly as the page did.
		const posted = layoutOf(ORIGIN_GRAPH);
		const origin = drawnOrigin(posted, ORIGIN_GRAPH, DRAGGED, why);
		const drop = { x: boxAfter.x + origin.x, y: boxAfter.y + origin.y };
		const layout = layoutOf(ORIGIN_GRAPH, new Map<string, Point>([[DRAGGED, drop]]));

		// The case is only the case it names where the drawn frame is not the
		// layout's own frame: the bounds origin is negative on both axes, so every
		// place and every extent below is read with one origin subtracted and a
		// page that kept the layout's own coordinates would draw and move the graph
		// somewhere else.
		expect(
			layout.bounds.x,
			`${why}: the layout the page draws starts at x ${layout.bounds.x}, where the box the drag moved must sit left of column 0`,
		).toBeLessThan(0);
		expect(
			layout.bounds.y,
			`${why}: the layout the page draws starts at y ${layout.bounds.y}, where the stub of the node whose prerequisite names no node document must reach above the boxes`,
		).toBeLessThan(0);

		// The drawing is read the way a reader sees it: every box at the layout's
		// place less that origin, inside a node layer the width of the drawn graph.
		expectPageDraws(layout, ORIGIN_GRAPH, why);
		return { layout, byBox };
	}

	/**
	 * Read one activation of the listed entry in the drawn frame: the graph
	 * driven into the regime `description` names, the pan limits read back at that
	 * zoom, the view parked at one end of its pan range, and the centring move the
	 * activation asks for read against the rule, per axis, in the frame the
	 * surface carries.
	 */
	async function expectDrawnFrameCentring(
		layout: GraphLayout,
		regime: (scale: number) => boolean,
		description: string,
		byBox: string,
	): Promise<void> {
		const why = `a pointer click on ${ACTIVATED} in the depends_on of ${FROM}, on a graph ${description} and drawn at a non-zero bounds origin`;
		const framed = frameThenZoom(layout, regime, description, why);
		const limits = panLimitsAt(`${why}: reading the pan limits back`);
		// Leave the view at one end of its pan range, so the activation is read
		// from a place the centring does not already occupy.
		panByHand(-TO_THE_LIMIT, -TO_THE_LIMIT, `${why}: resting the view at one end of its pan`);

		// Where the pan left the view, which the selection moves nothing of.
		select(FROM);
		expect(selectedId(), `${why}: the click on ${FROM}'s own box did not select it`).toBe(FROM);
		const before = panNow(`${why}: the viewport before the activation`);
		expect(
			before.scale,
			`${why}: panning the graph to read its pan limits back changed the zoom`,
		).toBeCloseTo(framed.scale, 3);
		expectCentringWouldMove(ACTIVATED, layout, limits, before, why);

		const placed = drawnBoxes();
		activateListed("depends_on", ACTIVATED, "pointer");
		const resting = await rested(why);

		expect(
			drawnBoxes(),
			`${why}: the activation moved the drawn boxes, where centring is a viewport move and nothing else`,
		).toEqual(placed);
		expect(selectedId(), `${why}: the activation did not select ${ACTIVATED}`).toBe(ACTIVATED);
		expect(
			detailText(),
			`${why}: the activation did not show the same detail ${ACTIVATED}'s own box gives`,
		).toBe(byBox);
		// The pan is read at the precision the surface transform carries at this
		// zoom (see `expectCentredOn`), and the frame the case separates is
		// hundreds of pixels away from it: a page that kept the layout's own
		// coordinates and one that drew them at the bounds origin are told apart
		// here by the origin the graph was dragged out of, not by a hundredth of a
		// pixel.
		expectCentredOn(ACTIVATED, layout, before.scale, limits, before, resting, why, 1);
	}

	test("a fitted axis puts the drawn centre of the node at the canvas centre", async () => {
		const why = `the drawn frame of a graph ${DRAGGED} is dragged out of, at a fitted framing`;
		const { layout, byBox } = await draggedOriginGraph(why);
		await expectDrawnFrameCentring(
			layout,
			(scale) => !overflows("x", layout, scale) && !overflows("y", layout, scale),
			"that fits the canvas on both axes",
			byBox,
		);
	});

	test("an overflowing axis is held where the page's own pan stops, and the drawn graph keeps covering the canvas", async () => {
		const why = `the drawn frame of a graph ${DRAGGED} is dragged out of, at an overflowing framing`;
		const { layout, byBox } = await draggedOriginGraph(why);
		await expectDrawnFrameCentring(
			layout,
			(scale) => overflows("x", layout, scale) && overflows("y", layout, scale),
			"that overflows the canvas on both axes",
			byBox,
		);
	});
});
