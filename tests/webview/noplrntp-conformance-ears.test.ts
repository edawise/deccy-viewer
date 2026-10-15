// @vitest-environment jsdom
/**
 * Conformance check: what running the pointer and keyboard behaviour
 * (noplrntp) must show for its requirement sentences (rtmqlnwm, kwovtsuv,
 * zrxnpzkq, uswruqlq, spllzqlw, srsnqppq, kyokxuml, yymrxqsk, lntrymms,
 * trxzsqpv, oumoznwq, ltrnmrsr, uxuvwurl, zkwypuor, yxqqozvt, ykvrkysl,
 * zvokurzw, pposortu, muvkrvuu, ruqsmuxz, rwonulnq, wzqzwsst, nyxwutoo,
 * zpkmkvts) to hold, and what it must show for the incremental application of
 * a state change (stppxysx) to hold.
 *
 * The behaviours are attached to a canvas built here and driven through real
 * pointer and key events, so the check observes what the artifact does. The
 * surface is drawn by the small local helper below from the layout the
 * interaction asks its delegate for, under the identity vocabulary of the page
 * interface (ympqvvwr): one element per node carrying `data-node-id` and one
 * per drawn edge part carrying `data-edge-key`, the only attributes the checks
 * read. No renderer is imported, so the check runs at this node's base; the
 * real-renderer composition stays with ylolxwpv. The helper keeps a drawn
 * element's identity across a re-layout, the way an incremental renderer does
 * (stppxysx), so a lookup table built once keeps answering.
 *
 * Every element lookup the behavior makes on the surface, or on anything the
 * surface contains, is recorded — whatever the selector and whichever of the
 * element lookup methods it uses — so a change that reads the drawn surface to
 * find its elements is visible even when the selector it chooses is one this
 * check does not name (stppxysx).
 *
 * The behaviour is imported for its entry points and the identity and
 * emphasis vocabulary it works through (ympqvvwr); no value of the behaviour is
 * restated — the drag threshold, the pan and zoom steps and the viewport
 * limits are the artifact's own and no requirement sentence fixes them.
 */
import { beforeEach, describe, expect, test } from "vitest";

