# Deccy Viewer

Deccy Viewer is a VS Code extension that visualises the deccy graph of a project. It helps
visualise the connections between the nodes of that graph, beyond what a jj graph shows.

## Getting started

Open the graph with the **Deccy: Open Deccy Graph** command, either from the Command Palette or
from that command's editor title bar entry. The editor title bar entry is shown while the graph
webview panel is the active webview panel.

## Features

- An interactive graph in a panel, drawn with boxes for decisions and rounded boxes for
  evaluations.
- Each node's box displays only its label from the jj change description.
- Dependency edges are solid and evaluation edges are dashed, each with a single arrowhead at the
  child end, and unresolved edges are visibly marked.
- Pressing `/` with no modifier opens a focused search field without changing the current
  selection, pan or zoom.
- Typing a query marks every node whose id, label or content contains the query, ignoring case, and
  marks no node when the query is empty.
- Pressing `Enter` and `Shift+Enter` steps to the next and previous marked node in graph order,
  wrapping at either end.
- Pressing `Esc` closes the search field and clears the search marks and selection.
- Selecting a node shows its detail panel with three labelled sections — **Kind**, **Content** and
  **Rationale** — in that fixed order for every selection, with each value under its label and
  empty sections still shown with their labels.
- In the **Content** section, the value is formatted by its content type while keeping the
  section's label and place and leaving **Kind** and **Rationale** unchanged: narrative prose is
  shown as wrapped running text with paragraph breaks preserved and no code framing; structured or
  code content and any other content types are shown verbatim in a monospaced block labelled with
  the content type, preserving line breaks and indentation without refusing or hiding unrecognised
  types; and file-referenced content shows the content type and referenced file paths in that
  block.
- Selecting a node also shows four labelled relationship sections — `depends_on`, `evaluates`,
  `dependents` and `evaluators` — listing related node ids for the selected node's prerequisites,
  evaluated nodes (empty for a decision), dependents and evaluators, with empty sections showing an
  explicit empty state.

## Development

A fresh clone runs with a single VS Code debug session, with no manual build, install or packaging
in between.

## License

The extension is licensed under Apache-2.0. See the LICENSE file at the repository root for the
full text.
