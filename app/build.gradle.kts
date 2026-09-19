plugins {
    id("com.android.application")
}

android {
    namespace = "com.thelongwayhome.game"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.thelongwayhome.game"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0-beta1"
    }

    buildTypes {
        debug {
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}
