/**
 * The panel state of the deccy graph viewer, its survival and its
 * persistence (yruxqknp).
 *
 * The panel state is what the user has done to the panel and would not want to
 * lose: whether the panel is open, which node is selected, where the viewport
 * sits (its pan and its zoom) and where the user has put nodes (rmsyvtvn).
 * This module holds it, hands it to the listeners on every change, and writes
 * it through to workspaceState (rmsyvtvn) so the extension can restore the
 * panel with its last interaction state the next time it is activated
 * (vpqxkzxq).
 *
 * Two events must not lose it:
 *
 * - a reload of the graph data re-renders the graph and the selection, pan and
 *   zoom come through unchanged (luqwqrll); only the selection of a node that
 *   is gone after the reload is cleared, so the user is never left selecting
 *   something that is no longer there (qxmtwxxr), and the recorded positions
 *   of nodes that are gone go with it;
 * - focus changes of the panel change nothing at all (pltovtuo). Nothing here
 *   listens to focus, and {@link PanelStateKeeper.reassert} hands the
 *   unchanged state back to the listeners so the view can re-apply it after a
 *   re-render.
 *
 * The live view state belongs to the interaction controller (noplrntp), which
 * is attached without one: {@link applyPanelState} restores the recorded pan,
 * zoom and selection into a freshly attached controller. The recorded node
 * positions are not the controller's to hold — they are the overrides the
 * renderer (rtlotqvy) draws the boxes at when it lays the graph out
 * ({@link PanelState.positions}).
 *
 * Nothing here touches the DOM: this module is the record of the panel state,
 * and states.ts presents the states the graph data can be in.
 */

import type { Point } from "../graph/layout";
import type { InteractionController, Viewport } from "./contract";

/**
 * The workspaceState memento the panel state persists in (rmsyvtvn). This is
 * the shape of `context.workspaceState`, declared structurally so this module
 * never imports the extension API.
 */
export interface WorkspaceState {
	get<T>(key: string): T | undefined;
	update(key: string, value: unknown): void | PromiseLike<void>;
}

/** The panel state that persists in workspaceState (rmsyvtvn). */
export interface PanelState {
	/** Whether the panel is open (rmsyvtvn), so it can be reopened as it was (vpqxkzxq). */
	open: boolean;
	/** The selected node, or null when nothing is selected (rmsyvtvn). */
	selection: string | null;
	/** The pan of the viewport in canvas pixels (rmsyvtvn). */
	pan: Point;
	/** The zoom scale of the viewport (rmsyvtvn). */
	zoom: number;
	/**
	 * Where the user has put nodes, overriding the arrangement (rmsyvtvn,
	 * spllzqlw): node id to position in graph pixels. The renderer (rtlotqvy)
	 * draws the boxes at these positions and the interaction state moves them
	 * from there (noplrntp).
	 */
	positions: Readonly<Record<string, Point>>;
}

/** A listener handed the panel state on every change (and on reassert). */
export type PanelStateListener = (state: Readonly<PanelState>) => void;

/** The workspaceState key the panel state persists under (rmsyvtvn). */
export const PANEL_STATE_KEY = "deccy.panelState";

/** The panel state nothing has been recorded for yet (rmsyvtvn). */
export function defaultPanelState(): PanelState {
	return { open: false, selection: null, pan: { x: 0, y: 0 }, zoom: 1, positions: {} };
}

/**
 * Read the persisted panel state back out of workspaceState (rmsyvtvn,
 * vpqxkzxq). Anything that is not a plausible {@link PanelState} — an old
 * shape, a hand-edited workspace, a partial write — falls back to the default
 * state field by field rather than failing the restore.
 */
export function readPanelState(storage: WorkspaceState): PanelState {
	return sanitizePanelState(storage.get<unknown>(PANEL_STATE_KEY));
}

/**
 * Persist the panel state in workspaceState (rmsyvtvn). A plain copy is
 * written, so the stored value round-trips as JSON whatever the caller does to
 * the state afterwards.
 */
