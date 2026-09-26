## CodeBridge Studio 0.2 beta

Offline Android, Windows and macOS applications with a shared project editor and bundled C/C++ and Python runtimes.

- Real Clang 8 + LLD compilation to WebAssembly, including standard C/C++ library console programs and prefilled stdin.
- Python 3.12, source editing, autosave, project import/export, syntax highlighting, diagnostics and cancellation.
- Live Python debugging where shared memory is available.
- Desktop native C/C++ debugging through an installed Clang/G++ + GDB/LLDB toolchain.
- Offline conversion of the documented limited C/C++ subset into Python.

### Choose a download

- Android: `CodeBridge-0.2.0-Android.apk`.
- Windows x64: NSIS installer or portable EXE.
- Apple silicon Mac: arm64 DMG or ZIP.
- Intel Mac: x64 DMG or ZIP.

### Release limits

This is a beta, not a promise of all IDE/compiler features. Android arbitrary C/C++ source debugging, general C++ to Python conversion, package management, C++ exceptions/threads and OS-specific APIs are not implemented. The runtime compiles C/C++ to WebAssembly, not native executables.

Android is test-signed. Windows/macOS packages are unsigned; Apple notarization and trusted publisher certificates are not configured. Export existing projects before uninstalling an older preview when a signing mismatch prevents an Android upgrade.

SHA-256 checksums are included. See the README and feature matrix for setup and exact support.
