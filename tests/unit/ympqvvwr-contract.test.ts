// @vitest-environment jsdom
/**
 * Contract check: what the page interface (ympqvvwr) must show, read through
 * the interface's own exported names, against the recorded decisions it answers
 * to.
 *
 * The check carries four clause families:
 *
 * - qmsmvrnr — the graph, its order and its geometry: the interface is defined
 *   over `GraphModel`, `GraphOrder`, `GraphLayout` and `GraphEdge`, built by the
 *   prerequisite's own entry points, and no value the model's interface does not
 *   fix is asserted;
 * - vylxkuxr — the graph is presented inside a page: the interface names a
 *   region per page area, each reached by a selector of its own, and every area
 *   its own views attach to is one it names;
 * - the identity of the drawn elements: one attribute per element kind, each a
 *   name a drawn element can carry and hand back, with an identity value that
 *   tells every node and every edge apart;
 * - the emphasis vocabulary: a non-empty set of distinct single class tokens
 *   the page switches between;
 * - krvyoumy — malformed documents are contained: the check drives an
 *   implementer of the interface (the presentation state) instead of a
 *   presentation it builds itself, hands it the problems a read reports, and
 *   asserts that the state hands exactly those problems back, apart from a
 *   failed read and without emptying the page.
 *
 * The interface is read from `src/webview/contract.ts`; the problems clause is
 * observed at runtime through an implementer of it, `src/webview/states`. The
 * page, the stylesheets and the documents on disk are the subjects of other
 * checks and are not read here.
 */
import { describe, expect, test } from "vitest";

import type { NodeRecord } from "../../src/data/nodes";
import { buildGraph } from "../../src/graph/model";
import { graphOrder } from "../../src/graph/order";
import { layoutGraph } from "../../src/graph/layout";
import type {
	InteractionGraph,
	InteractionView,
	Presentation,
	StatesController,
	StatesView,
} from "../../src/webview/contract";
import {
	EDGE_KEY_ATTR,
	EmphasisClasses,
	NODE_ID_ATTR,
	SELECTORS,
	edgeKey,
} from "../../src/webview/contract";
import { attachStates } from "../../src/webview/states";

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
			kind: "decision",
			dependsOn: ["aaaaaaaa", "cccccccc"],
			evaluates: [],
			content: { type: "text", ref: "inline", rationale: "b" },
		},
	];
}

