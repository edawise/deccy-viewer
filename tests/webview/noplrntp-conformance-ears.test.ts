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
 * Events are delivered the way a browser delivers them. A press lands on the
 * element under the pointer, and the browser addresses what follows it where
 * the gesture asked the document to send it: pointer capture when the gesture
 * took it, the element under the pointer otherwise. The click a press and
 * release make is addressed to their nearest common inclusive ancestor, and
 * the compatibility `dblclick` a repeated press produces is addressed to the
 * nearest common inclusive ancestor of the two clicks' targets. jsdom neither
 * keeps that addressing nor synthesises any compatibility event, so the check
 * models the addressing and dispatches the gesture's events where a browser
 * would, and observes what the gesture asks the behavior's delegate for — the
 * node document it opens and the selection it reports — rather than which
 * event arrived where.
 *
 * That addressing is the browser's, and it follows the gesture's own capture
 * choice, so a check that only delivers a double click to a surface that never
 * changes cannot tell a gesture that kept its subject from one that merely
 * kept the browser addressing its later events to the pressed element. The
 * delivery therefore also covers the case the decision speaks of: a node
 * document changes and the viewer reloads the graph (uvmutyww), the renderer
 * draws the new revision with elements of its own, and the page hands the
 * interaction the new graph through the page interface's graph swap. A gesture
 * that spans that reload has lost the element it pressed on — the two clicks
 * of a double click no longer share it — so the compatibility event lands on
 * the surface whoever is capturing, and only a gesture that kept the subject
 * its press landed on can still name it, whatever it did with pointer capture.
 * One reload here re-reads the documents with one node's rationale changed, as
 * the reload of a modified node document does (uvmutyww).
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
	pointerCapture.clear();
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
 * The default graph as a reload re-reads it: one node document was modified,
 * so the revision drawn next is a different one (uvmutyww). Every identity is
 * the same; nothing the checks read a rationale of changes.
 */
