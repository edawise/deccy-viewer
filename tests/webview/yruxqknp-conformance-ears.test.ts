// @vitest-environment jsdom
/**
 * Conformance check: what running the panel state and the presentation
 * (yruxqknp) must show for its requirement sentences (luqwqrll, ywullzun,
 * twslmwvn, vxmzzunt, krvyoumy, qxmtwxxr, rmsyvtvn, pltovtuo) to hold.
 *
 * Every expectation is one of those sentences, or the state this check builds
 * itself and drives through the artifact's own entry points. The panel state
 * and the presentation are imported for those entry points only (attachStates,
 * createPanelState, readPanelState, writePanelState): none of their constants
 * is asserted back.
 */
import { describe, expect, test } from "vitest";

import { attachStates } from "../../src/webview/states";
import {
	createPanelState,
	readPanelState,
	writePanelState,
} from "../../src/webview/state";
import type { PanelState, WorkspaceState } from "../../src/webview/state";

/** A workspaceState of this check's own, recording what is written to it. */
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

/** The canvas and the banner the presentation attaches to. */
function view() {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const banner = document.createElement("div");
	banner.className = "panel__banner";
	banner.hidden = true;
	document.body.append(canvas, banner);
	return { canvas, banner };
}

describe("the panel state persists in workspaceState (rmsyvtvn)", () => {
	test("what is recorded is written through, field by field", async () => {
		const store = storage();

		const keeper = createPanelState(store);
		keeper.setOpen(true);
		keeper.setSelection("aaaaaaaa");
		keeper.setViewport({ x: 40, y: 20, scale: 2 });
		keeper.setNodePosition("aaaaaaaa", { x: 7, y: 9 });
		await new Promise((resolve) => setTimeout(resolve, 0));

		// rmsyvtvn: the panel state — open, selection, pan, zoom and node
		// positions — is persisted in workspaceState, as recorded.
		expect(store.written).toEqual({
			open: true,
			selection: "aaaaaaaa",
			pan: { x: 40, y: 20 },
			zoom: 2,
			positions: { aaaaaaaa: { x: 7, y: 9 } },
		});
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

		// rmsyvtvn: the state persisted in workspaceState is the state read back.
		expect(readPanelState(store)).toEqual(state);
	});

	test("a snapshot is written, so later changes to the state do not rewrite it", () => {
		const store = storage();
		const state: PanelState = { open: false, selection: null, pan: { x: 0, y: 0 }, zoom: 1, positions: {} };

		writePanelState(store, state);
		const written = store.written as PanelState;
		written.positions.aaaaaaaa = { x: 1, y: 1 };

		// rmsyvtvn: what persists is the state at write time, not the live state
		// it was taken from.
		expect(state.positions).toEqual({});
	});

	test("a stored value which is not a plausible state reads back as a panel state", () => {
		const store = storage({ open: "yes", selection: 7, pan: null, zoom: -1, positions: { a: 1 } });

		// rmsyvtvn names the persisted fields without pinning the values a state
		// that is not plausible falls back to, so only their shape is checked.
		const restored = readPanelState(store);
		expect(typeof restored.open).toBe("boolean");
		expect(restored.selection === null || typeof restored.selection === "string").toBe(true);
		expect(typeof restored.pan.x).toBe("number");
		expect(typeof restored.pan.y).toBe("number");
		expect(typeof restored.zoom).toBe("number");
		expect(typeof restored.positions).toBe("object");
	});
});

describe("the selection, pan and zoom survive a reload (luqwqrll)", () => {
	test("the state that is still there comes through the reload", () => {
		const keeper = createPanelState();
		keeper.setSelection("aaaaaaaa");
		keeper.setViewport({ x: 10, y: 20, scale: 2 });
		keeper.setNodePosition("aaaaaaaa", { x: 1, y: 1 });
		keeper.setNodePosition("bbbbbbbb", { x: 2, y: 2 });

		const after = keeper.applyReload(["aaaaaaaa"]);

		// luqwqrll: the reload re-renders the graph without losing the current
		// selection, pan or zoom ...
		expect(after.selection).toBe("aaaaaaaa");
		expect(after.pan).toEqual({ x: 10, y: 20 });
		expect(after.zoom).toBe(2);
		// ... and the recorded position of a node that is still there survives
		// with it, while the one that is gone goes.
		expect(after.positions).toEqual({ aaaaaaaa: { x: 1, y: 1 } });
	});
});

describe("a selection whose node is gone is cleared (qxmtwxxr)", () => {
	test("a reload clears a selection whose node no longer exists", () => {
		const keeper = createPanelState();
		keeper.setSelection("bbbbbbbb");

		// qxmtwxxr: the selected node no longer exists after the reload.
		expect(keeper.applyReload(["aaaaaaaa"]).selection).toBeNull();
	});
});

