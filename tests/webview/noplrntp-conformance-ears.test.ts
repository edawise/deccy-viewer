// @vitest-environment jsdom
/**
 * Conformance check: what running the pointer and keyboard behaviour
 * (noplrntp) must show for its requirement sentences to hold.
 *
 * The behaviours are attached to a canvas built here and driven through real
 * pointer and key events, so the check observes what the artifact does.
 */
import { describe, expect, test, beforeEach } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { Point } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { attachInteractions } from "../../src/webview/interact";
import { attachKeyboard } from "../../src/webview/keyboard";
import type { InteractionDelegate } from "../../src/webview/contract";
import { EmphasisClasses, SELECTORS } from "../../src/webview/contract";

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

beforeEach(() => {
	document.body.replaceChildren();
});

function records(): NodeRecord[] {
	return ["aaaaaaaa", "bbbbbbbb", "cccccccc"].map((id, index) => ({
		id,
		kind: index === 2 ? "evaluation" : "decision",
		dependsOn: index === 0 ? [] : ["aaaaaaaa"],
		evaluates: index === 2 ? ["bbbbbbbb"] : [],
		content: { type: "text", ref: "inline", rationale: `rationale of ${id}` },
	}));
}

function size(element: HTMLElement, width: number, height: number): void {
	Object.defineProperty(element, "clientWidth", { value: width });
	Object.defineProperty(element, "clientHeight", { value: height });
}

function pointer(type: string, init: { pointerId?: number; button?: number; clientX?: number; clientY?: number }): MouseEvent {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		button: init.button ?? 0,
		clientX: init.clientX ?? 0,
		clientY: init.clientY ?? 0,
	});
	Object.defineProperty(event, "pointerId", { value: init.pointerId ?? 1 });
	return event;
}

function setup() {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const surface = document.createElement("div");
	surface.className = "canvas__surface";
	const edges = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	edges.setAttribute("class", "canvas__edges");
	const nodes = document.createElement("div");
	nodes.className = "canvas__nodes";
	surface.append(edges, nodes);
	canvas.append(surface);
	document.body.append(canvas);
	size(canvas, 800, 600);
	(canvas as unknown as { setPointerCapture(id: number): void }).setPointerCapture = () => undefined;

	const model = buildGraph(records());
	const order = graphOrder(model);
	const calls = {
		selection: [] as (string | null)[],
		opened: [] as string[],
		dragged: [] as Map<string, Point>[],
	};
	const view = { canvas, surface };
	const delegate: InteractionDelegate = {
		relayout(dragged) {
			calls.dragged.push(new Map(dragged));
			const layout = layoutGraph(model, order, { dragged });
			renderGraph({ edges, nodes }, { model, order, layout, labels: new Map() });
			return layout;
		},
		onSelectionChanged(id) {
			calls.selection.push(id);
		},
		openNodeDocument(id) {
			calls.opened.push(id);
		},
	};
	const controller = attachInteractions(view, delegate, { model, order });
	const keyboard = attachKeyboard(controller, view);

	const box = (id: string): HTMLElement => {
		const element = nodes.querySelector(`[data-node-id="${id}"]`);
		if (!(element instanceof HTMLElement)) {
			throw new Error(`no box for ${id}`);
		}
		return element;
	};

	return { canvas, surface, edges, nodes, model, order, calls, controller, keyboard, box };
}

describe("the pointer selects, clears and opens", () => {
	test("clicking a node selects it and reports the selection", () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10 }));
		page.box("bbbbbbbb").dispatchEvent(pointer("pointerup", { clientX: 10, clientY: 10 }));

		expect(page.controller.selected()).toBe("bbbbbbbb");
		expect(page.calls.selection).toEqual(["bbbbbbbb"]);
		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.selected)).toBe(true);
	});

	test("clicking empty canvas clears the selection, clicking an edge leaves it", () => {
		const page = setup();
		page.controller.select("bbbbbbbb");

		page.canvas.dispatchEvent(pointer("pointerdown", { clientX: 700, clientY: 500 }));
		page.canvas.dispatchEvent(pointer("pointerup", { clientX: 700, clientY: 500 }));

		expect(page.controller.selected()).toBeNull();

		page.controller.select("bbbbbbbb");
		const edge = page.edges.querySelector("[data-edge-key]");
		expect(edge).not.toBeNull();
		edge?.dispatchEvent(pointer("pointerdown", { clientX: 1, clientY: 1 }));
		edge?.dispatchEvent(pointer("pointerup", { clientX: 1, clientY: 1 }));

		expect(page.controller.selected()).toBe("bbbbbbbb");
	});

	test("double-clicking a node asks for its document to be opened", () => {
		const page = setup();

		page.box("aaaaaaaa").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

		expect(page.calls.opened).toEqual(["aaaaaaaa"]);
	});
});

