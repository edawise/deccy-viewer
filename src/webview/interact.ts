/**
 * Pointer behaviour of the deccy graph viewer and the interaction state
 * shared with keyboard.ts (noplrntp): every pointer behaviour and the visual
 * states it drives (rtmqlnwm).
 *
 * What this module does:
 *
 * - hovering a node highlights the edges and nodes associated with it
 *   (kwovtsuv): its incident edges and its adjacent nodes (moklnvms), and
 *   shows the node's rationale in a tooltip (zrxnpzkq) on the tooltip surface
 *   (pztszkqs);
 * - clicking a node selects it and reports the selection (ltrnmrsr), clicking
 *   empty canvas without dragging clears it (oumoznwq), and double-clicking a
 *   node opens `nodes/<id>.json` in the editor (trxzsqpv) for the node the
 *   gesture was pressed on (rtmqlnwm);
 * - while a node is selected it is highlighted together with its direct
 *   dependencies, dependents and evaluations while everything unrelated dims
 *   (zkwypuor) to 0.3 weight against the surface (ksywwktl) behind an accent
 *   border and outline (ortyupqp, qqmrtwor), expressed through passive
 *   resolved colours in interact.css so viewport pan and zoom add no
 *   per-dimmed-element or per-brightened-element compositing, paint, layout,
 *   style-recalculation or traversal work (mntwwzyl); while nothing is
 *   selected nothing is dimmed (uxuvwurl);
 * - dragging a node moves it and re-routes its edges (spllzqlw), dragging the
 *   canvas pans the graph (srsnqppq), scrolling or pinching over the canvas
 *   zooms about the pointer (kyokxuml), and every operation is clamped at the
 *   viewport limits (yymrxqsk);
 * - while a node is dragged or the canvas is panned, hover tooltips are
 *   suppressed (uswruqlq) and the dragged node is lifted with no tooltip
 *   (xslqyywt);
 * - "fit graph" resets pan and zoom to frame all nodes (lntrymms) and a
 *   resized panel reflows the viewport (yxqqozvt).
 *
 * Nothing is drawn here. The renderer (rtlotqvy) draws and this module drives
 * it through the {@link InteractionDelegate}: `relayout` re-lays out and
 * re-draws the graph with the dragged positions overriding the arrangement
 * (spllzqlw, zqwxlzxm, layout.ts), `onSelectionChanged` reports the selection
 * so the detail region can show the node's kind, content and rationale
 * (ltrnmrsr), and `openNodeDocument` reaches the editor (trxzsqpv). The frame
 * every viewport number here is worked out in is the one the surface draws
 * (rtlotqvy): the renderer draws the graph at the layout's bounds origin
 * subtracted, so the canvas is mapped to the layout through that origin —
 * centring, the pan and zoom limits, fit and the pointer's place all read the
 * drawn graph.
 *
 * The renderer draws the elements this module drives, under the page interface
 * (ympqvvwr): the views of {@link InteractionView}, the identity of
 * {@link edgeKey}, and the classes of {@link EmphasisClasses}.
 *
 * Every state change is applied incrementally (stppxysx). The drawn elements
 * are learned once per graph revision — one query of the surface with the
 * identity the page interface gives them (ympqvvwr) at attach and again only
 * when the graph is swapped - and every later change looks its elements up by
 * the node id or edge key it carries instead of asking the surface. A
 * selection or hover derives the emphasised sets from the model's incidence
 * index (msvoysvz) and writes only the elements entering or leaving them; a
 * drag records its positions and applies them in one pass per animation frame,
 * the last position of a node winning. A lookup that misses ends that change
 * rather than falling back to a scan.
 */

import type { Point } from "../graph/layout";
import { neighbourhood } from "../graph/model";
import type { GraphNode } from "../graph/model";
import { EDGE_KEY_ATTR, EmphasisClasses, NODE_ID_ATTR, edgeKey } from "./contract";
import type {
	InteractionController,
	InteractionDelegate,
	InteractionGraph,
	InteractionView,
	Viewport,
} from "./contract";

/**
 * Movement in canvas pixels before a press becomes a drag; anything less is a
 * click (oumoznwq, spllzqlw). The specs fix no threshold.
 */
export const DRAG_THRESHOLD = 3;

/**
 * Zoom limits of the viewport (yymrxqsk). The specs fix no limits; the lower
 * one is small enough that "fit graph" can still frame every node of a large
 * graph (lntrymms).
 */
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 4;

/** Padding left between the graph and the viewport edge when fitting (lntrymms). */
export const FIT_PADDING = 24;

/** Exponential wheel zoom speed: scale factor per pixel of wheel travel (kyokxuml). */
export const WHEEL_ZOOM_SPEED = 0.002;

/** Distance from the pointer at which the tooltip appears (zrxnpzkq). */
export const TOOLTIP_OFFSET = 16;

/**
 * The views, the delegate, the interaction state, the emphasis vocabulary and
 * the edge key live in the page interface (ympqvvwr, contract.ts); this module
 * implements the pointer half of them.
 */

/** A press that has not yet turned into a drag (the click/drag distinction). */
type Press =
	| { kind: "node"; id: string; pointerId: number; start: Point }
	| { kind: "background"; pointerId: number; start: Point; onEdge: boolean };

