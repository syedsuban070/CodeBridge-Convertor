const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {serve}=require('../desktop/server.cjs');
(async()=>{const hosted=await serve(path.resolve(__dirname,'../app'));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});global.testPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(hosted.url);await page.waitForFunction(()=>typeof execute==='function');
 await page.click('[data-view=code]');await page.click('#open-editor');
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/3 7 19 42/);
 await page.evaluate(()=>{project.files=[{name:'main.py',content:'print(6 * 7)\n'}];project.active='main.py';loading=true;editor.setValue(current().content);loading=false;select('main.py');});
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/42/);
 await page.click('#tools-toggle');await page.click('#debug');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Paused'),{},{timeout:120000});await page.click('#step');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:30000});
 await page.evaluate(()=>{project.files=[{name:'main.c',content:'#include <stdio.h>\nint main(){int x=7;printf("%d\\n",x);return 0;}'}];project.active='main.c';loading=true;editor.setValue(current().content);loading=false;select('main.c');});
 await page.click('#menu-toggle');await page.click('#convert');await page.locator('#modal button[value="ok"]').click();await page.waitForFunction(()=>project.active.endsWith('.py'),{},{timeout:120000});assert.match(await page.evaluate(()=>editor.getValue()),/def main/);
 // Native C/C++ compile errors must stop before execution.
 await page.evaluate(()=>{project.files=[{name:'bad.cpp',content:'int main(){this is invalid;}'}];project.active='bad.cpp';loading=true;editor.setValue(current().content);loading=false;select('bad.cpp');});await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Stopped with errors',{},{timeout:120000});assert.match(await page.textContent('#diagnostics'),/error:/);
 // Terminating a busy worker keeps the editor responsive.
 await page.evaluate(()=>{project.files=[{name:'loop.py',content:'while True: pass'}];project.active='loop.py';loading=true;editor.setValue(current().content);loading=false;select('loop.py');});await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Running Python…',{},{timeout:120000});await page.click('#stop');assert.equal(await page.textContent('#status'),'Stopped');
 await page.evaluate(()=>{project.files=[{name:'main.cpp',content:exampleCpp}];project.active='main.cpp';loading=true;editor.setValue(current().content);loading=false;select('main.cpp');});
 await page.click('#back-editor');
 fs.mkdirSync(path.resolve(__dirname,'../.artifacts'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../.artifacts/desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../.artifacts/mobile.png')});

 // Learning uses real workers, with quiz gating and no completion on incorrect output.
 await page.evaluate(()=>CodeBridgeAcademy.navigate('home'));await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-home.png')});
 await page.click('#daily-reward');assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().coins),20);assert.equal(await page.locator('#daily-reward').isDisabled(),true);
 await page.evaluate(()=>CodeBridgeAcademy.navigate('learn'));await page.click('[data-course=py]');
 assert.equal(await page.locator('[data-lesson="py-2"]').isDisabled(),true);
 await page.click('[data-lesson="py-1"]');await page.click('#check-lesson');assert.match(await page.textContent('#lesson-feedback'),/Answer the concept/);
 await page.click('[data-answer="1"]');assert.match(await page.textContent('#quiz-feedback'),/Not quite/);
 await page.click('[data-answer="0"]');
 await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue('print("wrong")'));
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('failure'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().completed.length),0);
 await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue('print("Hello, explorer!")'));
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('success'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),40);
 await page.click('#check-lesson');await page.waitForFunction(()=>document.querySelector('#lesson-feedback').classList.contains('success'),{},{timeout:120000});assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),40);
 await page.evaluate(()=>CodeBridgeAcademy.navigate('quests'));await page.click('[data-claim=practice]');assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),65);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-quests.png')});
 await page.reload();await page.waitForFunction(()=>!!window.CodeBridgeAcademy);assert.equal(await page.evaluate(()=>CodeBridgeAcademy.getProgress().xp),65);
 await page.evaluate(()=>CodeBridgeAcademy.navigate('learn'));await page.click('[data-course=py]');assert.equal(await page.locator('[data-lesson="py-2"]').isDisabled(),false);
 await page.click('[data-lesson="py-1"]');assert.match(await page.evaluate(()=>document.querySelector('.lesson-editor .CodeMirror').CodeMirror.getValue()),/Hello, explorer/);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-lesson.png')});
 // Navigation must fit the narrow Android viewport without horizontal overflow.
 for(const view of ['home','learn','quests','profile']){await page.click('[data-view='+view+']');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-profile.png')});

 // Customize the app and verify persistent settings affect both editors.
 await page.click('#settings-open');await page.click('[data-setting=theme][data-value=paper]');await page.click('[data-setting=editorTheme][data-value=day]');
 await page.selectOption('select[data-setting=fontSize]','18');await page.selectOption('select[data-setting=indent]','2');await page.check('input[data-setting=wrap]');await page.uncheck('input[data-setting=motion]');
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-settings.png')});
 await page.click('#settings-close');await page.reload();await page.waitForFunction(()=>!!window.CBExperience);
 assert.equal(await page.evaluate(()=>CBSettings.get().theme),'paper');assert.equal(await page.evaluate(()=>CBSettings.get().indent),2);assert.equal(await page.evaluate(()=>editor.getOption('lineWrapping')),true);
 await page.click('[data-view=code]');await page.click('#open-editor');assert.equal(await page.locator('#console').isVisible(),false);assert.equal(await page.locator('#editor-area').isVisible(),true);
 await page.click('#tools-toggle');await page.click('#input-open');assert.equal(await page.locator('#editor-area').isVisible(),false);await page.fill('#stdin','12 30');await page.click('#back-editor');
 await page.evaluate(()=>{project.files=[{name:'main.py',content:'a,b=map(int,input().split())\nprint(a+b)'}];project.active='main.py';loading=true;editor.setValue(current().content);loading=false;select('main.py');});
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/42/);assert.equal(await page.locator('#editor-area').isVisible(),false);assert.equal(await page.locator('#console').isVisible(),true);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-console-paper.png')});
 await page.click('#back-editor');await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-editor-paper.png')});
 await page.click('#settings-open');await page.click('[data-setting=theme][data-value=forest]');await page.click('[data-setting=editorTheme][data-value=ocean]');await page.click('#settings-close');await page.evaluate(()=>CodeBridgeAcademy.navigate('home'));
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-home-forest.png')});
 await page.click('#settings-open');await page.click('[data-setting=theme][data-value=violet]');await page.click('#settings-close');await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-home-violet.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.click('#settings-open');await page.click('#reset-settings');await page.click('#settings-close');

 await page.click('[data-view=code]');await page.click('#open-editor');const oldSize=await page.evaluate(()=>CBSettings.get().fontSize);await page.click('#menu-toggle');await page.click('#zoom-in');assert.ok(await page.evaluate(()=>CBSettings.get().fontSize)>oldSize);await page.click('#menu-toggle');await page.click('#zoom-out');
 await page.evaluate(()=>editor.setValue('pri'));await page.click('#menu-toggle');await page.click('#suggest-code');assert.match(await page.textContent('.CodeMirror-hints'),/print/);await page.keyboard.press('Escape');
 await page.evaluate(()=>{CBSettings.set({roast:true});project.files=[{name:'bad.py',content:'print(1/0)'}];project.active='bad.py';loading=true;editor.setValue(current().content);loading=false;select('bad.py');});
 await page.click('#run');await page.waitForFunction(()=>!document.querySelector('#bit-reaction').hidden,{},{timeout:120000});await page.click('#bit-error-button');assert.match(await page.textContent('#bit-title'),/Division by zero/);assert.equal(await page.locator('#bit-roast').isVisible(),true);assert.equal(await page.locator('#bit-ask').isEnabled(),true);
 await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-bit-guide.png')});await page.click('#bit-close');
 await page.evaluate(()=>{CBSettings.set({roast:false});project.files=[{name:'science.py',content:'import numpy as np\nimport sympy as sp\nprint(int(np.array([1, 2, 3]).sum()))\nx=sp.symbols("x")\nprint(sp.expand((x+1)**2))'}];project.active='science.py';loading=true;editor.setValue(current().content);loading=false;select('science.py');});
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/6/);assert.match(await page.textContent('#output'),/x\*\*2/);
 await page.evaluate(()=>{project.files=[{name:'main.cpp',content:"#include <stdio.h>\n#include <cJSON.h>\nint main(){cJSON *j=cJSON_Parse(\"{\\\"answer\\\":42}\"); if(!j)return 1; printf(\"%d\",cJSON_GetObjectItemCaseSensitive(j,\"answer\")->valueint);cJSON_Delete(j);return 0;}"}];project.active='main.cpp';loading=true;editor.setValue(current().content);loading=false;select('main.cpp');CBSettings.set({cppStandard:'c++14',optimization:'O2'});});
 await page.click('#run');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Completed successfully',{},{timeout:120000});assert.match(await page.textContent('#output'),/42/);
 await page.click('#back-editor');await page.screenshot({path:path.resolve(__dirname,'../.artifacts/android-power-editor.png')});
 assert.deepEqual(errors,[]);console.log('PASS UI: C++, Python, live debugger, conversion, diagnostics, cancellation, responsive layout');
 }finally{if(global.testPage){fs.mkdirSync(path.resolve(__dirname,'../.artifacts'),{recursive:true});await global.testPage.screenshot({path:path.resolve(__dirname,'../.artifacts/final-state.png')});console.log('Final UI status:',await global.testPage.textContent('#status'));console.log('Final build log:',await global.testPage.textContent('#diagnostics'));}await browser.close();hosted.server.close();}})().catch(e=>{console.error(e);process.exit(1);});