import type { NodeContent, NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import type { GraphModel } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import type { GraphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type { GraphLayout, Point } from "../../src/graph/layout";
import { attachInteractions } from "../../src/webview/interact";
import { attachKeyboard } from "../../src/webview/keyboard";
import type { InteractionDelegate } from "../../src/webview/contract";
import { EDGE_KEY_ATTR, EmphasisClasses, NODE_ID_ATTR, edgeKey } from "../../src/webview/contract";

type ResizeCallback = () => void;
let observedResize: ResizeCallback | undefined;

globalThis.ResizeObserver = class {
	constructor(callback: ResizeCallback) {
		observedResize = callback;
	}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

beforeEach(() => {
	document.body.replaceChildren();
	watchedSurfaces.length = 0;
});

/** One element lookup the behavior asked for, whatever the selector. */
interface QueryCall {
	/** The element lookup method it used. */
	method: string;
	/** The selector it passed. */
	selector: string;
}

/** The surface of one page set up here, and the lookups recorded on it. */
interface WatchedSurface {
	surface: Element;
	queries: QueryCall[];
}

/** The surfaces a running check is recording lookups on, oldest first. */
const watchedSurfaces: WatchedSurface[] = [];

/**
 * Record every element lookup made through an element — `querySelector`,
 * `querySelectorAll`, `getElementsByClassName`, `getElementsByTagName` — when
 * the receiver is the surface or an element the surface contains, the nodes
 * and edges containers included. The selector is recorded, never interpreted:
 * a change that reads the surface is reading it however the selector is
 * spelled, so a selector this check does not name cannot hide the read
 * (stppxysx).
 */
for (const method of ["querySelector", "querySelectorAll", "getElementsByClassName", "getElementsByTagName"] as const) {
	const original = Element.prototype[method] as unknown as (...args: unknown[]) => unknown;
	Object.defineProperty(Element.prototype, method, {
		configurable: true,
		writable: true,
		value: function (this: Element, selector: string) {
			for (const watched of watchedSurfaces) {
				// `contains` includes the surface itself.
				if (watched.surface.contains(this)) {
					watched.queries.push({ method, selector });
					break;
				}
			}
			return original.call(this, selector);
		},
	});
}

function text(why: string): NodeContent {
	return { type: "text", ref: "inline", rationale: why };
}

function records(): NodeRecord[] {
	return ["aaaaaaaa", "bbbbbbbb", "cccccccc"].map((id, index) => ({
		id,
		kind: index === 2 ? "evaluation" : "decision",
		dependsOn: index === 0 ? [] : ["aaaaaaaa"],
		evaluates: index === 2 ? ["bbbbbbbb"] : [],
		content: { type: "text", ref: "inline", rationale: `rationale of ${id}` },
	}));
}

/**
 * Two separate neighbourhoods: aaaaaaaa -> bbbbbbbb <- cccccccc and
 * dddddddd <- eeeeeeee, dddddddd -> ffffffff. A change around one of them
 * cannot be mistaken for a change that wrote every drawn element, which is
 * what the incremental checks need to tell apart.
 */
function wideRecords(): NodeRecord[] {
	return [
		{ id: "aaaaaaaa", kind: "decision", dependsOn: [], evaluates: [], content: text("rationale of aaaaaaaa") },
		{ id: "bbbbbbbb", kind: "decision", dependsOn: ["aaaaaaaa"], evaluates: [], content: text("rationale of bbbbbbbb") },
		{ id: "cccccccc", kind: "evaluation", dependsOn: [], evaluates: ["bbbbbbbb"], content: text("rationale of cccccccc") },
		{ id: "dddddddd", kind: "decision", dependsOn: [], evaluates: [], content: text("rationale of dddddddd") },
		{ id: "eeeeeeee", kind: "evaluation", dependsOn: [], evaluates: ["dddddddd"], content: text("rationale of eeeeeeee") },
		{ id: "ffffffff", kind: "decision", dependsOn: ["dddddddd"], evaluates: [], content: text("rationale of ffffffff") },
	];
}

/** One class write the behavior asked an element to make. */
interface ClassWrite {
	element: Element;
	method: string;
}

/**
 * What the local surface holds across a re-layout: the two regions, the drawn
 * element of each node and edge key (kept, so an element keeps its identity
 * across a re-layout), and the class writes recorded on it.
 */
interface DrawTarget {
	edges: Element;
	nodes: Element;
	boxes: Map<string, Element>;
	routes: Map<string, Element>;
	writes: ClassWrite[];
}

/** The second argument of {@link drawGraph}: what to draw, in graph terms. */
interface DrawView {
	model: GraphModel;
	order: GraphOrder;
	layout: GraphLayout;
	labels: ReadonlyMap<string, string>;
}

function place(element: Element | HTMLElement, box: { x: number; y: number; width: number; height: number }): void {
	if (!(element instanceof HTMLElement)) {
		return;
	}
	element.style.left = `${box.x}px`;
	element.style.top = `${box.y}px`;
	element.style.width = `${box.width}px`;
	element.style.height = `${box.height}px`;
}

/**
 * Record every class write the behavior asks of `element`, so the checks can
 * see which elements a state change touched, not only which classes ended up
 * different. `classList` and `className` are both covered, since a decision
 * may reach the classes either way.
 */
function instrument(element: Element, writes: ClassWrite[]): void {
	const list = element.classList;
	for (const method of ["add", "remove", "toggle"] as const) {
		const original = list[method] as (...args: unknown[]) => void;
		Object.defineProperty(list, method, {
			configurable: true,
			writable: true,
			value: (...args: unknown[]) => {
				writes.push({ element, method });
				return original.apply(list, args);
			},
		});
	}

	const className = Object.getOwnPropertyDescriptor(Element.prototype, "className");
	if (className?.get !== undefined && className.set !== undefined) {
		const get = className.get;
		const set = className.set;
		Object.defineProperty(element, "className", {
			configurable: true,
			get: () => get.call(element),
			set: (value: string) => {
				writes.push({ element, method: "className" });
				set.call(element, value);
			},
		});
	}

	const setAttribute = element.setAttribute.bind(element);
	Object.defineProperty(element, "setAttribute", {
		configurable: true,
		writable: true,
		value: (name: string, value: string) => {
			if (name === "class") {
				writes.push({ element, method: "setAttribute" });
			}
			return setAttribute(name, value);
		},
	});
}

/**
 * Draw the graph the interaction asked for into the two regions, under the
 * page interface's identity attributes (ympqvvwr): one element per node of the
 * layout carrying `data-node-id`, one element per edge route carrying the
 * `data-edge-key` of its edge. Elements are reused across a re-layout, so the
 * surface keeps its identities the way an incremental renderer does
 * (stppxysx). `labels` is accepted because the real renderer takes it (owtptzpl);
 * nothing here reads it.
 */
function drawGraph(target: DrawTarget, view: DrawView): void {
	const drawn = new Set<string>();
	for (const id of view.order.ids) {
		const box = view.layout.nodes.get(id);
		if (box === undefined) {
			continue;
		}
		drawn.add(id);
		let element = target.boxes.get(id);
		if (element === undefined) {
			element = document.createElement("div");
			element.setAttribute(NODE_ID_ATTR, id);
			instrument(element, target.writes);
			target.boxes.set(id, element);
			target.nodes.append(element);
		}
		place(element, box);
	}
	for (const [id, element] of target.boxes) {
		if (!drawn.has(id)) {
			element.remove();
			target.boxes.delete(id);
		}
	}

	const routed = new Set<string>();
	for (const route of view.layout.edges) {
		const key = edgeKey(route.edge);
		routed.add(key);
		let element = target.routes.get(key);
		if (element === undefined) {
			element = document.createElementNS("http://www.w3.org/2000/svg", "path");
			element.setAttribute(EDGE_KEY_ATTR, key);
			instrument(element, target.writes);
			target.routes.set(key, element);
			target.edges.append(element);
		}
	}
	for (const [key, element] of target.routes) {
		if (!routed.has(key)) {
			element.remove();
			target.routes.delete(key);
		}
	}
}

/** A drawn element named the way the page interface names it (ympqvvwr). */
function identity(element: Element): string {
	const id = element.getAttribute(NODE_ID_ATTR);
	if (id !== null) {
		return `node ${id}`;
	}
	const key = element.getAttribute(EDGE_KEY_ATTR);
	if (key !== null) {
		return `edge ${key}`;
	}
	return `container <${element.tagName.toLowerCase()}>`;
}

function size(element: HTMLElement, width: number, height: number): void {
	Object.defineProperty(element, "clientWidth", { value: width, configurable: true });
	Object.defineProperty(element, "clientHeight", { value: height, configurable: true });
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

/**
 * Let a pending application land: microtask-scheduled work, then one animation
 * frame, then a task. A behavior that applies a change synchronously is
 * already done and this only waits; a behavior that merges changes into the
 * frame (stppxysx) gets its frame. The timeout keeps the wait bounded if the
 * environment never fires an animation frame.
 */
async function flushFrame(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise<void>((resolve) => {
		let settled = false;
		const done = (): void => {
			if (!settled) {
				settled = true;
				resolve();
			}
		};
		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(done);
		}
		setTimeout(done, 40);
	});
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await Promise.resolve();
}

function setup(source: NodeRecord[] = records()) {
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

	const model = buildGraph(source);
	const order = graphOrder(model);

	const target: DrawTarget = { edges, nodes, boxes: new Map(), routes: new Map(), writes: [] };
	const queries: QueryCall[] = [];
	// Every element lookup the behavior makes on the surface, or on anything
	// inside it, is recorded from here on, whatever the selector and whichever
	// lookup method (see the prototype instrumentation above). A change that
	// scans the surface to find its elements can then be told from one that
	// already knows them (stppxysx).
	watchedSurfaces.push({ surface, queries });

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
			drawGraph(target, { model, order, layout, labels: new Map() });
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

	// Attaching may look the surface up once to learn the elements it drives;
	// only what a later state change asks for is recorded.
	queries.length = 0;
	target.writes.length = 0;

	const box = (id: string): HTMLElement => {
		const element = nodes.querySelector(`[${NODE_ID_ATTR}="${id}"]`);
		if (!(element instanceof HTMLElement)) {
			throw new Error(`no box for ${id}`);
		}
		return element;
	};

	const edge = (key: string): Element => {
		const element = edges.querySelector(`[${EDGE_KEY_ATTR}="${key}"]`);
		if (element === null) {
			throw new Error(`no element for edge ${key}`);
		}
		return element;
	};

	/** Start recording from here; drop what attaching asked for. */
	const reset = (): void => {
		target.writes.length = 0;
		queries.length = 0;
	};

	/** The drawn elements a state change wrote that `allowed` does not cover. */
	const writtenOutside = (allowed: readonly Element[]): string[] => {
		const permitted = new Set(allowed);
		const outside = new Set<string>();
		for (const write of target.writes) {
			if (!permitted.has(write.element)) {
				outside.add(identity(write.element));
			}
		}
		return [...outside].sort();
	};

	// yxqqozvt: the panel is resized by the workbench; the observer is fired
	// here with the new size so the reflow can be observed.
	const resize = (width: number, height: number): void => {
		size(canvas, width, height);
		observedResize?.();
	};

	return {
		canvas,
		surface,
		edges,
		nodes,
		model,
		order,
		calls,
		controller,
		keyboard,
		box,
		edge,
		resize,
		reset,
		writtenOutside,
		classWrites: target.writes,
		surfaceQueries: queries,
	};
}

/** One page as {@link setup} builds it. */
type Page = ReturnType<typeof setup>;

/**
 * Run one state change and return the element lookups the behavior made on the
 * surface from just before the change to just after its frame. The caller
 * resolves every element the dispatch needs beforehand, so the check's own
 * `box`/`edge` lookups are outside the window and are not counted.
 */
async function during(page: Page, change: () => void): Promise<QueryCall[]> {
	page.reset();
	change();
	await flushFrame();
	return page.surfaceQueries.slice();
}

describe("the pointer selects, clears and opens (ltrnmrsr, oumoznwq, trxzsqpv)", () => {
	test("clicking a node selects it and reports the selection", async () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10 }));
		page.box("bbbbbbbb").dispatchEvent(pointer("pointerup", { clientX: 10, clientY: 10 }));
		await flushFrame();

		// ltrnmrsr: clicking a node selects it ...
		expect(page.controller.selected()).toBe("bbbbbbbb");
		// ... and the selection is reported, so the detail can be shown (ltrnmrsr).
		expect(page.calls.selection).toEqual(["bbbbbbbb"]);
	});

	test("clicking empty canvas without dragging clears the selection", async () => {
		const page = setup();
		page.controller.select("bbbbbbbb");

		page.canvas.dispatchEvent(pointer("pointerdown", { clientX: 700, clientY: 500 }));
		page.canvas.dispatchEvent(pointer("pointerup", { clientX: 700, clientY: 500 }));
		await flushFrame();

		// oumoznwq: a click on empty canvas without dragging clears the selection.
		expect(page.controller.selected()).toBeNull();
	});

	test("a click on an edge is not a click on empty canvas, so it clears nothing", async () => {
		const page = setup();
		page.controller.select("bbbbbbbb");
		const edge = page.edges.querySelector(`[${EDGE_KEY_ATTR}]`);
		expect(edge).not.toBeNull();

		edge?.dispatchEvent(pointer("pointerdown", { clientX: 1, clientY: 1 }));
		edge?.dispatchEvent(pointer("pointerup", { clientX: 1, clientY: 1 }));
		await flushFrame();

		// oumoznwq: only empty canvas clears the selection; an edge is not empty.
		expect(page.controller.selected()).toBe("bbbbbbbb");
	});

	test("double-clicking a node asks for its document to be opened", async () => {
		const page = setup();

		page.box("aaaaaaaa").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
		await flushFrame();

		// trxzsqpv: double-clicking a node opens nodes/<id>.json in the editor.
		expect(page.calls.opened).toEqual(["aaaaaaaa"]);
	});
});

