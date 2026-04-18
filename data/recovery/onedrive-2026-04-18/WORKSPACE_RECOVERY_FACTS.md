# Workspace Recovery Facts

## Observed at 2026-03-30
- Current working directory: `C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory`
- Visible top-level content in that directory: only `tmp/`
- `git status` failed because the directory is not a git repository
- `magic_toss/` was not present under the current working directory
- A focused search under `C:\Users\rndhr\OneDrive\Documents\GitHub` did not find `magic_toss`, `App.tsx`, or `granite.config.ts`
- `text-choice-frame-studio` was found at `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\text-choice-frame-studio`
- The current writable workspace root does not include that detected project path, so read access is available but in-place edits are blocked from this workspace session
- Latest observed project file timestamps outside the writable root were `app.js` 2026-03-30 05:20, `styles.css` 2026-03-30 05:18, `sample_story.json` 2026-03-30 05:16

## Why this pass exists
- The highest-severity blocker is missing source state, not a code defect inside the app
- Future passes need a repeatable way to prove whether the project has moved, been unmounted, or not yet synced back into this workspace
- The same blocker now applies to `text-choice-frame-studio`: the expected app files are not present under the visible workspace root
- The current session adds a second blocker: the real project root is outside the writable sandbox, so project-state observation and project-state editing are split across different roots

## Added artifact
- `tmp/locate-magic-toss.ps1`
  - Searches common roots for project markers
  - Normalizes hits back to `magic_toss/app`
  - Reports whether the preferred root is writable from the current workspace
  - Emits JSON only
  - Safe to run repeatedly in later passes
- `tmp/inspect-magic-toss-state.ps1`
  - Resolves the preferred `magic_toss` root using the locator
  - Summarizes package scripts, README preview, inferred scene kinds, recent file changes, and writable status
  - Emits JSON only
  - Safe to run repeatedly in later passes
- `tmp/locate-text-choice-frame-studio.ps1`
  - Searches common roots for the `text-choice-frame-studio` directory and known project files
  - Emits JSON only
  - Safe to run repeatedly in later passes
