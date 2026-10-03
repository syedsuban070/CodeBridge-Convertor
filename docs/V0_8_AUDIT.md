# CodeBridge v0.8 audit

Base: main `3df50d96faa9a546ee157c6a7e85c6620b833e3f`, shipped 0.7.5 APK: 51,352,014 bytes. Work stays in app/, android/, converter/ on release/v0.8; the abandoned Flutter preview is excluded.

## Reviewed foundation

README, ANDROID_LEARNING, RELEASE_NOTES, ROADMAP; projects/model and hub; academy/courses/progress; settings, editor-tools, diagnostics, terminal; all dialog/menu/Back handlers; economy, reward-clock, Memory Lab, feedback; asset preparation and Android WebView/IME bridge. Git remote is the existing CodeBridge-Convertor repository. Connector read authentication is working; writes use the same authorized connector without exposing credentials.

0.7.5 has 39 executable missions, Clang 8/LLD and Pyodide 3.12, isolated current-file builds, per-project settings, native source export/share, IME resize, a validated economy ledger and progress backups. Preserve these and the original dark UI. The local test server is available; install the pinned Playwright browser for development only. The APK stays completely offline.

## Gaps and risks

- Dialogs, menus, drawers and autocomplete have separate dismissal and Back chains. Focus restoration, swipe dismissal and input-aware keyboard layouts are inconsistent. Project creation is too verbose and lacks inline validation/template preview.
- CodeMirror 5 is shared by the workspace, lesson editors, debugger markers, snippets, autosave and instrumentation. Mobile uses contenteditable. A wholesale CM6 substitution would require replacing these contracts and increases native IME regression risk. **Decision: upgrade the existing vendored CM5 integration with its local folding/comment/search addons and tested custom commands.** Its virtualized viewport fits the 10,000-line and size requirements better for this release; no framework rewrite or duplicate editor bundle. Heavy tools load only when opened.
- Search is the stock dialog, completion is shallow, formatting/inline diagnostic ranges and editor command surfaces are incomplete. Formatting must preserve tokens and be labeled lightweight; Python formatting must not change indentation semantics.
- Bit is a sprite-sheet cube; canvas effects and sprite background-position animations do not meet the transform/opacity-only requirement. Replace their renderers with one compact rigged SVG and bounded DOM effects while retaining economy skin identifiers and feedback events.
- Progress is version 1 with a version-2 economy inside. Migration must preserve the original raw save before writing versioned extension state, keep all totals/drafts/claims/purchases, and fail closed if backup creation fails. Fixtures come from the actual 0.7.5 progress implementation and shipped execution paths, not invented simplified records.
- Lessons live in JS and concept/code phases rather than schema-driven steps. Hidden execution tests, cancellation, per-case results and hints need one shared grader. Existing Memory Lab bosses retain their checked C arena.
- Daily coin clock already uses monotonic elapsed time; streak and quest dates do not. Offline anti-tampering cannot authenticate wall time across reinstall/reboots. New learning-day accrual uses monotonic evidence and freezes on suspicious jumps; document this honest limitation.
- No maintainer release secrets are known. CI must choose secret-based signing when available; otherwise use the cached compatible beta certificate and explicitly identify the debug-signed artifact. Never commit keys or print secret values.

## Milestones and acceptance

0. Commit this audit immediately.
1. Universal overlay stack with focus trap/restore, Back/Esc/outside/swipe, dirty guard; 48px project creation, previews and responsive/pseudo-locale/font-scale tests.
2. Editor commands, search/replace, autocomplete/composition, folding, whitespace/indent guides, diagnostics and safe formatting; 10k-line and keyboard/rotation regressions.
3. Layered SVG Bit state machine, adaptive transform/opacity effects, reduced-motion fallback and Mascot Lab; assets below 1.5MB.
4. Matching adaptive/monochrome launcher and in-app branding; mask tests.
5. Versioned JSON lessons/schema CLI, seven step types, real-worker hidden grader with resource bounds/diffs/hints and 30 rules per language.
6. Crown mastery, safe local streak/day goals/freeze, forgiving energy, weekly quests, labeled seeded rivals and Leitner practice; ledger-aware migration tests.
7. Data and memory tracks, validated challenge packs/portfolio, skippable five-question placement and quick first lesson.
Ship: full unit/browser/schema/native checks, throttled performance report, migration evidence, signed APK integrity/alignment/size gate, v0.8.0 release with checksum; PR to main following the existing publishing practice.

## Assumptions and measurement boundaries

- Keep compatibility keys and existing lesson IDs. Extend data with explicit schema versions; automatic backups stay immutable until the user exports/removes them. Never fabricate a user's personal save or imply possession of it; validate real 0.7.5-generated fixtures and native upgrade saves.
- Two-tap creation means tap New project, then Create with sensible name/language defaults; optional customization takes additional taps.
- Native OS file pickers/share sheets and OS selection handles are platform-owned; app overlays use the universal component. Native select dropdowns are replaced by the shared selection sheet when enhanced.
- Hidden tests are an instructional check, not a secrecy boundary against a device owner. Memory quotas bound actual runtime allocations where supported; watchdog/output caps apply universally. Do not claim OS isolation within Pyodide.
- 60Hz display intervals are ~16.67ms, so a strict assertion that every frame interval is <=16ms conflicts with 60fps. Record raw frame intervals, >16ms counts, script long tasks, CPU-throttled p95 and cold start separately. Optimize visible animation to transform/opacity. Report any unmet budget rather than falsely certify Android 8 physical hardware from Chromium/Android 16 emulation.
- Added size is compared with the exact shipped 0.7.5 artifact, ceiling 63,934,926 bytes. Fonts and runtimes already shipped do not count as new downloads at runtime.
