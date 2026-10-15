// @vitest-environment jsdom
/**
 * Conformance check: what running the loading, empty and error presentation
 * (yruxqknp) must show for its visual-spec prerequisites (vmruuytr, utyvzkwu,
 * utzyzwmu, xlqppmkn) to hold.
 *
 * The presentation is attached to elements built here and the appearance it
 * demands is read from the stylesheet that carries it. vmruuytr
 * (`progress-indicator`, no markup), utyvzkwu (`empty-state-message`, no text)
 * and utzyzwmu (`inline-error-banner`, its colour role `error-surface` named,
 * the token in xlqppmkn) name their elements without pinning markup, text or
 * token, so the check is deliberately structural there: it asserts presence,
 * the `role`, the overlay that lets queued input through, and that the banner
 * stays inline, and asserts no markup, text or token for those three. xlqppmkn
 * pins the error-surface token, and only that is asserted to it. The
 * presentation is imported for its entry point only (attachStates): none of
 * its constants is asserted back.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { attachStates } from "../../src/webview/states";

const CSS = readFileSync("src/styles/states.css", "utf8");

function declarations(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escaped}[^,{]*\\{([^}]*)\\}`).exec(CSS);
	if (match === null) {
		throw new Error(`no rule for ${selector}`);
	}
	return match[1]!;
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

describe("the loading state (vmruuytr)", () => {
	test("a progress indicator overlays the canvas while the data loads", () => {
		const elements = view();
		const states = attachStates(elements);

		states.beginLoading();

		// vmruuytr: element canvas, aspect overlay, state loading — a progress
		// indicator is shown. The spec pins no markup, so only its presence,
		// its role and its placement on the canvas are checked.
		const progress = elements.canvas.querySelector(".state-progress");
		expect(progress).not.toBeNull();
		expect((progress as HTMLElement).hidden).toBe(false);
		expect(progress?.getAttribute("role")).toBe("status");
	});

	test("the overlay takes no pointer input, so interaction carries on underneath", () => {
		// vmruuytr: the indicator is an overlay (note: input queued per
		// ywullzun), so it has no surface of its own and lets pointer input
		// reach the canvas under it.
		expect(declarations(".state-progress")).toContain("pointer-events: none");
	});

	test("the indicator goes when the load finishes", () => {
		const elements = view();
		const states = attachStates(elements);
		states.beginLoading();

		states.loaded(4);

		// vmruuytr: the indicator belongs to the loading state only.
		expect((elements.canvas.querySelector(".state-progress") as HTMLElement).hidden).toBe(true);
	});
});

describe("the empty state (utyvzkwu)", () => {
	test("the message stands in for a blank canvas when there are no nodes", () => {
		const elements = view();
		const states = attachStates(elements);

		states.loaded(0);

		// utyvzkwu: element canvas, aspect content, state empty — an empty-state
		// message is on the canvas. The spec pins no text, so only its
		// presence, its role and its placement on the canvas are checked.
		const empty = elements.canvas.querySelector(".state-empty");
		expect(empty).not.toBeNull();
		expect((empty as HTMLElement).hidden).toBe(false);
		expect(empty?.getAttribute("role")).toBe("status");
	});

	test("the message sits on the canvas without taking its input", () => {
		// utyvzkwu: the message is canvas content, not a surface of its own, so
		// it takes no pointer input and the canvas stays interactive under it.
		expect(declarations(".state-empty")).toContain("pointer-events: none");
	});

	test("the message goes as soon as there are nodes again", () => {
		const elements = view();
		const states = attachStates(elements);
		states.loaded(0);

		states.loaded(1);

		// utyvzkwu: the message belongs to the empty state only.
		expect((elements.canvas.querySelector(".state-empty") as HTMLElement).hidden).toBe(true);
	});
});

describe("the error state (utzyzwmu, xlqppmkn)", () => {
	test("the message is shown in the panel/banner region, inline", () => {
		const elements = view();
		const states = attachStates(elements);

		states.failed("cannot read nodes/");

		// utzyzwmu: element panel/banner, aspect emphasis, state error — the
		// message is shown in the banner region ...
		expect(elements.banner.textContent).toBe("cannot read nodes/");
		expect(elements.banner.hidden).toBe(false);
		const error = elements.banner.querySelector(".state-error");
		expect(error).not.toBeNull();
		expect(error?.getAttribute("role")).toBe("alert");
	});

	test("the banner carries the error surface and stays inline", () => {
		const surface = declarations(".state-error");

		// utzyzwmu: the banner is on the error-surface colour role ...
		expect(surface).toContain("var(--error-surface)");
		// xlqppmkn: ... whose token is the workbench validation background.
		expect(CSS).toContain("--error-surface: var(--vscode-inputValidation-errorBackground)");
		// utzyzwmu: the banner is inline — the error does not replace or block
		// the canvas it sits below — so it is not taken out of the flow.
		expect(surface).not.toContain("position: fixed");
		expect(surface).not.toContain("position: absolute");
	});
});
