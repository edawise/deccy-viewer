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
 *
 * The check names no function, class, tag or nesting the record does not fix:
 * it finds the regions through the page interface's own selectors, finds the
 * marks through the search module's exported match class, and finds the query
 * field as the focused input the page put over the canvas.
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
	];
}

// --------------------------------------------------------------- the page

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

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
	// interactions fit, pan and zoom against is given to it. A pointer capture
	// is a no-op outside a browser.
	Object.defineProperty(canvas, "clientWidth", { value: 800, configurable: true });
	Object.defineProperty(canvas, "clientHeight", { value: 600, configurable: true });
	canvas.setPointerCapture = () => undefined;

	(globalThis as unknown as Record<string, unknown>).acquireVsCodeApi = (): unknown => ({
		postMessage: (): void => undefined,
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
	const box = boxOf(id);
	box.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
	box.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
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
	canvas.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
	canvas.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
}

beforeEach(reset);

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
