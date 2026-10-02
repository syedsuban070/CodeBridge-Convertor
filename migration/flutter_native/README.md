# Native Flutter migration — foundation only

This directory is **not a Flutter application, an APK, a native compiler port,
or a Rive animation binary**. It contains an executable SQLite schema,
transaction/clock/diagnostic reference behavior, localized data, and the complete
remaining design contract. The current 0.7 app remains unchanged.

## What is verified

Run `python -m unittest discover -s migration/flutter_native/tests -v` from the
repository root. Tests exercise actual SQLite transactions: duplicate purchases,
insufficient funds, ownership-write rollback, reward idempotency, equipment
ownership/category checks, and immutable ledger behavior. Further tests cover
clock jumps, reboot fallback, diagnostic classification, localized dialogue
non-repetition and JSON contract consistency. These are host tests, not device
tests or Flutter tests. They do not certify frame rate, fonts or native execution.

- `schema.sql`: intended DDL for drift's versioned migration.
- `reference.py`: Python standard-library reference for future Dart transaction
  implementation. It is not used by the current app.
- `i18n/`: English, Urdu and Simplified Chinese UI/dialogue samples.
- `bit.machine.json`: Rive authoring contract, **not importable Rive binary data**.
- `catalog.json`: proposed cosmetics; its asset references do not exist yet.
- `DESIGN.md`: remaining phases, component trees, transitions and acceptance gates.
- `release_gate.py`: packaging preflight which currently fails, correctly.

## Observed blockers

At base commit `63dc482127900c08e0edc46f6137700bad5cb98f`:

1. `scripts/prepare_assets.py` prepares wasm-clang and Pyodide. Neither is an
   Android-native Clang/Python package. No Flutter project or `.riv` file exists.
2. This execution workspace has Java and Git, but no Flutter/Dart command,
   Android SDK, Gradle command or emulator. The Flutter release-manifest download
   returned HTTP 404. No Flutter or Android build was run for this migration.
3. Clang 8.0.1 needs a verified Android-host build, linker, matching headers,
   libc++/runtime libraries, licenses and an on-device native execution design.
   The desktop Linux NDK compiler is not an Android-host compiler.
4. Python 3.12 needs an Android native runtime and standard library. Chaquopy
   documents Python 3.12 support, but has not been integrated or tested here.
5. iOS native execution of freshly compiled C/C++ programs is not solved by
   sharing Flutter widgets. Its code-signing/executable-memory constraints are a
   separate blocker. No iOS execution parity is claimed.

Android forbids a simple `execve()` of newly written executables in writable app
storage when targeting API 29+. Packaging Clang into the APK does not itself
solve launching compiler output. Validate a supported native execution approach
without lowering the target SDK to evade platform requirements.

Official references:
- https://developer.android.com/about/versions/10/behavior-changes-10
- https://support.apple.com/guide/security/app-code-signing-process-sec7c917bf14/web
- https://chaquo.com/chaquopy/doc/current/versions.html
- https://docs.flutter.dev/ui/internationalization
- https://docs.flutter.dev/perf/best-practices

## Next implementation gates, in order

1. Prove Android-native Clang 8/Python 3.12 compile/run, streaming terminal input,
   EOF, cancellation and process isolation on a real supported target. Capture
   tool versions, artifact hashes and emulator/physical-device results.
2. Create Flutter host and implement drift transactions against this schema;
   port and run reference tests in Dart, including independent connections.
3. Build the editor, map and locally graded curriculum; author/bundle Rive,
   Lottie, font and sound files with licenses.
4. Implement the explicit 0.7-to-Flutter import, retaining all source data and
   legacy entitlements. Preserve package ID/signing only once in-place migration
   tests prove an existing installation survives.
5. Execute accessibility, offline, keyboard, runtime and performance checks.
6. Only then create a beta APK and publication workflow for the new app.

The existing release workflow is untouched. This branch must not be advertised
as a finished native app or used to overwrite the working 0.7 release.
