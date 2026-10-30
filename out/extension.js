var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  OPEN_GRAPH_COMMAND: () => OPEN_GRAPH_COMMAND,
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/panel.ts
var import_node_fs3 = require("node:fs");
var path2 = __toESM(require("node:path"));
var vscode = __toESM(require("vscode"));

// src/data/jj.ts
var import_node_child_process = require("node:child_process");
var import_node_fs2 = require("node:fs");

// src/data/nodes.ts
var import_node_fs = require("node:fs");
var path = __toESM(require("node:path"));
var NODES_DIR = "nodes";
var NODE_ID_PATTERN = /^[0-9a-z]{8,}$/;
var GraphDataError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GraphDataError";
  }
};
function parseNodeDocument(id, document) {
  const where = `${NODES_DIR}/${id}.json`;
  const problems = [];
  if (!NODE_ID_PATTERN.test(id)) {
    problems.push(`"${id}" is not a node id (expected at least eight lowercase alphanumerics)`);
  }
  if (!isPlainObject(document)) {
    throw new GraphDataError(`${where}: node document must be a JSON object`);
  }
  const allowedKeys = ["kind", "depends_on", "evaluates", "content"];
  for (const key of Object.keys(document)) {
    if (!allowedKeys.includes(key)) {
      problems.push(`unexpected key "${key}"`);
    }
  }
  const kind = document.kind;
  if (kind !== "decision" && kind !== "evaluation") {
    problems.push(`"kind" must be "decision" or "evaluation"`);
  }
  const dependsOn = checkEdges("depends_on", document.depends_on, problems);
  const evaluates = checkEdges("evaluates", document.evaluates, problems);
  if (kind === "decision") {
    if (dependsOn === void 0) {
      problems.push(`a decision must declare "depends_on"`);
    }
    if (evaluates !== void 0) {
      problems.push(`a decision must not declare "evaluates"`);
    }
  } else if (kind === "evaluation") {
    if (evaluates === void 0) {
      problems.push(`an evaluation must declare "evaluates"`);
    }
  }
  const content = parseContent(document.content, problems);
  if (problems.length > 0) {
    throw new GraphDataError(`${where}: ${problems.join("; ")}`);
  }
  return {
    id,
    kind,
    dependsOn: dependsOn ?? [],
    evaluates: evaluates ?? [],
    content
  };
}
function validateNodeGraph(records) {
  const problems = [];
  const byId = /* @__PURE__ */ new Set();
  for (const record of records) {
    if (byId.has(record.id)) {
      problems.push(`duplicate node id "${record.id}"`);
    }
    byId.add(record.id);
  }
  problems.push(...findCycleProblems(records));
  if (problems.length > 0) {
    throw new GraphDataError(problems.join("; "));
  }
}
async function loadNodeRecords(workspaceRoot2) {
  const directory = path.join(workspaceRoot2, NODES_DIR);
  let entries;
  try {
    entries = await import_node_fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    throw new GraphDataError(`cannot read ${NODES_DIR}/: ${errorMessage(error)}`);
  }
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name).sort();
  const results = await Promise.all(files.map((file) => readNodeFile(directory, file)));
  const records = [];
  const warnings = [];
  for (const result of results) {
    if ("record" in result) {
      records.push(result.record);
    } else {
      warnings.push(result.problem);
    }
  }
  validateNodeGraph(records);
  return { records, warnings };
}
async function readNodeFile(directory, file) {
  const id = file.slice(0, -".json".length);
  try {
    const text = await import_node_fs.promises.readFile(path.join(directory, file), "utf8");
    let document;
    try {
      document = JSON.parse(text);
    } catch (error) {
      throw new GraphDataError(`${NODES_DIR}/${file}: invalid JSON (${errorMessage(error)})`);
    }
    return { record: parseNodeDocument(id, document) };
  } catch (error) {
    return {
      problem: error instanceof GraphDataError ? error.message : `${NODES_DIR}/${file}: cannot read (${errorMessage(error)})`
    };
  }
}
function parseContent(value, problems) {
  if (!isPlainObject(value)) {
    problems.push(`"content" must be an object`);
    return { type: "", ref: "inline", rationale: "" };
  }
  const { type, ref, rationale, content } = value;
  if (typeof type !== "string" || type.length === 0) {
    problems.push(`content "type" must be a non-empty string`);
  }
  if (typeof rationale !== "string" || rationale.length === 0) {
    problems.push(`content "rationale" must be a non-empty string`);
  }
  const refIsPaths = Array.isArray(ref) && ref.length > 0 && ref.every((p) => typeof p === "string" && p.length > 0) && new Set(ref).size === ref.length;
  const refIsInline = ref === "inline";
  if (!refIsInline && !refIsPaths) {
    problems.push(`content "ref" must be "inline" or a non-empty list of distinct paths`);
  }
  if (refIsInline) {
    if (content === void 0) {
      problems.push(`content "content" is required when "ref" is "inline"`);
    } else if (typeof content !== "string") {
      problems.push(`content "content" must be a string`);
    }
  } else if (content !== void 0) {
    problems.push(`content "content" is only allowed when "ref" is "inline"`);
  }
  return value;
}
function checkEdges(key, value, problems) {
  if (value === void 0) {
    return void 0;
  }
  const items = Array.isArray(value) ? value : [];
  if (!Array.isArray(value)) {
    problems.push(`"${key}" must be an array`);
    return [];
  }
  if (items.length === 0) {
    problems.push(`"${key}" must list at least one node id`);
  }
  for (const item of items) {
    if (typeof item !== "string" || !NODE_ID_PATTERN.test(item)) {
      problems.push(`"${key}" entries must be node ids, got ${JSON.stringify(item)}`);
    }
  }
  if (new Set(items).size !== items.length) {
    problems.push(`"${key}" must not repeat node ids`);
  }
  return items;
}
function findCycleProblems(records) {
  const outgoing = /* @__PURE__ */ new Map();
  for (const record of records) {
    outgoing.set(record.id, [...record.evaluates]);
  }
  for (const record of records) {
    for (const prerequisite of record.dependsOn) {
      if (outgoing.has(prerequisite)) {
        outgoing.get(prerequisite).push(record.id);
      }
    }
  }
  const problems = [];
  const state = /* @__PURE__ */ new Map();
  const stack = [];
  const visit = (id) => {
    const seen = state.get(id);
    if (seen === "done") {
      return;
    }
    if (seen === "visiting") {
      const cycle = [...stack.slice(stack.indexOf(id)), id];
      problems.push(`cycle: ${cycle.join(" -> ")}`);
      return;
    }
    state.set(id, "visiting");
    stack.push(id);
    for (const target of outgoing.get(id) ?? []) {
      if (outgoing.has(target)) {
        visit(target);
      }
    }
    stack.pop();
    state.set(id, "done");
  };
  for (const record of records) {
    visit(record.id);
  }
  return problems;
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/data/jj.ts
var LABEL_TEMPLATE = 'change_id.shortest(8) ++ "\\t" ++ description.first_line() ++ "\\n"';
var JJ_TIMEOUT_MS = 3e4;
async function loadJjLabels(workspaceRoot2) {
  const output = await runJj(workspaceRoot2, [
    "log",
    "--no-graph",
    "-r",
    "ancestors(@)",
    "--color",
    "never",
    "--template",
    LABEL_TEMPLATE
  ]);
  const labels = /* @__PURE__ */ new Map();
  for (const line of output.split("\n")) {
    if (line === "") {
      continue;
    }
    const separator = line.indexOf("	");
    const changeId = separator === -1 ? line : line.slice(0, separator);
    const label = separator === -1 ? "" : line.slice(separator + 1);
    labels.set(changeId, label);
  }
  return labels;
}
function labelForChange(labels, changeId) {
  const exact = labels.get(changeId);
  if (exact !== void 0) {
    return exact;
  }
  let match;
  for (const [id, label] of labels) {
    if (id.startsWith(changeId)) {
      if (match !== void 0) {
        return void 0;
      }
      match = label;
    }
  }
  return match;
}
function runJj(cwd, args) {
  return new Promise((resolve2, reject) => {
    (0, import_node_child_process.execFile)(
      "jj",
      args,
      { cwd, encoding: "utf8", timeout: JJ_TIMEOUT_MS },
      (error, stdout, stderr) => {
        if (error === null) {
          resolve2(stdout);
          return;
        }
        const detail = stderr.trim() || error.message;
        if ("code" in error && error.code === "ENOENT") {
          reject(
            new GraphDataError(
              (0, import_node_fs2.existsSync)(cwd) ? "cannot read the jj log: jj is not on PATH" : `cannot read the jj log: workspace root ${cwd} does not exist`
            )
          );
          return;
        }
        reject(new GraphDataError(`cannot read the jj log: ${detail}`));
      }
    );
  });
}

// src/webview/state.ts
var PANEL_STATE_KEY = "deccy.panelState";
function defaultPanelState() {
  return { open: false, selection: null, pan: { x: 0, y: 0 }, zoom: 1, positions: {} };
}
function readPanelState(storage) {
  return sanitizePanelState(storage.get(PANEL_STATE_KEY));
}
function writePanelState(storage, state) {
  return storage.update(PANEL_STATE_KEY, snapshotOf(state));
}
function createPanelState(storage) {
  let state = storage !== void 0 ? readPanelState(storage) : defaultPanelState();
  const listeners = /* @__PURE__ */ new Set();
  let writes = Promise.resolve();
  const commit = () => {
    if (storage === void 0) {
      return;
    }
    const snapshot = snapshotOf(state);
    writes = writes.then(() => writePanelState(storage, snapshot)).catch(() => void 0);
  };
  const emit = (snapshot) => {
    for (const listener of [...listeners]) {
      listener(snapshot);
    }
  };
  const record = (next) => {
    state = next;
    commit();
    emit(state);
  };
  function setOpen(open) {
    if (state.open === open) {
      return;
    }
    record({ ...state, open });
  }
  function setSelection(id) {
    if (state.selection === id) {
      return;
    }
    record({ ...state, selection: id });
  }
  function setViewport(viewport) {
    const pan = { x: viewport.x, y: viewport.y };
    if (state.pan.x === pan.x && state.pan.y === pan.y && state.zoom === viewport.scale) {
      return;
    }
    record({ ...state, pan, zoom: viewport.scale });
  }
  function setNodePosition(id, position) {
    const current2 = state.positions[id];
    if (current2 !== void 0 && current2.x === position.x && current2.y === position.y) {
      return;
    }
    const positions = { ...state.positions, [id]: { x: position.x, y: position.y } };
    record({ ...state, positions });
  }
  function forgetNode(id) {
    if (!Object.prototype.hasOwnProperty.call(state.positions, id)) {
      return;
    }
    const positions = { ...state.positions };
    delete positions[id];
    record({ ...state, positions });
  }
  function applyReload(nodeIds) {
    const present = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);
    const positions = {};
    for (const [id, position] of Object.entries(state.positions)) {
      if (present.has(id)) {
        positions[id] = position;
      }
    }
    const selection = state.selection !== null && present.has(state.selection) ? state.selection : null;
    record({ ...state, selection, positions });
    return state;
  }
  function reassert() {
    emit(state);
  }
  function onChange(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  function dispose() {
    listeners.clear();
  }
  return {
    current: () => state,
    setOpen,
    setSelection,
    setViewport,
    setNodePosition,
    forgetNode,
    applyReload,
    reassert,
    onChange,
    dispose
  };
}
function snapshotOf(state) {
  const positions = {};
  for (const [id, position] of Object.entries(state.positions)) {
    positions[id] = { x: position.x, y: position.y };
  }
  return {
    open: state.open,
    selection: state.selection,
    pan: { x: state.pan.x, y: state.pan.y },
    zoom: state.zoom,
    positions
  };
}
function sanitizePanelState(value) {
  const fallback = defaultPanelState();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback;
  }
  const record = value;
  const positions = {};
  const stored = record.positions;
  if (typeof stored === "object" && stored !== null && !Array.isArray(stored)) {
    for (const [id, position] of Object.entries(stored)) {
      const point = sanitizePoint(position);
      if (point !== null) {
        positions[id] = point;
      }
    }
  }
  return {
    open: record.open === true,
    selection: typeof record.selection === "string" ? record.selection : null,
    pan: sanitizePoint(record.pan) ?? { ...fallback.pan },
    zoom: sanitizeScale(record.zoom),
    positions
  };
}
function sanitizePoint(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const point = value;
  if (typeof point.x !== "number" || typeof point.y !== "number") {
    return null;
  }
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }
  return { x: point.x, y: point.y };
}
function sanitizeScale(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1;
}

