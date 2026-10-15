/**
 * The @vscode/test-cli runner configuration of the deccy graph viewer's
 * extension-host checks.
 *
 * Standalone on purpose: no `test` script is added to package.json (that file
 * belongs to srlrwowp), so the suites run with `npx vscode-test`. The unit and
 * webview suites run under Vitest (vitest.config.ts) and are not listed here:
 * these checks need the extension host, the workspace the launch config opens
 * and the real `vscode` module.
 *
 * The workbench, its extensions and its user data are kept in the machine's
 * temporary directory, so running the checks never adds them to the working
 * copy (`.gitignore` here ignores node_modules only).
 */
import { tmpdir } from "node:os";
import * as path from "node:path";

import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
	files: "tests/integration/**/*.test.ts",
	// The extension host opens this repository: the folder the launch
	// configuration develops and the activation event is keyed on.
	workspaceFolder: process.cwd(),
	cachePath: path.join(tmpdir(), "deccy-vscode-workbench"),
	launchArgs: [
		`--extensions-dir=${path.join(tmpdir(), "deccy-vscode-extensions")}`,
		`--user-data-dir=${path.join(tmpdir(), "deccy-vscode-user-data")}`,
	],
});
