// @vitest-environment jsdom
/**
 * Conformance check: what running the viewer page and its drawing (rtlotqvy)
 * must show for its requirement sentences (vylxkuxr, tqxvykwn, vznnxtor) to
 * hold.
 *
 * The page is parsed here and a graph is drawn into it, so the check observes
 * the page the panel serves and the markup the renderer produces.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { SELECTORS, edgeKey } from "../../src/webview/contract";

const PAGE = readFileSync("media/webview.html", "utf8");
const SVG_NS = "http://www.w3.org/2000/svg";

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
			dependsOn: ["aaaaaaaa", "dddddddd"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "b" },
		},
	];
}

function drawIntoPage() {
	const document = new DOMParser().parseFromString(PAGE, "text/html");
	const model = buildGraph(records());
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);
	const heights = renderGraph(
		{
			edges: document.querySelector(SELECTORS.edges) as unknown as SVGSVGElement,
			nodes: document.querySelector(SELECTORS.nodes) as HTMLElement,
		},
		{ model, order, layout, labels: new Map([["aaaaaaaa", "the label of aaaaaaaa"]]) },
	);
	return { document, model, order, layout, heights };
}

describe("the page is the panel's page", () => {
	test("the regions the panel serves appear in the page in their documented order", () => {
		const document = new DOMParser().parseFromString(PAGE, "text/html");
		const order = [...document.querySelectorAll("[class]")].map(
			(element) => element.getAttribute("class"),
		);

		expect(order.indexOf("panel__toolbar")).toBeLessThan(order.indexOf("panel__banner"));
		expect(order.indexOf("panel__banner")).toBeLessThan(order.indexOf("panel__body"));
		expect(order.indexOf("canvas__edges")).toBeLessThan(order.indexOf("canvas__nodes"));
	});

	test("the canvas clips the graph and the detail region sits beside it", () => {
		const document = new DOMParser().parseFromString(PAGE, "text/html");

		expect(document.querySelector(SELECTORS.canvas)).not.toBeNull();
		expect(document.querySelector(SELECTORS.surface)).not.toBeNull();
		expect(document.querySelector(SELECTORS.detailBody)).not.toBeNull();
	});
});

describe("the graph is drawn into the page", () => {
	test("every node of the graph order gets its box, with its kind and its label", () => {
		const page = drawIntoPage();
		const boxes = [...page.document.querySelectorAll("[data-node-id]")];

		expect(boxes.map((box) => box.getAttribute("data-node-id"))).toEqual([...page.order.ids]);
		expect(
			page.document.querySelector('[data-node-id="aaaaaaaa"]')?.className,
		).toContain("node--decision");
		expect(
			page.document.querySelector('[data-node-id="bbbbbbbb"]')?.className,
		).toContain("node--evaluation");
		expect(
			page.document.querySelector('[data-node-id="aaaaaaaa"] .node__label')?.textContent,
		).toBe("the label of aaaaaaaa");
		expect(
			page.document.querySelector('[data-node-id="bbbbbbbb"] .node__label')?.textContent,
		).toBe("bbbbbbbb");
	});

	test("the drawn height of every box is measured from what was drawn", () => {
		const page = drawIntoPage();

		expect([...page.heights.keys()].sort()).toEqual(["aaaaaaaa", "bbbbbbbb"]);
	});

	test("every edge is drawn with an arrowhead at its child end", () => {
		const page = drawIntoPage();

		for (const edge of page.model.edges) {
			const drawn = page.document.querySelector(
				`path.edge[data-edge-key="${edgeKey(edge)}"]`,
			);
			expect(drawn, edgeKey(edge)).not.toBeNull();
			const marker = drawn?.getAttribute("marker-end") ?? "";
			expect(marker).toMatch(/^url\(#arrowhead-/);
			const markerIds = [...page.document.querySelectorAll("marker")].map((element) =>
				element.getAttribute("id"),
			);
			expect(markerIds).toContain(marker.slice(5, -1));
		}
	});

	test("an edge naming a missing node id is drawn as a stub and marked unresolved", () => {
		const page = drawIntoPage();
		const unresolved = page.model.edges.find((edge) => edge.danglingEnd !== undefined);
		const drawn = page.document.querySelector(
			`path.edge[data-edge-key="${edgeKey(unresolved!)}"]`,
		);
		const box = page.layout.nodes.get("bbbbbbbb");

		expect(drawn?.getAttribute("class")).toContain("edge--unresolved");
		expect(drawn?.getAttribute("marker-end")).toBe("url(#arrowhead-unresolved)");
		expect(drawn?.getAttribute("d")).toContain(String((box?.y ?? 0) - 96));
	});

	test("the two edge kinds read apart", () => {
		const page = drawIntoPage();

		expect(page.document.querySelector("path.edge--depends_on")).not.toBeNull();
		expect(page.document.querySelector("path.edge--evaluates")).not.toBeNull();
	});
});

describe("the drawing is targetable and repeatable", () => {
	beforeEach(() => {
		document.body.replaceChildren();
	});

	test("every route carries a hit stroke over it, so it can be reached", () => {
		const page = drawIntoPage();

		expect(page.document.querySelectorAll("path.edge__hit")).toHaveLength(page.model.edges.length);
	});

	test("drawing again replaces the previous drawing instead of adding to it", () => {
		const page = drawIntoPage();
		const first = page.document.querySelectorAll("path.edge").length;

		renderGraph(
			{
				edges: page.document.querySelector(SELECTORS.edges) as unknown as SVGSVGElement,
				nodes: page.document.querySelector(SELECTORS.nodes) as HTMLElement,
			},
			{ model: page.model, order: page.order, layout: page.layout, labels: new Map() },
		);

		expect(page.document.querySelectorAll("path.edge")).toHaveLength(first);
	});
});
