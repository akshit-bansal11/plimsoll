# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] - 2026-10-20

### Added
- A logo: the Plimsoll mark, a ring with a bar through it and the hull below the line filled in. It heads the README and the site, and is the site's favicon and Apple touch icon.
- A social preview image for the repository and for links to the site.
- `/hud still` pauses the kitten's animation, and remembers it across sessions.
- CI runs the checks on Ubuntu, macOS and Windows, and a self-test that runs the git and scan scripts for real.

### Changed
- Token totals count input and output; cache reads and writes are shown beside them as `+N cache`.
- Dollar estimates read `~$… API`, so they are not taken for a bill.
- The kitten panics only when the context window or the 5-hour window reaches 90%; the weekly window could keep it panicking for days.
- Colours follow your Claude Code theme, so the band reads on light terminals; only orange is fixed.
- The README and site name the requirements: Node.js 20.1 or later, and the Claude Code release CI tests against (2.1.301).

### Fixed
- The website's address is https://plimsoll.akshitbansal.dev. Its canonical links, sitemap, the README's docs badge and plugin.json's `homepage` named plimsoll.vercel.app, which belongs to another Vercel project.
- The README no longer says nothing is sent anywhere: pull request and CI status come from GitHub through your own `gh`.
- Prices as of 2026-10-20: Claude Sonnet 5.5 cache reads cost 0.05x of input, not 0.1x; Claude Haiku 5.5 prompts over 100,000 tokens use its higher prices; Opus 4.5, Opus 4.1, Opus 4, Sonnet 4.5, Sonnet 4 and Haiku 3.5 are priced instead of counting as $0; Amazon Bedrock and Google Vertex model ids are priced.
- A scan that fails says why, instead of always "Node.js not found on PATH".
- The first scan of a long history saves its progress as it goes, so it completes over the next turns instead of timing out every time.
- git and gh are found when a Windows PATH entry is quoted.
- Bidirectional-override and zero-width characters in repository and GitHub text are replaced before they are drawn.
- With no network, the git tab says GitHub is unreachable instead of "none for this branch".
- Dollar figures already in the scan cache are rebuilt once with the new prices: the cache file is now `scan-cache-3.json`, and the usage-board cache is no longer copied.

## [0.3.0] - 2026-10-16

### Added
- Releases: a `v*` tag publishes `Plimsoll-<version>.zip` with `SHA256SUMS.txt` and a build provenance attestation.
- CI runs the price check, strict manifest validation and the tests on every push and pull request.
- CONTRIBUTING.md and SECURITY.md.
- A website: a landing page and one-page documentation, with the version, price table and band mock-up read from the repository at build time.

### Changed
- **Breaking:** renamed from usage-board to Plimsoll. The plugin id is now `plimsoll@plimsoll`, from the marketplace `akshit-bansal11/plimsoll`. Uninstall `usage-board@usage-board` and remove the `usage-board` marketplace, then install the new id.
- Whether the HUD is hidden resets once, because it is stored under the plugin's name: run `/hud hide` again if you had it hidden.
- The scan cache moved from `<config dir>/usage-board/` to `<config dir>/plimsoll/`. The first scan copies the old cache across when the new one does not exist yet, so nothing is rescanned; the old folder is left in place and can be deleted.
- The README now says when git and `gh` actually run: once when a session starts, then after each turn only while the git tab is showing. It used to say only while the tab was showing.

## [0.2.1] - 2026-10-13

### Security
- git and gh are run by their full path from PATH, so a `git.exe` or `gh.exe` planted in the inspected repository is never executed on Windows.
- The inspected repository's `core.fsmonitor` and `log.showSignature` settings are overridden, so its config cannot name a program for the status check to run.

## [0.2.0] - 2026-10-13

### Added
- HUD strip above the prompt with usage, stats and git tabs.
- Context-window gauge with tokens used and left.
- Token totals and estimated cost for today, this week and this month.
- Usage statistics: peak hours, weekdays, 30 days, 12 months, busiest periods.
- Git tab: branch, ahead/behind, change counts, last commit, pull request, checks and CI.
- Animated ASCII kitten mascot.
- `/hud` command to hide, show and switch tabs.

### Removed
- The side pane and the `/usage-board` command of 0.1.0.

[Unreleased]: https://github.com/akshit-bansal11/plimsoll/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/akshit-bansal11/plimsoll/releases/tag/v0.3.1