describe("the pointer hovers (kwovtsuv, zrxnpzkq, uswruqlq)", () => {
	test("hovering a node highlights its neighbourhood and shows its rationale", async () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		await flushFrame();

		// kwovtsuv: hovering a node highlights the nodes associated with it —
		// here the prerequisite aaaaaaaa, which has an edge into bbbbbbbb.
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(true);
		// zrxnpzkq: ... and shows a tooltip with the hovered node's rationale.
		const tooltip = document.querySelector(".tooltip");
		expect(tooltip?.textContent).toBe("rationale of bbbbbbbb");
		expect((tooltip as HTMLElement | null)?.hidden).toBe(false);
	});

	test("the associated nodes are the incident ones, not the hovered node itself", async () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		await flushFrame();

		// kwovtsuv: the nodes associated with the hovered node are the ones its
		// edges reach, so the hovered node is not among them.
		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(false);
	});

	test("leaving the canvas clears the hover and hides the tooltip", async () => {
		const page = setup();
		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		await flushFrame();

		page.canvas.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
		await flushFrame();

		// rtmqlnwm/kwovtsuv: the pointer is no longer over the graph, so the
		// neighbourhood it highlighted is no longer marked ...
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(false);
		// ... and the tooltip is gone (zrxnpzkq).
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(true);
	});

	test("no tooltip is shown while a node is dragged", async () => {
		const page = setup();
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 40 }));
		await flushFrame();
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(false);

		page.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 160, clientY: 40 }));
		await flushFrame();

		// uswruqlq: while a node is being dragged, hover tooltips are suppressed.
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(true);
	});
});

