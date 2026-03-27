# QnA Month-Variation Fix (Postmortem)

## Issue
- In Saju Q&A month mode, changing month often produced almost identical text.

## Root Cause
- The main template body was mostly static domain text.
- Cycle data (year/month pillar, ten-god, element) was not strongly enforced in output.
- Month-specific action lines were too weakly coupled to the selected cycle.

## Fix Applied
- `QnaCycleContext` now carries `kind/year/month`.
- `buildQnaTemplateContext` now derives cycle-level fields (`cycleLabel`, `cyclePillar`, `cycleElement`, `cycleFocus`, `cycleRisk`, `cycleAction`).
- `formatQnaText` appends a mandatory `[시기 포인트]` block when cycle exists.
- Mobile Saju screen now passes full cycle context and uses deterministic month/domain-dependent note generation.

## Recurrence Prevention
- `packages/tools/src/qa-regression.ts` now asserts:
  - month variation count `>= 10` over 10 iterations,
  - year variation count `>= 10` over 10 iterations,
  - selected month cycle label is present in generated text.
- This is now part of `pnpm qa:regression`.

## Validation
- `pnpm qa:regression`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS
