/**
 * Find-by-text over the presented graph (ksoupzqm): the search field the page
 * attaches to the canvas, the matching a typed query performs (oovzklpv), the
 * movement Enter and Shift+Enter make through the marked nodes (yqwsztww), the
 * dismissal Esc performs (kstrrnyt), the re-marking a reload asks for
 * (ukuppmko), the match emphasis a marked node carries (zolnxlyv) and the
 * centring the movement's selection asks the interaction for (uowtmmqw), all on
 * the page interface (ympqvvwr) of the interaction state (noplrntp).
 *
 * The module owns its whole surface:
 *
 * - the field. `/` with no Ctrl, Meta or Alt held opens it over the canvas
 *   (nvxuyzot) and focuses it; opening it neither selects nor reframes
 *   anything, so the current selection, pan and zoom stay as they are. Nothing
 *   opens while the user is typing in some other field of the page;
 * - the matching. A query marks every node of the presented graph whose id,
 *   label or content contains it, ignoring case (oovzklpv); an empty query
 *   marks nothing. The marks follow the query as it is typed (`input`), and
 *   are re-derived from the graph — never remembered per box — so a reloaded
 *   graph is marked again under the same rule (ukuppmko) without the query
 *   being lost;
 * - the movement. Enter selects the next marked node in graph order (order.ts)
 *   and Shift+Enter the previous, wrapping at the ends (yqwsztww); with no
 *   marked node neither changes anything, so an unproductive query leaves the
 *   selection alone. The selection the press lands on is the third trigger of
 *   the one centring move the viewer records (uowtmmqw, wzsxvmvw), so the
 *   module asks the interaction to centre on the node that selection landed on
 *   and asks for nothing else: no pan, no zoom, no fit and no focus of its
 *   own;
 * - the dismissal. Esc closes the field, clears the marks and clears the
 *   selection (kstrrnyt), leaving no search state behind;
 * - the emphasis. A marked node carries {@link SEARCH_MATCH_CLASS}, added
 *   alongside the classes the selection sets — never instead of one and never
 *   by dimming a non-match (zolnxlyv). Its appearance belongs to
 *   styles/search.css.
 *
 * The graph and the labels are handed in and replaced through
 * {@link SearchController.setGraph}; selection goes through the
 * `InteractionController` of the page interface, so the module never touches
 * the drawn selection state itself. The composition (main.ts) attaches it.
 */

import type { NodeContent } from "../data/nodes";
import type { InteractionController, InteractionGraph } from "./contract";
import { NODE_ID_ATTR } from "./contract";

/**
 * The class a node box carries while the active query matches it (zolnxlyv):
 * an added emphasis of its own, distinct from the selection's classes so it
 * never displaces them.
 */
export const SEARCH_MATCH_CLASS = "is-search-match";

/** What the page hands the search module (ympqvvwr). */
export interface SearchView {
	/** The element that clips the graph; the field opens over it. */
	canvas: HTMLElement;
	/**
	 * The interaction state the search selects through and asks for the centring
	 * of the node it selects (noplrntp, uowtmmqw).
	 */
	controller: InteractionController;
	/** The graph being presented, in graph order (order.ts). */
	graph: InteractionGraph;
	/** The label of every node, keyed by node id (oovzklpv). */
	labels: ReadonlyMap<string, string>;
}

/** The search the page attaches (nvxuyzot, ukuppmko). */
export interface SearchController {
	/** Open the search field over the canvas and focus it (nvxuyzot). */
	open(): void;
	/**
	 * Dismiss the search: close the field, clear the marks, reset the query and
	 * clear the selection (kstrrnyt).
	 */
	close(): void;
	/** Make `query` the active query and mark the nodes it matches (oovzklpv). */
	setQuery(query: string): void;
	/** The active query. */
	query(): string;
	/** Whether the field is open. */
	isOpen(): boolean;
	/** The ids of the nodes the active query marks, in no fixed order. */
	marks(): readonly string[];
	/**
	 * Swap the presented graph and, when given, its labels (ukuppmko): the
	 * active query is kept and the new graph is marked again by the same rule.
	 * The selection is left to the reload behaviour of the interaction state.
	 */
	setGraph(graph: InteractionGraph, labels?: ReadonlyMap<string, string>): void;
	/** Detach the listeners and remove the field and its marks. */
	dispose(): void;
}

/**
 * Attach find-by-text to the elements of the page interface (ksoupzqm) and
 * return the search it drives.
 */
