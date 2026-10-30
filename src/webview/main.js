// src/data/nodes.ts
var ROOT_NODE_ID = "zzzzzzzz";

// src/graph/model.ts
function buildGraph(records) {
  const nodes = [];
  const known = /* @__PURE__ */ new Set();
  for (const record of records) {
    nodes.push({ id: record.id, kind: record.kind, content: record.content });
    known.add(record.id);
  }
  const edges = [];
  const add = (kind, from, to) => {
    if (from === ROOT_NODE_ID || to === ROOT_NODE_ID) {
      return;
    }
    let danglingEnd;
    if (!known.has(from)) {
      danglingEnd = "from";
    } else if (!known.has(to)) {
      danglingEnd = "to";
    }
    edges.push({ kind, from, to, danglingEnd });
  };
  for (const record of records) {
    for (const prerequisite of record.dependsOn) {
      add("depends_on", prerequisite, record.id);
    }
    for (const evaluated of record.evaluates) {
      add("evaluates", record.id, evaluated);
    }
  }
  const hasParent = /* @__PURE__ */ new Set();
  for (const edge of edges) {
    if (edge.danglingEnd === void 0) {
      hasParent.add(edge.to);
    }
  }
  const roots = nodes.filter((node) => !hasParent.has(node.id)).map((node) => node.id);
  return { nodes, edges, roots };
}
function neighbourhood(model2, id) {
  const edges = [];
  const nodes = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (other) => {
    if (other !== id && !seen.has(other)) {
      seen.add(other);
      nodes.push(other);
    }
  };
  for (const edge of model2.edges) {
    if (edge.from === id) {
      edges.push(edge);
      if (edge.danglingEnd !== "to") {
        add(edge.to);
      }
    } else if (edge.to === id) {
      edges.push(edge);
      if (edge.danglingEnd !== "from") {
        add(edge.from);
      }
    }
  }
  return { edges, nodes };
}

