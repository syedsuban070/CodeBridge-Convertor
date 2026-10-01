'use strict';
(()=>{
const median=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)];};
window.addEventListener('cb:mission',({detail:d})=>{
 const samples=d.samples.filter(s=>Number.isFinite(s.ms)&&s.ms>=0);if(samples.length!==d.cases*3)return;
 const groups=Array.from({length:d.cases},(_,i)=>samples.filter(s=>s.case===i).map(s=>s.ms));const total=groups.reduce((n,a)=>n+median(a),0);
 let device=localStorage.getItem('codebridge.benchmark.device');if(!device){device=crypto.randomUUID();localStorage.setItem('codebridge.benchmark.device',device);}let hash=2166136261;for(const c of d.testSignature){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
 const fingerprint=device+'|'+navigator.userAgent+'|0.7-clang8-pyodide0277|'+d.language+'|'+(hash>>>0);
 const previous=CodeBridgeAcademy.getProgress().reports?.[d.id];const noisy=groups.some(a=>Math.max(...a)-Math.min(...a)>Math.max(1,median(a)*.3));
 let comparison='First measurement on this runtime.';
 if(previous?.fingerprint===fingerprint){const delta=previous.ms-total;comparison=noisy||previous.noisy||Math.abs(delta)<Math.max(1,previous.ms*.15)?'No reliable difference from your previous run.':`${Math.abs(delta).toFixed(2)} ms ${delta>0?'faster':'slower'} than your previous run.`;}
 CodeBridgeAcademy.transact(p=>{p.reports??={};p.reports[d.id]={ms:total,noisy,fingerprint};});
 document.getElementById('after-action-report')?.remove();const card=document.createElement('section');card.id='after-action-report';card.className='surface after-action';
 const h=document.createElement('h3');h.textContent='After-Action Report';card.append(h);
 for(const [label,value]of [['Correctness',`${d.cases}/${d.cases} test cases passed`],['Execution',`${total.toFixed(2)} ms · sum of per-case medians`],['Comparison',comparison],['Efficiency','Operation counts are not instrumented for this mission. No Big-O grade is inferred.'],['Next experiment','Try a boundary input, remove unnecessary repeated work, then check again.']]){const row=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+' · ';row.append(strong,document.createTextNode(value));card.append(row);}
 const note=document.createElement('small');note.textContent='One warm-up + three measured executions per case. Loading and compilation excluded. Compare only on this device and runtime.';card.append(note);document.getElementById('lesson-feedback')?.after(card);
});
})();
