// @vitest-environment jsdom
/**
 * Module-boundary check for the page module `src/webview/search.ts`
 * (uryrrttr): the module the page attaches to find nodes by a text query.
 *
 * The decision is an implementation and its load-bearing prerequisites are
 * code artefacts (src/webview/contract.ts, src/graph/model.ts,
 * src/graph/order.ts, src/webview/interact.ts/keyboard.ts, and the renderer
 * and grammar of src/webview/render.ts and src/styles/grammar.css), so the
 * matrix cell is code-to-code and the check is runnable. The check imports the
 * module's public entry points and drives them against a fixture canvas whose
 * node boxes carry `data-node-id`, a recording InteractionController and a
 * small graph built with the graph model and order. No page and no main.ts are
 * involved: the check observes the module, and for the composition with the
 * static visual grammar one block draws the graph with the renderer so the mark
 * is seen on the box the grammar draws.
 *
 * The public surface this check freezes:
 *
 *   attachSearch({ canvas, controller, graph, labels })
 *     -> { open(), close(), setQuery(q), query(), isOpen(), marks(),
 *          setGraph(graph, labels?), dispose() }
 *
 *   SEARCH_MATCH_CLASS — the class a matching node box carries.
 *
 * `labels` is a `ReadonlyMap<string, string>`. `marks()` is read as an
 * iterable of marked node ids; its iteration order is not fixed here (graph
 * order is checked through the selection Enter and Shift+Enter make).
 * Typing into the field is observed as a standard `input` event on the focused
 * field.
 *
 * The behaviours checked are the recorded search requirements at the module
 * boundary: nvxuyzot (`/` opens a focused field, selection/pan/zoom
 * unchanged), oovzklpv (id/label/content matching, case-insensitive, empty
 * marks none), yqwsztww (Enter/Shift+Enter over the marked set in graph order,
 * wrapping, no match changes nothing), kstrrnyt (Esc closes, clears marks and
 * selection), ukuppmko (reload keeps the query and re-marks) and zolnxlyv (the
 * match class is an added emphasis, not dimming and not a replacement for the
 * selected/related classes). The composition behaviours (Enter and Esc outside
 * the field) stay with keyboard.ts and are not re-checked here. The last block
 * checks the composition with the static visual grammar (rtlotqvy), which the
 * search's own stylesheet sits on top of: the match class is seen on the box the
 * renderer drew, and the rules the search adds for that class spend none of the
 * properties the interaction states spend on the selected, related and dimmed
 * cues.
 */
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { NodeContent, NodeRecord } from "../../src/data/nodes";
import { layoutGraph } from "../../src/graph/layout";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import type { GraphOrder } from "../../src/graph/order";
import { EmphasisClasses, NODE_ID_ATTR } from "../../src/webview/contract";
import type {
	InteractionController,
	InteractionGraph,
	Viewport,
} from "../../src/webview/contract";
import { renderGraph } from "../../src/webview/render";
import { attachSearch, SEARCH_MATCH_CLASS } from "../../src/webview/search";

/** The search controller the module's `attachSearch` returns. */
type Search = ReturnType<typeof attachSearch>;

/** One graph fixture: the canvas, the boxes, the fake controller and the module. */
interface Fixture {
	canvas: HTMLElement;
	nodes: HTMLElement;
	controller: FakeController;
	graph: InteractionGraph;
	labels: ReadonlyMap<string, string>;
	boxes: Map<string, HTMLElement>;
	search: Search;
}

/** The searches attached by the current test, disposed after it. */
const attached: Search[] = [];

beforeEach(() => {
	document.body.replaceChildren();
});

afterEach(() => {
	while (attached.length > 0) {
		attached.pop()?.dispose();
	}
	document.body.replaceChildren();
});

/**
 * The interaction controller the page hands the module. It records every
 * selection and viewport operation so the check can see that opening a search
 * leaves them alone, and it answers the reads the module makes from the
 * current state.
 */
class FakeController implements InteractionController {
	current: string | null = null;
	focusedNode: string | null = null;
	view: Viewport = { x: 0, y: 0, scale: 1 };

	readonly calls = {
		select: [] as (string | null)[],
		clearSelection: 0,
		focusNode: [] as (string | null)[],
		focusStep: [] as boolean[],
		panBy: [] as Array<[number, number]>,
		zoomAt: [] as Array<[number, { x: number; y: number }]>,
		zoomAboutCentre: [] as number[],
		fitGraph: 0,
		moveNodeBy: [] as Array<[string, number, number]>,
		setGraph: [] as InteractionGraph[],
	};

