# MEMORY.md

## UI/UX Authorship Default

- The user considers the base UI/UX frame of this project their own original work.
- Preserve that authored trunk by default instead of replacing it with generic AI-style structure.
- Future art work, especially UI design, should use the `PROJECT_UIUX_POLICY.md` `50-Pass Branch Critique Loop` as the default process.
- Default depth for that loop is 50 sequential direct-edit handoff passes unless the user explicitly asks for a faster mode.
- Each pass should receive the previously edited working branch, modify it directly, and hand it to the next pass.
- There is no separate feedback collection phase and no later implementation phase after pass 50.
- Workspace startup order should begin with `AGENTS.md`, then `PROJECT_UIUX_POLICY.md`, then `UIUX_10PASS_BRANCH_CRITIQUE_PROMPT.md` (legacy filename retained, 50-pass content), then `MEMORY.md`, then today's and yesterday's `memory/YYYY-MM-DD.md` files before normal work begins.

## Saved Direction References

- `https://zb-web2.pages.dev/`
  - Save this as an art/UI reference only.
  - Core mood: Korean urban zombie-apocalypse survivor dossier.
  - Visual language: near-black and zinc surfaces, sharp red accents, red glow for danger emphasis, glossy/cinematic presentation, strong contrast.
  - Character treatment: large 3:4 portrait art is the center of the experience; characters feel like collectible profiles or VN dossier entries more than gameplay pawns.
  - Navigation model: landing page with logo/copy/BGM, then a stripped-down app shell with two primary tabs (`지도`, `캐릭터`).
  - Information architecture: browse survivors either by map pins or by card grid, then open a right-side detail sheet with affiliation, base, combat grade, abilities, weapon, traits, and appearance/personality notes.
  - Motion/polish: soft page fade-in, hover zoom on portraits, red active-state fills, subtle glass/dim panel treatment, compact top bar, mixed Korean labels with monospace English code-name styling.
  - Reuse target: mood boards, UI tone, character-database presentation, worldbuilding showcase screens.
  - Do not reuse as a gameplay benchmark; it is much closer to a character/world presentation prototype than a complete playable game loop.
