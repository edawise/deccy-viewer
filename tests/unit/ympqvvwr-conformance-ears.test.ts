// @vitest-environment jsdom
/**
 * Conformance check: what running the composed page (tpztomkv) must show for
 * the webview-panel requirement (vylxkuxr) and the per-document warning
 * requirement (krvyoumy) to hold.
 *
 * Both requirements are about the deccy graph presented inside a VS Code
 * webview panel as an interactive HTML page, and the composed page is what
 * presents it — the page document it serves and the composition root that draws
 * the graph into it — so the subject is that page, not the vocabulary the page
 * is described in. The page document is parsed here, adopted as the document
 * the graph is drawn into, and the interaction stylesheet it links is read as
 * text, so the check observes the page the requirements speak of, never a
 * particular webview session. The page interface (ympqvvwr) supplies only the
 * names the observations are stated in — the regions, the identity of the drawn
 * elements and the emphasis vocabulary — the graph layer (qmsmvrnr) supplies
 * the model, order and layout the drawn graph is built through, and the panel's
 * region schematic (zrqxuzzy) is where the page's regions are arranged.
 * krvyoumy fixes that a document under nodes/ that does not conform is left out
 * and a warning naming the file and the problem is shown while the remaining
 * nodes render; the interface is the thing the state layer implements, so that
 * clause is observed at runtime through an implementer of it, built here from
 * the interface's own view type: what the read reported is carried beside the
 * graph that is still drawn. The renderer, the stylesheet and the states
 * implementation are imported for the entry points that carry the page; no
 * constant of the page is restated.
 */
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";

import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { NodeRecord } from "../../src/data/nodes";
import {
	EDGE_KEY_ATTR,
	EmphasisClasses,
	NODE_ID_ATTR,
	SELECTORS,
	edgeKey,
} from "../../src/webview/contract";
import type { Presentation, StatesView } from "../../src/webview/contract";
import { renderGraph } from "../../src/webview/render";
import { attachStates } from "../../src/webview/states";

/** vylxkuxr: the page the deccy graph is presented in. */
const PAGE = "media/webview.html";
/** vylxkuxr: the stylesheets the page presents the graph through. */
const INTERACT_CSS = "src/styles/interact.css";

function pageDocument(): Document {
	return new DOMParser().parseFromString(readFileSync(PAGE, "utf8"), "text/html");
}

function records(): NodeRecord[] {
	return [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "a" },
		},
		{
			id: "bbbbbbbb",
			kind: "evaluation",
			dependsOn: [],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "b" },
		},
	];
}

/** The page with the graph drawn into it. */
function drawn() {
	const document = pageDocument();
	const model = buildGraph(records());
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);

	renderGraph(
		{
			edges: document.querySelector(SELECTORS.edges) as unknown as SVGSVGElement,
			nodes: document.querySelector(SELECTORS.nodes) as HTMLElement,
		},
		{ model, order, layout, labels: new Map() },
	);

	return { document, model };
}

describe("the composed page carries every region the interface names (vylxkuxr)", () => {
	test("every selector of the interface reaches a region of the page", () => {
		const document = pageDocument();

		// vylxkuxr: the composed page presents the graph; the interface names the
		// regions it is presented in, so every one of them must be a region of
		// that page.
		for (const [region, selector] of Object.entries(SELECTORS)) {
			expect(document.querySelector(selector), `${region} (${selector})`).not.toBeNull();
		}
	});

	test("the page is an interactive HTML page: it loads a script and the stylesheets, and every reference resolves", () => {
		const document = pageDocument();
		const references = [...document.querySelectorAll("link[href], script[src]")].map(
			(element) => element.getAttribute("href") ?? element.getAttribute("src") ?? "",
		);

		// vylxkuxr: an interactive page runs a script ...
		expect(references.some((reference) => reference.endsWith(".js"))).toBe(true);
		// ... and presents the graph through the stylesheets it loads ...
		expect(references.some((reference) => reference.endsWith(".css"))).toBe(true);
		// ... and every reference is one that names a file the repository has.
		// The page's script is the compiled entry of a module in the repository,
		// so a .js reference is satisfied by its .ts sibling: the page is read as
		// the repository states it, not as a build would leave it.
		for (const reference of references) {
			const resolved = path.join("media", reference);
			const source = resolved.endsWith(".js") ? `${resolved.slice(0, -3)}.ts` : resolved;
			expect(existsSync(resolved) || existsSync(source), reference).toBe(true);
		}
	});
});

describe("the composed page fixes the identity of its drawn elements (vylxkuxr)", () => {
	test("every drawn box carries the node id of the interface", () => {
		const { document } = drawn();

		// vylxkuxr: the composed page presents the graph; the interface fixes
		// that every drawn box carries its node id, so the drawn boxes are the
		// nodes.
		const boxes = [...document.querySelectorAll(`[${NODE_ID_ATTR}]`)].map((element) =>
			element.getAttribute(NODE_ID_ATTR),
		);
		expect(boxes.sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("every drawn part of an edge carries the edge key of the interface", () => {
		const { document, model } = drawn();

		// vylxkuxr: the composed page presents the graph; the interface fixes that
		// every drawn part of an edge carries that edge's key, so the drawn edge
		// parts name exactly the edges of the graph.
		const keys = new Set(
			[...document.querySelectorAll(`[${EDGE_KEY_ATTR}]`)].map((element) =>
				element.getAttribute(EDGE_KEY_ATTR),
			),
		);
		expect([...keys].sort()).toEqual(model.edges.map((edge) => edgeKey(edge)).sort());
	});
});

describe("the composed page's emphasis is the vocabulary its stylesheet styles (vylxkuxr)", () => {
	test("every class of the vocabulary is the one the stylesheet styles", () => {
		const interact = readFileSync(INTERACT_CSS, "utf8");

		// vylxkuxr: the composed page is interactive — the emphasis vocabulary
		// the interface names is what its drawn elements switch between, so the
		// stylesheet the page links styles every class of it.
		for (const name of Object.values(EmphasisClasses)) {
			expect(interact, name).toContain(`.${name}`);
		}
	});
});

describe("the composed page carries the problems of the documents it presents (krvyoumy)", () => {
	test("an implementer of the interface carries the per-document problems and shows them alongside the graph", () => {
		const view: StatesView = {
			canvas: document.createElement("main"),
			banner: document.createElement("div"),
		};
		const states = attachStates(view);

		// What the renderer (rtlotqvy) draws is on the canvas by the time the
		// graph data arrives with the problems of the documents left out.
		const drawn = document.createElement("div");
		drawn.className = "node";
		view.canvas.append(drawn);

		// krvyoumy: a document under nodes/ that does not conform is left out
		// of the graph, and its file and problem come back as a warning, each
		// naming the file and the problem.
		const problems = ["nodes/aaaaaaaa.json: invalid JSON (Unexpected token } in JSON)"];
		states.loaded(1, problems);

		// The interface (ympqvvwr) the state layer implements declares the
		// presentation's warnings; the clause is observed at runtime through an
		// implementer of it, built here from the interface's own view type, and
		// what the read reported is carried beside the graph that is still
		// drawn (krvyoumy).
		const presentation: Readonly<Presentation> = states.state();
		expect(presentation.warnings).toEqual(problems);
		// ... and they are shown while the remaining nodes render, not in place
		// of them (krvyoumy).
		expect(view.banner.textContent).toContain("nodes/aaaaaaaa.json");
		expect(view.canvas.contains(drawn)).toBe(true);
	});
});
