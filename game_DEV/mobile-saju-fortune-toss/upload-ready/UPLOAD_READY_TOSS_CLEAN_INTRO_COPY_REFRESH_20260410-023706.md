# Toss Clean Upload Ready

- App: `astra`
- Build target: `apps/toss-clean`
- Artifact: `astra-toss-clean-intro-copy-refresh-20260410-023706.ait`
- Source build: `astra.ait`
- Deployment ID: `019d7353-7015-78e8-9258-fca5baea01a5`
- SHA256: `19B16F501E123423BDD85E67BF25480251BC1FC66ECB33869202D6B171DD1971`
- Size: `287,562,772 bytes`

## Verification

- `node ./scripts/generate-inline-assets.mjs`
- `node ./scripts/verify-locked-assets.mjs`
- `node ./scripts/patch-granite-windows.mjs`
- `granite build`
- `pnpm exec ait build`

## Notes

- Upload artifact path: `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\upload-ready\astra-toss-clean-intro-copy-refresh-20260410-023706.ait`
- A fresh memo was generated automatically by `scripts/build-upload-ready.mjs`.
- If Android shows a chooser, open with `Toss`, not `MiniApp`.
