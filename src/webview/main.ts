/**
 * Bootstrap of the interactive HTML page (media/webview.html, vylxkuxr,
 * uprztqnr): it attaches to the page regions of the panel chrome (zrqxuzzy),
 * receives the graph across the webview seam and draws it.
 *
 * The seam is the message contract below. The extension host reads the node
 * documents and the jj change descriptions (qpsnwxlu) and posts them here as
 * node records, labels and the warnings of the documents it left out
 * (krvyoumy); this module assembles the graph (model.ts), orders it
 * deterministically (order.ts), lays it out (layout.ts) and hands the geometry
 * to the renderer (render.ts), while the warnings go to the presentation
 * (yruxqknp). Nothing on this side reads the workspace: the page only ever
 * sees what the host posts it.
 *
 * This module is the composition root of the page interface (ympqvvwr): on
 * the first graph it attaches the interaction state (noplrntp), the keyboard
 * equivalents (ykvrkysl), the loading, empty and error presentation (yruxqknp)
 * and the fit-graph action (mspmqvuk) to the regions of the page, and restores
 * the persisted panel state the host hands it (vpqxkzxq, state.ts). A later
 * graph swaps the data out from under the interactions without losing the
 * selection, pan or zoom (luqwqrll).
 */

import type { NodeContent, NodeRecord } from "../data/nodes";
import { buildGraph } from "../graph/model";
import type { EdgeKind, GraphModel, GraphNode } from "../graph/model";
import { graphOrder } from "../graph/order";
import type { GraphOrder } from "../graph/order";
import { layoutGraph } from "../graph/layout";
import type { GraphLayout, Point } from "../graph/layout";
import { createRenderer } from "./render";
import type { GraphRenderer, HeightDisplacement, RenderTarget } from "./render";
import { attachInteractions } from "./interact";
import { attachKeyboard } from "./keyboard";
import { attachStates, queueInput } from "./states";
import type {
	InteractionController,
	InteractionDelegate,
	InteractionGraph,
	InteractionView,
	StatesController,
} from "./contract";
import { SELECTORS } from "./contract";
import { applyPanelState } from "./state";
import type { PanelState } from "./state";
import { attachSearch } from "./search";
import type { SearchController } from "./search";

/** A message from the extension host to the page. */
export type GraphMessage =
	| {
			type: "graph";
			/** The validated node records the graph is built from (qpsnwxlu). */
			records: readonly NodeRecord[];
			/** The jj change descriptions by node id, used as node labels (qpsnwxlu). */
			labels: Readonly<Record<string, string>>;
			/**
			 * The problems of the documents the host left out, each naming the
			 * file and the problem (krvyoumy). The page shows them inline while
			 * the graph renders; empty when every document was read.
			 */
			warnings: readonly string[];
	  }
	| {
			type: "error";
			/** The user-facing failure to show inline (vxmzzunt). */
			message: string;
	  };

/**
 * The persisted panel state handed to the page when it is ready (vpqxkzxq).
 * The host defines the same envelope (panel.ts); the two stay in step as the
 * seam grows.
 */
export type PanelStateMessage = {
	type: "panelState";
	state: PanelState;
};

/**
 * A message from the page to the extension host. The page posts "ready" once
 * its listener is attached (see below); selection and open requests answer
 * through the same channel, and the host records what the page reports
 * (srlrwowp). "openNode" asks for a node's own document and "openRef" for a
 * repo-relative file a node's content lives in (rptlovpt, trxzsqpv): the page
 * names the path it was given and the host resolves and opens it.
 */
export type PageMessage =
	| { type: "ready" }
	| { type: "selection"; id: string | null }
	| { type: "openNode"; id: string }
	| { type: "openRef"; path: string };

