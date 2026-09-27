(function(root){
'use strict';
const defaults={theme:'midnight',editorTheme:'night',fontSize:14,indent:4,wrap:false,lineNumbers:true,closeBrackets:true,sound:false,motion:true,timeout:30};
function validate(value){const s={...defaults};if(!value||typeof value!=='object')return s;for(const k of ['wrap','lineNumbers','closeBrackets','sound','motion'])if(typeof value[k]==='boolean')s[k]=value[k];for(const [k,options] of Object.entries({theme:['midnight','forest','violet','paper'],editorTheme:['night','ocean','plum','day'],fontSize:[11,12,13,14,15,16,18,20,22,24],indent:[2,4,8],timeout:[30,60,120]}))if(options.includes(value[k]))s[k]=value[k];return s;}
let value={...defaults};try{value=validate(JSON.parse(localStorage.getItem('codebridge.settings.v1')));}catch{}
const api={defaults,validate,get:()=>({...value}),set:patch=>{value=validate({...value,...patch});try{localStorage.setItem('codebridge.settings.v1',JSON.stringify(value));}catch{root.dispatchEvent(new CustomEvent('cb:storage-error'));}root.dispatchEvent(new CustomEvent('cb:settings',{detail:api.get()}));return api.get();}};
if(typeof module!=='undefined')module.exports={defaults,validate};else root.CBSettings=api;
})(globalThis);