describe("the selection emphasis (zkwypuor, uxuvwurl)", () => {
	test("a selected node is highlighted together with its dependencies, dependents and evaluations", async () => {
		const page = setup();

		page.controller.select("bbbbbbbb");
		await flushFrame();

		// zkwypuor: the selected node is highlighted ...
		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.selected)).toBe(true);
		// ... together with its direct dependencies and dependents ...
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.related)).toBe(true);
		// ... and its evaluations.
		expect(page.box("cccccccc").classList.contains(EmphasisClasses.related)).toBe(true);
	});

	test("with nothing selected no element is dimmed", async () => {
		const page = setup();
		page.controller.select("bbbbbbbb");
		page.controller.clearSelection();
		await flushFrame();

		// uxuvwurl: while no node is selected, all elements are shown undimmed.
		for (const id of ["aaaaaaaa", "bbbbbbbb", "cccccccc"]) {
			expect(page.box(id).classList.contains(EmphasisClasses.dimmed), id).toBe(false);
		}
	});
});

describe("the canvas drags, pans and zooms (spllzqlw, srsnqppq, kyokxuml, yymrxqsk, lntrymms)", () => {
	test("a node pressed and moved past the threshold is dragged and re-routed", async () => {
		const page = setup();
		const before = page.calls.dragged.length;

		page.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 140, clientY: 40 }));
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 160, clientY: 40 }));
		await flushFrame();

		// spllzqlw: dragging a node moves that node and re-routes its edges —
		// the renderer is asked to lay the graph out again with the new place.
		expect(page.calls.dragged.length).toBeGreaterThan(before);
		expect(page.calls.dragged.at(-1)?.has("aaaaaaaa")).toBe(true);
	});

	test("dragging the canvas pans the graph by the pointer's movement", async () => {
		const page = setup();

		page.canvas.dispatchEvent(pointer("pointerdown", { clientX: 400, clientY: 400 }));
		page.canvas.dispatchEvent(pointer("pointermove", { clientX: 480, clientY: 430 }));
		page.canvas.dispatchEvent(pointer("pointermove", { clientX: 500, clientY: 450 }));
		page.canvas.dispatchEvent(pointer("pointerup", { clientX: 500, clientY: 450 }));
		await flushFrame();

		// srsnqppq: dragging the canvas pans the graph by the pointer's movement
		// — right 100px and down 50px here.
		expect(page.controller.viewport().x).toBe(100);
		expect(page.controller.viewport().y).toBe(50);
	});

	test("scrolling zooms and an operation past the limits stays clamped at them", async () => {
		const page = setup();

		page.canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -200, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));
		await flushFrame();

		// kyokxuml: scrolling over the canvas zooms the graph.
		expect(page.controller.viewport().scale).toBeGreaterThan(1);

		// yymrxqsk: an operation past the limits is clamped at them — the specs
		// fix no limit value, so the check observes that a second extreme zoom
		// does not go past the same limit.
		page.canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -100000, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));
		await flushFrame();
		const clamped = page.controller.viewport().scale;
		page.canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -100000, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));
		await flushFrame();
		expect(page.controller.viewport().scale).toBe(clamped);
		expect(clamped).toBeGreaterThan(1);
	});

	test("the graph can be framed in the viewport", async () => {
		const page = setup();
		page.controller.panBy(200, 200);
		page.controller.zoomAt(0.5, { x: 0, y: 0 });

		page.controller.fitGraph();
		await flushFrame();

		// lntrymms: fit graph resets pan and zoom to frame all nodes, so the
		// viewport is left on the graph rather than off it.
		expect(page.controller.viewport().scale).toBeGreaterThan(0);
		expect(page.controller.viewport().x).toBeGreaterThanOrEqual(0);
	});

	test("a resized panel reflows the viewport to the new size", async () => {
		const page = setup();
		page.controller.zoomAboutCentre(2);
		const scale = page.controller.viewport().scale;
		const before = page.surface.style.transform;

		page.resize(1000, 800);
		await flushFrame();

		// yxqqozvt: when the panel is resized the viewport is reflowed to the
		// new size ...
		expect(page.surface.style.transform).not.toBe(before);
		// ... and the reflow is not a zoom.
		expect(page.controller.viewport().scale).toBe(scale);
	});
});

