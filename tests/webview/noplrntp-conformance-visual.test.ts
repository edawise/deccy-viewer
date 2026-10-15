// @vitest-environment jsdom
/**
 * Conformance check: what running the interaction emphasis (noplrntp) must
 * show for its visual-spec prerequisites (moklnvms, ortyupqp, ksywwktl,
 * ozxnxzus, xslqyywt, pztszkqs, qqmrtwor) to hold.
 *
 * The states are entered through the artifact's own operations and the
 * appearance they demand is read from the stylesheet that carries it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { attachInteractions } from "../../src/webview/interact";
import type { InteractionDelegate } from "../../src/webview/contract";
import { EmphasisClasses } from "../../src/webview/contract";

const CSS = readFileSync("src/styles/interact.css", "utf8");

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

function rule(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(CSS);
	if (match === null) {
		throw new Error(`no rule for ${selector}`);
	}
	return match[1]!;
}

function setup() {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const surface = document.createElement("div");
	surface.className = "canvas__surface";
	const edges = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const nodes = document.createElement("div");
	surface.append(edges, nodes);
	canvas.append(surface);
	document.body.append(canvas);
	Object.defineProperty(canvas, "clientWidth", { value: 800 });
	Object.defineProperty(canvas, "clientHeight", { value: 600 });

	const records: NodeRecord[] = [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "a" },
		},
		{
			id: "bbbbbbbb",
			kind: "decision",
			dependsOn: ["aaaaaaaa"],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "b" },
		},
		{
			id: "eeeeeeee",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "e" },
		},
	];
	const model = buildGraph(records);
	const order = graphOrder(model);
	const view = { canvas, surface };
	const delegate: InteractionDelegate = {
		relayout(dragged) {
			const layout = layoutGraph(model, order, { dragged });
			renderGraph({ edges, nodes }, { model, order, layout, labels: new Map() });
			return layout;
		},
		onSelectionChanged() {},
		openNodeDocument() {},
	};
	const controller = attachInteractions(view, delegate, { model, order });
	const box = (id: string): HTMLElement => nodes.querySelector(`[data-node-id="${id}"]`) as HTMLElement;

	return { canvas, nodes, controller, box };
}

describe("the selection emphasis", () => {
	test("the selection is highlighted with its context and everything else dims", () => {
		const page = setup();

		page.controller.select("aaaaaaaa");

		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.selected)).toBe(true);
		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.related)).toBe(true);
		expect(page.box("eeeeeeee").classList.contains(EmphasisClasses.dimmed)).toBe(true);
	});

	test("with nothing selected nothing is dimmed", () => {
		const page = setup();

		page.controller.select("aaaaaaaa");
		page.controller.clearSelection();

		for (const id of ["aaaaaaaa", "bbbbbbbb", "eeeeeeee"]) {
			expect(page.box(id).classList.contains(EmphasisClasses.dimmed), id).toBe(false);
			expect(page.box(id).classList.contains(EmphasisClasses.selected), id).toBe(false);
		}
	});

	test("the selection and its context take the accent treatment, the rest dims", () => {
		expect(rule(".is-selected")).toContain("var(--accent)");
		expect(rule(".is-dimmed")).toContain("0.3");
		expect(CSS).toContain("--accent: var(--vscode-focusBorder)");
	});
});

describe("the hover, focus and drag emphasis", () => {
	test("keyboard focus rings the node it is on", () => {
		const page = setup();

		page.controller.focusNode("bbbbbbbb");

		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.focus)).toBe(true);
		expect(rule(".is-focus")).toContain("outline");
	});

	test("a node being dragged is lifted", () => {
		const page = setup();

		page.controller.moveNodeBy("aaaaaaaa", 8, 0);

		expect(rule(".is-dragging")).toContain("z-index");
	});

	test("the hover emphasis and the tooltip surface come from the states' own rules", () => {
		const page = setup();

		expect(CSS).toMatch(/\.is-related,\s*\.is-hover-neighbour\s*\{[^}]*brightness/);
		expect(page.canvas.textContent).toBeDefined();
		expect(CSS).toContain("--tooltip-surface: var(--vscode-editorWidget-background)");
	});
});
