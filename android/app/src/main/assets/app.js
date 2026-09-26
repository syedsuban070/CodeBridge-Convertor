const code = document.querySelector('#code');
const output = document.querySelector('#output');
const filename = document.querySelector('#filename');
const next = document.querySelector('#next');
let trace = [], cursor = 0;
const starter = `#include <stdio.h>
int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
    }
    printf("Sum: %d\\n", sum);
    return 0;
}`;
code.value = localStorage.getItem('source') || starter;
filename.value = localStorage.getItem('filename') || 'main.c';
code.addEventListener('input', () => localStorage.setItem('source', code.value));
filename.addEventListener('input', () => localStorage.setItem('filename', filename.value));
function showStatus(message) { document.querySelector('#status').textContent = message; }
function newFile() { code.value = starter; filename.value = 'main.c'; code.dispatchEvent(new Event('input')); filename.dispatchEvent(new Event('input')); output.textContent = 'New file'; next.hidden = true; }
function loadDocument(name, content) { filename.value = name; code.value = content; code.dispatchEvent(new Event('input')); filename.dispatchEvent(new Event('input')); showStatus('Opened ' + name); }
function saveFile() { AndroidFiles.save(filename.value, code.value); }
function runCode() {
  next.hidden = true;
  try { const result = CodeBridge.run(code.value); output.textContent = result.output || '(program finished with no output)'; showStatus('Completed · ' + result.trace.length + ' execution steps'); }
  catch (error) { output.textContent = 'Error: ' + error.message; showStatus('Run stopped'); }
}
function startDebug() {
  try { const result = CodeBridge.run(code.value); trace = result.trace; cursor = 0; output.textContent = 'Trace ready: ' + trace.length + ' steps. Tap Next step.'; next.hidden = false; showStatus('Debugging the supported subset; steps are replayed from one bounded execution.'); }
  catch (error) { output.textContent = 'Error: ' + error.message; next.hidden = true; }
}
function nextStep() {
  if (cursor >= trace.length) { next.hidden = true; showStatus('Debug complete'); return; }
  const step = trace[cursor++];
  output.textContent = 'Step ' + cursor + '/' + trace.length + ' · source line ' + step.line + '\nVariables: ' + JSON.stringify(step.vars, null, 2) + '\n\nOutput so far:\n' + step.output;
  const lines = code.value.split('\n');
  const start = lines.slice(0, step.line - 1).join('\n').length + (step.line > 1 ? 1 : 0);
  code.focus(); code.setSelectionRange(start, start + (lines[step.line - 1] || '').length);
}
