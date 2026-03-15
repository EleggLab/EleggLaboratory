# Keystore Handling Guide

## Rules
- Never commit real keystore files or real passwords.
- Keep `android/key.properties` local only.
- Keep an offline encrypted backup of the upload keystore.
- Prefer Play App Signing, and store upload key metadata in password manager.

## Generate release keystore (example)
```bash
keytool -genkeypair -v \
  -keystore release.jks \
  -alias release \
  -keyalg RSA -keysize 2048 -validity 10000
```

## Local setup
1. Put the keystore file in `android/keystore/` (for example `android/keystore/release.jks`).
2. Copy `android/key.properties.example` to `android/key.properties`.
3. Fill `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
   - `storeFile` is resolved from `android/` root.
   - Example: `storeFile=keystore/release.jks`.
4. Run `scripts/release_play.*`.

## Build modes
- `scripts/release_local.*`:
  - Without key config, it builds debug artifacts and prints checklist.
  - With key config, it builds obfuscated release artifacts + symbols.
- `scripts/release_play.*`:
  - Requires `android/key.properties` and existing keystore file.
  - Runs preflight checks, then release AAB/APK with symbols.

## CI secrets guidance (example)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `SENTRY_AUTH_TOKEN` (optional for symbol upload)

Decode keystore in CI job, create `android/key.properties` at runtime, and remove both after build.
