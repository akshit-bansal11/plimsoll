# Security

Plimsoll reads your transcripts and runs git and `gh` in whatever directory a session is in, so its boundaries matter. This is what they are and how to report a hole in one.

## The model

- **Nothing leaves your machine, except through `gh`.** Token totals and statistics are summed locally from the transcripts under your Claude config folder; the only file the plugin writes is its scan cache in `<config dir>/plimsoll/`. The one network call is `gh pr view` and `gh run list`, to GitHub, with your own `gh` sign-in, for the repository you are in. No server, no account, no telemetry.
- **The inspected repository is untrusted.** git and `gh` are found on `PATH` by absolute folder and run by full path, so a `git.exe` or `gh.exe` planted in the repository is never run on Windows. The repository's `core.fsmonitor` and `log.showSignature` settings are overridden, since each names a program for git to run, and optional index locks and terminal prompts are switched off.
- **Repository and GitHub text is untrusted.** Branch names, commit subjects, pull request titles and workflow names have control, bidirectional-override and zero-width characters replaced before they are drawn, so an escape sequence cannot reach your terminal.
- **The hooks start nothing but the plugin's own scripts.** They import only `claude-code`, and the one program they run is `node`, on `scripts/scan.mjs` or `scripts/git.mjs`.

## Known limits

- A clean filter that the inspected repository's config defines still runs when `git status` rereads a changed file, as it would for any git prompt; git has no switch for that.
- The scan cache holds per-hour token counts and dollar estimates for each transcript path. It is readable by whoever can read your Claude config folder, which already holds the transcripts themselves.

## Reporting

Open a [security advisory](https://github.com/akshit-bansal11/plimsoll/security/advisories/new) on GitHub; it reaches the maintainer privately. Please do not open a public issue for something exploitable. Expect an acknowledgement within a week.
