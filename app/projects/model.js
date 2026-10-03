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
 for(const key of [KEY,KEY+'.backup']){try{const raw=storage.getItem(key);if(raw){const state=validate(JSON.parse(raw));return {state,recovered:damaged||key.endsWith('.backup')};}}catch{damaged=true;}}
 let old=fallback;try{const raw=storage.getItem('codebridge.project');if(raw)old=JSON.parse(raw);}catch{}
 let p;try{p=normalize(old);}catch{p=normalize(fallback);}
 return {state:{version:1,activeId:p.id,projects:[p]},recovered:damaged};
}
function write(storage,state){const next=JSON.stringify(validate(state));const previous=storage.getItem(KEY);if(previous){try{validate(JSON.parse(previous));storage.setItem(KEY+'.backup',previous);}catch(error){if(error?.name==='QuotaExceededError')throw error;}}storage.setItem(KEY,next);return true;}
function units(files,entry,scope){const candidates=files.filter(f=>source.test(f.name));if(scope==='project')return candidates;return candidates.filter(f=>f.name===entry);}
function request(p){const entry=p.buildScope==='project'?(p.files.some(f=>f.name===p.entry)?p.entry:p.active):p.active;return {entry,files:p.files,source:p.files.find(f=>f.name===entry)?.content||'',buildScope:p.buildScope==='project'?'project':'file',compiler:p.compiler||{}};}
const api={KEY,id,validPath,language,normalize,validate,load,write,units,request};if(typeof module!=='undefined')module.exports=api;else root.CBProjectsModel=api;
})(globalThis);
