/* 0.7.1: extend the existing studio, retaining its layout, editor and storage. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),locales=window.CBLocales,locale='en',lastLines={};
 document.documentElement.lang='en';document.documentElement.dir='ltr';
 try{localStorage.setItem('codebridge.locale','en');}catch{}
 const schedule=()=>{};
 $('source').dir='ltr';editor.setOption('direction','ltr');
 for(const id of ['insert-snippet','zoom-out','zoom-in','suggest-code','bit-open']){$('menu').append($(id));$(id).addEventListener('click',()=>{$('menu').hidden=true;});}
 const home=document.createElement('button');home.id='editor-home';home.textContent='‹ Home';home.onclick=()=>CodeBridgeAcademy.navigate('home');document.querySelector('header').prepend(home);

 const focus=document.createElement('button');focus.id='focus-editor';focus.textContent='Focus editor';$('menu').append(focus);
 const leave=document.createElement('button');leave.id='focus-exit';leave.textContent='Exit focus';$('execution-dock').prepend(leave);
 function setFocus(on){document.body.classList.toggle('focus-editor',on);$('menu').hidden=true;try{localStorage.setItem('codebridge.focusEditor',String(on));}catch{}requestAnimationFrame(()=>editor.refresh());}
 focus.onclick=()=>setFocus(true);leave.onclick=()=>setFocus(false);
 try{if(localStorage.getItem('codebridge.focusEditor')==='true')setFocus(true);}catch{}
 // Two-finger pinch only. A single pointer remains native scroll/selection.
 const area=$('editor-area');let pinch=null;
 const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
 area.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch={distance:distance(e.touches),font:CBSettings.get().fontSize};e.preventDefault();}},{passive:false});
 area.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){e.preventDefault();const raw=pinch.font*distance(e.touches)/Math.max(1,pinch.distance),sizes=[11,12,13,14,15,16,18,20,22,24];const size=sizes.reduce((a,b)=>Math.abs(b-raw)<Math.abs(a-raw)?b:a);if(size!==CBSettings.get().fontSize)CBSettings.set({fontSize:size});}},{passive:false});
 area.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;});area.addEventListener('touchcancel',()=>pinch=null);
 // Preserve focus when tapping edit commands so the software keyboard stays open.
 $('edit-actions').addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
 const symbols=$('symbols');symbols.setAttribute('aria-label','Coding symbols');
 symbols.replaceChildren();
 for(const text of ['    ','{','}','(',')','[',']',';',':','"',"'",'<','>','=','+','-','*','/','\\','_','&','|','!','%','#',',','.','?']){const b=document.createElement('button');b.textContent=text==='    '?'⇥':text;b.setAttribute('aria-label',text==='    '?'Indent':`Insert ${text}`);b.dataset.insert=text;b.onclick=()=>CBEditor.insert(text);symbols.append(b);}
 for(const [label,command] of [['↶','undo'],['↷','redo']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',command);b.onclick=()=>{editor.focus();editor.execCommand(command);};symbols.append(b);}
 symbols.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
 const close=document.createElement('button');close.id='drawer-close';close.textContent='Close files ✕';close.onclick=()=>$('sidebar').classList.remove('visible');$('sidebar').prepend(close);
 const previousBack=window.codebridgeBack;window.codebridgeBack=()=>{if($('sidebar').classList.contains('visible')){$('sidebar').classList.remove('visible');return true;}if(!$('menu').hidden){$('menu').hidden=true;return true;}return previousBack();};
 // Locally selected, non-repeating dialogue; never diagnoses a compile error as a segfault.
 const status=document.createElement('p');status.id='bit-status';status.setAttribute('role','status');status.dataset.noTranslate='';$('execution-dock').before(status);
 function reaction(kind){const pool=locales[locale].dialogue[kind]||locales[locale].dialogue.idle;const key=locale+':'+kind;let i=Math.floor(Math.random()*pool.length);if(i===lastLines[key])i=(i+1)%pool.length;lastLines[key]=i;status.textContent=pool[i];status.dataset.reaction=kind;window.CBFeedback?.mood(kind==='success'||kind==='bossPass'?'celebrate':kind==='memoryWarning'?'thinking':'idle',900);}
 window.addEventListener('cb:code-error',e=>{const d=e.detail||{},text=d.text||'';reaction(d.phase==='build'?'compileFailed':/SyntaxError|IndentationError/.test(text)?'pythonSyntax':/memory access out of bounds|segmentation fault/i.test(text)?'memoryFault':'compileFailed');});
 window.addEventListener('cb:run-done',()=>reaction('success'));
 window.addEventListener('cb:memory-warning',()=>reaction('memoryWarning'));
 window.addEventListener('cb:lesson-error',e=>reaction(e.detail?.boss?'bossFail':'compileFailed'));
 const chest=document.createElement('dialog');chest.id='boss-chest';document.body.append(chest);
 window.addEventListener('cb:mission',e=>{if(!e.detail?.boss)return;reaction('bossPass');decorate();if(!e.detail.first)return;chest.innerHTML='<span class="chest-icon" aria-hidden="true">♜</span><h2>Stage challenge cleared</h2><p data-no-translate></p><p>+200 XP · +10 coins</p><button class="primary">Continue</button>';chest.querySelector('[data-no-translate]').textContent=e.detail.title;chest.querySelector('button').onclick=()=>chest.close();chest.showModal();});
 function decorate(){
  document.querySelectorAll('.level-row').forEach(row=>{const boss=row.dataset.lesson?.includes('-memory-');if(boss){row.classList.add('memory-boss');if(!row.classList.contains('done'))row.querySelector('.level-number').textContent='♜';}});
  if(document.querySelector('[data-view=profile][aria-current=page]')&&!$('memory-badges')){const wrap=document.createElement('section');wrap.id='memory-badges';const h=document.createElement('h2');h.textContent='Memory badges';wrap.append(h);const list=document.createElement('div');list.className='boss-badges';const p=CodeBridgeAcademy.getProgress();for(const course of CBCourses.filter(c=>c.id!=='py'))for(const l of course.lessons.filter(l=>l.kind==='memory_boss')){const b=document.createElement('span');b.textContent=(p.completed.includes(l.id)?'♜ ':'🔒 ')+course.title+' · '+l.title;list.append(b);}wrap.append(list);$('academy').firstElementChild.append(wrap);}
 }
 new MutationObserver(()=>{decorate();schedule();}).observe($('academy'),{childList:true});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
 const back=window.codebridgeBack;window.codebridgeBack=()=>{if(chest.open){chest.close();return true;}if(document.body.classList.contains('focus-editor')&&!$('app').classList.contains('academy-mode')){setFocus(false);return true;}return back();};
 // Observe clock across app sessions without making wall-clock jumps reward time.
 const observeClock=()=>CodeBridgeAcademy.transact(p=>CBRewardClock.observe(p));
 setInterval(observeClock,60000);document.addEventListener('visibilitychange',()=>{if(document.hidden)observeClock();});
 // The splash is already in the initial HTML, before the application can paint.
 const splash=$('upgrade-splash');
 const ready=()=>{document.documentElement.classList.remove('booting');splash?.remove();editor.refresh();};
 if(!CBSettings.get().motion||matchMedia('(prefers-reduced-motion:reduce)').matches)ready();
 else Promise.all([new Promise(resolve=>setTimeout(resolve,700)),document.fonts.load('900 28px Orbitron').catch(()=>{})]).then(ready);
 window.CBUpgrade={getLocale:()=>locale,reaction,setFocus};reaction('idle');decorate();
})();