	reset(): void {
		this.calls.select.length = 0;
		this.calls.clearSelection = 0;
		this.calls.focusNode.length = 0;
		this.calls.focusStep.length = 0;
		this.calls.panBy.length = 0;
		this.calls.zoomAt.length = 0;
		this.calls.zoomAboutCentre.length = 0;
		this.calls.fitGraph = 0;
		this.calls.moveNodeBy.length = 0;
		this.calls.setGraph.length = 0;
	}

	viewport(): Readonly<Viewport> {
		return this.view;
	}

	selected(): string | null {
		return this.current;
	}

	focused(): string | null {
		return this.focusedNode;
	}

	select(id: string | null): void {
		this.calls.select.push(id);
		this.current = id;
	}

	clearSelection(): void {
		this.calls.clearSelection += 1;
		this.current = null;
	}

	focusNode(id: string | null): void {
		this.calls.focusNode.push(id);
		this.focusedNode = id;
	}

	focusStep(reverse: boolean): void {
		this.calls.focusStep.push(reverse);
	}

	panBy(dx: number, dy: number): void {
		this.calls.panBy.push([dx, dy]);
	}

	zoomAt(factor: number, at: { x: number; y: number }): void {
		this.calls.zoomAt.push([factor, at]);
	}

	zoomAboutCentre(factor: number): void {
		this.calls.zoomAboutCentre.push(factor);
	}

	fitGraph(): void {
		this.calls.fitGraph += 1;
	}

	moveNodeBy(id: string, dx: number, dy: number): void {
		this.calls.moveNodeBy.push([id, dx, dy]);
	}

	setGraph(graph: InteractionGraph): void {
		this.calls.setGraph.push(graph);
	}

	dispose(): void {}
}

/** Inline text content with the rationale every record carries. */
function text(id: string, body: string): NodeContent {
	return { type: "text", ref: "inline", content: body, rationale: `rationale for ${id}` };
}

/** One decision record. */
function record(id: string, dependsOn: readonly string[], body: string): NodeRecord {
	return { id, kind: "decision", dependsOn, evaluates: [], content: text(id, body) };
}

/**
 * The first graph. `needle` matches alpha001 by content, bravo002 by label
 * and charl003 by content with a different case; root0001 and delta004 match
 * it nowhere.
 */
function records(): NodeRecord[] {
	return [
		record("root0001", [], "the root node"),
		record("alpha001", ["root0001"], "a needle in the content"),
		record("bravo002", ["root0001"], "a plain node"),
		record("charl003", ["alpha001"], "another NEEDLE here"),
		record("delta004", ["bravo002"], "no match at all"),
	];
}

/** Labels for {@link records}. bravo002 matches the query by its label alone. */
function labels(): Map<string, string> {
	return new Map([
		["root0001", "Root"],
		["alpha001", "Alpha"],
		["bravo002", "Bravo Needle"],
		["charl003", "Charlie"],
		["delta004", "Delta"],
	]);
}

/**
 * The reloaded graph. alpha001 still matches; bravo002 and charl003 no longer
 * do; echo0005 is new and matches by content.
 */
function reloadedRecords(): NodeRecord[] {
	return [
		record("root0001", [], "the root node"),
		record("alpha001", ["root0001"], "a needle in the content"),
		record("bravo002", ["root0001"], "a plain node"),
		record("charl003", ["alpha001"], "nothing to find"),
		record("echo0005", ["bravo002"], "a needle appears here"),
	];
}

/** Labels for {@link reloadedRecords}. */
function reloadedLabels(): Map<string, string> {
	return new Map([
		["root0001", "Root"],
		["alpha001", "Alpha"],
		["bravo002", "Bravo"],
		["charl003", "Charlie"],
		["echo0005", "Echo"],
	]);
}

/** Build the graph and its deterministic order from records. */
function graphFor(source: readonly NodeRecord[]): InteractionGraph {
	const model = buildGraph(source);
	return { model, order: graphOrder(model) };
}

/** Add `id` to `into` in graph order. */
function inGraphOrder(order: GraphOrder, ids: readonly string[]): string[] {
	const wanted = new Set(ids);
	return order.ids.filter((id) => wanted.has(id));
}

/** A stable copy of the marked ids. */
function marked(search: Search): string[] {
	return Array.from(search.marks()).sort();
}

