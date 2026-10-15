/**
 * Contract check (the clause family this round adds to ympqvvwr): the page
 * interface declares the request by which the page asks the interaction to
 * bring a selected node into view (wzsxvmvw).
 *
 * The check is structural on purpose. An interface is a declaration, not a
 * value, so the check reads the contract module's exported interface
 * declarations — member names, their parameters, the declared parameter types
 * and the declared member types — and asserts what a name-free reading of that
 * declaration can honestly pin about the request this edge adds:
 *
 * - it is declared on the interface the page holds for the interaction, beyond
 *   the requests already recorded there (`select` for ltrnmrsr, `focusNode` for
 *   ruqsmuxz);
 * - there is exactly one of it: the page names the node it centres on one way,
 *   so a second such request is a second request this edge did not settle;
 * - the page must make it: the member is not optional and its type does not
 *   admit `undefined` or `null` as the whole member, and the node identity it
 *   takes cannot be omitted — a request that may be left out, or made without
 *   naming a node, does not name the node the move centres on;
 * - the members the recorded prerequisites already declare on that interface
 *   are still declared, so a request bought by deleting one of them is not the
 *   request this edge adds.
 *
 * The added request is never named. A name written into this file would be this
 * check deciding the decision's content, and which member name the interface
 * gains is the artifact's to settle; the check therefore locates the interface
 * by two members it already declares — the node selection and the viewport the
 * interaction moves — and reports the added member only in its output.
 *
 * The check requires the declaration alone. It drives no centring, reads no
 * viewport value and expects no particular pan, so the interface's part of
 * wzsxvmvw can be met while performing the move remains another decision's work
 * (the interaction state's). It also reads nothing from the page, the
 * stylesheets or a render: those are the subjects of other checks.
 *
 * A request added as a free function does not satisfy it. The scan reads
 * interface bodies alone, so a helper exported beside the interface is not a
 * request the page can ask the interaction through the interface it composes.
 */
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

/** The contract module the evaluated decision carries (its `ref`). */
const CONTRACT = new URL("../../src/webview/contract.ts", import.meta.url);

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
/** What a string-ish type is made of: a node id is a string, and nothing wider. */
const NULLISH = new Set(["null", "undefined"]);

/**
 * The requests the recorded prerequisites already declare over one node
 * identity: `select` (ltrnmrsr) and `focusNode` (ruqsmuxz). A request over the
 * node identity beyond these is what this round's edge adds.
 */
const RECORDED_NODE_REQUESTS = ["focusNode", "select"];

/**
 * The members the recorded prerequisites already declare on that interface: the
 * selection (ltrnmrsr), the viewport the interaction moves, the keyboard focus
 * (ruqsmuxz), the pan and the zooms (srsnqppq, pposortu), the fit (lntrymms), a
 * node's move (spllzqlw) and the graph swap. They are recorded facts, not this
 * edge's addition, so naming them here decides nothing new; the clause they
 * carry exists so that a request declared by gutting the interface is not read
 * as the request this edge adds, which builds its move on them.
 */
const RECORDED_MEMBERS = [
	"clearSelection",
	"dispose",
	"fitGraph",
	"focusNode",
	"focusStep",
	"focused",
	"moveNodeBy",
	"panBy",
	"select",
	"selected",
	"setGraph",
	"viewport",
	"zoomAboutCentre",
	"zoomAt",
];

type Token = string;

/** One declared member of an interface, as it can be called. */
interface Request {
	/** The member's declared name. */
	readonly name: string;
	/** Whether the interface declares the member optional (`name?`). */
	readonly optional: boolean;
	/**
	 * Whether the member's declared type admits `undefined` or `null` as the
	 * whole member: `name: ((id: string) => void) | undefined` may be absent.
	 */
	readonly absenceAdmitting: boolean;
	/** The declared type of each parameter, as tokens. */
	readonly parameters: readonly (readonly Token[])[];
	/** The interface the member is declared on. */
	readonly declaredOn: string;
}

