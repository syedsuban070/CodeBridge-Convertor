importScripts('../vendor/clang/shared-adapted.js','terminal-input.js');
const send = (event, data={}) => postMessage({event, ...data});
const strip = text => text.replace(/\x1b\[[0-9;]*m/g, '');
self.onmessage = async ({data}) => {
  let phase='build', written=0;
  try {
    send('status',{text:'Starting offline Clang…'});
    const base=new URL('../vendor/clang/', self.location.href);
    const bytes=async name => {
      const res=await fetch(new URL(name,base)); if(!res.ok) throw new Error('Bundled toolchain file missing: '+name);
      return res.arrayBuffer();
    };
    const api=new API({readBuffer:bytes,compileStreaming:async name=>WebAssembly.compile(await bytes(name)),
      hostWrite:text=>{ written+=text.length; if(written>200000) throw new Error('Output limit reached (200 KB).'); send(phase==='run'?'stdout':'diagnostic',{text:strip(text)}); }});
    api.hostLog=()=>{}; api.hostLogAsync=(_,promise)=>promise;
    await api.ready;
    api.memfs.addFile('include/cJSON.h',new Uint8Array(await (await fetch('../vendor/cpp/cjson/cJSON.h')).arrayBuffer()));
    const jsonSource=await (await fetch('../vendor/cpp/cjson/cJSON.c')).text();
    const directories=new Set();
    const options=data.compiler||{};
    const cStandard=['c99','c11','c17'].includes(options.cStandard)?options.cStandard:'c11';
    const cppStandard=['c++11','c++14','c++17'].includes(options.cppStandard)?options.cppStandard:'c++17';
    const optimization=['O0','O1','O2'].includes(options.optimization)?options.optimization:'O0';
    for(const file of data.files) {
      if(!/^[\w. /-]+$/.test(file.name)||file.name.split('/').some(x=>x==='..'||x==='')||file.name.startsWith('/')) throw new Error('Invalid project path: '+file.name);
      const parts=file.name.split('/'); parts.pop(); let dir='';
      for(const part of parts) { dir=dir ? dir+'/'+part:part; if(!directories.has(dir)){api.memfs.addDirectory(dir);directories.add(dir);} }
      api.memfs.addFile(file.name,new TextEncoder().encode(file.content));
    }
    const units=data.files.filter(f=>/\.(c|cc|cpp|cxx)$/.test(f.name));
    if(data.files.some(f=>f.content.includes('cJSON.h'))){api.memfs.addFile('__cb_cjson.c',jsonSource);units.push({name:'__cb_cjson.c',content:jsonSource});}
    if(!units.length) throw new Error('Project has no C or C++ source files.');
    if(data.inputBuffer||data.nativeInput){
      const source='#include <stdio.h>\n__attribute__((constructor)) static void cb_terminal_init(void){setvbuf(stdout,0,_IONBF,0);setvbuf(stderr,0,_IONBF,0);}';
      api.memfs.addFile('__cb_terminal.c',source);units.push({name:'__cb_terminal.c',content:source});
    }
    const clang=await api.getModule('clang'), objects=[];
    for(let i=0;i<units.length;i++) {
      const file=units[i], cpp=!file.name.endsWith('.c'), object=`cb_${i}.o`;
      send('status',{text:'Compiling '+file.name});
      await api.run(clang,'clang','-cc1','-emit-obj',...api.clangCommonArgs,'-I.','-Iinclude','-Wall','-Wextra','-'+optimization,'-std='+(cpp?cppStandard:cStandard),'-o',object,'-x',cpp?'c++':'c',file.name);
      objects.push(object);
    }
    send('status',{text:'Linking…'});
    const linker=await api.getModule('lld'), lib='lib/wasm32-wasi';
    await api.run(linker,'wasm-ld','--no-threads','-z','stack-size=1048576','-L'+lib,lib+'/crt1.o',...objects,'-lc','-lc++','-lc++abi','lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a','-o','program.wasm');
    const binary=api.memfs.getFileContents('program.wasm').slice();
    send('compiled',{bytes:binary.byteLength});
    if(data.action==='build') { send('done'); return; }
    api.memfs.setStdinStr(data.stdin||'');
    if(data.inputBuffer||data.nativeInput)api.memfs.readInput=createTerminalInput(data.inputBuffer,data.stdin?(data.stdin.endsWith('\n')?data.stdin:data.stdin+'\n'):'',data.nativeInput);
    phase='run'; written=0;
    send('running'); send('status',{text:'Running…'});
    const executable=await WebAssembly.compile(binary),started=performance.now();
    await api.run(executable,'program.wasm');
    send('done',{elapsedMs:performance.now()-started});
  } catch(error) { send('error',{text:error.message||String(error),phase}); }
};