describe("the keyboard does what the pointer does (ykvrkysl, ruqsmuxz, rwonulnq, wzqzwsst, zpkmkvts, zvokurzw, nyxwutoo, pposortu, muvkrvuu)", () => {
	test("Tab walks the graph order forward and wraps, Shift and Tab walks it back", async () => {
		const page = setup();

		// ruqsmuxz: Tab moves focus to the next node in graph order, wrapping
		// at the last node.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
		await flushFrame();
		expect(page.controller.focused()).toBe(page.order.ids[0]);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
		await flushFrame();
		expect(page.controller.focused()).toBe(page.order.ids[1]);

		// rwonulnq: Shift and Tab moves focus to the previous node in graph
		// order, wrapping at the first.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
		await flushFrame();
		expect(page.controller.focused()).toBe(page.order.ids[0]);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
		await flushFrame();
		expect(page.controller.focused()).toBe(page.order.ids.at(-1));
	});

	test("Enter selects the focused node and Esc clears the selection", async () => {
		const page = setup();

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
		await flushFrame();

		// wzqzwsst: Enter selects the focused node.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		await flushFrame();
		expect(page.controller.selected()).toBe(page.order.ids[0]);

		// zpkmkvts: Esc clears the selection.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await flushFrame();
		expect(page.controller.selected()).toBeNull();
	});

	test("the arrow keys pan, Shift and an arrow move the selected node", async () => {
		const page = setup();
		page.controller.panBy(100, 0);
		const beforePan = page.controller.viewport().x;

		// zvokurzw: the arrow keys pan the viewport.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
		await flushFrame();
		expect(page.controller.viewport().x).not.toBe(beforePan);

		// nyxwutoo: Shift and an arrow moves the selected node.
		page.controller.select("aaaaaaaa");
		const before = page.calls.dragged.length;
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
		await flushFrame();
		expect(page.calls.dragged.length).toBeGreaterThan(before);
	});

	test("+ and - zoom about the centre, f frames the graph", async () => {
		const page = setup();

		// pposortu: + zooms about the centre of the viewport ...
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
		await flushFrame();
		expect(page.controller.viewport().scale).toBeGreaterThan(1);

		// ... and - zooms back out about it.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "-", bubbles: true }));
		await flushFrame();
		expect(page.controller.viewport().scale).toBeCloseTo(1);

		// muvkrvuu: f fits the graph to the viewport.
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
		await flushFrame();
		expect(page.controller.viewport().scale).toBeGreaterThan(0);
	});

	test("the equivalents are the viewer's own, so nothing is intercepted while typing", async () => {
		const page = setup();
		const input = document.createElement("input");
		document.body.append(input);

		input.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
		await flushFrame();

		// ykvrkysl: the keyboard equivalents are the viewer's bindings on the
		// graph; typing elsewhere does not reach them.
		expect(page.controller.viewport().scale).toBe(1);
	});
});

