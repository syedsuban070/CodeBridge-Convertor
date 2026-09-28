# Interactive program terminal — Android 0.6

Run a program, wait for its prompt, type a line and press Enter or Send. C `scanf`/`getchar`, C++ `cin`/`getline`, and Python `input()` read from this live stream. Multiple prompts keep the same running program and its variables alive. Input is UTF-8; each submitted line includes a newline. Preloaded input is consumed first, then live input starts.

EOF closes stdin for the rest of that run. Stop terminates the worker even if it is waiting for input or stuck in a loop. A new run creates a new stream. Up/Down recalls submitted lines; Ctrl+D sends EOF, Ctrl+C stops. Waiting for a human does not consume the execution timeout. Each resumed computation is limited by the configured run limit. Input lines are limited to 16 KB and total program output to 200 KB.

On Android, the worker makes a synchronous request to the app's private terminal endpoint. The Java input bridge waits for a submitted line on a background request thread and returns UTF-8 JSON; the UI and JavaScript-interface threads stay free. Each run has a random session token. EOF, Stop, a new run and Activity destruction release pending reads. No network server or internet connection is involved. This works when Android WebView does not expose shared memory.

Browser previews use a SharedArrayBuffer/Atomics handshake instead. Only the runtime worker waits. Browser live input requires cross-origin isolation and shared-memory support; otherwise input is preload-only. Python source debugging still requires shared memory on all platforms.

Interactive C/C++ runs link a tiny constructor that makes stdout/stderr unbuffered, so prompts without newlines appear before reads. Python uses a byte writer instead of line-batched stdout. UTF-8 is decoded incrementally.

This is a **line-input program console**, not an Android/Linux shell or full VT terminal emulator. Shell commands, curses/full-screen ANSI applications, raw single-key input, OS APIs and arbitrary native libraries are not supported. The underlying compiler remains Clang 8 targeting WASI/WebAssembly. No claim of universal C/C++ compatibility is made.

## Editor

Normal typing and the touch symbol row pair brackets/quotes; paired closers can be skipped. Enter inside braces creates an indented block. Undo, redo, indent, outdent, reindent, find and select-all are available in the editor action row. Reindent adjusts whitespace according to the editor's language mode; it is not a parser or an automatic logic fix. Settings, zoom and suggestions remain available.

## Regression checks

`node tests/terminal.test.cjs` checks consecutive scanf prompts, C++ getline, Urdu UTF-8 round trips, Python input prompts, EOF, stop/restart while blocked, a compact viewport, touch bracket pairing and nonblocking Bit reactions. Android instrumentation checks the actual WebView input handshake. Existing tests cover compiler errors, libraries, debugging and learning progress.
