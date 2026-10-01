importScripts('../vendor/pyodide/pyodide.js','terminal-input.js');
const send=(event,data={})=>postMessage({event,...data});
self.onmessage=async ({data})=>{
  let py;
  try {
    send('status',{text:'Loading bundled Python…'});
    let written=0, input=(data.stdin||'').split('\n'), inputAt=0;
    py=await loadPyodide({indexURL:new URL('../vendor/pyodide/',self.location.href).href,
      stdout:text=>{written+=text.length;if(written>200000)throw new Error('Output limit reached');send('stdout',{text:text+'\n'});},
      stderr:text=>send('diagnostic',{text:text+'\n'})});
    if(data.inputBuffer||data.nativeInput){
      const read=createTerminalInput(data.inputBuffer,data.stdin?(data.stdin.endsWith('\n')?data.stdin:data.stdin+'\n'):'',data.nativeInput);
      py.setStdin({read:buffer=>{const bytes=read(buffer.length);buffer.set(bytes);return bytes.length;},isatty:false});
    }else py.setStdin({stdin:()=>inputAt<input.length?input[inputAt++]:null});
    const decoder=new TextDecoder();
    py.setStdout({write:bytes=>{written+=bytes.length;if(written>200000)throw new Error('Output limit reached');send('stdout',{text:decoder.decode(bytes,{stream:true})});return bytes.length;},isatty:!!data.inputBuffer});
    py.FS.mkdirTree('/project');
    for(const file of data.files) {
      if(file.name.includes('..')||file.name.startsWith('/'))throw new Error('Invalid project path');
      const path='/project/'+file.name;py.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));py.FS.writeFile(path,file.content);
    }
    py.FS.chdir('/project');
    if(data.action==='convert') {
      send('status',{text:'Converting supported C/C++ syntax…'});
      const root=new URL('../vendor/python/',self.location.href);
      const wheel=await (await fetch(new URL('pycparser-2.22-py3-none-any.whl',root))).arrayBuffer();
      py.unpackArchive(wheel,'zip',{extractDir:'/parser'});
      const converter=await (await fetch(new URL('transpile.py',root))).text();py.FS.writeFile('/parser/transpile.py',converter);
      py.globals.set('source_code',data.source);
      const result=py.runPython("import sys\nsys.path.insert(0, '/parser')\nfrom transpile import convert\nconvert(source_code)");
      send('converted',{text:result}); return;
    }
    // Parse imports without executing user code; load only bundled packages.
    py.globals.set('user_sources_json',JSON.stringify(data.files.filter(f=>f.name.endsWith('.py')).map(f=>f.content)));
    const modules=py.runPython(`import ast, json
modules=set()
for source in json.loads(user_sources_json):
    try:
        tree=ast.parse(source)
        modules.update(n.name.split('.')[0] for node in ast.walk(tree) if isinstance(node,ast.Import) for n in node.names)
        modules.update(node.module.split('.')[0] for node in ast.walk(tree) if isinstance(node,ast.ImportFrom) and node.module)
    except SyntaxError:
        pass
json.dumps(sorted(modules & {'numpy','sympy','mpmath'}))`);
    const packages=JSON.parse(modules);
    if(packages.length){send('status',{text:'Loading bundled '+packages.join(', ')+'…'});await py.loadPackage(packages);}
    py.globals.set('entry',data.entry);
    const isDebug=data.action==='debug';
    if(isDebug) {
      if(!data.control)throw new Error('Live Python debugging needs an updated WebView with shared-memory support. Running Python remains available.');
      const control=new Int32Array(data.control);
      self.cbPause=(json)=>{
        Atomics.store(control,0,0);send('paused',JSON.parse(json));
        Atomics.wait(control,0,0);
        return Atomics.load(control,0);
      };
      py.globals.set('breakpoint_lines',py.toPy(data.breakpoints||[]));
      py.runPython(`import sys, json
from js import cbPause
step_mode = True
next_depth = None
def safe_value(value):
    try: return repr(value)[:200]
    except: return '<unprintable>'
def tracer(frame, event, arg):
    global step_mode, next_depth
    if event == 'line' and frame.f_code.co_filename == '/project/' + entry:
        depth=0
        parent=frame
        while parent:
            depth+=1; parent=parent.f_back
        if (step_mode and (next_depth is None or depth <= next_depth)) or frame.f_lineno in breakpoint_lines:
            stack=[]
            f=frame
            while f and len(stack)<12:
                stack.append(f.f_code.co_name + ':' + str(f.f_lineno)); f=f.f_back
            command=cbPause(json.dumps({'line':frame.f_lineno, 'vars':{k:safe_value(v) for k,v in frame.f_locals.items() if not k.startswith('__')},'stack':stack}))
            step_mode=command in (1,3)
            next_depth=depth if command==3 else None
    return tracer
sys.settrace(tracer)`);
    }
    send('running');send('status',{text:isDebug?'Python debugger running…':'Running Python…'});
    const started=performance.now();
    await py.runPythonAsync("import sys\nsys.path.insert(0, '/project')\nexec(compile(open(entry).read(), '/project/' + entry, 'exec'), {'__name__':'__main__', '__file__':'/project/'+entry})");
    py.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()');
    if(isDebug)py.runPython('sys.settrace(None)');
    send('done',{elapsedMs:performance.now()-started});
  } catch(error) {try{py?.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()');}catch{}send('error',{text:error.message||String(error)});}
};
