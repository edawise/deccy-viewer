/**
 * The Vitest runner configuration of the deccy graph viewer's checks.
 *
 * Standalone on purpose: no `test` script is added to package.json (that file
 * belongs to srlrwowp), so the suites run with `npx vitest`. The unit and
 * webview suites run under Vitest; the extension-host suites under
 * `npx vscode-test` (.vscode-test.mjs) and are excluded here.
 *
 * The default environment is node — the data, graph and contract checks only
 * need it. The webview checks that build DOM elements declare
 * `// @vitest-environment jsdom` in their own file, so the environment stays
 * with the check that needs it.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/unit/**/*.test.ts", "tests/webview/**/*.test.ts"],
		environment: "node",
	},
});
