# Commit Split Guide

Use this guide when preparing commits for GitHub.

## `feat:`

Use `feat:` only for real game behavior changes.

Typical examples:

- gameplay logic
- event flow
- UI behavior tied to gameplay
- tuning that includes a rule change and validation

Do not include logs, batch reports, or generated outputs.

## `docs:`

Use `docs:` only for durable documentation.

Typical examples:

- `README.md`
- `docs/workspace/**`
- project usage notes that should stay with the repo
- curated reference docs that humans will read later

## `chore:`

Use `chore:` for repository hygiene and environment cleanup.

Typical examples:

- `.gitignore` updates
- generated artifact removal
- build cache cleanup
- untracking repeated reports
- backup-and-prune housekeeping

## Exclude From Feature Commits

Never mix these into `feat:`:

- `toss-game-rebuilds/progress-*.md`
- `toss-game-rebuilds/BATCH_*.md`
- `toss-game-rebuilds/SPRINT_*.md`
- `pojet/reports/ai/**`
- `pojet/reports/qa/**`
- `pojet/reports/ui-capture/**`
- generated balance snapshots such as `pojet/reports/balance/latest-*`

## Recommended Order

When multiple buckets exist, split them in this order:

1. `chore:` cleanup and ignore rules
2. `docs:` durable docs
3. `feat:` product code

This keeps the feature diff focused and easier to review.
