# Bit in Android 0.6

The external Qwen model, llama.cpp native engine and AI bridge have been removed from this version at the project owner's request. The 0.5 release remains available unchanged in GitHub Releases, with its original model documentation.

Bit now uses original rule-based error explanations, scripted Roman Urdu banter and three animated reactions. This is **not a trained language model**. It does not generate arbitrary code or claim to understand every error. Roast mode remains optional and off by default. Dialogues and diagnostics live in `app/assist/diagnostics.js` and `app/assist/power.js`.

On an in-place update, the application removes the obsolete private GGUF model copy. The application ID and local progress/project/settings keys are unchanged.

See [terminal behavior and limitations](TERMINAL.md).
