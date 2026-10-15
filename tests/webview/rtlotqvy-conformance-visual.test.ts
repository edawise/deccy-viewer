// @vitest-environment jsdom
/**
 * Conformance check: what the viewer's static visual grammar and its drawing
 * (rtlotqvy) must show for its visual-spec prerequisites (mstmuwtk, mnovnnot,
 * vlvmrkzr, sullyqzs, twotxvqp, rwxywllw, otyqzpxn, ymnkpuvl, znzkwlnz,
 * npytqytq, mnwxnyks, oqotyplt, qpmyylwo, tyvynnqo, owtptzpl, ptvkwmym,
 * utzrtvwy, sszrrpwn, wtywxppt) to hold.
 *
 * The grammar is the stylesheet and the drawing is the renderer's own markup,
 * drawn here on a fixture canvas so both halves of the promise are observed
 * together. Every fixed value is a literal of its record — no constant of the
 * grammar or the renderer is imported as an expected value. The page shell and
 * the toolbar are not read: they are not the renderer's subject.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";

const CSS = readFileSync("src/styles/grammar.css", "utf8");
const SVG_NS = "http://www.w3.org/2000/svg";

/** The declarations of the rule whose selector is exactly `selector`. */
function declarations(selector: string): string {
	const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g);
	for (const rule of rules) {
		const selectors = rule[1]!.split(",").map((part) => part.trim());
		if (selectors.includes(selector)) {
			return rule[2]!;
		}
	}
	throw new Error(`no rule for ${selector}`);
}

/** The two canvas layers the renderer draws into. */
interface Fixture {
	edges: SVGSVGElement;
	nodes: HTMLElement;
}

/** A canvas the renderer can draw into, without the page shell around it. */
function canvas(): Fixture {
	const edges = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
	const nodes = document.createElement("div");
	document.body.replaceChildren(edges, nodes);
	return { edges, nodes };
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

/** Draw the graph into a fresh canvas and return where it was drawn. */
function draw(): Fixture {
	const target = canvas();
	const model = buildGraph(records());
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);
	renderGraph(target, { model, order, layout, labels: new Map() });
	return target;
}

describe("the panel chrome the grammar fixes (mstmuwtk)", () => {
	test("the detail region sits beside the canvas and stacks below it under 600px", () => {
		// mstmuwtk: the panel stays usable at small sizes — the detail is a
		// column beside the canvas and stacks below it under 600px width.
		expect(declarations(".panel__body")).toContain("grid-template-columns");
		expect(CSS).toMatch(/@media \(max-width: 599\.98px\)/);
	});
});

describe("the colour roles the records name (znzkwlnz, npytqytq, mnwxnyks, oqotyplt, qpmyylwo, tyvynnqo)", () => {
	test("the canvas takes the surface role", () => {
		// znzkwlnz: the canvas blends with the editor surface.
		expect(CSS).toContain("--surface: var(--vscode-editor-background)");
		expect(declarations(".canvas")).toContain("var(--surface)");
	});

	test("the label and the detail take the text role and the secondary label the muted one", () => {
		// npytqytq: node/label and panel/detail take the editor foreground.
		expect(CSS).toContain("--text: var(--vscode-editor-foreground)");
		expect(declarations(".node")).toContain("var(--text)");
		expect(declarations(".panel__detail")).toContain("var(--text)");
		// mnwxnyks: node/label-secondary takes the description foreground.
		expect(CSS).toContain("--muted: var(--vscode-descriptionForeground)");
		expect(declarations(".node__label-secondary")).toContain("var(--muted)");
	});

	test("the two edge kinds take their own colour roles", () => {
		// oqotyplt: edge/depends_on takes the textLink role.
		expect(CSS).toContain("--edge: var(--vscode-textLink-foreground)");
		expect(declarations(".edge--depends_on")).toContain("var(--edge)");
		// qpmyylwo: edge/evaluates takes the charts-purple role.
		expect(CSS).toContain("--edge-alt: var(--vscode-charts-purple)");
		expect(declarations(".edge--evaluates")).toContain("var(--edge-alt)");
		// tyvynnqo: edge/unresolved takes the warning role.
		expect(CSS).toContain("--warning: var(--vscode-charts-red)");
		expect(declarations(".edge--unresolved")).toContain("var(--warning)");
	});
});