/** The box the fixture drew for `id`. */
function boxOf(page: Fixture, id: string): HTMLElement {
	const element = page.boxes.get(id);
	if (element === undefined) {
		throw new Error(`the fixture has no box for ${id}`);
	}
	return element;
}

/** The focused search field, as the module leaves it after opening. */
function focusedField(): HTMLInputElement | HTMLTextAreaElement {
	const active = document.activeElement;
	if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
		return active;
	}
	throw new Error("the search field is not focused");
}

/** Type `value` into the field through a standard `input` event. */
function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
	field.value = value;
	field.dispatchEvent(new Event("input", { bubbles: true }));
	field.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Press one key while the field is focused. */
function pressKey(field: HTMLElement, key: string, init: KeyboardEventInit = {}): void {
	field.dispatchEvent(
		new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
	);
}

/** Draw the boxes of `graph` into the fixture's nodes region. */
function drawBoxes(
	nodes: HTMLElement,
	boxes: Map<string, HTMLElement>,
	graph: InteractionGraph,
): void {
	for (const box of boxes.values()) {
		box.remove();
	}
	boxes.clear();
	for (const id of graph.order.ids) {
		const box = document.createElement("div");
		box.setAttribute(NODE_ID_ATTR, id);
		nodes.append(box);
		boxes.set(id, box);
	}
}

/** Build the page set the module attaches to. */
function setup(
	source: readonly NodeRecord[] = records(),
	names: ReadonlyMap<string, string> = labels(),
): Fixture {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const surface = document.createElement("div");
	surface.className = "canvas__surface";
	const nodes = document.createElement("div");
	nodes.className = "canvas__nodes";
	surface.append(nodes);
	canvas.append(surface);
	document.body.append(canvas);

	const graph = graphFor(source);
	const boxes = new Map<string, HTMLElement>();
	drawBoxes(nodes, boxes, graph);

	const controller = new FakeController();
	const search = attachSearch({ canvas, controller, graph, labels: names });
	attached.push(search);

	return { canvas, nodes, controller, graph, labels: names, boxes, search };
}

describe("the search field opens without disturbing the viewer (nvxuyzot)", () => {
	test("`/` opens and focuses the search field without changing selection, pan or zoom", () => {
		const page = setup();
		page.controller.select("alpha001");
		page.controller.view = { x: 12, y: 34, scale: 1.5 };
		page.controller.reset();

		page.canvas.dispatchEvent(
			new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }),
		);

		// nvxuyzot: `/` opens a focused search field over the graph ...
		expect(page.search.isOpen()).toBe(true);
		const field = focusedField();
		expect(page.canvas.contains(field)).toBe(true);

		// ... and leaves the current selection, pan and zoom unchanged.
		expect(page.controller.selected()).toBe("alpha001");
		expect(page.controller.viewport()).toEqual({ x: 12, y: 34, scale: 1.5 });
		expect(page.controller.calls.select).toEqual([]);
		expect(page.controller.calls.clearSelection).toBe(0);
		expect(page.controller.calls.panBy).toEqual([]);
		expect(page.controller.calls.zoomAt).toEqual([]);
		expect(page.controller.calls.zoomAboutCentre).toEqual([]);
		expect(page.controller.calls.fitGraph).toBe(0);
	});

	test("`/` with a modifier does not open the search field", () => {
		const page = setup();

		for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
			page.canvas.dispatchEvent(
				new KeyboardEvent("keydown", { key: "/", bubbles: true, ...init }),
			);
			expect(page.search.isOpen(), JSON.stringify(init)).toBe(false);
		}
	});
});

describe("a typed query marks exactly the matching nodes (oovzklpv)", () => {
	test("id, label and content matches are marked case-insensitively; an empty query marks none", () => {
		const page = setup();
		page.search.open();

		// oovzklpv: the query typed in the field matches a node whose id, label
		// or content contains it, ignoring case. Here alpha001 matches by
		// content, bravo002 by label and charl003 by content in another case.
		const field = focusedField();
		type(field, "NeEdLe");

		expect(page.search.query().toLowerCase()).toBe("needle");
		const matching = ["alpha001", "bravo002", "charl003"];
		expect(marked(page.search)).toEqual([...matching].sort());
		for (const id of matching) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(true);
		}
		for (const id of ["root0001", "delta004"]) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(false);
		}

		// oovzklpv: an empty query marks no node.
		type(field, "");
		expect(page.search.query()).toBe("");
		expect(marked(page.search)).toEqual([]);
		for (const box of page.boxes.values()) {
			expect(box.classList.contains(SEARCH_MATCH_CLASS)).toBe(false);
		}

		// The same rule applies through the controller's query setter: ids are
		// part of what a query matches.
		page.search.setQuery("delta004");
		expect(marked(page.search)).toEqual(["delta004"]);
		page.search.setQuery("");
	});
});

