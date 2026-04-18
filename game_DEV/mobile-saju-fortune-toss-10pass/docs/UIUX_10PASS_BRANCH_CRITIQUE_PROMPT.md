# UI/UX 50-Pass Branch Critique Prompt

This project copy follows the `50-Pass Branch Critique Loop`.
The local filename stays `UIUX_10PASS_BRANCH_CRITIQUE_PROMPT.md` for compatibility with older notes.

## Core Rule

- The base UI/UX frame is the user's original work.
- Preserve the authored trunk first.
- Refine by branching, not replacing.
- Run the loop as a sequential direct-edit handoff chain, not as a review-only accumulation pass.

## Required Loop

- Total passes: `50`
- Structure: `10 roles x 5 rounds`
- Workflow:
  - `pass 1` creates `working branch v1`
  - each later pass directly edits the incoming working branch and hands the new version to the next pass
  - `pass 50` produces the final revised branch
  - there is no separate implementation phase after the loop
- Role cycle:
  - `1 / 11 / 21 / 31 / 41` Trunk Keeper
  - `2 / 12 / 22 / 32 / 42` Structure Critic
  - `3 / 13 / 23 / 33 / 43` Hierarchy Critic
  - `4 / 14 / 24 / 34 / 44` Interaction Critic
  - `5 / 15 / 25 / 35 / 45` Mood Critic
  - `6 / 16 / 26 / 36 / 46` Craft Critic
  - `7 / 17 / 27 / 37 / 47` Accessibility Critic
  - `8 / 18 / 28 / 38 / 48` Anti-Generic Critic
  - `9 / 19 / 29 / 39 / 49` Platform Critic
  - `10 / 20 / 30 / 40 / 50` Final Integrator

## Master Prompt

```text
The base UI/UX frame of this project is the user's original work.
Treat the current structure as authored trunk, not disposable scaffolding.

Preserve:
- layout DNA
- interaction rhythm
- information hierarchy
- emotional framing

Do not flatten the project into generic AI UI, default SaaS cards, or interchangeable mobile shell patterns.
Prefer additive refinement over destructive rewrite.
Make the smallest safe change that creates the strongest quality improvement.

Run the 50-Pass Branch Critique Loop.

Use the 10-role sequence across 5 rounds:
- 1 / 11 / 21 / 31 / 41: Trunk Keeper
- 2 / 12 / 22 / 32 / 42: Structure Critic
- 3 / 13 / 23 / 33 / 43: Hierarchy Critic
- 4 / 14 / 24 / 34 / 44: Interaction Critic
- 5 / 15 / 25 / 35 / 45: Mood Critic
- 6 / 16 / 26 / 36 / 46: Craft Critic
- 7 / 17 / 27 / 37 / 47: Accessibility Critic
- 8 / 18 / 28 / 38 / 48: Anti-Generic Critic
- 9 / 19 / 29 / 39 / 49: Platform Critic
- 10 / 20 / 30 / 40 / 50: Final Integrator

For each pass:
- state what must be preserved
- state what should be improved
- directly edit the incoming working branch instead of only reviewing it
- state what changed in this pass
- leave a handoff note for the next pass
- reject generic drift
- do not save up 50 review notes and implement later
- treat pass 50 output as the final revised branch

Final output:
1. trunk summary
2. core problems
3. 50-step handoff summary
4. final state
5. anti-generic check
6. implementation notes
```

## Canonical Workspace Docs

- `C:/Users/rndhr/OneDrive/Documents/GitHub/EleggLaboratory/PROJECT_UIUX_POLICY.md`
- `C:/Users/rndhr/OneDrive/Documents/GitHub/EleggLaboratory/UIUX_10PASS_BRANCH_CRITIQUE_PROMPT.md`
