# CodeBridge Mobile Preview

This is a real Android application project. It provides offline C/C++ source editing, file import/export through the Android document picker, a bounded **learning subset interpreter**, program output, and execution trace stepping. It does **not** include Clang/GCC, GDB, a Python runtime, or the desktop converter. The interface labels the execution command “Run subset.” Arbitrary C/C++ programs cannot be compiled here.

Open `android/` in Android Studio and build a debug APK, or download `CodeBridge-Mobile-debug` from the repository's **Actions → Android APK** run. The debug APK is signed with the standard debug key for testing, not a Play Store release key. Install only builds from this repository's Actions page.

The next milestone is to package a licensed offline compiler/runtime and a real debug adapter with resource isolation. Do not present this preview as a full C/C++ compiler or debugger.