interface DeclaredInterface {
	readonly body: readonly Token[];
	readonly extends: readonly string[];
}

interface Declarations {
	readonly interfaces: ReadonlyMap<string, DeclaredInterface>;
	readonly aliases: ReadonlyMap<string, readonly Token[]>;
}

/** A member's declared type, read as a type rather than as a run of tokens. */
interface MemberType {
	/** The parameters of the function type, or null when the type is not one. */
	readonly parameters: readonly (readonly Token[])[] | null;
	/** Whether the type admits `undefined` or `null` as the whole member. */
	readonly absence: boolean;
}

/**
 * The source as tokens: comments and literals dropped, everything else one
 * token per identifier or punctuation mark. A declaration is read from these,
 * never from the formatting of the file.
 */
function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	let index = 0;
	while (index < source.length) {
		const character = source[index];
		if (/\s/.test(character)) {
			index++;
			continue;
		}
		if (character === "/" && source[index + 1] === "/") {
			while (index < source.length && source[index] !== "\n") index++;
			continue;
		}
		if (character === "/" && source[index + 1] === "*") {
			index += 2;
			while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
				index++;
			}
			index += 2;
			continue;
		}
		if (character === '"' || character === "'" || character === "`") {
			index++;
			while (index < source.length && source[index] !== character) {
				if (source[index] === "\\") index++;
				index++;
			}
			index++;
			// a literal is one opaque token: it names nothing this check reads.
			tokens.push("<literal>");
			continue;
		}
		const identifier = /^[A-Za-z_$][\w$]*/.exec(source.slice(index));
		if (identifier) {
			tokens.push(identifier[0]);
			index += identifier[0].length;
			continue;
		}
		tokens.push(character);
		index++;
	}
	return tokens;
}

/** The index of the token closing the group opened at `from`, or -1. */
function closing(tokens: readonly Token[], from: number, open: string, close: string): number {
	let depth = 0;
	for (let index = from; index < tokens.length; index++) {
		if (tokens[index] === open) depth++;
		if (tokens[index] === close) {
			depth--;
			if (depth === 0) return index;
		}
	}
	return -1;
}

/** How many groups of each kind are open at a token; `=>` is not a closing `>`. */
function openGroups(tokens: readonly Token[], index: number): number {
	return tokens.slice(0, index).reduce((depth, token, at) => {
		if (tokens[at - 1] === "=" && token === ">") return depth;
		if (token === "(" || token === "{" || token === "[" || token === "<") return depth + 1;
		if (token === ")" || token === "}" || token === "]" || token === ">") return depth - 1;
		return depth;
	}, 0);
}

/** The tokens split at the separator where no group is open. */
function splitAtDepth(tokens: readonly Token[], separator: string): Token[][] {
	const parts: Token[][] = [];
	let current: Token[] = [];
	for (let index = 0; index < tokens.length; index++) {
		if (openGroups(tokens, index) === 0 && tokens[index] === separator) {
			parts.push(current);
			current = [];
			continue;
		}
		current.push(tokens[index]);
	}
	parts.push(current);
	return parts;
}

/** The exported interfaces and type aliases the module declares. */
function declarations(tokens: readonly Token[]): Declarations {
	const interfaces = new Map<string, DeclaredInterface>();
	const aliases = new Map<string, readonly Token[]>();
	for (let index = 0; index < tokens.length; index++) {
		if (tokens[index - 1] !== "export") continue;

		if (tokens[index] === "interface" && IDENTIFIER.test(tokens[index + 1] ?? "")) {
			const name = tokens[index + 1];
			const extended: string[] = [];
			let at = index + 2;
			while (at < tokens.length && tokens[at] !== "{") {
				if (IDENTIFIER.test(tokens[at]) && tokens[at] !== "extends") extended.push(tokens[at]);
				at++;
			}
			const end = closing(tokens, at, "{", "}");
			if (end < 0) break;
			interfaces.set(name, { body: tokens.slice(at + 1, end), extends: extended });
			index = end;
			continue;
		}

		if (tokens[index] === "type" && IDENTIFIER.test(tokens[index + 1] ?? "")) {
			const name = tokens[index + 1];
			if (tokens[index + 2] !== "=") continue;
			let at = index + 3;
			while (at < tokens.length && !(tokens[at] === ";" && openGroups(tokens, at) === 0)) at++;
			aliases.set(name, tokens.slice(index + 3, at));
			index = at;
		}
	}
	return { interfaces, aliases };
}

