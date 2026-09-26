const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../app/vendor/clang');
vm.runInThisContext(fs.readFileSync(path.join(root,'shared-adapted.js'),'utf8')+'\nglobal.ClangAPI=API;');
async function test(){
 let out='';
 const bytes=async name=>{const b=fs.readFileSync(path.join(root,name));return b.buffer.slice(b.byteOffset,b.byteOffset+b.length);};
 const api=new global.ClangAPI({readBuffer:bytes,compileStreaming:async name=>WebAssembly.compile(await bytes(name)),hostWrite:text=>{out+=text;process.stderr.write(text)}});
 api.hostLog=()=>{};api.hostLogAsync=(_,p)=>p;await api.ready;
 const clang=await api.getModule('clang'),lld=await api.getModule('lld');
 for(const [name,src,stdin,expected] of [
 ['vectors.cpp','#include <iostream>\n#include <vector>\n#include <algorithm>\nint main(){std::vector<int> a={7,2,5};std::sort(a.begin(),a.end());for(int x:a)std::cout<<x<<" ";}', '', '2 5 7 '],
 ['input.c','#include <stdio.h>\nint main(){int a,b;scanf("%d %d",&a,&b);printf("%d\\n",a+b);}', '12 30','42\n']]){
  api.memfs.addFile(name,src);
  await api.run(clang,'clang','-cc1','-emit-obj',...api.clangCommonArgs,'-O0','-o','test.o','-x',name.endsWith('.c')?'c':'c++',name);
  await api.run(lld,'wasm-ld','--no-threads','-z','stack-size=1048576','-Llib/wasm32-wasi','lib/wasm32-wasi/crt1.o','test.o','-lc','-lc++','-lc++abi','lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a','-o','test.wasm');
  const binary=api.memfs.getFileContents('test.wasm').slice();api.memfs.setStdinStr(stdin);out='';
  await api.run(await WebAssembly.compile(binary),'test.wasm'); assert.equal(out,expected);console.log('PASS',name);
 }
 api.memfs.addFile('bad.c','int main(){ invalid syntax }');
 await assert.rejects(api.run(clang,'clang','-cc1','-emit-obj',...api.clangCommonArgs,'-o','bad.o','-x','c','bad.c'));
 console.log('PASS invalid program rejected');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
