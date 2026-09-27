# Third-party notices

CodeBridge application code: MIT (see LICENSE).

- **wasm-clang**, commit `648c4a89997a351eef75cdaec3ef5b89d4937dec`, by WebAssembly Community Group participants: Apache License 2.0 and LLVM licenses. Includes Clang 8.0.1, LLD, memfs and a WASI sysroot. Source: https://github.com/binji/wasm-clang. Full upstream LICENSE and LICENSE.llvm are bundled in `app/vendor/clang`. The app uses a generated adaptation of shared.js that removes one injected output newline; the unmodified source is bundled alongside it. Source and binary checksums are in `scripts/clang-manifest.json`.
- **Pyodide 0.27.7**: MPL-2.0 plus bundled Python/component licenses; package and runtime notices are included. Source: https://github.com/pyodide/pyodide.
- **CPython**: Python Software Foundation license, distributed as part of Pyodide.
- **pycparser 2.22**: BSD-3-Clause. The wheel includes its license metadata. Source: https://github.com/eliben/pycparser.
- **CodeMirror 5.65.21**: MIT. Full license in its bundled package. Source: https://github.com/codemirror/codemirror5.
- **Electron 40.8.4**: MIT plus Chromium and other third-party notices included by the Electron distribution. Source: https://github.com/electron/electron.

No component is represented as original CodeBridge compiler/runtime code. Build tooling and test dependencies retain their respective licenses in npm packages.

## Android 0.5 additions
- Qwen2.5-Coder-0.5B-Instruct-GGUF, Qwen, Apache-2.0. Exact revision and model SHA-256 in docs/OFFLINE_AI.md. License bundled at vendor/licenses/Qwen-Apache-2.0.txt.
- llama.cpp b5046, ggml-org contributors, MIT. License at vendor/licenses/llama-MIT.txt.
- cJSON 1.7.18, Dave Gamble and contributors, MIT. License at vendor/cpp/cjson/LICENSE.
- NumPy 2.0.2, SymPy 1.13.3 and mpmath 1.3.0 distributed in Pyodide-compatible wheels with their original license metadata retained. Package integrity is verified against the pinned Pyodide 0.27.7 lock file.
