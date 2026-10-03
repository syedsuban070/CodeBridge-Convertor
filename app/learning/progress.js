(function(root){
'use strict';
const E=typeof module!=='undefined'?require('../game/economy.js'):root.CBEconomy;
const Clock=typeof module!=='undefined'?require('../game/reward-clock.js'):root.CBRewardClock;
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
 for(const value of Object.values(p.days))if(value.memory!==undefined&&value.memory!==0&&value.memory!==1)throw Error('Invalid memory activity.');
 if(p.reports){if(typeof p.reports!=='object'||Array.isArray(p.reports))throw Error('Invalid reports');for(const [id,r]of Object.entries(p.reports))if(!ids.includes(id)||!r||!Number.isFinite(r.ms)||r.ms<0||typeof r.noisy!=='boolean'||typeof r.fingerprint!=='string'||r.fingerprint.length>1000)throw Error('Invalid report');}
 if(p.claims.some(x=>typeof x!=='string'||x.length>100))throw Error('Invalid reward history.');
 E.validate(p);
 return {...fresh(),...p,name:String(p.name||'Explorer').slice(0,24),completed:[...new Set(p.completed)],quiz:[...new Set(p.quiz)]};
}
function activity(p,date=new Date()) {const today=day(date); if(p.lastActive!==today){p.streak=p.lastActive===previous(date)?p.streak+1:1;p.lastActive=today;}return p.days[today]||(p.days[today]={lessons:0,runs:0});}
function complete(p,lesson,date=new Date()){if(p.completed.includes(lesson.id))return false;E.credit(p,'mission:'+lesson.id,10,lesson.xp,lesson.id);p.completed.push(lesson.id);activity(p,date).lessons++;return true;}
function reward(p,date=new Date(),sample=Clock.sample()){E.init(p);const today=day(date);if(p.lastReward&&p.lastReward>=today)return false;if(!Clock.observe(p,sample))return false;Clock.consume(p);activity(p,date);p.lastReward=today;E.credit(p,'daily:'+today,20,0,'daily-discovery');return true;}
function claim(p,type,date=new Date()){E.init(p);const today=day(date),key=today+':'+type,stats=p.days[today]||{};if(p.claims.includes(key))return false;const ok=type==='lesson'?stats.lessons>=1:type==='practice'?stats.runs>=2:type==='explorer'?stats.lessons>=3:type==='memory'?stats.memory===1:false;if(!ok)return false;p.claims.push(key);E.credit(p,'quest:'+key,15,25,type);return true;}
const api={day,previous,fresh,validate,activity,complete,reward,claim};if(typeof module!=='undefined')module.exports=api;else root.CBProgress=api;
})(globalThis);
