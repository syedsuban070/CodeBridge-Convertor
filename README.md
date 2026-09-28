# CodeBridge Android — Learn, build, explore

**Android 0.6:** interactive terminal input for `scanf`, `cin`/`getline` and Python `input()`, streamed UTF-8 output, mobile bracket pairing, editor actions, and original scripted Bit reactions. The external AI model and native inference engine have been removed. NumPy, SymPy, mpmath, cJSON, courses, quizzes and local progress remain. [Terminal guide](docs/TERMINAL.md).

**Android 0.4:** full-screen editor and separate console, persistent app/editor themes, coding preferences, animated Bit companion, optional reward sounds, and accessible motion controls. Open Settings from the top-right sliders button. [Release notes](RELEASE_NOTES.md).

Android is the active development target as of 0.3. The new Home, Learn, Code, Quests and Profile sections include 33 offline missions across C, C++ and Python, executable challenges, XP levels, daily rewards, badges, saved drafts and progress backups. [Learning guide](docs/ANDROID_LEARNING.md).

Download the Android APK from [Releases](https://github.com/syedsuban070/CodeBridge-Convertor/releases). Windows and macOS 0.2 remain available as legacy builds; new releases are Android only.

# CodeBridge Studio

**An offline C, C++ and Python workspace for Android, Windows and macOS.**

[Download builds](https://github.com/syedsuban070/CodeBridge-Convertor/releases) · [Build & test](https://github.com/syedsuban070/CodeBridge-Convertor/actions/workflows/release.yml) · [Supported features](docs/FEATURES.md)

CodeBridge bundles **real Clang + LLD** and **Python**, so supported programs compile and run on the device without an account, server, API key, or separate runtime download. C/C++ programs target WebAssembly. This is an Android beta; it is not a replacement for every capability of a native desktop IDE.

## What works

- Syntax-highlighted editor with line numbers, bracket completion, search, mobile symbol keys and configurable font size.
- Project files, C/C++ headers, multiple translation units, tabs, autosave, file import/export and `.cbproj` project exports.
- Offline C11/C++17 compilation and execution using Clang 8.0.1, LLD, libc and libc++. Includes classes, functions, pointers, arrays, vectors and algorithms supported by the bundled WASI runtime.
- Offline Python 3.12 and standard-library execution via Pyodide.
- Compiler diagnostics, live terminal input, optional preloaded input, cancellation and execution time limits.
- Python source debugging: breakpoints, paused variables, stack and stepping on platforms exposing shared memory.
- Desktop native C/C++ debugging through an **installed** Clang/G++ and GDB/LLDB toolchain. Native debugger output appears in Build Log.
- Conversion of the documented limited C/C++ subset into Python, entirely offline. Unsupported constructs report an error and preserve the original source.

## Install

Get a matching package from [Releases](https://github.com/syedsuban070/CodeBridge-Convertor/releases).

| Device | Package | Notes |
| --- | --- | --- |
| Android 8+ | `CodeBridge-0.6.0-Android.apk` | Test-signed APK. Use an updated Android System WebView. Older preview installs may need uninstalling if Android reports a signing mismatch; export projects first. |
| Windows x64 | `…win-x64-setup.exe` or `…win-x64-portable.exe` | Installer or portable executable. The unsigned beta may trigger Windows reputation prompts. |
| Mac with Apple silicon | `…mac-arm64.dmg` | Unsigned beta; macOS may require approval under Privacy & Security. |
| Mac with Intel processor | `…mac-x64.dmg` | Same unsigned-beta limitation. |

The downloads are generated only when compiler, UI and platform tests pass. The release page includes SHA-256 checksums. These builds are not published to Play Store or Microsoft/Mac app stores.

## Use

1. Open CodeBridge and run the included C++ example.
2. Use **••• → Open files** or create project files with **+**. On desktop, **Open folder** imports a project and **Save project to folder** writes changes back.
3. Press **Run**. When your program requests input, type in the terminal and press **Send / Enter**. Use **EOF** to end the input stream; **Stop** ends the program. **Preload input** remains available for repeatable tests.
4. Use **Build** to check C/C++ code, **Run** to execute, and **Stop** to end a busy program.
5. Open a Python file, click the gutter for breakpoints, then **Debug**. C/C++ native debugging is desktop-only and needs installed native tools.
6. Use **→ Python** to try conversion of a supported C/C++ file. Always test the generated code.

C/C++ source files in a project are linked together. Keep only one `main` in a C/C++ project. Program-created files live in the run's virtual filesystem and are not automatically exported.

## Limits that matter

- The bundled C/C++ toolchain targets WASI/WebAssembly, not native Windows/macOS/Android executables. OS-specific APIs, networking, threads and C++ exceptions are not provided by this runtime. It is Clang 8, not the latest Clang.
- Android has no arbitrary C/C++ source debugger. **C/C++ learning trace** is a separate, limited interpreter with replayed steps. It is explicitly labeled and never substituted for the real compiler.
- Android live input uses the built-in native input bridge and does not require shared memory. Browser live input and Python source debugging require `SharedArrayBuffer`; otherwise browser input is preload-only.
- NumPy, SymPy and mpmath are bundled. Arbitrary native Python package installation is not included.
- The converter is a conservative prototype, not a guarantee of identical behavior for arbitrary C/C++. See [conversion scope](docs/FEATURES.md).
- Desktop native debugging executes locally with the current user's privileges. Run code you trust in that mode.

## Build from source

Requirements: Node 22, Python 3.12. Android additionally needs JDK 17, Gradle 8.9, and Android SDK 35. Desktop packaging should run on the target OS.

```sh
npm ci
python scripts/prepare_assets.py
python scripts/prepare_power.py
npm test
npm start
```

`prepare_assets.py` verifies a pinned Clang toolchain by SHA-256, copies pinned CodeMirror/Pyodide packages, downloads the pinned pure-Python parser wheel and generates Android assets. Downloads occur **at build time**, not on the installed app's first run. Generated runtime binaries are not committed to Git.

```sh
# Desktop package
npm run dist
# Browser UI tests
npx playwright install chromium
npm run test:ui
node tests/terminal.test.cjs
# Android APK
cd android
gradle :app:assembleDebug
```

## Repository

- `app/`: shared editor and worker runtimes.
- `desktop/`: Electron shell, local asset server, file dialogs and native debugger bridge.
- `android/`: Android WebView shell, document-picker bridge and emulator tests.
- `converter/`, `vscode-extension/`: original converter and optional VS Code integration.
- `scripts/`: reproducible runtime preparation.
- `.github/workflows/release.yml`: test, build and publication pipeline.

CodeBridge code is MIT licensed. Bundled dependencies keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Compiler binaries are Apache-2.0/LLVM licensed. No telemetry or external source-code upload is implemented.
