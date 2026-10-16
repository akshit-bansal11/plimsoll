# Plimsoll

Plimsoll is a heads-up display for [Claude Code](https://claude.com/claude-code), drawn in the band above the prompt: how full the context window is, how much of your rate limits is left, what the tokens would have cost, and the state of the repository you are in.

```
── ◢ PLIMSOLL · *waves* ──────────────────────────────────── 1: USAGE  2: STATS  3: GIT ──
                  CTX    ▰▰▰▱▱▱▱▱▱▱▱▱  28%  276.7K used · 723.3K left     TODAY   43.6M tok  ~$8.86
    /\_/\         5H     ▰▰▰▰▰▱▱▱▱▱▱▱  43%  resets 3h 17m                 WEEK    89.0M tok ~$31.40
   ( ^.^ )/       WEEK   ▰▰▰▰▰▰▰▱▱▱▱▱  56%  resets 1d 2h                  MONTH  427.3M tok ~$142.10
    (")(") ~
```

<p align="center"><sub>An illustration of the layout, not real output.</sub></p>

A ship's Plimsoll line is painted on the hull to show how deep it may safely sit; this one shows how close a session is to its limits. It is for keeping an eye on the gauges without stopping to ask: the context window filling up before it compacts, a five-hour window about to run out mid-task, a week's usage creeping up. Everything is read from Claude Code itself and from the transcripts already on your disk. Nothing is sent anywhere, and there is no account.

[![CI](https://github.com/akshit-bansal11/plimsoll/actions/workflows/ci.yml/badge.svg)](https://github.com/akshit-bansal11/plimsoll/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/akshit-bansal11/plimsoll)](https://github.com/akshit-bansal11/plimsoll/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-plimsoll.akshitbansal.me-black.svg)](https://plimsoll.akshitbansal.me/docs)

## What it shows

- **Usage** — how full the context window is (tokens used and left), your 5-hour and weekly rate-limit windows with time to reset, and tokens plus estimated cost for today, this week and this month.
- **Stats** — your peak hours, busiest weekday, the last 30 days and 12 months as sparklines, and your most active day, week and month.
- **Git** — repository, branch, ahead/behind, staged/modified/untracked/conflict/stash counts, the last commit, the branch's pull request with review state and check counts, and the latest CI run.
- **A mascot** — a small ASCII kitten that idles, types while Claude works, sleeps once five minutes pass without a turn, and panics when a gauge reaches 90%.

Gauges are green below 50%, yellow from 50%, orange from 75% and red from 90%.

## Install

In a Claude Code terminal session:

```
/plugin marketplace add akshit-bansal11/plimsoll
/plugin install plimsoll@plimsoll
```

Pick a scope when asked (user scope loads it in every session).

**Coming from usage-board?** The plugin was renamed in 0.3.0. Remove the old one first, so only one copy runs:

```
/plugin uninstall usage-board@usage-board
/plugin marketplace remove usage-board
```

The scan cache is carried over, so the first session does not reread every transcript. Whether the HUD was hidden is not: run `/hud hide` again if it was.

### Requirements

- **Node.js** on your `PATH` (it reads the transcripts and runs git).
- **git**, for the git tab.
- **GitHub CLI (`gh`)**, signed in — optional, only for pull request and CI status. Without it the tab says so and still shows local git state.

## Use

| Action | How |
| --- | --- |
| Hide or show the HUD | `/hud` (or `/hud hide`, `/hud show`) |
| Switch tab | `/hud usage`, `/hud stats`, `/hud git` |
| Collapse the band | `ctrl+x ctrl+a` (Claude Code's own shortcut for the band) |
| Switch tab by key | `ctrl+x tab` to focus the band, then `1`, `2` or `3` |

While hidden, a one-line summary stays in the status line: each rate-limit window's percentage, today's tokens and estimated cost, and a reminder of `/hud`. The hidden state is remembered across sessions.

The strip needs about 110 columns to lay its two content columns side by side; narrower than that they stack, and below 48 columns it is not drawn.

## How the numbers are produced

- **Context and rate limits** come from Claude Code itself, as it measures them. Rate-limit windows are only reported on a subscription.
- **Tokens and statistics** are summed from the transcripts under your Claude config folder (`~/.claude/projects`, or `CLAUDE_CONFIG_DIR`), in local time, weeks starting Monday. They are rescanned when a session starts and after every turn. A cache at `<config dir>/plimsoll/` keeps each file's sums, so later scans read only the transcripts that changed.
- **Dollars are an estimate**, shown with a `~`: each response's tokens priced at Anthropic API list prices from [`scripts/prices.mjs`](scripts/prices.mjs), cache writes and reads included. It is not a bill — a subscription is not charged per token. A model missing from that table counts as $0 until the table is updated; prices in it are as of 2026-10-06.
- **Git state** is read with `git status`, `git stash list` and `git log` when a session starts, after each turn while the git tab is showing, and when you switch to it. The repository's own `core.fsmonitor` and `log.showSignature` settings are overridden, so its config cannot make the check run a program.
- **Pull request and CI status** are fetched with `gh pr view` and `gh run list` at the same moments. They are the only part that talks to the network, and only to GitHub, through your own `gh` sign-in.

## Known limits

- A transcript that was forked or copied is counted twice for the rows it shares.
- A mod cannot draw over the transcript or register its own key chord, so the HUD takes rows of its own and uses Claude Code's band shortcuts.
- The mod API is early access and may change between Claude Code releases.

## Uninstall

```
/plugin uninstall plimsoll@plimsoll
/plugin marketplace remove plimsoll
```

Then delete `<config dir>/plimsoll/` (`~/.claude/plimsoll/` by default) to remove the scan cache. A `usage-board/` folder beside it is the cache of a version before 0.3.0 and can go too.

## Develop

### Prerequisites

Node.js and the [Claude Code](https://claude.com/claude-code) CLI. The plugin has no package.json and nothing to install: the hooks run inside Claude Code, and the scripts use only Node's standard library. Only the site under `site/` has dependencies.

### Checks

```
node scripts/check.mjs                       # price table check
claude plugin validate --strict .            # manifest + hooks check
claude plugin test .                         # UI and logic tests
```

[CI](.github/workflows/ci.yml) runs the same three on every push and pull request.

### Run locally

```
claude --plugin-dir /path/to/plimsoll       # run it from disk
```

### Layout

- `hooks/register.tsx` — the band, the `/hud` command and the status line.
- `hooks/mascot.ts` — the kitten's frames.
- `scripts/scan.mjs` — sums the transcripts; `scripts/cache.mjs` names its cache; `scripts/prices.mjs` holds the price table.
- `scripts/git.mjs` — reads git and `gh`.
- `site/` — the [website and documentation](https://plimsoll.akshitbansal.me); see [site/README.md](site/README.md).

## Releases

A `v*` tag builds `Plimsoll-<version>.zip` (the plugin's runtime files under a `plimsoll/` folder), `SHA256SUMS.txt` and a build provenance attestation, and attaches them to a GitHub Release. The marketplace install above does not need the zip; it is for a pinned or offline install with `claude --plugin-dir`. Check one with:

```
gh attestation verify Plimsoll-<version>.zip --repo akshit-bansal11/plimsoll
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report a security problem privately, as [SECURITY.md](SECURITY.md) describes.

## License

[MIT](LICENSE)