/** The parameters of a signature, one token list per parameter. */
function parametersOf(tokens: readonly Token[]): Token[][] {
	return splitAtDepth(tokens, ",").filter((parameter) => parameter.length > 0);
}

/** The declared type of one parameter, or null when the parameter declares none. */
function typeOf(parameter: readonly Token[]): Token[] | null {
	for (let index = 0; index < parameter.length; index++) {
		if (openGroups(parameter, index) === 0 && parameter[index] === ":") {
			return parameter.slice(index + 1);
		}
	}
	return null;
}

/** Whether a declared parameter may be left out (`id?: string`). */
function omittable(parameter: readonly Token[]): boolean {
	for (let index = 0; index < parameter.length; index++) {
		if (openGroups(parameter, index) !== 0) continue;
		if (parameter[index] === "?") return true;
		if (parameter[index] === ":") return false;
	}
	return false;
}

/** The member's declared type, from `from` up to the `;` that ends it. */
function memberTypeTokens(body: readonly Token[], from: number): Token[] {
	for (let index = from; index < body.length; index++) {
		if (body[index] === ";" && openGroups(body, index) === 0) return body.slice(from, index);
	}
	return body.slice(from);
}

/** The tokens with the parentheses that wrap the whole run removed. */
function stripOuterParens(tokens: readonly Token[]): readonly Token[] {
	let stripped = tokens;
	while (stripped[0] === "(" && closing(stripped, 0, "(", ")") === stripped.length - 1) {
		stripped = stripped.slice(1, -1);
	}
	return stripped;
}

/**
 * A declared type read as a type: the parameters when the whole type is a
 * function type, and whether the type admits `undefined` or `null` as the whole
 * member. A member declared `name: (id: string) => void | undefined` returns
 * `undefined`, so it is not absent-able; a member declared
 * `name: ((id: string) => void) | undefined` is, and the two are told apart by
 * reading the type rather than by scanning for the word.
 */
function parseMemberType(
	tokens: readonly Token[],
	aliases: ReadonlyMap<string, readonly Token[]>,
	seen: Set<string> = new Set(),
): MemberType {
	const stripped = stripOuterParens(tokens);
	if (stripped.length === 0) return { parameters: null, absence: false };

	const parameters = closing(stripped, 0, "(", ")");
	if (
		stripped[0] === "(" &&
		parameters > 0 &&
		stripped[parameters + 1] === "=" &&
		stripped[parameters + 2] === ">"
	) {
		return { parameters: parametersOf(stripped.slice(1, parameters)), absence: false };
	}

	const arms = splitAtDepth(stripped, "|");
	if (arms.length > 1) {
		let found: readonly (readonly Token[])[] | null = null;
		let absence = false;
		for (const arm of arms) {
			const bare = stripOuterParens(arm);
			if (bare.length === 1 && NULLISH.has(bare[0])) {
				absence = true;
				continue;
			}
			const parsed = parseMemberType(arm, aliases, seen);
			if (parsed.parameters !== null) found = parsed.parameters;
			if (parsed.absence) absence = true;
		}
		return { parameters: found, absence };
	}

	const only = stripped.length === 1 ? stripped[0] : null;
	if (only !== null && !seen.has(only) && aliases.has(only)) {
		seen.add(only);
		return parseMemberType(aliases.get(only)!, aliases, seen);
	}
	return { parameters: null, absence: false };
}