// src/panel.ts
var GRAPH_PANEL_VIEW_TYPE = "vscDeccy.graph";
var GRAPH_PANEL_TITLE = "Deccy Graph";
var PAGE = "media/webview.html";
var CODICON_CSS = "node_modules/@vscode/codicons/dist/codicon.css";
var PAGE_REFERENCE = /(\b(?:href|src))="([^"]+)"/g;
var current;
function openDeccyPanel(context) {
  if (current !== void 0) {
    current.webviewPanel.reveal();
    return current;
  }
  const state = createPanelState(context.workspaceState);
  const webviewPanel = vscode.window.createWebviewPanel(
    GRAPH_PANEL_VIEW_TYPE,
    GRAPH_PANEL_TITLE,
    // Beside the editor the user is reading: a side panel for the graph
    // (uprztqnr).
    vscode.ViewColumn.Beside,
    {
      // The page runs the compiled entry of src/webview/main.ts and loads
      // its references from the extension (serve below, rtlotqvy).
      enableScripts: true,
      localResourceRoots: [context.extensionUri]
    }
  );
  const panel = {
    webviewPanel,
    state,
    dispose: () => {
      webviewPanel.dispose();
    }
  };
  current = panel;
  state.setOpen(true);
  serve(webviewPanel.webview, context);
  webviewPanel.webview.onDidReceiveMessage((message) => {
    if (isReady(message)) {
      void handOver(webviewPanel.webview, state);
      return;
    }
    if (isSelection(message)) {
      state.setSelection(message.id);
      return;
    }
    if (isOpenNode(message)) {
      void openNodeDocument(message.id);
      return;
    }
  });
  webviewPanel.onDidDispose(() => {
    state.setOpen(false);
    state.dispose();
    current = void 0;
  });
  return panel;
}
function serve(webview, context) {
  const pagePath = path2.join(context.extensionPath, PAGE);
  const template = (0, import_node_fs3.readFileSync)(pagePath, "utf8");
  const resolve2 = (reference) => webview.asWebviewUri(vscode.Uri.file(path2.resolve(path2.dirname(pagePath), reference))).toString();
  const resolved = template.replace(
    PAGE_REFERENCE,
    (_match, attribute, reference) => `${attribute}="${resolve2(reference)}"`
  );
  const codicon = webview.asWebviewUri(vscode.Uri.file(path2.join(context.extensionPath, CODICON_CSS))).toString();
  webview.html = resolved.replace(
    "	</head>",
    `		<link rel="stylesheet" href="${codicon}" />
	</head>`
  );
}
async function handOver(webview, state) {
  await sendGraph(webview);
  post(webview, { type: "panelState", state: state.current() });
}
async function sendGraph(webview) {
  const root = workspaceRoot();
  if (root === void 0) {
    post(webview, {
      type: "error",
      message: `cannot read ${NODES_DIR}/: no workspace folder is open`
    });
    return;
  }
  try {
    const { records, warnings } = await loadNodeRecords(root);
    const changes = await loadJjLabels(root);
    const labels = {};
    for (const record of records) {
      const label = labelForChange(changes, record.id);
      if (label !== void 0) {
        labels[record.id] = label;
      }
    }
    post(webview, { type: "graph", records, labels, warnings });
  } catch (error) {
    post(webview, { type: "error", message: errorMessage2(error) });
  }
}
function workspaceRoot() {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
function post(webview, message) {
  void webview.postMessage(message);
}
async function openNodeDocument(id) {
  const root = workspaceRoot();
  if (root === void 0) {
    void vscode.window.showErrorMessage(`cannot open ${id}.json: no workspace folder is open`);
    return;
  }
  const documentPath = path2.join(root, NODES_DIR, `${id}.json`);
  try {
    const document = await vscode.workspace.openTextDocument(documentPath);
    await vscode.window.showTextDocument(document);
  } catch {
    void vscode.window.showErrorMessage(`cannot open ${NODES_DIR}/${id}.json`);
  }
}
function isReady(message) {
  if (typeof message !== "object" || message === null || !("type" in message)) {
    return false;
  }
  return message.type === "ready";
}
function isSelection(message) {
  if (typeof message !== "object" || message === null) {
    return false;
  }
  const record = message;
  return record.type === "selection" && (typeof record.id === "string" || record.id === null);
}
function isOpenNode(message) {
  if (typeof message !== "object" || message === null) {
    return false;
  }
  const record = message;
  return record.type === "openNode" && typeof record.id === "string" && NODE_ID_PATTERN.test(record.id);
}
function errorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/extension.ts
var OPEN_GRAPH_COMMAND = "vscDeccy.openGraph";
function activate(context) {
  context.subscriptions.push(
    vscode2.commands.registerCommand(OPEN_GRAPH_COMMAND, () => {
      openDeccyPanel(context);
    })
  );
  if (readPanelState(context.workspaceState).open) {
    openDeccyPanel(context);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OPEN_GRAPH_COMMAND,
  activate
});
