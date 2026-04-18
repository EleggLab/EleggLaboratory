# Toss Clean Progress And Milestones

## Summary

- Target app: `astra`
- Active Toss shell: `apps/toss-clean`
- Current upload candidate:
  - `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\upload-ready\astra-toss-clean-bundled-assets-remotefix-20260402-164304.ait`
- Current focus:
  - keep `토스 본앱` path stable
  - restore image rendering in private deployment
  - finish functional parity for Daily / Tarot / Saju / IChing

## Current Status

### What is already solved

- Old unstable `apps/toss` path was replaced with clean official-starter-based `apps/toss-clean`.
- `appName=astra` and Toss bundle registration path are aligned.
- `토스 본앱` path has already opened successfully on real device multiple times.
- Generic `BrickModule` / early Granite startup crashes were resolved.
- Compact header, short-scroll UX, and bottom tab visual direction were rebuilt on top of the clean shell.
- Astra home, Daily, Tarot, Saju, and IChing routes all exist in `toss-clean`.
- Upload-ready artifact generation is automated.

### What is partially solved

- Astra home visual system exists and runs.
- Daily and Tarot flows exist and build correctly.
- Saju and IChing pages exist and open in the clean shell.
- Responsive layout pass has been applied to the rebuilt UI.

### What is still under verification

- Private deployment image rendering is not yet signed off.
- `MiniApp` path is not a reliable success baseline; `토스 본앱` is the practical release baseline.
- Emulator sandbox behavior has not been stable enough to use as the final truth source.
- Real-device Toss-app QA is the source of truth for release decisions.

## Key Findings

### Verified facts

- `토스 본앱` is the meaningful runtime target for release validation.
- `MiniApp` generic popup alone does not prove the release path is broken.
- Granite/private deployment image handling is safer with absolute `https` asset URLs.
- Some previous failures were caused by asset loading assumptions, not route registration itself.

### Important caveat

- `MiniApp` failure is not automatically acceptable forever.
- But when `토스 본앱` works and `MiniApp` is the only failing path, release judgment should prioritize the real Toss app path.

## Milestones

## Milestone 0. Baseline Recovery

- Status: done
- Goal:
  - make any Toss build open at all
- Done:
  - replaced old Toss shell approach with official starter-based `toss-clean`
  - fixed early Granite boot issues

## Milestone 1. Clean Shell Boot

- Status: done
- Goal:
  - open a minimal screen inside Toss runtime
- Done:
  - minimal diagnostic route opened in `토스 본앱`
  - verified route registration and official dual-runtime packaging

## Milestone 2. Core Navigation Return

- Status: done
- Goal:
  - restore app hub and basic feature entry points
- Done:
  - home hub
  - daily hub
  - tarot hub
  - saju page
  - iching page

## Milestone 3. Astra Home Rebuild

- Status: mostly done
- Goal:
  - restore Astra home interaction on clean shell
- Done:
  - fullscreen Astra layout
  - affection pill
  - dialogue card
  - touch VFX
  - GIF support path
- Remaining:
  - sign off private deployment image rendering
  - polish persistent affection behavior if needed

## Milestone 4. UX Compression

- Status: done
- Goal:
  - remove bad short-scroll patterns
- Done:
  - shorter header
  - denser Daily layout
  - denser Tarot intro
  - tighter Saju input screen

## Milestone 5. Functional Parity

- Status: in progress
- Goal:
  - match original app behavior closely enough for real release
- Done:
  - Daily page structure restored
  - Tarot hub/reading/result restored
  - Saju base input page restored
  - IChing base page restored
- Remaining:
  - verify per-screen image rendering
  - verify detailed behavioral parity
  - verify no route-specific private deployment breakage remains

## Milestone 6. Asset Delivery Stabilization

- Status: in progress
- Goal:
  - make images reliable in private deployment
- Done:
  - public CDN-like asset hosting prepared
  - Astra home switched to remote URL approach
  - Daily catalog switched to remote URL approach
  - Tarot card image mapping switched to remote URL approach
  - upload-ready artifact rebuilt after remote-asset refactor
- Remaining:
  - confirm latest private deployment shows:
    - Astra home image
    - Daily icon/detail image
    - Tarot card image

## Release Checklist

## A. Runtime

- `토스 본앱` opens the app successfully
- no generic popup on the release candidate path
- no `ReactNativeJS` fatal
- no `BrickModule` fatal
- no route-specific crash when moving between:
  - home
  - daily
  - tarot
  - saju
  - iching

## B. Images

- Astra home image visible
- Astra GIF-capable variant does not break screen
- Daily icon tiles visible
- Daily detail image visible
- Tarot card thumbnails visible
- Tarot result card image visible

## C. UX

- header height stays compact
- no awkward short-scroll on Astra / Daily / Tarot / Saju
- bottom tabs remain readable
- no overlap between dialogue card and tab bar
- compact screens do not clip CTA buttons

## D. Feature Checks

- Daily:
  - western/chinese switch works
  - detail page opens
- Tarot:
  - hub -> reading -> result flow works
  - card selection count behaves correctly
- Saju:
  - input page opens and fits without awkward scroll
- IChing:
  - intro and result flow work

## E. Submission

- current upload-ready file is clearly marked
- previous experimental builds are archived
- release note / memo exists for the current artifact

## Immediate Next Checks

1. Upload the current latest `.ait`.
2. Open it with `토스`, not `MiniApp`.
3. Capture these three screens first:
   - Astra home
   - Daily hub or detail
   - Tarot reading/result
4. If all three images render:
   - continue parity polish
   - move to final release QA
5. If any image is still missing:
   - inspect that specific asset path only
   - avoid broad shell changes

## Current Recommendation

- Do not rebuild the shell again unless the current image-path fix fails in `토스 본앱`.
- Treat the latest upload artifact as the main candidate until a real-device image check disproves it.
- Use `토스 본앱` on real device as the release baseline.
