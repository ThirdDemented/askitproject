plugins {
    id("com.android.application")
}

android {
    namespace = "com.thelongwayhome.game"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.thelongwayhome.game"
        minSdk = 26
        targetSdk = 36
        versionCode = 10
        versionName = "1.0.0"
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
