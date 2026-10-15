// @vitest-environment jsdom
/**
 * Conformance check: what running the presentation of the loading, empty and
 * error states (yruxqknp) must show for its visual-spec prerequisites
 * (vmruuytr, utyvzkwu, utzyzwmu, xlqppmkn) to hold.
 *
 * The presentation is attached to elements built here and the appearance it
 * demands is read from the stylesheet that carries it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { attachStates, EMPTY_STATE_MESSAGE, LOADING_LABEL } from "../../src/webview/states";

const CSS = readFileSync("src/styles/states.css", "utf8");
const PAGE = readFileSync("media/webview.html", "utf8");

function declarations(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escaped}[^,{]*\\{([^}]*)\\}`).exec(CSS);
	if (match === null) {
		throw new Error(`no rule for ${selector}`);
	}
	return match[1]!;
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

describe("the loading state", () => {
	test("a progress indicator overlays the canvas while the data loads", () => {
		const elements = view();
		const states = attachStates(elements);

		states.beginLoading();

		const progress = elements.canvas.querySelector(".state-progress");
		expect(progress).not.toBeNull();
		expect((progress as HTMLElement).hidden).toBe(false);
		expect(progress?.getAttribute("role")).toBe("status");
		expect(progress?.getAttribute("aria-label")).toBe(LOADING_LABEL);
	});

	test("the indicator takes no pointer input, so interaction carries on underneath", () => {
		expect(declarations(".state-progress")).toContain("pointer-events: none");
		expect(CSS).toContain("--progress: var(--vscode-progressBar-background)");
		expect(elementsProgressBar()).toContain("var(--progress)");
	});

	test("the indicator goes when the load finishes", () => {
		const elements = view();
		const states = attachStates(elements);
		states.beginLoading();

		states.loaded(4);

		expect((elements.canvas.querySelector(".state-progress") as HTMLElement).hidden).toBe(true);
	});
});

describe("the empty state", () => {
	test("the message stands in for a blank canvas when there are no nodes", () => {
		const elements = view();
		const states = attachStates(elements);

		states.loaded(0);

		const empty = elements.canvas.querySelector(".state-empty");
		expect(empty?.textContent).toBe(EMPTY_STATE_MESSAGE);
		expect((empty as HTMLElement).hidden).toBe(false);
		expect(declarations(".state-empty")).toContain("pointer-events: none");
	});

	test("the message goes as soon as there are nodes again", () => {
		const elements = view();
		const states = attachStates(elements);
		states.loaded(0);

		states.loaded(1);

		expect((elements.canvas.querySelector(".state-empty") as HTMLElement).hidden).toBe(true);
	});
});

describe("the error state", () => {
	test("the message is shown inline, in the region below the toolbar of the page", () => {
		const document = new DOMParser().parseFromString(PAGE, "text/html");
		const regions = [...document.querySelectorAll("[class]")].map((element) =>
			element.getAttribute("class"),
		);
		expect(regions.indexOf("panel__toolbar")).toBeLessThan(regions.indexOf("panel__banner"));

		const elements = view();
		const states = attachStates(elements);
		states.failed("cannot read nodes/");

		expect(elements.banner.textContent).toBe("cannot read nodes/");
		expect(elements.banner.hidden).toBe(false);
		expect(elements.banner.querySelector(".state-error")?.getAttribute("role")).toBe("alert");
	});

	test("the banner carries the error surface role and stays inline", () => {
		const surface = declarations(".state-error");

		expect(surface).toContain("var(--error-surface)");
		expect(CSS).toContain("--error-surface: var(--vscode-inputValidation-errorBackground)");
		expect(surface).not.toContain("position: fixed");
		expect(surface).not.toContain("position: absolute");
	});
});

function elementsProgressBar(): string {
	return declarations(".state-progress-bar");
}
