#!/usr/bin/env python3
"""Fidelity check: .gitignore enforces the packaged-set distinction exactly.

vqultolm fixes the set of files the installed extension runs on -- out/extension.js,
media/webview.html, src/styles/*.css, src/webview/main.js and, from node_modules,
the codicon stylesheet and font it loads -- and separates that payload from what is
built from sources (out/, src/webview/main.js), vendored (node_modules) or packaged
as a .vsix.  rxqsupwm's .gitignore is the artifact that has to enforce that split in
the repository: no generated or vendored path tracked, and no authored runtime
source dropped from tracking.

The check asks git itself (check-ignore --no-index), so it depends on the effect of
the ignore rules, not on their wording or order: any rule form that produces the
right answer passes.

Usage: python3 tests/gitignore-fidelity.py [worktree]

Exit status: 0 = every class ignored/not-ignored as the packaged set requires;
1 = at least one mismatch; 2 = could not run the check.
"""

import subprocess
import sys

# Generated or vendored paths: the decision must keep them out of the repository.
MUST_BE_IGNORED = {
    "vendored dependency tree": [
        "node_modules/@vscode/codicons/dist/codicon.css",
        "node_modules/@vscode/codicons/dist/codicon.ttf",
    ],
    "build output": [
        "out/extension.js",
        "src/webview/main.js",
    ],
    "packaged artifact": [
        "extension-1.0.0.vsix",
        "vsc-deccy-0.2.0.vsix",
    ],
}

# Authored runtime files: dropping them from tracking would be stricter than the
# packaged set records, and the installed extension needs them in the repository.
MUST_NOT_BE_IGNORED = {
    "runtime source": [
        "media/webview.html",
        "src/styles/interact.css",
    ],
}


def git_root(argument):
    if argument:
        return argument
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f"cannot find the worktree: {exc}", file=sys.stderr)
        raise SystemExit(2)
    return out.stdout.strip()


def is_ignored(root, path):
    """Return True/False for the path, or None if git could not answer."""
    result = subprocess.run(
        ["git", "-C", root, "check-ignore", "--no-index", "-q", "--", path],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        return True
    if result.returncode == 1:
        return False
    return None


def main(argv):
    root = git_root(argv[1] if len(argv) > 1 else None)

    failures = []
    checked = 0

    for klass, paths in MUST_BE_IGNORED.items():
        for path in paths:
            checked += 1
            state = is_ignored(root, path)
            if state is None:
                print(f"ERROR: git could not evaluate {path!r} in {root}", file=sys.stderr)
                return 2
            if not state:
                failures.append(
                    f"FAIL (looser than the packaged set): {path} is not ignored -- "
                    f"{klass} would be committed"
                )

    for klass, paths in MUST_NOT_BE_IGNORED.items():
        for path in paths:
            checked += 1
            state = is_ignored(root, path)
            if state is None:
                print(f"ERROR: git could not evaluate {path!r} in {root}", file=sys.stderr)
                return 2
            if state:
                failures.append(
                    f"FAIL (stricter than the packaged set): {path} is ignored -- "
                    f"{klass} the installed extension runs on would leave the repository"
                )

    if failures:
        for line in failures:
            print(line)
        print(f"\n{len(failures)} of {checked} ignore decisions disagree with the packaged set")
        return 1

    print(f"all {checked} ignore decisions match the packaged set")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
