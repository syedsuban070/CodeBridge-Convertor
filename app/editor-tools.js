'use strict';
(()=>{
 editor.setOption('styleActiveLine',true);
 const input=editor.getInputField();input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('spellcheck','false');
 function insert(text){
  if(editor.getOption('readOnly'))return;
  editor.focus();
  if(text==='    '){editor.execCommand('indentMore');return;}
  const pairs={'(':')','[':']','{':'}','"':'"',"'":"'"};
  const cur=editor.getCursor(),selection=editor.getSelection();
  if(CBSettings.get().closeBrackets&&pairs[text]){
   editor.replaceSelection(text+selection+pairs[text],'end','+input');
   if(!selection)editor.setCursor({line:cur.line,ch:cur.ch+1});
  }else if(CBSettings.get().closeBrackets&&')]}'.includes(text)&&editor.getLine(cur.line)[cur.ch]===text)editor.setCursor({line:cur.line,ch:cur.ch+1});
  else editor.replaceSelection(text,'end','+input');
 }
 window.CBEditor={insert};
 editor.addKeyMap({Tab:cm=>cm.somethingSelected()?cm.indentSelection('add'):cm.replaceSelection(' '.repeat(CBSettings.get().indent),'end','+input'),'Shift-Tab':cm=>cm.indentSelection('subtract')});
 const bar=document.createElement('div');bar.id='edit-actions';
 const actions=[['Undo','undo'],['Redo','redo'],['Indent','indentMore'],['Outdent','indentLess'],['Reindent','indentAuto'],['Find','find'],['Select all','selectAll']];
 for(const [title,command] of actions){const b=document.createElement('button');b.textContent=title;b.onclick=()=>{if(editor.getOption('readOnly'))return;editor.focus();if(command==='indentAuto'&&!editor.somethingSelected()){const cursor=editor.getCursor();editor.operation(()=>{for(let i=0;i<editor.lineCount();i++)editor.indentLine(i,'smart');});editor.setCursor(cursor);}else editor.execCommand(command);};bar.append(b);}
 document.getElementById('symbols').before(bar);
})();
