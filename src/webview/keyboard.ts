/**
 * Keyboard equivalents for the pointer behaviours of the deccy graph
 * viewer (ykvrkysl, noplrntp), bound to the interaction state of the page
 * interface (ympqvvwr, implemented in interact.ts).
 *
 * - Tab and Shift+Tab move focus through the graph order, wrapping at the ends
 *   (ruqsmuxz, rwonulnq): topological depth from the roots, then the initial
 *   left-to-right position, then the node id, and dragging a node never
 *   changes it (order.ts);
 * - Enter selects the focused node (wzqzwsst) and Esc clears the selection
 *   (zpkmkvts), the keyboard equivalents of clicking a node and clicking
 *   empty canvas (ltrnmrsr, oumoznwq);
 * - the arrow keys pan the viewport (zvokurzw), pointing where the viewport
 *   moves;
 * - Shift and an arrow key move the selected node (nyxwutoo), the keyboard
 *   equivalent of dragging it (spllzqlw), pointing where the node moves;
 * - + and - zoom about the centre of the viewport (pposortu) and f fits the
 *   graph to it (muvkrvuu, lntrymms).
 *
 * Everything else is left alone: the keys are only bound with no Ctrl, Meta or
 * Alt held (Shift is part of the bindings), and nothing is intercepted while
 * the user is typing.
 */

import type { InteractionController, InteractionView } from "./contract";

/** How far an arrow key pans the viewport, in canvas pixels (zvokurzw). */
export const PAN_STEP = 48;

/** How far Shift+arrow moves the selected node, in graph pixels (nyxwutoo). */
export const NUDGE_STEP = 8;

/** Zoom factor per press of + or - (pposortu). */
export const KEY_ZOOM_STEP = 1.2;

/** The bindings; dispose removes them again. */
export interface KeyboardBinding {
	dispose(): void;
}

/** Bind the keyboard equivalents to the interaction state (ykvrkysl). */
export function attachKeyboard(
	controller: InteractionController,
	view: InteractionView,
): KeyboardBinding {
	const document = view.canvas.ownerDocument;

	const onKeyDown = (event: KeyboardEvent): void => {
		if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) {
			return;
		}

		switch (event.key) {
			// Focus walks the graph order and wraps (ruqsmuxz, rwonulnq).
			case "Tab":
				event.preventDefault();
				controller.focusStep(event.shiftKey);
				return;

			// Enter is the keyboard click to select (wzqzwsst).
			case "Enter": {
				const focused = controller.focused();
				if (focused !== null) {
					event.preventDefault();
					controller.select(focused);
				}
				return;
			}

			// Esc is the keyboard click on empty canvas (zpkmkvts, oumoznwq).
			case "Escape":
				event.preventDefault();
				controller.clearSelection();
				return;

			case "+":
			case "=":
				event.preventDefault();
				controller.zoomAboutCentre(KEY_ZOOM_STEP);
				return;

			case "-":
			case "_":
				event.preventDefault();
				controller.zoomAboutCentre(1 / KEY_ZOOM_STEP);
				return;

			case "f":
			case "F":
				event.preventDefault();
				controller.fitGraph();
				return;

			case "ArrowUp":
			case "ArrowDown":
			case "ArrowLeft":
			case "ArrowRight": {
				event.preventDefault();
				const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
				const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
				const selected = controller.selected();
				if (event.shiftKey && selected !== null) {
					// Shift moves the selected node (nyxwutoo).
					controller.moveNodeBy(selected, dx * NUDGE_STEP, dy * NUDGE_STEP);
				} else {
					// The arrows alone pan (zvokurzw).
					controller.panBy(-dx * PAN_STEP, -dy * PAN_STEP);
				}
				return;
			}
		}
	};

	document.addEventListener("keydown", onKeyDown);
	return {
		dispose: (): void => {
			document.removeEventListener("keydown", onKeyDown);
		},
	};
}

/** Whether the event target is somewhere the user types. */
function isTyping(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
	);
}
