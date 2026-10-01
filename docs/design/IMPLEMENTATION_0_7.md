# Implemented 0.7 architecture

The supplied specification is preserved in CODEBRIDGE_0_7.md. This document distinguishes shipped behavior from later architecture work.

## Components

- game/studio.js: execution dock and tool menu. Narrow/short viewports use a bottom sheet.
- game/feedback.js: original 96-frame-per-skin SVG atlases, elapsed-time animation, offscreen/background pause, reduced-motion stills, 64-particle cap and cached PCM audio.
- game/economy.js + learning/progress.js: migration, ledger, purchases, ownership validation, daily claims and schema snapshot.
- game/store.js: preview cards, unlock/equip actions and economy JSON export.
- game/reports.js: repeated-case timings, measurement comparison and after-action cards.
- game/memory.js: instrumented compiled C/C++ exercise, live stepping and bounded snapshots.

## Saves and schema

The existing codebridge.progress.v1 storage key and course model remain compatible. An economy extension is saved in the same JSON document as the coin/XP balances. A single localStorage write commits a transaction; a failed write rolls in-memory state back. Before migrating, the original JSON is copied to codebridge.progress.v1.pre-v2. Progress exports include owned cosmetics, ledger and reports. Local-only data is not tamper-proof.

The supplied schema is implemented as game/economy.schema.json. Store's Export economy JSON produces its schemaVersion:2 envelope. The main .cbprogress backup retains the original course envelope, including its economy extension, to preserve migration compatibility. Snapshot metrics include first_missions_passed and successful_exercise_checks to accurately describe the existing quests rather than relabel repeated checks as distinct missions. The memory quest awards 25 XP/15 coins once per local day after completing the preset. Daily reset uses the device's local calendar; clock manipulation cannot be prevented offline. Legacy claim history is retained and represented by zero-value migration records so existing claims are visible without awarding coins twice.

## Measurements

Each mission test case runs once for warm-up and three more times in isolated workers. Worker-reported elapsed time starts after runtime loading and compilation and ends after execution/flush. The displayed total is the sum of per-case medians, not compile time. Test-suite hash, language/runtime version, user agent and a non-exported installation ID scope comparisons. Short/noisy measurements show no reliable difference. Timings include unavoidable runtime instantiation/host-call overhead. No inferred Big-O score is awarded. General operation-count instrumentation remains unimplemented.

## Memory Lab scope

A bundled source preset emits structured observations from real compiled code, then blocks on the existing native Android input bridge (browser preview: SharedArrayBuffer). Step resumes the same program instance. Snapshots show stack array cells, a pointer write, one heap allocation, unknown initialization state, a write, and a free. The display uses observed Wasm offsets. A numeric address saved before free illustrates a dangling reference without dereferencing freed memory. Trace length is limited by the fixed six-observation preset.

This release does not include a new AST/LibTooling pass for arbitrary source, full pointer alias tracking, C++ object lifetimes, raw native debugging or OS/library support beyond the existing runtime. The original design describes that later work; the product labels this tool as an instrumented preset.

## Assets and verification

prepare_game.py builds three vector atlases and three short WAV cues (mono, 16-bit, 22,050 Hz). JetBrains Mono is pinned to v2.304 and checked against the committed font digest. Assets load locally in the installed APK. Store previews may load additional skins while open; the dashboard uses only the equipped skin.

Tests cover migration, replay and purchase idempotency, insufficient balance, invalid ledger rejection, persistence/reload, storage failure rollback, actual compiled C/C++ memory stepping, repeated-run reports and the existing terminal flows. Android instrumentation additionally checks native-bridge Memory Lab execution and sprite decoding.
