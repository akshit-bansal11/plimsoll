# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- The cat is interactive: it watches a hovering pointer, gets crosser with each quick click (up to a hiss), and purrs when you press and drag across it to pet it.

### Changed
- The mascot is now a pixel-art tabby drawn in coloured half blocks, with new idle acts (wave, groom, yarn, purr, dance), a laptop while working, a curled-up sleep and a bristled alarm.
- The band has a new palette, pill-style tabs, a heading over each column, a divider between the columns, and its content centred beside the cat.
- Gauges draw as a continuous line instead of segments.
- The cat is smaller (20 columns, 5 rows) and its caption moved from the header to under it.
- The title and tabs no longer wrap when the band is narrow.
- The cat animates in its own region, so the rest of the band is no longer redrawn on every animation frame.

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