describe("a state change is applied incrementally (stppxysx)", () => {
	test("a change reads no more of the surface than the elements it knows", async () => {
		const page = setup(wideRecords());

		// Every element the dispatches need is resolved before each window
		// opens: only what the behavior asks for is recorded.
		const aaaa = page.box("aaaaaaaa");
		const dddd = page.box("dddddddd");

		const selection = await during(page, () => page.controller.select("bbbbbbbb"));
		const hover = await during(page, () =>
			dddd.dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 })),
		);
		const drag = await during(page, () => {
			aaaa.dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
			aaaa.dispatchEvent(pointer("pointermove", { clientX: 140, clientY: 40 }));
		});
		const focus = await during(page, () =>
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })),
		);

		// stppxysx: the elements a change affects are looked up by the identity
		// the change carries, so no change reads the surface to find them —
		// not with a selector for the drawn nodes or edges, not with any other
		// selector, and not through any of the element lookups. Moving keyboard
		// focus is a state change like the pointer ones (ruqsmuxz). Only
		// attaching may have read the surface.
		expect.soft(selection, "surface lookups for a selection change").toEqual([]);
		expect.soft(hover, "surface lookups for a hover change").toEqual([]);
		expect.soft(drag, "surface lookups for a drag").toEqual([]);
		expect.soft(focus, "surface lookups for a keyboard focus change").toEqual([]);
	});

	test("a hover writes emphasis to the elements it changes and nothing else", async () => {
		const page = setup(wideRecords());
		page.reset();

		// The pointer arrives on dddddddd, the root of the far neighbourhood.
		page.box("dddddddd").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		await flushFrame();

		// stppxysx: a hover rewrites emphasis on the hovered element and its
		// associated set — the incident edges and the adjacent nodes — and
		// touches nothing else. Here that is eeeeeeee, ffffffff and the two
		// edges they share with dddddddd; aaaaaaaa, bbbbbbbb, cccccccc and
		// their edges carry no hover state and must not be written.
		expect(
			page.writtenOutside([
				page.box("dddddddd"),
				page.box("eeeeeeee"),
				page.box("ffffffff"),
				page.edge("evaluates:eeeeeeee->dddddddd"),
				page.edge("depends_on:dddddddd->ffffffff"),
			]),
			"elements written by hovering dddddddd",
		).toEqual([]);

		// The pointer moves to the other neighbourhood: what was emphasized is
		// cleared, so those elements may be written again — and the rest still
		// must not be.
		page.reset();
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		await flushFrame();

		expect(
			page.writtenOutside([
				// newly emphasized
				page.box("aaaaaaaa"),
				page.box("bbbbbbbb"),
				page.edge("depends_on:aaaaaaaa->bbbbbbbb"),
				// previously emphasized
				page.box("eeeeeeee"),
				page.box("ffffffff"),
				page.edge("evaluates:eeeeeeee->dddddddd"),
				page.edge("depends_on:dddddddd->ffffffff"),
			]),
			"elements written when the hover moves from dddddddd to aaaaaaaa",
		).toEqual([]);
	});

	test("a drag merges its pending applications into at most one per frame, last position applied", async () => {
		const page = setup(wideRecords());
		page.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		// Past the threshold, so the press is a drag from here on (spllzqlw).
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 110, clientY: 40 }));
		const before = page.calls.dragged.length;

		// Several pointer moves inside one frame.
		for (const x of [120, 140, 160, 180]) {
			page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: x, clientY: 40 }));
		}
		const burst = page.calls.dragged.length - before;
		await flushFrame();
		const applied = page.calls.dragged.length - before;

		// stppxysx: the changes pending within a frame are merged and applied
		// at most once per frame. A synchronous first application in the frame
		// is allowed; one application per pointer move is not.
		expect(burst, "applications during the burst").toBeLessThanOrEqual(2);
		expect(applied, "applications once the frame has run").toBeLessThanOrEqual(2);
		expect(applied, "applications once the frame has run").toBeGreaterThan(0);

		// Nothing is dropped: the merged application carries the last pointer
		// position, not the first one pending.
		const reference = setup(wideRecords());
		reference.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		reference.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 110, clientY: 40 }));
		reference.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 180, clientY: 40 }));
		await flushFrame();

		const moved = page.calls.dragged.at(-1)?.get("aaaaaaaa");
		const expected = reference.calls.dragged.at(-1)?.get("aaaaaaaa");
		expect(moved, "the drag position the surface was given").toBeDefined();
		expect(expected, "the drag position a single move to the same place gives").toBeDefined();
		expect(moved?.x).toBeCloseTo(expected?.x ?? Number.NaN, 5);
		expect(moved?.y).toBeCloseTo(expected?.y ?? Number.NaN, 5);
	});
});
