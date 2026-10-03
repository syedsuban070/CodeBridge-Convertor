# CodeBridge 0.8.0 native Flutter preview

This preview is a separate Android application (`com.codebridge.codebridge_native`)
and does not replace the 0.7 WebView application or import its saved progress.
It is signed with the build's debug key, not a stable production signing key.

[Download the APK ZIP](https://github.com/syedsuban070/CodeBridge-Convertor/actions/runs/37087884658/artifacts/11261910000),
then extract and install `app-release.apk`. GitHub sign-in is required for the
Actions artifact download. The artifact expires on 2027-01-01.

APK source commit: `7cfd3839443bae96de675dfabd94c85cd3eeef07`.
[Build and Android verification](https://github.com/syedsuban070/CodeBridge-Convertor/actions/runs/37087884658).

## Verification status

The Android API 29 x86-64 instrumentation test passed for Python 3.12 with
stdin, Clang 8 C with stdin, and C++17 vector/optional plus throw/catch.
Flutter analysis, host tests and the release offline-package check also passed.
Bit animation integration verification timed out while connecting to the test
process. Commit `dec8132d43f4eb51ae54ed981a8d01811924cbe8` restores the debug-only
Flutter VM-service permission; its follow-up build is pending. The downloadable
release APK has no Internet permission. ARM64 is bundled but not device-tested.

## Included

- Flutter editor and stage map; drift/SQLite saves, progression and cosmetic ledger.
- Native Clang/LLD 8.0.1 with C++17 and embedded Python 3.12.
- ARM64 and x86-64 binaries, headers, C++ standard library and NDK unwinding archives.
- Bundled English, Urdu and Simplified Chinese JSON, fonts, Rive Bit and Lottie effects.
- Six C/C++ stage-final checked-arena Memory Lab bosses and ungraded practice.
- No Internet permission or runtime download. GitHub downloads occur during builds only.

## Packaging fixes

Compiler debug sections are explicitly removed from packaged copies, retaining
the original checksum-verified compiler artifacts. A size/ELF-section gate rejects
debug bloat. The Clang executables now occupy approximately 56 MB (ARM64) and
65 MB (x86-64), compared with roughly 1.34 GB each before stripping.

NDK 20's `libgcc.a` linker script and companion archives are bundled together.
Compressed debug sections in the archive members are stripped at build time,
because the on-device LLD 8 build does not include zlib. Symbol tables and unwind
data are retained; the Android test exercises a C++ throw/catch round trip.
The custom linker invocation emits `--eh-frame-hdr`, matching Clang 8's driver,
so the unwinder can discover exception frames in a loaded user program.
The toolchain extraction marker is versioned so previously installed previews
receive the added runtime libraries on upgrade.

## Remaining release work

- ARM64 phone execution and low-end frame-time/keyboard/gesture profiling.
- Stable signing, progress import and a tested save-data migration strategy.
- Full curriculum/UI translation, live terminal input, and an interactive debugger.
- The editor tool chooser currently opens vertically; the specified radial layout remains.
- Runtime diagnostic classification needs the complete structured error mapping in the design.
- iOS native compiler/interpreter execution is not implemented.

Memory Lab checks only the documented `cb_*` allocation API. It does not detect
arbitrary raw-pointer errors or `malloc`/`new` leaks and is not ASan/LSan.
The runtime service separates execution from the UI process but shares the app's
UID; it is not a security sandbox for hostile code.

This preview does not satisfy every final-release requirement.
