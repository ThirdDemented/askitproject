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
        versionCode = 3
        versionName = "1.1.1-beta1"
    }

    signingConfigs {
        create("beta") {
            storeFile = rootProject.file("beta.keystore")
            storePassword = "longwayhomebeta"
            keyAlias = "beta"
            keyPassword = "longwayhomebeta"
        }
    }

    buildTypes {
        debug {
            versionNameSuffix = "-debug"
            signingConfig = signingConfigs.getByName("beta")
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}