/** An area name the interface's own views attach to (InteractionView, StatesView). */
type AttachedArea = keyof InteractionView | keyof StatesView;
/** An area name the interface's region selectors reach (SELECTORS). */
type NamedArea = keyof typeof SELECTORS;
/** Whether two types are the same type. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? true
	: false;

describe("the interface is defined over the graph model (qmsmvrnr)", () => {
	test("the interaction graph is the model and the order the layout is built from", () => {
		const model = buildGraph(records());
		const order = graphOrder(model);
		const graph: InteractionGraph = { model, order };

		const layout = layoutGraph(graph.model, graph.order);

		// qmsmvrnr: GraphLayout gives a box to every node of the GraphModel ...
		expect([...layout.nodes.keys()].sort()).toEqual(
			graph.model.nodes.map((node) => node.id).sort(),
		);
		// ... and routes one edge per edge of the GraphModel.
		expect(layout.edges).toHaveLength(graph.model.edges.length);
	});

	test("the edge key tells every edge of the model apart", () => {
		const model = buildGraph(records());

		const keys = model.edges.map((edge) => edgeKey(edge));

		// qmsmvrnr: a GraphEdge is told from another by its kind and its two ends,
		// so the interface's key is defined for every edge of the model ...
		expect(keys).toHaveLength(model.edges.length);
		// ... and names its ends, so two edges sharing a child are told apart.
		for (const edge of model.edges) {
			expect(edgeKey(edge)).toContain(edge.from);
			expect(edgeKey(edge)).toContain(edge.to);
		}
		expect(new Set(keys).size).toBe(model.edges.length);
	});

	test("an unresolved edge of the model still has a key, so it can be drawn and targeted", () => {
		const model = buildGraph(records());

		const dangling = model.edges.find((edge) => edge.danglingEnd !== undefined);

		// qmsmvrnr: an edge whose GraphEdge.danglingEnd names the missing end is an
		// edge of the model like any other, so the interface gives it a key that
		// is told apart from the rest.
		expect(dangling).toBeDefined();
		expect(edgeKey(dangling!)).not.toBe("");
		expect(new Set(model.edges.map((edge) => edgeKey(edge))).size).toBe(model.edges.length);
	});

	test("the interface names a distinct attribute for a node and for an edge", () => {
		// qmsmvrnr fixes no attribute name: all the interface owes the model is an
		// identity for the drawn boxes and one for the drawn edge parts, told
		// apart from each other.
		expect(NODE_ID_ATTR).toBeTypeOf("string");
		expect(EDGE_KEY_ATTR).toBeTypeOf("string");
		expect(NODE_ID_ATTR.length).toBeGreaterThan(0);
		expect(EDGE_KEY_ATTR.length).toBeGreaterThan(0);
		expect(NODE_ID_ATTR).not.toBe(EDGE_KEY_ATTR);
	});
});

describe("the interface names a region for every area of the page (vylxkuxr)", () => {
	test("every area the interface names is reached by a selector of its own", () => {
		const areas = Object.keys(SELECTORS) as NamedArea[];
		const selectors = areas.map((area) => SELECTORS[area]);

		// the page the graph is presented in is made of the areas the interface
		// names, and each of them is reached by a selector ...
		expect(areas.length).toBeGreaterThan(0);
		for (const selector of selectors) {
			expect(selector).toBeTypeOf("string");
			expect(selector.trim()).not.toBe("");
		}
		// ... one per area, so no two areas are the same region.
		expect(new Set(selectors).size).toBe(selectors.length);
	});

	test("every area the interface's own views attach to is an area it names", () => {
		// The areas the interface's own views attach to: the canvas, the surface
		// inside it and the banner. Each one is a region of the page, so each
		// needs a selector or a controller has nothing to attach to.
		const attached: readonly AttachedArea[] = ["canvas", "surface", "banner"];
		const areas = new Set<string>(Object.keys(SELECTORS));

		for (const area of attached) {
			expect(areas.has(area)).toBe(true);
		}

		// And the coverage is total: no view of the interface attaches to an area
		// that the region selectors do not reach.
		const coversEveryAttachedArea: AttachedArea extends NamedArea ? true : false = true;
		expect(coversEveryAttachedArea).toBe(true);
	});
});

describe("the interface gives a node and an edge an identity of their own", () => {
	test("the two kinds of drawn element are targeted by two different attributes", () => {
		// a node box carries one attribute and a drawn part of an edge another, so
		// a node and an edge part are never the same target ...
		expect(NODE_ID_ATTR).not.toBe(EDGE_KEY_ATTR);

		for (const attribute of [NODE_ID_ATTR, EDGE_KEY_ATTR]) {
			expect(attribute).toBeTypeOf("string");
			expect(attribute.length).toBeGreaterThan(0);
			// ... and each is a name a drawn element can carry and hand back: no
			// space and none of the characters that end an attribute.
			expect(attribute).not.toMatch(/[\s"'<>/=]/);
		}
	});

	test("every node and every edge is told apart by its identity value", () => {
		const model = buildGraph(records());

		const nodeIdentities = model.nodes.map((node) => node.id);
		expect(nodeIdentities.length).toBeGreaterThan(0);
		for (const identity of nodeIdentities) {
			expect(identity.length).toBeGreaterThan(0);
		}
		// one box per node, each reached by its own identity.
		expect(new Set(nodeIdentities).size).toBe(nodeIdentities.length);

		const keys = model.edges.map((edge) => edgeKey(edge));
		// one edge may be drawn as several elements, so its identity comes from
		// the edge's value and not from the element drawn: two equal edges get the
		// same key ...
		for (const edge of model.edges) {
			expect(edgeKey({ ...edge })).toBe(edgeKey(edge));
		}
		// ... while the edges of the graph still differ.
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe("the interface names the emphasis vocabulary the page switches between", () => {
	test("the vocabulary is a non-empty set of distinct class tokens", () => {
		const tokens = Object.values(EmphasisClasses);

		expect(tokens.length).toBeGreaterThan(0);
		for (const token of tokens) {
			expect(token).toBeTypeOf("string");
			expect(token.trim()).not.toBe("");
			// a class token is one name the page sets and clears on an element.
			expect(token).not.toContain(" ");
		}
		// the states are told apart, so switching one on does not switch another
		// on and every state of the page is reachable on its own.
		expect(new Set(tokens).size).toBe(tokens.length);
	});
});

describe("the presentation carries the per-document problems (krvyoumy)", () => {
	test("the problems a read reports reach the presentation on one channel", () => {
		// the read hands the problems of omitted documents to the presentation
		// through the same type the presentation carries them in, so there is one
		// channel from "documents were omitted" to "the problems are presented".
		type ReportedProblems = NonNullable<Parameters<StatesController["loaded"]>[1]>;
		const oneChannel: Equal<Presentation["warnings"], ReportedProblems> = true;

		expect(oneChannel).toBe(true);
	});

	test("one problem per omitted document, while the remaining nodes render", () => {
		// The clause is observed at runtime through an implementer of the
		// interface — the presentation state — and never through a presentation
		// this check builds itself: the problems arrive on the channel the read
		// hands them in, and the presentation is what the implementer hands back.
		const view: StatesView = {
			canvas: document.createElement("main"),
			banner: document.createElement("div"),
		};
		const states = attachStates(view);

		// what the renderer drew for the documents that were read: a node on the
		// canvas, carrying the interface's node identity.
		const drawn = document.createElement("div");
		drawn.setAttribute(NODE_ID_ATTR, "cccc3333");
		view.canvas.append(drawn);

		// the read's warnings: one per omitted document, each naming the file
		// and the problem it found.
		const problems = [
			"nodes/aaaa1111.json: invalid JSON (Unexpected token } in JSON)",
			"nodes/bbbb2222.json: does not conform to schemas/node.json",
		];
		states.loaded(1, problems);

		const presentation: Readonly<Presentation> = states.state();

		// the presentation carries a list, not one message: a problem per omitted
		// document, carried as the read reported it, so the file name and the
		// problem still name themselves where the banner shows them inline ...
		expect(presentation.warnings).toHaveLength(problems.length);
		expect(presentation.warnings).toEqual(problems);
		for (const problem of presentation.warnings) {
			expect(problem).toMatch(/^nodes\/[^:]+\.json: \S/);
		}
		// ... and the banner region is where they are shown, naming a file the
		// read left out.
		expect(view.banner.textContent).toContain("nodes/aaaa1111.json");

		// ... while the rest of the graph renders: an omitted document is not a
		// failed read (nothing to show as an error) and does not empty the page.
		expect(presentation.error).toBeNull();
		expect(presentation.empty).toBe(false);
		expect(view.canvas.contains(drawn)).toBe(true);

		// and a read that omitted nothing presents no problems.
		const cleanView: StatesView = {
			canvas: document.createElement("main"),
			banner: document.createElement("div"),
		};
		const clean = attachStates(cleanView);
		clean.loaded(1, []);
		expect(clean.state().warnings).toHaveLength(0);
	});
});
