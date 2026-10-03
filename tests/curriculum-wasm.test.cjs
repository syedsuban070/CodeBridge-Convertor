const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const courses=require('../app/learning/courses.js');
const root=path.resolve(__dirname,'../app/vendor/clang');
vm.runInThisContext(fs.readFileSync(path.join(root,'shared-adapted.js'),'utf8')+'\nglobal.ClangAPI=API;');
(async()=>{
let output='';const bytes=async name=>{const b=fs.readFileSync(path.join(root,name));return b.buffer.slice(b.byteOffset,b.byteOffset+b.length);};
const api=new global.ClangAPI({readBuffer:bytes,compileStreaming:async name=>WebAssembly.compile(await bytes(name)),hostWrite:t=>output+=t});api.hostLog=()=>{};api.hostLogAsync=(_,p)=>p;await api.ready;
const clang=await api.getModule('clang'),lld=await api.getModule('lld');let checks=0;
for(const course of courses.filter(c=>c.id!=='py'))for(const lesson of course.lessons){
const name='main.'+course.id;api.memfs.addFile(name,lesson.referenceSource||lesson.solution);
await api.run(clang,'clang','-cc1','-emit-obj',...api.clangCommonArgs,'-O0','-o','test.o','-x',course.id==='c'?'c':'c++',name);
await api.run(lld,'wasm-ld','--no-threads','-z','stack-size=1048576','-Llib/wasm32-wasi','lib/wasm32-wasi/crt1.o','test.o','-lc','-lc++','-lc++abi','lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a','-o','test.wasm');
const mod=await WebAssembly.compile(api.memfs.getFileContents('test.wasm').slice());
for(const test of lesson.cases){output='';api.memfs.setStdinStr(test.input+'\n');await api.run(mod,'test.wasm');assert.equal(output.trim().replace(/\s+/g,' '),test.output.trim().replace(/\s+/g,' '),lesson.id);checks++;}
console.log('PASS bundled Clang',lesson.id);
}console.log('PASS',checks,'curriculum checks in the bundled WebAssembly runtime');
})().catch(e=>{console.error(e);process.exitCode=1;});