/** The requests the body declares: a method, or a member whose type is a function. */
function requestsOf(
	body: readonly Token[],
	declaredOn: string,
	aliases: ReadonlyMap<string, readonly Token[]>,
): Request[] {
	const found: Request[] = [];
	for (let index = 0; index < body.length; index++) {
		if (!IDENTIFIER.test(body[index])) continue;
		const name = body[index];
		let at = index + 1;
		let optional = false;
		if (body[at] === "?") {
			optional = true;
			at++;
		}
		if (body[at] === "(") {
			const end = closing(body, at, "(", ")");
			if (end < 0) continue;
			found.push({
				name,
				optional,
				absenceAdmitting: false,
				parameters: parametersOf(body.slice(at + 1, end)),
				declaredOn,
			});
			// a declared return type is the method's own, so its tokens are not
			// read as members; without a closing `;` the scan resumes as before.
			const declared = body[end + 1] === ":" ? end + 1 + memberTypeTokens(body, end + 2).length : end;
			index = declared < body.length ? declared : end;
			continue;
		}
		if (body[at] === ":") {
			const tokens = memberTypeTokens(body, at + 1);
			const parsed = parseMemberType(tokens, aliases);
			if (parsed.parameters !== null) {
				found.push({
					name,
					optional,
					absenceAdmitting: parsed.absence,
					parameters: parsed.parameters,
					declaredOn,
				});
			}
			index = at + tokens.length;
			continue;
		}
	}
	return found;
}

/** Every request an interface declares, the ones it extends included. */
function requestsOfInterface(
	declared: Declarations,
	name: string,
	seen: Set<string> = new Set(),
): Request[] {
	const body = declared.interfaces.get(name);
	if (body === undefined || seen.has(name)) return [];
	seen.add(name);
	const found = requestsOf(body.body, name, declared.aliases);
	for (const parent of body.extends) found.push(...requestsOfInterface(declared, parent, seen));
	return found;
}

/** The type with its aliases and its outer parentheses resolved. */
function resolveType(
	tokens: readonly Token[],
	aliases: ReadonlyMap<string, readonly Token[]>,
	seen: Set<string> = new Set(),
): readonly Token[] {
	let resolved = tokens;
	while (resolved[0] === "(" && closing(resolved, 0, "(", ")") === resolved.length - 1) {
		resolved = resolved.slice(1, -1);
	}
	if (resolved.length === 1 && !seen.has(resolved[0]) && aliases.has(resolved[0])) {
		seen.add(resolved[0]);
		return resolveType(aliases.get(resolved[0])!, aliases, seen);
	}
	return resolved;
}

/**
 * Whether one declared parameter type is the node identity the interface
 * already defines: a node id, and nothing a node id cannot be. A type that is
 * wider (`unknown`, `any`, an object) or that fixes a different value is not
 * one the page can hand a node id.
 */
function identifiesNode(
	type: readonly Token[],
	aliases: ReadonlyMap<string, readonly Token[]>,
): boolean {
	const narrowing = splitAtDepth(type, "|").filter(
		(part) => !(part.length === 1 && NULLISH.has(part[0])),
	);
	if (narrowing.length !== 1) return false;
	const resolved = resolveType(narrowing[0], aliases);
	return resolved.length === 1 && resolved[0] === "string";
}

/** The requests an interface declares that take one node identity and nothing else. */
function nodeRequests(declared: Declarations, name: string): Request[] {
	return requestsOfInterface(declared, name).filter((request) => {
		if (request.parameters.length !== 1) return false;
		const type = typeOf(request.parameters[0]);
		return type !== null && identifiesNode(type, declared.aliases);
	});
}

/**
 * Whether the page must make the request: the member is not optional, its type
 * does not admit absence as the whole member, and the node identity it takes
 * cannot be left out. A request the page may skip is not a request naming the
 * node the move centres on.
 */