// src/graph/order.ts
function graphOrder(model2) {
  const parents = /* @__PURE__ */ new Map();
  const children = /* @__PURE__ */ new Map();
  for (const node of model2.nodes) {
    parents.set(node.id, /* @__PURE__ */ new Set());
    children.set(node.id, /* @__PURE__ */ new Set());
  }
  for (const edge of model2.edges) {
    if (edge.danglingEnd !== void 0) {
      continue;
    }
    children.get(edge.from)?.add(edge.to);
    parents.get(edge.to)?.add(edge.from);
  }
  const depth = depthFromRoots(model2, parents, children);
  const column = leftToRightPositions(model2, depth, parents);
  const ids = model2.nodes.map((node) => node.id);
  ids.sort((a, b) => {
    const depthA = depth.get(a) ?? 0;
    const depthB = depth.get(b) ?? 0;
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    const columnA = column.get(a) ?? 0;
    const columnB = column.get(b) ?? 0;
    if (columnA !== columnB) {
      return columnA - columnB;
    }
    return compareIds(a, b);
  });
  return { ids, depth, column };
}
function depthFromRoots(model2, parents, children) {
  const depth = /* @__PURE__ */ new Map();
  const waitingOn = /* @__PURE__ */ new Map();
  const ready = [];
  for (const node of model2.nodes) {
    const count = parents.get(node.id)?.size ?? 0;
    depth.set(node.id, 0);
    waitingOn.set(node.id, count);
    if (count === 0) {
      ready.push(node.id);
    }
  }
  for (let i = 0; i < ready.length; i++) {
    const id = ready[i];
    const next = (depth.get(id) ?? 0) + 1;
    for (const child of children.get(id) ?? []) {
      if (next > (depth.get(child) ?? 0)) {
        depth.set(child, next);
      }
      const left = (waitingOn.get(child) ?? 0) - 1;
      waitingOn.set(child, left);
      if (left === 0) {
        ready.push(child);
      }
    }
  }
  return depth;
}
function leftToRightPositions(model2, depth, parents) {
  const layers = /* @__PURE__ */ new Map();
  for (const node of model2.nodes) {
    const layer = depth.get(node.id) ?? 0;
    const ids = layers.get(layer) ?? [];
    ids.push(node.id);
    layers.set(layer, ids);
  }
  const column = /* @__PURE__ */ new Map();
  const layerNumbers = [...layers.keys()].sort((a, b) => a - b);
  for (const layer of layerNumbers) {
    const ids = layers.get(layer) ?? [];
    const key = /* @__PURE__ */ new Map();
    for (const id of ids) {
      key.set(id, attachment(id, column, parents));
    }
    ids.sort((a, b) => {
      const keyA = key.get(a) ?? Number.POSITIVE_INFINITY;
      const keyB = key.get(b) ?? Number.POSITIVE_INFINITY;
      if (keyA !== keyB) {
        return keyA < keyB ? -1 : 1;
      }
      return compareIds(a, b);
    });
    ids.forEach((id, index) => column.set(id, index));
  }
  return column;
}
function attachment(id, column, parents) {
  const attached = parents.get(id);
  if (attached === void 0 || attached.size === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  for (const parent of attached) {
    sum += column.get(parent) ?? 0;
  }
  return sum / attached.size;
}
function compareIds(a, b) {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

// src/graph/layout.ts
var NODE_WIDTH = 240;
var NODE_MIN_HEIGHT = 72;
var LAYER_SPACING = 96;
var NODE_GAP = 96;
function layoutGraph(model2, order2, options = {}) {
  const { heights, dragged } = options;
  const rowHeight = /* @__PURE__ */ new Map();
  for (const node of model2.nodes) {
    const layer = order2.depth.get(node.id) ?? 0;
    const height = boxHeight(node.id, heights);
    if (height > (rowHeight.get(layer) ?? 0)) {
      rowHeight.set(layer, height);
    }
  }
  const rowY = /* @__PURE__ */ new Map();
  let y = 0;
  const layerNumbers = [...rowHeight.keys()].sort((a, b) => a - b);
  for (const layer of layerNumbers) {
    rowY.set(layer, y);
    y += (rowHeight.get(layer) ?? NODE_MIN_HEIGHT) + LAYER_SPACING;
  }
  const nodes = /* @__PURE__ */ new Map();
  for (const id of order2.ids) {
    const layer = order2.depth.get(id) ?? 0;
    const box = {
      id,
      layer,
      column: order2.column.get(id) ?? 0,
      x: (order2.column.get(id) ?? 0) * (NODE_WIDTH + NODE_GAP),
      y: rowY.get(layer) ?? 0,
      width: NODE_WIDTH,
      height: boxHeight(id, heights)
    };
    const moved = dragged?.get(id);
    if (moved !== void 0) {
      box.x = moved.x;
      box.y = moved.y;
    }
    nodes.set(id, box);
  }
  const edges = [];
  for (const edge of model2.edges) {
    const route = routeEdge(edge, nodes);
    if (route !== void 0) {
      edges.push(route);
    }
  }
  return { nodes, edges, bounds: boundsOf(nodes.values(), edges) };
}
function boxHeight(id, heights) {
  const measured = heights?.get(id) ?? 0;
  return measured > NODE_MIN_HEIGHT ? measured : NODE_MIN_HEIGHT;
}
function routeEdge(edge, nodes) {
  const from = nodes.get(edge.from);
  const to = nodes.get(edge.to);
  if (from !== void 0 && to !== void 0) {
    const downwards = to.y >= from.y;
    const start = downwards ? { x: from.x + from.width / 2, y: from.y + from.height } : { x: from.x + from.width / 2, y: from.y };
    const end = downwards ? { x: to.x + to.width / 2, y: to.y } : { x: to.x + to.width / 2, y: to.y + to.height };
    return bezier(edge, start, end);
  }
  if (from !== void 0) {
    const start = { x: from.x + from.width / 2, y: from.y + from.height };
    return bezier(edge, start, { x: start.x, y: start.y + LAYER_SPACING });
  }
  if (to !== void 0) {
    const end = { x: to.x + to.width / 2, y: to.y };
    return bezier(edge, { x: end.x, y: end.y - LAYER_SPACING }, end);
  }
  return void 0;
}
function bezier(edge, start, end) {
  const half = (end.y - start.y) / 2;
  return {
    edge,
    start,
    control1: { x: start.x, y: start.y + half },
    control2: { x: end.x, y: end.y - half },
    end
  };
}
function boundsOf(boxes, edges) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const grow = (point) => {
    if (point.x < minX) {
      minX = point.x;
    }
    if (point.y < minY) {
      minY = point.y;
    }
    if (point.x > maxX) {
      maxX = point.x;
    }
    if (point.y > maxY) {
      maxY = point.y;
    }
  };
  for (const box of boxes) {
    grow({ x: box.x, y: box.y });
    grow({ x: box.x + box.width, y: box.y + box.height });
  }
  for (const route of edges) {
    grow(route.start);
    grow(route.end);
  }
  if (minX === Number.POSITIVE_INFINITY) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// src/webview/contract.ts
var SELECTORS = {
  canvas: "main.canvas",
  surface: ".canvas__surface",
  edges: "svg.canvas__edges",
  nodes: "div.canvas__nodes",
  banner: "div.panel__banner",
  fitAction: ".panel__action",
  detailBody: ".detail__body"
};
var NODE_ID_ATTR = "data-node-id";
var EDGE_KEY_ATTR = "data-edge-key";
function edgeKey(edge) {
  return `${edge.kind}:${edge.from}->${edge.to}`;
}
var EmphasisClasses = {
  /** node/selected: the selected node (ortyupqp). */
  selected: "is-selected",
  /** node/related, edge/related: the context of a selection (zkwypuor). */
  related: "is-related",
  /** node/related, edge/related: the neighbourhood under the pointer (moklnvms). */
  hoverNeighbour: "is-hover-neighbour",
  /** *: elements unrelated to the selection (ksywwktl). */
  dimmed: "is-dimmed",
  /** node/dragging: the node being dragged (xslqyywt). */
  dragging: "is-dragging",
  /** node/focus: the node keyboard traversal is on (ozxnxzus). */
  focus: "is-focus",
  /** The canvas while it is being panned (srsnqppq, uswruqlq). */
  panning: "is-panning"
};

// src/webview/render.ts
var ARROWHEAD_SIZE = 8;
var SVG_NS = "http://www.w3.org/2000/svg";
function renderGraph(target2, state) {
  const bounds = state.layout.bounds;
  renderEdges(target2.edges, state.layout.edges, bounds);
  renderNodes(target2.nodes, state, bounds);
  return measureHeights(target2.nodes);
}
function renderEdges(svg, routes, bounds) {
  svg.setAttribute("width", String(bounds.width));
  svg.setAttribute("height", String(bounds.height));
  svg.replaceChildren();
  const defs = document.createElementNS(SVG_NS, "defs");
  for (const role of ["depends_on", "evaluates", "unresolved"]) {
    defs.appendChild(arrowhead(role));
  }
  svg.appendChild(defs);
  const layer = document.createElementNS(SVG_NS, "g");
  layer.setAttribute("transform", `translate(${-bounds.x} ${-bounds.y})`);
  for (const route of routes) {
    const d = `M ${route.start.x} ${route.start.y} C ${route.control1.x} ${route.control1.y}, ${route.control2.x} ${route.control2.y}, ${route.end.x} ${route.end.y}`;
    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("class", "edge__hit");
    hit.setAttribute(EDGE_KEY_ATTR, edgeKey(route.edge));
    hit.setAttribute("d", d);
    layer.appendChild(hit);
    const edge = document.createElementNS(SVG_NS, "path");
    edge.setAttribute("class", edgeClasses(route.edge));
    edge.setAttribute(EDGE_KEY_ATTR, edgeKey(route.edge));
    edge.setAttribute("d", d);
    edge.setAttribute("marker-end", `url(#${arrowheadId(route.edge)})`);
    layer.appendChild(edge);
  }
  svg.appendChild(layer);
}
function renderNodes(layer, state, bounds) {
  layer.style.width = `${bounds.width}px`;
  layer.style.height = `${bounds.height}px`;
  layer.replaceChildren();
  const kinds = new Map(state.model.nodes.map((node) => [node.id, node.kind]));
  for (const id of state.order.ids) {
    const box = state.layout.nodes.get(id);
    const kind = kinds.get(id);
    if (box === void 0 || kind === void 0) {
      continue;
    }
    const element = document.createElement("div");
    element.className = `node node--${kind}`;
    element.dataset.nodeId = id;
    element.style.left = `${box.x - bounds.x}px`;
    element.style.top = `${box.y - bounds.y}px`;
    element.style.width = `${box.width}px`;
    const label = document.createElement("div");
    label.className = "node__label";
    label.textContent = state.labels.get(id) ?? id;
    const secondary = document.createElement("div");
    secondary.className = "node__label-secondary";
    secondary.textContent = id;
    element.append(label, secondary);
    layer.appendChild(element);
  }
}
function edgeClasses(edge) {
  const classes = ["edge", `edge--${edge.kind}`];
  if (edge.danglingEnd !== void 0) {
    classes.push("edge--unresolved");
  }
  return classes.join(" ");
}
function arrowheadId(edge) {
  return `arrowhead-${edge.danglingEnd === void 0 ? edge.kind : "unresolved"}`;
}
function arrowhead(role) {
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", `arrowhead-${role}`);
  marker.setAttribute("class", `arrowhead arrowhead--${role}`);
  marker.setAttribute("markerWidth", String(ARROWHEAD_SIZE));
  marker.setAttribute("markerHeight", String(ARROWHEAD_SIZE));
  marker.setAttribute("refX", String(ARROWHEAD_SIZE));
  marker.setAttribute("refY", String(ARROWHEAD_SIZE / 2));
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "userSpaceOnUse");
  const tip = document.createElementNS(SVG_NS, "path");
  tip.setAttribute(
    "d",
    `M 0 0 L ${ARROWHEAD_SIZE} ${ARROWHEAD_SIZE / 2} L 0 ${ARROWHEAD_SIZE} Z`
  );
  marker.appendChild(tip);
  return marker;
}
function measureHeights(layer) {
  const heights = /* @__PURE__ */ new Map();
  for (const element of Array.from(layer.querySelectorAll(".node"))) {
    const id = element.dataset.nodeId;
    if (id !== void 0) {
      heights.set(id, Math.ceil(element.getBoundingClientRect().height));
    }
  }
  return heights;
}

// src/webview/interact.ts
var DRAG_THRESHOLD = 3;
var MIN_SCALE = 0.05;
var MAX_SCALE = 4;
var FIT_PADDING = 24;
var WHEEL_ZOOM_SPEED = 2e-3;
var TOOLTIP_OFFSET = 16;
function attachInteractions(view, delegate2, graph) {
  let model2 = graph.model;
  let order2 = graph.order;
  const dragged = /* @__PURE__ */ new Map();
  let layout = delegate2.relayout(dragged);
  const viewport = { x: 0, y: 0, scale: 1 };
  let selection = null;
  let focusId = null;
  let hoverId = null;
  let hoverEdge = null;
  let press = null;
  let drag = null;
  let pan = null;
  let pinch = null;
  const pointers = /* @__PURE__ */ new Map();
  let size = canvasSize();
  const tooltip = createTooltip(view);
  let disposed = false;
  view.surface.style.transformOrigin = "0 0";
  applyViewport();
  function refreshEmphasis() {
    const relatedNodes = /* @__PURE__ */ new Set();
    const relatedEdges = /* @__PURE__ */ new Set();
    if (selection !== null) {
      relatedNodes.add(selection);
      const related = neighbourhood(model2, selection);
      for (const id of related.nodes) {
        relatedNodes.add(id);
      }
      for (const edge of related.edges) {
        relatedEdges.add(edgeKey(edge));
      }
    }
    const hoverNodes = /* @__PURE__ */ new Set();
    const hoverEdges = /* @__PURE__ */ new Set();
    if (hoverId !== null) {
      const near = neighbourhood(model2, hoverId);
      for (const id of near.nodes) {
        hoverNodes.add(id);
      }
      for (const edge of near.edges) {
        hoverEdges.add(edgeKey(edge));
      }
    }
    if (hoverEdge !== null) {
      hoverEdges.add(hoverEdge);
    }
    for (const element of view.surface.querySelectorAll(`[${NODE_ID_ATTR}]`)) {
      const id = element.getAttribute("data-node-id") ?? "";
      toggle(element, EmphasisClasses.selected, id === selection);
      toggle(element, EmphasisClasses.related, selection !== null && id !== selection && relatedNodes.has(id));
      toggle(element, EmphasisClasses.dimmed, selection !== null && !relatedNodes.has(id));
      toggle(element, EmphasisClasses.hoverNeighbour, hoverNodes.has(id));
      toggle(element, EmphasisClasses.focus, id === focusId);
      toggle(element, EmphasisClasses.dragging, drag?.id === id);
    }
    for (const element of view.surface.querySelectorAll(`[${EDGE_KEY_ATTR}]`)) {
      const key = element.getAttribute("data-edge-key") ?? "";
      toggle(element, EmphasisClasses.related, selection !== null && relatedEdges.has(key));
      toggle(element, EmphasisClasses.dimmed, selection !== null && !relatedEdges.has(key));
      toggle(element, EmphasisClasses.hoverNeighbour, hoverEdges.has(key));
    }
  }
  function select(id) {
    const next = id !== null && nodeById(id) !== void 0 ? id : null;
    if (next === selection) {
      return;
    }
    selection = next;
    refreshEmphasis();
    delegate2.onSelectionChanged(selection);
  }
  function clearSelection() {
    select(null);
  }
  function focusNode(id) {
    const next = id !== null && nodeById(id) !== void 0 ? id : null;
    focusId = next;
    refreshEmphasis();
    if (focusId === null) {
      return;
    }
    const element = view.surface.querySelector(`[${NODE_ID_ATTR}="${focusId}"]`);
    if (element instanceof HTMLElement) {
      element.setAttribute("tabindex", "-1");
      element.focus({ preventScroll: true });
    }
  }
  function focusStep(reverse) {
    const ids = order2.ids;
    if (ids.length === 0) {
      return;
    }
    const index = focusId === null ? -1 : ids.indexOf(focusId);
    const next = index === -1 ? reverse ? ids.length - 1 : 0 : (index + (reverse ? -1 : 1) + ids.length) % ids.length;
    focusNode(ids[next]);
  }
  function canvasSize() {
    return { width: view.canvas.clientWidth, height: view.canvas.clientHeight };
  }
  function clampScale(scale) {
    return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
  }
  function applyViewport() {
    view.surface.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
  }
  function clampViewport() {
    const bounds = layout.bounds;
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }
    const width = bounds.width * viewport.scale;
    const height = bounds.height * viewport.scale;
    const left = viewport.x + bounds.x * viewport.scale;
    const top = viewport.y + bounds.y * viewport.scale;
    const minLeft = width <= size.width ? 0 : size.width - width;
    const maxLeft = width <= size.width ? size.width - width : 0;
    const minTop = height <= size.height ? 0 : size.height - height;
    const maxTop = height <= size.height ? size.height - height : 0;
    viewport.x += Math.min(Math.max(left, minLeft), maxLeft) - left;
    viewport.y += Math.min(Math.max(top, minTop), maxTop) - top;
  }
  function panBy(dx, dy) {
    viewport.x += dx;
    viewport.y += dy;
    clampViewport();
    applyViewport();
  }
  function zoomAt(factor, at) {
    const scale = clampScale(viewport.scale * factor);
    const applied = scale / viewport.scale;
    viewport.x = at.x - (at.x - viewport.x) * applied;
    viewport.y = at.y - (at.y - viewport.y) * applied;
    viewport.scale = scale;
    clampViewport();
    applyViewport();
  }
  function zoomAboutCentre(factor) {
    zoomAt(factor, { x: size.width / 2, y: size.height / 2 });
  }
  function fitGraph() {
    layout = delegate2.relayout(dragged);
    const bounds = layout.bounds;
    if (size.width <= 0 || size.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
      viewport.x = 0;
      viewport.y = 0;
      viewport.scale = 1;
      applyViewport();
      return;
    }
    const innerWidth = Math.max(size.width - 2 * FIT_PADDING, 1);
    const innerHeight = Math.max(size.height - 2 * FIT_PADDING, 1);
    viewport.scale = clampScale(Math.min(innerWidth / bounds.width, innerHeight / bounds.height));
    viewport.x = size.width / 2 - (bounds.x + bounds.width / 2) * viewport.scale;
    viewport.y = size.height / 2 - (bounds.y + bounds.height / 2) * viewport.scale;
    clampViewport();
    applyViewport();
  }
  function moveNodeBy(id, dx, dy) {
    if (nodeById(id) === void 0) {
      return;
    }
    const box = layout.nodes.get(id);
    const base = dragged.get(id) ?? (box !== void 0 ? { x: box.x, y: box.y } : { x: 0, y: 0 });
    dragged.set(id, { x: base.x + dx, y: base.y + dy });
    layout = delegate2.relayout(dragged);
  }
  function toCanvas(client) {
    const rect = view.canvas.getBoundingClientRect();
    return { x: client.x - rect.left, y: client.y - rect.top };
  }
  function toGraph(local) {
    return {
      x: (local.x - viewport.x) / viewport.scale,
      y: (local.y - viewport.y) / viewport.scale
    };
  }
  function onPointerDown(event) {
    if (event.button !== 0 || disposed) {
      return;
    }
    const client = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, client);
    view.canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 2) {
      if (drag === null && pan === null) {
        press = null;
        startPinch();
      }
      return;
    }
    if (pointers.size > 2) {
      return;
    }
    const id = targetNodeId(event.target);
    const start = toCanvas(client);
    if (id !== null) {
      press = { kind: "node", id, pointerId: event.pointerId, start };
    } else {
      press = {
        kind: "background",
        pointerId: event.pointerId,
        start,
        onEdge: targetEdgeKey(event.target) !== null
      };
    }
  }
  function onPointerMove(event) {
    if (disposed) {
      return;
    }
    const client = { x: event.clientX, y: event.clientY };
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, client);
    }
    if (pinch !== null) {
      movePinch();
      return;
    }
    if (drag !== null && event.pointerId === drag.pointerId) {
      moveDrag(toCanvas(client));
      return;
    }
    if (pan !== null && event.pointerId === pan.pointerId) {
      movePan(toCanvas(client));
      return;
    }
    if (press !== null && event.pointerId === press.pointerId) {
      const local = toCanvas(client);
      if (distance(local, press.start) >= DRAG_THRESHOLD) {
        if (press.kind === "node") {
          startDrag(press, local);
        } else {
          startPan(press);
        }
        press = null;
      }
      return;
    }
    updateHover(event.target, client);
  }
  function onPointerUp(event) {
    if (disposed) {
      return;
    }
    pointers.delete(event.pointerId);
    if (pinch !== null) {
      if (pointers.size < 2) {
        pinch = null;
      }
      return;
    }
    if (drag !== null && event.pointerId === drag.pointerId) {
      drag = null;
      refreshEmphasis();
      return;
    }
    if (pan !== null && event.pointerId === pan.pointerId) {
      endPan();
      return;
    }
    if (press !== null && event.pointerId === press.pointerId) {
      const clicked = press;
      press = null;
      if (clicked.kind === "node") {
        select(clicked.id);
      } else if (!clicked.onEdge) {
        clearSelection();
      }
    }
  }
  function onPointerCancel(event) {
    pointers.delete(event.pointerId);
    pinch = null;
    press = null;
    if (drag !== null && event.pointerId === drag.pointerId) {
      drag = null;
      refreshEmphasis();
    }
    if (pan !== null && event.pointerId === pan.pointerId) {
      endPan();
    }
  }
  function onDoubleClick(event) {
    const id = targetNodeId(event.target);
    if (id !== null) {
      delegate2.openNodeDocument(id);
    }
  }
  function onWheel(event) {
    event.preventDefault();
    const travel = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 33 : event.deltaY;
    zoomAt(Math.exp(-travel * WHEEL_ZOOM_SPEED), toCanvas({ x: event.clientX, y: event.clientY }));
  }
  function onPointerLeave() {
    if (drag !== null || pan !== null || pinch !== null) {
      return;
    }
    clearHover();
  }
  function startDrag(pending, local) {
    const box = layout.nodes.get(pending.id);
    const origin = dragged.get(pending.id) ?? (box !== void 0 ? { x: box.x, y: box.y } : { x: 0, y: 0 });
    const pointer = toGraph(local);
    drag = {
      pointerId: pending.pointerId,
      id: pending.id,
      offset: { x: pointer.x - origin.x, y: pointer.y - origin.y }
    };
    clearHover();
    refreshEmphasis();
  }
  function moveDrag(local) {
    if (drag === null) {
      return;
    }
    const pointer = toGraph(local);
    dragged.set(drag.id, { x: pointer.x - drag.offset.x, y: pointer.y - drag.offset.y });
    layout = delegate2.relayout(dragged);
  }
  function startPan(pending) {
    pan = {
      pointerId: pending.pointerId,
      start: pending.start,
      origin: { x: viewport.x, y: viewport.y }
    };
    clearHover();
    view.canvas.classList.add(EmphasisClasses.panning);
  }
  function movePan(local) {
    if (pan === null) {
      return;
    }
    viewport.x = pan.origin.x + (local.x - pan.start.x);
    viewport.y = pan.origin.y + (local.y - pan.start.y);
    clampViewport();
    applyViewport();
  }
  function endPan() {
    pan = null;
    view.canvas.classList.remove(EmphasisClasses.panning);
  }
  function startPinch() {
    clearHover();
    const [first, second] = [...pointers.values()];
    if (first === void 0 || second === void 0) {
      pinch = null;
      return;
    }
    pinch = { distance: distance(first, second), midpoint: midpoint(first, second) };
  }
  function movePinch() {
    if (pinch === null || pointers.size < 2) {
      return;
    }
    const [first, second] = [...pointers.values()];
    if (first === void 0 || second === void 0) {
      return;
    }
    const next = { distance: distance(first, second), midpoint: midpoint(first, second) };
    if (pinch.distance > 0 && next.distance > 0) {
      zoomAt(next.distance / pinch.distance, toCanvas(next.midpoint));
      panBy(next.midpoint.x - pinch.midpoint.x, next.midpoint.y - pinch.midpoint.y);
    }
    pinch = next;
  }
  function updateHover(target2, client) {
    if (drag !== null || pan !== null || pinch !== null) {
      return;
    }
    const id = targetNodeId(target2);
    const key = id === null ? targetEdgeKey(target2) : null;
    if (id !== hoverId || key !== hoverEdge) {
      hoverId = id;
      hoverEdge = key;
      refreshEmphasis();
      if (hoverId !== null) {
        showTooltip(hoverId, client);
      } else {
        hideTooltip();
      }
    } else if (hoverId !== null) {
      positionTooltip(client);
    }
  }
  function clearHover() {
    hoverId = null;
    hoverEdge = null;
    hideTooltip();
    refreshEmphasis();
  }
  function showTooltip(id, client) {
    const node = nodeById(id);
    if (node === void 0) {
      hideTooltip();
      return;
    }
    tooltip.textContent = node.content.rationale;
    tooltip.hidden = false;
    positionTooltip(client);
  }
  function hideTooltip() {
    tooltip.hidden = true;
  }
  function positionTooltip(client) {
    if (tooltip.hidden) {
      return;
    }
    const hostWindow = tooltip.ownerDocument.defaultView;
    const maxWidth = (hostWindow?.innerWidth ?? Number.POSITIVE_INFINITY) - 2 * TOOLTIP_OFFSET;
    const maxHeight = (hostWindow?.innerHeight ?? Number.POSITIVE_INFINITY) - 2 * TOOLTIP_OFFSET;
    const left = Math.min(client.x + TOOLTIP_OFFSET, maxWidth - tooltip.offsetWidth);
    const top = Math.min(client.y + TOOLTIP_OFFSET, maxHeight - tooltip.offsetHeight);
    tooltip.style.left = `${Math.max(TOOLTIP_OFFSET, left)}px`;
    tooltip.style.top = `${Math.max(TOOLTIP_OFFSET, top)}px`;
  }
  function onResize() {
    const next = canvasSize();
    viewport.x += (next.width - size.width) / 2;
    viewport.y += (next.height - size.height) / 2;
    size = next;
    clampViewport();
    applyViewport();
  }
  function setGraph(next) {
    model2 = next.model;
    order2 = next.order;
    layout = delegate2.relayout(dragged);
    drag = null;
    pinch = null;
    clearHover();
    if (selection !== null && nodeById(selection) === void 0) {
      clearSelection();
    }
    if (focusId !== null && nodeById(focusId) === void 0) {
      focusNode(null);
    }
    refreshEmphasis();
  }
  function nodeById(id) {
    return model2.nodes.find((node) => node.id === id);
  }
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(view.canvas);
  view.canvas.addEventListener("pointerdown", onPointerDown);
  view.canvas.addEventListener("pointermove", onPointerMove);
  view.canvas.addEventListener("pointerup", onPointerUp);
  view.canvas.addEventListener("pointercancel", onPointerCancel);
  view.canvas.addEventListener("pointerleave", onPointerLeave);
  view.canvas.addEventListener("dblclick", onDoubleClick);
  view.canvas.addEventListener("wheel", onWheel, { passive: false });
  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    resizeObserver.disconnect();
    view.canvas.removeEventListener("pointerdown", onPointerDown);
    view.canvas.removeEventListener("pointermove", onPointerMove);
    view.canvas.removeEventListener("pointerup", onPointerUp);
    view.canvas.removeEventListener("pointercancel", onPointerCancel);
    view.canvas.removeEventListener("pointerleave", onPointerLeave);
    view.canvas.removeEventListener("dblclick", onDoubleClick);
    view.canvas.removeEventListener("wheel", onWheel);
    hideTooltip();
    tooltip.remove();
  }
  return {
    viewport: () => ({ ...viewport }),
    selected: () => selection,
    focused: () => focusId,
    select,
    clearSelection,
    focusNode,
    focusStep,
    panBy,
    zoomAt,
    zoomAboutCentre,
    fitGraph,
    moveNodeBy,
    setGraph,
    dispose
  };
}
function createTooltip(view) {
  const document2 = view.canvas.ownerDocument;
  const tooltip = document2.createElement("div");
  tooltip.className = "tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document2.body.appendChild(tooltip);
  return tooltip;
}
function targetNodeId(target2) {
  const element = target2 instanceof Element ? target2.closest(`[${NODE_ID_ATTR}]`) : null;
  return element?.getAttribute("data-node-id") ?? null;
}
function targetEdgeKey(target2) {
  const element = target2 instanceof Element ? target2.closest(`[${EDGE_KEY_ATTR}]`) : null;
  return element?.getAttribute("data-edge-key") ?? null;
}
function toggle(element, name, on) {
  element.classList.toggle(name, on);
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// src/webview/keyboard.ts
var PAN_STEP = 48;
var NUDGE_STEP = 8;
var KEY_ZOOM_STEP = 1.2;
function attachKeyboard(controller2, view) {
  const document2 = view.canvas.ownerDocument;
  const onKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) {
      return;
    }
    switch (event.key) {
      // Focus walks the graph order and wraps (ruqsmuxz, rwonulnq).
      case "Tab":
        event.preventDefault();
        controller2.focusStep(event.shiftKey);
        return;
      // Enter is the keyboard click to select (wzqzwsst).
      case "Enter": {
        const focused = controller2.focused();
        if (focused !== null) {
          event.preventDefault();
          controller2.select(focused);
        }
        return;
      }
      // Esc is the keyboard click on empty canvas (zpkmkvts, oumoznwq).
      case "Escape":
        event.preventDefault();
        controller2.clearSelection();
        return;
      case "+":
      case "=":
        event.preventDefault();
        controller2.zoomAboutCentre(KEY_ZOOM_STEP);
        return;
      case "-":
      case "_":
        event.preventDefault();
        controller2.zoomAboutCentre(1 / KEY_ZOOM_STEP);
        return;
      case "f":
      case "F":
        event.preventDefault();
        controller2.fitGraph();
        return;
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight": {
        event.preventDefault();
        const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
        const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        const selected = controller2.selected();
        if (event.shiftKey && selected !== null) {
          controller2.moveNodeBy(selected, dx * NUDGE_STEP, dy * NUDGE_STEP);
        } else {
          controller2.panBy(-dx * PAN_STEP, -dy * PAN_STEP);
        }
        return;
      }
    }
  };
  document2.addEventListener("keydown", onKeyDown);
  return {
    dispose: () => {
      document2.removeEventListener("keydown", onKeyDown);
    }
  };
}
function isTyping(target2) {
  return target2 instanceof HTMLElement && (target2.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target2.tagName));
}

