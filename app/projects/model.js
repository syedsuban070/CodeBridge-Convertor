/* Project format and build selection shared by the studio and worker. */
(function(root){
'use strict';
const KEY='codebridge.projects.v1',source=/\.(c|cc|cpp|cxx)$/i;
const id=()=>root.crypto?.randomUUID?.()||'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const validPath=name=>typeof name==='string'&&name.length>0&&name.length<180&&/^[\w. /-]+$/.test(name)&&!name.startsWith('/')&&!name.split('/').some(p=>p==='..'||!p);
function language(name){return /\.py$/i.test(name)?'py':/\.c$/i.test(name)?'c':'cpp';}
function normalize(p){
 if(!p||!Array.isArray(p.files)||!p.files.length||p.files.length>200)throw new Error('Project needs 1–200 files.');
 if(p.files.some(f=>!f||!validPath(f.name)||typeof f.content!=='string'||f.content.length>8000000)||new Set(p.files.map(f=>f.name)).size!==p.files.length)throw new Error('Invalid or duplicate project filenames.');
 const active=p.files.some(f=>f.name===p.active)?p.active:p.files[0].name,lang=['c','cpp','py'].includes(p.language)?p.language:language(active),options=p.compiler||{};
 return {id:typeof p.id==='string'&&/^[\w-]{1,100}$/.test(p.id)?p.id:id(),name:String(p.name||'Untitled project').trim().slice(0,80)||'Untitled project',language:lang,active,entry:p.files.some(f=>f.name===p.entry)?p.entry:active,buildScope:p.buildScope==='project'?'project':'file',compiler:{cStandard:['c99','c11','c17'].includes(options.cStandard)?options.cStandard:'c11',cppStandard:['c++11','c++14','c++17'].includes(options.cppStandard)?options.cppStandard:'c++17',optimization:['O0','O1','O2'].includes(options.optimization)?options.optimization:'O0'},files:p.files.map(f=>({name:f.name,content:f.content})),breakpoints:Object.fromEntries(p.files.map(f=>[f.name,Array.isArray(p.breakpoints?.[f.name])?p.breakpoints[f.name].filter(n=>Number.isInteger(n)&&n>0):[]])),updatedAt:Number.isFinite(p.updatedAt)?p.updatedAt:Date.now()};
}
function validate(value){if(!value||value.version!==1||!Array.isArray(value.projects)||!value.projects.length||value.projects.length>100)throw new Error('Invalid project library.');const projects=value.projects.map(normalize);if(new Set(projects.map(p=>p.id)).size!==projects.length)throw new Error('Duplicate project identifiers.');return {version:1,activeId:projects.some(p=>p.id===value.activeId)?value.activeId:projects[0].id,projects};}
function load(storage,fallback){
 let damaged=false;
 for(const key of [KEY,KEY+'.backup']){try{const raw=storage.getItem(key);if(raw){const state=validate(JSON.parse(raw));const recoveredJournal=recover(storage,state);return {state,recovered:damaged||key.endsWith('.backup')||recoveredJournal};}}catch{damaged=true;}}
 let old=fallback;try{const raw=storage.getItem('codebridge.project');if(raw)old=JSON.parse(raw);}catch{}
 let p;try{p=normalize(old);}catch{p=normalize(fallback);}
 return {state:{version:1,activeId:p.id,projects:[p]},recovered:damaged};
}
function write(storage,state){const next=JSON.stringify(validate(state));const previous=storage.getItem(KEY);if(previous){try{validate(JSON.parse(previous));storage.setItem(KEY+'.backup',previous);}catch(error){if(error?.name==='QuotaExceededError')throw error;}}storage.setItem(KEY,next);storage.removeItem?.(KEY+'.journal');return true;}
function units(files,entry,scope){const candidates=files.filter(f=>source.test(f.name));if(scope==='project')return candidates;return candidates.filter(f=>f.name===entry);}
function request(p){const entry=p.buildScope==='project'?(p.files.some(f=>f.name===p.entry)?p.entry:p.active):p.active;return {entry,files:p.files,source:p.files.find(f=>f.name===entry)?.content||'',buildScope:p.buildScope==='project'?'project':'file',compiler:p.compiler||{}};}
function journal(storage,project,change){const key=KEY+'.journal';try{let j;try{j=JSON.parse(storage.getItem(key));}catch{}if(!j||j.projectId!==project.id||j.file!==project.active||j.base!==project.updatedAt)j={version:1,projectId:project.id,file:project.active,base:project.updatedAt,changes:[]};if(j.changes.length>=500)return false;j.changes.push({from:change.from,to:change.to,text:change.text});storage.setItem(key,JSON.stringify(j));return true;}catch{return false;}}
function recover(storage,state){try{const raw=storage.getItem(KEY+'.journal');if(!raw||raw.length>8000000)return false;const j=JSON.parse(raw),p=state.projects.find(p=>p.id===j.projectId),f=p?.files.find(f=>f.name===j.file);if(!f||j.version!==1||j.base!==p.updatedAt||!Array.isArray(j.changes)||j.changes.length>500)return false;let lines=f.content.split('\n');for(const c of j.changes){if(!c.from||!c.to||!Array.isArray(c.text)||c.text.some(t=>typeof t!=='string')||![c.from.line,c.from.ch,c.to.line,c.to.ch].every(Number.isInteger)||c.from.line<0||c.from.line>c.to.line||c.to.line>=lines.length||c.from.ch<0||c.to.ch<0||c.from.ch>lines[c.from.line].length||c.to.ch>lines[c.to.line].length||c.from.line===c.to.line&&c.from.ch>c.to.ch)return false;const inserted=(lines[c.from.line].slice(0,c.from.ch)+c.text.join('\n')+lines[c.to.line].slice(c.to.ch)).split('\n');lines.splice(c.from.line,c.to.line-c.from.line+1,...inserted);if(lines.join('\n').length>8000000)return false;}f.content=lines.join('\n');return true;}catch{return false;}}
const api={KEY,id,validPath,language,normalize,validate,load,write,units,request,journal,recover};if(typeof module!=='undefined')module.exports=api;else root.CBProjectsModel=api;
})(globalThis);
