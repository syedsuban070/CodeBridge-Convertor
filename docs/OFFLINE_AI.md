# Bit local coding assistant

The Android APK bundles Qwen2.5-Coder-0.5B-Instruct (Q4_K_M GGUF) from Qwen, executed with a pinned llama.cpp native library. It is a genuine pretrained language model; this project did not train it. No API key, account, remote inference or post-install model download is required.

## What is included
- Model source: https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF
- Model revision: `ebb2015119c907b064c512bf053e945850b5875f`
- Model SHA-256: `1d9614638d18024d0fbb36575a15f1302a3adf044df10345688ec4f6e1c4ff32`
- Model size: 491,400,064 bytes. Apache 2.0 license bundled.
- llama.cpp revision: `74d4f5b041ad837153b0e90fc864b8290e01d8d5` (b5046), MIT license bundled.
- CPU inference on Android arm64-v8a and x86_64. This release does not support 32-bit-only devices.

## Limits and privacy
Bit gets your selected workspace code, or its first 2,000 characters, the last 1,000 characters of diagnostics, and your question. These are processed on-device. Context is capped at 1,536 input tokens and 224 generated tokens with a three-minute inference deadline. Longer excerpts must be shortened. There is no code upload, automatic code execution, automatic repair, or claim that the answer is correct. Small models can produce inaccurate or incomplete explanations. Test all suggested changes.

The model is copied from the APK to private app storage at first use so native inference can mmap it. Allow roughly 1.2 GB free storage for installation and preparation and prefer a device with at least 4 GB RAM. This is a recommendation, not a guarantee; speed and available memory vary. The model is unloaded after each answer. A Stop button cancels generation; memory release may take a moment. Runtime compilation and AI inference are kept separate to reduce memory pressure.

## Immediate guidance and humor
Compiler guidance is a separate rule-based feature, explicitly labeled as such. It recognizes common compiler/Python errors, explains them and can jump to a reported line. It is not the pretrained model. Roman Urdu roast mode is optional, off by default, and selects preset jokes about code; it does not generate insults with the model.

## More coding capability
Python adds bundled NumPy 2.0.2, SymPy 1.13.3 and mpmath 1.3.0, loaded when found in source imports. C++ adds cJSON 1.7.18. Check for a null return from `cJSON_Parse()` on invalid input and free trees with `cJSON_Delete()`. Compilers expose C99/C11/C17, C++11/14/17, O0/O1/O2, Wall and Wextra. Existing WebAssembly platform restrictions still apply.

Editor completions are keyword and current-file identifier suggestions, not type-aware language-server completion. Snippets, Ctrl+Space, A+/A−, Ctrl+=/Ctrl+− and pinch zoom are included. Zoom and preferences persist locally.
