// @vitest-environment jsdom
/**
 * Conformance check: what running the interaction emphasis (noplrntp) must
 * show for its visual-spec prerequisites (moklnvms, ortyupqp, ksywwktl,
 * ozxnxzus, xslqyywt, pztszkqs, qqmrtwor) and for the ordering prerequisite
 * (mrrooxux) to hold.
 *
 * The states are entered through the artifact's own operations and the
 * appearance they demand is read from the stylesheet that carries it.
 * ortyupqp (`stronger-highlight`, accent role), ozxnxzus (`focus-outline`) and
 * xslqyywt (`lifted-no-tooltip`) name a role or a state without fixing a token
 * or a value, so the check is deliberately structural there: it asserts that
 * the emphasis is applied and that the drag state suppresses the tooltip, and
 * asserts no token or exact styling for those three. mrrooxux orders the
 * selection's two emphases — the selected element bolder, the elements
 * connected to it quieter — so the check asserts that order as a relative
 * strength between the declarations that effectively reach the two sets (no
 * weaker boost and no narrower ring on the selection, one of the two strictly
 * stronger), not as a token, a metric or a colour. The values that are fixed
 * are asserted to them: the dim opacity (ksywwktl) and the accent and tooltip
 * tokens (qqmrtwor, pztszkqs).
 *
 * "Effectively reach" is taken literally: the check resolves the stylesheet
 * through its own cascade, so a later declaration of the same specificity
 * overrides an earlier one, an outline shorthand sets the width a later
 * longhand can override, and width media queries are evaluated at the base
 * viewport and at every width breakpoint the stylesheet itself declares. The
 * ordering must therefore also hold when a trailing override or a media
 * override is present, not only in the first rule that names a class.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";
import { attachInteractions } from "../../src/webview/interact";
import type { InteractionDelegate } from "../../src/webview/contract";
import { EmphasisClasses } from "../../src/webview/contract";

const CSS = readFileSync("src/styles/interact.css", "utf8");

/** The desktop viewport every non-conditional rule is read at. */
const BASE_VIEWPORT = 1024;

globalThis.ResizeObserver = class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

beforeEach(() => {
	document.body.replaceChildren();
});

// ---------------------------------------------------------------------------
// The stylesheet as a cascade. `styledRules` keeps each rule in source order
// with the media conditions enclosing it; `effectiveDeclarations` resolves,
// for one element and one viewport, which declaration of each property wins.
// ---------------------------------------------------------------------------

interface CssDeclaration {
	property: string;
	value: string;
	important: boolean;
}

interface StyledRule {
	selectors: string[];
	declarations: CssDeclaration[];
	/** The media conditions enclosing the rule, outermost first. */
	media: string[];
	/** Source order of the rule in the sheet. */
	order: number;
}

let parsedRules: StyledRule[] | null = null;

/** The stylesheet's rules, parsed through the browser's own CSSOM. */
function styledRules(): StyledRule[] {
	if (parsedRules !== null) {
		return parsedRules;
	}
	const styleElement = document.createElement("style");
	styleElement.textContent = CSS;
	document.head.append(styleElement);
	const sheet = styleElement.sheet;
	if (sheet === null) {
		throw new Error("src/styles/interact.css did not parse as a stylesheet");
	}
	const rules: StyledRule[] = [];
	let order = 0;
	const walk = (list: CSSRuleList, media: string[]): void => {
		for (const rule of Array.from(list)) {
			const styleRule = rule as CSSStyleRule;
			if (typeof styleRule.selectorText === "string") {
				const declarations: CssDeclaration[] = [];
				for (let index = 0; index < styleRule.style.length; index++) {
					const property = styleRule.style.item(index);
					declarations.push({
						property,
						value: styleRule.style.getPropertyValue(property),
						important: styleRule.style.getPropertyPriority(property) === "important",
					});
				}
				rules.push({
					selectors: splitTopLevel(styleRule.selectorText, ",").map((selector) => selector.trim()),
					declarations,
					media,
					order: order++,
				});
				continue;
			}
			const group = rule as CSSGroupingRule;
			if (group.cssRules !== undefined && group.cssRules !== null) {
				const mediaText = (rule as CSSMediaRule).media?.mediaText?.trim() ?? "";
				walk(group.cssRules, mediaText === "" ? media : [...media, mediaText]);
			}
		}
	};
	walk(sheet.cssRules, []);
	parsedRules = rules;
	return rules;
}

