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
 *   node opens `nodes/<id>.json` in the editor (trxzsqpv);
 * - while a node is selected it is highlighted together with its direct
 *   dependencies, dependents and evaluations while everything unrelated dims
 *   (zkwypuor) to 0.3 opacity (ksywwktl) behind an accent border (ortyupqp,
 *   qqmrtwor); while nothing is selected nothing is dimmed (uxuvwurl);
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
 * (ltrnmrsr), and `openNodeDocument` reaches the editor (trxzsqpv).
 *
 * The renderer draws the elements this module drives, under the page interface
 * (ympqvvwr): the views of {@link InteractionView}, the identity of
 * {@link edgeKey}, and the classes of {@link EmphasisClasses}.
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

	const viewport: Viewport = { x: 0, y: 0, scale: 1 };
	let selection: string | null = null;
	let focusId: string | null = null;
	let hoverId: string | null = null;
	let hoverEdge: string | null = null;

	let press: Press | null = null;
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
	 * Re-derive the emphasis of every drawn element from the selection and the
	 * hover (uxuvwurl, zkwypuor, kwovtsuv): the selection is highlighted with
	 * its direct dependencies, dependents and evaluations and everything else
	 * dims (ksywwktl); the pointer highlights the neighbourhood it is over
	 * (moklnvms); keyboard focus rings the node it is on (ozxnxzus); the node
	 * being dragged is lifted (xslqyywt).
	 */
	function refreshEmphasis(): void {
		const relatedNodes = new Set<string>();
		const relatedEdges = new Set<string>();
		if (selection !== null) {
			relatedNodes.add(selection);
			const related = neighbourhood(model, selection);
			for (const id of related.nodes) {
				relatedNodes.add(id);
			}
			for (const edge of related.edges) {
				relatedEdges.add(edgeKey(edge));
			}
		}

		const hoverNodes = new Set<string>();
		const hoverEdges = new Set<string>();
		if (hoverId !== null) {
			const near = neighbourhood(model, hoverId);
			for (const id of near.nodes) {
				hoverNodes.add(id);
			}
			for (const edge of near.edges) {
				hoverEdges.add(edgeKey(edge));
			}
		}
		if (hoverEdge !== null) {
			hoverEdges.add(hoverEdge);
		}

		for (const element of view.surface.querySelectorAll(`[${NODE_ID_ATTR}]`)) {
			const id = element.getAttribute("data-node-id") ?? "";
			toggle(element, EmphasisClasses.selected, id === selection);
			toggle(element, EmphasisClasses.related, selection !== null && id !== selection && relatedNodes.has(id));
			toggle(element, EmphasisClasses.dimmed, selection !== null && !relatedNodes.has(id));
			toggle(element, EmphasisClasses.hoverNeighbour, hoverNodes.has(id));
			toggle(element, EmphasisClasses.focus, id === focusId);
			toggle(element, EmphasisClasses.dragging, drag?.id === id);
		}
		for (const element of view.surface.querySelectorAll(`[${EDGE_KEY_ATTR}]`)) {
			const key = element.getAttribute("data-edge-key") ?? "";
			toggle(element, EmphasisClasses.related, selection !== null && relatedEdges.has(key));
			toggle(element, EmphasisClasses.dimmed, selection !== null && !relatedEdges.has(key));
			toggle(element, EmphasisClasses.hoverNeighbour, hoverEdges.has(key));
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
			return;
		}
		// The renderer owns the elements (rtlotqvy); make the focused one able
		// to take real DOM focus so the browser follows the traversal.
		const element = view.surface.querySelector(`[${NODE_ID_ATTR}="${focusId}"]`);
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

	function applyViewport(): void {
		view.surface.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
	}

	/**
	 * Clamp the pan and zoom at the viewport limits (yymrxqsk). The specs fix
	 * no limits, so the drawn graph stays reachable instead: when it fits, it
	 * is never panned out of the viewport, and when it does not, the viewport
	 * is never panned off it. The zoom itself is limited by {@link MIN_SCALE}
	 * and {@link MAX_SCALE}.
	 */
	function clampViewport(): void {
		const bounds = layout.bounds;
		if (bounds.width <= 0 || bounds.height <= 0) {
			return;
		}
		const width = bounds.width * viewport.scale;
		const height = bounds.height * viewport.scale;
		const left = viewport.x + bounds.x * viewport.scale;
		const top = viewport.y + bounds.y * viewport.scale;

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

	function fitGraph(): void {
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
		viewport.x = size.width / 2 - (bounds.x + bounds.width / 2) * viewport.scale;
		viewport.y = size.height / 2 - (bounds.y + bounds.height / 2) * viewport.scale;
		clampViewport();
		applyViewport();
	}

	function moveNodeBy(id: string, dx: number, dy: number): void {
		if (nodeById(id) === undefined) {
			return;
		}
		const box = layout.nodes.get(id);
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

	/** Graph pixels from canvas pixels, undoing the pan and zoom. */
	function toGraph(local: Point): Point {
		return {
			x: (local.x - viewport.x) / viewport.scale,
			y: (local.y - viewport.y) / viewport.scale,
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

		const id = targetNodeId(event.target);
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
				// Past the threshold the press is a drag, never a click.
				if (press.kind === "node") {
					startDrag(press, local);
				} else {
					startPan(press);
				}
				press = null;
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
		}
	}

	function onPointerCancel(event: PointerEvent): void {
		pointers.delete(event.pointerId);
		pinch = null;
		press = null;
		if (drag !== null && event.pointerId === drag.pointerId) {
			drag = null;
			refreshEmphasis();
		}
		if (pan !== null && event.pointerId === pan.pointerId) {
			endPan();
		}
	}

	function onDoubleClick(event: MouseEvent): void {
		const id = targetNodeId(event.target);
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
		dragged.set(drag.id, { x: pointer.x - drag.offset.x, y: pointer.y - drag.offset.y });
		// The delegate moves the box and re-routes the edges (spllzqlw,
		// vvqvvwzk, layout.ts).
		layout = delegate.relayout(dragged);
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
		layout = delegate.relayout(dragged);
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

function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
