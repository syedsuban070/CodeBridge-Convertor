# CodeBridge 0.7.1 — the original app, extended

This is an update to the original CodeBridge 0.7 Android app, not the separate Flutter preview. The home screen, five-tab navigation, Midnight/Night palettes, editor, terminal, Bit sprites and store remain.

## Added

- Six stage-final Memory Lab bosses (39 missions total), 200 XP each and earned badges. Output cases plus checked-arena allocation, bounds, stale-handle and release checks. Practice remains separate and ungraded.
- English, Urdu and Simplified Chinese interface selection, saved locally, with bundled Nastaliq/CJK fonts. Code and terminal stay LTR. Lessons and advanced explanatory text remain English; this is not a fully translated curriculum.
- Two-finger editor font zoom, optional focus mode, keyboard-aware editing actions, and Snippets in the overflow menu. The familiar layout remains the default.
- Local, non-repeating Bit reaction dialogue, stage reward animation and short reduced-motion-aware splash.
- Daily coin protection using Android monotonic time and boot identity. Clock jumps cannot grant extra coins; after reboot, unverified downtime is not counted.

## Verified installation warning

The published 0.7.1-beta.15 APK passed Android and UI tests, but its signing certificate differs from 0.7.0-beta.14. The CI log confirms that the signing-key cache was missing and was not saved. **This APK cannot install directly over that 0.7 release.** Do not uninstall before exporting your data.

In 0.7, export the workspace using Code → menu → Export project, and export learning data using Profile → Export progress & lesson drafts. Keep those backup files outside app storage. Only after preserving your backups, replace the old app and restore the project and learning backup in 0.7.1. Settings may need to be selected again. A retained signing key is required for seamless future updates.

[Download CodeBridge 0.7.1 APK](https://github.com/syedsuban070/CodeBridge-Convertor/releases/download/v0.7.1-beta.15/CodeBridge-0.7.1-Android.apk)

## Update compatibility

Application ID remains `com.codebridge.mobile`; version code increases from 7 to 8. All project/settings/progress storage keys are retained, but the intended signing-key cache did not survive; see the verified warning above. Existing completed missions remain accessible when new bosses are inserted. Export projects/progress before installing; do not uninstall 0.7 to update. If Android reports a signature mismatch, keep the installed app and your data.

This remains a test-signed beta using 0.7's offline WebView/Wasm Clang 8 and Python 3.12 runtimes, including live terminal input. It does not use Flutter. The bundled checked arena is an educational grader, not general malloc/new leak detection. Native OS libraries and C++ exceptions retain the original runtime limitations. There are no cloud execution services or analytics.

CI validates original UI/runtime regressions, save compatibility, language switching, reward clocks, bosses, and Android offline runtime/input flows before publishing the APK.
