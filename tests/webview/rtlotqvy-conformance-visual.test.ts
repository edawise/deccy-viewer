// @vitest-environment jsdom
/**
 * Conformance check: what the viewer's static visual grammar and its drawing
 * (rtlotqvy) must show for its visual-spec prerequisites (mstmuwtk, mnovnnot,
 * vlvmrkzr, sullyqzs, twotxvqp, rwxywllw, otyqzpxn, ymnkpuvl, znzkwlnz,
 * npytqytq, mnwxnyks, oqotyplt, qpmyylwo, tyvynnqo, owtptzpl, ptvkwmym,
 * utzrtvwy, sszrrpwn, wtywxppt) and for the presentation of a listed id
 * (mwwxxzyk, tvoouwkn, rqrlnzny, qnmuwwvw, vvzptxmz, mplxzxnm, kpkstnps,
 * sqwusxql) and of a ref-path entry (squvoxyr, xntonlmp, plkskmxu, slksrtvm,
 * oolrzkvl, ppkkmxxu) to hold.
 *
 * The grammar is the stylesheet and the drawing is the renderer's own markup,
 * drawn here on a fixture canvas so both halves of the promise are observed
 * together. Every fixed value is a literal of its record — no constant of the
 * grammar or the renderer is imported as an expected value. The page shell and
 * the toolbar are not read: they are not the renderer's subject. The entries
 * the detail panel lists are read through the one class vocabulary the
 * stylesheet shares with the panel — "detail__entry" and
 * "detail__entry--inert" for a listed id, "detail__ref" for a listed path —
 * quoted here exactly as the vocabulary fixes them. Which markup element emits
 * a class, and what activating an entry does, are not read: the class is the
 * name the stylesheet's rules are read through.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import { renderGraph } from "../../src/webview/render";

const CSS = readFileSync("src/styles/grammar.css", "utf8");
const SVG_NS = "http://www.w3.org/2000/svg";

/** The declarations of the rule whose selector is exactly `selector`. */
function declarations(selector: string): string {
	const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g);
	for (const rule of rules) {
		const selectors = rule[1]!.split(",").map((part) => part.trim());
		if (selectors.includes(selector)) {
			return rule[2]!;
		}
	}
	throw new Error(`no rule for ${selector}`);
}

/*
 * The listed entry (sqwusxql) is read through the stylesheet's own rules: the
 * stylesheet is parsed once, a class name is matched as a whole name so that
 * `.detail__entry` never picks up `.detail__entry--inert`, and a declared
 * value is expanded to the colour role it names through the custom properties
 * the stylesheet declares at the root — the role the record fixes, never a
 * literal.
 */

const SOURCE = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

/** One rule of the stylesheet, with its comment-free selectors and body. */
interface StyleRule {
	selectors: string[];
	body: string;
}

const RULES: StyleRule[] = [...SOURCE.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((rule) => ({
	selectors: (rule[1] ?? "").split(",").map((part) => part.trim()),
	body: rule[2] ?? "",
}));

/** The custom properties the stylesheet declares at the document root. */
const ROOT = new Map<string, string>(
	[
		...((RULES.find((rule) => rule.selectors.includes(":root"))?.body ?? "").matchAll(
			/(--[\w-]+)\s*:\s*([^;]+);/g,
		)),
	].map((declaration) => [declaration[1] ?? "", declaration[2]?.trim() ?? ""]),
);

/** A declared value with the stylesheet's own custom properties expanded and its spaces dropped. */
function resolved(value: string): string {
	let current = value;
	for (let pass = 0; pass < 8; pass += 1) {
		const expanded = current.replace(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name: string) =>
			ROOT.has(name) ? ROOT.get(name)! : whole,
		);
		if (expanded === current) {
			break;
		}
		current = expanded;
	}
	return current.replace(/\s+/g, "");
}

/** The value one rule declares for `property`, if it declares it. */
function declared(body: string, property: string): string | undefined {
	for (const declaration of body.split(";")) {
		const separator = declaration.indexOf(":");
		if (separator > 0 && declaration.slice(0, separator).trim() === property) {
			return declaration.slice(separator + 1).trim();
		}
	}
	return undefined;
}

/** Every value the rules declare for any of `properties`, expanded to the role each names. */
function values(rules: StyleRule[], ...properties: string[]): string[] {
	return rules.flatMap((rule) =>
		properties.flatMap((property) => {
			const value = declared(rule.body, property);
			return value === undefined ? [] : [resolved(value)];
		}),
	);
}

