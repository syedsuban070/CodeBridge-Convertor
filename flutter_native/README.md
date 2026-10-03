# CodeBridge native migration preview

Flutter 3.35.5, bundled Rive, drift/SQLite, native Clang/LLD 8.0.1 and
Chaquopy Python 3.12. Build downloads are confined to CI; installed app has
no INTERNET permission. Native programs run in child processes of a separate
Android runtime service. This is crash separation, not a hostile-code sandbox.

## Release validation gates

The initial APK passed `flutter analyze`, `flutter test`, and package contents/permissions checks. Android
instrumentation exercising Python 3.12, C compiled by Clang 8, and C++17 optional
and vector remains a required gate; the first attempt was blocked by a test-library version conflict. Source archives and fonts retain licenses. Native binaries are
built from pinned LLVM release hashes and checked against artifact hashes.

Cosmetics now have transactional purchase/equip controls, localized catalog names,
and bundled terminal, syntax, and Bit tint assets.

## Preview limitations — not a completed 0.8 release

- Live terminal input and full curriculum translation remain.
- Memory Lab bosses check only the explicitly documented cb_* arena API. This is
  not ASan/LSan: arbitrary raw-pointer accesses and malloc/new leaks are not graded.
- Debug currently builds unoptimized code with symbols; no interactive debugger.
- The Memory Lab toolbar opens ungraded practice; stage-final boss submissions
  record attempts and award XP and badges only after all local cases pass.
- Pinch gestures, keyboard transitions and low-end 60 fps need device profiling.
- Existing WebView progress import and release signing are not implemented. This
  preview has a separate application ID and does not overwrite the 0.7 app.
- Android ARM64 and x86_64 are bundled. iOS runtime execution is not implemented.
- Generated shared programs load through a bundled native launcher; execution on
  each supported Android/API/ABI must pass device tests before final release.
- Daily rewards use Android elapsedRealtime on the same boot; after reboot only
  subsequently observed monotonic elapsed time accrues. No offline clock scheme
  can prevent tampering by a rooted user; wall-clock jumps never mint coins.

Never label this preview as satisfying every final-release requirement.

Bundled stroke-draw splash, one-shot Lottie reward effects, and six checked-arena
Memory Lab bosses are included in the source update. These additions require
Flutter CI and device verification before being described as release-ready.