describe("the node boxes the grammar fixes (owtptzpl, ptvkwmym, sullyqzs, twotxvqp, utzrtvwy)", () => {
	test("a box is 240px wide and at least 72px tall, and its label wraps inside", () => {
		// owtptzpl: every node box is 240px wide and min 72px tall, with the
		// label wrapping inside the box.
		expect(declarations(".node")).toContain("240px");
		expect(declarations(".node")).toContain("72px");
		expect(declarations(".node__label")).toContain("overflow-wrap");
	});

	test("a decision is a rectangle and an evaluation a rounded one, with the fixed radii", () => {
		// sullyqzs: a decision is a rectangle; twotxvqp: an evaluation is a
		// rounded rectangle; ptvkwmym: the radii are 2px and 8px.
		expect(declarations(".node--decision")).toContain("border-radius: 2px");
		expect(declarations(".node--evaluation")).toContain("border-radius: 8px");
		expect(declarations(".node--evaluation")).not.toBe(declarations(".node--decision"));
	});

	test("the label is 13px", () => {
		// utzrtvwy: the node label is 13px, inheriting the workbench family.
		expect(declarations(".node__label")).toContain("13px");
	});

	test("every drawn box is measured, so a wrapped label can grow it past the minimum", () => {
		const target = canvas();
		const model = buildGraph(records());
		const order = graphOrder(model);
		const layout = layoutGraph(model, order);
		const heights = renderGraph(target, { model, order, layout, labels: new Map() });

		// owtptzpl: the label wraps inside the box and may grow it past the
		// minimum, so the renderer measures every box it drew.
		expect([...heights.keys()].sort()).toEqual([...order.ids].sort());
	});
});

describe("the edges the grammar fixes (rwxywllw, otyqzpxn, ymnkpuvl, mnovnnot, vlvmrkzr, sszrrpwn, wtywxppt)", () => {
	test("the edge kinds are distinct strokes and the unresolved one is marked", () => {
		const dependsOn = declarations(".edge--depends_on");
		const evaluates = declarations(".edge--evaluates");
		const unresolved = declarations(".edge--unresolved");

		// rwxywllw: a depends_on edge is solid ...
		expect(dependsOn).toContain("stroke-dasharray: none");
		// otyqzpxn: ... an evaluates edge is dashed ...
		expect(evaluates).toContain("stroke-dasharray");
		expect(evaluates).not.toContain("stroke-dasharray: none");
		// ymnkpuvl: ... and an unresolved edge is dotted, visibly apart.
		expect(unresolved).toContain("stroke-dasharray");
		expect(unresolved).not.toContain("stroke-dasharray: none");
		expect(unresolved).not.toBe(dependsOn);
	});

	test("every edge carries one 8px arrowhead at its child end", () => {
		const target = draw();
		const model = buildGraph(records());

		// mnovnnot: every edge runs from the parent end to the child end;
		// vlvmrkzr: the single arrowhead sits at the child end — the route's end
		// carries the marker.
		const drawn = [...target.edges.querySelectorAll("path.edge")];
		expect(drawn).toHaveLength(model.edges.length);
		for (const edge of drawn) {
			expect(edge.getAttribute("marker-end")).toMatch(/^url\(#arrowhead-/);
		}
		// sszrrpwn: the arrowhead is 8px.
		const markers = [...target.edges.querySelectorAll("marker")];
		expect(markers).toHaveLength(3);
		for (const marker of markers) {
			expect(marker.getAttribute("markerWidth")).toBe("8");
			expect(marker.getAttribute("markerHeight")).toBe("8");
		}
	});

	test("every interactive element keeps a hit target of the fixed size", () => {
		// wtywxppt: every interactive element is at least 24px, so precision
		// never decides whether an edge can be reached.
		expect(declarations(".edge__hit")).toContain("24px");
		expect(declarations(".edge__hit")).toContain("pointer-events: stroke");
		expect(declarations(".node")).toContain("min-width: 24px");
	});
});
