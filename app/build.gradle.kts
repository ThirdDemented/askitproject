plugins {
    id("com.android.application")
}

android {
    namespace = "com.thelongwayhome.game"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.thirdemented.longwayhome.release2026"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "1.0.4"
    }

    signingConfigs {
        create("upload") {
            storeFile = rootProject.file("beta.keystore")
            storePassword = "longwayhomebeta"
            keyAlias = "beta"
            keyPassword = "longwayhomebeta"
        }
    }

    buildTypes {
        debug {
            versionNameSuffix = "-debug"
            signingConfig = signingConfigs.getByName("upload")
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("upload")
        }
    }

    bundle {
        language {
            enableSplit = false
        }
    }
}