function requiredRequest(request: Request): boolean {
	return (
		!request.optional &&
		!request.absenceAdmitting &&
		request.parameters.every((parameter) => !omittable(parameter))
	);
}

/** Why the page need not make a request, as a clause the failure can quote. */
function because(request: Request): string {
	const reasons: string[] = [];
	if (request.optional) reasons.push("the member is declared optional (`name?`)");
	if (request.absenceAdmitting) {
		reasons.push("the member's declared type admits `undefined` or `null` as the whole member");
	}
	for (const [index, parameter] of request.parameters.entries()) {
		if (omittable(parameter)) reasons.push(`parameter ${index + 1} may be omitted`);
	}
	return `${request.name}: ${reasons.join("; ")}`;
}

/**
 * The interface the page holds for the interaction: the one that declares the
 * node selection and the viewport it moves. Located by those two members —
 * recorded, and untouched by this round's edge — never by the request this
 * edge adds.
 */
function interactionInterface(declared: Declarations): string {
	for (const name of declared.interfaces.keys()) {
		const names = requestsOfInterface(declared, name).map((request) => request.name);
		if (names.includes("select") && names.includes("viewport")) return name;
	}
	throw new Error(
		"the contract module declares no exported interface carrying both the node selection (`select`) and the viewport (`viewport`) the page composes the interaction through",
	);
}

/** The contract module's source, as the artifact declares it. */
function contractSource(): string {
	return readFileSync(CONTRACT, "utf8");
}

/**
 * A member name the source does not already carry: inserting a request under a
 * fresh name adds exactly one request to the count the clause reads, whatever
 * the artifact already declares.
 */
function freshName(tokens: readonly Token[], base: string): string {
	const used = new Set(tokens);
	let candidate = base;
	let suffix = 0;
	while (used.has(candidate)) candidate = `${base}${++suffix}`;
	return candidate;
}

function contract(): Declarations {
	return declarations(tokenize(contractSource()));
}

/** The requests over the node identity the interface declares beyond the recorded ones. */
function addedNodeRequests(declared: Declarations, name: string): Request[] {
	return nodeRequests(declared, name).filter(
		(request) => !RECORDED_NODE_REQUESTS.includes(request.name),
	);
}

/** The added requests the page must make, one per node identity it names. */
function addedRequiredNodeRequests(declared: Declarations, name: string): Request[] {
	return addedNodeRequests(declared, name).filter(requiredRequest);
}

/** The names of the members the interface declares, the ones it extends included. */
function memberNames(declared: Declarations, name: string): string[] {
	return requestsOfInterface(declared, name).map((request) => request.name);
}