export function writePanelState(
	storage: WorkspaceState,
	state: Readonly<PanelState>,
): void | PromiseLike<void> {
	return storage.update(PANEL_STATE_KEY, snapshotOf(state));
}

/** The recorded panel state, and the guarantees this module makes about it. */
export interface PanelStateKeeper {
	/** The panel state as recorded now. */
	current(): Readonly<PanelState>;
	/** Record that the panel opened or closed (rmsyvtvn, vpqxkzxq). */
	setOpen(open: boolean): void;
	/** Record the selection, or null when it was cleared (rmsyvtvn). */
	setSelection(id: string | null): void;
	/** Record the pan and zoom of the viewport (rmsyvtvn). */
	setViewport(viewport: Viewport): void;
	/** Record where the user put a node (rmsyvtvn). */
	setNodePosition(id: string, position: Point): void;
	/** Record that a node is gone; its recorded position goes with it. */
	forgetNode(id: string): void;
	/**
	 * Record the outcome of a reload of the graph data (luqwqrll): the
	 * selection, pan and zoom survive unchanged, except that a selection whose
	 * node is gone from `nodeIds` is cleared (qxmtwxxr), and the recorded
	 * positions of nodes that are gone are dropped. `nodeIds` is the node set
	 * of the freshly loaded graph.
	 *
	 * The listeners are handed the surviving state even when nothing changed,
	 * so the freshly rendered graph re-asserts it (luqwqrll).
	 */
	applyReload(nodeIds: Iterable<string>): Readonly<PanelState>;
	/**
	 * The panel regained focus (pltovtuo): the state comes back to the
	 * listeners unchanged, so a view that re-rendered while the panel was
	 * unfocused re-applies it instead of starting over.
	 */
	reassert(): void;
	/** Listen for state changes; the result stops the listening. */
	onChange(listener: PanelStateListener): () => void;
	/**
	 * Stop listening. Every change is already written through to workspaceState
	 * (rmsyvtvn), so there is nothing left to persist.
	 */
	dispose(): void;
}

/**
 * Record the panel state and persist it in workspaceState (rmsyvtvn). Without
 * a `storage` the state is kept for the lifetime of the panel only, which is
 * all a webview gets before its host hands it the persisted state.
 */
export function createPanelState(storage?: WorkspaceState): PanelStateKeeper {
	let state: PanelState = storage !== undefined ? readPanelState(storage) : defaultPanelState();
	const listeners = new Set<PanelStateListener>();
	let writes: Promise<void> = Promise.resolve();

	/**
	 * Write the current state through to workspaceState (rmsyvtvn). Writes are
	 * serialized so the last snapshot is the last write, and a write that fails
	 * never disturbs the viewer: persistence is best-effort.
	 */
	const commit = (): void => {
		if (storage === undefined) {
			return;
		}
		const snapshot = snapshotOf(state);
		writes = writes.then(() => writePanelState(storage, snapshot)).catch(() => undefined);
	};

	const emit = (snapshot: Readonly<PanelState>): void => {
		for (const listener of [...listeners]) {
			listener(snapshot);
		}
	};

	/** Take the next state as recorded, persist it and hand it on. */
	const record = (next: PanelState): void => {
		state = next;
		commit();
		emit(state);
	};

	function setOpen(open: boolean): void {
		if (state.open === open) {
			return;
		}
		record({ ...state, open });
	}

	function setSelection(id: string | null): void {
		if (state.selection === id) {
			return;
		}
		record({ ...state, selection: id });
	}

	function setViewport(viewport: Viewport): void {
		const pan = { x: viewport.x, y: viewport.y };
		if (state.pan.x === pan.x && state.pan.y === pan.y && state.zoom === viewport.scale) {
			return;
		}
		record({ ...state, pan, zoom: viewport.scale });
	}

	function setNodePosition(id: string, position: Point): void {
		const current = state.positions[id];
		if (current !== undefined && current.x === position.x && current.y === position.y) {
			return;
		}
		const positions = { ...state.positions, [id]: { x: position.x, y: position.y } };
		record({ ...state, positions });
	}

	function forgetNode(id: string): void {
		if (!Object.prototype.hasOwnProperty.call(state.positions, id)) {
			return;
		}
		const positions = { ...state.positions };
		delete positions[id];
		record({ ...state, positions });
	}

	function applyReload(nodeIds: Iterable<string>): Readonly<PanelState> {
		const present = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);
		const positions: Record<string, Point> = {};
		for (const [id, position] of Object.entries(state.positions)) {
			if (present.has(id)) {
				positions[id] = position;
			}
		}
		// The pan and zoom survive every reload (luqwqrll); the selection
		// survives with them, except when its node is gone (qxmtwxxr).
		const selection =
			state.selection !== null && present.has(state.selection) ? state.selection : null;
		record({ ...state, selection, positions });
		return state;
	}

	function reassert(): void {
		// Nothing is lost across a focus change of the panel (pltovtuo); the
		// unchanged state is handed on so the view can re-apply it.
		emit(state);
	}

	function onChange(listener: PanelStateListener): () => void {
		listeners.add(listener);
		return (): void => {
			listeners.delete(listener);
		};
	}

	function dispose(): void {
		listeners.clear();
	}

	return {
		current: () => state,
		setOpen,
		setSelection,
		setViewport,
		setNodePosition,
		forgetNode,
		applyReload,
		reassert,
		onChange,
		dispose,
	};
}

