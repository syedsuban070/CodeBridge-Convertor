# CodeBridge 0.7.5

## Project studio

Code in the bottom navigation opens a dedicated project library. Create separate C, C++ and Python projects, choose a language standard and optimization level, manage files, import, duplicate, rename, export and share without hunting through editor menus. The shipped runtimes are Clang 8 and Python 3.12; no network is required to run code.

Existing workspace files migrate automatically. Each project saves independently with a recoverable previous snapshot. Back up all projects as .cbworkspace or export one .cbproj; import adds projects without replacing existing work.

## Compilation and saving fixes

Run current file is the default: another file containing main() no longer gets linked into it. Select Link project sources for genuine multi-file C/C++ programs with one main(). Headers and Python helper modules remain available in the project. Compiler choices are saved per project.

Source exports use .c, .cpp and .py filename/MIME handling; Android corrects an added .txt/.bin extension when the document provider supports rename. Android Share source/project uses a read-only granted content URI. Save cancellation leaves the local project intact.

## Learning and editor

Local Nunito typography, concise labels, colored unit banners, progress counters, raised star/code/challenge nodes, a clear Start here marker and completed-connection glow. CodeBridge artwork and dark palettes remain. Motion settings are respected.

The scrollable bracket/operator/semicolon/quote bar follows Android keyboard visibility as well as browser viewport resizing, preserves code focus, and works with bracket pairing. A compact project/saved indicator and visible source export button are in the editor.

## Installation

Uses the same cached beta signing certificate as 0.7.2–0.7.4. Build checks cover signatures, alignment, Android 16 installation over 0.7.2 with retained private data, real C/C++ and Python execution, and project regressions before publishing. Export a backup outside the app to protect local work.

## v0.8 development — M1

Unified overlay lifecycle and app Back routing; keyboard-aware, preview-driven two-tap project creation, inline validation, 48px controls, larger text and pseudo-locale coverage. All 32 visual configurations and original project/editor regressions pass. See docs/V0_8_AUDIT.md and docs/V0_8_M1.md for scope and measurement assumptions.

### v0.8 M2 — editor and recovery
Upgraded the existing local CodeMirror editor with lazy-loaded commands and folding, language snippets and identifiers, safe find/replace, per-file undo histories, real diagnostic gutters and squiggles, indentation guides, whitespace settings, mobile symbol arrows and crash recovery journaling. Safe formatting preserves tokens; Python formatting trims trailing whitespace outside strings.

### v0.8 M3 — Bit and effects
Layered SVG Bit replaces sprite sheets, with eleven interruptible/queued states, eye tracking, speech, adaptive transform/opacity effects and Mascot Lab. Reduced-motion uses static feedback. Cosmetic ownership is retained.
