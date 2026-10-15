// @vitest-environment jsdom
/**
 * Contract check: what running the pointer and keyboard behaviour (noplrntp)
 * must show against the page interface and the graph model it drives
 * (ympqvvwr, qmsmvrnr).
 *
 * The behaviour is attached to the page's own elements here, so the identity
 * it addresses and the model it moves are the artifacts' own.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { InteractionDelegate } from "../../src/webview/contract";
import { EDGE_KEY_ATTR, EmphasisClasses, NODE_ID_ATTR, edgeKey } from "../../src/webview/contract";
import { renderGraph } from "../../src/webview/render";
import { attachInteractions } from "../../src/webview/interact";

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

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
			kind: "evaluation",
			dependsOn: ["aaaaaaaa"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "b" },
		},
	];
	const model = buildGraph(records);
	const order = graphOrder(model);
	const moved: Map<string, unknown>[] = [];
	const delegate: InteractionDelegate = {
		relayout(dragged) {
			moved.push(new Map(dragged));
			const layout = layoutGraph(model, order, { dragged });
			renderGraph({ edges, nodes }, { model, order, layout, labels: new Map() });
			return layout;
		},
		onSelectionChanged() {},
		openNodeDocument() {},
	};
	const controller = attachInteractions({ canvas, surface }, delegate, { model, order });

	return { canvas, nodes, edges, model, order, controller, moved };
}

describe("the behaviour addresses the elements the interface names", () => {
	test("every box the behaviour finds carries the interface's node id attribute", () => {
		const page = setup();

		const drawn = [...page.nodes.querySelectorAll(`[${NODE_ID_ATTR}]`)];

		expect(drawn.map((box) => box.getAttribute(NODE_ID_ATTR))).toEqual([...page.order.ids]);
		expect(drawn.every((box) => box instanceof HTMLElement)).toBe(true);
	});

	test("selecting a node of the model takes; an id the model does not have is refused", () => {
		const page = setup();

		page.controller.select("bbbbbbbb");
		expect(page.controller.selected()).toBe("bbbbbbbb");
		expect(
			page.nodes.querySelector('[data-node-id="bbbbbbbb"]')?.classList.contains(EmphasisClasses.selected),
		).toBe(true);

		page.controller.select("zzzzzzzz");
		expect(page.controller.selected()).toBeNull();
	});

	test("the edge context the behaviour resolves is keyed the way the model keys its edges", () => {
		const page = setup();
		const keys = [...page.edges.querySelectorAll(`[${EDGE_KEY_ATTR}]`)].map((element) =>
			element.getAttribute(EDGE_KEY_ATTR),
		);

		for (const edge of page.model.edges) {
			expect(keys).toContain(edgeKey(edge));
		}
	});
});

describe("the behaviour moves the model through the interface's delegate", () => {
	test("moving a node asks the delegate to lay the graph out with the moved position", () => {
		const page = setup();
		const before = page.moved.length;

		page.controller.moveNodeBy("aaaaaaaa", 24, 12);

		expect(page.moved.length).toBeGreaterThan(before);
		expect(page.moved.at(-1)?.get("aaaaaaaa")).toEqual({ x: 24, y: 12 });
	});

	test("the focus walks the model's own graph order", () => {
		const page = setup();

		page.controller.focusStep(false);
		expect(page.controller.focused()).toBe(page.order.ids[0]);
		page.controller.focusStep(false);
		expect(page.controller.focused()).toBe(page.order.ids[1]);
		page.controller.focusStep(false);
		expect(page.controller.focused()).toBe(page.order.ids[0]);
	});

	test("panning and zooming change the viewport the interface reports", () => {
		const page = setup();

		page.controller.zoomAt(2, { x: 0, y: 0 });
		page.controller.panBy(10, 20);

		expect(page.controller.viewport().scale).toBe(2);
	});
});
