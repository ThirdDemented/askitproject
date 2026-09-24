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
        versionCode = 4
        versionName = "1.0.5"
    }

    signingConfigs {
        create("upload") {
            val signingPath = System.getenv("LWH_KEYSTORE")
            if (signingPath != null) storeFile = file(signingPath)
            storePassword = System.getenv("LWH_KEY_PASSWORD")
            keyAlias = "upload"
            keyPassword = System.getenv("LWH_KEY_PASSWORD")
            storeType = "PKCS12"
        }
    }

    buildTypes {
        debug {
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("upload")
        }
    }

    buildFeatures { buildConfig = true }

    bundle {
        language {
            enableSplit = false
        }
    }
}
