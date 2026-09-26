importScripts('../vendor/clang/shared-adapted.js');
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
    const directories=new Set();
    for(const file of data.files) {
      if(!/^[\w. /-]+$/.test(file.name)||file.name.split('/').some(x=>x==='..'||x==='')||file.name.startsWith('/')) throw new Error('Invalid project path: '+file.name);
      const parts=file.name.split('/'); parts.pop(); let dir='';
      for(const part of parts) { dir=dir ? dir+'/'+part:part; if(!directories.has(dir)){api.memfs.addDirectory(dir);directories.add(dir);} }
      api.memfs.addFile(file.name,new TextEncoder().encode(file.content));
    }
    const units=data.files.filter(f=>/\.(c|cc|cpp|cxx)$/.test(f.name));
    if(!units.length) throw new Error('Project has no C or C++ source files.');
    const clang=await api.getModule('clang'), objects=[];
    for(let i=0;i<units.length;i++) {
      const file=units[i], cpp=!file.name.endsWith('.c'), object=`cb_${i}.o`;
      send('status',{text:'Compiling '+file.name});
      await api.run(clang,'clang','-cc1','-emit-obj',...api.clangCommonArgs,'-I.','-O0',cpp?'-std=c++17':'-std=c11','-o',object,'-x',cpp?'c++':'c',file.name);
      objects.push(object);
    }
    send('status',{text:'Linking…'});
    const linker=await api.getModule('lld'), lib='lib/wasm32-wasi';
    await api.run(linker,'wasm-ld','--no-threads','-z','stack-size=1048576','-L'+lib,lib+'/crt1.o',...objects,'-lc','-lc++','-lc++abi','lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a','-o','program.wasm');
    const binary=api.memfs.getFileContents('program.wasm').slice();
    send('compiled',{bytes:binary.byteLength});
    if(data.action==='build') { send('done'); return; }
    api.memfs.setStdinStr(data.stdin||''); phase='run'; written=0;
    send('running'); send('status',{text:'Running…'});
    await api.run(await WebAssembly.compile(binary),'program.wasm');
    send('done');
  } catch(error) { send('error',{text:error.message||String(error),phase}); }
};
