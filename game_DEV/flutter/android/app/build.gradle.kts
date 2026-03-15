plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties

val keyProperties = Properties()
val keyPropertiesFile = rootProject.file("key.properties")
if (keyPropertiesFile.exists()) {
    keyProperties.load(keyPropertiesFile.inputStream())
}
val releaseTaskRequested = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}
val requiredSigningKeys = listOf("storeFile", "storePassword", "keyAlias", "keyPassword")
val hasSigningFields = requiredSigningKeys.all { key ->
    (keyProperties[key] as String?)?.trim()?.isNotEmpty() == true
}
val releaseStoreFile = if (hasSigningFields) {
    rootProject.file((keyProperties["storeFile"] as String).trim())
} else {
    null
}
val hasReleaseSigningConfig =
    keyPropertiesFile.exists() && hasSigningFields && releaseStoreFile?.exists() == true

android {
    namespace = "com.example.gamedev"
    // Play policy readiness: lock compileSdk/targetSdk to 35.
    compileSdk = 35
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.gamedev"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        // Keep targetSdk at 35 for current Play requirements.
        targetSdk = 35
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasReleaseSigningConfig) {
            create("release") {
                keyAlias = keyProperties["keyAlias"] as String?
                keyPassword = keyProperties["keyPassword"] as String?
                storeFile = releaseStoreFile
                storePassword = keyProperties["storePassword"] as String?
            }
        }
    }

    buildTypes {
        release {
            if (hasReleaseSigningConfig) {
                signingConfig = signingConfigs.getByName("release")
            } else if (releaseTaskRequested) {
                throw GradleException(
                    "Release signing config missing. Add android/key.properties " +
                        "and a valid keystore file (see android/key.properties.example).",
                )
            }
        }
    }
}

flutter {
    source = "../.."
}
