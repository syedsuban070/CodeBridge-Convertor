const {spawn,execFile}=require('node:child_process'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const run=(cmd,args,cwd)=>new Promise((resolve,reject)=>execFile(cmd,args,{cwd,timeout:60000,maxBuffer:1024*1024},(error,out,err)=>error?reject(new Error(err||error.message)):resolve(out)));
const find=async names=>{for(const name of names){try{await run(name,['--version']);return name;}catch{}}return null;};
let session=null,folder=null,kind=null;
async function stop(){if(session){session.kill();session=null;}if(folder){await fs.rm(folder,{recursive:true,force:true}).catch(()=>{});folder=null;}}
async function start(config,emit){
 await stop();
 const compiler=await find(['clang++','g++']),debuggerPath=await find(process.platform==='darwin'?['lldb','gdb']:['gdb','lldb']);
 if(!compiler||!debuggerPath)throw new Error('Native debugging needs Clang/G++ and GDB/LLDB installed. The bundled offline Run command does not need these tools.');
 folder=await fs.mkdtemp(path.join(os.tmpdir(),'codebridge-debug-'));
 for(const file of config.files){if(file.name.includes('..')||path.isAbsolute(file.name))throw new Error('Invalid file path');const dest=path.join(folder,file.name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,file.content);}
 const sources=config.files.filter(f=>/\.(c|cc|cpp|cxx)$/.test(f.name)&&(config.buildScope!=='file'||f.name===config.entry)).map(f=>f.name);
 if(!sources.length)throw new Error('No C/C++ source files.');
 const exe=path.join(folder,process.platform==='win32'?'program.exe':'program');
 const sourceArgs=sources.flatMap(name=>['-x',name.endsWith('.c')?'c':'c++',name]);
 await run(compiler,['-g','-O0',...sourceArgs,'-x','none','-o',exe],folder);
 kind=debuggerPath==='gdb'?'gdb':'lldb';
 const proc=spawn(debuggerPath,kind==='gdb'?['--quiet','--interpreter=mi2',exe]:['--no-lldbinit',exe],{cwd:folder,stdio:['pipe','pipe','pipe']});session=proc;
 const receive=chunk=>{const text=String(chunk);emit({event:'diagnostic',text});const line=text.match(/line="(\d+)"/)||text.match(/(?:\.cpp|\.c|\.cc):(\d+)/);if(text.includes('*stopped')||text.includes('stop reason'))emit({event:'native-paused',line:line?Number(line[1]):null});};
 proc.stdout.on('data',receive);proc.stderr.on('data',receive);proc.on('error',error=>emit({event:'error',text:error.message}));proc.on('exit',()=>{if(session===proc)session=null;emit({event:'native-exit'});});
 const write=line=>proc.stdin.write(line+'\n');
 if(kind==='gdb'){
  write('-gdb-set pagination off');write('-break-insert main');
  for(const line of config.breakpoints||[])if(Number.isInteger(line)&&line>0)write('-break-insert '+JSON.stringify(config.entry+':'+line));
  write('-exec-run');
 }else{
  write('breakpoint set --name main');
  for(const line of config.breakpoints||[])if(Number.isInteger(line)&&line>0)write('breakpoint set --file '+JSON.stringify(config.entry)+' --line '+line);
  write('run');
 }
 return {debugger:kind};
}
function command(name){if(!session)throw new Error('No native debug session');const commands={step:kind==='gdb'?'-exec-step':'thread step-in',next:kind==='gdb'?'-exec-next':'thread step-over',continue:kind==='gdb'?'-exec-continue':'continue',locals:kind==='gdb'?'-stack-list-variables --simple-values':'frame variable',stack:kind==='gdb'?'-stack-list-frames':'thread backtrace'};if(!commands[name])throw new Error('Unknown debugger command');session.stdin.write(commands[name]+'\n');}
module.exports={start,command,stop};
