# Project UI/UX Policy

## Core Ownership

- The base UI/UX frame of this project is the human user's own original creation.
- Treat the current UI/UX as authored work with intent, not as placeholder wireframes to overwrite.
- Any extension, redesign, reskin, or polish pass should begin from that assumption.

## Working Stance

- Preserve the trunk before growing branches.
- Do not replace the project with generic AI-safe layouts, default SaaS cards, bland mobile shells, or interchangeable game UI patterns.
- Before making changes, identify what must remain recognizable:
  - screen structure
  - navigation rhythm
  - card hierarchy
  - character framing
  - dialogue placement
  - visual mood
  - the flow between curiosity, reveal, and payoff

## What Can Improve

- Systemization
  - design tokens
  - spacing rules
  - reusable components
  - state handling
- Craft
  - typography tuning
  - spacing and alignment
  - contrast and readability
  - animation polish
  - art direction cohesion
- Product quality
  - responsiveness
  - accessibility
  - performance
  - store-readiness
  - documentation

## What Should Not Happen By Default

- Do not rewrite the whole UI just because a cleaner or more modern pattern exists.
- Do not flatten the user's authored mood into a generic app-store template.
- Do not remove odd or distinctive choices unless they create a real usability or shipping problem.
- If a proposed change would alter the recognizable identity of the project, pause and call that out clearly before committing it.

## Practical Tips

1. Read the current screen like a finished statement, not a draft.
2. Name the invariant layer first: what is the trunk?
3. Improve one layer at a time: structure, hierarchy, polish, motion, readability.
4. When suggesting revisions, always state what is being preserved.
5. Prefer refinement over replacement.
6. If a change makes the screen feel more generic, undo it or route around it.
7. The standard for "better" is not cleaner in isolation; it is more effective while still feeling like the same authored work.

## 50-Pass Branch Critique Loop

This is the default workflow for future art work, especially UI design.

- Minimum passes: 50
- Default mode: on
- Override only when the human explicitly asks for a faster or lighter pass

### Loop Rule

- Pass 1 creates the first edited working branch from the current trunk.
- Pass 2 receives that edited branch, modifies it directly, and hands the revised branch to Pass 3.
- Pass 3 receives that updated branch, modifies it directly again, and hands it to Pass 4.
- Continue that same sequential direct-edit handoff through pass 50.
- Passes 1-10 complete the first working chain, passes 11-20 continue from that edited result, and so on through passes 41-50.
- Each pass operates on the latest edited branch, not on a separate review-only copy.
- This loop is not a parallel evaluation meeting and not a feedback pile that gets implemented later.
- There is no separate final implementation phase after pass 50; the pass 50 output is the final revised branch.

### Recommended Roles

1. Trunk Keeper (`1 / 11 / 21 / 31 / 41`)
   Preserve authorship and create or reshape the current working branch.
2. Structure Critic (`2 / 12 / 22 / 32 / 42`)
   Directly edit the incoming working branch for layout logic, grouping, and page skeleton.
3. Hierarchy Critic (`3 / 13 / 23 / 33 / 43`)
   Directly edit the incoming working branch for scan order, emphasis, and reveal sequence.
4. Interaction Critic (`4 / 14 / 24 / 34 / 44`)
   Directly edit the incoming working branch for tap flow, friction, and screen-to-screen continuity.
5. Mood Critic (`5 / 15 / 25 / 35 / 45`)
   Directly edit the incoming working branch to protect the user's world and tone.
6. Craft Critic (`6 / 16 / 26 / 36 / 46`)
   Directly edit the incoming working branch for typography, spacing, composition, and finish.
7. Accessibility Critic (`7 / 17 / 27 / 37 / 47`)
   Directly edit the incoming working branch for legibility, contrast, target size, and clarity.
8. Anti-Generic Critic (`8 / 18 / 28 / 38 / 48`)
   Directly edit the incoming working branch to remove bland or interchangeable drift.
9. Platform Critic (`9 / 19 / 29 / 39 / 49`)
   Directly edit the incoming working branch for store-readiness, device fit, and production realism.
10. Final Integrator (`10 / 20 / 30 / 40 / 50`)
    Make the final edit pass of that round and hand off the resulting branch; pass 50 is the final revised state.

## Default Output Expectation

When working on art or UI by default:

- show the preserved trunk
- show what changed
- explain why the change is better without erasing authorship
- note where the 50-step handoff chain found and corrected weak points
- make clear that each pass directly changed the working branch instead of only leaving feedback

## Short Version

- The user authored the base UI/UX.
- Preserve identity first.
- Improve by branching, not replacing.
- Use the `50-Pass Branch Critique Loop` as a sequential direct-edit handoff chain by default for art and UI work.