/** The part of the VS Code webview API the page uses. */
interface VsCodeApi {
	postMessage(message: PageMessage): void;
	getState(): unknown;
	setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const target: RenderTarget = {
	edges: mustGet<SVGSVGElement>(SELECTORS.edges),
	nodes: mustGet<HTMLElement>(SELECTORS.nodes),
};

/**
 * The renderer of the canvas (rtlotqvy, tnturzro). It lives as long as the
 * page does: each draw reuses the elements and measured heights of the draw
 * before it, and a new graph revision resets it.
 */
const renderer: GraphRenderer = createRenderer(target);

const canvas = mustGet<HTMLElement>(SELECTORS.canvas);
const surface = mustGet<HTMLElement>(SELECTORS.surface);
const banner = mustGet<HTMLDivElement>(SELECTORS.banner);
const detailBody = mustGet<HTMLElement>(SELECTORS.detailBody);
const fitButton = mustGet<HTMLButtonElement>(SELECTORS.fitAction);

/**
 * The graph reaches the page as a message from the extension host. When the
 * page runs outside the workbench there is no host to post it, so the API is
 * optional and only the reply channel goes without it.
 */
const vscode: VsCodeApi | undefined =
	typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

/** The presentation of the loading, empty and error states (yruxqknp). */
const states: StatesController = attachStates({ canvas, banner });
states.beginLoading();

let model: GraphModel | undefined;
let order: GraphOrder | undefined;
let labels = new Map<string, string>();
/**
 * The layout the canvas shows and the heights the boxes had when it was
 * drawn (tnturzro): a move is laid out against them instead of laying the
 * graph out from scratch, and only what the move changed is drawn again.
 */
let previousLayout: GraphLayout | undefined;
let measuredHeights: ReadonlyMap<string, number> = new Map();
/** The persisted panel state, however it arrived (vpqxkzxq, state.ts). */
let persisted: PanelState | undefined;
let controller: InteractionController | undefined;
let queued: InteractionController | undefined;
/**
 * The find-by-text search of the page (ksoupzqm, uryrrttr), attached once
 * beside the interaction state and kept across graph reloads so the active
 * query and its marks survive them (ukuppmko).
 */
let search: SearchController | undefined;

/**
 * The renderer (rtlotqvy), reached from the interaction state. The recorded
 * node positions come first and the live drag positions override them, so a
 * reload keeps where the user put nodes (luqwqrll, rmsyvtvn).
 */
const delegate: InteractionDelegate = {
	relayout(dragged: ReadonlyMap<string, Point>): GraphLayout {
		if (model === undefined || order === undefined) {
			throw new Error("the graph has not arrived yet");
		}
		const merged = new Map<string, Point>();
		if (persisted !== undefined) {
			for (const [id, position] of Object.entries(persisted.positions)) {
				merged.set(id, { x: position.x, y: position.y });
			}
		}
		for (const [id, position] of dragged) {
			merged.set(id, position);
		}

		// The first draw of a graph revision lays the graph out against the
		// minimum box height (owtptzpl) so the renderer can measure how far
		// each label wrapped, and lays it out again from the measured heights
		// (layout.ts, tnturzro).
		if (previousLayout === undefined) {
			const measured = layoutGraph(model, order, { dragged: merged });
			measuredHeights = renderer.draw({
				model,
				order,
				layout: measured,
				labels,
			});
			const layout = layoutGraph(model, order, {
				dragged: merged,
				heights: measuredHeights,
			});
			renderer.draw({ model, order, layout, labels });
			previousLayout = layout;
			return layout;
		}

		// A move is laid out against the layout in hand (msvoysvz): the graph
		// layer recomputes the moved boxes and their incident routes and
		// carries every other box and route over.
		const moved = movedNodes(merged, previousLayout);
		const heights = new Map(measuredHeights);
		// Only the boxes the move moved are measured (tnturzro): the rest keep
		// the heights they were drawn with.
		for (const id of moved) {
			const height = renderer.measure(id);
			if (height !== undefined) {
				heights.set(id, height);
			}
		}

		const layout = layoutGraph(model, order, {
			dragged: merged,
			heights,
			previous: previousLayout,
		});

		// A measured height change moves the region below it as one (tnturzro):
		// the layout carried those boxes over at their old coordinates, so the
		// row height each moved box changed is handed to the renderer, which
		// displaces the layers below it by that amount, box by box never.
		const displace: HeightDisplacement[] = [];
		for (const layer of movedLayers(moved, previousLayout, layout)) {
			const before = rowHeight(previousLayout, layer);
			const after = rowHeight(layout, layer);
			if (after !== before) {
				displace.push({ layer, delta: after - before });
			}
		}

		renderer.draw({ model, order, layout, labels }, { displace });
		measuredHeights = heights;
		previousLayout = layout;
		return layout;
	},
	onSelectionChanged(id: string | null): void {
		// The selection shows the node's labelled detail sections
		// (ltrnmrsr, vqwoptmu) and is reported so the host can record it
		// (srlrwowp).
		renderDetail(id);
		post({ type: "selection", id });
	},
	openNodeDocument(id: string): void {
		post({ type: "openNode", id });
	},
};

/**
 * Draw the graph of `records`, label its nodes from `labels` and show the
 * `warnings` of the documents that were left out (krvyoumy).
 *
 * The first graph attaches the interactions, keyboard, presentation queue,
 * fit action and find-by-text search to the page (ympqvvwr, uryrrttr) and
 * restores the persisted panel state into them; every later graph swaps the
 * data out from under the interactions and hands the new graph to the search,
 * keeping the selection, pan and zoom (luqwqrll) and the active query and its
 * marks (ukuppmko).
 */
export function showGraph(
	records: readonly NodeRecord[],
	names: Readonly<Record<string, string>>,
	warnings: readonly string[],
): void {
	model = buildGraph(records);
	order = graphOrder(model);
	labels = new Map(Object.entries(names));

	// A new graph is a new revision: the drawn elements, the measured heights
	// and the layout in hand all describe the graph that is gone, so the next
	// draw starts clean (tnturzro).
	renderer.reset();
	previousLayout = undefined;
	measuredHeights = new Map();

	if (controller === undefined || queued === undefined) {
		const view: InteractionView = { canvas, surface };
		const graph: InteractionGraph = { model, order };
		controller = attachInteractions(view, delegate, graph);
		queued = queueInput(controller, states.input);
		attachKeyboard(queued, view);
		fitButton.addEventListener("click", (): void => {
			queued?.fitGraph();
		});
		// The search is attached once, beside the interaction state it selects
		// through (uryrrttr, ksoupzqm); a reload swaps the graph under it
		// instead of attaching a second field (ukuppmko).
		search = attachSearch({ canvas, controller: queued, graph, labels });
		states.loaded(records.length, warnings);
		if (persisted !== undefined) {
			applyPanelState(queued, persisted);
		}
		renderDetail(controller.selected());
	} else {
		controller.setGraph({ model, order });
		// The active query stays and marks the new graph under the same rule
		// (ukuppmko); the field itself is the one attached above.
		search?.setGraph({ model, order }, labels);
		states.loaded(records.length, warnings);
		renderDetail(controller.selected());
	}
}

/**
 * One labelled section of the detail panel, with the region its value goes in
 * (vqwoptmu, yrtrqutm).
 */
interface DetailSection {
	/** The section element: its summary is the label and toggles it alone. */
	section: HTMLDetailsElement;
	/** The region below the label that holds the section's value. */
	value: HTMLElement;
}

/**
 * The content types the panel reads as running prose (qwzwpxws). Every other
 * type — the structured ones and any type a later record adds — is shown as a
 * verbatim monospaced block marked with the type, so an unnamed type is never
 * refused.
 */
const PROSE_CONTENT_TYPES: readonly string[] = ["text", "ears", "review-criteria"];

/**
 * Show the selected node's detail (ltrnmrsr, vqwoptmu, yrtrqutm, qwzwpxws,
 * rmovtvkt): the three labelled sections Kind, Content and Rationale in that
 * order, then the four relationship sections depends_on, evaluates, dependents
 * and evaluators. Every section keeps its label and its place whatever its
 * value, a value is rendered by its content type, and each section collapses
 * through its own summary and nothing else. The sections are rebuilt for every
 * selection, so a selected node always shows the same frame expanded. Each id
 * a relationship section lists is listed in place as the entry it is: an
 * activatable control that selects the node the id names, or the plain id when
 * no node document carries it (kwxutvpw, rusopkql).
 */
function renderDetail(id: string | null): void {
	detailBody.replaceChildren();
	if (id === null || model === undefined) {
		return;
	}
	const node = model.nodes.find((candidate) => candidate.id === id);
	if (node === undefined) {
		return;
	}
	for (const section of detailSections(model, node)) {
		detailBody.append(section);
	}
}

/** The sections of `node`, in the order the panel presents them. */
function detailSections(graph: GraphModel, node: GraphNode): HTMLElement[] {
	const sections: HTMLElement[] = [];

	const kind = detailSection("Kind");
	kind.value.classList.add("detail__kind");
	kind.value.textContent = node.kind;
	sections.push(kind.section);

	const content = detailSection("Content");
	content.value.classList.add("detail__content");
	renderContentValue(content.value, node.content);
	sections.push(content.section);

	const rationale = detailSection("Rationale");
	rationale.value.classList.add("detail__rationale");
	appendProse(rationale.value, node.content.rationale);
	sections.push(rationale.section);

	for (const [label, ids] of detailRelationships(graph, node.id)) {
		const relationship = detailSection(label);
		renderRelationshipValue(relationship.value, graph, ids);
		sections.push(relationship.section);
	}

	return sections;
}

/**
 * One labelled section of the detail body (vqwoptmu, yrtrqutm): the label is
 * the section's summary and the value sits below it, so collapsing the section
 * through the summary hides the value and keeps the label. A section is
 * created expanded and only its own summary toggles it.
 */
function detailSection(label: string): DetailSection {
	const section = document.createElement("details");
	section.className = "detail__section";
	section.open = true;
	const summary = document.createElement("summary");
	summary.className = "detail__label";
	summary.textContent = label;
	const value = document.createElement("div");
	value.className = "detail__value";
	section.append(summary, value);
	return { section, value };
}

/**
 * The four relationship sections of a node (rmovtvkt), each read from the
 * graph's edges and never from a field of its own: a depends_on edge runs from
 * the prerequisite to the declaring node and an evaluates edge runs from the
 * declaring evaluator to the evaluated node (mnovnnot), so the selected node's
 * own depends_on are the depends_on edges whose child end is the node, its own
 * evaluates are the evaluates edges whose parent end is the node, and the
 * reverse sections are the same edges read from the other end.
 */
function detailRelationships(
	graph: GraphModel,
	id: string,
): readonly (readonly [string, readonly string[]])[] {
	const entries = (
		kind: EdgeKind,
		selectedEnd: "from" | "to",
		listedEnd: "from" | "to",
	): string[] => {
		const ids: string[] = [];
		for (const edge of graph.edges) {
			if (edge.kind === kind && edge[selectedEnd] === id && !ids.includes(edge[listedEnd])) {
				ids.push(edge[listedEnd]);
			}
		}
		return ids;
	};
	return [
		// The prerequisites the node lists: the parent end of its depends_on.
		["depends_on", entries("depends_on", "to", "from")],
		// The nodes it evaluates: the child end of its evaluates.
		["evaluates", entries("evaluates", "from", "to")],
		// The nodes whose depends_on names it: the child end of those edges.
		["dependents", entries("depends_on", "from", "to")],
		// The evaluations whose evaluates names it: the parent end of those.
		["evaluators", entries("evaluates", "to", "from")],
	];
}

/**
 * What one relationship section shows: its ids, each listed in place as the
 * entry the id is (see {@link relationshipEntry}), or an explicit empty state.
 */
function renderRelationshipValue(
	into: HTMLElement,
	graph: GraphModel,
	ids: readonly string[],
): void {
	if (ids.length === 0) {
		const empty = document.createElement("div");
		empty.className = "detail__empty";
		empty.textContent = "no entries";
		into.append(empty);
		return;
	}
	const list = document.createElement("ul");
	list.className = "detail__ids";
	for (const id of ids) {
		const item = document.createElement("li");
		item.append(relationshipEntry(graph, id));
		list.append(item);
	}
	into.append(list);
}

/**
 * The class a listed entry whose id names a node document carries
 * (sqwusxql): the name the stylesheet's entry rules select, so the look of a
 * followable id is drawn by the styles written against it (mwwxxzyk,
 * tvoouwkn, rqrlnzny, qnmuwwvw, vvzptxmz).
 */
const ENTRY_CLASS = "detail__entry";

/**
 * The class a listed entry whose id names no node document carries
 * (sqwusxql): one whole name of its own, not {@link ENTRY_CLASS} with a
 * modifier beside it, so an inert entry never reads as both cases at once and
 * the stylesheet rules for the two cases (mplxzxnm, kpkstnps) never overlap on
 * one element.
 */
const INERT_ENTRY_CLASS = "detail__entry--inert";

/**
 * One listed relationship id as the panel presents it (kwxutvpw, rusopkql,
 * sqwusxql).
 *
 * An id the graph has a node for is an activatable entry: a pointer click, or
 * Enter or Space while the entry has the focus, runs the selection a click on
 * that node's box runs (interact.ts), so the selection moves and the panel
 * re-renders the named node's detail instead of describing a second selection
 * of its own. The entry is an inline element whose text is the id and whose
 * only class is {@link ENTRY_CLASS}, the name that says which case the entry
 * is; it adds no text and no element, and every appearance the entry carries is
 * a declaration the stylesheet writes against that one name. Its keyboard
 * activation is its own: the event stops at the entry rather than reaching the
 * page's Enter-select of the keyboard focus (keyboard.ts), which names a node
 * box and not this entry.
 *
 * An id whose other edge end names no node document is listed the same way and
 * is otherwise inert (rusopkql): it keeps its place as the plain id, carries
 * {@link INERT_ENTRY_CLASS} as its whole class rather than the followable
 * name, is not an activatable control, and activating it selects nothing,
 * leaves the detail as it was and reports no error.
 *
 * Exactly one of the two class names is on every listed entry — this element
 * shows one id and nothing else, so neither name is ever on a container holding
 * more than one id — and which name a given entry carries is decided by whether
 * the graph has a document for that id, never by the section it sits in.
 */
function relationshipEntry(graph: GraphModel, id: string): HTMLElement {
	const entry = document.createElement("span");
	entry.textContent = id;
	if (!graph.nodes.some((node) => node.id === id)) {
		entry.className = INERT_ENTRY_CLASS;
		return entry;
	}
	entry.className = ENTRY_CLASS;
	entry.setAttribute("role", "button");
	entry.setAttribute("tabindex", "0");
	const activate = (): void => {
		queued?.select(id);
	};
	entry.addEventListener("click", (event: MouseEvent): void => {
		event.preventDefault();
		activate();
	});
	entry.addEventListener("keydown", (event: KeyboardEvent): void => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		activate();
	});
	return entry;
}

