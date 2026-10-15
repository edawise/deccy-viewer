// @vitest-environment jsdom
/**
 * Conformance check: what running the page interface (ympqvvwr) must show for
 * the webview-panel requirement (vylxkuxr) to hold.
 *
 * The page is parsed here and drawn into, so the check observes the page the
 * contract names regions of, never a particular webview session.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { NodeRecord } from "../../src/data/nodes";
import { EDGE_KEY_ATTR, EmphasisClasses, NODE_ID_ATTR, SELECTORS, edgeKey } from "../../src/webview/contract";
import { renderGraph } from "../../src/webview/render";

const PAGE = readFileSync("media/webview.html", "utf8");
const INTERACT_CSS = readFileSync("src/styles/interact.css", "utf8");

function pageDocument(): Document {
	return new DOMParser().parseFromString(PAGE, "text/html");
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

describe("the page the contract names its regions of", () => {
	test("every selector of the contract reaches a region of the page", () => {
		const document = pageDocument();

		for (const [region, selector] of Object.entries(SELECTORS)) {
			expect(document.querySelector(selector), `${region} (${selector})`).not.toBeNull();
		}
	});

	test("the page loads the compiled entry of the page module and the stylesheets as they stand", () => {
		const document = pageDocument();
		const references = [...document.querySelectorAll("link[href], script[src]")].map(
			(element) => element.getAttribute("href") ?? element.getAttribute("src") ?? "",
		);

		expect(references).toContain("../src/webview/main.js");
		expect(references).toContain("../src/styles/grammar.css");
	});
});

describe("the identity the contract fixes for the drawn elements", () => {
	test("every drawn box carries the node id attribute of the contract", () => {
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

		const drawn = [...document.querySelectorAll(`[${NODE_ID_ATTR}]`)].map((element) =>
			element.getAttribute(NODE_ID_ATTR),
		);
		expect(drawn.sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("every drawn part of an edge carries the edge key of the contract", () => {
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

		const keys = new Set(
			[...document.querySelectorAll(`[${EDGE_KEY_ATTR}]`)].map((element) =>
				element.getAttribute(EDGE_KEY_ATTR),
			),
		);
		expect([...keys]).toEqual(model.edges.map((edge) => edgeKey(edge)));
		expect(edgeKey(model.edges[0]!)).toBe("evaluates:bbbbbbbb->aaaaaaaa");
	});
});

describe("the emphasis vocabulary the contract names", () => {
	test("every class of the vocabulary is the one the stylesheet styles", () => {
		for (const name of Object.values(EmphasisClasses)) {
			expect(INTERACT_CSS, name).toContain(`.${name}`);
		}
	});
});
