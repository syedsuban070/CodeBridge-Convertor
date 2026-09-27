(function(root){
'use strict';
const day=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function previous(date=new Date()){const d=new Date(date);d.setDate(d.getDate()-1);return day(d);}
const fresh=()=>({version:1,name:'Explorer',completed:[],quiz:[],xp:0,coins:0,streak:0,lastActive:null,lastReward:null,days:{},claims:[],drafts:{},lastLesson:'c-1'});
function validate(p,ids){
 if(!p||p.version!==1||!Array.isArray(p.completed)||!Array.isArray(p.quiz)||!p.drafts||typeof p.drafts!=='object'||Array.isArray(p.drafts)||!p.days||typeof p.days!=='object'||Array.isArray(p.days)||!Array.isArray(p.claims))throw Error('This is not a CodeBridge progress backup.');
 for(const k of ['lastActive','lastReward'])if(p[k]!==null&&(typeof p[k]!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p[k])))throw Error('Invalid reward date.');
 if(typeof p.lastLesson!=='string'||!ids.includes(p.lastLesson))throw Error('Invalid current mission.');
 for(const n of ['xp','coins','streak'])if(!Number.isSafeInteger(p[n])||p[n]<0||p[n]>10000000)throw Error('Invalid progress totals.');
 if(p.completed.some(x=>!ids.includes(x))||p.quiz.some(x=>!ids.includes(x)))throw Error('Unknown course in backup.');
 if(Object.entries(p.drafts).some(([k,v])=>!ids.includes(k)||typeof v!=='string'||v.length>100000))throw Error('Invalid lesson draft.');
 for(const [key,value] of Object.entries(p.days))if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!value||!Number.isSafeInteger(value.lessons)||value.lessons<0||!Number.isSafeInteger(value.runs)||value.runs<0)throw Error('Invalid activity history.');
 if(p.claims.some(x=>typeof x!=='string'||x.length>100))throw Error('Invalid reward history.');
 return {...fresh(),...p,name:String(p.name||'Explorer').slice(0,24),completed:[...new Set(p.completed)],quiz:[...new Set(p.quiz)]};
}
function activity(p,date=new Date()) {const today=day(date); if(p.lastActive!==today){p.streak=p.lastActive===previous(date)?p.streak+1:1;p.lastActive=today;}return p.days[today]||(p.days[today]={lessons:0,runs:0});}
function complete(p,lesson,date=new Date()){if(p.completed.includes(lesson.id))return false;p.completed.push(lesson.id);p.xp+=lesson.xp;p.coins+=10;activity(p,date).lessons++;return true;}
function reward(p,date=new Date()){const today=day(date);if(p.lastReward&&p.lastReward>=today)return false;activity(p,date);p.lastReward=today;p.coins+=20;return true;}
function claim(p,type,date=new Date()){const today=day(date),key=today+':'+type,stats=p.days[today]||{};if(p.claims.includes(key))return false;const ok=type==='lesson'?stats.lessons>=1:type==='practice'?stats.runs>=2:type==='explorer'?stats.lessons>=3:false;if(!ok)return false;p.claims.push(key);p.xp+=25;p.coins+=15;return true;}
const api={day,previous,fresh,validate,activity,complete,reward,claim};if(typeof module!=='undefined')module.exports=api;else root.CBProgress=api;
})(globalThis);
