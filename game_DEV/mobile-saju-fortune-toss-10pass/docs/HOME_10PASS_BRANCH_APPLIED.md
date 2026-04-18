# Home Screen 10-Pass Branch Applied

## Trunk Summary

The authored trunk of the home screen is:

- a full-screen character-first composition
- almost no competing chrome
- a bottom dialogue bubble as the emotional anchor
- lightweight touch interaction rather than a dashboard-like control panel

That trunk was preserved.

## Why Home Was Chosen First

Home is the clearest identity screen in this project.
If refinement works here without making the screen generic, the same method can spread to the other tabs.

## 10-Pass Branch Critique Loop

### 1. Trunk Keeper

Preserved:

- full-character composition
- sparse screen structure
- bottom dialogue placement

Changed:

- rewrote Astra's lines so the voice feels clearer and more intentional

### 2. Structure Critic

Preserved:

- one main visual plane plus one dialogue plane

Changed:

- introduced a clearer bottom dock grouping so the dialogue system feels designed, not floating by accident

### 3. Hierarchy Critic

Preserved:

- character image remains dominant

Changed:

- name, line, and interaction hint now read in a more reliable order

### 4. Interaction Critic

Preserved:

- touch-anywhere interaction

Changed:

- added a small hint chip so users can discover that the whole screen changes the line

### 5. Mood Critic

Preserved:

- dreamy mystic softness
- character-led intimacy

Changed:

- added a subtle lower-atmosphere curtain and soft side glow so the bubble sits inside the mood instead of on top of it

### 6. Craft Critic

Preserved:

- compact bubble scale

Changed:

- stronger bubble chrome
- better contrast
- cleaner spacing
- more deliberate accent treatment

### 7. Accessibility Critic

Preserved:

- concise line length

Changed:

- improved readability with larger line height and stronger text contrast

### 8. Anti-Generic Critic

Preserved:

- this is still not a card grid, dashboard, or standard hero banner app

Rejected:

- top stats
- extra CTA buttons
- dashboard panels
- generic menu tiles

### 9. Platform Critic

Preserved:

- mobile-first portrait composition

Changed:

- dialogue dock is easier to frame for store screenshots and easier to read over the background art

### 10. Final Integrator

Final direction:

- keep the authored screen minimal
- make the dialogue system more legible
- make the interaction hint discoverable
- avoid adding generic app-shell furniture

## Files Changed

- `apps/mobile/app/(tabs)/home.tsx`

## What To Apply Next

Use the same loop on:

1. `today.tsx`
2. `tarot/index.tsx`
3. `tarot/result.tsx`
4. `saju/index.tsx`
5. `iching.tsx`

## Guardrail

If a later pass makes the screen look cleaner but less authored, treat that as regression.