/**
 * The class a ref-path entry carries as its whole class (ppkkmxxu): one whole
 * name, not {@link ENTRY_CLASS} with a modifier, so the stylesheet's ref-path
 * rules select this name and no listed-entry name reaches a path in the
 * Content section (sqwusxql, squvoxyr).
 */
const REF_ENTRY_CLASS = "detail__ref";

/**
 * Draw a content value by its content type (qwzwpxws): the narrative types as
 * running prose, every other type — and a ref that names paths rather than an
 * inline body — as a verbatim monospaced block. The value is marked with the
 * type as content.type spells it in every case, so an empty value still shows
 * which type it would have carried.
 */
function renderContentValue(into: HTMLElement, content: NodeContent): void {
	const type = content.type;
	if (content.ref !== "inline") {
		// The body lives in the files the node names, so the section shows the
		// type together with those paths instead of a body it does not carry.
		into.append(contentTypeMark(type), refPathBlock(type, content.ref));
		return;
	}
	const body = typeof content.content === "string" ? content.content : "";
	if (PROSE_CONTENT_TYPES.includes(type)) {
		into.append(contentTypeMark(type));
		appendProse(into, body);
		return;
	}
	into.append(contentTypeMark(type), monospacedBlock(body));
}

/**
 * The monospaced block that shows a path-form value (qwzwpxws): the content
 * type on the line above, then each repo-relative path of the ref list in the
 * order the list gives them, one entry per path (ppkkmxxu).
 *
 * The block still shows the whole value — type and paths — so the panel and
 * the node's ref list cannot disagree about which files the body lives in; the
 * entries are its inner elements and add no text, no label and no order of
 * their own (squvoxyr).
 */
