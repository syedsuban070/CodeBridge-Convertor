plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.chaquo.python")
}
android {
    namespace = "com.codebridge.codebridge_native"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    defaultConfig {
        applicationId = "com.codebridge.codebridge_native"
        minSdk = 26
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        ndk { abiFilters.addAll(listOf("arm64-v8a", "x86_64")) }
    }
    packaging { jniLibs { useLegacyPackaging = true; keepDebugSymbols.add("**/libclang8.so"); keepDebugSymbols.add("**/liblld8.so"); keepDebugSymbols.add("**/libcb_runner.so") } }
    buildTypes { release { signingConfig = signingConfigs.getByName("debug") } }
}
chaquopy { defaultConfig { version = "3.12" } }
flutter { source = "../.." }

dependencies {
 // Match Flutter integration_test on both runtime and instrumented-test graphs.
 debugImplementation("androidx.test:runner:1.6.2")
 debugImplementation("androidx.test.ext:junit:1.2.1")
 androidTestImplementation("androidx.test:runner:1.6.2")
 androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
