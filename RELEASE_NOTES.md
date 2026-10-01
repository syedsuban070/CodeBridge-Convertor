# CodeBridge Android 0.7 — animated studio and cosmetic progression

- Compact execution dock: Run becomes Stop while active. Build, Debug, Console, Input and Memory Lab sit in an expandable tool menu with a bottom-sheet fallback on small screens. Save and conversion move into the file menu.
- Offline JetBrains Mono font, Midnight/Night styling and lime accents. Editor, terminal and touch input retain the 0.6 functionality.
- Original four-direction Bit sprite atlases with idle, thinking and celebration clips. Three colour skins, capped canvas particles, and 22,050 Hz 16-bit mono PCM cues for syntax failures, builds and coin claims. Sound remains opt-in; reduced motion is respected.
- Cosmetic store: editor palettes (60 coins), border (100), Bit skins (180). Preview cards, permanent ownership and free switching. No coding tools are paywalled.
- Transaction ledger, idempotent purchases/rewards, pre-migration backup, and atomic balance/ownership saves. Existing missions, drafts, coins and XP are preserved. Economy JSON export and schema included.
- After-Action Reports: first warm-up then three measured executions per test case, with correctness, execution medians and comparisons tied to this installation/runtime/test suite. Compilation and loading excluded. No unsupported Big-O grades; operation counting for general mission code is not implemented.
- Memory Lab prototype: a real compiled C/C++ preset with array cells, pointer writes, heap allocation, free and live stepping. Shows actual Wasm offsets and explicitly identified uninitialized/freed values. Completing the exercise unlocks a daily memory quest.

## Scope and upgrade

Memory Lab supports its bundled instrumented exercise only. Arbitrary user-source instrumentation, C++ object lifetime tracing and general C/C++ source debugging remain future work. The underlying Clang 8/WASI runtime limits from 0.6 remain. Bit is scripted; no external AI model is bundled.

Install over the previous beta to retain local data. Do not uninstall first; export projects/progress as a backup. The application ID and beta signing-key cache are unchanged. Old releases remain available. This is a test-signed beta, not a Play Store release.
