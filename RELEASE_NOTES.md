# CodeBridge 0.7.2 — UI and editor corrections

- Splash exists in the first HTML frame and finishes before Home appears. Bundled bold Orbitron wordmark.
- Circular Android launcher icon with transparent corners and a code mark; no square inside the icon.
- English-only app. Urdu/Chinese selectors, fonts and translation files removed.
- Circular lesson nodes connected by a winding path, with locked, ready, mastered and boss states.
- Editor footer and bottom navigation removed from Code. Compact 36px header and 30px file tabs; helper actions live in the overflow menu. Run/tools float over the editor.
- Software keyboard hides header and file tabs. Only a 32px Undo/Redo/Indent/Outdent toolbar remains beneath the editor. Narrow line-number and breakpoint gutters.

Projects, progress, rewards and the offline compiler/interpreter remain in the existing CodeBridge app. Android and browser regression tests validate execution, terminal input, boss grading and keyboard layout.

This beta uses a new explicitly cached signing file because previous releases did not preserve their key. Existing 0.7/0.7.1 installations cannot update in place with a different certificate. Export your project and learning progress to files outside app storage before replacing the app; restore those files after installation. This remains a test-signed beta.
