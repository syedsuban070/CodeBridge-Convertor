# CodeBridge Android 0.5 — offline AI and power tools

- Real on-device Bit AI: bundled Qwen2.5-Coder 0.5B Q4_K_M running in native llama.cpp. Ask for explanations and small fixes without an account, API key or network connection.
- Fast rule-based compiler/Python error explanations, jump to error, and optional Roman Urdu roast mode (off by default).
- Offline NumPy, SymPy and mpmath for Python; cJSON for C++.
- C/C++ standard and optimization settings, plus compiler warnings.
- Keyword/current-file identifier suggestions, snippets, A+/A− and pinch zoom.
- Existing courses, themes, progress, full-screen editor and separate console remain included.

The AI is a small pretrained third-party model—not a model trained by this project—and can be wrong. It proposes text only; review and test suggestions. Long code is truncated, and responses are limited. The model itself is 491 MB, so this APK is substantially larger. First use copies it to private storage. Prefer 4 GB RAM and allow about 1.2 GB free storage for installation/preparation; actual requirements vary. 64-bit Android only (arm64 and x86_64). Beta test-signed APK.

Compiler compatibility is broader, not universal. Native GUI frameworks, arbitrary OS APIs/native libraries, C++ exceptions and threads remain unsupported by the bundled WebAssembly compiler. Python native package support is limited to bundled compatible packages. Input is supplied before Run. General Android C++ source debugging remains unfinished.

See docs/OFFLINE_AI.md for exact model revision, hashes, licenses, privacy and runtime limits. Existing project/progress keys and the beta signing key are retained.
