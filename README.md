# CodeBridge (prototype)

A VS Code extension to compile and run a C/C++ file, launch a GDB debugging session, and convert a **documented subset** of C/C++ to Python from the editor's `...` menu.

## Requirements

- VS Code 1.85+, Python 3.10+, `python -m pip install -r requirements.txt`.
- GCC/G++ for compile and run. For debug, install GDB and the Microsoft C/C++ VS Code extension. Set the compiler paths in VS Code's `codebridge.*` settings if needed.
- Local programs run with your own user privileges. Open and run only code you trust.

## Install for development

Open `vscode-extension` in VS Code and press F5 to launch the Extension Development Host. Open a `.c` or `.cpp` file. Select its editor `...` menu, then **Convert File to Python**, **Compile and Run C/C++ File**, or **Compile and Debug C/C++ File**. Converted output is saved alongside the source as `.py`; replacement asks first.

## Conversion scope

This initial translator uses `pycparser` to parse a restricted C syntax shared by C and simple C++ programs. It supports one `int main()` or `int main(void)`, local scalar `int`, `float`, `double`, and `char` declarations, assignment, arithmetic and comparison, `if`/`else`, `while`, `for`, basic `printf` (`%d`, `%i`, `%f`, `%s`, `%c`), and basic `std::cout << ... << std::endl`. Integer division and remainder follow C's truncation toward zero. It rejects preprocessor macros, pointers, arrays, structs, user functions, classes, templates, input streams, and other unsupported constructs with a clear error, leaving no partial `.py` output.

Conversion is not equivalent to arbitrary C/C++. Numeric overflow, `printf` formatting details, scope, evaluation order, integer types, and platform APIs can differ. Review and test generated Python against the original executable. The long-term plan is a Clang AST front end, a typed intermediate representation, explicit compatibility helpers, and differential tests.

## CLI

`python converter/transpile.py examples/hello.c -o /tmp/hello.py`

Run `python -m unittest discover -s tests -v` from the repository root to compare sample translations with native GCC/G++ output. CI repeats these tests on each push and pull request.

## Contributing

See [ROADMAP.md](ROADMAP.md). Focus on explicit diagnostics and behavioral tests before adding syntax. MIT licensed.

## Android app preview

The [`android/`](android/) project builds an installable debug APK. It offers an offline editor, Android file import/export, output, and step-by-step tracing for a small C/C++ **learning subset**. Its execution engine is an interpreter; it does not compile native C/C++ binaries or contain GDB or Python conversion. See [mobile setup and limits](android/README.md). Download test builds from **Actions → Android APK → Artifacts** after a successful run.
