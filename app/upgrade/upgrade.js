/* 0.7.1: extend the existing studio, retaining its layout, editor and storage. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),locales=window.CBLocales;
 let locale='en';try{locale=localStorage.getItem('codebridge.locale')||'en';}catch{}if(!locales[locale])locale='en';
 const sourceText=new WeakMap(),lastLines={};let translating=false,scheduled=false;
 const t=text=>locales[locale].strings[text]||text;
 function translate(){
  scheduled=false;if(translating)return;translating=true;
  document.documentElement.lang=locale;document.documentElement.dir=locales[locale].direction;
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;while((n=walk.nextNode())){
   if(!n.parentElement||n.parentElement.closest('script,style,textarea,input,pre,.CodeMirror,.case,[data-no-translate]'))continue;
   const value=n.textContent.trim();if(!value)continue;
   let saved=sourceText.get(n);
   if(!saved||(!Object.values(locales).some(l=>l.strings[saved]===value)&&value!==saved))saved=value;
   sourceText.set(n,saved);const next=t(saved);if(next!==value)n.textContent=n.textContent.replace(value,next);
  }
  document.querySelectorAll('[data-locale]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.locale===locale)));
  translating=false;
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(translate);}}
 function choose(next){if(!locales[next])return;locale=next;try{localStorage.setItem('codebridge.locale',next);}catch{}$('first-language')?.remove();translate();if(window.CBUpgrade)reaction('idle');}
 function buttons(){const row=document.createElement('div');row.className='language-options';row.dataset.noTranslate='';for(const [id,label]of [['en','English'],['ur','اردو'],['zh-Hans','简体中文']]){const b=document.createElement('button');b.dataset.locale=id;b.lang=id;b.dir=id==='ur'?'rtl':'ltr';b.textContent=label;b.onclick=()=>choose(id);row.append(b);}return row;}
 function languageCard(){const card=document.createElement('section');card.className='upgrade-language';const label=document.createElement('strong');label.textContent='Choose your language';card.append(label,buttons());return card;}
 let selected=false;try{selected=!!localStorage.getItem('codebridge.locale');}catch{}
 if(!selected){const card=languageCard();card.id='first-language';$('academy').prepend(card);}
 const languageButton=document.createElement('button');languageButton.id='language-open';languageButton.textContent='Language';$('menu').append(languageButton);
 const langDialog=document.createElement('dialog');langDialog.id='language-dialog';langDialog.append(languageCard());const close=document.createElement('button');close.textContent='Close';close.onclick=()=>langDialog.close();langDialog.append(close);document.body.append(langDialog);
 languageButton.onclick=()=>{$('menu').hidden=true;langDialog.showModal();};
 const oldSettings=CBExperience.showSettings;
 $('settings-open').onclick=()=>{oldSettings();const card=languageCard();$('settings-content').prepend(card);schedule();};
 // Source, output and editor coordinates are always LTR, even in Urdu UI.
 $('source').dir='ltr';editor.setOption('direction','ltr');
 $('menu').append($('insert-snippet'));
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
 let fullHeight=innerHeight,typingTimer;
 function typing(){clearTimeout(typingTimer);typingTimer=setTimeout(()=>{fullHeight=Math.max(fullHeight,innerHeight);const inset=fullHeight-(visualViewport?.height||innerHeight);const active=editor.hasFocus()&&inset>100;document.body.classList.toggle('editor-typing',active);},80);}
 visualViewport?.addEventListener('resize',typing);document.addEventListener('focusin',typing);document.addEventListener('focusout',typing);window.addEventListener('orientationchange',()=>{fullHeight=innerHeight;typing();});
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
 const back=window.codebridgeBack;window.codebridgeBack=()=>{if(chest.open){chest.close();return true;}if(langDialog.open){langDialog.close();return true;}if(document.body.classList.contains('focus-editor')&&!$('app').classList.contains('academy-mode')){setFocus(false);return true;}return back();};
 // Observe clock across app sessions without making wall-clock jumps reward time.
 const observeClock=()=>CodeBridgeAcademy.transact(p=>CBRewardClock.observe(p));
 setInterval(observeClock,60000);document.addEventListener('visibilitychange',()=>{if(document.hidden)observeClock();});
 // Existing users land directly on their familiar home. Intro is a one-shot local stroke.
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&CBSettings.get().motion){const splash=document.createElement('div');splash.id='upgrade-splash';splash.setAttribute('aria-hidden','true');splash.innerHTML='<svg viewBox="0 0 220 80"><path pathLength="180" d="M65 15L25 40 65 65M155 15l40 25-40 25M125 8L95 72"/></svg><strong>CodeBridge</strong>';document.body.append(splash);setTimeout(()=>splash.remove(),950);}
 window.CBUpgrade={chooseLocale:choose,getLocale:()=>locale,reaction,setFocus};reaction('idle');decorate();translate();
})();
