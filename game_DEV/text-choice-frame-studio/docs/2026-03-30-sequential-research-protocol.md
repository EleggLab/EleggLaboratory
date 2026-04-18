# Sequential Research Protocol

This run uses one live working branch.

## Core Rule

- No parallel pass simulation
- No review pile first, implementation later
- Pass `N+1` starts only after pass `N` completes edit + smoke check + handoff note

## Exact Pass Sequence

1. Load the current build or checkpoint.
2. Review the product as a black box first.
3. Gather one new primary research input for this pass.
4. Write one pass note with:
   - preserve
   - problem
   - research input
   - actual edit
   - handoff
5. Apply the edit immediately.
6. Run a smoke check.
7. Hand off the edited result to the next pass.

## Axis Rules

- `Game overall`
  - structure-first
  - no research-first requirement
  - preserve the minimal schema and static-browser workflow
- `Features + content`
  - every pass starts with fresh external research
  - do not trust prior implementation habits until research reframes the pass
- `UI`
  - every pass starts with fresh external research
  - current layout is not sacred
  - preserve product purpose, not present composition

## Checkpoints

- At passes `10 / 20 / 30` for each axis:
  - write a checkpoint note
  - capture a screenshot artifact
  - summarize changes since the previous checkpoint

## Smoke Checks

- `node --check app.js`
- sample JSON parse
- local app still loads
- select node -> edit -> route -> playtest loop still works