function refPathBlock(type: string, ref: readonly string[]): HTMLElement {
	const block = document.createElement("pre");
	block.className = "detail__block";
	// The type keeps its line: it names the type and is not one of the entries
	// (rptlovpt, squvoxyr).
	block.append(document.createTextNode(`${type}\n`));
	ref.forEach((path, index) => {
		if (index > 0) {
			block.append(document.createTextNode("\n"));
		}
		block.append(refPathEntry(path));
	});
	return block;
}

/**
 * One repo-relative path of a node's ref list as the panel presents it
 * (rptlovpt, ppkkmxxu): an entry whose text is the path, whose whole class is
 * {@link REF_ENTRY_CLASS}, and which is a control the keyboard can reach.
 *
 * Activating it — a pointer click, or Enter or Space while it has the focus —
 * posts the page's request for that file to be opened in the editor and does
 * nothing else (rptlovpt). It is not a listed id, so it does not select the
 * node, does not change the selection, the detail region or the viewport, and
 * does not re-trigger the double-click that opens a node's own document
 * (kwxutvpw, trxzsqpv); it reports its path and leaves the opening, and the
 * resolution of the path, to the host. Its keyboard activation stops at the
 * entry rather than reaching the page's Enter-select of the keyboard focus
 * (keyboard.ts).
 */