/**
 * The subject a pointer gesture was pressed on, kept for the whole gesture
 * (rtmqlnwm): the node under the press, or `null` when the press was on an
 * edge or on empty canvas, which are subjects of their own. After the press
 * the browser addresses the gesture's later events wherever it sends the
 * gesture's remaining events — the canvas, once capture is set at the press —
 * so the subject cannot be resolved from an event target afterwards, the
 * compatibility double click a repeated press produces included.
 */
type GestureSubject = { nodeId: string | null };

/** A node being dragged across the canvas (spllzqlw). */
interface NodeDrag {
	pointerId: number;
	id: string;
	/** Pointer position minus the top-left corner of the box, in graph pixels. */
	offset: Point;
}

/** The canvas being dragged to pan (srsnqppq). */
interface CanvasPan {
	pointerId: number;
	start: Point;
	origin: Point;
}

/** The two-finger pinch in progress (kyokxuml). */
interface Pinch {
	distance: number;
	midpoint: Point;
}

/**
 * The drawn elements of one graph revision, keyed by the identity the page
 * interface gives them (ympqvvwr, stppxysx): one element per node id and the
 * elements of each edge key, since one edge may be drawn as several parts.
 */
interface DrawnElements {
	nodes: Map<string, Element>;
	edges: Map<string, Element[]>;
}

/**
 * What the emphasis currently writes, so the next application touches only the
 * elements whose class membership changes (stppxysx). Every set names elements
 * by the identity a change carries, never by a query of the surface.
 */
interface Emphasis {
	selected: Set<string>;
	relatedNodes: Set<string>;
	dimmedNodes: Set<string>;
	hoverNodes: Set<string>;
	focused: Set<string>;
	dragging: Set<string>;
	relatedEdges: Set<string>;
	dimmedEdges: Set<string>;
	hoverEdges: Set<string>;
}

function emptyEmphasis(): Emphasis {
	return {
		selected: new Set(),
		relatedNodes: new Set(),
		dimmedNodes: new Set(),
		hoverNodes: new Set(),
		focused: new Set(),
		dragging: new Set(),
		relatedEdges: new Set(),
		dimmedEdges: new Set(),
		hoverEdges: new Set(),
	};
}

/**
 * Attach the pointer behaviours to the drawn graph and return the interaction
 * state keyboard.ts binds to. One layout pass runs here so the state knows the
 * geometry it pans, zooms and clamps against (yymrxqsk, lntrymms).
 */
