// @vitest-environment jsdom
/**
 * Conformance check: what drawing the graph (rtlotqvy) must show for the
 * renderer requirement sentences (vylxkuxr, tqxvykwn, vznnxtor) to hold.
 *
 * The canvas is a fixture built from the page interface's own selectors
 * (src/webview/contract.ts) and a graph is drawn into it with the renderer, so
 * the check observes the renderer's markup. The page shell, the detail region
 * and the composition are not read: the renderer does not own them.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { EDGE_KEY_ATTR, NODE_ID_ATTR, SELECTORS, edgeKey } from "../../src/webview/contract";

const SVG_NS = "http://www.w3.org/2000/svg";

/** The two canvas layers the renderer draws into. */
interface Fixture {
	edges: SVGSVGElement;
	nodes: HTMLElement;
}

/**
 * A canvas with the regions the page interface names (ympqvvwr): the SVG edge
 * layer and the node box layer inside the surface of the canvas.
 */
function canvas(): Fixture {
	const root = document.createElement("main");
	root.className = "canvas";

	const surface = document.createElement("div");
	surface.className = "canvas__surface";

	const edges = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
	edges.setAttribute("class", "canvas__edges");

	const nodes = document.createElement("div");
	nodes.className = "canvas__nodes";

	surface.append(edges, nodes);
	root.append(surface);
	document.body.replaceChildren(root);

	const edgeLayer = document.querySelector(SELECTORS.edges) as unknown as SVGSVGElement | null;
	const nodeLayer = document.querySelector(SELECTORS.nodes) as HTMLElement | null;
	if (edgeLayer === null || nodeLayer === null) {
		throw new Error("the fixture canvas is missing a region the contract names");
	}
	return { edges: edgeLayer, nodes: nodeLayer };
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
			dependsOn: ["aaaaaaaa", "dddddddd"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "b" },
		},
	];
}

function draw(): { page: Document; model: ReturnType<typeof buildGraph> } {
	const target = canvas();
	const model = buildGraph(records());
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);
	renderGraph(target, {
		model,
		order,
		layout,
		labels: new Map([["aaaaaaaa", "the label of aaaaaaaa"]]),
	});
	return { page: document, model };
}

describe("the graph is drawn into the panel's canvas (vylxkuxr)", () => {
	test("the renderer draws the graph into the canvas regions the panel serves", () => {
		const drawn = draw();
		const edges = drawn.page.querySelector(SELECTORS.edges);
		const nodes = drawn.page.querySelector(SELECTORS.nodes);

		// vylxkuxr: the graph is presented as the page's canvas, so every node
		// box is drawn in the node layer and every edge route in the edge layer.
		expect(edges).not.toBeNull();
		expect(nodes).not.toBeNull();
		for (const node of drawn.model.nodes) {
			const box = drawn.page.querySelector(`[${NODE_ID_ATTR}="${node.id}"]`);
			expect(box).not.toBeNull();
			if (box !== null) {
				expect(nodes?.contains(box)).toBe(true);
			}
		}
		const routes = [...(edges?.querySelectorAll("path.edge") ?? [])];
		expect(routes).toHaveLength(drawn.model.edges.length);
	});
});

describe("the drawn elements carry the graph's identity (vznnxtor)", () => {
	test("every node box carries its node id and every edge part its edge key", () => {
		const drawn = draw();
		const edges = drawn.page.querySelector(SELECTORS.edges);
		const nodes = drawn.page.querySelector(SELECTORS.nodes);

		for (const node of drawn.model.nodes) {
			expect(nodes!.querySelector(`[${NODE_ID_ATTR}="${node.id}"]`)).not.toBeNull();
		}
		for (const edge of drawn.model.edges) {
			const key = edgeKey(edge);
			const parts = [...edges!.querySelectorAll(`[${EDGE_KEY_ATTR}="${key}"]`)];
			expect(parts.length).toBeGreaterThan(0);
			for (const part of parts) {
				expect(part.getAttribute(EDGE_KEY_ATTR)).toBe(key);
			}
		}
	});
});

describe("the two kinds read apart (vznnxtor)", () => {
	test("decisions and evaluations are drawn with distinct shapes", () => {
		const drawn = draw();

		// vznnxtor: decisions are distinguished from evaluations by shape — the
		// renderer marks every box with its kind, which the grammar then shapes.
		const decision = drawn.page.querySelector(`[${NODE_ID_ATTR}="aaaaaaaa"]`)?.getAttribute("class") ?? "";
		const evaluation = drawn.page.querySelector(`[${NODE_ID_ATTR}="bbbbbbbb"]`)?.getAttribute("class") ?? "";
		expect(decision).toContain("node--decision");
		expect(evaluation).toContain("node--evaluation");
		expect(decision).not.toBe(evaluation);
	});

	test("depends_on and evaluates edges are drawn with distinct line styles", () => {
		const drawn = draw();

		// vznnxtor: depends_on is distinguished from evaluates by line style.
		const dependsOn = drawn.page.querySelector("path.edge.edge--depends_on");
		const evaluates = drawn.page.querySelector("path.edge.edge--evaluates");
		expect(dependsOn).not.toBeNull();
		expect(evaluates).not.toBeNull();
		expect(dependsOn?.getAttribute("class")).not.toBe(evaluates?.getAttribute("class"));
	});
});

describe("a missing node id is visible (tqxvykwn)", () => {
	test("an edge naming a missing node id is drawn and marked as unresolved", () => {
		const drawn = draw();

		// tqxvykwn: an edge that references a missing node id is rendered as
		// unresolved and marked visibly.
		const unresolved = drawn.model.edges.find((edge) => edge.danglingEnd !== undefined);
		expect(unresolved).toBeDefined();
		const path = drawn.page.querySelector(
			`path.edge[${EDGE_KEY_ATTR}="${edgeKey(unresolved!)}"]`,
		);
		expect(path).not.toBeNull();
		expect(path?.getAttribute("class")).toContain("edge--unresolved");
		expect(path?.getAttribute("marker-end")).toBe("url(#arrowhead-unresolved)");
	});
});
