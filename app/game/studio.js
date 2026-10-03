'use strict';
(()=>{
const $=document.getElementById.bind(document),app=$('app');
const dock=document.createElement('div');dock.id='execution-dock';dock.innerHTML='<span id="dock-label">READY TO BUILD</span><button id="tools-toggle" aria-label="Execution tools" aria-expanded="false">✣ Tools</button>';
const tools=document.createElement('div');tools.id='execution-tools';tools.hidden=true;tools.setAttribute('aria-label','Execution tools');
for(const id of ['build','debug','console-open','input-open'])tools.append($(id));
const memory=document.createElement('button');memory.id='memory-open';memory.textContent='Memory Lab';memory.onclick=()=>window.CBMemory.open();tools.append(memory);
dock.append($('run'),$('stop'),tools);app.querySelector('.workspace').append(dock);
for(const id of ['save','convert'])$('menu').prepend($(id));
$('run').setAttribute('aria-label','Run program');$('stop').setAttribute('aria-label','Stop program');
$('tools-toggle').onclick=()=>{CBOverlays.toggle(tools);$('tools-toggle').setAttribute('aria-expanded',String(!tools.hidden));};
tools.addEventListener('click',e=>{if(e.target.closest('button')){tools.hidden=true;$('tools-toggle').setAttribute('aria-expanded','false');}});
const refresh=()=>{$('run').hidden=$('run').disabled;$('stop').hidden=$('stop').disabled;$('dock-label').textContent=$('run').disabled?'PROGRAM ACTIVE':'READY TO BUILD';};new MutationObserver(refresh).observe($('run'),{attributes:true,attributeFilter:['disabled']});refresh();
})();
