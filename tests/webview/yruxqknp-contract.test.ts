// @vitest-environment jsdom
/**
 * Contract check: what running the panel state and its presentation
 * (yruxqknp) must show against the page interface, the graph model and the
 * interaction state it is wired to (ympqvvwr, qmsmvrnr, noplrntp).
 *
 * A real interaction controller is attached here and driven through the
 * state's own entry points, so the check runs the two artifacts together.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { attachInteractions } from "../../src/webview/interact";
import type { InteractionDelegate } from "../../src/webview/contract";
import { attachStates, queueInput } from "../../src/webview/states";
import { applyPanelState } from "../../src/webview/state";

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
	const banner = document.createElement("div");
	banner.className = "panel__banner";
	banner.hidden = true;
	canvas.append(surface);
	document.body.append(canvas, banner);
	Object.defineProperty(canvas, "clientWidth", { value: 800 });
	Object.defineProperty(canvas, "clientHeight", { value: 600 });

	const records: NodeRecord[] = ["aaaaaaaa", "bbbbbbbb"].map((id, index) => ({
		id,
		kind: "decision",
		dependsOn: index === 0 ? [] : ["aaaaaaaa"],
		evaluates: [],
		content: { type: "text", ref: "inline", rationale: `r ${id}` },
	}));
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
	const attached = attachInteractions(view, delegate, { model, order });
	const states = attachStates({ canvas, banner });

	return { canvas, banner, order, attached, states, view };
}

describe("the input queue the interaction state runs through", () => {
	test("user input arriving during a load is queued, in order, and applied when it ends", () => {
		const page = setup();
		const controller = queueInput(page.attached, page.states.input);

		page.states.beginLoading();
		controller.panBy(100, 50);
		controller.select("bbbbbbbb");

		expect(page.attached.viewport().x).toBe(0);
		expect(page.attached.selected()).toBeNull();
		expect(page.states.input.pending()).toBe(2);

		page.states.loaded(2);

		expect(page.attached.viewport().x).toBe(100);
		expect(page.attached.selected()).toBe("bbbbbbbb");
	});

	test("the reads of the controller pass straight through while it loads", () => {
		const page = setup();
		const controller = queueInput(page.attached, page.states.input);

		page.states.beginLoading();

		expect(controller.viewport()).toEqual(page.attached.viewport());
		expect(controller.selected()).toBe(page.attached.selected());
		expect(page.states.input.pending()).toBe(0);
	});

	test("swapping the graph in and tearing down are not user input and run at once", () => {
		const page = setup();
		const controller = queueInput(page.attached, page.states.input);

		page.states.beginLoading();
		controller.setGraph({ model: buildGraph([]), order: graphOrder(buildGraph([])) });
		controller.dispose();

		expect(page.states.input.pending()).toBe(0);
		page.canvas.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
		page.canvas.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
		expect(page.attached.selected()).toBeNull();
	});
});

describe("the recorded panel state is restored through the interaction state", () => {
	test("the zoom, the pan and the selection of the recorded state reach the live controller", () => {
		const page = setup();

		applyPanelState(page.attached, {
			open: true,
			selection: "bbbbbbbb",
			pan: { x: 60, y: 30 },
			zoom: 2,
			positions: {},
		});

		expect(page.attached.viewport().scale).toBe(2);
		expect(page.attached.viewport().x).toBeCloseTo(60);
		expect(page.attached.viewport().y).toBeCloseTo(30);
		expect(page.attached.selected()).toBe("bbbbbbbb");
	});

	test("a recorded selection whose node is not in the graph is refused by the controller", () => {
		const page = setup();

		applyPanelState(page.attached, {
			open: true,
			selection: "zzzzzzzz",
			pan: { x: 0, y: 0 },
			zoom: 1,
			positions: {},
		});

		expect(page.attached.selected()).toBeNull();
	});

	test("the state's presentation follows the count of nodes the graph produced", () => {
		const page = setup();

		page.states.loaded(page.order.ids.length);

		expect(page.states.state().empty).toBe(false);
		expect(page.states.state().error).toBeNull();
	});
});