describe("the pointer hovers", () => {
	test("hovering a node marks its neighbourhood and shows its rationale", () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));

		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(true);
		const tooltip = document.querySelector(".tooltip");
		expect(tooltip?.textContent).toBe("rationale of bbbbbbbb");
		expect((tooltip as HTMLElement | null)?.hidden).toBe(false);
	});

	test("nothing is marked once the pointer leaves the canvas", () => {
		const page = setup();
		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));

		page.canvas.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));

		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(false);
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(true);
	});
});

describe("the canvas drags, pans and zooms", () => {
	test("a node pressed and moved past the threshold is dragged and re-routed", () => {
		const page = setup();
		const before = page.calls.dragged.length;

		page.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 140, clientY: 40 }));

		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.dragging)).toBe(true);

		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 160, clientY: 40 }));

		expect(page.calls.dragged.at(-1)?.has("aaaaaaaa")).toBe(true);

		page.box("aaaaaaaa").dispatchEvent(pointer("pointerup", { clientX: 160, clientY: 40 }));

		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.dragging)).toBe(false);
	});

	test("dragging the canvas pans the graph and marks the pan", () => {
		const page = setup();

		page.canvas.dispatchEvent(pointer("pointerdown", { clientX: 400, clientY: 400 }));
		page.canvas.dispatchEvent(pointer("pointermove", { clientX: 480, clientY: 430 }));

		expect(page.canvas.classList.contains(EmphasisClasses.panning)).toBe(true);

		page.canvas.dispatchEvent(pointer("pointermove", { clientX: 500, clientY: 450 }));
		page.canvas.dispatchEvent(pointer("pointerup", { clientX: 500, clientY: 450 }));

		expect(page.controller.viewport().x).toBe(100);
		expect(page.controller.viewport().y).toBe(50);
	});

	test("scrolling zooms about the pointer and stays inside the limits", () => {
		const page = setup();

		page.canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -200, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));

		expect(page.controller.viewport().scale).toBeGreaterThan(1);

		page.canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -100000, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));

		expect(page.controller.viewport().scale).toBeLessThanOrEqual(4);
	});

	test("the graph can be framed in the viewport", () => {
		const page = setup();
		page.controller.panBy(200, 200);
		page.controller.zoomAt(0.5, { x: 0, y: 0 });

		page.controller.fitGraph();

		expect(page.controller.viewport().scale).toBeGreaterThan(0);
		expect(page.controller.viewport().x).toBeGreaterThanOrEqual(0);
	});
});

describe("the keyboard does what the pointer does", () => {
	test("Tab walks the graph order and wraps; Enter selects the focused node; Esc clears", () => {
		const page = setup();

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

		expect(page.controller.focused()).toBe(page.order.ids[0]);
		expect(page.box(page.order.ids[0]!).classList.contains(EmphasisClasses.focus)).toBe(true);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(page.controller.selected()).toBe(page.order.ids[0]);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		expect(page.controller.selected()).toBeNull();

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
		expect(page.controller.focused()).toBe(page.order.ids.at(-1));
	});

	test("the arrow keys pan, Shift and an arrow move the selected node", () => {
		const page = setup();
		page.controller.panBy(100, 0);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
		expect(page.controller.viewport().x).toBe(148);

		page.controller.select("aaaaaaaa");
		const before = page.calls.dragged.length;
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));

		expect(page.calls.dragged.length).toBeGreaterThan(before);
	});

	test("+ and - zoom about the centre, f frames the graph", () => {
		const page = setup();

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
		expect(page.controller.viewport().scale).toBeCloseTo(1.2);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "-", bubbles: true }));
		expect(page.controller.viewport().scale).toBeCloseTo(1);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
		expect(page.controller.viewport().scale).toBeGreaterThan(0);
	});

	test("nothing is intercepted while the user is typing", () => {
		const page = setup();
		const input = document.createElement("input");
		document.body.append(input);

		input.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));

		expect(page.controller.viewport().scale).toBe(1);
	});
});