function refPathEntry(path: string): HTMLElement {
	const entry = document.createElement("span");
	entry.className = REF_ENTRY_CLASS;
	entry.setAttribute("role", "link");
	entry.setAttribute("tabindex", "0");
	entry.textContent = path;
	const activate = (): void => {
		post({ type: "openRef", path });
	};
	entry.addEventListener("click", (event: MouseEvent): void => {
		event.preventDefault();
		activate();
	});
	entry.addEventListener("keydown", (event: KeyboardEvent): void => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		activate();
	});
	return entry;
}

/** The content type a value is marked with, as content.type spells it. */
function contentTypeMark(type: string): HTMLElement {
	const mark = document.createElement("div");
	mark.className = "detail__type";
	mark.textContent = type;
	return mark;
}

/** A verbatim monospaced block: line breaks and indentation are kept. */
function monospacedBlock(text: string): HTMLElement {
	const block = document.createElement("pre");
	block.className = "detail__block";
	block.textContent = text;
	return block;
}

/**
 * Show `text` as running prose (qwzwpxws): one paragraph per blank-line
 * separated block, so paragraph breaks are kept and the text wraps instead of
 * being framed as code.
 */
function appendProse(into: HTMLElement, text: string): void {
	for (const paragraph of text.split(/\n[ \t]*\n/)) {
		const element = document.createElement("p");
		element.className = "detail__prose";
		element.textContent = paragraph.trim();
		into.append(element);
	}
}