describe("Enter and Shift+Enter move through the marked set (yqwsztww)", () => {
	test("Enter selects the next marked node in graph order and Shift+Enter the previous, wrapping", () => {
		const page = setup();
		page.search.open();
		page.search.setQuery("needle");
		const markedOrder = inGraphOrder(page.graph.order, [
			"alpha001",
			"bravo002",
			"charl003",
		]);
		expect(markedOrder.length).toBe(3);
		page.controller.reset();

		const field = focusedField();

		// yqwsztww: Enter selects the next marked node in graph order, from the
		// first marked node when nothing is selected ...
		pressKey(field, "Enter");
		expect(page.controller.calls.select).toEqual([markedOrder[0]]);
		expect(page.controller.selected()).toBe(markedOrder[0]);

		// ... and then the following ones.
		pressKey(field, "Enter");
		expect(page.controller.calls.select.at(-1)).toBe(markedOrder[1]);
		pressKey(field, "Enter");
		expect(page.controller.calls.select.at(-1)).toBe(markedOrder[2]);

		// ... wrapping from the last marked node to the first.
		pressKey(field, "Enter");
		expect(page.controller.calls.select.at(-1)).toBe(markedOrder[0]);

		// yqwsztww: Shift+Enter selects the previous marked node, wrapping from
		// the first to the last.
		pressKey(field, "Enter", { shiftKey: true });
		expect(page.controller.calls.select.at(-1)).toBe(markedOrder[2]);
	});

	test("Enter and Shift+Enter change nothing when the query marks no node", () => {
		const page = setup();
		page.search.open();
		page.search.setQuery("this-query-matches-no-node");
		page.controller.select("alpha001");
		page.controller.reset();

		const field = focusedField();
		pressKey(field, "Enter");
		pressKey(field, "Enter", { shiftKey: true });

		// yqwsztww: when the query marks no node, no selection changes.
		expect(page.controller.calls.select).toEqual([]);
		expect(page.controller.calls.clearSelection).toBe(0);
		expect(page.controller.selected()).toBe("alpha001");
	});
});

describe("Esc dismisses the search and leaves no search state behind (kstrrnyt)", () => {
	test("Esc closes the field, clears the marks and clears the selection", () => {
		const page = setup();
		page.search.open();
		page.search.setQuery("needle");
		page.controller.select("bravo002");
		page.controller.reset();

		for (const id of ["alpha001", "bravo002", "charl003"]) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(true);
		}

		pressKey(focusedField(), "Escape");

		// kstrrnyt: Esc closes the field ...
		expect(page.search.isOpen()).toBe(false);
		// ... clears the marks that query made ...
		expect(marked(page.search)).toEqual([]);
		for (const box of page.boxes.values()) {
			expect(box.classList.contains(SEARCH_MATCH_CLASS)).toBe(false);
		}
		// ... and clears the selection.
		expect(page.controller.calls.clearSelection).toBe(1);
		expect(page.controller.selected()).toBeNull();
	});
});

describe("a reload keeps the query and marks the new graph (ukuppmko)", () => {
	test("setGraph keeps the active query and re-marks against the reloaded graph", () => {
		const page = setup();
		page.search.open();
		page.search.setQuery("needle");
		const query = page.search.query();
		page.controller.select("alpha001");
		page.controller.reset();

		const nextGraph = graphFor(reloadedRecords());
		const nextLabels = reloadedLabels();
		drawBoxes(page.nodes, page.boxes, nextGraph);
		page.search.setGraph(nextGraph, nextLabels);

		// ukuppmko: the typed query stays active ...
		expect(page.search.query().toLowerCase()).toBe(query.toLowerCase());
		// ... and the reloaded graph is marked again with the same rule:
		// alpha001 still matches, echo0005 is the new content match, and
		// bravo002 and charl003 no longer match.
		const expected = inGraphOrder(nextGraph.order, ["alpha001", "echo0005"]);
		expect(marked(page.search)).toEqual([...expected].sort());
		for (const id of expected) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(true);
		}
		for (const id of ["root0001", "bravo002", "charl003"]) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(false);
		}

		// ukuppmko: selection follows the existing reload behaviour; this module
		// neither selects nor clears by itself.
		expect(page.controller.selected()).toBe("alpha001");
		expect(page.controller.calls.select).toEqual([]);
		expect(page.controller.calls.clearSelection).toBe(0);
	});
});

