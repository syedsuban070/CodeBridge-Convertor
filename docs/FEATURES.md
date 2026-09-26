# Feature support in 0.2 beta

| Feature | Android | Windows / macOS |
|---|---|---|
| Source editor, autosave, file export | Yes | Yes |
| Folder import and save | Project export instead | Yes |
| C11 / C++17 standard console programs | Bundled Clang → Wasm | Bundled Clang → Wasm |
| Python standard library | Bundled Pyodide | Bundled Pyodide |
| C/C++ stdin | Prefilled STDIN panel | Prefilled STDIN panel |
| Python live breakpoint debugging | Requires compatible WebView/shared memory | Yes |
| Native C/C++ debugging | No | Requires installed compiler + GDB/LLDB |
| C/C++ learning trace | Limited subset, replay | Limited subset, replay |
| C/C++ → Python conversion | Limited subset | Limited subset |
| Native executable export | No | No |
| Third-party Python package installer | No | No |
| Threads, arbitrary OS APIs, C++ exceptions in bundled runtime | No | No |

## Conversion scope

The original pycparser converter handles one `main`, basic scalar declarations, arithmetic, assignment, conditionals, loops, simple `printf`, and simple `std::cout`. It rejects arrays, pointers, classes, user-defined functions, templates and input streams. This conversion scope is much narrower than the compiler's scope. Compiling a program successfully does not mean it can be converted.

Conversion is a source transformation and can still differ in scope, overflow, numeric precision, formatting and C/C++ undefined behavior. Review and compare generated Python output. A mature Clang-AST converter remains on the roadmap.

## Debugging

Python runs in a worker. The debugger's tracing callback blocks that worker while the UI displays frame variables; Step and Continue resume it. The whole worker is terminated by Stop, including an infinite loop.

Desktop native debug compiles a temporary copy of the project with debug symbols and starts GDB or LLDB. The controls send real debugger commands. The toolchain is detected from PATH. Native debug currently uses the debug console for variable and stack output; it is separate from the sandboxed WebAssembly runner.

The C/C++ learning trace supports only simple statements and replays snapshots after a bounded interpretation. It is for teaching; it cannot inspect arbitrary compiled C++ programs.