/** The rules whose selector list selects `className` as a whole class name. */
function classRules(className: string): StyleRule[] {
	const classSelector = new RegExp(`\\.${className}(?![\\w-])`);
	return RULES.filter((rule) => rule.selectors.some((selector) => classSelector.test(selector)));
}

/**
 * The rules that select `className`: with `state`, only those whose selector
 * puts the entry in that state (`:hover`, `:focus`); without it, only those of
 * the entry's resting selector, which carries no pseudo-class at all.
 */
function entryRules(className: string, state?: RegExp): StyleRule[] {
	const classSelector = new RegExp(`\\.${className}(?![\\w-])`);
	return classRules(className).filter((rule) =>
		rule.selectors.some(
			(selector) => classSelector.test(selector) && (state ? state.test(selector) : !selector.includes(":")),
		),
	);
}

/**
 * The class names the stylesheet shares with the panel, each one name in full:
 * the listed entry's two (sqwusxql) and the ref-path entry's one (ppkkmxxu).
 */
const ENTRY = "detail__entry";
const INERT = "detail__entry--inert";
const REF = "detail__ref";

/** The two canvas layers the renderer draws into. */
interface Fixture {
	edges: SVGSVGElement;
	nodes: HTMLElement;
}

/** A canvas the renderer can draw into, without the page shell around it. */
function canvas(): Fixture {
	const edges = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
	const nodes = document.createElement("div");
	document.body.replaceChildren(edges, nodes);
	return { edges, nodes };
}

function records(): NodeRecord[] {
	return [
		{
			id: "aaaaaaaa",
			kind: "decision",
			dependsOn: [],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "a" },
		},
		{
			id: "bbbbbbbb",
			kind: "evaluation",
			dependsOn: ["aaaaaaaa", "dddddddd"],
			evaluates: ["aaaaaaaa"],
			content: { type: "test", ref: ["t"], rationale: "b" },
		},
	];
}

/** Draw the graph into a fresh canvas and return where it was drawn. */
function draw(): Fixture {
	const target = canvas();
	const model = buildGraph(records());
	const order = graphOrder(model);
	const layout = layoutGraph(model, order);
	renderGraph(target, { model, order, layout, labels: new Map() });
	return target;
}

describe("the panel chrome the grammar fixes (mstmuwtk)", () => {
	test("the detail region sits beside the canvas and stacks below it under 600px", () => {
		// mstmuwtk: the panel stays usable at small sizes — the detail is a
		// column beside the canvas and stacks below it under 600px width.
		expect(declarations(".panel__body")).toContain("grid-template-columns");
		expect(CSS).toMatch(/@media \(max-width: 599\.98px\)/);
	});
});

describe("the colour roles the records name (znzkwlnz, npytqytq, mnwxnyks, oqotyplt, qpmyylwo, tyvynnqo)", () => {
	test("the canvas takes the surface role", () => {
		// znzkwlnz: the canvas blends with the editor surface.
		expect(CSS).toContain("--surface: var(--vscode-editor-background)");
		expect(declarations(".canvas")).toContain("var(--surface)");
	});

	test("the label and the detail take the text role and the secondary label the muted one", () => {
		// npytqytq: node/label and panel/detail take the editor foreground.
		expect(CSS).toContain("--text: var(--vscode-editor-foreground)");
		expect(declarations(".node")).toContain("var(--text)");
		expect(declarations(".panel__detail")).toContain("var(--text)");
		// mnwxnyks: node/label-secondary takes the description foreground.
		expect(CSS).toContain("--muted: var(--vscode-descriptionForeground)");
		expect(declarations(".node__label-secondary")).toContain("var(--muted)");
	});

	test("the two edge kinds take their own colour roles", () => {
		// oqotyplt: edge/depends_on takes the textLink role.
		expect(CSS).toContain("--edge: var(--vscode-textLink-foreground)");
		expect(declarations(".edge--depends_on")).toContain("var(--edge)");
		// qpmyylwo: edge/evaluates takes the charts-purple role.
		expect(CSS).toContain("--edge-alt: var(--vscode-charts-purple)");
		expect(declarations(".edge--evaluates")).toContain("var(--edge-alt)");
		// tyvynnqo: edge/unresolved takes the warning role.
		expect(CSS).toContain("--warning: var(--vscode-charts-red)");
		expect(declarations(".edge--unresolved")).toContain("var(--warning)");
	});
});

