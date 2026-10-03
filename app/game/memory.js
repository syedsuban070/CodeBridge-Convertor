'use strict';
(()=>{
let runtime=null,channel=null,token=null,waiting=false,auto=false,timeout=null,trace='',snapshot=null;
const dialog=document.createElement('dialog');dialog.id='memory-lab';dialog.setAttribute('aria-label','Memory Lab');dialog.innerHTML='<div class="game-dialog-head"><h2>Memory Lab</h2><button id="memory-close" aria-label="Close Memory Lab">✕</button></div><p class="small">Instrumented preset · actual compiled execution. This prototype does not debug arbitrary editor code.</p><label>Language <select id="memory-language"><option value="c">C</option><option value="cpp">C++</option></select></label><div class="memory-controls"><button id="memory-start" class="primary">Run pointer exercise</button><button id="memory-step" disabled>Step</button><button id="memory-continue" disabled>Continue</button><button id="memory-stop" disabled>Stop</button></div><p id="memory-status" role="status">Explore an array, pointer writes, allocation and free.</p><div id="memory-map"></div><pre id="memory-source"></pre>';document.body.append(dialog);
const $=id=>document.getElementById(id);
const codeLines=['int values[3] = {10, 20, 30};','int *p = &values[1];','*p = 25;','int *heap = (int*)malloc(sizeof(int));','*heap = 42;','free(heap);'];$('memory-source').textContent=codeLines.map((s,i)=>(i+1)+'  '+s).join('\n');
const source=`#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
static void snap(int step,int *a,uintptr_t p,uintptr_t h,int live,int known,int value){
 printf("@@CBM {\\"step\\":%d,\\"base\\":%u,\\"pointer\\":%u,\\"heap\\":%u,\\"live\\":%d,\\"known\\":%d,\\"value\\":%d,\\"values\\":[%d,%d,%d]}\\n",step,(unsigned)(uintptr_t)a,(unsigned)p,(unsigned)h,live,known,value,a[0],a[1],a[2]);
 if(getchar()==EOF)exit(0);
}
int main(){
 int values[3]={10,20,30};snap(1,values,0,0,0,0,0);
 int *p=&values[1];snap(2,values,(uintptr_t)p,0,0,0,0);
 *p=25;snap(3,values,(uintptr_t)p,0,0,0,0);
 int *heap=(int*)malloc(sizeof(int));if(!heap)return 1;
 uintptr_t saved=(uintptr_t)heap;snap(4,values,(uintptr_t)p,saved,1,0,0);
 *heap=42;snap(5,values,(uintptr_t)p,saved,1,1,*heap);
 free(heap);snap(6,values,(uintptr_t)p,saved,0,1,42);
 return 0;
}`;
function stop(message='Stopped'){if(token)TerminalNative.cancel(token);token=null;runtime?.terminate();runtime=null;channel=null;waiting=false;auto=false;clearTimeout(timeout);$('memory-start').disabled=false;for(const id of ['memory-step','memory-continue','memory-stop'])$(id).disabled=true;$('memory-language').disabled=false;$('memory-status').textContent=message;}
function step(){if(!waiting)return;waiting=false;$('memory-step').disabled=true;if(token)TerminalNative.submit(token,'\n',false);else{new Uint8Array(channel,8)[0]=10;const h=new Int32Array(channel,0,2);Atomics.store(h,1,1);Atomics.store(h,0,1);Atomics.notify(h,0);}timeout=setTimeout(()=>stop('Execution timeout'),30000);}
function render(s){snapshot=s;const host=$('memory-map');host.replaceChildren();const title=document.createElement('h3');title.textContent='Step '+s.step+' · '+codeLines[s.step-1];host.append(title);const cells=document.createElement('div');cells.className='memory-cells';s.values.forEach((value,i)=>{const cell=document.createElement('div');cell.className='memory-cell'+(s.pointer===s.base+i*4?' pointed':'');cell.textContent=`values[${i}]\n${value}\n@${s.base+i*4}`;cells.append(cell);});if(s.pointer){const arrow=document.createElement('div');arrow.className='memory-pointer';arrow.textContent='p ↓';host.append(arrow);}host.append(cells);for(const text of [`Stack frame: main · int = 4 bytes in this Wasm target`,s.pointer?`p → values[1] @${s.pointer}`:'p: not declared',s.heap?`Heap allocation #1 · generation 1 · @${s.heap} · ${s.live?'live, value '+(s.known?s.value:'unknown / uninitialized'):'freed; saved address is now dangling'}`:'Heap: no allocation yet','Addresses are Wasm memory offsets, not physical Android addresses.']){const p=document.createElement('p');p.textContent=text;host.append(p);}const high=document.createElement('pre');high.textContent=codeLines.map((line,i)=>(i+1===s.step?'▶ ':'  ')+(i+1)+' '+line).join('\n');$('memory-source').replaceChildren(high);}
$('memory-start').onclick=()=>{if(worker||CodeBridgeAcademy.isChecking()){info('Program active','Stop the workspace or lesson check before opening a memory session.');return;}stop();trace='';snapshot=null;$('memory-map').replaceChildren();token=window.TerminalNative?TerminalNative.begin():null;channel=!token&&typeof SharedArrayBuffer!=='undefined'?new SharedArrayBuffer(1032):null;if(!token&&!channel){stop('This browser does not support stepping. Use the Android APK.');return;}const entry='memory.'+$('memory-language').value;runtime=new Worker('engines/clang-worker.js');$('memory-start').disabled=true;$('memory-stop').disabled=false;$('memory-language').disabled=true;$('memory-status').textContent='Compiling the instrumented exercise…';timeout=setTimeout(()=>stop('Compilation timed out'),120000);
 runtime.onmessage=({data:m})=>{if(m.event==='stdout'){trace+=m.text;let at;while((at=trace.indexOf('\n'))>=0){const line=trace.slice(0,at);trace=trace.slice(at+1);if(line.startsWith('@@CBM ')){try{render(JSON.parse(line.slice(6)));}catch{stop('Invalid trace event');}}}}if(m.event==='input-request'){clearTimeout(timeout);waiting=true;$('memory-step').disabled=false;$('memory-continue').disabled=false;$('memory-status').textContent='Paused after step '+snapshot?.step;if(auto)setTimeout(step,220);}if(m.event==='error')stop(m.text);if(m.event==='done'){stop('Exercise complete · 1 allocation, 1 free, 1 pointer write.');CodeBridgeAcademy.transact(p=>{CBProgress.activity(p).memory=1;});}};runtime.onerror=e=>stop(e.message);runtime.postMessage({action:'run',entry,files:[{name:entry,content:source}],inputBuffer:channel,nativeInput:token});};
$('memory-step').onclick=step;$('memory-continue').onclick=()=>{auto=true;step();};$('memory-stop').onclick=()=>stop();$('memory-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>stop());
window.CBMemory={open:()=>dialog.showModal(),isBusy:()=>!!runtime};
})();
