# Magical Potion Mirror Android App

Android Studio mirror wrapper for the `magical_potion_toss` web game.

## Local flow

1. `pnpm build:android-mirror-web`
2. Open `android-mirror` in Android Studio or run `gradlew.bat installDebug`

The wrapper loads the bundled web build from:

- `https://appassets.androidplatform.net/web/index.html`

This means the web app keeps a stable origin for local storage fallback, even without Toss login.
