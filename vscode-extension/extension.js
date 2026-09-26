const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

function execute(program, args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(program, args, { cwd, timeout: 30000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve({ stdout, stderr }));
  });
}

function activeFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !['.c', '.cc', '.cpp', '.cxx'].includes(path.extname(editor.document.fileName))) {
    throw new Error('Open a C or C++ file first.');
  }
  return editor;
}

async function savedFile() {
  const editor = activeFile();
  if (!(await editor.document.save())) throw new Error('Save the source file before continuing.');
  return editor.document.fileName;
}

function activate(context) {
  const log = vscode.window.createOutputChannel('CodeBridge');
  context.subscriptions.push(log);
  const config = () => vscode.workspace.getConfiguration('codebridge');

  async function build(debug = false) {
    const source = await savedFile();
    const compiler = config().get(path.extname(source) === '.c' ? 'cCompiler' : 'cppCompiler');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'codebridge-'));
    const program = path.join(folder, process.platform === 'win32' ? 'program.exe' : 'program');
    const flags = debug ? ['-g', '-O0'] : [];
    log.clear();
    log.appendLine(`${compiler} ${source}`);
    try {
      const result = await execute(compiler, [...flags, source, '-o', program], path.dirname(source));
      log.append(result.stderr);
      log.appendLine(`Built: ${program}`);
      return { source, program };
    } catch (error) {
      log.appendLine(error.message);
      log.show(true);
      throw new Error('Compilation failed. See the CodeBridge output.');
    }
  }

  async function action(fn) {
    try { await fn(); } catch (error) { vscode.window.showErrorMessage(`CodeBridge: ${error.message}`); }
  }

  context.subscriptions.push(vscode.commands.registerCommand('codebridge.convert', () => action(async () => {
    const source = await savedFile();
    const output = source.replace(/\.(c|cc|cpp|cxx)$/i, '.py');
    if (fs.existsSync(output)) {
      const choice = await vscode.window.showWarningMessage(`Replace ${path.basename(output)}?`, { modal: true }, 'Replace');
      if (choice !== 'Replace') return;
    }
    await execute(config().get('pythonPath'), [path.join(context.extensionPath, 'transpile.py'), source, '-o', output], path.dirname(source));
    await vscode.window.showTextDocument(vscode.Uri.file(output));
  })));
  context.subscriptions.push(vscode.commands.registerCommand('codebridge.build', () => action(() => build())));
  context.subscriptions.push(vscode.commands.registerCommand('codebridge.run', () => action(async () => {
    const { source, program } = await build();
    const terminal = vscode.window.createTerminal({ name: 'CodeBridge Run', cwd: path.dirname(source) });
    terminal.show();
    // The terminal API accepts command text; quote the already-generated path for the host shell.
    const quoted = process.platform === 'win32' ? `"${program.replace(/"/g, '""')}"` : `'${program.replace(/'/g, "'\\''")}'`;
    terminal.sendText(quoted);
  })));
  context.subscriptions.push(vscode.commands.registerCommand('codebridge.debug', () => action(async () => {
    const { source, program } = await build(true);
    const started = await vscode.debug.startDebugging(vscode.workspace.getWorkspaceFolder(vscode.Uri.file(source)), {
      name: 'CodeBridge Debug', type: 'cppdbg', request: 'launch', program,
      cwd: path.dirname(source), stopAtEntry: false, externalConsole: false,
      MIMode: process.platform === 'win32' ? 'gdb' : 'gdb'
    });
    if (!started) throw new Error('Install the Microsoft C/C++ debugger and GDB, then retry.');
  })));
}

function deactivate() {}
module.exports = { activate, deactivate };
