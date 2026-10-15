// @vitest-environment jsdom
/**
 * Conformance check: what running the pointer and keyboard behaviour
 * (noplrntp) must show for its requirement sentences (rtmqlnwm, kwovtsuv,
 * zrxnpzkq, uswruqlq, spllzqlw, srsnqppq, kyokxuml, yymrxqsk, lntrymms,
 * trxzsqpv, oumoznwq, ltrnmrsr, uxuvwurl, zkwypuor, yxqqozvt, ykvrkysl,
 * zvokurzw, pposortu, muvkrvuu, ruqsmuxz, rwonulnq, wzqzwsst, nyxwutoo,
 * zpkmkvts) to hold, what it must show for the incremental application of a
 * state change (stppxysx) to hold, and what it must show for the focus that
 * recentres the viewport (wzsxvmvw) to hold.
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
 * A focus that arrives at a node by a means other than a pointer click on it
 * recentres the viewport (wzsxvmvw), so the check also drives the focus the
 * way the viewer offers it — keyboard traversal forwards and backwards, and
 * the interaction's own focus move — and reads where the viewport came to
 * rest against the node's drawn box and the canvas centre. What a recentre
 * must leave is taken per axis from the rule (wzsxvmvw) and from what the
 * layout module draws (qmsmvrnr), never from the limits the behaviour keeps:
 *
 * - On an axis where the graph fits within the viewport — the extent the
 *   layout module gives the graph at the zoom in hand, against the canvas's
 *   own size — the focused node's centre must come to the canvas centre
 *   exactly, and the margin that leaves at the graph's edge is what the rule
 *   permits there, so the pan limits the behaviour records must not hold the
 *   move back and the expected view is not clamped by them.
 * - On an axis where the graph overflows the viewport the graph must keep
 *   covering it, and the pan limits the behaviour records bind: the expected
 *   view is the centred one clamped into those limits. The limits are read
 *   back from the behaviour by panning to each side at the zoom in hand and
 *   observing where the viewport stops, so no limit value is restated; the
 *   check states the boundary it accepts — a centring move on an overflowing
 *   axis comes to rest on the recorded limit and no further, and the node is
 *   not centred there.
 * - The clamp a pan keeps is observed where the layout and the canvas put it,
 *   not read back from the behaviour: a limit read back by panning would
 *   follow a changed clamp instead of naming it, so nothing would hold a pan
 *   that stopped pinning a fitted axis. On an axis the graph fits within, a
 *   pan far to each side must leave the graph inside the viewport, its near
 *   edge on the canvas's near edge at one extreme and its far edge on the
 *   canvas's far edge at the other; on an axis the graph overflows, it must
 *   leave the graph covering the viewport, its far edge on the canvas's far
 *   edge at one extreme and its near edge on the canvas's near edge at the
 *   other. Those places come from the extent the layout module draws
 *   (qmsmvrnr) and the canvas's own size, so the pan is held where the viewer
 *   records its limits without any limit value being restated. An axis whose
 *   drawn extent is exactly the canvas's own is driven as well: "fits within"
 *   reaches its boundary, so the pan has the one place that axis allows and a
 *   recentre is not held back there — an axis treated as overflowing on
 *   equality fails both.
 *
 * The check therefore covers a graph fitted to the viewport (lntrymms, at the
 * sizes the panel is resized to here), a graph zoomed out until it fits, and
 * a graph that overflows one axis and fits the other at the pan and zoom the
 * viewer starts from, so a fitted axis never silently inherits the clamp an
 * overflowing one keeps. The means a recentre must not reach are driven the
 * same way: a pointer click on a node, a change of the panel's own focus, and
 * a focus that ends with no node focused when a reload re-reads the documents
 * without the focused node.
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
import type { InteractionDelegate, Viewport } from "../../src/webview/contract";
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
	 * the page interface's graph swap. `source` is the set of node documents
	 * re-read; by default one of them was modified, and a caller may hand it a
	 * set that no longer holds a node the check focused.
	 */
	const reload = (source: NodeRecord[] = reloadedRecords()): void => {
		const nextModel = buildGraph(source);
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

/**
 * A graph the recentre checks can read both of their cases off: three chains
 * of three nodes, so the arrangement is three layers of three columns and the
 * nodes are spread far enough that some sit well inside the pan limits and
 * some at their edge.
 */
function gridRecords(): NodeRecord[] {
	const records: NodeRecord[] = [];
	for (const column of ["a", "b", "c"]) {
		for (let layer = 0; layer < 3; layer++) {
			const id = `n${column}${layer}`;
			records.push({
				id,
				kind: "decision",
				dependsOn: layer === 0 ? [] : [`n${column}${layer - 1}`],
				evaluates: [],
				content: text(`rationale of ${id}`),
			});
		}
	}
	return records;
}

/** The box the surface draws `id` in, from the layout module (qmsmvrnr). */
function boxOf(page: Page, id: string): { x: number; y: number; width: number; height: number } {
	const box = layoutGraph(page.model, page.order).nodes.get(id);
	if (box === undefined) {
		throw new Error(`no box for ${id}`);
	}
	return box;
}

/** The pan limits the behavior enforces at the zoom in hand (yymrxqsk). */
interface PanLimits {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

/**
 * The pan limits the behavior actually enforces at the current zoom, read back
 * rather than restated (yymrxqsk): the specs fix no limit values, so the check
 * pans far to each side and observes where the viewport stops, then puts the
 * viewport back where it was. A limit bounds where a pan may take the view, so
 * it is the same wherever the viewport starts, and reading it this way keeps
 * the check from fixing a limit the behavior is free to choose.
 */
function panLimits(page: Page): PanLimits {
	const start = page.controller.viewport();
	page.controller.panBy(-1e6, -1e6);
	const low = page.controller.viewport();
	page.controller.panBy(1e6, 1e6);
	const high = page.controller.viewport();
	page.controller.panBy(start.x - high.x, start.y - high.y);
	return { minX: low.x, maxX: high.x, minY: low.y, maxY: high.y };
}

/**
 * The graph as the surface draws it and the viewport it is shown in: the
 * extent the layout module gives the graph (qmsmvrnr) and the canvas's own
 * size. Whether an axis fits is read from this, so the fitted axis of the rule
 * (wzsxvmvw) is decided by the drawn graph, not by a limit the behavior keeps.
 */
interface Frame {
	bounds: { x: number; y: number; width: number; height: number };
	width: number;
	height: number;
}

function frameOf(page: Page): Frame {
	return {
		bounds: layoutGraph(page.model, page.order).bounds,
		width: page.canvas.clientWidth,
		height: page.canvas.clientHeight,
	};
}

/**
 * Whether the drawn graph fits inside the viewport on each axis at `scale`.
 * "Fits within" reaches its own boundary: an axis the graph fills exactly is
 * the fitted one (wzsxvmvw).
 */
function fits(frame: Frame, scale: number): { x: boolean; y: boolean } {
	return {
		x: frame.bounds.width * scale <= frame.width + 1e-9,
		y: frame.bounds.height * scale <= frame.height + 1e-9,
	};
}

/** Where a pan comes to rest on each axis, in viewport units (yymrxqsk). */
interface PanRange {
	x: { min: number; max: number };
	y: { min: number; max: number };
}

/**
 * Where a pan far to each side must leave the viewport on each axis, taken
 * from the extent the layout module draws (qmsmvrnr) and the canvas's own
 * size rather than from the limits the behaviour keeps.
 *
 * The clamp the viewer records today holds a graph that fits within an axis
 * inside the viewport, so at one extreme the graph's near edge lies on the
 * canvas's near edge and at the other its far edge lies on the canvas's far
 * edge. On an axis the graph overflows, the covering is kept instead: at one
 * extreme the graph's far edge lies on the canvas's far edge and at the other
 * its near edge on the canvas's near edge. Both readings are the recorded
 * behaviour of a pan, which a centring move leaves as it is (wzsxvmvw); a pan
 * that came to rest anywhere else would be a different clamp.
 */
function panRange(frame: Frame, scale: number): PanRange {
	const axis = (start: number, extent: number, size: number, fitted: boolean) => {
		const nearEdgeOnNearEdge = -start * scale;
		const farEdgeOnFarEdge = size - (start + extent) * scale;
		return fitted
			? { min: nearEdgeOnNearEdge, max: farEdgeOnFarEdge }
			: { min: farEdgeOnFarEdge, max: nearEdgeOnNearEdge };
	};
	const fit = fits(frame, scale);
	return {
		x: axis(frame.bounds.x, frame.bounds.width, frame.width, fit.x),
		y: axis(frame.bounds.y, frame.bounds.height, frame.height, fit.y),
	};
}

/** Where a recentre on a node must leave the viewport (wzsxvmvw). */
interface RecentreExpectation {
	/** The zoom the recentre must leave as it is. */
	scale: number;
	/** The drawn centre of the focused node, in graph pixels. */
	centre: Point;
	/** Where centring alone would put the viewport. */
	centred: Point;
	/** Whether the drawn graph fits the viewport on each axis at this zoom. */
	fits: { x: boolean; y: boolean };
	/** The pan a recentre must leave. */
	x: number;
	y: number;
	/** Whether a recorded pan limit binds that axis and holds the move back. */
	held: { x: boolean; y: boolean };
}

/**
 * What a recentre on `id` must leave (wzsxvmvw), taken per axis from the rule
 * rather than from the behavior's own clamp:
 *
 * - on an axis where the drawn graph fits the viewport, the focused node's
 *   centre goes to the canvas centre exactly and the margin left at the
 *   graph's edge is permitted, so no recorded pan limit is applied to the
 *   expectation there;
 * - on an axis where the drawn graph overflows the viewport, the expectation
 *   is the centred pan clamped into the pan limits the behavior records
 *   (yymrxqsk), passed in by the caller because those limits are read back by
 *   panning the surface and reading the limits would otherwise move it.
 *
 * The node's centre comes from the box the surface draws it in and the centre
 * of the canvas from the canvas itself, so nothing here restates a coordinate
 * the behavior chose.
 */
function recentreExpectation(page: Page, id: string, limits?: PanLimits): RecentreExpectation {
	const scale = page.controller.viewport().scale;
	const frame = frameOf(page);
	const box = boxOf(page, id);
	const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
	const centred = {
		x: frame.width / 2 - centre.x * scale,
		y: frame.height / 2 - centre.y * scale,
	};
	const fit = fits(frame, scale);
	if ((!fit.x || !fit.y) && limits === undefined) {
		throw new Error(
			`the recentre expectation for ${id} needs the pan limits the behavior records (yymrxqsk)`,
		);
	}

	let x = centred.x;
	let y = centred.y;
	if (!fit.x && limits !== undefined) {
		x = Math.min(Math.max(centred.x, limits.minX), limits.maxX);
	}
	if (!fit.y && limits !== undefined) {
		y = Math.min(Math.max(centred.y, limits.minY), limits.maxY);
	}

	return {
		scale,
		centre,
		centred,
		fits: fit,
		x,
		y,
		held: { x: !fit.x && Math.abs(x - centred.x) > 1e-9, y: !fit.y && Math.abs(y - centred.y) > 1e-9 },
	};
}

/** Whether a pan passed the recorded limits of an axis on its way to the centre. */
function pastLimits(value: number, limits: { min: number; max: number }): boolean {
	return value < limits.min - 1e-9 || value > limits.max + 1e-9;
}

/**
 * The surface transform a pan to `viewport` writes. Every viewport change goes
 * through the one transform path (mntwwzyl), so a recentre that is a viewport
 * move leaves the transform a pan to the same place leaves — observed from a
 * second surface at the same zoom rather than restated as a transform string.
 */
function transformOfPan(source: NodeRecord[], viewport: Viewport): string {
	const reference = setup(source);
	reference.controller.zoomAboutCentre(viewport.scale);
	const at = reference.controller.viewport();
	reference.controller.panBy(viewport.x - at.x, viewport.y - at.y);
	return reference.surface.style.transform;
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

describe("a focus recentres the viewport, a click does not (wzsxvmvw)", () => {
	/** The panel sizes a fitted graph is observed at. */
	const fittedSizes: readonly (readonly [number, number])[] = [
		[800, 600],
		[640, 900],
		[1400, 900],
	];

	test("a focus on a fitted graph centres the node on both axes, margin and all", async () => {
		for (const [width, height] of fittedSizes) {
			const page = setup(gridRecords());
			page.resize(width, height);
			page.controller.fitGraph();
			await flushFrame();

			const scale = page.controller.viewport().scale;
			const frame = frameOf(page);
			// The graph the viewer frames fits the viewport on both axes, so both
			// axes of the rule are the fitted one in this case.
			expect(fits(frame, scale), `the fitted graph at ${width}x${height}`).toEqual({ x: true, y: true });

			// A pan is held inside the recorded limits at this zoom, while
			// centring some node asks for a view past them: the margin the fitted
			// axis of the rule permits is exactly what a pan is not allowed to
			// take, so the case cannot pass on a clamp.
			const limits = panLimits(page);
			expect(
				page.order.ids.some((id) => {
					const wanted = recentreExpectation(page, id).centred;
					return (
						pastLimits(wanted.x, { min: limits.minX, max: limits.maxX }) ||
						pastLimits(wanted.y, { min: limits.minY, max: limits.maxY })
					);
				}),
				`a centring move at ${width}x${height} that a pan would be held back from`,
			).toBe(true);

			const ids = page.order.ids;
			for (const [index, id] of ids.entries()) {
				document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
				await flushFrame();
				expect(page.controller.focused(), `focus after ${index + 1} Tab press(es)`).toBe(id);

				const expectation = recentreExpectation(page, id);
				const viewport = page.controller.viewport();
				// wzsxvmvw: on each axis the graph fits, the focused node's centre
				// comes to the centre of the canvas ...
				expect(
					viewport.x + expectation.centre.x * viewport.scale,
					`the node's centre across at ${width}x${height}, focusing ${id}`,
				).toBeCloseTo(frame.width / 2, 6);
				expect(
					viewport.y + expectation.centre.y * viewport.scale,
					`the node's centre down at ${width}x${height}, focusing ${id}`,
				).toBeCloseTo(frame.height / 2, 6);
				// ... which is the pan centring asks for, with the margin left at
				// the graph's edge, ...
				expect(viewport.x, `pan x at ${width}x${height}, focusing ${id}`).toBeCloseTo(
					expectation.centred.x,
					6,
				);
				expect(viewport.y, `pan y at ${width}x${height}, focusing ${id}`).toBeCloseTo(
					expectation.centred.y,
					6,
				);
				// ... and the move is not a zoom.
				expect(viewport.scale, `zoom after focusing ${id}`).toBe(scale);
			}
		}
	});

	test("a focus on a graph zoomed out until it fits centres the node on both axes", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(0.8);
		await flushFrame();

		const frame = frameOf(page);
		const scale = page.controller.viewport().scale;
		expect(fits(frame, scale), "the zoomed-out graph fits the viewport on both axes").toEqual({
			x: true,
			y: true,
		});
		const limits = panLimits(page);

		for (const id of page.order.ids) {
			const expectation = recentreExpectation(page, id);
			page.controller.focusNode(id);
			await flushFrame();

			const viewport = page.controller.viewport();
			// wzsxvmvw: a graph small enough to fit is centred on the node focus
			// lands on, on both axes, however far past where a pan would stop
			// the centre sits.
			expect(
				viewport.x + expectation.centre.x * viewport.scale,
				`the node's centre across after focusing ${id}`,
			).toBeCloseTo(frame.width / 2, 6);
			expect(
				viewport.y + expectation.centre.y * viewport.scale,
				`the node's centre down after focusing ${id}`,
			).toBeCloseTo(frame.height / 2, 6);
			expect(viewport.x, `pan x after focusing ${id}`).toBeCloseTo(expectation.centred.x, 6);
			expect(viewport.y, `pan y after focusing ${id}`).toBeCloseTo(expectation.centred.y, 6);
			expect(viewport.scale, `zoom after focusing ${id}`).toBe(scale);
		}

		// The centring asked for a view a pan is held back from, so the fitted
		// axis of the rule is what these moves used.
		expect(
			page.order.ids.some((id) => {
				const wanted = recentreExpectation(page, id).centred;
				return (
					pastLimits(wanted.x, { min: limits.minX, max: limits.maxX }) ||
					pastLimits(wanted.y, { min: limits.minY, max: limits.maxY })
				);
			}),
			"a centring move the recorded pan limits would have held back",
		).toBe(true);
	});

	test("a traversal focus move centres the viewport on the node it lands on", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		const scale = page.controller.viewport().scale;
		const limits = panLimits(page);
		const ids = page.order.ids;

		// At this zoom the graph overflows the viewport on both axes, so the
		// recorded pan limits bind both axes of every move.
		expect(fits(frameOf(page), scale), "the graph overflows both axes at this zoom").toEqual({
			x: false,
			y: false,
		});

		// One step past the last node, so the wrap is a focus move too
		// (ruqsmuxz, rwonulnq).
		for (let step = 1; step <= ids.length + 1; step++) {
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
			await flushFrame();

			const focused = page.controller.focused();
			expect(focused, `focus after ${step} Tab press(es)`).toBe(ids[(step - 1) % ids.length]);
			if (focused === null) {
				throw new Error(`no node is focused after ${step} Tab press(es)`);
			}

			// wzsxvmvw: the node the traversal landed on is brought to the
			// centre of the viewport as far as the pan limits allow on each axis,
			// and the focus move is not a zoom.
			const target = recentreExpectation(page, focused, limits);
			const viewport = page.controller.viewport();
			expect(viewport.x, `pan x after focusing ${focused}`).toBeCloseTo(target.x, 6);
			expect(viewport.y, `pan y after focusing ${focused}`).toBeCloseTo(target.y, 6);
			expect(viewport.scale, `zoom after focusing ${focused}`).toBe(scale);
		}
	});

	test("a focus move by the interaction's own means centres the node too, at the zoom in hand", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		const scale = page.controller.viewport().scale;
		const limits = panLimits(page);
		const centreable = page.order.ids.find((id) => {
			const held = recentreExpectation(page, id, limits).held;
			return !held.x && !held.y;
		});
		expect(centreable, "a node the pan limits leave centreable at this zoom").toBeDefined();
		if (centreable === undefined) {
			return;
		}

		page.controller.focusNode(centreable);
		await flushFrame();

		const target = recentreExpectation(page, centreable, limits);
		const viewport = page.controller.viewport();
		const box = boxOf(page, centreable);
		// wzsxvmvw: the node's centre is at the centre of the viewport ...
		expect(viewport.x + (box.x + box.width / 2) * viewport.scale, "the node's centre across").toBeCloseTo(
			page.canvas.clientWidth / 2,
			6,
		);
		expect(viewport.y + (box.y + box.height / 2) * viewport.scale, "the node's centre down").toBeCloseTo(
			page.canvas.clientHeight / 2,
			6,
		);
		// ... and the move translated the view without rescaling it.
		expect(target.held, "the centred view of this node is inside the pan limits").toEqual({
			x: false,
			y: false,
		});
		expect(viewport.x).toBeCloseTo(target.centred.x, 6);
		expect(viewport.y).toBeCloseTo(target.centred.y, 6);
		expect(viewport.scale, "the zoom level").toBe(scale);
	});

	test("a backward traversal move recentres the node it lands on", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		const limits = panLimits(page);
		const ids = page.order.ids;

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
		await flushFrame();
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
		await flushFrame();
		// rwonulnq: Shift and Tab walks the order back, and the focus it lands
		// on is brought to the centre like any other focus move (wzsxvmvw).
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
		await flushFrame();

		expect(page.controller.focused()).toBe(ids[0]);
		const target = recentreExpectation(page, ids[0], limits);
		const viewport = page.controller.viewport();
		expect(viewport.x, "pan x after the backward move").toBeCloseTo(target.x, 6);
		expect(viewport.y, "pan y after the backward move").toBeCloseTo(target.y, 6);
	});

	test("on a graph that overflows one axis the recorded limit binds there and the other axis centres", async () => {
		const page = setup(gridRecords());
		const before = page.controller.viewport();
		const limits = panLimits(page);
		const frame = frameOf(page);
		const scale = before.scale;

		// From the pan and zoom the viewer starts at the graph overflows the
		// viewport across and fits it down, so both axes of the rule are in play
		// at once.
		expect(fits(frame, scale), "which axes of the graph overflow the viewport").toEqual({
			x: false,
			y: true,
		});

		// A node whose recentre is a no-op on the overflowing axis — the
		// recorded limit holds the view exactly where the pan already is — and
		// whose centring on the fitted axis asks for a view past the recorded
		// limits there.
		const picked = page.order.ids
			.map((id) => ({ id, expectation: recentreExpectation(page, id, limits) }))
			.find(
				({ expectation }) =>
					Math.abs(expectation.x - before.x) < 1e-9 &&
					pastLimits(expectation.centred.y, { min: limits.minY, max: limits.maxY }) &&
					Math.abs(expectation.y - before.y) > 1e-6,
			);
		expect(picked, "a node whose recentre holds one axis and centres the other").toBeDefined();
		if (picked === undefined) {
			return;
		}
		const { id, expectation } = picked;

		page.controller.focusNode(id);
		await flushFrame();
		const viewport = page.controller.viewport();

		// wzsxvmvw, yymrxqsk: on the axis the graph overflows, the graph keeps
		// covering the viewport and the recorded pan limit binds. The view does
		// not leave where the pan holds it, it comes to rest on the recorded
		// limit, and the node is not brought to the centre there. That accepted
		// limit is what this check records.
		expect(viewport.x, `pan x after focusing ${id}`).toBeCloseTo(before.x, 9);
		expect(
			[limits.minX, limits.maxX].some((limit) => Math.abs(viewport.x - limit) < 1e-6),
			"the view came to rest on a recorded pan limit across",
		).toBe(true);
		expect(
			viewport.x + expectation.centre.x * viewport.scale,
			`the node's centre across after focusing ${id}`,
		).not.toBeCloseTo(frame.width / 2, 6);
		expect(
			viewport.x + frame.bounds.x * viewport.scale,
			"the graph's left edge after the move",
		).toBeLessThanOrEqual(1e-6);
		expect(
			viewport.x + (frame.bounds.x + frame.bounds.width) * viewport.scale,
			"the graph's right edge after the move",
		).toBeGreaterThanOrEqual(frame.width - 1e-6);

		// wzsxvmvw: on the axis the graph fits, the node's centre is brought to
		// the centre of the canvas exactly — with the margin that leaves at the
		// graph's edge, past where the recorded limits would have held a pan —
		// and the move is not a zoom.
		expect(
			pastLimits(expectation.centred.y, { min: limits.minY, max: limits.maxY }),
			"the centring asked for a view past the recorded limits on the fitted axis",
		).toBe(true);
		expect(
			viewport.y + expectation.centre.y * viewport.scale,
			`the node's centre down after focusing ${id}`,
		).toBeCloseTo(frame.height / 2, 6);
		expect(viewport.y, `pan y after focusing ${id}`).toBeCloseTo(expectation.centred.y, 6);
		expect(viewport.scale, "the zoom level").toBe(scale);
	});

	test("a pan on an axis the graph fits is held where the viewer records its limits", async () => {
		for (const [width, height] of fittedSizes) {
			const page = setup(gridRecords());
			page.resize(width, height);
			page.controller.fitGraph();
			await flushFrame();

			const scale = page.controller.viewport().scale;
			const frame = frameOf(page);
			expect(fits(frame, scale), `the fitted graph at ${width}x${height}`).toEqual({ x: true, y: true });
			const range = panRange(frame, scale);

			// A pan far to one side. yymrxqsk, wzsxvmvw: the pan comes to rest
			// where the viewer records its limits, which on an axis the graph fits
			// leaves the graph inside the viewport with its near edge on the
			// canvas's near edge — the place the layout and the canvas put it, not
			// one read back from the behaviour.
			page.controller.panBy(-1e6, -1e6);
			const low = page.controller.viewport();
			expect(low.x, `pan x at the low extreme at ${width}x${height}`).toBeCloseTo(range.x.min, 6);
			expect(low.y, `pan y at the low extreme at ${width}x${height}`).toBeCloseTo(range.y.min, 6);
			expect(
				low.x + frame.bounds.x * scale,
				`the graph's left edge at the low extreme at ${width}x${height}`,
			).toBeCloseTo(0, 6);
			expect(
				low.y + frame.bounds.y * scale,
				`the graph's top edge at the low extreme at ${width}x${height}`,
			).toBeCloseTo(0, 6);

			// A pan far to the other side: the far edge on the canvas's far edge.
			page.controller.panBy(1e6, 1e6);
			const high = page.controller.viewport();
			expect(high.x, `pan x at the high extreme at ${width}x${height}`).toBeCloseTo(range.x.max, 6);
			expect(high.y, `pan y at the high extreme at ${width}x${height}`).toBeCloseTo(range.y.max, 6);
			expect(
				high.x + (frame.bounds.x + frame.bounds.width) * scale,
				`the graph's right edge at the high extreme at ${width}x${height}`,
			).toBeCloseTo(frame.width, 6);
			expect(
				high.y + (frame.bounds.y + frame.bounds.height) * scale,
				`the graph's bottom edge at the high extreme at ${width}x${height}`,
			).toBeCloseTo(frame.height, 6);

			// Panning is not a zoom.
			expect(high.scale, `the zoom after panning at ${width}x${height}`).toBe(scale);
		}
	});

	test("a pan on a graph that overflows one axis keeps the limits on both axes", async () => {
		const page = setup(gridRecords());
		const scale = page.controller.viewport().scale;
		const frame = frameOf(page);

		// The pan and zoom the viewer starts from: across the graph overflows
		// the viewport and down it fits, so the two readings of the recorded
		// limits are driven side by side.
		expect(fits(frame, scale), "which axes of the graph overflow the viewport").toEqual({ x: false, y: true });
		const range = panRange(frame, scale);

		page.controller.panBy(-1e6, -1e6);
		const low = page.controller.viewport();
		// yymrxqsk: on the axis the graph overflows the viewport stays covered —
		// the graph's far edge comes to the canvas's far edge — and on the axis
		// it fits the graph stays inside it.
		expect(low.x, "pan x at the low extreme, on the overflowing axis").toBeCloseTo(range.x.min, 6);
		expect(
			low.x + (frame.bounds.x + frame.bounds.width) * scale,
			"the graph's right edge at the low extreme",
		).toBeCloseTo(frame.width, 6);
		expect(low.y, "pan y at the low extreme, on the fitted axis").toBeCloseTo(range.y.min, 6);
		expect(low.y + frame.bounds.y * scale, "the graph's top edge at the low extreme").toBeCloseTo(0, 6);

		page.controller.panBy(1e6, 1e6);
		const high = page.controller.viewport();
		expect(high.x, "pan x at the high extreme, on the overflowing axis").toBeCloseTo(range.x.max, 6);
		expect(high.x + frame.bounds.x * scale, "the graph's left edge at the high extreme").toBeCloseTo(0, 6);
		expect(high.y, "pan y at the high extreme, on the fitted axis").toBeCloseTo(range.y.max, 6);
		expect(
			high.y + (frame.bounds.y + frame.bounds.height) * scale,
			"the graph's bottom edge at the high extreme",
		).toBeCloseTo(frame.height, 6);
		expect(page.controller.viewport().scale, "the zoom after panning").toBe(scale);
	});

	test("an axis the graph fills exactly is an axis it fits, for the pan and for the recentre", async () => {
		const page = setup(gridRecords());
		// The panel is resized so the graph's drawn width is exactly the canvas's
		// own at the zoom the viewer holds: the boundary between an axis the
		// graph fits within and one it overflows.
		page.resize(912, 600);
		await flushFrame();

		const frame = frameOf(page);
		const scale = page.controller.viewport().scale;
		expect(
			frame.bounds.width * scale,
			"the graph's drawn width against the canvas width at this zoom",
		).toBe(frame.width);
		// "Fits within" reaches its own boundary: an axis as wide as the canvas
		// is the fitted one (wzsxvmvw).
		expect(fits(frame, scale), "which axes of the graph fit the viewport").toEqual({ x: true, y: true });

		// The clamp a pan keeps is unmoved at the boundary: an axis the graph
		// fills exactly that is held inside the viewport has one place to be, and
		// a pan far to each side is observed at it (yymrxqsk).
		const range = panRange(frame, scale);
		expect(range.x.min, "the place a pan holds an axis the graph fills exactly").toBeCloseTo(
			range.x.max,
			6,
		);
		page.controller.panBy(-1e6, -1e6);
		expect(
			page.controller.viewport().x,
			"pan x at the low extreme, on the axis the graph fills exactly",
		).toBeCloseTo(range.x.min, 6);
		page.controller.panBy(1e6, 1e6);
		expect(
			page.controller.viewport().x,
			"pan x at the high extreme, on the axis the graph fills exactly",
		).toBeCloseTo(range.x.max, 6);

		// A recentre on that axis is not a pan, and the graph fits there: the
		// focused node's centre comes to the centre of the canvas, which is not
		// where the recorded pan limits hold the view.
		const id = "na0";
		const box = boxOf(page, id);
		const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
		page.controller.focusNode(id);
		await flushFrame();

		const viewport = page.controller.viewport();
		expect(
			viewport.x + centre.x * viewport.scale,
			`the node's centre across after focusing ${id}`,
		).toBeCloseTo(frame.width / 2, 6);
		expect(viewport.x, `pan x after focusing ${id}`).toBeCloseTo(
			frame.width / 2 - centre.x * viewport.scale,
			6,
		);
		expect(
			viewport.x,
			"the view is not held at the one place a pan can hold it here",
		).not.toBeCloseTo(range.x.max, 6);
		expect(viewport.scale, "the zoom level").toBe(scale);
	});

	test("a pointer click on a node leaves the viewport where it is", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		page.controller.focusNode(page.order.ids[0]);
		await flushFrame();
		const focused = page.controller.focused();
		const elsewhere = page.order.ids.find((id) => id !== focused);
		expect(elsewhere, "another node to click").toBeDefined();
		if (elsewhere === undefined) {
			return;
		}
		const before = page.controller.viewport();

		// The click on the focused node itself (ltrnmrsr).
		page.press(page.box(focused ?? page.order.ids[0]), { x: 20, y: 20 });
		await flushFrame();
		expect(page.controller.viewport(), "the viewport after clicking the focused node").toEqual(before);

		// And the click on a node focus is not on.
		page.press(page.box(elsewhere), { x: 20, y: 20 });
		await flushFrame();
		// ltrnmrsr: the click still selects the node it was made on ...
		expect(page.controller.selected()).toBe(elsewhere);
		// ... and wzsxvmvw: clicking a node with the pointer moves nothing.
		expect(page.controller.viewport(), "the viewport after clicking another node").toEqual(before);
	});

	test("a change of the panel's own focus moves nothing", async () => {
		const page = setup(gridRecords());
		page.controller.focusNode(page.order.ids[0]);
		await flushFrame();
		const before = page.controller.viewport();

		// pltovtuo: the panel takes the focus itself, which is not focus
		// arriving at a node.
		page.canvas.tabIndex = -1;
		page.canvas.focus();
		page.canvas.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
		await flushFrame();

		expect(page.controller.viewport(), "the viewport after the panel takes focus").toEqual(before);
	});

	test("a focus that ends with no node focused moves nothing", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		page.controller.focusNode(page.order.ids[1]);
		await flushFrame();
		const focused = page.controller.focused();
		expect(focused, "the node focus is on before the reload").not.toBeNull();
		const before = page.controller.viewport();

		// A reload re-reads the documents without the focused node, so the
		// focus ends with nothing focused (wzsxvmvw, pltovtuo).
		page.reload(gridRecords().filter((record) => record.id !== focused));
		await flushFrame();

		expect(page.controller.focused(), "focus after the reload").toBeNull();
		expect(page.controller.viewport(), "the viewport after the focus ends").toEqual(before);
	});

	test("a recentre writes only the surface transform and re-emphasises nothing", async () => {
		const page = setup(gridRecords());
		page.controller.zoomAboutCentre(2);
		// A selection dims and brightens the drawn elements (ksywwktl,
		// zkwypuor), so the viewport change runs with emphasis in place
		// (mntwwzyl).
		const selected = page.order.ids[0];
		page.controller.select(selected);
		await flushFrame();
		const limits = panLimits(page);
		const next = page.order.ids[1];
		const target = recentreExpectation(page, next, limits);

		// Everything the check itself reads is resolved before the window
		// opens, so only what the behavior asks for is recorded.
		const boxes = page.order.ids.map((id) => page.box(id));
		const placed = boxes.map((element) => `${element.style.left},${element.style.top}`);
		const focusedBox = page.box(next);

		const queries = await during(page, () => page.controller.focusNode(next));
		const viewport = page.controller.viewport();

		// The viewport did move, so what follows is about a recentre and not
		// about a change that did nothing (wzsxvmvw).
		expect(viewport.x, "pan x after the recentre").toBeCloseTo(target.x, 6);
		expect(viewport.y, "pan y after the recentre").toBeCloseTo(target.y, 6);

		// stppxysx: a recentre reads no part of the surface — the elements are
		// known by the identity the change carries, not looked up.
		expect(queries, "surface lookups for a recentre").toEqual([]);
		// stppxysx, mntwwzyl: no drawn element is re-classed but the one the
		// focus emphasis moves to.
		expect(page.writtenOutside([focusedBox]), "elements written by a recentre").toEqual([]);
		// ozxnxzus: the focus emphasis is shown on the node focus moved to.
		expect(focusedBox.classList.contains(EmphasisClasses.focus)).toBe(true);
		// mntwwzyl: no drawn box is moved or re-placed by the viewport change.
		expect(boxes.map((element) => `${element.style.left},${element.style.top}`), "where the boxes are drawn").toEqual(
			placed,
		);
		// ltrnmrsr: the selection a click made is untouched, and nothing is
		// reported again.
		expect(page.controller.selected()).toBe(selected);
		expect(page.calls.selection, "the selections reported").toEqual([selected]);
		// mntwwzyl: the view moved through the one transform path, the one a
		// pan to the same viewport writes.
		expect(page.surface.style.transform, "the surface transform after the recentre").toBe(
			transformOfPan(gridRecords(), viewport),
		);
	});
});