describe("the node boxes the grammar fixes (owtptzpl, ptvkwmym, sullyqzs, twotxvqp, utzrtvwy)", () => {
	test("a box is 240px wide and at least 72px tall, and its label wraps inside", () => {
		// owtptzpl: every node box is 240px wide and min 72px tall, with the
		// label wrapping inside the box.
		expect(declarations(".node")).toContain("240px");
		expect(declarations(".node")).toContain("72px");
		expect(declarations(".node__label")).toContain("overflow-wrap");
	});

	test("a decision is a rectangle and an evaluation a rounded one, with the fixed radii", () => {
		// sullyqzs: a decision is a rectangle; twotxvqp: an evaluation is a
		// rounded rectangle; ptvkwmym: the radii are 2px and 8px.
		expect(declarations(".node--decision")).toContain("border-radius: 2px");
		expect(declarations(".node--evaluation")).toContain("border-radius: 8px");
		expect(declarations(".node--evaluation")).not.toBe(declarations(".node--decision"));
	});

	test("the label is 13px", () => {
		// utzrtvwy: the node label is 13px, inheriting the workbench family.
		expect(declarations(".node__label")).toContain("13px");
	});

	test("every drawn box is measured, so a wrapped label can grow it past the minimum", () => {
		const target = canvas();
		const model = buildGraph(records());
		const order = graphOrder(model);
		const layout = layoutGraph(model, order);
		const heights = renderGraph(target, { model, order, layout, labels: new Map() });

		// owtptzpl: the label wraps inside the box and may grow it past the
		// minimum, so the renderer measures every box it drew.
		expect([...heights.keys()].sort()).toEqual([...order.ids].sort());
	});
});

