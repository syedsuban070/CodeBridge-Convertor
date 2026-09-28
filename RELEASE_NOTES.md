# CodeBridge Android 0.6 — interactive terminal and editor

- Live line input for C scanf/getchar, C++ cin/getline and Python input(), without restarting the program. Prompts display before reads, including prompts without a newline.
- Enter/Send, EOF, Stop, input history, streaming UTF-8 output, responsive terminal input bar, and timeout suspension while waiting for input.
- Touch bracket/quote pairing, brace-block indentation, undo/redo, indent/outdent, reindent, find, select-all and active-line highlighting. Existing zoom and suggestions remain.
- External AI model and native AI runtime removed. Bit uses original scripted guidance, more Roman Urdu jokes, banter replies and angry/laughing/confused animations. Reactions do not interrupt the terminal with a popup; roast mode is optional.
- Existing home, courses, quizzes, quests, local progress, themes and offline libraries retained. Same application ID and beta signing-key cache; install over the previous beta to retain local data. Do not uninstall first. Export progress/projects before changing installations.
- The previous 0.5 release remains unchanged and available separately. An in-place update deletes its obsolete private model copy.

## Scope

Android 8+ with updated Android System WebView. Test-signed beta. The terminal supports line-oriented program input, not a Linux shell or full VT/curses terminal. Android live input uses a native bridge; browser previews require shared memory. Clang 8/WASI limits still apply: OS-specific APIs, networking, threads, C++ exceptions and arbitrary native libraries are not provided. Python includes NumPy, SymPy and mpmath. Conversion remains a documented subset.

Bit is rule-based and scripted, not a trained AI model. No external AI inference or model download is included. See docs/TERMINAL.md for behavior and limits.