describe("a focus change loses nothing (pltovtuo)", () => {
	test("the state is handed on again, unchanged", () => {
		const keeper = createPanelState();
		keeper.setSelection("aaaaaaaa");
		const seen: PanelState[] = [];
		keeper.onChange((state) => seen.push({ ...state }));

		keeper.reassert();

		// pltovtuo: pan, zoom and selection stay stable across a focus change of
		// the panel, so the state comes back to the listeners as it was.
		expect(seen).toEqual([keeper.current()]);
	});
});

describe("the loading state queues input and shows it (ywullzun)", () => {
	test("while the data loads, input is queued and not dropped", () => {
		const elements = view();
		const states = attachStates(elements);
		const ran: string[] = [];

		states.beginLoading();
		states.input.run(() => ran.push("first"));
		states.input.run(() => ran.push("second"));

		// ywullzun: user interaction input is queued while the graph data loads
		// — queued, never dropped ...
		expect(ran).toEqual([]);
		expect(states.input.pending()).toBe(2);
		expect(states.state().loading).toBe(true);

		states.loaded(2);

		// ... and applied, in order, when the load finishes.
		expect(ran).toEqual(["first", "second"]);
		expect(states.input.pending()).toBe(0);
		expect(states.state().loading).toBe(false);
	});
});

describe("a repo with no nodes is not a blank canvas (twslmwvn)", () => {
	test("an empty-state message stands in for the canvas", () => {
		const elements = view();
		const states = attachStates(elements);

		states.beginLoading();
		states.loaded(0);

		// twslmwvn: with no nodes the viewer shows an empty-state message
		// instead of a blank canvas. The sentence names the message without
		// pinning its text, so what is checked is that the canvas shows one.
		expect(states.state().empty).toBe(true);
		expect((elements.canvas.textContent ?? "").trim()).not.toBe("");
	});
});

describe("a failed read is shown and the canvas kept (vxmzzunt)", () => {
	test("the message is shown as it stands and the last graph stays", () => {
		const elements = view();
		const states = attachStates(elements);
		const canvas = elements.canvas.innerHTML;

		states.failed("cannot read nodes/: no workspace folder is open");

		// vxmzzunt: the failure is shown as it stands, inline ...
		expect(states.state().error).toBe("cannot read nodes/: no workspace folder is open");
		expect(elements.banner.textContent).toBe("cannot read nodes/: no workspace folder is open");
		expect(elements.banner.hidden).toBe(false);
		// ... and the last successfully rendered graph stays on the canvas.
		expect(elements.canvas.innerHTML).toBe(canvas);
	});

	test("a later successful read settles the stale message", () => {
		const elements = view();
		const states = attachStates(elements);

		states.failed("boom");
		states.loaded(3);

		// vxmzzunt: a read that succeeds settles the message the failed one left.
		expect(states.state().error).toBeNull();
		expect(elements.banner.hidden).toBe(true);
	});
});

describe("a document left out is warned about, inline (krvyoumy)", () => {
	test("the warning names the file and the problem while the graph renders", () => {
		const elements = view();
		const states = attachStates(elements);
		// The graph the renderer (rtlotqvy) draws is on the canvas by the time
		// the graph data arrives with the warnings of the documents left out.
		const drawn = document.createElement("div");
		drawn.className = "node";
		elements.canvas.append(drawn);

		states.loaded(1, ["nodes/aaaaaaaa.json: invalid JSON (Unexpected token } in JSON)"]);

		const warning = elements.banner.querySelector<HTMLElement>(".state-warning");
		// krvyoumy: the document is left out and the warning is shown inline,
		// naming the file and the problem ...
		expect(warning?.hidden).toBe(false);
		expect(warning?.textContent).toContain("nodes/aaaaaaaa.json");
		expect(warning?.textContent).toContain("invalid JSON");
		// ... and the remaining nodes are rendered, not replaced by it.
		expect(elements.canvas.contains(drawn)).toBe(true);
	});

	test("the warning is not the failure, and a read with none clears it", () => {
		const elements = view();
		const states = attachStates(elements);

		states.loaded(1, [
			"nodes/aaaa.json: not a node id (expected at least eight lowercase alphanumerics)",
		]);

		const warning = elements.banner.querySelector<HTMLElement>(".state-warning");
		const error = elements.banner.querySelector<HTMLElement>(".state-error");
		// krvyoumy: a document left out is a warning — the graph still renders —
		// and not the failure that takes it down (vxmzzunt).
		expect(error?.hidden).toBe(true);
		expect(error?.textContent).toBe("");
		expect(warning?.hidden).toBe(false);

		// A read whose documents all conform has nothing to warn about.
		states.loaded(2);

		expect(states.state().warnings).toEqual([]);
		expect((elements.banner.querySelector(".state-warning") as HTMLElement).hidden).toBe(true);
	});
});
