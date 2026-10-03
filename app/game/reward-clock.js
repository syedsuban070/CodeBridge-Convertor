/* Wall-clock changes cannot mint daily coins. Reboots preserve earned elapsed time. */
(function(root){'use strict';
const DAY=86400000,session='web-'+Math.random().toString(36).slice(2);
function sample(){try{if(root.AndroidFiles?.clockSample)return JSON.parse(root.AndroidFiles.clockSample());}catch{}return {boot:session,elapsed:root.performance?.now()||0,wall:Date.now()};}
function observe(p,now=sample()){
 if(!now||typeof now.boot!=='string'||!Number.isFinite(now.elapsed)||now.elapsed<0||!Number.isFinite(now.wall))return false;
 let c=p.dailyClock;
 if(!c||typeof c.boot!=='string'||!Number.isFinite(c.elapsed)||!Number.isFinite(c.accrued)||c.accrued<0||c.accrued>DAY)c=p.dailyClock={boot:now.boot,elapsed:now.elapsed,wall:now.wall,accrued:p.lastReward?0:DAY};
 if(c.boot===now.boot&&now.elapsed>=c.elapsed){const delta=now.elapsed-c.elapsed;c.accrued=Math.min(DAY,c.accrued+delta);if(Math.abs(now.wall-c.wall-delta)>300000)c.clockChanged=true;}
 // Never trust a wall-clock gap across reboot. Accrual resumes from this sample.
 c.boot=now.boot;c.elapsed=now.elapsed;c.wall=now.wall;return c.accrued>=DAY;
}
function consume(p){if(p.dailyClock)p.dailyClock.accrued=0;}
const api={DAY,sample,observe,consume};if(typeof module!=='undefined')module.exports=api;else root.CBRewardClock=api;
})(globalThis);
