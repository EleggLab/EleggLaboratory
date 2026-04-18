# Word Morph Lab Systems and Content Pass 01-30

- Mode: strict sequential direct-edit handoff
- Track: systems + content
- Order: B01 -> B30, one consciousness at a time
- Trunk preserved:
  - 100-word catalog remains the core content source
  - word search, hinting, archive, and streak systems remain intact
  - response text stays concise enough for rapid play

## Applied Outcome

- Restored dialogue-like content by generating event-aware subject lines, directives, and lab notes.
- Added category briefs so each family now has a distinct play purpose and observation tone.
- Added dossier observation and next-push generation so content now helps the player keep moving instead of only describing the current state.

## Pass Chain

1. Trunk Keeper: Preserve the existing 100-word catalog instead of rewriting data structures.
2. Structure Critic: Add a second content layer beside `CATEGORY_LINES` rather than replacing it.
3. Hierarchy Critic: Separate short reaction text from persistent dossier text.
4. Interaction Critic: Decide that event type, not only current word, should control the visible dialogue.
5. Mood Critic: Keep the voice intimate and slightly uncanny, never jokey.
6. Craft Critic: Use compact category briefs for directive and observation text.
7. Accessibility Critic: Keep content dense but short enough to scan in one stop.
8. Anti-Generic Critic: Avoid tutorial-speak; every line should sound like it belongs to the same experiment.
9. Platform Critic: Prefer generated copy from existing word data so content stays maintainable.
10. Final Integrator: Lock the content model as `word data + category brief + event type`.
11. Trunk Keeper: Preserve category identity through the existing slugs.
12. Structure Critic: Add one directive and one observation per category, not a sprawling lore sheet.
13. Hierarchy Critic: Directives tell the player what to do next; observations explain what this family changes.
14. Interaction Critic: Hint events should speak differently from unlock events.
15. Mood Critic: The subject should sound aware of the shift, but not fully in control of it.
16. Craft Critic: Pull prompt fragments directly from `promptDelta` so the content stays grounded in the actual image state.
17. Accessibility Critic: Use concrete words from the prompt fragments to aid recognition.
18. Anti-Generic Critic: Reject empty hype lines; each line should mention shape, mood, or material.
19. Platform Critic: Avoid hand-authoring 100 bespoke quotes for now; keep the system extensible.
20. Final Integrator: Category briefs now give the whole content layer a repeatable voice.
21. Trunk Keeper: Preserve the machine log as the audit trail.
22. Structure Critic: Keep new dialogue outside the log so the log can stay short and functional.
23. Hierarchy Critic: Make unlocks sound like first contact and revisits sound like remembered states.
24. Interaction Critic: Give hints their own language that narrows a word without spoiling it.
25. Mood Critic: Make misses feel like failed resonance, not user blame.
26. Craft Critic: Build reusable helpers for prompt fragments and related words.
27. Accessibility Critic: Ensure next-step language remains explicit even when the player skips hints.
28. Anti-Generic Critic: Replace generic helper copy with `Next Push`, a world-consistent forward nudge.
29. Platform Critic: Use same-category neighbors to produce practical next steps without adding new content files.
30. Final Integrator: Systems content now supports pacing, tone, and replay instead of only status reporting.

## Files Touched

- `game_DEV/word-morph-lab/app.js`
