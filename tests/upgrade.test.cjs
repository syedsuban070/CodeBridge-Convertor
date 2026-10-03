const assert=require('node:assert/strict');
const Clock=require('../app/game/reward-clock.js'),P=require('../app/learning/progress.js');
const courses=require('../app/learning/courses.js'),ids=courses.flatMap(c=>c.lessons.map(l=>l.id));
const p=P.fresh(),date=new Date(2026,9,3,12);const at=(elapsed,wall,boot='one')=>({elapsed,wall,boot});
assert.equal(P.reward(p,date,at(100,1000)),true);
assert.equal(P.reward(p,new Date(2026,9,5,12),at(200,172801000)),false,'wall jump cannot grant reward');
assert.equal(Clock.observe(p,at(300,-10000)),false,'rollback does not grant reward');
assert.equal(p.dailyClock.accrued,200);
Clock.observe(p,at(5,5000,'two'));assert.equal(p.dailyClock.accrued,200,'reboot preserves earned elapsed only');
assert.equal(P.reward(p,new Date(2026,9,4,12),at(Clock.DAY+5,Clock.DAY+5000,'two')),true);
assert.equal(P.reward(p,new Date(2026,9,4,12),at(2*Clock.DAY+5,2*Clock.DAY+5000,'two')),false);
const restored=P.validate(JSON.parse(JSON.stringify(p)),ids);assert.equal(restored.coins,40);
assert.equal(courses.flatMap(c=>c.lessons).filter(l=>l.kind==='memory_boss').length,6);
for(const c of courses.filter(c=>c.id!=='py'))for(const stage of new Set(c.lessons.map(l=>l.stage)))assert.equal(c.lessons.filter(l=>l.stage===stage).at(-1).kind,'memory_boss');
for(const locale of ['en','ur','zh-Hans']){const d=require('../app/upgrade/i18n/'+locale+'.json');assert.equal(Object.keys(d.strings).length,Object.keys(require('../app/upgrade/i18n/en.json').strings).length);for(const pool of Object.values(d.dialogue))assert.ok(pool.length>=2);}
console.log('PASS wall jump, rollback, reboot, duplicate reward, save restore, six stage bosses and localized dialogue');
