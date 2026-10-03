# CodeBridge native Flutter design contract

Status: proposed UI/runtime integration; executable persistence reference only.
All runtime assets must be bundled. No accounts, APIs, analytics, sync, remote
code execution or downloaded first-run packages. Build-time dependency retrieval
is allowed; installed-app networking is not.

## Phase 1: onboarding and progression

Assumptions: one local profile; `zh-Hans` Chinese; Urdu RTL; no automatic native
runtime parity across Android/iOS; no legacy-save deletion.

Use Flutter, Rive, one-shot Lottie and drift with bundled JSON. Splash draws
purpose-built SVG centerline contours using cached PathMetrics: stroke 850ms,
settle 150ms, destination crossfade 180ms, easeInOutCubic. Reveal cumulative path
length, not each contour simultaneously. Reduced motion shows a still image.
Initialize storage/localization concurrently; display retry on failure. Never
wipe data to make startup succeed.

Flow: language -> coding track -> experience -> first exercise -> map. Persist
each step. Show native language names using their own fonts before selection.
Bundle Noto Sans, Noto Nastaliq Urdu, Noto Sans SC and JetBrains Mono plus licenses.
App strings come from a custom JSON LocalizationsDelegate; Flutter SDK widget
localizations remain bundled. Urdu uses RTL directional padding, dynamic label
height and generous line metrics. Code remains LTR. No bidi controls are inserted
into source. Validate actual font shaping/diacritics and Chinese glyph coverage.

Nodes have radius 30dp, minimum 48dp hit target, 144dp vertical spacing increased
for text scaling. For viewport W, A=max(0,min(72,W/2-54)); x_i=W/2+A*sin(i*pi/2).
For adjacent nodes separated by H: P0=(x_i,y_i), P1=(x_i,y_i+H/2),
P2=(x_next,y_next-H/2), P3=(x_next,y_next). Paint cubic Bezier B(t) with these
control points. Cache geometry per width/text-scale/content version.

Locked nodes are gray/padlocked, unlocked lime/play, mastered gold/checkmark.
Only the current node pulses (scale 1 to 1.04 to 1, 1600ms). Unlock burst uses
one bundled Lottie (450ms, ~20 particles). Commit unlock before VFX; deduplicate
visual events. Mastery persists through failed replays. Every C/C++ stage ends
in a memory_boss; Python stages end in a Python challenge.

Three decorative parallax layers translate by -scrollOffset*k with k=.08,.20,.35.
Nodes scroll at 1.0. Pause off-screen and backgrounded animations. One visible
Bit, one pulse and one VFX max. Reduced motion disables parallax. Profile 60fps
on a physical 2GB/60Hz Android device: UI/raster each <8ms p95, missed frames <1%
over 60 seconds, decoded map visuals <=24MiB. These are targets, not measurements.

## Phase 2: editor and Flutter widget trees

Assumptions: editor supports custom gesture recognizers and source offsets;
software keyboard metrics arrive asynchronously; hardware keyboards are supported;
practice never awards boss mastery; runtime output is streamed independently.

Choose a full-screen editor with inset-aware overlays because it preserves source
space while keeping Run/Stop reachable. No AppBar. SafeArea protects cutouts.
The top-right overflow contains Save, Snippets, file actions and settings. Editor
content gets a 56dp trailing gutter so this menu cannot obscure source.

### Proposed LevelMap widget tree

```dart
// Structural notation, not compilable implementation.
MaterialApp(localizationsDelegates: bundledDelegates)
  Directionality(localeDirection)
    Scaffold
      SafeArea
        Stack
          IgnorePointer(ParallaxBackgroundPainter)
          CustomScrollView(controller: mapScroll)
            SliverToBoxAdapter(TrackHeader)
            SliverList.builder
              StageSection
                Semantics(StageTitle)
                Stack
                  RepaintBoundary(CustomPaint(BezierConnectorPainter))
                  NodeTileList
                    Semantics(button: true, label: localizedNodeStatus)
                      FocusTraversalOrder
                        LevelNodeButton
          Positioned(CurrentNodeBitAnchor)
            RepaintBoundary(BitStage)
          IgnorePointer(OneShotUnlockVfx)
          AccessibleStatusAnnouncement
```

