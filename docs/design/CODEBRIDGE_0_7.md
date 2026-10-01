**CodeBridge 0.7 should focus on a cleaner coding workspace, animated feedback, and cosmetic progression while preserving the working 0.6 terminal.** This is the proposed specification; no repository changes or builds have been started.

**1. Redesigned UI and component hierarchy**

Keep Midnight/Night as the foundation:

| Element | Proposed treatment |
|---|---|
| Background | Midnight `#0F1420` |
| Editor | Night `#10131C` |
| Primary action | Lime `#B9FF66`, dark icon/text |
| Main text | White `#F4F7FC` |
| Secondary text | Muted blue-grey `#A8B3C7` |
| Errors | Coral plus an error icon and explanation |
| Motion | Short, purposeful transitions; reduced-motion option |

Use **JetBrains Mono for source code and terminal text**, with ligatures disabled initially. It is a developer-focused font available under OFL-1.1 and can be bundled offline. Reserve stylized display typography for headings and reward screens, where it won’t obscure code punctuation. [GitHub](https://github.com/JetBrains/JetBrainsMono?utm_source=chatgpt.com)

The hierarchy below is conceptual; it fits the existing Android/WebView architecture without requiring a framework rewrite.

| Parent | Component | Responsibility |
|---|---|---|
| `AppShell` | `ThemeProvider` | Colours, fonts, purchased cosmetics, accessibility |
| `AppShell` | `Navigation` | Home, Learn, Code, Quests, Profile |
| `Home` | `BitStage` | Directional sprite animation and contextual dialogue |
| `Home` | `ContinueCard` | Resume the current lesson or project |
| `Home` | `DailyDiscoveryCard` | Daily reward and one suggested challenge |
| `Learn` | `CourseMap` | Existing 33 missions, prerequisites and mastery |
| `Learn` | `MissionWorkspace` | Explanation, quiz, editor and test execution |
| `Studio` | `ProjectDrawer` | Files, tabs, import/export |
| `Studio` | `EditorSurface` | Code, completion, selection and diagnostics |
| `Studio` | `ExecutionDock` | Run/Stop FAB and secondary action menu |
| `Studio` | `TerminalScreen` | Live input, output, EOF and execution status |
| `Studio` | `MemoryLab` | Supported C/C++ memory visualizations |
| `MissionResult` | `AfterActionReport` | Correctness, measurements and improvement advice |
| `Profile` | `CosmeticStore` | Preview, purchase and equip cosmetics |
| `AppShell` | `FeedbackLayer` | Particles, sound cues and brief notifications |

**Execution controls**

Replace the crowded toolbar with a **56 dp Run FAB** and a smaller adjacent Tools button.

- **Idle:** FAB runs the active program.
- **Compiling/running:** FAB becomes an always-accessible Stop button.
- **Waiting for input:** show the terminal’s input row; keep Stop visible.
- **Tools:** opens a labelled quarter-circle menu containing Build, Debug, Console and Preload Input.
- **Small screens, landscape or open keyboard:** use a compact bottom sheet instead of forcing the radial layout into insufficient space.
- Keep Save, project management and conversion in the file menu.

Reserve space around the FAB so it never covers code, the cursor, or terminal input. Opening the keyboard should hide decorative navigation before reducing the useful editing area.

**2. Step-by-step animation and feedback implementation**

1. **Introduce shared feedback events.**  
   Emit events from completed operations, not button presses:

   ```text
   execution.started
   compilation.succeeded
   execution.failed
   mission.cleared
   reward.claimed
   cosmetic.equipped
   ```

   Include `runId` or `transactionId` so duplicate callbacks cannot repeat rewards or effects.

2. **Create Bit’s sprite assets.**  
   Use four directions—front, back, left and right—with these clips:

   | Clip | Frames per direction | Playback |
   |---|---:|---|
   | Idle | 6 | 6–8 FPS, looping |
   | Thinking | 8 | 10 FPS, looping |
   | Celebration | 10 | 12 FPS, once |

   That is **96 frames per skin**. At 96×96 pixels per frame, one decoded RGBA atlas uses approximately **3.4 MiB**, excluding rendering overhead. Load only the equipped skin.

   Keep frame dimensions, anchor points and animation names identical across skins.

3. **Implement a small animation controller.**  
   Track `state`, `direction`, `frame` and elapsed time. Use elapsed-time animation with `requestAnimationFrame`, rather than advancing one frame per screen refresh.

   Thinking follows compilation or lesson checking; celebration follows a successful mission or reward claim. Bit remains a scripted companion—no external AI model is needed.

4. **Pause unnecessary rendering.**  
   Stop animation when the app is backgrounded, the mascot is off-screen, or another screen covers it. Reduced-motion mode shows a representative still frame and a short text response.

5. **Add one pooled particle layer.**  
   Use a single canvas with `pointer-events: none`.

   - Build success: 8–12 small sparks around the execution control.
   - Mission completion: 24–40 particles on the result screen.
   - Maximum simultaneous particles: 64.
   - Lifetime: approximately 350–700 ms.
   - No per-particle DOM elements, blur filters or perpetual emitters.

   Coalesce overlapping success events so completing one mission does not produce several celebrations.

6. **Add the audio hooks.**  
   Bundle **22,050 Hz, 16-bit PCM, mono WAV** effects:

   | Cue | Event | Duration target | Character |
   |---|---|---:|---|
   | `syntax-error.wav` | Compilation fails with syntax diagnostics | 100–160 ms | Soft downward tick |
   | `build-success.wav` | Successful compilation | 180–250 ms | Two ascending notes |
   | `coins-claimed.wav` | Reward transaction commits | 220–350 ms | Short coin sparkle |

   Decode once and cache. Honour the sound setting, limit simultaneous playback, and avoid triggering an error sound for every individual diagnostic.

7. **Verify performance and accessibility.**  
   Check editing, scrolling, terminal input and Stop responsiveness while effects play. Test keyboard-open layouts, background/resume, reduced motion, muted audio and rapid repeated actions. Keep the existing terminal and curriculum regression tests as release gates.

**3. Visual Memory Debugger architecture**

Call this feature **Memory Lab** and initially limit it to supported learning exercises.

Compilation prepares instrumentation and source mappings. **Actual values, pointer relationships and allocation changes are captured during execution.** Clang’s LibTooling provides infrastructure for standalone AST-based tools, but adding such a tool to the current bundled compiler requires engineering work; it is not an existing CodeBridge capability. [Clang](https://clang.llvm.org/docs/LibTooling.html?utm_source=chatgpt.com)

| Layer | Responsibility |
|---|---|
| Lesson capability checker | Reject unsupported syntax with a specific explanation |
| Instrumentation pass | Insert observation hooks using parsed source, preserving evaluation order |
| Source map | Associate observation IDs with original source locations |
| Trace runtime | Record declarations, writes, allocations, frees and scope changes |
| Execution controller | Step, continue and stop using the Android bridge or browser transport |
| Memory model | Track objects, lifetimes, initialized values and pointer targets |
| Visualizer | Render stack frames, array cells, heap blocks and pointer arrows |

Start with scalar variables, fixed arrays, address-of, supported pointer assignments, and controlled `malloc/free` exercises. Add C++ object lifetimes and `new/delete` later.

Important constraints:

- Show addresses as **Wasm memory offsets**, not physical Android addresses.
- Use allocation IDs and lifetime generations to distinguish reused memory.
- Mark unknown or unobserved values explicitly.
- Detect dangling pointers only where instrumentation has sufficient evidence.
- Do not claim complete tracking of arbitrary pointer arithmetic, library internals or undefined behaviour.
- Cap traces and disclose truncation.
- Keep normal Run separate from instrumented Memory Lab execution.

The existing limited teaching trace may remain available, but it must not be presented as a debugger for arbitrary compiled programs.

**4. Economy and After-Action Reports**

Use coins for cosmetics only. Editing, compilation, debugging essentials and learning access remain free.

| Cosmetic | Proposed starting price |
|---|---:|
| Editor palette | 60 coins |
| UI border | 100 coins |
| Bit skin | 180 coins |

These are initial balancing values, not finalized prices. Offer previews before purchase, permanent ownership and free switching between owned items.

Keep first-clear rewards separate from replay rewards. Replays can improve mastery records; repeat coin awards should come only from explicitly eligible quests, preventing unlimited farming of one trivial lesson.

For the **After-Action Report**, report separate results rather than an opaque overall score:

| Result | Measurement |
|---|---|
| Correctness | Tests passed, including edge cases |
| Execution speed | Median of repeated runs after warm-up |
| Efficiency | Instrumented comparisons, iterations or allocations where supported |
| Improvement | Comparison with the learner’s previous comparable result |
| Next experiment | One concrete optimization suggestion |

Exclude compilation, runtime loading, user-input waiting and animations from execution timing. Compare speed only on the same device, runtime and test set. If timing is too noisy, show **“No reliable difference”**.

Do not infer Big-O complexity from elapsed time. For suitable missions, compare operation counts across increasing input sizes. Debug/instrumented runs must not compete directly with normal-run timings.

**5. JSON Schema for quests, cosmetics and saved economy**

This proposed schema separates content definitions from player state and records claims and purchases as transactions.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CodeBridge Quest and Economy Save",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "contentVersion",
    "quests",
    "catalog",
    "player"
  ],
  "properties": {
    "schemaVersion": { "const": 2 },
    "contentVersion": { "type": "string", "minLength": 1 },
    "quests": {
      "type": "array",
      "items": { "$ref": "#/$defs/quest" }
    },
    "catalog": {
      "type": "array",
      "items": { "$ref": "#/$defs/item" }
    },
    "player": { "$ref": "#/$defs/player" }
  },
  "$defs": {
    "id": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$"
    },
    "reward": {
      "type": "object",
      "additionalProperties": false,
      "required": ["coins", "xp"],
      "properties": {
        "coins": { "type": "integer", "minimum": 0 },
        "xp": { "type": "integer", "minimum": 0 }
      }
    },
    "quest": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "title",
        "cadence",
        "objective",
        "reward",
        "prerequisites"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "title": { "type": "string", "minLength": 1 },
        "cadence": {
          "enum": ["once", "daily", "weekly"]
        },
        "objective": {
          "type": "object",
          "additionalProperties": false,
          "required": ["metric", "target"],
          "properties": {
            "metric": {
              "enum": [
                "daily_discovery_claim",
                "distinct_missions_passed",
                "distinct_quizzes_passed",
                "optimization_target_met",
                "memory_exercise_passed"
              ]
            },
            "target": { "type": "integer", "minimum": 1 },
            "courseId": { "$ref": "#/$defs/id" },
            "missionId": { "$ref": "#/$defs/id" }
          }
        },
        "reward": { "$ref": "#/$defs/reward" },
        "prerequisites": {
          "type": "array",
          "uniqueItems": true,
          "items": { "$ref": "#/$defs/id" }
        }
      }
    },
    "item": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "name",
        "category",
        "priceCoins",
        "assetKey"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "name": { "type": "string", "minLength": 1 },
        "category": {
          "enum": ["editor_palette", "bit_skin", "ui_border"]
        },
        "priceCoins": { "type": "integer", "minimum": 0 },
        "assetKey": { "$ref": "#/$defs/id" },
        "requiredMissionId": { "$ref": "#/$defs/id" }
      }
    },
    "questProgress": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "questId",
        "periodKey",
        "value",
        "evidenceIds",
        "claimed"
      ],
      "properties": {
        "questId": { "$ref": "#/$defs/id" },
        "periodKey": { "type": "string", "minLength": 1 },
        "value": { "type": "integer", "minimum": 0 },
        "evidenceIds": {
          "type": "array",
          "uniqueItems": true,
          "items": { "$ref": "#/$defs/id" }
        },
        "claimed": { "type": "boolean" },
        "claimTransactionId": { "$ref": "#/$defs/id" }
      },
      "allOf": [
        {
          "if": {
            "properties": { "claimed": { "const": true } }
          },
          "then": { "required": ["claimTransactionId"] },
          "else": {
            "not": { "required": ["claimTransactionId"] }
          }
        }
      ]
    },
    "transaction": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "idempotencyKey",
        "kind",
        "sourceId",
        "coinsDelta",
        "xpDelta",
        "createdAt"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "idempotencyKey": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        },
        "kind": {
          "enum": ["reward", "purchase", "migration"]
        },
        "sourceId": { "$ref": "#/$defs/id" },
        "coinsDelta": { "type": "integer" },
        "xpDelta": { "type": "integer", "minimum": 0 },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "allOf": [
        {
          "if": {
            "properties": { "kind": { "const": "purchase" } }
          },
          "then": {
            "properties": {
              "coinsDelta": { "maximum": 0 },
              "xpDelta": { "const": 0 }
            }
          },
          "else": {
            "properties": {
              "coinsDelta": { "minimum": 0 }
            }
          }
        }
      ]
    },
    "player": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "revision",
        "coins",
        "xp",
        "ownedItemIds",
        "equipped",
        "questProgress",
        "transactions"
      ],
      "properties": {
        "revision": { "type": "integer", "minimum": 0 },
        "coins": { "type": "integer", "minimum": 0 },
        "xp": { "type": "integer", "minimum": 0 },
        "ownedItemIds": {
          "type": "array",
          "uniqueItems": true,
          "items": { "$ref": "#/$defs/id" }
        },
        "equipped": {
          "type": "object",
          "additionalProperties": false,
          "required": ["editorPalette", "bitSkin", "uiBorder"],
          "properties": {
            "editorPalette": { "$ref": "#/$defs/id" },
            "bitSkin": { "$ref": "#/$defs/id" },
            "uiBorder": { "$ref": "#/$defs/id" }
          }
        },
        "questProgress": {
          "type": "array",
          "items": { "$ref": "#/$defs/questProgress" }
        },
        "transactions": {
          "type": "array",
          "items": { "$ref": "#/$defs/transaction" }
        }
      }
    }
  }
}
```

The application must enforce rules that JSON Schema cannot establish by itself:

- Unique quest, item, transaction and idempotency IDs.
- Valid references and matching cosmetic categories.
- Ownership before equipping.
- Sufficient balance and the catalog’s exact purchase price.
- One claim per quest period, with verified completion evidence.
- Atomic updates to balance, ownership, quest claims and transaction history.
- Reconciliation between recorded balances and the transaction ledger.

For migration, preserve the existing XP and coins through one idempotent opening transaction, grant the default cosmetics, and retain a backup before switching saves. Daily periods need a documented timezone policy; a fully offline app cannot reliably prevent device-clock manipulation.

**Recommended implementation order:** execution controls and typography → sprite/audio/particle feedback → transactional store and save migration → After-Action Reports → separately gated Memory Lab prototype.