describe("the interface declares the request that brings a selected node into view (wzsxvmvw)", () => {
	test("the scan reads the interaction interface through the members it already declares", () => {
		const declared = contract();
		const name = interactionInterface(declared);

		// the interface is the one the page holds: it carries the node selection
		// and the viewport ...
		expect(name).toBeTypeOf("string");
		expect(memberNames(declared, name)).toEqual(
			expect.arrayContaining(["select", "viewport"]),
		);
		// ... and the requests it already declares over one node identity are read
		// by the same scan, so a scan that read nothing fails here instead of
		// leaving the clause below to pass by accident.
		expect(nodeRequests(declared, name).map((request) => request.name)).toEqual(
			expect.arrayContaining(RECORDED_NODE_REQUESTS),
		);
	});

	test("the interaction declares exactly one request over the node identity beyond the recorded ones", () => {
		const declared = contract();
		const name = interactionInterface(declared);
		const added = addedNodeRequests(declared, name);

		expect(
			added.length,
			`the interface the page holds for the interaction (${name}) declares ${added.length} request(s) over a node identity beyond ${RECORDED_NODE_REQUESTS.join(" and ")}${added.length > 0 ? `: ${added.map((request) => request.name).join(", ")}` : ""}. The page asks the interaction to bring a node into view one way, so two or more such requests are a second way the page names a node to centre on and a second request this edge does not settle, while none leaves the page with no way to ask at all`,
		).toBe(1);
	});

	test("the added request is one the page must make: not optional, not absent-able, and taking a node identity it cannot omit", () => {
		const declared = contract();
		const name = interactionInterface(declared);
		const added = addedNodeRequests(declared, name);

		// stated first so that this clause cannot be satisfied by a scan that read
		// no request at all: there has to be one to require of the page.
		expect(
			added.length,
			`the interface the page holds for the interaction (${name}) declares no request over a node identity beyond ${RECORDED_NODE_REQUESTS.join(" and ")}, so there is none the page must make`,
		).not.toBe(0);

		const skipped = added.filter((request) => !requiredRequest(request));

		expect(
			skipped.map(because),
			`the request the interface the page holds for the interaction (${name}) declares over a node identity beyond ${RECORDED_NODE_REQUESTS.join(" and ")} can be left out, so it does not name the node a centring move centres on: the page must be able to ask every time, and ask by naming a node`,
		).toEqual([]);
	});

	test("the interaction still declares the members the request is made beside", () => {
		const declared = contract();
		const name = interactionInterface(declared);
		const declaredNames = memberNames(declared, name);

		expect(
			declaredNames,
			`the interface the page holds for the interaction (${name}) no longer declares the members it is recorded as declaring, so a request declared beside a deleted one is not the request this edge adds: ${RECORDED_MEMBERS.filter((member) => !declaredNames.includes(member)).join(", ")} missing`,
		).toEqual(expect.arrayContaining(RECORDED_MEMBERS));
	});

	test("an optional or absence-admitting request is read as a request, and refused as one the page must make", () => {
		// The new clauses' own check, so that their red is the clause and not a
		// scan that never saw the request: all three shapes are read as requests
		// over the node identity, and the three that the page may skip are named.
		const fixture = tokenize(`
			export type NodeId = string;
			export interface Declared {
				viewport(): Readonly<{ x: number; y: number; scale: number }>;
				select(id: NodeId | null): void;
				focusNode(id: NodeId | null): void;
				optionalRequest?(id: NodeId): void;
				absentRequest: ((id: NodeId) => void) | undefined;
				nullableRequest: ((id: NodeId) => void) | null;
				omittableRequest: (id?: NodeId) => void;
				requiredRequest: (id: NodeId) => void;
			}
		`);
		const declared = declarations(fixture);
		const name = interactionInterface(declared);

		expect(addedNodeRequests(declared, name).map((request) => request.name)).toEqual([
			"optionalRequest",
			"absentRequest",
			"nullableRequest",
			"omittableRequest",
			"requiredRequest",
		]);
		expect(addedRequiredNodeRequests(declared, name).map((request) => request.name)).toEqual([
			"requiredRequest",
		]);
		expect(addedNodeRequests(declared, name).filter((request) => !requiredRequest(request)).map(because)).toEqual([
			"optionalRequest: the member is declared optional (`name?`)",
			"absentRequest: the member's declared type admits `undefined` or `null` as the whole member",
			"nullableRequest: the member's declared type admits `undefined` or `null` as the whole member",
			"omittableRequest: parameter 1 may be omitted",
		]);
	});

	test("one declared request over the node identity, and no performed move, satisfies the clause", () => {
		// The clause's own green path, taken twice: once over a self-contained
		// declaration, and once over this module's own, by inserting one request
		// into the interface the locator found and changing nothing else — no
		// behaviour, no page, no viewport. The names in both are the fixture's, not
		// the artifact's: what the clause requires is a declared request over the
		// node identity, and which name the artifact's request carries is the
		// drafter's to settle.
		const fixture = tokenize(`
			export type NodeId = string;
			export interface DeclaredInteraction {
				viewport(): Readonly<{ x: number; y: number; scale: number }>;
				select(id: NodeId | null): void;
				focusNode(id: NodeId | null): void;
				panBy(dx: number, dy: number): void;
				requestNode(id: NodeId): void;
			}
		`);
		const declaredFixture = declarations(fixture);
		const fixtureName = interactionInterface(declaredFixture);

		// a declaration carrying the node selection, the viewport and one required
		// request over the node identity satisfies every clause this check states ...
		expect(addedNodeRequests(declaredFixture, fixtureName).map((request) => request.name)).toEqual([
			"requestNode",
		]);
		expect(
			addedRequiredNodeRequests(declaredFixture, fixtureName).map((request) => request.name),
		).toEqual(["requestNode"]);
		// ... while the requests already recorded on that interface are still read
		// there, and a request over something other than a node identity is not
		// counted as one.
		expect(nodeRequests(declaredFixture, fixtureName).map((request) => request.name)).toEqual(
			expect.arrayContaining([...RECORDED_NODE_REQUESTS, "requestNode"]),
		);
		expect(
			nodeRequests(declaredFixture, fixtureName).map((request) => request.name),
		).not.toContain("panBy");

		// The same property over this module's declaration, stated relatively so
		// that it holds whether or not the artifact already declares such a
		// request: one request inserted into the located interface adds exactly one
		// to the count the clauses read, so an artifact that declares the request
		// passes the clause rather than failing this check. The inserted name is
		// taken fresh from the source, so it is neither a recorded request nor one
		// the artifact already carries.
		const source = contractSource();
		const declaredSource = declarations(tokenize(source));
		const name = interactionInterface(declaredSource);
		const inserted = freshName(tokenize(source), "insertedNodeRequest");
		const patched = source.replace(
			new RegExp(`interface\\s+${name}\\b[^{]*\\{`),
			(opening) => `${opening}\n\t${inserted}(id: string): void;`,
		);
		expect(patched).not.toBe(source);

		const declaredPatched = declarations(tokenize(patched));
		const before = addedNodeRequests(declaredSource, name);
		const after = addedNodeRequests(declaredPatched, name);
		const beforeRequired = addedRequiredNodeRequests(declaredSource, name);
		const afterRequired = addedRequiredNodeRequests(declaredPatched, name);

		expect(after).toHaveLength(before.length + 1);
		expect(after.map((request) => request.name)).toEqual(
			expect.arrayContaining([...before.map((request) => request.name), inserted]),
		);
		// the inserted request is one the page must make, and it is read as one.
		expect(afterRequired).toHaveLength(beforeRequired.length + 1);
		expect(afterRequired.map((request) => request.name)).toContain(inserted);
		// and the presence clause holds on that declaration.
		expect(after).not.toHaveLength(0);
		// the members already read on that interface are still read there, the
		// inserted one among them — stated against the interface as it stands, so
		// this green path holds whatever the artifact declares.
		expect(memberNames(declaredPatched, name)).toEqual(
			expect.arrayContaining([...memberNames(declaredSource, name), inserted]),
		);
	});

	test("a request declared on an interface is read, whether it is a method or a function-typed member", () => {
		// The scan's own check, so that the clauses above cannot be red for a
		// discovery that never sees a request: an interface declaring a request
		// over the node identity — through an alias, as a method, and as a member
		// whose type is a function — is read as declaring one.
		const fixture = tokenize(`
			export type NodeId = string;
			export interface Declared {
				select(id: NodeId | null): void;
				viewport(): Readonly<{ x: number; y: number; scale: number }>;
				requestNode(id: NodeId): void;
				alsoRequestNode: (id: NodeId) => void;
			}
		`);
		const declared = declarations(fixture);

		expect(nodeRequests(declared, "Declared").map((request) => request.name)).toEqual([
			"select",
			"requestNode",
			"alsoRequestNode",
		]);
	});
});