Cache only visible stage sections plus one section ahead. Avoid a single giant
canvas/list with every node alive. Semantic order follows node ordinal, not
physical x-coordinate. Locked nodes announce prerequisites when tapped.

### Proposed Editor widget tree

```dart
MaterialApp
  Scaffold(resizeToAvoidBottomInset: false)
    SafeArea
      LayoutBuilder
        Stack
          Positioned.fill(bottom: keyboardInset)
            Directionality(TextDirection.ltr)
              EditorViewport
                SyntaxTextController
                SelectionOverlay
                DiagnosticGutter
          Positioned(top: 8, right: 8)
            EditorOverflowButton
          Positioned(bottom: keyboardInset)
            KeyboardActionDock(Undo, Redo, Indent, Outdent)
          Positioned(bottom: clusterBottom, right: 12)
            ExecutionCluster
              ToolsFab
                RadialToolsOverlay(Build, Debug, MemoryLabPractice)
              RunStopFab
          TerminalRouteLauncher
          AccessibleExecutionStatus
```

Use one source of keyboard avoidance: Scaffold does NOT resize; custom layout
subtracts MediaQuery.viewInsets.bottom exactly once. Cluster bottom is keyboard
inset + toolbar height (when visible) + 12dp. SafeArea already removes system
bottom padding: do not add it a second time. Run FAB is 56dp lime; Tools FAB has a
48dp touch target and dark face. Stop replaces Run immediately during execution.

Reserve trailing 76dp content gutter and bottom scroll padding equal to cluster
height+16dp. At each caret move, reveal the caret above keyboard/dock and outside
the overlay's exclusion rectangle. If the usable pane is <240dp high, reduce
cluster spacing and close secondary tools; never shrink hit targets or hide Stop.

Tools open a labelled inward-facing quarter-circle of radius 92dp, 160ms easeOutCubic.
Before placement, check each 48dp target against safe rectangle and selection
handles. If it cannot fit, show the same actions in an anchored vertical panel.
Back closes tools first. Focus remains in editor. No action is icon-only for
screen readers. Memory Lab opens ungraded practice; the stage boss is a separate
route with separate attempt/reward identifiers.

Typing mode = editorFocus.hasFocus && viewInsets.bottom > 0. Animate dock upward
8dp plus opacity over 160ms easeOutCubic; hide over 100ms. Follow OS keyboard inset
without a competing long animation. Reduced motion swaps immediately. During
keyboard transition, coalesce metric updates per frame and delay a zero-inset
hide by 80ms only if focus remains; blur always hides immediately. This prevents
keyboard suggestion/IME flicker without a delayed floating toolbar. Hardware
keyboard shortcuts remain available when dock is hidden.

Pinch uses exactly two pointers, a 6% scale threshold, and ignores streams begun
on selection handles. One finger scrolls, long press selects; recognizer does not
claim single-pointer gestures. Once a pinch wins, freeze selection/scroll and
anchor the document offset under the focal point while relayout occurs. Snapshot
startSize; size=clamp(startSize*scale,11,28). Persist on gesture end; cancelled
gesture restores start size. Explicit accessibility zoom actions and keyboard
shortcuts provide alternatives. Do not accumulate multiplicative deltas each frame.

Terminal is a dedicated route with selectable LTR output, separate stdin composer,
Enter, EOF and Stop. stdin sends only while the current run is accepting input.
No shell command concatenation. Keep runId on every event; discard old-run output.
Use a bounded output buffer and incremental UTF-8 decoder. Preserve whitespace.
Measure compute time separately from user-input waiting. Keyboard never overlays
the input composer. Returning to the editor does not secretly start another run.

## Phase 3: Bit

Assumptions: Rive authoring is still required; JSON is a contract, not a .riv file;
process adapter provides structured phase/status/signal; user programs can print
misleading messages; all dialogue is local and code-directed.

`bit.machine.json` lists bool/trigger/number inputs, seven states, durations,
transition blends, interruption priorities and dialogue bindings. The Flutter
host handles deduplication and dialogue; Rive handles motion. Locale changes
update text without recreating the whole artboard.

