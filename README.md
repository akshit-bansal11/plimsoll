# usage-board

A heads-up display for [Claude Code](https://claude.com/claude-code), drawn in the band above the prompt.

```
── ◢ USAGE-BOARD · *waves* ───────────────────────────────── 1: USAGE  2: STATS  3: GIT ──
                  CTX    ▰▰▰▱▱▱▱▱▱▱▱▱  28%  276.7K used · 723.3K left     TODAY   43.6M tok  ~$8.86
    /\_/\         5H     ▰▰▰▰▰▱▱▱▱▱▱▱  43%  resets 3h 17m                 WEEK    89.0M tok ~$31.40
   ( ^.^ )/       WEEK   ▰▰▰▰▰▰▰▱▱▱▱▱  56%  resets 1d 2h                  MONTH  427.3M tok ~$142.10
    (")(") ~
```

(The figures above are an illustration of the layout, not real output.)

## What it shows

- **Usage** — how full the context window is (tokens used and left), your 5-hour and weekly rate-limit windows with time to reset, and tokens plus estimated cost for today, this week and this month.
- **Stats** — your peak hours, busiest weekday, the last 30 days and 12 months as sparklines, and your most active day, week and month.
- **Git** — repository, branch, ahead/behind, staged/modified/untracked/conflict/stash counts, the last commit, the branch's pull request with review state and check counts, and the latest CI run.
- **A mascot** — a small ASCII kitten that idles, types while Claude works, sleeps when you are away and panics when a gauge passes 90%.

Gauges are green below 50%, yellow from 50%, orange from 75% and red from 90%.

## Install

In a Claude Code terminal session:

```
/plugin install usage-board --marketplace akshit-bansal11/usage-board
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

## Requirements

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

While hidden, a one-line summary stays in the status line. The hidden state is remembered across sessions.

The strip needs about 110 columns to lay its two content columns side by side; narrower than that they stack, and below 48 columns it is not drawn.

## How the numbers are produced

- **Context and rate limits** come from Claude Code itself. Rate-limit windows are only reported on a subscription.
- **Tokens and statistics** are summed from the transcripts under your Claude config folder (`~/.claude/projects`, or `CLAUDE_CONFIG_DIR`), in local time, weeks starting Monday. Nothing leaves your machine. A cache at `<config dir>/usage-board/` makes later scans fast.
- **Dollars are an estimate**, shown with a `~`: each response's tokens priced at Anthropic API list prices from [`scripts/prices.mjs`](scripts/prices.mjs). It is not a bill — a subscription is not charged per token. A model missing from that table counts as $0 until the table is updated; prices in it are as of 2026-10-06.
- **Pull request and CI status** are fetched with `gh`, only while the git tab is showing.

## Known limits

- A transcript that was forked or copied is counted twice for the rows it shares.
- A mod cannot draw over the transcript or register its own key chord, so the HUD takes rows of its own and uses Claude Code's band shortcuts.
- The mod API is early access and may change between Claude Code releases.

## Develop

```
claude --plugin-dir /path/to/usage-board    # run it from disk
claude plugin validate .                     # manifest + hooks check
claude plugin test .                         # UI and logic tests
node scripts/check.mjs                       # price table check
```

## License

MIT
