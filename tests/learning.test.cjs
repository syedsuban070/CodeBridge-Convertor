const assert=require('node:assert/strict');
const P=require('../app/learning/progress.js'),courses=require('../app/learning/courses.js');
const ids=courses.flatMap(c=>c.lessons.map(l=>l.id));assert.equal(ids.length,33);assert.equal(new Set(ids).size,33);
let p=P.fresh(),d=new Date(2026,8,27,12),tomorrow=new Date(2026,8,28,12);
assert.equal(P.reward(p,d),true);assert.equal(P.reward(p,d),false);assert.equal(p.coins,20);
assert.equal(P.complete(p,courses[0].lessons[0],d),true);assert.equal(P.complete(p,courses[0].lessons[0],d),false);assert.equal(p.xp,40);assert.equal(p.days[P.day(d)].lessons,1);
assert.equal(P.claim(p,'practice',d),false);P.activity(p,d).runs+=2;assert.equal(P.claim(p,'practice',d),true);assert.equal(P.claim(p,'practice',d),false);assert.equal(P.claim(p,'lesson',d),true);assert.equal(P.claim(p,'explorer',d),false);
assert.equal(P.reward(p,tomorrow),true);assert.equal(p.streak,2);assert.equal(P.reward(p,d),false);
P.activity(p,new Date(2026,8,30));assert.equal(p.streak,1);
p.drafts['c-1']='draft';const restored=P.validate(JSON.parse(JSON.stringify(p)),ids);assert.deepEqual(restored,p);
assert.throws(()=>P.validate({...p,xp:-1},ids));assert.throws(()=>P.validate({...p,completed:['missing']},ids));assert.throws(()=>P.validate({...p,drafts:{'c-1':42}},ids));assert.throws(()=>P.validate({...p,days:{bad:{runs:1,lessons:1}}},ids));
for(const c of courses)for(const l of c.lessons){assert.ok(l.options[l.answer]);assert.ok(l.cases.length);assert.ok(l.solution);assert.ok(l.starter);assert.ok(l.xp>0);}
console.log('PASS 33 lesson definitions; daily rollover, duplicate rewards, replay XP, quests, streaks, draft backup validation');

const S=require('../app/settings.js');assert.equal(S.validate({theme:'bogus',fontSize:-1,wrap:'yes'}).theme,'midnight');assert.equal(S.validate({theme:'paper',fontSize:18,wrap:true,timeout:60}).timeout,60);assert.equal(S.validate({indent:2}).indent,2);assert.equal(S.validate(null).sound,false);console.log('PASS settings validation and defaults');