export function attachInteractions(
	view: InteractionView,
	delegate: InteractionDelegate,
	graph: InteractionGraph,
): InteractionController {
	let model = graph.model;
	let order = graph.order;

	/** The positions the user has put nodes in, overriding the arrangement (spllzqlw). */
	const dragged = new Map<string, Point>();
	let layout = delegate.relayout(dragged);

	/**
	 * The elements of the graph revision in hand, learned once here and rebuilt
	 * only when the graph is swapped (stppxysx).
	 */
	let elements: DrawnElements = { nodes: new Map(), edges: new Map() };
	/** What the last application wrote, so the next one writes only the difference (stppxysx). */
	let emphasized: Emphasis = emptyEmphasis();
	/**
	 * The positions recorded since the last frame, and the frame that will
	 * apply them (stppxysx). A drag may record several moves inside one frame;
	 * only the last position of each node is applied.
	 */
	const pending = new Map<string, Point>();
	let frame: { handle: number; raf: boolean } | null = null;

	// The graph's boxes and routes exist after the first layout pass, so the
	// map is built here; a later re-layout keeps every element's identity.
	rebuildElements();

	const viewport: Viewport = { x: 0, y: 0, scale: 1 };
	let selection: string | null = null;
	let focusId: string | null = null;
	let hoverId: string | null = null;
	let hoverEdge: string | null = null;

	let press: Press | null = null;
	/** The subject of the gesture under way, fixed at its press (rtmqlnwm). */
	let gesture: GestureSubject | null = null;
	let drag: NodeDrag | null = null;
	let pan: CanvasPan | null = null;
	let pinch: Pinch | null = null;
	/** Every pointer currently on the canvas, in client pixels (for pinching). */
	const pointers = new Map<number, Point>();

	let size = canvasSize();

	const tooltip = createTooltip(view);
	let disposed = false;

	view.surface.style.transformOrigin = "0 0";
	applyViewport();

	// --- emphasis -----------------------------------------------------------

	/**
	 * Learn the drawn elements of the graph revision in hand (stppxysx): one
	 * query of the surface, at attach and again only when the graph is swapped
	 * ({@link setGraph}). A re-layout keeps every element's identity, so the
	 * map stays valid and no change ever has to ask the surface for elements.
	 */
	function rebuildElements(): void {
		for (const element of elements.nodes.values()) {
			clearEmphasis(element);
		}
		for (const drawn of elements.edges.values()) {
			for (const element of drawn) {
				clearEmphasis(element);
			}
		}

		const nodes = new Map<string, Element>();
		const edges = new Map<string, Element[]>();
		for (const element of view.surface.querySelectorAll(`[${NODE_ID_ATTR}]`)) {
			const id = element.getAttribute(NODE_ID_ATTR);
			if (id !== null) {
				nodes.set(id, element);
			}
		}
		for (const element of view.surface.querySelectorAll(`[${EDGE_KEY_ATTR}]`)) {
			if (element.classList.contains("edge__hit")) {
				continue;
			}
			const key = element.getAttribute(EDGE_KEY_ATTR);
			if (key === null) {
				continue;
			}
			const drawn = edges.get(key);
			if (drawn === undefined) {
				edges.set(key, [element]);
			} else {
				drawn.push(element);
			}
		}

		elements = { nodes, edges };
		emphasized = emptyEmphasis();
	}

	/**
	 * Derive the emphasised sets from the selection, the hover, the focus and
	 * the drag (uxuvwurl, zkwypuor, kwovtsuv, ozxnxzus, xslqyywt), then write
	 * only the elements entering or leaving them (stppxysx). The sets come from
	 * the model's incidence index (msvoysvz), so no change scans the edge set or
	 * the surface; the selection is highlighted with its direct dependencies,
	 * dependents and evaluations and everything else dims (ksywwktl), and the
	 * pointer highlights the neighbourhood it is over (moklnvms).
	 */
	function refreshEmphasis(): void {
		const next = emptyEmphasis();

		if (selection !== null) {
			next.selected.add(selection);
			const related = neighbourhood(model, selection);
			for (const id of related.nodes) {
				next.relatedNodes.add(id);
			}
			for (const edge of related.edges) {
				next.relatedEdges.add(edgeKey(edge));
			}
			// Everything drawn that the selection does not relate dims
			// (ksywwktl); with nothing selected nothing dims (uxuvwurl).
			for (const id of elements.nodes.keys()) {
				if (id !== selection && !next.relatedNodes.has(id)) {
					next.dimmedNodes.add(id);
				}
			}
			for (const key of elements.edges.keys()) {
				if (!next.relatedEdges.has(key)) {
					next.dimmedEdges.add(key);
				}
			}
		}

		if (hoverId !== null) {
			const near = neighbourhood(model, hoverId);
			for (const id of near.nodes) {
				next.hoverNodes.add(id);
			}
			for (const edge of near.edges) {
				next.hoverEdges.add(edgeKey(edge));
			}
		}
		if (hoverEdge !== null) {
			next.hoverEdges.add(hoverEdge);
		}

		if (focusId !== null) {
			next.focused.add(focusId);
		}
		if (drag !== null) {
			next.dragging.add(drag.id);
		}

		writeNodes(emphasized.selected, next.selected, EmphasisClasses.selected);
		writeNodes(emphasized.relatedNodes, next.relatedNodes, EmphasisClasses.related);
		writeNodes(emphasized.dimmedNodes, next.dimmedNodes, EmphasisClasses.dimmed);
		writeNodes(emphasized.hoverNodes, next.hoverNodes, EmphasisClasses.hoverNeighbour);
		writeNodes(emphasized.focused, next.focused, EmphasisClasses.focus);
		writeNodes(emphasized.dragging, next.dragging, EmphasisClasses.dragging);
		writeEdges(emphasized.relatedEdges, next.relatedEdges, EmphasisClasses.related);
		writeEdges(emphasized.dimmedEdges, next.dimmedEdges, EmphasisClasses.dimmed);
		writeEdges(emphasized.hoverEdges, next.hoverEdges, EmphasisClasses.hoverNeighbour);

		emphasized = next;
	}

	/**
	 * Write one class to the nodes that entered or left `previous` (stppxysx).
	 * A lookup that misses ends that part of the change; it never falls back to
	 * scanning the surface.
	 */
	function writeNodes(previous: ReadonlySet<string>, next: ReadonlySet<string>, name: string): void {
		for (const id of previous) {
			if (next.has(id)) {
				continue;
			}
			const element = elements.nodes.get(id);
			if (element !== undefined) {
				toggle(element, name, false);
			}
		}
		for (const id of next) {
			if (previous.has(id)) {
				continue;
			}
			const element = elements.nodes.get(id);
			if (element !== undefined) {
				toggle(element, name, true);
			}
		}
	}

	/** Write one class to the edge parts whose key entered or left `previous` (stppxysx). */
	function writeEdges(previous: ReadonlySet<string>, next: ReadonlySet<string>, name: string): void {
		for (const key of previous) {
			if (next.has(key)) {
				continue;
			}
			for (const element of elements.edges.get(key) ?? []) {
				toggle(element, name, false);
			}
		}
		for (const key of next) {
			if (previous.has(key)) {
				continue;
			}
			for (const element of elements.edges.get(key) ?? []) {
				toggle(element, name, true);
			}
		}
	}

	// --- selection and focus -------------------------------------------------

	function select(id: string | null): void {
		const next = id !== null && nodeById(id) !== undefined ? id : null;
		if (next === selection) {
			return;
		}
		selection = next;
		refreshEmphasis();
		delegate.onSelectionChanged(selection);
	}

	function clearSelection(): void {
		select(null);
	}

	function focusNode(id: string | null): void {
		const next = id !== null && nodeById(id) !== undefined ? id : null;
		focusId = next;
		refreshEmphasis();
		if (focusId === null) {
			// Focus has ended with no node focused - a reload whose documents no
			// longer hold the focused node - which is not a focus move onto a
			// node, so the viewport stays where it is (wzsxvmvw).
			return;
		}
		// A focus move onto a node brings that node to the centre of the
		// viewport (wzsxvmvw); every means of moving focus other than a pointer
		// press reaches the node through here, so all of them recentre.
		recentreOn(focusId);
		// The renderer owns the elements (rtlotqvy); make the focused one able
		// to take real DOM focus so the browser follows the traversal. The
		// element is looked up by the map built with the graph revision
		// (stppxysx), not by asking the surface.
		const element = elements.nodes.get(focusId);
		if (element instanceof HTMLElement) {
			element.setAttribute("tabindex", "-1");
			element.focus({ preventScroll: true });
		}
	}

	function focusStep(reverse: boolean): void {
		const ids = order.ids;
		if (ids.length === 0) {
			return;
		}
		const index = focusId === null ? -1 : ids.indexOf(focusId);
		// With no focus yet the traversal starts at the first (or last) node of
		// the graph order and wraps at the ends (ruqsmuxz, rwonulnq).
		const next =
			index === -1
				? reverse
					? ids.length - 1
					: 0
				: (index + (reverse ? -1 : 1) + ids.length) % ids.length;
		focusNode(ids[next]);
	}

	// --- viewport -----------------------------------------------------------

	function canvasSize(): { width: number; height: number } {
		return { width: view.canvas.clientWidth, height: view.canvas.clientHeight };
	}

	function clampScale(scale: number): number {
		return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
	}

	/**
	 * Move or scale the viewport by writing only the single surface transform
	 * (mntwwzyl): selection emphasis classes and resolved appearance properties
	 * stay passive on the drawn elements and are neither walked, queried nor
	 * refreshed when the viewport changes.
	 */
	function applyViewport(): void {
		view.surface.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
	}

	/**
	 * Clamp the pan and zoom at the viewport limits (yymrxqsk). The specs fix
	 * no limits, so the drawn graph stays reachable instead: when it fits, it
	 * is never panned out of the viewport, and when it does not, the viewport
	 * is never panned off it. The zoom itself is limited by {@link MIN_SCALE}
	 * and {@link MAX_SCALE}.
	 *
	 * The extent these limits hold is the one the surface draws (rtlotqvy): the
	 * renderer draws the graph at the layout's bounds origin subtracted, so the
	 * drawn graph starts at the surface origin and the pan being clamped is the
	 * pan of the drawn graph, not the pan of the layout's own coordinates.
	 */
	function clampViewport(): void {
		const bounds = layout.bounds;
		if (bounds.width <= 0 || bounds.height <= 0) {
			return;
		}
		const width = bounds.width * viewport.scale;
		const height = bounds.height * viewport.scale;
		const left = viewport.x;
		const top = viewport.y;

		const minLeft = width <= size.width ? 0 : size.width - width;
		const maxLeft = width <= size.width ? size.width - width : 0;
		const minTop = height <= size.height ? 0 : size.height - height;
		const maxTop = height <= size.height ? size.height - height : 0;

		viewport.x += Math.min(Math.max(left, minLeft), maxLeft) - left;
		viewport.y += Math.min(Math.max(top, minTop), maxTop) - top;
	}

	function panBy(dx: number, dy: number): void {
		viewport.x += dx;
		viewport.y += dy;
		clampViewport();
		applyViewport();
	}

	function zoomAt(factor: number, at: Point): void {
		const scale = clampScale(viewport.scale * factor);
		const applied = scale / viewport.scale;
		// Keep the graph point under `at` where it is, so the zoom is about the
		// pointer (kyokxuml) or about the centre (pposortu) rather than about
		// the origin.
		viewport.x = at.x - (at.x - viewport.x) * applied;
		viewport.y = at.y - (at.y - viewport.y) * applied;
		viewport.scale = scale;
		clampViewport();
		applyViewport();
	}

	function zoomAboutCentre(factor: number): void {
		zoomAt(factor, { x: size.width / 2, y: size.height / 2 });
	}

	// --- pending application (stppxysx) --------------------------------------

	/**
	 * Fold the positions recorded since the last frame into the positions the
	 * graph is laid out with (stppxysx). The last recorded position of a node
	 * wins and nothing is dropped.
	 */
	function mergePending(): void {
		for (const [id, position] of pending) {
			dragged.set(id, position);
		}
		pending.clear();
	}

	/**
	 * Apply what is pending in one pass (stppxysx): the delegate lays the graph
	 * out once with every position recorded in the frame, moving the dragged
	 * boxes and re-routing their incident edges (spllzqlw, vvqvvwzk, layout.ts).
	 */
	function applyPending(): void {
		frame = null;
		if (pending.size === 0) {
			return;
		}
		mergePending();
		layout = delegate.relayout(dragged);
	}

	/** Ask for one application in the next frame, unless one is already due (stppxysx). */
	function schedulePending(): void {
		if (frame !== null) {
			return;
		}
		if (typeof requestAnimationFrame === "function") {
			frame = { handle: requestAnimationFrame(applyPending), raf: true };
		} else {
			// A host without animation frames still applies once, in a task.
			frame = { handle: globalThis.setTimeout(applyPending, 0) as unknown as number, raf: false };
		}
	}

	/** Drop an application that has not run (teardown only). */
	function cancelPending(): void {
		if (frame === null) {
			return;
		}
		if (frame.raf && typeof cancelAnimationFrame === "function") {
			cancelAnimationFrame(frame.handle);
		} else {
			globalThis.clearTimeout(frame.handle as unknown as ReturnType<typeof setTimeout>);
		}
		frame = null;
	}

	/**
	 * Hold a centring move at the viewport limits, per axis (wzsxvmvw,
	 * yymrxqsk). On an axis where the drawn graph overflows the viewport the
	 * graph must keep covering it, so the limit a pan is held at binds the
	 * centring move exactly as {@link clampViewport} applies it there; on an
	 * axis where the drawn graph fits, the margin a centring move leaves at the
	 * graph's edge is permitted, so that axis is left where the centring put it
	 * and no limit holds it back. The axes are independent: one can be held
	 * while the other centres. A pan and a zoom keep {@link clampViewport}
	 * unchanged — this relaxation belongs to a centring move alone. The extent
	 * held here is the drawn one, which starts at the surface origin
	 * (rtlotqvy), exactly as {@link clampViewport} reads it.
	 */
	function clampCentring(): void {
		const bounds = layout.bounds;
		if (bounds.width <= 0 || bounds.height <= 0) {
			return;
		}
		const width = bounds.width * viewport.scale;
		const height = bounds.height * viewport.scale;
		const left = viewport.x;
		const top = viewport.y;

		// Only an axis the graph overflows keeps its pan limit; a fitted axis
		// takes the margin instead.
		if (width > size.width) {
			viewport.x += Math.min(Math.max(left, size.width - width), 0) - left;
		}
		if (height > size.height) {
			viewport.y += Math.min(Math.max(top, size.height - height), 0) - top;
		}
	}

	/**
	 * Bring the node focus moved to to the centre of the viewport (wzsxvmvw).
	 *
	 * A recentre is a viewport change of its own: it moves the pan and leaves
	 * the zoom alone, it is applied through the single surface transform
	 * ({@link applyViewport}, mntwwzyl), so it walks, queries and re-classes
	 * nothing of the drawn surface and moves no drawn box, and it is held back
	 * only on the axes the graph overflows ({@link clampCentring}, yymrxqsk):
	 * on an axis the graph fits, the focused node's centre comes to the
	 * centre of the canvas with the margin that leaves at the graph's edge; on
	 * an axis it overflows, the graph keeps covering the viewport and the pan
	 * limit binds. The node's box is the one the layout module gave it
	 * (qmsmvrnr) and the surface draws that box at the layout's bounds origin
	 * subtracted (rtlotqvy), so the centre a centring move brings to the canvas
	 * centre is the centre of the drawn box, not the centre of the layout's
	 * coordinates; the centre of the viewport is the canvas's own size.
	 */
	function recentreOn(id: string): void {
		const box = layout.nodes.get(id);
		if (box === undefined) {
			return;
		}
		const origin = layout.bounds;
		const centre = {
			x: box.x - origin.x + box.width / 2,
			y: box.y - origin.y + box.height / 2,
		};
		viewport.x = size.width / 2 - centre.x * viewport.scale;
		viewport.y = size.height / 2 - centre.y * viewport.scale;
		clampCentring();
		applyViewport();
	}

	/**
	 * Answer the page's request to bring the node `id` names into view
	 * (ympqvvwr) with the centring move a focus arrival on that node performs
	 * (wzsxvmvw): the page asks for the rule's own move, so this is
	 * {@link recentreOn} and not a second centring beside it. The view therefore
	 * comes to rest where a focus on the same node at the same zoom rests, and
	 * the surface takes the single transform a pan to that viewport writes
	 * ({@link applyViewport}, mntwwzyl). A request is not a focus move: it moves
	 * no node focus, writes no emphasis class — the focus emphasis included
	 * (ozxnxzus) — changes no selection and opens no document, so the drawn
	 * elements and their boxes stay exactly as they are.
	 */
	function centreOnNode(id: string): void {
		recentreOn(id);
	}

	function fitGraph(): void {
		mergePending();
		layout = delegate.relayout(dragged);
		const bounds = layout.bounds;
		if (size.width <= 0 || size.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
			viewport.x = 0;
			viewport.y = 0;
			viewport.scale = 1;
			applyViewport();
			return;
		}
		const innerWidth = Math.max(size.width - 2 * FIT_PADDING, 1);
		const innerHeight = Math.max(size.height - 2 * FIT_PADDING, 1);
		viewport.scale = clampScale(Math.min(innerWidth / bounds.width, innerHeight / bounds.height));
		// The surface draws the graph at the layout's bounds origin subtracted
		// (rtlotqvy), so the extent a fit frames and centres is the drawn one:
		// it spans from the surface origin to the layout's bounds size.
		viewport.x = size.width / 2 - (bounds.width / 2) * viewport.scale;
		viewport.y = size.height / 2 - (bounds.height / 2) * viewport.scale;
		clampViewport();
		applyViewport();
	}

	function moveNodeBy(id: string, dx: number, dy: number): void {
		if (nodeById(id) === undefined) {
			return;
		}
		const box = layout.nodes.get(id);
		mergePending();
		const base = dragged.get(id) ?? (box !== undefined ? { x: box.x, y: box.y } : { x: 0, y: 0 });
		dragged.set(id, { x: base.x + dx, y: base.y + dy });
		layout = delegate.relayout(dragged);
	}

	// --- coordinate spaces ---------------------------------------------------

	/** Canvas pixels from client pixels. */
	function toCanvas(client: Point): Point {
		const rect = view.canvas.getBoundingClientRect();
		return { x: client.x - rect.left, y: client.y - rect.top };
	}

	/**
	 * Graph pixels from canvas pixels, undoing the pan and zoom (rtlotqvy). The
	 * surface draws the graph at the layout's bounds origin subtracted, so a
	 * canvas pixel shows the layout point the drawn graph puts there: the
	 * conversion undoes the pan and the zoom and adds that origin back.
	 */
	function toGraph(local: Point): Point {
		const origin = layout.bounds;
		return {
			x: (local.x - viewport.x) / viewport.scale + origin.x,
			y: (local.y - viewport.y) / viewport.scale + origin.y,
		};
	}

	// --- pointer ------------------------------------------------------------

	function onPointerDown(event: PointerEvent): void {
		if (event.button !== 0 || disposed) {
			return;
		}
		const client = { x: event.clientX, y: event.clientY };
		pointers.set(event.pointerId, client);
		view.canvas.setPointerCapture(event.pointerId);

		// A second finger turns the gesture into a pinch (kyokxuml) and
		// supersedes whatever the first finger had not yet committed to. A drag
		// or pan already under way keeps going and ignores the extra finger.
		if (pointers.size === 2) {
			if (drag === null && pan === null) {
				press = null;
				startPinch();
			}
			return;
		}
		if (pointers.size > 2) {
			return;
		}

		// The press fixes the gesture's subject (rtmqlnwm): the node under it, or
		// the edge or empty canvas it landed on. Everything the gesture does
		// afterwards acts on that subject rather than on an event target, which
		// the browser is free to address to the capturing canvas.
		const id = targetNodeId(event.target);
		gesture = { nodeId: id };
		const start = toCanvas(client);
		if (id !== null) {
			press = { kind: "node", id, pointerId: event.pointerId, start };
		} else {
			press = {
				kind: "background",
				pointerId: event.pointerId,
				start,
				onEdge: targetEdgeKey(event.target) !== null,
			};
		}
	}

	function onPointerMove(event: PointerEvent): void {
		if (disposed) {
			return;
		}
		const client = { x: event.clientX, y: event.clientY };
		if (pointers.has(event.pointerId)) {
			pointers.set(event.pointerId, client);
		}

		if (pinch !== null) {
			movePinch();
			return;
		}
		if (drag !== null && event.pointerId === drag.pointerId) {
			moveDrag(toCanvas(client));
			return;
		}
		if (pan !== null && event.pointerId === pan.pointerId) {
			movePan(toCanvas(client));
			return;
		}
		if (press !== null && event.pointerId === press.pointerId) {
			const local = toCanvas(client);
			if (distance(local, press.start) >= DRAG_THRESHOLD) {
				// Past the threshold the press is a drag, never a click, so no
				// repeated press (and no double click) closes it.
				if (press.kind === "node") {
					startDrag(press, local);
				} else {
					startPan(press);
				}
				press = null;
				gesture = null;
			}
			return;
		}
		updateHover(event.target, client);
	}

	function onPointerUp(event: PointerEvent): void {
		if (disposed) {
			return;
		}
		pointers.delete(event.pointerId);
		if (pinch !== null) {
			if (pointers.size < 2) {
				pinch = null;
			}
			return;
		}
		if (drag !== null && event.pointerId === drag.pointerId) {
			drag = null;
			refreshEmphasis();
			return;
		}
		if (pan !== null && event.pointerId === pan.pointerId) {
			endPan();
			return;
		}
		if (press !== null && event.pointerId === press.pointerId) {
			const clicked = press;
			press = null;
			if (clicked.kind === "node") {
				select(clicked.id);
			} else if (!clicked.onEdge) {
				// Clicking empty canvas without dragging clears the selection
				// (oumoznwq); a click on an edge changes nothing.
				clearSelection();
			}
			// The subject stays on the gesture it was pressed on, for the
			// compatibility double click that may follow (rtmqlnwm).
		}
	}

	function onPointerCancel(event: PointerEvent): void {
		pointers.delete(event.pointerId);
		pinch = null;
		press = null;
		gesture = null;
		if (drag !== null && event.pointerId === drag.pointerId) {
			drag = null;
			refreshEmphasis();
		}
		if (pan !== null && event.pointerId === pan.pointerId) {
			endPan();
		}
	}

	/**
	 * Open the document of the node the gesture was pressed on (trxzsqpv).
	 *
	 * The double click closes a pointer gesture, so its subject is the one that
	 * gesture fixed at the press (rtmqlnwm): the press set capture, so the
	 * browser addresses the double click to the canvas, and reading the node id
	 * off the event target would find the canvas rather than the node. A double
	 * click delivered with no gesture behind it is resolved from the element it
	 * is addressed to.
	 */
	function onDoubleClick(event: MouseEvent): void {
		const id = gesture !== null ? gesture.nodeId : targetNodeId(event.target);
		if (id !== null) {
			delegate.openNodeDocument(id);
		}
	}

	/**
	 * Scroll and trackpad pinch zoom about the pointer (kyokxuml). The wheel is
	 * ours: the page must not scroll under it.
	 */
	function onWheel(event: WheelEvent): void {
		event.preventDefault();
		const travel = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 33 : event.deltaY;
		zoomAt(Math.exp(-travel * WHEEL_ZOOM_SPEED), toCanvas({ x: event.clientX, y: event.clientY }));
	}

	function onPointerLeave(): void {
		if (drag !== null || pan !== null || pinch !== null) {
			return;
		}
		clearHover();
	}

	function startDrag(pending: { id: string; pointerId: number }, local: Point): void {
		const box = layout.nodes.get(pending.id);
		const origin = dragged.get(pending.id) ?? (box !== undefined ? { x: box.x, y: box.y } : { x: 0, y: 0 });
		const pointer = toGraph(local);
		drag = {
			pointerId: pending.pointerId,
			id: pending.id,
			offset: { x: pointer.x - origin.x, y: pointer.y - origin.y },
		};
		// A dragged node is lifted with no tooltip (xslqyywt) and hover goes
		// quiet for as long as the drag runs (uswruqlq).
		clearHover();
		refreshEmphasis();
	}

	function moveDrag(local: Point): void {
		if (drag === null) {
			return;
		}
		const pointer = toGraph(local);
		// Record the position for this frame (stppxysx): a burst of moves
		// merges into one application, the last position winning, and the
		// delegate moves the box and re-routes its edges once (spllzqlw,
		// vvqvvwzk, layout.ts).
		pending.set(drag.id, { x: pointer.x - drag.offset.x, y: pointer.y - drag.offset.y });
		schedulePending();
	}

	function startPan(pending: Press & { kind: "background" }): void {
		pan = {
			pointerId: pending.pointerId,
			start: pending.start,
			origin: { x: viewport.x, y: viewport.y },
		};
		clearHover();
		view.canvas.classList.add(EmphasisClasses.panning);
	}

	function movePan(local: Point): void {
		if (pan === null) {
			return;
		}
		viewport.x = pan.origin.x + (local.x - pan.start.x);
		viewport.y = pan.origin.y + (local.y - pan.start.y);
		clampViewport();
		applyViewport();
	}

	function endPan(): void {
		pan = null;
		view.canvas.classList.remove(EmphasisClasses.panning);
	}

	function startPinch(): void {
		clearHover();
		// A pinch is not the click a double click would close.
		gesture = null;
		const [first, second] = [...pointers.values()];
		if (first === undefined || second === undefined) {
			pinch = null;
			return;
		}
		pinch = { distance: distance(first, second), midpoint: midpoint(first, second) };
	}

	function movePinch(): void {
		if (pinch === null || pointers.size < 2) {
			return;
		}
		const [first, second] = [...pointers.values()];
		if (first === undefined || second === undefined) {
			return;
		}
		const next = { distance: distance(first, second), midpoint: midpoint(first, second) };
		if (pinch.distance > 0 && next.distance > 0) {
			// Zoom about where the fingers are (kyokxuml) and let the pair drag
			// the canvas with them (srsnqppq).
			zoomAt(next.distance / pinch.distance, toCanvas(next.midpoint));
			panBy(next.midpoint.x - pinch.midpoint.x, next.midpoint.y - pinch.midpoint.y);
		}
		pinch = next;
	}

	// --- hover and tooltip ---------------------------------------------------

	/**
	 * Highlight the neighbourhood under the pointer (kwovtsuv, moklnvms) and
	 * show the rationale of the hovered node (zrxnpzkq). While a node is
	 * dragged or the canvas is panned there is no hover (uswruqlq).
	 */
	function updateHover(target: EventTarget | null, client: Point): void {
		if (drag !== null || pan !== null || pinch !== null) {
			return;
		}
		const id = targetNodeId(target);
		const key = id === null ? targetEdgeKey(target) : null;
		if (id !== hoverId || key !== hoverEdge) {
			hoverId = id;
			hoverEdge = key;
			refreshEmphasis();
			if (hoverId !== null) {
				showTooltip(hoverId, client);
			} else {
				hideTooltip();
			}
		} else if (hoverId !== null) {
			positionTooltip(client);
		}
	}

	function clearHover(): void {
		hoverId = null;
		hoverEdge = null;
		hideTooltip();
		refreshEmphasis();
	}

	function showTooltip(id: string, client: Point): void {
		const node = nodeById(id);
		if (node === undefined) {
			hideTooltip();
			return;
		}
		tooltip.textContent = node.content.rationale;
		tooltip.hidden = false;
		positionTooltip(client);
	}

	function hideTooltip(): void {
		tooltip.hidden = true;
	}

	/**
	 * Keep the tooltip by the pointer (zrxnpzkq) and inside the panel it floats
	 * over.
	 */
	function positionTooltip(client: Point): void {
		if (tooltip.hidden) {
			return;
		}
		const hostWindow = tooltip.ownerDocument.defaultView;
		const maxWidth = (hostWindow?.innerWidth ?? Number.POSITIVE_INFINITY) - 2 * TOOLTIP_OFFSET;
		const maxHeight = (hostWindow?.innerHeight ?? Number.POSITIVE_INFINITY) - 2 * TOOLTIP_OFFSET;
		const left = Math.min(client.x + TOOLTIP_OFFSET, maxWidth - tooltip.offsetWidth);
		const top = Math.min(client.y + TOOLTIP_OFFSET, maxHeight - tooltip.offsetHeight);
		tooltip.style.left = `${Math.max(TOOLTIP_OFFSET, left)}px`;
		tooltip.style.top = `${Math.max(TOOLTIP_OFFSET, top)}px`;
	}

	// --- resize --------------------------------------------------------------

	/**
	 * Reflow the viewport to the new panel size (yxqqozvt): the graph point at
	 * the centre of the viewport stays put, so only the surroundings grow or
	 * shrink, and the result is clamped at the limits (yymrxqsk).
	 */
	function onResize(): void {
		const next = canvasSize();
		viewport.x += (next.width - size.width) / 2;
		viewport.y += (next.height - size.height) / 2;
		size = next;
		clampViewport();
		applyViewport();
	}

	// --- graph changes -------------------------------------------------------

	function setGraph(next: InteractionGraph): void {
		model = next.model;
		order = next.order;
		// A graph swap is the only time the drawn elements can change identity,
		// so the map is rebuilt here (stppxysx); a re-layout within a revision
		// keeps every element.
		cancelPending();
		pending.clear();
		layout = delegate.relayout(dragged);
		rebuildElements();
		drag = null;
		pinch = null;
		clearHover();
		if (selection !== null && nodeById(selection) === undefined) {
			clearSelection();
		}
		if (focusId !== null && nodeById(focusId) === undefined) {
			focusNode(null);
		}
		refreshEmphasis();
	}

	function nodeById(id: string): GraphNode | undefined {
		return model.nodes.find((node) => node.id === id);
	}

	// --- wiring --------------------------------------------------------------

	const resizeObserver = new ResizeObserver(onResize);
	resizeObserver.observe(view.canvas);
	view.canvas.addEventListener("pointerdown", onPointerDown);
	view.canvas.addEventListener("pointermove", onPointerMove);
	view.canvas.addEventListener("pointerup", onPointerUp);
	view.canvas.addEventListener("pointercancel", onPointerCancel);
	view.canvas.addEventListener("pointerleave", onPointerLeave);
	view.canvas.addEventListener("dblclick", onDoubleClick);
	view.canvas.addEventListener("wheel", onWheel, { passive: false });

	function dispose(): void {
		if (disposed) {
			return;
		}
		disposed = true;
		cancelPending();
		resizeObserver.disconnect();
		view.canvas.removeEventListener("pointerdown", onPointerDown);
		view.canvas.removeEventListener("pointermove", onPointerMove);
		view.canvas.removeEventListener("pointerup", onPointerUp);
		view.canvas.removeEventListener("pointercancel", onPointerCancel);
		view.canvas.removeEventListener("pointerleave", onPointerLeave);
		view.canvas.removeEventListener("dblclick", onDoubleClick);
		view.canvas.removeEventListener("wheel", onWheel);
		hideTooltip();
		tooltip.remove();
	}

	return {
		viewport: () => ({ ...viewport }),
		selected: () => selection,
		focused: () => focusId,
		select,
		clearSelection,
		focusNode,
		focusStep,
		panBy,
		zoomAt,
		zoomAboutCentre,
		fitGraph,
		centreOnNode,
		moveNodeBy,
		setGraph,
		dispose,
	};
}