describe("a match is an added emphasis, not a replacement (zolnxlyv)", () => {
	test("the match class is added without displacing the selected/related classes and without dimming non-matches", () => {
		const page = setup();
		const selected = boxOf(page, "alpha001");
		const related = boxOf(page, "bravo002");
		const alreadyDimmed = boxOf(page, "delta004");
		selected.classList.add(EmphasisClasses.selected);
		related.classList.add(EmphasisClasses.related);
		alreadyDimmed.classList.add(EmphasisClasses.dimmed);

		page.search.open();
		page.search.setQuery("needle");

		// zolnxlyv: the nodes the query matches carry the added match emphasis.
		for (const id of ["alpha001", "bravo002", "charl003"]) {
			expect(boxOf(page, id).classList.contains(SEARCH_MATCH_CLASS), id).toBe(true);
		}

		// ... and the emphasis the selection already set is not displaced.
		expect(selected.classList.contains(EmphasisClasses.selected)).toBe(true);
		expect(related.classList.contains(EmphasisClasses.related)).toBe(true);

		// zolnxlyv: the query dims no non-matching element and undims none that
		// the selection dimmed.
		expect(boxOf(page, "root0001").classList.contains(EmphasisClasses.dimmed)).toBe(false);
		expect(alreadyDimmed.classList.contains(EmphasisClasses.dimmed)).toBe(true);
		expect(boxOf(page, "root0001").classList.contains(SEARCH_MATCH_CLASS)).toBe(false);
		expect(alreadyDimmed.classList.contains(SEARCH_MATCH_CLASS)).toBe(false);

		// The match emphasis is a state of its own, not one of the selection's.
		expect(SEARCH_MATCH_CLASS).not.toBe(EmphasisClasses.selected);
		expect(SEARCH_MATCH_CLASS).not.toBe(EmphasisClasses.related);
		expect(SEARCH_MATCH_CLASS).not.toBe(EmphasisClasses.dimmed);
	});
});

/*
 * The composition with the static visual grammar (rtlotqvy).
 *
 * The blocks above run the module over boxes the check built itself, so they see
 * the classes the module writes but not what is drawn. This block draws the
 * graph with the renderer — which is where the boxes and their class names come
 * from — and reads the search's own stylesheet and the interaction states'
 * stylesheet as text. No page and no main.ts are involved here either.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

const SEARCH_CSS = readFileSync("src/styles/search.css", "utf8");
const STATES_CSS = readFileSync("src/styles/interact.css", "utf8");

/** One rule of a stylesheet: its comment-free selectors and its property names. */
interface CssRule {
	selectors: string[];
	properties: string[];
}

/** The property names one rule body declares. */
function declared(body: string): string[] {
	return body
		.split(";")
		.map((declaration) => declaration.split(":")[0]!.trim())
		.filter((name) => name.length > 0);
}

/** The class name as one whole class in a selector, never a prefix of a longer name. */
function classPattern(className: string): RegExp {
	return new RegExp(`\\.${className}(?![\\w-])`);
}

/** Every rule of `css` whose selector list uses `className` as one whole class. */
function rulesUsing(css: string, className: string): CssRule[] {
	const pattern = classPattern(className);
	const found: CssRule[] = [];
	for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const selectors = rule[1]!
			.split(",")
			.map((part) => part.trim())
			.filter((part) => pattern.test(part));
		if (selectors.length > 0) {
			found.push({ selectors, properties: declared(rule[2]!) });
		}
	}
	return found;
}

/** `selector` without `className`, i.e. the part the drawn box has to satisfy. */
function withoutClass(selector: string, className: string): string {
	return selector.replace(new RegExp(`\\.${className}(?![\\w-])`, "g"), "").trim();
}

/** A page drawn by the renderer, with the search attached to the same canvas. */
interface DrawnPage {
	canvas: HTMLElement;
	drawn: Map<string, HTMLElement>;
	controller: FakeController;
	search: Search;
}

