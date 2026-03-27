# Release Checklist

## Before Build
- [ ] `.env` is populated with final console, brand, support, and ad values.
- [ ] `assets/console/asset-manifest.json` references real PNG assets.
- [ ] `pnpm validate:release-env` passes.

## QA
- [ ] Sandbox checks are complete.
- [ ] QR/Toss-app checks are complete.
- [ ] Banner failure states collapse without layout breakage.
- [ ] Ads do not block critical flows.

## Packaging
- [ ] `pnpm build` generated a fresh `.ait` bundle.
- [ ] The bundle was uploaded with console QR or `pnpm deploy:test`.
- [ ] The final test app scheme launches correctly inside Toss.
