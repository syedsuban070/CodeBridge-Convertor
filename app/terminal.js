'use strict';
(()=>{
 const form=document.createElement('form');form.id='terminal-input';form.hidden=true;
 form.innerHTML='<label for="terminal-line">stdin ›</label><input id="terminal-line" aria-label="Terminal input" placeholder="Type input, then Enter" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="send"><button type="submit">Send ↵</button><button type="button" id="terminal-eof" title="End input (Ctrl+D)">EOF</button>';
 document.getElementById('console').append(form);
 if(typeof SharedArrayBuffer==='undefined'&&!window.TerminalNative){const note=document.createElement('p');note.className='terminal-notice';note.textContent='Live input needs an updated Android System WebView. Use Preload Input on this device until it is available.';form.before(note);}
 const line=document.getElementById('terminal-line');let buffer=null,nativeToken=null,waiting=false,history=[],index=0;
 function submit(eof=false){
  if((!buffer&&!nativeToken)||!waiting)return;
  const bytes=new TextEncoder().encode(line.value+'\n');
  if(!eof&&bytes.length>16384){status('Input line too long (maximum 16 KB).');return;}
  const header=buffer?new Int32Array(buffer,0,2):null;
  if(!eof){if(buffer){new Uint8Array(buffer,8).set(bytes);Atomics.store(header,1,bytes.length);}output(line.value+'\n');history.push(line.value);index=history.length;}
  const text=line.value+'\n';line.value='';waiting=false;line.disabled=true;
  if(nativeToken)TerminalNative.submit(nativeToken,text,eof);
  else {Atomics.store(header,0,eof?2:1);Atomics.notify(header,0);}
  form.hidden=true;status(eof?'Input closed':'Running…');
 }
 form.onsubmit=e=>{e.preventDefault();submit();};document.getElementById('terminal-eof').onclick=()=>submit(true);
 line.onkeydown=e=>{if(e.ctrlKey&&e.key.toLowerCase()==='d'){e.preventDefault();submit(true);}if(e.ctrlKey&&e.key.toLowerCase()==='c'){e.preventDefault();stop();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();index=Math.max(0,Math.min(history.length,index+(e.key==='ArrowUp'?-1:1)));line.value=history[index]||'';}};
 window.CBTerminal={
  start(){nativeToken=window.TerminalNative?TerminalNative.begin():null;buffer=!nativeToken&&typeof SharedArrayBuffer!=='undefined'?new SharedArrayBuffer(16392):null;waiting=false;form.hidden=true;return {inputBuffer:buffer,nativeInput:nativeToken};},
  request(){clearTimeout(timer);waiting=true;panel('output');form.hidden=false;line.disabled=false;status('Waiting for input · Enter to send');line.focus();},
  end(){if(nativeToken)TerminalNative.cancel(nativeToken);nativeToken=null;buffer=null;waiting=false;form.hidden=true;line.blur();},
  submit, get waiting(){return waiting;}
 };
})();