/** Restore the persisted panel state, now or at attach (vpqxkzxq). */
function restorePanelState(state: PanelState): void {
	persisted = state;
	if (queued !== undefined) {
		applyPanelState(queued, state);
	}
}

/** Act on one message from the extension host. */
export function receive(message: GraphMessage | PanelStateMessage): void {
	if (message.type === "panelState") {
		restorePanelState(message.state);
	} else if (message.type === "graph") {
		showGraph(message.records, message.labels, message.warnings);
	} else {
		states.failed(message.message);
	}
}

/** Hand one message to the host (the seam in the header). */
function post(message: PageMessage): void {
	vscode?.postMessage(message);
}

window.addEventListener("message", (event: MessageEvent<unknown>): void => {
	const message = event.data;
	if (isHostMessage(message)) {
		receive(message);
	}
});

/**
 * Tear the search down with the page (ksoupzqm): a page may be closed through
 * any standard lifecycle notification, so every one of them detaches the
 * field, its listeners and its marks, and no search state outlives the page.
 */
function disposeSearch(): void {
	search?.dispose();
	search = undefined;
}
for (const event of ["pagehide", "beforeunload", "unload"]) {
	window.addEventListener(event, disposeSearch);
}

// The listener above is attached synchronously while this module runs, but the
// host may already have posted the first graph state by then and lost the
// message. Announcing that the page is listening lets the host post it again.
post({ type: "ready" });

/**
 * A shallow check of a message from the host. Its fields are trusted as data
 * only: they are rendered as text and never interpreted.
 */
function isHostMessage(value: unknown): value is GraphMessage | PanelStateMessage {
	if (typeof value !== "object" || value === null || !("type" in value)) {
		return false;
	}
	const type = (value as { type: unknown }).type;
	return type === "graph" || type === "error" || type === "panelState";
}

/**
 * The nodes `dragged` puts somewhere other than the layout in hand (tnturzro):
 * the ones a move moved, and therefore the only boxes it measures.
 */
function movedNodes(
	dragged: ReadonlyMap<string, Point>,
	previous: GraphLayout,
): string[] {
	const moved: string[] = [];
	for (const [id, position] of dragged) {
		const box = previous.nodes.get(id);
		if (box !== undefined && (box.x !== position.x || box.y !== position.y)) {
			moved.push(id);
		}
	}
	return moved;
}

/** The layers the moved nodes sit in, once each: the rows a move can resize. */
function movedLayers(
	moved: readonly string[],
	previous: GraphLayout,
	layout: GraphLayout,
): number[] {
	const layers: number[] = [];
	for (const id of moved) {
		const box = previous.nodes.get(id) ?? layout.nodes.get(id);
		if (box !== undefined && !layers.includes(box.layer)) {
			layers.push(box.layer);
		}
	}
	return layers;
}

/** The tallest box of one layer: what sets that row's height (owtptzpl). */
function rowHeight(layout: GraphLayout, layer: number): number {
	let height = 0;
	for (const box of layout.nodes.values()) {
		if (box.layer === layer && box.height > height) {
			height = box.height;
		}
	}
	return height;
}

/** One of the page regions the graph is drawn or reported into (media/webview.html). */
function mustGet<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (element === null) {
		throw new Error(`media/webview.html is missing ${selector}`);
	}
	return element;
}
