# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