/** Splits on `delimiter` at the top level of parentheses and brackets. */
function splitTopLevel(text: string, delimiter: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let index = 0; index < text.length; index++) {
		const char = text[index];
		if (char === "(" || char === "[") {
			depth++;
		} else if (char === ")" || char === "]") {
			depth--;
		} else if (char === delimiter && depth === 0) {
			parts.push(text.slice(start, index));
			start = index + 1;
		}
	}
	parts.push(text.slice(start));
	return parts;
}

/**
 * Every viewport the order is read at: the base viewport plus each width
 * breakpoint the stylesheet declares, so a media override is evaluated at the
 * width where it applies instead of being skipped.
 */
let cachedViewports: number[] | null = null;

function orderViewports(): number[] {
	if (cachedViewports !== null) {
		return cachedViewports;
	}
	const widths = new Set<number>([BASE_VIEWPORT]);
	const widthFeature =
		/(?:max-width|min-width|width|max-device-width|min-device-width|device-width)\s*(?::|<=|>=|<|>)\s*([\d.]+)\s*(px|em|rem)?/g;
	for (const rule of styledRules()) {
		for (const media of rule.media) {
			for (const match of media.matchAll(widthFeature)) {
				widths.add(toPx(match[1]!, match[2]));
			}
		}
	}
	cachedViewports = Array.from(widths)
		.filter((width) => Number.isFinite(width) && width > 0)
		.sort((left, right) => left - right);
	return cachedViewports;
}

const EM_SIZE = 16;

function toPx(value: string, unit: string | undefined): number {
	return Number(value) * ((unit ?? "px") === "px" ? 1 : EM_SIZE);
}

function toPxValue(value: string): number | null {
	const match = /^([\d.]+)\s*(px|em|rem)?$/.exec(value.trim().toLowerCase());
	return match === null ? null : toPx(match[1]!, match[2]);
}

/** Whether a `media` condition holds at `width` (CSS pixels). */
function mediaApplies(condition: string, width: number): boolean {
	const query = condition.trim().toLowerCase();
	if (query === "") {
		return true;
	}
	return splitTopLevel(query, ",").some((part) => mediaPartApplies(part.trim(), width));
}

function mediaPartApplies(part: string, width: number): boolean {
	let text = part.trim();
	let negate = false;
	if (/^not\b/.test(text)) {
		negate = true;
		text = text.replace(/^not\b/, "").trim();
	}
	text = text.replace(/^only\b/, "").trim();

	let applies = true;
	const type = /^(all|screen|print|speech|tv|projection|handheld|braille|embossed)\b/.exec(text);
	if (type !== null) {
		applies = type[1] === "all" || type[1] === "screen";
		text = text.slice(type[0].length);
	}
	for (const feature of text.matchAll(/\(([^)]*)\)/g)) {
		applies = applies && featureApplies(feature[1]!.trim(), width);
	}
	return negate ? !applies : applies;
}

function featureApplies(feature: string, width: number): boolean {
	const colon = feature.indexOf(":");
	if (colon === -1) {
		const range = /^width\s*(<=|>=|<|>)\s*([\d.]+)\s*(px|em|rem)?$/.exec(feature);
		return range === null ? true : compareNumbers(width, range[1]!, toPx(range[2]!, range[3]));
	}
	const name = feature.slice(0, colon).trim().toLowerCase();
	const value = toPxValue(feature.slice(colon + 1));
	if (value === null) {
		// A feature this check does not model: treated as applying, so an
		// override cannot hide behind it.
		return true;
	}
	switch (name) {
		case "max-width":
		case "max-device-width":
			return width <= value;
		case "min-width":
		case "min-device-width":
			return width >= value;
		case "width":
		case "device-width":
			return width === value;
		default:
			return true;
	}
}

function compareNumbers(left: number, operator: string, right: number): boolean {
	switch (operator) {
		case "<=":
			return left <= right;
		case ">=":
			return left >= right;
		case "<":
			return left < right;
		case ">":
			return left > right;
		default:
			return true;
	}
}

type Specificity = [number, number, number];

function specificityOf(selector: string): Specificity {
	const source = selector.replace(/"[^"]*"|'[^']*'/g, "");
	const ids = (source.match(/#[\w-]+/g) ?? []).length;
	const classes = (source.match(/\.[\w-]+/g) ?? []).length;
	const attributes = (source.match(/\[[^\]]*\]/g) ?? []).length;
	const pseudoElements = (source.match(/::[\w-]+/g) ?? []).length;
	const pseudoClasses = (source.replace(/::[\w-]+/g, " ").match(/:(?!:)[\w-]+(?:\([^)]*\))?/g) ?? []).length;
	const types = (
		source
			.replace(/#[\w-]+/g, " ")
			.replace(/\.[\w-]+/g, " ")
			.replace(/\[[^\]]*\]/g, " ")
			.replace(/::[\w-]+/g, " ")
			.replace(/:[^(\s]+(?:\([^)]*\))?/g, " ")
			.match(/(^|[\s>+~])([a-z][\w-]*)/gi) ?? []
	).length;
	return [ids, classes + attributes + pseudoClasses, types + pseudoElements];
}

