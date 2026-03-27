# Tarot Image Assets

Put tarot card images here for offline, fast loading.

- Major arcana (22): `apps/mobile/assets/tarot/major/`
- Minor arcana (56, optional): `apps/mobile/assets/tarot/minor/`

To wire images into the app, map card ids to `require(...)` in:
- `apps/mobile/lib/features/tarot/imageSource.ts`

Recommended filenames (example):
- `apps/mobile/assets/tarot/major/rws-00-fool.png`
- `apps/mobile/assets/tarot/major/rws-01-magician.png`
