// @vitest-environment jsdom
/**
 * Contract check: what running the viewer composition and its drawing
 * (rtlotqvy) must show against the page interface, the graph model, the
 * interaction state and the panel state it is wired to (ympqvvwr, qmsmvrnr,
 * noplrntp, yruxqknp).
 *
 * The page the panel serves is set up here and the page module is loaded into
 * it, so the check runs the composed page, not a stand-in.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { SELECTORS } from "../../src/webview/contract";
import type * as Main from "../../src/webview/main";

const PAGE = readFileSync("media/webview.html", "utf8");
const posted: unknown[] = [];
let main: typeof Main;

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

function records(): NodeRecord[] {
	return [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "rationale of aaaaaaaa" },
		},
		{
			id: "bbbbbbbb",
			kind: "evaluation",
			dependsOn: ["aaaaaaaa"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "rationale of bbbbbbbb" },
		},
	];
}

function box(id: string): HTMLElement | null {
	return document.querySelector(`[data-node-id="${id}"]`);
}

function click(element: Element): void {
	element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
	element.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
}

beforeAll(async () => {
	const parsed = new DOMParser().parseFromString(PAGE, "text/html");
	document.body.replaceChildren(
		...[...parsed.body.children].map((child) => document.adoptNode(child)),
	);
	Object.defineProperty(document.querySelector(SELECTORS.canvas), "clientWidth", { value: 800 });
	Object.defineProperty(document.querySelector(SELECTORS.canvas), "clientHeight", { value: 600 });
	(document.querySelector(SELECTORS.canvas) as unknown as { setPointerCapture(id: number): void }).setPointerCapture =
		() => undefined;
	(globalThis as unknown as Record<string, unknown>).acquireVsCodeApi = (): unknown => ({
		postMessage: (message: unknown): void => {
			posted.push(message);
		},
		getState: (): unknown => undefined,
		setState: (): void => undefined,
	});
	main = await import("../../src/webview/main");
});

describe("the composed page draws what the host hands it", () => {
	test("the page announces itself and the graph reaches it across the seam", () => {
		main.receive({ type: "graph", records: records(), labels: { aaaaaaaa: "the label" } });

		expect(posted).toContainEqual({ type: "ready" });
		expect(document.querySelectorAll("[data-node-id]")).toHaveLength(2);
		expect(box("aaaaaaaa")?.querySelector(".node__label")?.textContent).toBe("the label");
		expect(box("bbbbbbbb")?.querySelector(".node__label")?.textContent).toBe("bbbbbbbb");
	});

	test("the page composes the interface over the page's own regions", () => {
		main.receive({ type: "graph", records: records(), labels: {} });

		expect(document.querySelector(SELECTORS.surface)?.getAttribute("style")).toContain("transform");
		expect(document.querySelector(SELECTORS.fitAction)).not.toBeNull();
		expect(document.querySelector(SELECTORS.edges)).not.toBeNull();
	});

	test("the drawn node count is what the presentation is told about", () => {
		main.receive({ type: "graph", records: records(), labels: {} });

		expect(document.querySelector(".state-empty")).not.toBeNull();
		expect((document.querySelector(".state-empty") as HTMLElement).hidden).toBe(true);
	});
});

describe("the composed page runs the interaction against the drawn graph", () => {
	test("clicking a node shows its kind, its content and its rationale and reports the selection", () => {
		main.receive({ type: "graph", records: records(), labels: {} });
		posted.length = 0;

		click(box("bbbbbbbb")!);

		const detail = document.querySelector(SELECTORS.detailBody);
		expect(detail?.textContent).toContain("evaluation");
		expect(detail?.textContent).toContain("rationale of bbbbbbbb");
		expect(posted).toContainEqual({ type: "selection", id: "bbbbbbbb" });
	});

	test("a second graph swaps the data out from under the interaction without losing the selection", () => {
		main.receive({ type: "graph", records: records(), labels: {} });
		click(box("aaaaaaaa")!);

		main.receive({ type: "graph", records: records(), labels: {} });

		expect(box("aaaaaaaa")?.classList.contains("is-selected")).toBe(true);
		expect(document.querySelector(SELECTORS.detailBody)?.textContent).toContain(
			"rationale of aaaaaaaa",
		);
	});

	test("the fit action frames the graph in the viewport", () => {
		main.receive({ type: "graph", records: records(), labels: {} });
		document.querySelector(SELECTORS.canvas)?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 400, clientY: 400 }));
		document.querySelector(SELECTORS.canvas)?.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, button: 0, clientX: 500, clientY: 500 }));
		const panned = document.querySelector<HTMLElement>(SELECTORS.surface)?.style.transform;

		document.querySelector<HTMLButtonElement>(SELECTORS.fitAction)?.click();

		expect(document.querySelector<HTMLElement>(SELECTORS.surface)?.style.transform).not.toBe(panned);
	});
});

describe("the composed page presents the data states", () => {
	test("a read failure shows the message inline and keeps the graph on the canvas", () => {
		main.receive({ type: "graph", records: records(), labels: {} });
		const drawn = document.querySelectorAll("[data-node-id]").length;

		main.receive({ type: "error", message: "cannot read nodes/" });

		expect(document.querySelector(SELECTORS.banner)?.textContent).toBe("cannot read nodes/");
		expect((document.querySelector(SELECTORS.banner) as HTMLElement).hidden).toBe(false);
		expect(document.querySelectorAll("[data-node-id]")).toHaveLength(drawn);
	});
});