/**
 * Restore the recorded panel state into the interaction state (vpqxkzxq:
 * restore the panel with its last interaction state). The pan and zoom are
 * reached through the controller's own operations (noplrntp), so the viewport
 * limits keep applying (yymrxqsk) and a recorded position that no longer fits
 * is clamped rather than lost. The recorded node positions are not applied
 * here: the renderer (rtlotqvy) draws the boxes at them (PanelState.positions).
 */
export function applyPanelState(
	controller: InteractionController,
	state: Readonly<PanelState>,
): void {
	const current = controller.viewport();
	if (current.scale > 0 && state.zoom > 0 && current.scale !== state.zoom) {
		// Zoom about the origin of the canvas: the pan scales along, and the
		// pan step below puts it back exactly where it was recorded.
		controller.zoomAt(state.zoom / current.scale, { x: 0, y: 0 });
	}
	const reached = controller.viewport();
	controller.panBy(state.pan.x - reached.x, state.pan.y - reached.y);
	controller.select(state.selection);
}

// --- helpers ----------------------------------------------------------------

/** A plain copy of the state, safe to hand to workspaceState (rmsyvtvn). */
function snapshotOf(state: Readonly<PanelState>): PanelState {
	const positions: Record<string, Point> = {};
	for (const [id, position] of Object.entries(state.positions)) {
		positions[id] = { x: position.x, y: position.y };
	}
	return {
		open: state.open,
		selection: state.selection,
		pan: { x: state.pan.x, y: state.pan.y },
		zoom: state.zoom,
		positions,
	};
}

/** The stored value as a {@link PanelState}, field by field (vpqxkzxq). */
function sanitizePanelState(value: unknown): PanelState {
	const fallback = defaultPanelState();
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return fallback;
	}
	const record = value as Record<string, unknown>;
	const positions: Record<string, Point> = {};
	const stored = record.positions;
	if (typeof stored === "object" && stored !== null && !Array.isArray(stored)) {
		for (const [id, position] of Object.entries(stored)) {
			const point = sanitizePoint(position);
			if (point !== null) {
				positions[id] = point;
			}
		}
	}
	return {
		open: record.open === true,
		selection: typeof record.selection === "string" ? record.selection : null,
		pan: sanitizePoint(record.pan) ?? { ...fallback.pan },
		zoom: sanitizeScale(record.zoom),
		positions,
	};
}

/** A stored position, or null when it is not a pair of finite numbers. */
function sanitizePoint(value: unknown): Point | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	const point = value as Record<string, unknown>;
	if (typeof point.x !== "number" || typeof point.y !== "number") {
		return null;
	}
	if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
		return null;
	}
	return { x: point.x, y: point.y };
}

/** A stored zoom, or the default when it is not a positive finite number. */
function sanitizeScale(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1;
}
