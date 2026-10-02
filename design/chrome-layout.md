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
|                                       +--------------+
|                                       | detail       |
|                canvas                 | (collapsible)|
|                                       |              |
|                                       +--------------+
+------------------------------------------------------+
```

- toolbar: fixed row at the top of the panel
- error banner: directly below the toolbar, present only in the error state
- canvas: fills all remaining area
- detail: right-hand region beside the canvas, collapsible
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