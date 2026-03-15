allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Keep compileSdk at 35 while pinning AndroidX artifacts that recently moved to
// API 36 compile requirements. This preserves local/CI builds for the current
// Play-target sprint without changing game logic.
subprojects {
    configurations.configureEach {
        resolutionStrategy {
            force("androidx.core:core:1.16.0")
            force("androidx.core:core-ktx:1.16.0")
            force("androidx.browser:browser:1.8.0")
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