// --- helpers ----------------------------------------------------------------

/** The tooltip showing the rationale of the hovered node (zrxnpzkq, pztszkqs). */
function createTooltip(view: InteractionView): HTMLElement {
	const document = view.canvas.ownerDocument;
	const tooltip = document.createElement("div");
	tooltip.className = "tooltip";
	tooltip.setAttribute("role", "tooltip");
	tooltip.hidden = true;
	document.body.appendChild(tooltip);
	return tooltip;
}

/** The node id an event target is on, or null when it is on no node. */
function targetNodeId(target: EventTarget | null): string | null {
	const element = target instanceof Element ? target.closest(`[${NODE_ID_ATTR}]`) : null;
	return element?.getAttribute("data-node-id") ?? null;
}

/** The edge key an event target is on, or null when it is on no edge. */
function targetEdgeKey(target: EventTarget | null): string | null {
	const element = target instanceof Element ? target.closest(`[${EDGE_KEY_ATTR}]`) : null;
	return element?.getAttribute("data-edge-key") ?? null;
}

function toggle(element: Element, name: string, on: boolean): void {
	element.classList.toggle(name, on);
}

/** Remove every emphasis class a drawn element may carry (used only when a graph is swapped). */
function clearEmphasis(element: Element): void {
	for (const name of [
		EmphasisClasses.selected,
		EmphasisClasses.related,
		EmphasisClasses.hoverNeighbour,
		EmphasisClasses.dimmed,
		EmphasisClasses.dragging,
		EmphasisClasses.focus,
	]) {
		element.classList.remove(name);
	}
}

function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