function compareSpecificity(left: Specificity, right: Specificity): number {
	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index]) {
			return left[index]! - right[index]!;
		}
	}
	return 0;
}

/** The specificity of the most specific selector of the rule that matches. */
function matchingSpecificity(element: Element, selectors: string[]): Specificity | null {
	let best: Specificity | null = null;
	for (const selector of selectors) {
		let matches = false;
		try {
			matches = element.matches(selector);
		} catch {
			// A selector the DOM cannot match (e.g. one the parser reduces to
			// nothing) does not reach the element.
			matches = false;
		}
		if (!matches) {
			continue;
		}
		const specificity = specificityOf(selector);
		if (best === null || compareSpecificity(specificity, best) > 0) {
			best = specificity;
		}
	}
	return best;
}

interface Winner {
	specificity: Specificity;
	order: number;
	important: boolean;
	value: string;
}

/**
 * The winning declaration of every property on `element` at `width`, after the
 * cascade: importance first, then specificity, then source order (a later
 * same-specificity declaration wins).
 */
function effectiveDeclarations(element: Element, width: number): Map<string, string> {
	const winners = new Map<string, Winner>();
	for (const rule of styledRules()) {
		if (!rule.media.every((condition) => mediaApplies(condition, width))) {
			continue;
		}
		const specificity = matchingSpecificity(element, rule.selectors);
		if (specificity === null) {
			continue;
		}
		for (let index = 0; index < rule.declarations.length; index++) {
			const declaration = rule.declarations[index]!;
			for (const [property, value] of expandDeclaration(declaration)) {
				const candidate: Winner = {
					specificity,
					order: rule.order * 1000 + index,
					important: declaration.important,
					value,
				};
				const current = winners.get(property);
				if (current === undefined || winsOver(candidate, current)) {
					winners.set(property, candidate);
				}
			}
		}
	}
	return new Map(Array.from(winners, ([property, winner]) => [property, winner.value]));
}

/**
 * Expands the shorthands that matter to the emphasis. The `outline` shorthand
 * sets the width (and resets it), so a trailing `outline: …` must override an
 * earlier `outline-width` and vice versa.
 */
function expandDeclaration(declaration: CssDeclaration): Array<[string, string]> {
	if (declaration.property === "outline") {
		return [
			["outline-width", outlineWidthValue(declaration.value)],
			["outline-style", outlineStyleValue(declaration.value)],
		];
	}
	return [[declaration.property, declaration.value]];
}

function winsOver(candidate: Winner, current: Winner): boolean {
	if (candidate.important !== current.important) {
		return candidate.important;
	}
	const bySpecificity = compareSpecificity(candidate.specificity, current.specificity);
	if (bySpecificity !== 0) {
		return bySpecificity > 0;
	}
	return candidate.order >= current.order;
}

/** The width an `outline` shorthand gives `outline-width`. */
function outlineWidthValue(value: string): string {
	const text = value.trim().toLowerCase();
	if (text === "none" || text === "0" || text === "0px") {
		return "0px";
	}
	const length = /(?:^|\s)([\d.]+)(px|em|rem)(?=\s|$)/.exec(text);
	if (length !== null) {
		return `${length[1]}${length[2]}`;
	}
	const keyword = /(?:^|\s)(thin|medium|thick)(?=\s|$)/.exec(text);
	return keyword === null ? "0px" : keyword[1]!;
}

/**
 * The style an `outline` shorthand gives `outline-style`. An omitted style is
 * the initial `none`, so the ring is not drawn even when a width is set.
 */
function outlineStyleValue(value: string): string {
	const text = value.trim().toLowerCase();
	const style = /(?:^|\s)(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|auto)(?=\s|$)/.exec(text);
	return style === null ? "none" : style[1]!;
}

/** The brightness/contrast/saturate multiplier of a `filter` value (1 when none). */
function boostOf(filter: string | undefined): number {
	if (filter === undefined || filter.trim() === "" || filter.trim() === "none") {
		return 1;
	}
	let boost = 1;
	for (const match of filter.matchAll(/(?:brightness|contrast|saturate)\(\s*([\d.]+)(%?)\s*\)/g)) {
		boost *= Number(match[1]) / (match[2] === "%" ? 100 : 1);
	}
	return boost;
}