// src/webview/states.ts
var EMPTY_STATE_MESSAGE = "This repository contains no nodes.";
var LOADING_LABEL = "Loading graph\u2026";
function attachStates(view) {
  const owner = view.canvas.ownerDocument;
  const progress = createProgress(owner);
  const empty = createEmpty(owner);
  const error = createBanner(owner);
  const warning = createWarnings(owner);
  view.canvas.append(progress, empty);
  view.banner.append(error, warning);
  let presentation = { loading: false, empty: false, error: null, warnings: [] };
  const queued2 = [];
  const flush = () => {
    const actions = queued2.splice(0, queued2.length);
    for (const action of actions) {
      action();
    }
  };
  const input = {
    run(action) {
      if (presentation.loading) {
        queued2.push(action);
      } else {
        action();
      }
    },
    pending: () => queued2.length,
    clear: () => {
      queued2.length = 0;
    }
  };
  function beginLoading() {
    presentation = { ...presentation, loading: true };
    progress.hidden = false;
  }
  function loaded(nodeCount, warnings = []) {
    presentation = { loading: false, empty: nodeCount === 0, error: null, warnings };
    progress.hidden = true;
    empty.hidden = !presentation.empty;
    error.hidden = true;
    showWarnings(warning, warnings);
    view.banner.hidden = warnings.length === 0;
    flush();
  }
  function failed(message) {
    presentation = { ...presentation, loading: false, error: message };
    progress.hidden = true;
    error.textContent = message;
    error.hidden = false;
    view.banner.hidden = false;
    flush();
  }
  function state() {
    return presentation;
  }
  function dispose() {
    queued2.length = 0;
    progress.remove();
    empty.remove();
    error.remove();
    warning.remove();
    view.banner.hidden = true;
  }
  return { state, beginLoading, loaded, failed, input, dispose };
}
function queueInput(controller2, input) {
  return {
    viewport: () => controller2.viewport(),
    selected: () => controller2.selected(),
    focused: () => controller2.focused(),
    select: (id) => input.run(() => controller2.select(id)),
    clearSelection: () => input.run(() => controller2.clearSelection()),
    focusNode: (id) => input.run(() => controller2.focusNode(id)),
    focusStep: (reverse) => input.run(() => controller2.focusStep(reverse)),
    panBy: (dx, dy) => input.run(() => controller2.panBy(dx, dy)),
    zoomAt: (factor, at) => input.run(() => controller2.zoomAt(factor, at)),
    zoomAboutCentre: (factor) => input.run(() => controller2.zoomAboutCentre(factor)),
    fitGraph: () => input.run(() => controller2.fitGraph()),
    moveNodeBy: (id, dx, dy) => input.run(() => controller2.moveNodeBy(id, dx, dy)),
    setGraph: (graph) => controller2.setGraph(graph),
    dispose: () => controller2.dispose()
  };
}
function createProgress(document2) {
  const overlay = document2.createElement("div");
  overlay.className = "state-progress";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", LOADING_LABEL);
  overlay.hidden = true;
  const bar = document2.createElement("div");
  bar.className = "state-progress-bar";
  overlay.appendChild(bar);
  return overlay;
}
function createEmpty(document2) {
  const message = document2.createElement("div");
  message.className = "state-empty";
  message.setAttribute("role", "status");
  message.textContent = EMPTY_STATE_MESSAGE;
  message.hidden = true;
  return message;
}
function createBanner(document2) {
  const banner2 = document2.createElement("div");
  banner2.className = "state-error";
  banner2.setAttribute("role", "alert");
  banner2.hidden = true;
  return banner2;
}
function createWarnings(document2) {
  const warning = document2.createElement("div");
  warning.className = "state-warning";
  warning.setAttribute("role", "status");
  warning.hidden = true;
  return warning;
}
function showWarnings(warning, messages) {
  warning.replaceChildren(
    ...messages.map((message) => {
      const line = warning.ownerDocument.createElement("div");
      line.className = "state-warning__line";
      line.textContent = message;
      return line;
    })
  );
  warning.hidden = messages.length === 0;
}