| Source | Event | Destination | Blend / duration |
|---|---|---|---|
| Any visible | pythonSyntax | PythonSyntaxError | 120ms / 1000ms |
| Any visible | compileFailed | CppCompileFailed | 120ms / 1100ms |
| Any visible | success | Success | 120ms / 1000ms |
| Any visible | memoryWarning | MemoryLabWarning | 120ms / 1300ms |
| Any visible | bossPass | BossPass | 120ms / 1500ms |
| Any visible | bossFail | BossFailRoast | 120ms / 1300ms |
| Non-idle | animationComplete | IdleOnPath | 160ms / 1800ms loop |

The CppCompileFailed red-eye animation is reused for runtime memory faults with
MemoryFault dialogue. A segmentation fault is NOT a compiler error. Do not use
“Are you even trying” dialogue, which targets the learner rather than the code.

| Local result | Trigger / dialogue |
|---|---|
| Compiler exits nonzero with normal diagnostic status | compileFailed / CppCompileFailed |
| Compiler itself crashes or runtime fails to start | neutral tool failure; no roast |
| Python final SyntaxError summary says expected ':' | pythonSyntax / colon-specific line eligible |
| Other Python SyntaxError | pythonSyntax / generic lines; exclude colon line |
| IndentationError or TabError | pythonSyntax / generic syntax line plus exact diagnostic |
| Run terminated by structured SIGSEGV | compileFailed animation / MemoryFault |
| Exit 139 without confirmed signal | generic runtime error; do not assume SIGSEGV |
| Build succeeds | success / compile-success line |
| Run succeeds | success / run-specific status; do not claim tests passed |
| Local test grader passes | success / tests-passed line eligible |
| User Stop | quiet cancellation; no failure penalty |
| Timeout | neutral limit explanation; not syntax error |
| Boss grader result | bossPass or bossFail |

Set compiler diagnostic locale to C for stable parsing where supported. Python
host should supply exception type/location directly when available. Otherwise
anchor stderr patterns to the final exception summary; never scan stdout for
“Error”. Raw stderr is user-visible but untrusted. Classification is a hint, not
proof: programs can write fake traceback text. Require runId and structured
return status for all transitions. `reference.py` implements the base classifier;
Flutter event bridge and eligibility-filtered dialogue binding remain pending.

Dialogue pools in en/ur/zh-Hans have >=3 variants for each requested state. Filter
by eligibility first (colon/build/test-specific messages), then exclude the last
line ID for that state/locale. Use a shuffled bag or local RNG. Persist line IDs,
not translated strings. If only one eligible line remains, repetition is allowed
rather than selecting an inaccurate joke. Speech is omitted: it would require
additional guaranteed-offline voice assets and adds no required functionality.

## Phase 4: economy, bosses and release checks

Assumptions: coins buy cosmetics only; offline clocks are not tamper-proof;
untrusted programs cannot access the app database; mastery is grader-produced;
Clang instrumentation libraries cannot be assumed present merely from a version.

`schema.sql` contains settings, progression, attempts, coins/XP ledger, ownership,
equipment, badges and clock state. Drift transactions serialize writes. The
wallet view derives balances from the immutable ledger; there is no separate
balance counter to drift out of sync. Purchase reads the catalog price, checks
prerequisites, writes debit+ownership+visual event atomically. Duplicate ownership
is a no-op. SQL additionally prevents negative balances and wrong-category equip.

`catalog.json` supplies localized names, type, price, rarity and asset references.
Ownership is always derived from SQLite, not trusted from bundled JSON. Use locked,
available, owned and equipped as UI states. Starter items are granted with one
idempotent zero-value migration transaction. Proposed prices: syntax palette 60,
terminal theme 80, chassis skin 180. Core execution and lessons are never gated.

### Daily coins

Choose one claim of 20 coins per verified 24-hour interval, capped at one pending
claim, because an offline calendar date is not trustworthy. The product label is
“Daily coins — available after 24 hours”, not a midnight-reset promise.

On Android sample elapsedRealtime (includes deep sleep), boot identity and wall
time; iOS adapter must provide equivalent suspend-inclusive uptime/reset identity.
Do not use Dart process Stopwatch across relaunches. On the same boot, accrue only
nonnegative monotonic deltas. Wall/monotonic discrepancy >5 minutes or rollback
>2 minutes marks clock suspect but never adds reward time. Cap accrual at 24h.