/** The width in pixels of the ring the declarations draw (0 when none). */
function ringWidth(value: string | undefined): number {
	if (value === undefined) {
		return 0;
	}
	const text = value.trim().toLowerCase();
	if (text === "" || text === "none") {
		return 0;
	}
	if (text === "thin") {
		return 1;
	}
	if (text === "medium") {
		return 3;
	}
	if (text === "thick") {
		return 5;
	}
	const match = /([\d.]+)\s*(px|em|rem)?/.exec(text);
	return match === null ? 0 : toPx(match[1]!, match[2]);
}

interface Emphasis {
	/** The brightness/contrast/saturate multiplier that reaches the element. */
	boost: number;
	/** The outline width that reaches the element. */
	ring: number;
	/** Whether any emphasis at all reaches the element. */
	emphasised: boolean;
}

function emphasisOf(element: Element, width: number): Emphasis {
	const declarations = effectiveDeclarations(element, width);
	const filter = declarations.get("filter");
	const style = declarations.get("outline-style");
	const ring = style === undefined || style.trim() === "none" ? 0 : ringWidth(declarations.get("outline-width"));
	return {
		boost: boostOf(filter),
		ring,
		emphasised:
			(filter !== undefined && filter.trim() !== "none") ||
			ring > 0 ||
			declarations.has("border-color") ||
			declarations.has("border") ||
			declarations.has("box-shadow"),
	};
}

/** Asserts the order mrrooxux states: `stronger` is bolder than `quieter`. */
function expectBolder(stronger: Emphasis, quieter: Emphasis, label: string): void {
	expect(stronger.boost, `${label}: the quieter element brightens more than the selection`).toBeGreaterThanOrEqual(
		quieter.boost,
	);
	expect(stronger.ring, `${label}: the quieter element rings wider than the selection`).toBeGreaterThanOrEqual(
		quieter.ring,
	);
	expect(
		stronger.boost > quieter.boost || stronger.ring > quieter.ring,
		`${label}: the selection is not strictly stronger in boost or ring`,
	).toBe(true);
}

function rule(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(CSS);
	if (match === null) {
		throw new Error(`no rule for ${selector}`);
	}
	return match[1]!;
}

function pointer(type: string, init: { pointerId?: number; clientX?: number; clientY?: number }): MouseEvent {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		clientX: init.clientX ?? 0,
		clientY: init.clientY ?? 0,
	});
	Object.defineProperty(event, "pointerId", { value: init.pointerId ?? 1 });
	return event;
}

function setup() {
	const canvas = document.createElement("main");
	canvas.className = "canvas";
	const surface = document.createElement("div");
	surface.className = "canvas__surface";
	const edges = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const nodes = document.createElement("div");
	surface.append(edges, nodes);
	canvas.append(surface);
	document.body.append(canvas);
	Object.defineProperty(canvas, "clientWidth", { value: 800 });
	Object.defineProperty(canvas, "clientHeight", { value: 600 });
	(canvas as unknown as { setPointerCapture(id: number): void }).setPointerCapture = () => undefined;

	const records: NodeRecord[] = [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "a" },
		},
		{
			id: "bbbbbbbb",
			kind: "decision",
			dependsOn: ["aaaaaaaa"],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "b" },
		},
		{
			id: "eeeeeeee",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "e" },
		},
	];
	const model = buildGraph(records);
	const order = graphOrder(model);
	const view = { canvas, surface };
	const delegate: InteractionDelegate = {
		relayout(dragged) {
			const layout = layoutGraph(model, order, { dragged });
			renderGraph({ edges, nodes }, { model, order, layout, labels: new Map() });
			return layout;
		},
		onSelectionChanged() {},
		openNodeDocument() {},
	};
	const controller = attachInteractions(view, delegate, { model, order });
	const box = (id: string): HTMLElement => nodes.querySelector(`[data-node-id="${id}"]`) as HTMLElement;

	return { canvas, nodes, controller, box };
}