export function attachSearch(view: SearchView): SearchController {
	const owner = view.canvas.ownerDocument;

	// --- the field (nvxuyzot) ----------------------------------------------

	// The field is built once and attached only while the search is open, so
	// opening and closing do not rebuild it and the typed query survives.
	const panel = owner.createElement("div");
	panel.className = "search";
	const field = owner.createElement("input");
	field.type = "text";
	field.className = "search__field";
	field.setAttribute("aria-label", "Search nodes");
	field.placeholder = "Search nodes";
	panel.append(field);

	let graph = view.graph;
	let labels = view.labels;
	let activeQuery = "";
	let open = false;

	/** The ids the active query marks (oovzklpv). */
	const marked = new Set<string>();

	/** Every node box drawn in the canvas, looked up by the id it carries. */
	const boxes = (): HTMLElement[] =>
		Array.from(view.canvas.querySelectorAll<HTMLElement>(`[${NODE_ID_ATTR}]`));

	// --- matching (oovzklpv) -----------------------------------------------

	/** Apply the match class to exactly the boxes of the marked ids, and to none. */
	const paint = (): void => {
		for (const box of boxes()) {
			const id = box.getAttribute(NODE_ID_ATTR);
			if (id !== null && marked.has(id)) {
				box.classList.add(SEARCH_MATCH_CLASS);
			} else {
				box.classList.remove(SEARCH_MATCH_CLASS);
			}
		}
	};

	/**
	 * Re-derive the marked set from the active query and the presented graph
	 * (oovzklpv, ukuppmko). Deriving it from the graph is what lets a reload
	 * mark the new graph again: no mark is remembered per box.
	 */
	const mark = (): void => {
		marked.clear();
		const needle = activeQuery.toLowerCase();
		if (needle.length > 0) {
			for (const node of graph.model.nodes) {
				if (matches(node.id, node.content, labels, needle)) {
					marked.add(node.id);
				}
			}
		}
		paint();
	};

	const onInput = (): void => {
		activeQuery = field.value;
		mark();
	};
	field.addEventListener("input", onInput);

	// --- opening and dismissing (nvxuyzot, kstrrnyt) -----------------------

	const openSearch = (): void => {
		if (!open) {
			view.canvas.append(panel);
			open = true;
		}
		field.value = activeQuery;
		field.focus();
	};

	const clearMarks = (): void => {
		marked.clear();
		paint();
	};

	const closeSearch = (): void => {
		open = false;
		panel.remove();
		// kstrrnyt: closing leaves no search state behind — no mark, no
		// selection and no query, so the field reopens neutral (oovzklpv) and a
		// reload after the dismissal marks nothing.
		activeQuery = "";
		field.value = "";
		clearMarks();
		view.controller.clearSelection();
	};

	// --- movement through the marks (yqwsztww, uowtmmqw) --------------------

	/**
	 * Select the marked node after (`reverse` false) or before (`reverse` true)
	 * the selected one in graph order, wrapping at the ends (yqwsztww). With
	 * nothing selected the walk starts at the first marked node, or the last
	 * when going backwards. With no marked node nothing changes, and then no
	 * centring is asked for either (uowtmmqw).
	 */
	const step = (reverse: boolean): void => {
		const order = graph.order.ids.filter((id) => marked.has(id));
		if (order.length === 0) {
			return;
		}
		const size = order.length;
		const delta = reverse ? -1 : 1;
		const current = view.controller.selected();
		const at = current === null ? -1 : order.indexOf(current);
		// Nothing selected starts at the first marked node, or the last when
		// walking backwards; otherwise the walk steps and wraps.
		const index = at === -1 ? (reverse ? size - 1 : 0) : (at + delta + size) % size;
		const landed = order[index];
		view.controller.select(landed);
		// uowtmmqw: the selection this press just made is the third trigger of
		// the one centring move wzsxvmvw records, so the module asks the
		// interaction for that move on the node the selection landed on - one ask
		// per selection, in the order the selections land, through the centring
		// member the page interface declares (ympqvvwr). The move, its axis and
		// limit terms and the zoom it leaves alone stay the interaction state's
		// (wzsxvmvw, noplrntp): the module pans, zooms, fits and focuses nothing
		// of its own here.
		view.controller.centreOnNode(landed);
	};

	// --- the keyboard (nvxuyzot, yqwsztww, kstrrnyt) -----------------------

	const onKeyDown = (event: KeyboardEvent): void => {
		// The bindings are only live with no Ctrl, Meta or Alt held (the same
		// rule keyboard.ts follows), so a shortcut for the workbench or the
		// editor never opens or drives the search.
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return;
		}

		// `/` opens the field (nvxuyzot), unless the user is typing elsewhere.
		if (event.key === "/") {
			if (isTyping(event.target)) {
				return;
			}
			event.preventDefault();
			openSearch();
			return;
		}

		if (!open) {
			return;
		}

		// Enter and Shift+Enter walk the marked set while the field has focus
		// (yqwsztww); outside the field they stay with keyboard.ts.
		if (event.key === "Enter" && event.target === field) {
			event.preventDefault();
			step(event.shiftKey);
			return;
		}

		// Esc dismisses the search (kstrrnyt).
		if (event.key === "Escape") {
			event.preventDefault();
			closeSearch();
		}
	};
	owner.addEventListener("keydown", onKeyDown);

	return {
		open: openSearch,
		close: closeSearch,
		setQuery(query: string): void {
			activeQuery = query;
			field.value = query;
			mark();
		},
		query(): string {
			return activeQuery;
		},
		isOpen(): boolean {
			return open;
		},
		marks(): readonly string[] {
			return [...marked];
		},
		setGraph(next: InteractionGraph, names?: ReadonlyMap<string, string>): void {
			graph = next;
			if (names !== undefined) {
				labels = names;
			}
			// ukuppmko: the query stays and the new graph is marked again.
			mark();
		},
		dispose(): void {
			owner.removeEventListener("keydown", onKeyDown);
			field.removeEventListener("input", onInput);
			panel.remove();
			open = false;
			clearMarks();
		},
	};
}

/**
 * Whether `id`, the node's label or its content contains `needle` (oovzklpv).
 * `needle` is already lower-cased; the three things the graph records about a
 * node are compared the same way, ignoring case.
 */
function matches(
	id: string,
	content: NodeContent,
	labels: ReadonlyMap<string, string>,
	needle: string,
): boolean {
	if (id.toLowerCase().includes(needle)) {
		return true;
	}
	const label = labels.get(id);
	if (label !== undefined && label.toLowerCase().includes(needle)) {
		return true;
	}
	const body = content.content;
	return typeof body === "string" && body.toLowerCase().includes(needle);
}

/** Whether the event target is somewhere the user types. */
function isTyping(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
	);
}