/** Draw `source` with the renderer and attach the search over the drawn canvas. */
function drawnPage(
	source: readonly NodeRecord[] = records(),
	names: ReadonlyMap<string, string> = labels(),
): DrawnPage {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const surface = document.createElement("div");
	surface.className = "canvas__surface";
	const edges = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
	const nodes = document.createElement("div");
	nodes.className = "canvas__nodes";
	surface.append(edges, nodes);
	canvas.append(surface);
	document.body.append(canvas);

	const graph = graphFor(source);
	const layout = layoutGraph(graph.model, graph.order);
	renderGraph({ edges, nodes }, { model: graph.model, order: graph.order, layout, labels: names });

	const drawn = new Map<string, HTMLElement>();
	for (const box of Array.from(nodes.querySelectorAll<HTMLElement>(`[${NODE_ID_ATTR}]`))) {
		drawn.set(box.getAttribute(NODE_ID_ATTR) ?? "", box);
	}

	const controller = new FakeController();
	const search = attachSearch({ canvas, controller, graph, labels: names });
	attached.push(search);
	return { canvas, drawn, controller, search };
}

describe("the match is drawn on the grammar's own box (rtlotqvy)", () => {
	test("the search's rules for the match are reached by the box the renderer drew", () => {
		const page = drawnPage();
		page.search.setQuery("needle");

		// oovzklpv, zolnxlyv: the drawn boxes of the matching nodes carry the
		// added emphasis.
		for (const id of ["alpha001", "bravo002", "charl003"]) {
			const box = page.drawn.get(id);
			expect(box, id).toBeDefined();
			expect(box!.classList.contains(SEARCH_MATCH_CLASS), id).toBe(true);
		}

		// The emphasis lands on the elements the renderer drew, and on no other
		// element of the canvas: the mark is a class on the grammar's box, not a
		// mark of the search's own beside it.
		const painted = Array.from(
			page.canvas.querySelectorAll<HTMLElement>(`[${NODE_ID_ATTR}].${SEARCH_MATCH_CLASS}`),
		);
		const drawnBoxes = new Set<HTMLElement>(page.drawn.values());
		expect(painted.length).toBe(page.search.marks().length);
		for (const box of painted) {
			expect(drawnBoxes.has(box)).toBe(true);
		}

		// rtlotqvy: the search's own rule for the match is reached by the element
		// the renderer drew. Adding the class is not enough if the class names of
		// the rule and of the drawn box never meet.
		const matchRules = rulesUsing(SEARCH_CSS, SEARCH_MATCH_CLASS);
		expect(matchRules.length).toBeGreaterThan(0);
		const box = page.drawn.get("alpha001")!;
		for (const rule of matchRules) {
			for (const selector of rule.selectors) {
				const rest = withoutClass(selector, SEARCH_MATCH_CLASS);
				if (rest.length === 0) {
					continue;
				}
				expect(box.matches(rest), `${selector} does not reach the drawn box`).toBe(true);
			}
		}
	});

	test("the match is an emphasis beside the selection's cues, not a replacement", () => {
		const page = drawnPage();
		const selected = page.drawn.get("alpha001")!;
		const related = page.drawn.get("bravo002")!;
		const dimmed = page.drawn.get("delta004")!;
		selected.classList.add(EmphasisClasses.selected);
		related.classList.add(EmphasisClasses.related);
		dimmed.classList.add(EmphasisClasses.dimmed);

		page.search.setQuery("needle");

		// zolnxlyv: on the drawn box the match sits beside the cue the selection
		// gave it, and neither displaces the other.
		for (const box of [selected, related]) {
			expect(box.classList.contains(SEARCH_MATCH_CLASS)).toBe(true);
		}
		expect(selected.classList.contains(EmphasisClasses.selected)).toBe(true);
		expect(related.classList.contains(EmphasisClasses.related)).toBe(true);

		// rtlotqvy: the emphasis the search adds is drawn by its own rules on top
		// of the grammar's box, and those rules spend none of the properties the
		// interaction states spend on the selected, related and dimmed cues — so
		// the search's emphasis replaces none of them.
		const added = new Set(
			rulesUsing(SEARCH_CSS, SEARCH_MATCH_CLASS).flatMap((rule) => rule.properties),
		);
		expect(added.size).toBeGreaterThan(0);
		const cues = new Set(
			[
				EmphasisClasses.selected,
				EmphasisClasses.related,
				EmphasisClasses.dimmed,
			]
				.flatMap((className) => rulesUsing(STATES_CSS, className))
				.flatMap((rule) => rule.properties),
		);
		expect(cues.size).toBeGreaterThan(0);
		expect([...added].filter((name) => cues.has(name))).toEqual([]);
	});
});