describe("the selection emphasis (ortyupqp, qqmrtwor, ksywwktl)", () => {
	test("a selected node takes the accent emphasis and the unrelated elements dim", () => {
		const page = setup();

		page.controller.select("aaaaaaaa");

		// ortyupqp: the selected node is emphasised ...
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.selected)).toBe(true);
		// ksywwktl: ... and the elements unrelated to the selection dim ...
		expect(page.box("eeeeeeee").classList.contains(EmphasisClasses.dimmed)).toBe(true);
		// ortyupqp: the selection's emphasis is the accent role, and the
		// declaration that reaches the selected element carries it ...
		expect(effectiveDeclarations(page.box("aaaaaaaa"), BASE_VIEWPORT).get("border-color")).toContain(
			"var(--accent)",
		);
		// qqmrtwor: ... which is the workbench focus colour.
		expect(CSS).toContain("--accent: var(--vscode-focusBorder)");
		// ksywwktl: the dim is 0.3 opacity.
		expect(rule(".is-dimmed")).toContain("0.3");
	});
});

describe("the two-level emphasis of a selection (mrrooxux, moklnvms)", () => {
	test("the selected element is bolder than the elements connected to it", () => {
		const page = setup();
		page.controller.select("aaaaaaaa");

		// kwovtsuv, ltrnmrsr: the elements connected to the selection carry
		// their own emphasis class ...
		const selected = page.box("aaaaaaaa");
		const related = page.box("bbbbbbbb");
		expect(selected.classList.contains(EmphasisClasses.selected)).toBe(true);
		expect(related.classList.contains(EmphasisClasses.related)).toBe(true);

		// ... and so do the hovered neighbourhood's elements (moklnvms).
		const hoverPage = setup();
		hoverPage.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));
		const hovered = hoverPage.box("aaaaaaaa");
		expect(hovered.classList.contains(EmphasisClasses.hoverNeighbour)).toBe(true);

		// The order is read from the declarations that effectively reach each
		// element, at every viewport the stylesheet conditions on.
		for (const width of orderViewports()) {
			const selection = emphasisOf(selected, width);
			const connected = emphasisOf(related, width);
			const neighbourhood = emphasisOf(hovered, width);

			// moklnvms: the connected and hovered elements stay emphatic — the
			// quieter side of the cue — ...
			expect(connected.emphasised, `related element is emphatic at ${width}px`).toBe(true);
			expect(neighbourhood.emphasised, `hover neighbour is emphatic at ${width}px`).toBe(true);

			// mrrooxux: ... while the selected element takes the bolder emphasis.
			// The check reads the order structurally: neither the boost nor the
			// ring reaching the connected set outranks the selection's ...
			expectBolder(selection, connected, `selected vs related at ${width}px`);
			expectBolder(selection, neighbourhood, `selected vs hover neighbour at ${width}px`);
			// ... and the selection is strictly stronger in at least one of them.
			// No multiplier, width or colour is fixed here; only that order.
		}
	});
});

describe("the hover, focus and drag emphasis (moklnvms, ozxnxzus, xslqyywt)", () => {
	test("the hovered neighbourhood takes the supporting emphasis", () => {
		const page = setup();

		page.box("bbbbbbbb").dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20 }));

		// moklnvms: hovering shows the local neighbourhood — the associated
		// nodes take the hover emphasis ...
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.hoverNeighbour)).toBe(true);
		// ... which the stylesheet renders as an emphasis (the ordering against
		// the selection is checked above; no value is fixed here).
		for (const width of orderViewports()) {
			expect(
				emphasisOf(page.box("aaaaaaaa"), width).emphasised,
				`hover neighbour is emphatic at ${width}px`,
			).toBe(true);
		}
	});

	test("keyboard focus rings the node it is on", () => {
		const page = setup();

		page.controller.focusNode("bbbbbbbb");

		// ozxnxzus: the focused node is emphasised ...
		expect(page.box("bbbbbbbb").classList.contains(EmphasisClasses.focus)).toBe(true);
		// ... with a visible focus outline (the role names no token).
		expect(rule(".is-focus")).toContain("outline");
	});

	test("a node being dragged is lifted, with no tooltip", () => {
		const page = setup();
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 40 }));
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(false);

		page.box("aaaaaaaa").dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 40 }));
		page.box("aaaaaaaa").dispatchEvent(pointer("pointermove", { clientX: 160, clientY: 40 }));

		// xslqyywt: the dragged node is lifted ...
		expect(page.box("aaaaaaaa").classList.contains(EmphasisClasses.dragging)).toBe(true);
		expect(rule(".is-dragging")).toContain("z-index");
		// ... and shows no tooltip.
		expect((document.querySelector(".tooltip") as HTMLElement | null)?.hidden).toBe(true);
	});
});

describe("the tooltip surface (pztszkqs)", () => {
	test("the tooltip floats on the workbench widget surface", () => {
		// pztszkqs: the tooltip surface is the editor widget background.
		expect(CSS).toContain("--tooltip-surface: var(--vscode-editorWidget-background)");
	});
});
