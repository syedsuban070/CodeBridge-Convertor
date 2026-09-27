# CodeBridge Android 0.4 — your coding space

## New
- Full-height coding workspace. Run, Build, Debug, Console and Input open a dedicated console screen; return with the Editor button or Android Back.
- Persistent settings: four app themes (Midnight, Forest, Violet, Paper), four independent editor palettes (Night, Ocean, Plum, Day), font sizes, indentation, wrapping, line numbers, automatic brackets, and 30/60/120-second workspace limits.
- Bit, an original SVG coding companion with floating and blinking animation.
- Celebration particles and optional synthesized reward sounds. Sounds default off; animations respect reduced-motion preferences and can be disabled.
- Input text persists across restarts. Keyboard-aware navigation makes more room for typing.
- Android Back closes settings, dialogs, or the console before leaving the app.

The three offline learning paths, 33 missions, progress backups, daily quests and offline Clang/Python runtimes remain included. Existing workspace and learning data retain their storage keys. This release builds Android only.

## Compatibility and beta notes
This is not universal program compatibility. C11/C++17 console programs compile to WebAssembly using the bundled Clang/libc/libc++ toolchain. Native GUI frameworks, OS-specific APIs, threads, arbitrary native libraries and C++ exceptions are outside this runtime. Python 3.12 standard-library programs and local modules work within Pyodide's platform constraints; arbitrary native packages, subprocesses and networking are not generally supported.

Input is supplied before execution. Workspace runs default to 30 seconds (configurable up to 120); lesson checks remain capped at 30 seconds. Generated runtime files are temporary. General Android C++ source debugging and universal conversion to Python remain unfinished. Lesson checks verify sample behavior, not a required algorithm or all possible inputs.

Daily rewards use your device clock. Progress and settings are local. Export code projects and progress backups before uninstalling or clearing data. The APK retains the beta test signing key; it is not a Play Store production release.
