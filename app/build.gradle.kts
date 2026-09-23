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
        versionCode = 11
        versionName = "1.0.1"
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
