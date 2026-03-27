# PLAN

## Task 1. Research and rule decisions
- DoD: Record R1~R5 findings in `SOURCES.md` and `docs/DECISIONS.md`.
- Test: Verify each selected default rule is reflected in runtime options and UI labels.

## Task 2. Monorepo scaffold
- DoD: Workspace with `apps/*` and `packages/*` runs with a single root command.
- Test: `corepack pnpm -r typecheck` passes.

## Task 3. Data package v1
- DoD: Canonical JSON tables for stems/branches/relations/ten-gods/rules.
- Test: Data imported by `@saju/core` without runtime parse failures.

## Task 4. Core engine v1
- DoD: Four Pillars wrapper, ten-gods, relations, element distribution, strength, luck(simple+advanced_v1).
- Test: unit tests and snapshots pass in `packages/core`.

## Task 5. Test vectors and cross-validation
- DoD: >= 30 vectors including solar/lunar/leap/jasi/term edges.
- Test: vector snapshot test + cross-check scripts run.

## Task 6. Web MVP
- DoD: input -> summary/detail/Q&A/settings tabs with reliability labels.
- Test: web typecheck/lint/build pass and manual interaction works.

## Task 7. Domain Q&A (no AI)
- DoD: prepared Q&A templates for money/love/health/etc + optional year/month slice views.
- Test: Q&A renders deterministically from the same chart and shows evidence lines + source URLs.

## Task 8. Mobile MVP
- DoD: Expo screen uses shared core logic with editable inputs and computed output.
- Test: mobile typecheck passes and local Expo launch works.

## Task 9. Verification tools
- DoD: scripts for data.go.kr/KASI cross-check and source-url validation.
- Test: `pnpm --filter @saju/tools check:sources` passes.

## Task 10. Self-critique
- DoD: `SELF-CRITIQUE.md` lists risks and concrete next actions.
- Test: each risk links to a measurable follow-up action.
