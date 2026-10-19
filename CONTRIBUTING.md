# Contributing

Thanks for looking. Plimsoll is small on purpose; the bar for a change is that it makes the HUD better for someone using it, and that it passes the same checks CI runs.

## Before you start

- Read the [README](README.md), especially **How the numbers are produced** and **Known limits**. Every figure the HUD shows is either measured by Claude Code or summed from the transcripts on disk; a change should not add a number that is neither.
- Open an issue for anything bigger than a fix, so the design can be talked through before code exists.

## Setting up

Fork the repository on GitHub and clone your fork. Your work lives on your fork, and reaches this repository as a pull request.

```
git clone https://github.com/<you>/plimsoll.git
cd plimsoll
git remote add upstream https://github.com/akshit-bansal11/plimsoll.git
```

You need Node.js and the Claude Code CLI. There is nothing to install: the hooks run inside Claude Code, and the scripts use only Node's standard library. `claude --plugin-dir .` runs the plugin from your clone.

The site under `site/` is separate and needs Node 24: `cd site && npm ci`, then `npm run dev`.

## Making a change

1. Bring your fork's `main` up to date with `upstream/main`, then branch from it on your fork.
2. Add or change a test in `tests/` when you add logic, a branch or fix a bug. The formatting helpers and the band are tested through `claude-code/testing`; the test environment cannot import `node:` modules, so script logic that needs testing takes its file system functions as arguments (see `scripts/cache.mjs`).
3. Run the checks until they are clean:
   ```
   node scripts/check.mjs
   node scripts/selftest.mjs
   claude plugin validate --strict .
   claude plugin test .
   ```
   For a site change, also `npm run check:ci` and `npm run build` in `site/`. Do not suppress a lint finding to get green.
4. Commit with a [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) subject (`feat:`, `fix:`, `docs:`, `ci:`, with an optional scope such as `fix(git):`) and a body that says what changed and why.
5. Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
6. Push the branch to your fork and open a pull request against `main`. CI runs the checks; the site's checks run too when `site/` or a file it reads changed. The maintainer reviews and merges.

## Style

- No dependencies outside `site/`. The hooks import only `claude-code`, and the scripts only `node:` modules.
- Constants are named. A number that appears twice is a constant.
- Comments say why, not what the next line already says.
- A price added to `scripts/prices.mjs` gets a case in `scripts/check.mjs` and the date it was taken.

## Releases

The maintainer builds and publishes releases. A pull request does not bump the version or tag; a merged change ships in the next one.