After reboot or unverifiable boot identity, preserve previously verified accrual,
discard the unverified gap, and establish a fresh baseline. State this transparently
in the reward screen. Suspect wall time does not lock the learner out; verified
uptime still earns coins. No catch-up rewards. Claim atomically inserts a unique
sequence ledger entry and resets accrual. Store observations on resume, pause and
periodically; rewards need no background service. Rooted devices, restore of old
backups and manual database edits cannot be fully prevented offline.

### Memory Lab boss

Final C/C++ node flow: warning -> challenge brief -> editor -> local grading ->
pass chest or fail report -> retry. Graded entry requires all stage prerequisites.
Practice is unlimited, gives hints and no stage rewards. Boss retries are unlimited,
free and preserve code; failure never removes coins or XP.

Pass requires all deterministic test cases passing, normal exit, zero tracked
invalid accesses, zero tracked live heap allocations at end, and no resource limit
breach. Grader-generated evidence must be out of band, not parsed from stdout.
A learner must not be able to print a fake “no leaks” line to pass.

Clang 8 supports AddressSanitizer instrumentation, but Android compiler-rt ABI,
linking, shadow-memory behavior and process launch must be bundled and tested.
Do not promise LeakSanitizer for every Android ABI. Do not claim a plain malloc
wrapper detects arbitrary invalid accesses: it cannot see every load/store.

Choose an AST-instrumented, restricted memory curriculum for the first boss:
validate the allowed AST, reject unsupported constructs with a neutral explanation,
insert access/allocation/lifetime hooks without changing evaluation order, maintain
allocation generations, validate read/write bounds and initialized values, and
compare the final allocation set. Instrument all permitted memory operations.
Pointer addresses displayed are native virtual addresses or explicitly labelled
allocation IDs, never physical addresses. Unobserved library internals stay unknown.
This instrumenter is NOT implemented in this foundation; no boss may claim memory
safety grading until it exists and passes adversarial fixtures.

Pass transaction: attempt -> mastery -> first-clear 250XP/40 coins -> exclusive
stage badge -> successor unlock -> chest visual event. Use reward key boss:<nodeId>
so replays update records but never farm first-clear rewards. Display bundled chest
Lottie for 900ms and Rive BossPass once; persistence never depends on animation end.
Fail: store attempt, show failing input/expected/actual plus memory evidence and
BossFailRoast. Toolchain failures are not learner failures and grant no false pass.

### Migration

The 0.7 application stores progress/economy in WebView storage. Sharing package ID
is insufficient to read that automatically from Flutter. Implement a verified
bridge export or explicit user-imported backup first. Validate with existing 0.7
rules and preserve the original bytes/hash. Map mission IDs explicitly, including
33 existing missions; preserve projects, drafts, quizzes, XP, coins and owned
cosmetics. Current 0.7 UI borders are not in the new store: retain them as legacy
entitlements rather than silently discarding purchases. Import them to a dedicated
legacy-entitlements table when implementing migration; this foundation does not
claim a working importer.

Write the opening ledger transaction and mapped state in one SQLite transaction;
record a fixed migration ID and source hash. Reimport must neither award balances
again nor overwrite newer progress. Test interrupted import, corrupt backup,
duplicate IDs, unknown assets and downgrade. Use the existing signing identity
only after update tests prove the data survives. Never uninstall to make migration
appear successful.

### Required final self-check

| Requirement | Current result |
|---|---|
| No runtime network dependencies in new reference code/data | PASS |
| No cloud APIs, analytics, multiplayer or paid runtime service | PASS |
| Locale JSON and catalog present | PASS |
| SQLite transaction/reference checks | PASS; host tests only |
| Flutter widgets/drift integration | NOT IMPLEMENTED |
| Rive binary and one-shot Lottie assets | NOT AUTHORED/BUNDLED |
| Font/audio bundles and rendering checks | NOT COMPLETED |
| Native Android Clang 8 + Python 3.12 | NOT INTEGRATED |
| C++17 maximum, matching standard library | REQUIRED; not device-verified |
| Native stdin, EOF, Stop/restart and UTF-8 tests | NOT RUN |
| Graded memory instrumentation | NOT IMPLEMENTED |
| 0.7 progress import and update signing test | NOT IMPLEMENTED |
| iOS native C/C++ execution parity | UNRESOLVED PLATFORM CONSTRAINT |
| 60fps low-end device target | NOT MEASURED |
| New APK | NOT BUILT; release blocked |

Do not equate passing reference tests with completion of the application.