// src/webview/state.ts
function applyPanelState(controller2, state) {
  const current = controller2.viewport();
  if (current.scale > 0 && state.zoom > 0 && current.scale !== state.zoom) {
    controller2.zoomAt(state.zoom / current.scale, { x: 0, y: 0 });
  }
  const reached = controller2.viewport();
  controller2.panBy(state.pan.x - reached.x, state.pan.y - reached.y);
  controller2.select(state.selection);
}

// src/webview/main.ts
var target = {
  edges: mustGet(SELECTORS.edges),
  nodes: mustGet(SELECTORS.nodes)
};
var canvas = mustGet(SELECTORS.canvas);
var surface = mustGet(SELECTORS.surface);
var banner = mustGet(SELECTORS.banner);
var detailBody = mustGet(SELECTORS.detailBody);
var fitButton = mustGet(SELECTORS.fitAction);
var vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : void 0;
var states = attachStates({ canvas, banner });
states.beginLoading();
var model;
var order;
var labels = /* @__PURE__ */ new Map();
var persisted;
var controller;
var queued;
var delegate = {
  relayout(dragged) {
    if (model === void 0 || order === void 0) {
      throw new Error("the graph has not arrived yet");
    }
    const merged = /* @__PURE__ */ new Map();
    if (persisted !== void 0) {
      for (const [id, position] of Object.entries(persisted.positions)) {
        merged.set(id, { x: position.x, y: position.y });
      }
    }
    for (const [id, position] of dragged) {
      merged.set(id, position);
    }
    let layout = layoutGraph(model, order, { dragged: merged });
    const heights = renderGraph(target, { model, order, layout, labels });
    layout = layoutGraph(model, order, { dragged: merged, heights });
    renderGraph(target, { model, order, layout, labels });
    return layout;
  },
  onSelectionChanged(id) {
    renderDetail(id);
    post({ type: "selection", id });
  },
  openNodeDocument(id) {
    post({ type: "openNode", id });
  }
};
function showGraph(records, names, warnings) {
  model = buildGraph(records);
  order = graphOrder(model);
  labels = new Map(Object.entries(names));
  if (controller === void 0 || queued === void 0) {
    const view = { canvas, surface };
    const graph = { model, order };
    controller = attachInteractions(view, delegate, graph);
    queued = queueInput(controller, states.input);
    attachKeyboard(queued, view);
    fitButton.addEventListener("click", () => {
      queued?.fitGraph();
    });
    states.loaded(records.length, warnings);
    if (persisted !== void 0) {
      applyPanelState(queued, persisted);
    }
    renderDetail(controller.selected());
  } else {
    controller.setGraph({ model, order });
    states.loaded(records.length, warnings);
    renderDetail(controller.selected());
  }
}
var PROSE_CONTENT_TYPES = ["text", "ears", "review-criteria"];
function renderDetail(id) {
  detailBody.replaceChildren();
  if (id === null || model === void 0) {
    return;
  }
  const node = model.nodes.find((candidate) => candidate.id === id);
  if (node === void 0) {
    return;
  }
  for (const section of detailSections(model, node)) {
    detailBody.append(section);
  }
}
function detailSections(graph, node) {
  const sections = [];
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
    renderRelationshipValue(relationship.value, ids);
    sections.push(relationship.section);
  }
  return sections;
}
function detailSection(label) {
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
function detailRelationships(graph, id) {
  const entries = (kind, selectedEnd, listedEnd) => {
    const ids = [];
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
    ["evaluators", entries("evaluates", "to", "from")]
  ];
}
function renderRelationshipValue(into, ids) {
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
    item.textContent = id;
    list.append(item);
  }
  into.append(list);
}
function renderContentValue(into, content) {
  const type = content.type;
  if (content.ref !== "inline") {
    into.append(contentTypeMark(type), monospacedBlock([type, ...content.ref].join("\n")));
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
function contentTypeMark(type) {
  const mark = document.createElement("div");
  mark.className = "detail__type";
  mark.textContent = type;
  return mark;
}
function monospacedBlock(text) {
  const block = document.createElement("pre");
  block.className = "detail__block";
  block.textContent = text;
  return block;
}
function appendProse(into, text) {
  for (const paragraph of text.split(/\n[ \t]*\n/)) {
    const element = document.createElement("p");
    element.className = "detail__prose";
    element.textContent = paragraph.trim();
    into.append(element);
  }
}
function restorePanelState(state) {
  persisted = state;
  if (queued !== void 0) {
    applyPanelState(queued, state);
  }
}
function receive(message) {
  if (message.type === "panelState") {
    restorePanelState(message.state);
  } else if (message.type === "graph") {
    showGraph(message.records, message.labels, message.warnings);
  } else {
    states.failed(message.message);
  }
}
function post(message) {
  vscode?.postMessage(message);
}
window.addEventListener("message", (event) => {
  const message = event.data;
  if (isHostMessage(message)) {
    receive(message);
  }
});
post({ type: "ready" });
function isHostMessage(value) {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const type = value.type;
  return type === "graph" || type === "error" || type === "panelState";
}
function mustGet(selector) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`media/webview.html is missing ${selector}`);
  }
  return element;
}
export {
  receive,
  showGraph
};
