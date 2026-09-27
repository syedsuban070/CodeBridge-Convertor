# CodeBridge Android 0.3 — learning adventures

Android-only update. Existing Windows and macOS 0.2 downloads remain available; this release does not build new desktop packages.

## New
- Home dashboard, persistent bottom navigation, redesigned mobile cards and coding workspace.
- Three offline learning paths: C, C++, Python. 33 missions in Foundations, Explorer and Advanced chapters.
- Each mission includes an explanation, worked example, conceptual quiz, saved code draft, and real compiler/interpreter checks.
- Sequential unlocks, XP levels, badges, coins, daily reward, three daily quests, and a rotating practice challenge.
- Local progress and drafts, with export/restore using .cbprogress backups. Existing coding projects are preserved.

## Runtime
Real offline Clang C11/C++17 compilation to WebAssembly, bundled Python 3.12, project files, standard input/output, and Python debugging remain available. Course exercises use the same runtimes as the coding workspace.

## Known limits
This is a beta, not universal program compatibility. Native GUI frameworks, OS-specific APIs, threads, arbitrary native libraries and C++ exceptions are outside the bundled C/C++ runtime. Python native packages, subprocesses and networking are not generally supported. Input is supplied before execution; execution times out after 30 seconds. Runtime-created files are temporary. General Android C++ source debugging and universal conversion to Python remain unfinished.

Exercise checks compare normalized output for specific inputs; they do not enforce a particular algorithm or prove correctness for all inputs. Advanced chapters introduce advanced topics; they are not exhaustive language courses. Reference solutions are intentionally available for learning.

Progress and daily rewards use the local device clock, with no online anti-cheat. Coins have no monetary value. Export backups before clearing app data or uninstalling. The APK is test-signed with the retained beta signing key; install over 0.2 to keep data where signatures match.
