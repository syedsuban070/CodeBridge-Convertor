# Roadmap

1. Prototype: compile/run/debug integration and narrow, transparent C/C++ to Python conversion.
2. Parse C and C++ with Clang tooling, resolve types and symbols, and lower to a typed intermediate representation.
3. Add semantics helpers for integers, arrays, strings, I/O, loops and control flow; reject undefined or untranslatable behavior explicitly.
4. Run paired C/C++ and Python programs against fixture and property-based inputs; report output differences in the editor.
5. Package extension for Windows, macOS and Linux and publish a signed release.

There is no universal guarantee that arbitrary C/C++ can be translated into Python without manual changes. Native libraries, pointer behavior, undefined behavior, concurrency and platform-specific code require special handling.
