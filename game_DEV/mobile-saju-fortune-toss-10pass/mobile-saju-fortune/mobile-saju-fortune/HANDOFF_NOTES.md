## Handoff Notes

This bundle was copied from:

- `game_DEV/mobile-saju-fortune`

Recommended first read:

- `PROJECT_HANDOFF_KO.md`
- `README.md`
- `docs/DECISIONS.md`
- `docs/QA_REPORT.md`
- `docs/RELEASE_TODO.md`
- `SELF-CRITIQUE.md`

Included:

- app source code
- package workspace files
- docs
- mobile assets and in-project resource files

Excluded for safety or portability:

- `apps/web/.env.local`
- `apps/mobile/android/upload-keystore.jks`
- `apps/mobile/android/app/debug.keystore`
- `apps/mobile/android/keystore.properties`
- `apps/mobile/android/local.properties`
- `apps/web/tsconfig.tsbuildinfo`

Getting started:

```bash
corepack pnpm install
corepack pnpm dev:mobile
```

Optional web preview:

```bash
corepack pnpm dev:web
```

Notes:

- Recreate `.env.local` manually if the web app needs private API keys.
- Recreate Android signing files manually before release builds.
- The copied project already includes the in-project mobile asset folders used by the app.