function reloadedRecords(): NodeRecord[] {
	const next = records();
	next[2] = { ...next[2], content: text("rationale of cccccccc, as re-read") };
	return next;
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
	/**
	 * The next draw is a new graph revision: the drawn elements of the revision
	 * before it are gone, so nothing of them is reused and the new revision is
	 * drawn under the same identities (ympqvvwr) in elements of its own.
	 */
	fresh: boolean;
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
 * (stppxysx); a new graph revision is drawn from nothing (the `fresh` target),
 * so a reload replaces every drawn element. `labels` is accepted because the
 * real renderer takes it (owtptzpl); nothing here reads it.
 */
function drawGraph(target: DrawTarget, view: DrawView): void {
	if (target.fresh) {
		// A reload draws the new revision from nothing: the renderer's elements
		// of the revision before it are detached, and the identities the page
		// interface gives them carry over to the elements drawn now.
		target.fresh = false;
		target.boxes.clear();
		target.routes.clear();
		target.nodes.replaceChildren();
		target.edges.replaceChildren();
	}
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

/**
 * Where the document currently sends the rest of each pointer's gesture, by
 * pointer id: the element the gesture asked to receive it, or nothing when the
 * element under the pointer keeps receiving it. jsdom implements no such
 * addressing, so it is kept here and read by {@link setup}'s gesture driver.
 */
const pointerCapture = new Map<number, Element>();

for (const [method, apply] of [
	[
		"setPointerCapture",
		(element: Element, pointerId: number): void => {
			pointerCapture.set(pointerId, element);
		},
	],
	[
		"releasePointerCapture",
		(_element: Element, pointerId: number): void => {
			pointerCapture.delete(pointerId);
		},
	],
] as const) {
	Object.defineProperty(Element.prototype, method, {
		configurable: true,
		writable: true,
		value: function (this: Element, pointerId: number) {
			apply(this, pointerId);
		},
	});
}

Object.defineProperty(Element.prototype, "hasPointerCapture", {
	configurable: true,
	writable: true,
	value: function (this: Element, pointerId: number) {
		return pointerCapture.get(pointerId) === this;
	},
});

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

	const model = buildGraph(source);
	const order = graphOrder(model);

	// The graph revision the surface shows. A reload replaces it (uvmutyww);
	// the interaction is told through `setGraph` (the page interface).
	let revision = { model, order };

	const target: DrawTarget = { edges, nodes, boxes: new Map(), routes: new Map(), writes: [], fresh: false };
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
			const layout = layoutGraph(revision.model, revision.order, { dragged });
			drawGraph(target, { model: revision.model, order: revision.order, layout, labels: new Map() });
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

	/**
	 * The element a browser makes the click of a press and release on: their
	 * nearest common inclusive ancestor. The release is addressed where the
	 * gesture asked the browser to send it, or to the element under the pointer
	 * when it asked for nothing.
	 *
	 * A press and release therefore make a click on `element` when the gesture
	 * kept the addressing where it started, and on the surface-rooted ancestor
	 * the gesture redirected it to when it captured the pointer elsewhere.
	 */
	const press = (element: Element, at: Point, pointerId = 1): Element => {
		element.dispatchEvent(pointer("pointerdown", { pointerId, clientX: at.x, clientY: at.y }));
		const released = pointerCapture.get(pointerId) ?? underPointer(element);
		released.dispatchEvent(pointer("pointerup", { pointerId, clientX: at.x, clientY: at.y }));
		pointerCapture.delete(pointerId);
		return commonAncestor(element, released);
	};

	/**
	 * The element under the pointer when the release arrives: the element the
	 * press landed on while it is still in the document, and the surface once a
	 * re-render has taken it away and nothing here knows what replaced it.
	 */
	const underPointer = (element: Element): Element => (element.isConnected ? element : surface);

	/**
	 * The nearest common inclusive ancestor of two click targets, which is where
	 * a browser addresses the click they make and, for two clicks, the
	 * compatibility `dblclick`. A target a re-render has taken out of the
	 * document shares no ancestor with the other, so nothing the document still
	 * holds is an ancestor of both and the browser addresses the event to the
	 * surface.
	 */
	const commonAncestor = (first: Element, second: Element): Element => {
		if (!first.isConnected || !second.isConnected) {
			return surface;
		}
		for (let node: Element | null = first; node !== null; node = node.parentElement) {
			if (node.contains(second)) {
				return node;
			}
		}
		return surface;
	};

	/**
	 * The compatibility event a repeated press produces, dispatched where a
	 * browser addresses it (jsdom synthesises none): the nearest common
	 * inclusive ancestor of the two clicks' targets. Returns the element it was
	 * addressed to, so a check can state where the browser sent it rather than
	 * assume it.
	 */
	const doubleClickOf = async (first: Element, second: Element, at: Point): Promise<Element> => {
		const addressed = commonAncestor(first, second);
		addressed.dispatchEvent(
			new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y }),
		);
		await flushFrame();
		return addressed;
	};

	/**
	 * A double click as a browser makes one: two presses and releases on the
	 * element under the pointer, then the compatibility event, addressed to the
	 * nearest common inclusive ancestor of the two clicks.
	 */
	const doubleClick = async (element: Element, at: Point, pointerId = 1): Promise<void> => {
		const first = press(element, at, pointerId);
		const second = press(element, at, pointerId);
		await doubleClickOf(first, second, at);
	};

	/**
	 * A graph revision arrives: a node document under `nodes/` changed and the
	 * viewer reloads the graph (uvmutyww). The renderer draws the new revision
	 * with elements of its own — the identities carry over (ympqvvwr), the
	 * elements do not — and the page hands the interaction the new graph through
	 * the page interface's graph swap.
	 */
	const reload = (): void => {
		const nextModel = buildGraph(reloadedRecords());
		revision = { model: nextModel, order: graphOrder(nextModel) };
		target.fresh = true;
		controller.setGraph({ model: revision.model, order: revision.order });
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
		press,
		doubleClickOf,
		doubleClick,
		reload,
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

describe("a gesture acts on the subject it was pressed on (rtmqlnwm, trxzsqpv)", () => {
	test("a press and release on a node selects it, and the selection is reported", async () => {
		const page = setup();

		// The press lands on bbbbbbbb; the rest of that gesture is delivered
		// where the browser addresses it, which is not the element under the
		// pointer here.
		page.press(page.box("bbbbbbbb"), { x: 20, y: 20 });
		await flushFrame();

		// ltrnmrsr: clicking a node selects it, and the press it was made on is
		// the node the gesture acts on however the gesture's later events are
		// addressed.
		expect(page.controller.selected()).toBe("bbbbbbbb");
		expect(page.calls.selection).toEqual(["bbbbbbbb"]);
	});

	test("double-clicking a node asks for that node's document", async () => {
		const page = setup();

		await page.doubleClick(page.box("bbbbbbbb"), { x: 20, y: 20 });

		// trxzsqpv: the double click on a node asks the editor for that node's
		// document (nodes/<id>.json), read back as the delegate's request.
		expect(page.calls.opened).toEqual(["bbbbbbbb"]);
	});

	test("a second double click on another node asks for that node, not the first", async () => {
		const page = setup();

		await page.doubleClick(page.box("bbbbbbbb"), { x: 20, y: 20 });
		await page.doubleClick(page.box("aaaaaaaa"), { x: 100, y: 40 });

		// trxzsqpv: each double click asks for the node it was pressed on.
		expect(page.calls.opened).toEqual(["bbbbbbbb", "aaaaaaaa"]);
	});

	test("double-clicking empty canvas asks for no node's document", async () => {
		const page = setup();

		await page.doubleClick(page.box("bbbbbbbb"), { x: 20, y: 20 });
		await page.doubleClick(page.canvas, { x: 700, y: 500 });

		// rtmqlnwm: the empty canvas is a subject of its own, so a double click
		// on it asks for no node's document, however recently a node was
		// pressed.
		expect(page.calls.opened).toEqual(["bbbbbbbb"]);
	});

	test("a double click asks for its node after the surface is re-rendered between the presses", async () => {
		const page = setup();
		const pressed = page.box("bbbbbbbb");

		// The first click of the pair lands on the box under the pointer.
		const first = page.press(pressed, { x: 20, y: 20 });

		// A node document changed, so the viewer reloads the graph (uvmutyww):
		// the surface is drawn again, in elements of the new revision.
		page.reload();
		const redrawn = page.box("bbbbbbbb");
		expect(redrawn, "the box the reload drew").not.toBe(pressed);

		// The second click of the pair lands on the box under the pointer now.
		const second = page.press(redrawn, { x: 20, y: 20 });

		// The compatibility event goes where a browser addresses it: the two
		// clicks' nearest common inclusive ancestor. The first click's box is
		// no longer in the document, so that is not the pressed box.
		const addressed = await page.doubleClickOf(first, second, { x: 20, y: 20 });
		expect(addressed, "where the browser addressed the compatibility event").not.toBe(redrawn);

		// rtmqlnwm/trxzsqpv: the double click asks for the node the gesture was
		// pressed on, however the browser addressed its later events to the
		// surface and whatever the gesture did with pointer capture. A gesture
		// that keeps the pressed element's addressing instead of the subject
		// its press landed on has nothing to open here.
		expect(page.calls.opened).toEqual(["bbbbbbbb"]);
	});

	test("a double click on empty canvas opens no node after the surface is re-rendered", async () => {
		const page = setup();

		// A double click that spans a reload asks for the node it was pressed
		// on.
		const first = page.press(page.box("bbbbbbbb"), { x: 20, y: 20 });
		page.reload();
		const second = page.press(page.box("bbbbbbbb"), { x: 20, y: 20 });
		await page.doubleClickOf(first, second, { x: 20, y: 20 });
		expect(page.calls.opened).toEqual(["bbbbbbbb"]);

		// The surface is drawn again and the empty canvas is double-clicked.
		page.reload();
		const at = { x: 700, y: 500 };
		const canvasFirst = page.press(page.canvas, at);
		page.reload();
		const canvasSecond = page.press(page.canvas, at);
		await page.doubleClickOf(canvasFirst, canvasSecond, at);

		// rtmqlnwm: the empty canvas is a subject of its own, so the double
		// click asks for no node's document, whatever was pressed before it and
		// whatever the reloads did to the drawn elements.
		expect(page.calls.opened).toEqual(["bbbbbbbb"]);
	});

	test("a second double click after a re-render asks for its own node, not the first", async () => {
		const page = setup();

		const openAcrossReload = async (id: string, at: Point): Promise<void> => {
			const first = page.press(page.box(id), at);
			page.reload();
			const second = page.press(page.box(id), at);
			await page.doubleClickOf(first, second, at);
		};

		await openAcrossReload("bbbbbbbb", { x: 20, y: 20 });
		await openAcrossReload("aaaaaaaa", { x: 100, y: 40 });

		// trxzsqpv: each double click asks for the node it was pressed on, not
		// the one an earlier gesture pressed.
		expect(page.calls.opened).toEqual(["bbbbbbbb", "aaaaaaaa"]);
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
