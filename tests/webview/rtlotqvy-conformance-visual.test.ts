// @vitest-environment jsdom
/**
 * Conformance check: what running the viewer's static visual grammar
 * (rtlotqvy) must show for its visual-spec prerequisites (the node box,
 * edge kind, colour role, arrowhead, hit-target, label and panel rules) to
 * hold.
 *
 * The grammar is the stylesheet the page loads; the drawing is the renderer's
 * own markup, drawn here so both halves of the promise are observed together.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph, NODE_MIN_HEIGHT, NODE_WIDTH } from "../../src/graph/layout";
import { ARROWHEAD_SIZE, renderGraph } from "../../src/webview/render";

const CSS = readFileSync("src/styles/grammar.css", "utf8");

function declarations(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escaped}[^,{]*\\{([^}]*)\\}`).exec(CSS);
	if (match === null) {
		throw new Error(`no rule for ${selector}`);
	}
	return match[1]!;
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

describe("the panel chrome the grammar fixes", () => {
	test("the canvas blends with the editor surface and clips the graph", () => {
		const canvas = declarations(".canvas");

		expect(canvas).toContain("overflow: hidden");
		expect(canvas).toContain("var(--surface)");
		expect(CSS).toContain("--surface: var(--vscode-editor-background)");
	});

	test("the toolbar is a row at the top and the detail region sits beside the canvas", () => {
		expect(declarations(".panel")).toContain("grid-template-rows");
		expect(declarations(".panel__body")).toContain("grid-template-columns");
		expect(CSS).toMatch(/@media \(max-width: 599\.98px\)/);
	});

	test("the text and muted roles are the workbench roles the records name", () => {
		expect(CSS).toContain("--text: var(--vscode-editor-foreground)");
		expect(CSS).toContain("--muted: var(--vscode-descriptionForeground)");
	});
});

describe("the node boxes the grammar fixes", () => {
	test("a box is the fixed size the layout also fixes, and its label wraps inside", () => {
		expect(declarations(".node")).toContain("240px");
		expect(declarations(".node")).toContain("72px");
		expect(declarations(".node")).toContain("position: absolute");
		expect(declarations(".node__label")).toContain("overflow-wrap");
		expect(NODE_WIDTH).toBe(240);
		expect(NODE_MIN_HEIGHT).toBe(72);
	});

	test("a decision is a rectangle and an evaluation a rounded one", () => {
		expect(declarations(".node--decision")).toContain("border-radius");
		expect(declarations(".node--evaluation")).toContain("border-radius");
		expect(declarations(".node--evaluation")).not.toBe(declarations(".node--decision"));
	});

	test("the label takes the text role and the secondary label the muted one", () => {
		expect(declarations(".node__label")).toContain("13px");
		expect(declarations(".node__label-secondary")).toContain("var(--muted)");
	});
});

describe("the edges the grammar fixes", () => {
	test("the edge kinds are distinct strokes and the unresolved one is marked", () => {
		const dependsOn = declarations(".edge--depends_on");
		const evaluates = declarations(".edge--evaluates");
		const unresolved = declarations(".edge--unresolved");

		expect(dependsOn).toContain("stroke-dasharray: none");
		expect(evaluates).toContain("stroke-dasharray");
		expect(evaluates).not.toContain("stroke-dasharray: none");
		expect(unresolved).toContain("var(--warning)");
		expect(unresolved).not.toBe(dependsOn);
		expect(CSS).toContain("--edge: var(--vscode-textLink-foreground)");
		expect(CSS).toContain("--warning: var(--vscode-charts-red)");
	});

	test("the arrowhead is one fixed size at the child end, filled by its edge role", () => {
		expect(ARROWHEAD_SIZE).toBe(8);
		expect(declarations(".arrowhead--depends_on")).toContain("var(--edge)");
		expect(declarations(".arrowhead--unresolved")).toContain("var(--warning)");

		const document = new DOMParser().parseFromString("<svg></svg>", "text/html");
		const model = buildGraph(records());
		const order = graphOrder(model);
		const layout = layoutGraph(model, order);
		renderGraph(
			{
				edges: document.querySelector("svg") as unknown as SVGSVGElement,
				nodes: document.createElement("div"),
			},
			{ model, order, layout, labels: new Map() },
		);

		const markers = [...document.querySelectorAll("marker")];
		expect(markers).toHaveLength(3);
		for (const marker of markers) {
			expect(marker.getAttribute("markerWidth")).toBe("8");
			expect(marker.getAttribute("markerUnits")).toBe("userSpaceOnUse");
			expect(marker.getAttribute("orient")).toBe("auto");
		}
	});

	test("every edge keeps a hit target of the fixed size, so precision decides nothing", () => {
		expect(declarations(".edge__hit")).toContain("24px");
		expect(declarations(".edge__hit")).toContain("pointer-events: stroke");
	});
});
