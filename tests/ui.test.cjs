const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {serve}=require('../desktop/server.cjs');
(async()=>{const hosted=await serve(path.resolve(__dirname,'../app'));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});global.testPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(hosted.url);await page.waitForFunction(()=>typeof execute==='function');
 await page.click('[data-view=code]');
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/3 7 19 42/);
 await page.evaluate(()=>{project.files=[{name:'main.py',content:'print(6 * 7)\n'}];project.active='main.py';loading=true;editor.setValue(current().content);loading=false;select('main.py');});
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/42/);
 await page.click('#debug');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Paused'),{},{timeout:120000});await page.click('#step');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:30000});
 await page.evaluate(()=>{project.files=[{name:'main.c',content:'#include <stdio.h>\nint main(){int x=7;printf("%d\\n",x);return 0;}'}];project.active='main.c';loading=true;editor.setValue(current().content);loading=false;select('main.c');});
 await page.click('#convert');await page.locator('#modal button[value="ok"]').click();await page.waitForFunction(()=>project.active.endsWith('.py'),{},{timeout:120000});assert.match(await page.evaluate(()=>editor.getValue()),/def main/);
 // Native C/C++ compile errors must stop before execution.
 await page.evaluate(()=>{project.files=[{name:'bad.cpp',content:'int main(){this is invalid;}'}];project.active='bad.cpp';loading=true;editor.setValue(current().content);loading=false;select('bad.cpp');});await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Stopped with errors',{},{timeout:120000});assert.match(await page.textContent('#diagnostics'),/error:/);
 // Terminating a busy worker keeps the editor responsive.
 await page.evaluate(()=>{project.files=[{name:'loop.py',content:'while True: pass'}];project.active='loop.py';loading=true;editor.setValue(current().content);loading=false;select('loop.py');});await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Running Python…',{},{timeout:120000});await page.click('#stop');assert.equal(await page.textContent('#status'),'Stopped');
 await page.evaluate(()=>{project.files=[{name:'main.cpp',content:exampleCpp}];project.active='main.cpp';loading=true;editor.setValue(current().content);loading=false;select('main.cpp');});
 fs.mkdirSync(path.resolve(__dirname,'../.artifacts'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../.artifacts/desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../.artifacts/mobile.png')});

 // Learning uses real workers, with quiz gating and no completion on incorrect output.
 await page.click('[data-view=home]');await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-home.png')});
 await page.click('#daily-reward');assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().coins),20);assert.equal(await page.locator('#daily-reward').isDisabled(),true);
 await page.click('[data-view=learn]');await page.click('[data-course=py]');
 assert.equal(await page.locator('[data-lesson="py-2"]').isDisabled(),true);
 await page.click('[data-lesson="py-1"]');await page.click('#check-lesson');assert.match(await page.textContent('#lesson-feedback'),/Answer the concept/);
 await page.click('[data-answer="1"]');assert.match(await page.textContent('#quiz-feedback'),/Not quite/);
 await page.click('[data-answer="0"]');
 await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue('print("wrong")'));
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('failure'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().completed.length),0);
 await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue('print("Hello, explorer!")'));
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('success'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),40);
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('success'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),40);
 await page.click('[data-view=quests]');await page.click('[data-claim=practice]');assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),65);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-quests.png')});
 await page.reload();await page.waitForFunction(()=>!!window.CodeBridgeAcademy);assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),65);
 await page.click('[data-view=learn]');await page.click('[data-course=py]');assert.equal(await page.locator('[data-lesson="py-2"]').isDisabled(),false);
 await page.click('[data-lesson="py-1"]');assert.match(await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.getValue()),/Hello, explorer/);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-lesson.png')});
 // Navigation must fit the narrow Android viewport without horizontal overflow.
 for(const view of ['home','learn','quests','profile']){await page.click('[data-view='+view+']');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-profile.png')});
 assert.deepEqual(errors,[]);console.log('PASS UI: C++, Python, live debugger, conversion, diagnostics, cancellation, responsive layout');
 }finally{if(global.testPage){fs.mkdirSync(path.resolve(__dirname,'../.artifacts'),{recursive:true});await global.testPage.screenshot({path:path.resolve(__dirname,'../.artifacts/final-state.png')});console.log('Final UI status:',await global.testPage.textContent('#status'));console.log('Final build log:',await global.testPage.textContent('#diagnostics'));}await browser.close();hosted.server.close();}})().catch(e=>{console.error(e);process.exit(1);});
