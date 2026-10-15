// @vitest-environment jsdom
/**
 * Conformance check: what running the panel state and the presentation
 * (yruxqknp) must show for its requirement sentences (luqwqrll, ywullzun,
 * twslmwvn, vxmzzunt, qxmtwxxr, rmsyvtvn, pltovtuo) to hold.
 *
 * The state is kept here against a storage of the check's own, and the
 * presentation is attached to elements built here, so what is observed is the
 * artifact's own behaviour across those events.
 */
import { describe, expect, test } from "vitest";

import {
	EMPTY_STATE_MESSAGE,
	attachStates,
} from "../../src/webview/states";
import {
	PANEL_STATE_KEY,
	applyPanelState,
	createPanelState,
	readPanelState,
	writePanelState,
} from "../../src/webview/state";
import type { InteractionController, InteractionGraph, PanelState } from "../../src/webview/contract";
import type { WorkspaceState } from "../../src/webview/state";

function storage(initial?: unknown): WorkspaceState & { written: unknown } {
	return {
		written: undefined,
		get<T>(): T | undefined {
			return initial as T | undefined;
		},
		update(_key: string, value: unknown): void {
			this.written = value;
		},
	};
}

function view() {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const banner = document.createElement("div");
	banner.className = "panel__banner";
	banner.hidden = true;
	document.body.append(canvas, banner);
	return { canvas, banner };
}

describe("the panel state persists in workspaceState", () => {
	test("what is recorded is written through under the panel state key", async () => {
		const store = storage();

		const keeper = createPanelState(store);
		keeper.setOpen(true);
		keeper.setSelection("aaaaaaaa");
		keeper.setViewport({ x: 40, y: 20, scale: 2 });
		keeper.setNodePosition("aaaaaaaa", { x: 7, y: 9 });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(store.written).toEqual({
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 40, y: 20 },
			zoom: 2,
			positions: { aaaaaaaa: { x: 7, y: 9 } },
		});
		expect(PANEL_STATE_KEY).toBe("deccy.panelState");
	});

	test("a stored state comes back as it was written", () => {
		const state: PanelState = {
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 1, y: 2 },
			zoom: 3,
			positions: { aaaaaaaa: { x: 4, y: 5 } },
		};
		const store = storage(state);

		expect(readPanelState(store)).toEqual(state);
	});

	test("a stored value that is not a plausible state falls back field by field", () => {
		const store = storage({ open: "yes", selection: 7, pan: null, zoom: -1, positions: { a: 1 } });

		expect(readPanelState(store)).toEqual({
			open: false,
			selection: null,
			pan: { x: 0, y: 0 },
			zoom: 1,
			positions: {},
		});
	});

	test("a snapshot is written, so later changes to the state do not rewrite it", () => {
		const store = storage();
		const state: PanelState = { open: false, selection: null, pan: { x: 0, y: 0 }, zoom: 1, positions: {} };

		writePanelState(store, state);
		const written = store.written as PanelState;
		written.positions.aaaaaaaa = { x: 1, y: 1 };

		expect(state.positions).toEqual({});
	});
});

describe("the state survives a reload and a focus change", () => {
	test("a reload keeps the selection, the pan, the zoom and the positions that are still there", () => {
		const keeper = createPanelState();
		keeper.setSelection("aaaaaaaa");
		keeper.setViewport({ x: 10, y: 20, scale: 2 });
		keeper.setNodePosition("aaaaaaaa", { x: 1, y: 1 });
		keeper.setNodePosition("bbbbbbbb", { x: 2, y: 2 });

		const after = keeper.applyReload(["aaaaaaaa"]);

		expect(after.selection).toBe("aaaaaaaa");
		expect(after.pan).toEqual({ x: 10, y: 20 });
		expect(after.zoom).toBe(2);
		expect(after.positions).toEqual({ aaaaaaaa: { x: 1, y: 1 } });
	});

	test("a reload clears a selection whose node is gone", () => {
		const keeper = createPanelState();
		keeper.setSelection("bbbbbbbb");

		expect(keeper.applyReload(["aaaaaaaa"]).selection).toBeNull();
	});

	test("a focus change loses nothing and hands the state on again", () => {
		const keeper = createPanelState();
		keeper.setSelection("aaaaaaaa");
		const seen: PanelState[] = [];
		keeper.onChange((state) => seen.push({ ...state }));

		keeper.reassert();

		expect(seen).toEqual([keeper.current()]);
	});
});

describe("the loading, empty and error states are presented", () => {
	test("while the data loads, input is queued and not dropped", () => {
		const elements = view();
		const states = attachStates(elements);
		const ran: string[] = [];

		states.beginLoading();
		states.input.run(() => ran.push("first"));
		states.input.run(() => ran.push("second"));

		expect(ran).toEqual([]);
		expect(states.input.pending()).toBe(2);
		expect(states.state().loading).toBe(true);

		states.loaded(2);

		expect(ran).toEqual(["first", "second"]);
		expect(states.input.pending()).toBe(0);
		expect(states.state().loading).toBe(false);
	});

	test("a repo with no nodes shows the empty-state message instead of a blank canvas", () => {
		const elements = view();
		const states = attachStates(elements);

		states.beginLoading();
		states.loaded(0);

		expect(states.state().empty).toBe(true);
		expect(elements.canvas.textContent).toContain(EMPTY_STATE_MESSAGE);
	});

	test("a failed read shows the message as it stands and keeps the canvas", () => {
		const elements = view();
		const states = attachStates(elements);
		const canvas = elements.canvas.innerHTML;

		states.failed("cannot read nodes/: no workspace folder is open");

		expect(states.state().error).toBe("cannot read nodes/: no workspace folder is open");
		expect(elements.banner.textContent).toBe("cannot read nodes/: no workspace folder is open");
		expect(elements.banner.hidden).toBe(false);
		expect(elements.canvas.innerHTML).toBe(canvas);
	});

	test("a later successful read settles the empty state and the stale error", () => {
		const elements = view();
		const states = attachStates(elements);

		states.failed("boom");
		states.loaded(3);

		expect(states.state()).toEqual({ loading: false, empty: false, error: null });
		expect(elements.banner.hidden).toBe(true);
	});
});

describe("the recorded panel state is restored into a live controller", () => {
	test("the pan, the zoom and the selection reach the controller through its own operations", () => {
		const calls: string[] = [];
		const controller = {
			viewport: () => ({ x: 0, y: 0, scale: 1 }),
			selected: () => null,
			focused: () => null,
			select: (id: string | null) => {
				calls.push(`select ${id}`);
			},
			clearSelection: () => {},
			focusNode: () => {},
			focusStep: () => {},
			panBy: (dx: number, dy: number) => {
				calls.push(`pan ${dx} ${dy}`);
			},
			zoomAt: (factor: number) => {
				calls.push(`zoom ${factor}`);
			},
			zoomAboutCentre: () => {},
			fitGraph: () => {},
			moveNodeBy: () => {},
			setGraph: (_graph: InteractionGraph) => {},
			dispose: () => {},
		} as InteractionController;

		applyPanelState(controller, {
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 30, y: 40 },
			zoom: 2,
			positions: {},
		});

		expect(calls).toEqual(["zoom 2", "pan 30 40", "select aaaaaaaa"]);
	});
});
