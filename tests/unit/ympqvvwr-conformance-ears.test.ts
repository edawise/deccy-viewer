// @vitest-environment jsdom
/**
 * Conformance check: what running the page interface (ympqvvwr) must show for
 * the webview-panel requirement (vylxkuxr) and the per-document warning
 * requirement (krvyoumy) to hold.
 *
 * vylxkuxr fixes what the page is — the deccy graph presented inside a VS Code
 * webview panel as an interactive HTML page — and the interface names the
 * regions it is presented in, the identity of the drawn elements and the
 * emphasis vocabulary. The page is parsed here and drawn into, so the check
 * observes the page the interface names regions of, never a particular webview
 * session. krvyoumy fixes that a document under nodes/ that does not conform is
 * left out and a warning naming the file and the problem is shown while the
 * remaining nodes render; the interface is the thing the state layer implements,
 * so that half is observed at runtime through an implementer of it. The
 * interface, the renderer and the states implementation are imported for the
 * entry points that carry it; no constant of the page is restated.
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

describe("the page the interface names its regions of (vylxkuxr)", () => {
	test("every selector of the interface reaches a region of the page", () => {
		const document = pageDocument();

		// vylxkuxr: the graph is presented as an HTML page; the interface names
		// the regions of that page, so every one of them must be a region of it.
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
		// ... and every reference is one that resolves from where the page lives.
		for (const reference of references) {
			expect(existsSync(path.join("media", reference)), reference).toBe(true);
		}
	});
});

describe("the identity the interface fixes for the drawn elements (vylxkuxr)", () => {
	test("every drawn box carries the node id of the interface", () => {
		const { document } = drawn();

		// vylxkuxr: the page presents the graph; the interface fixes that every
		// drawn box carries its node id, so the drawn boxes are the nodes.
		const boxes = [...document.querySelectorAll(`[${NODE_ID_ATTR}]`)].map((element) =>
			element.getAttribute(NODE_ID_ATTR),
		);
		expect(boxes.sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("every drawn part of an edge carries the edge key of the interface", () => {
		const { document, model } = drawn();

		// vylxkuxr: the page presents the graph; the interface fixes that every
		// drawn part of an edge carries that edge's key, so the drawn edge parts
		// name exactly the edges of the graph.
		const keys = new Set(
			[...document.querySelectorAll(`[${EDGE_KEY_ATTR}]`)].map((element) =>
				element.getAttribute(EDGE_KEY_ATTR),
			),
		);
		expect([...keys].sort()).toEqual(model.edges.map((edge) => edgeKey(edge)).sort());
	});
});

describe("the emphasis vocabulary the interface names (vylxkuxr)", () => {
	test("every class of the vocabulary is the one the stylesheet styles", () => {
		const interact = readFileSync(INTERACT_CSS, "utf8");

		// vylxkuxr: the page is interactive — the interface's emphasis vocabulary
		// is what the drawn elements switch between, so the stylesheet that
		// presents the page styles every class of it.
		for (const name of Object.values(EmphasisClasses)) {
			expect(interact, name).toContain(`.${name}`);
		}
	});
});

describe("the interface carries the problems of the documents it presents (krvyoumy)", () => {
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
		// presentation's warnings; an implementer of it carries what the read
		// reported (krvyoumy).
		const presentation: Readonly<Presentation> = states.state();
		expect(presentation.warnings).toEqual(problems);
		// ... and they are shown while the remaining nodes render, not in place
		// of them (krvyoumy).
		expect(view.banner.textContent).toContain("nodes/aaaaaaaa.json");
		expect(view.canvas.contains(drawn)).toBe(true);
	});
});
