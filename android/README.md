# CodeBridge Android

The Android shell packages the shared editor and all compiler/Python assets. Compilation and execution do not require a server or runtime download.

Run `npm ci` and `python scripts/prepare_assets.py` at the repository root, then build this directory with Gradle 8.9 / JDK 17 / Android SDK 35. `gradle :app:assembleDebug` creates a test-signed APK. The release workflow runs actual emulator tests for offline C++ and Python execution before publishing downloads.

The local HTTPS asset origin is intercepted by Android and served only from APK assets. External URL requests are blocked. The file bridge uses Android's document picker. Android's INTERNET permission enables WebView's local-origin loading; the app has no remote code-execution service.

See the root README for feature limitations. A Play Store release key and store publication are not configured.
