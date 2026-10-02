# Panel layout

Normative spatial arrangement of the webview panel. Appearance (colours,
strokes, shapes) is defined by the visual-spec records; this file says only
where regions sit.

## Default

```
+------------------------------------------------------+
| [fit-graph]                                          |  toolbar
+------------------------------------------------------+
|                                                      |  error banner
|                                                      |  (error state only)
+------------------------------------------------------+
|                                       +--------------+  detail:
|                                       | kind         |  sections,
|                                       +--------------+  each
|                canvas                 | content      |  collapsible
|                                       +--------------+  independently
|                                       | rationale    |
|                                       +--------------+
+------------------------------------------------------+
```

- toolbar: fixed row at the top of the panel
- error banner: directly below the toolbar, present only in the error state
- canvas: fills all remaining area
- detail: right-hand region beside the canvas, holding a vertical stack of sections in the order kind, content, rationale
- each section of the detail stack collapses and expands independently: collapsing one hides only that section's value, leaves that section's label in the stack, and neither moves nor hides the other two sections
- the edge layer is an overlay at the canvas origin and takes no layout space; the node boxes are drawn above it

## Narrow (< 600px)

```
+--------------------------+
| toolbar                  |
+--------------------------+
| error banner (when shown)|
+--------------------------+
| canvas                   |
+--------------------------+
| detail (stacked below)   |
+--------------------------+
```