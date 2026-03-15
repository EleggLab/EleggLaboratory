# Release Checklist

1. Bump app version in `pubspec.yaml` to `x.y.z+build`.
2. Prepare signing files:
   - copy `android/key.properties.example` -> `android/key.properties`
   - set real `storeFile`, `storePassword`, `keyAlias`, `keyPassword`
   - ensure keystore file exists at `android/<storeFile>`
3. Verify release config values:
   - `assets/config/app_config.json` has `privacyPolicyUrl` and `supportEmail`
   - production Ads IDs are set (or use `ALLOW_TEST_ADS=1` only for intentional internal testing)
4. Run full QA:
   - `scripts/qa_all` (platform script)
   - `scripts/qa_release` (platform script)
5. Run release build:
   - `scripts/release_play` (platform script)
6. Confirm artifacts:
   - `build/app/outputs/bundle/release/app-release.aab`
   - `build/app/outputs/flutter-apk/*release*.apk`
7. Confirm symbols:
   - `build/symbols/<releaseTag>/...`
   - upload symbols via `scripts/sentry_upload_symbols` when Sentry env vars are set
8. Manual pre-upload smoke:
   - app launch, run start, rewarded flow(simulated/real-test), settings/diagnostics open
   - no fatal crashes in `adb logcat`
