plugins {
    id("com.android.application")
}

android {
    namespace = "com.thelongwayhome.game"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.thirdemented.thelongwayhome"
        minSdk = 26
        targetSdk = 36
        versionCode = 7
        versionName = "1.2.0-alpha.2"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
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
    testBuildType = "release"

    bundle {
        language {
            enableSplit = false
        }
    }
}

dependencies {
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("junit:junit:4.13.2")
}
