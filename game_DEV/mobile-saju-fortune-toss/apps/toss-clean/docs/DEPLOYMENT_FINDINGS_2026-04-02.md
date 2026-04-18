# Deployment Findings

## What we confirmed

- `토스` 본앱 경로가 실제 기준이다.
  - Android chooser appears: choose `토스`, not `MiniApp`.
- Emulator sandbox has been unstable as a regression baseline.
  - Some older deployment links that previously worked later started showing the generic error popup again.
- Private deployment image rendering is stricter than local React Native asset rendering.

## Research-backed conclusions

- Official/community guidance indicates Granite `Image` is safest with absolute `https` image URLs.
- Generic popup cases in community often mix:
  - sandbox/runtime instability
  - local dev server routing issues
  - deployment bundle/runtime mismatches
- For this project, image missing on private deployment was most consistent with asset delivery path mismatch, not page logic failure.

## What we changed

- Astra home visuals now use remote absolute URLs.
- Daily catalog visuals use remote absolute URLs.
- Tarot card visuals now use remote absolute URLs mapped by card id.
- QA script for Android local dev was fixed to correctly call `adb`.

## Local storage / artifacts

- Keep active upload artifact in `upload-ready`.
- Move older `.ait` files and notes into `upload-ready\archive`.
- Keep only latest Toss live-check files in `tmp\toss-live-check`, older ones go into `archive`.

## Next check

- Upload the latest file in `upload-ready`.
- Open via `intoss-private://...` in `토스`.
- Confirm these three screens specifically:
  - Astra home image
  - Daily icon/detail image
  - Tarot card image