describe("the edges the grammar fixes (rwxywllw, otyqzpxn, ymnkpuvl, mnovnnot, vlvmrkzr, sszrrpwn, wtywxppt)", () => {
	test("the edge kinds are distinct strokes and the unresolved one is marked", () => {
		const dependsOn = declarations(".edge--depends_on");
		const evaluates = declarations(".edge--evaluates");
		const unresolved = declarations(".edge--unresolved");

		// rwxywllw: a depends_on edge is solid ...
		expect(dependsOn).toContain("stroke-dasharray: none");
		// otyqzpxn: ... an evaluates edge is dashed ...
		expect(evaluates).toContain("stroke-dasharray");
		expect(evaluates).not.toContain("stroke-dasharray: none");
		// ymnkpuvl: ... and an unresolved edge is dotted, visibly apart.
		expect(unresolved).toContain("stroke-dasharray");
		expect(unresolved).not.toContain("stroke-dasharray: none");
		expect(unresolved).not.toBe(dependsOn);
	});

	test("every edge carries one 8px arrowhead at its child end", () => {
		const target = draw();
		const model = buildGraph(records());

		// mnovnnot: every edge runs from the parent end to the child end;
		// vlvmrkzr: the single arrowhead sits at the child end — the route's end
		// carries the marker.
		const drawn = [...target.edges.querySelectorAll("path.edge")];
		expect(drawn).toHaveLength(model.edges.length);
		for (const edge of drawn) {
			expect(edge.getAttribute("marker-end")).toMatch(/^url\(#arrowhead-/);
		}
		// sszrrpwn: the arrowhead is 8px.
		const markers = [...target.edges.querySelectorAll("marker")];
		expect(markers).toHaveLength(3);
		for (const marker of markers) {
			expect(marker.getAttribute("markerWidth")).toBe("8");
			expect(marker.getAttribute("markerHeight")).toBe("8");
		}
	});

	test("every interactive element keeps a hit target of the fixed size", () => {
		// wtywxppt: every interactive element is at least 24px, so precision
		// never decides whether an edge can be reached.
		expect(declarations(".edge__hit")).toContain("24px");
		expect(declarations(".edge__hit")).toContain("pointer-events: stroke");
		expect(declarations(".node")).toContain("min-width: 24px");
	});
});

describe("the listed entry, read through its two classes (sqwusxql, mwwxxzyk, tvoouwkn, rqrlnzny, qnmuwwvw, vvzptxmz, mplxzxnm, kpkstnps)", () => {
	test("the stylesheet's entry rules select the two fixed class names and multiply neither", () => {
		// sqwusxql: the panel marks each listed entry "detail__entry" (its id
		// names a node) or "detail__entry--inert" (it names none), and the
		// stylesheet's rules select those two classes. The names are exactly as
		// fixed: no third name is spelled out of them, and the inert name is one
		// class in full rather than a modifier applied beside the other.
		expect(classRules(ENTRY).length, "a rule selects .detail__entry").toBeGreaterThan(0);
		expect(classRules(INERT).length, "a rule selects .detail__entry--inert").toBeGreaterThan(0);
		expect([...new Set(SOURCE.match(/\.detail__entry[\w-]*/g) ?? [])].sort()).toEqual([
			".detail__entry",
			".detail__entry--inert",
		]);
	});

	test("an entry that names a node is drawn in the link colour role (tvoouwkn)", () => {
		// mwwxxzyk presents a listed id as a visible link; tvoouwkn spends the
		// recorded link colour role on that entry's text rather than a colour
		// chosen here, so the resting entry resolves to the token the record
		// names.
		expect(values(entryRules(ENTRY), "color"), "a resting .detail__entry rule declares the link colour role").toEqual(
			expect.arrayContaining([expect.stringContaining("var(--vscode-textLink-foreground")]),
		);
	});

	test("an entry that names a node shows the pointer cursor (rqrlnzny)", () => {
		// rqrlnzny: the pointer is the hand over a listed id that names a node,
		// and the cue is the entry's own — no class in the stylesheet may carry
		// it elsewhere.
		expect(values(classRules(ENTRY), "cursor"), "the entry that names a node takes the pointer cursor").toContain(
			"pointer",
		);
	});

	test("an entry that names a node is underlined while the pointer rests over it (qnmuwwvw)", () => {
		// qnmuwwvw: the hover state of the link marks the id's characters with an
		// underline, so the underline is read off the hovered entry and not off a
		// state it does not have.
		const decoration = values(entryRules(ENTRY, /:hover/), "text-decoration", "text-decoration-line");
		expect(
			decoration.some((value) => value.includes("underline")),
			"a .detail__entry:hover rule underlines the id",
		).toBe(true);
	});

	test("an entry that names a node takes the accent focus outline while it has the focus (vvzptxmz)", () => {
		// vvzptxmz: while the entry has the focus it is outlined, and the outline
		// is drawn in the accent colour role the record names for focus.
		const outline = values(
			entryRules(ENTRY, /:focus/),
			"outline",
			"outline-color",
			"outline-style",
			"box-shadow",
		);
		expect(
			outline.some((role) => role.includes("var(--vscode-focusBorder")),
			"a .detail__entry:focus rule draws the outline in the accent role",
		).toBe(true);
	});

	test("an entry that names no node is drawn in the muted secondary role (mplxzxnm)", () => {
		// mplxzxnm: the entry whose id names no node document is drawn in the
		// muted secondary colour role, through the token that record names, and
		// stays listed in its section.
		expect(
			values(entryRules(INERT), "color"),
			"a resting .detail__entry--inert rule declares the muted secondary role",
		).toEqual(expect.arrayContaining([expect.stringContaining("var(--vscode-descriptionForeground")]));
	});

	test("an entry that names no node takes none of the pointer, hover and focus cues (kpkstnps)", () => {
		// kpkstnps: the entry whose id names no node document is not presented as
		// clickable — no pointer cursor over it, no underline under it while the
		// pointer is over it, and no outline around it while it has the focus.
		const resting = entryRules(INERT);
		const hovered = entryRules(INERT, /:hover/);
		const focused = entryRules(INERT, /:focus/);

		// The absence is only meaningful for an entry the stylesheet reaches
		// through its class: mplxzxnm draws this entry in a role, so its class is
		// selected before the cues it withholds are read off it.
		expect(resting.length, "the inert entry is drawn through .detail__entry--inert").toBeGreaterThan(0);

		const cursors = values(resting, "cursor");
		expect(cursors, "the inert entry shows no pointer cursor").not.toContain("pointer");
		expect(
			cursors.filter((cursor) => !["auto", "default", "inherit", "text", "unset"].includes(cursor)),
			"the inert entry is given no cursor of its own either",
		).toEqual([]);

		expect(
			values([...resting, ...hovered], "text-decoration", "text-decoration-line").some((value) =>
				value.includes("underline"),
			),
			"the inert entry gains no underline under the pointer",
		).toBe(false);

		const drawn = values(focused, "outline", "outline-color", "outline-style", "box-shadow").filter(
			(value) => value !== "" && !["none", "0", "initial", "inherit", "unset", "transparent"].includes(value),
		);
		expect(drawn, "the inert entry draws no focus outline").toEqual([]);
	});
});

describe("the ref-path entry, read through the one class the vocabulary adds for it (squvoxyr, xntonlmp, plkskmxu, slksrtvm, oolrzkvl, ppkkmxxu)", () => {
	/*
	 * A ref-path entry is the entry the Content section shows for one path of a
	 * ref that lists paths rather than carrying an inline body: a line of
	 * content.ref, presented (squvoxyr) rather than left as bare text. The class
	 * vocabulary names it "detail__ref" (ppkkmxxu) as that entry's whole class,
	 * so the stylesheet's rules for that name — the resting rule and the rules
	 * for the state a cue belongs to — are what this section reads.
	 */

	test("the stylesheet draws the ref-path entry through that one name, and no other name is spelled from either case", () => {
		// ppkkmxxu: a ref-path entry carries "detail__ref" as its whole class and
		// the stylesheet's rules select that one name; sqwusxql fixes the listed
		// entry's two names and forbids a third spelled out of them. So the names
		// the stylesheet carries for the two cases of an entry are exactly the
		// three whole names — the ref-path name is a name of its own, never a
		// modifier of, a suffix to or a nesting of the listed entry's.
		expect(classRules(REF).length, "a rule selects .detail__ref").toBeGreaterThan(0);
		expect([...new Set(SOURCE.match(/\.detail__(?:entry|ref)[\w-]*/g) ?? [])].sort()).toEqual([
			".detail__entry",
			".detail__entry--inert",
			".detail__ref",
		]);
	});

	test("an entry for a ref path is drawn in the link colour role (xntonlmp, oqotyplt)", () => {
		// xntonlmp draws that entry in the link colour role, and the role is the
		// one oqotyplt records for a link: the resting rule's colour resolves to
		// the token that record names, never to a literal, to a second binding of
		// the role or to a role re-pointed away from that token.
		const resting = entryRules(REF);
		expect(resting.length, "a resting .detail__ref rule draws the entry").toBeGreaterThan(0);

		const colours = values(resting, "color");
		expect(colours, "a resting .detail__ref rule declares the link colour role").toEqual(
			expect.arrayContaining([expect.stringContaining("var(--vscode-textLink-foreground")]),
		);
		expect(
			colours.filter((colour) => !colour.startsWith("var(--")),
			"every colour the ref-path entry is given is a role token, not a literal",
		).toEqual([]);
	});

	test("an entry for a ref path shows the pointer cursor (plkskmxu, wtywxppt)", () => {
		// plkskmxu shows the pointer while the pointer is over the entry, which is
		// wtywxppt's pointer-precision commitment made visible before the click.
		// That record's element field names canvas elements, so what it licenses
		// here is the pointer cue itself, not its recorded 24px hit target.
		expect(
			values(classRules(REF), "cursor"),
			"the ref-path entry takes the pointer cursor",
		).toContain("pointer");
	});

	test("an entry for a ref path is underlined while the pointer rests over it (slksrtvm)", () => {
		// slksrtvm marks the path's characters only while the pointer is over
		// them, so the underline is read off the hovered entry and not off a
		// decoration the resting rule carries.
		const decoration = values(entryRules(REF, /:hover/), "text-decoration", "text-decoration-line");
		expect(
			decoration.some((value) => value.includes("underline")),
			"a .detail__ref:hover rule underlines the path",
		).toBe(true);
	});

	test("an entry for a ref path takes the accent focus outline while it has the focus (oolrzkvl, qqmrtwor)", () => {
		// oolrzkvl outlines that entry while it has the focus, in the accent role
		// qqmrtwor records: the focus rule draws an outline, and what it draws is
		// the token that record names.
		const outline = values(
			entryRules(REF, /:focus/),
			"outline",
			"outline-color",
			"outline-style",
			"box-shadow",
		);
		expect(
			outline.some((role) => role.includes("var(--vscode-focusBorder")),
			"a .detail__ref:focus rule draws the outline in the accent role",
		).toBe(true);
	});

	test("the ref-path cues are the entry's own, spent on that name and on no listed-entry name (ppkkmxxu, squvoxyr)", () => {
		// The cues above are read on the name ppkkmxxu fixes because that is the
		// entry's whole class. A rule that draws one of them while also selecting
		// a listed entry's name would reach the ref-path entry only through an
		// element carrying both names, which the vocabulary's division keeps
		// apart — so the cues are absent from the listed-entry classes' use and
		// none of them is composed with the ref-path name.
		const cueRules = [
			...entryRules(REF),
			...entryRules(REF, /:hover/),
			...entryRules(REF, /:focus/),
		];
		expect(cueRules.length, "the stylesheet reaches the ref-path entry through .detail__ref").toBeGreaterThan(0);

		const classSelector = new RegExp(`\\.${REF}(?![\\w-])`);
		const listed = /\.detail__entry[\w-]*/;
		const composed = cueRules.filter((rule) =>
			rule.selectors.some((selector) => classSelector.test(selector) && listed.test(selector)),
		);
		expect(
			composed.map((rule) => rule.selectors.join(", ")),
			"no rule that draws the ref-path entry names a listed-entry class beside it",
		).toEqual([]);
	});
});
