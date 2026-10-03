package com.codebridge.mobile;
import android.test.ActivityInstrumentationTestCase2;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
public final class RuntimeSmokeTest extends ActivityInstrumentationTestCase2<MainActivity>{
    public RuntimeSmokeTest(){super(MainActivity.class);}
    private String js(String script)throws Exception{CountDownLatch done=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();getActivity().runOnUiThread(()->getActivity().getEditorForTesting().evaluateJavascript(script,v->{value.set(v);done.countDown();}));assertTrue("JavaScript callback timed out",done.await(10,TimeUnit.SECONDS));return value.get();}
    private void waitFor(String condition,int seconds)throws Exception{for(int i=0;i<seconds;i++){if("true".equals(js(condition)))return;Thread.sleep(1000);}fail("Timed out: "+condition+" status="+js("document.getElementById('status').textContent")+" log="+js("document.getElementById('diagnostics').textContent"));}
    private void setCode(String name,String source)throws Exception{js("project={name:'Test',active:"+JSONObject.quote(name)+",files:[{name:"+JSONObject.quote(name)+",content:"+JSONObject.quote(source)+"}],breakpoints:{}};loading=true;editor.setValue(project.files[0].content);loading=false;select(project.active);true");}
    public void testOfflineRuntimes()throws Exception{
        getActivity();waitFor("typeof execute==='function' && typeof CBExperience==='object' && typeof CBUpgrade==='object' && typeof CBProjects==='object' && !document.documentElement.classList.contains('booting')",30);
        js("CodeBridgeAcademy.navigate('projects');true");
        assertTrue(js("!document.getElementById('project-hub').hidden").contains("true"));
        js("CodeBridgeAcademy.navigate('code');CBSettings.set({theme:'forest',wrap:true});true");
        assertTrue(js("editor.getOption('lineWrapping')").contains("true"));
        setCode("main.cpp","#include <iostream>\n#include <vector>\nint main(){std::vector<int> n={2,3,4};for(auto x:n)std::cout<<x<<\" \";}");
        js("execute('run');true");waitFor("document.getElementById('status').textContent==='Completed successfully'",150);
        assertTrue(js("document.getElementById('output').textContent").contains("2 3 4"));
        assertTrue(js("document.body.classList.contains('output-mode')").contains("true"));
        js("document.getElementById('back-editor').click();true");
        assertTrue(js("!document.body.classList.contains('output-mode')").contains("true"));
        setCode("main.py","import numpy as np\nprint(int(np.array([2,3,4]).sum()))");js("execute('run');true");waitFor("document.getElementById('status').textContent==='Completed successfully'",120);assertTrue(js("document.getElementById('output').textContent").contains("9"));

        js("CodeBridgeAcademy.navigate('home');document.getElementById('daily-reward').click();true");
        assertTrue(js("CodeBridgeAcademy.getProgress().coins>=20").contains("true"));
        js("CodeBridgeAcademy.navigate('learn');CodeBridgeAcademy.openLesson('c-1');document.querySelector('[data-answer=\"0\"]').click();document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue(CBCourses[0].lessons[0].solution);document.getElementById('check-lesson').click();true");
        waitFor("document.getElementById('lesson-feedback').classList.contains('success')",180);
        assertTrue(js("CodeBridgeAcademy.getProgress().completed.includes('c-1')").contains("true"));
        setCode("main.c","#include <stdio.h>\nint main(){int n;printf(\"Number: \");scanf(\"%d\",&n);printf(\"Result=%d\",n*2);}");
        js("CodeBridgeAcademy.navigate('code');document.getElementById('stdin').value='';execute('run');true");
        waitFor("CBTerminal.waiting",150);
        assertTrue(js("document.getElementById('output').textContent").contains("Number: "));
        js("document.getElementById('terminal-line').value='21';CBTerminal.submit();true");
        waitFor("document.getElementById('status').textContent==='Completed successfully'",30);
        assertTrue(js("document.getElementById('output').textContent").contains("Result=42"));
        setCode("main.py","name=input('Name: ')\nprint('Hello',name)");
        js("execute('run');true");waitFor("CBTerminal.waiting",120);
        assertTrue(js("document.getElementById('output').textContent").contains("Name: "));
        js("document.getElementById('terminal-line').value='Dost';CBTerminal.submit();true");
        waitFor("document.getElementById('status').textContent==='Completed successfully'",30);
        assertTrue(js("document.getElementById('output').textContent").contains("Hello Dost"));
        setCode("main.c","#include <stdio.h>\nint main(){int c,n=0;while((c=getchar())!=EOF)n++;printf(\"bytes=%d\",n);}");
        js("execute('run');true");waitFor("CBTerminal.waiting",150);
        js("document.getElementById('terminal-line').value='abc';CBTerminal.submit();true");
        waitFor("CBTerminal.waiting",30);js("CBTerminal.submit(true);true");
        waitFor("document.getElementById('status').textContent==='Completed successfully'",30);
        assertTrue(js("document.getElementById('output').textContent").contains("bytes=4"));
        setCode("main.py","input('Stop here: ')");
        js("execute('run');true");waitFor("CBTerminal.waiting",120);
        js("stop();execute('run');true");waitFor("CBTerminal.waiting",120);
        js("document.getElementById('terminal-line').value='again';CBTerminal.submit();true");
        waitFor("document.getElementById('status').textContent==='Completed successfully'",30);
        assertEquals("Mission report missing","true",js("!!CodeBridgeAcademy.getProgress().reports['c-1']"));
        js("CBMemory.open();document.getElementById('memory-start').click();true");
        waitFor("document.getElementById('memory-status').textContent==='Paused after step 1'",150);
        js("document.getElementById('memory-continue').click();true");
        waitFor("document.getElementById('memory-status').textContent.startsWith('Exercise complete')",60);
        assertTrue(js("document.getElementById('memory-map').textContent").contains("dangling"));
        js("document.getElementById('memory-close').click();CodeBridgeAcademy.navigate('home');true");
        waitFor("!!document.querySelector('.bit-sprite')",10);
        js("window.spriteProbe=new Image();spriteProbe.src='game/assets/bit-lime.svg';true");
        waitFor("spriteProbe.complete&&spriteProbe.naturalWidth===1152",20);
        assertEquals("Native monotonic clock missing","true",js("JSON.parse(AndroidFiles.clockSample()).elapsed>0"));
        assertEquals("English-only UI missing","\"en\"",js("document.documentElement.lang"));
        js("CodeBridgeAcademy.transact(p=>{for(const id of ['c-2','c-3','c-4'])if(!p.completed.includes(id))p.completed.push(id);});CodeBridgeAcademy.navigate('learn');CodeBridgeAcademy.openLesson('c-memory-1');document.querySelector('[data-answer=\"0\"]').click();document.getElementById('check-lesson').click();true");
        waitFor("document.getElementById('lesson-feedback').classList.contains('failure')",180);
        assertEquals("Leaking boss awarded mastery","false",js("CodeBridgeAcademy.getProgress().completed.includes('c-memory-1')"));
        js("document.querySelector('.lesson-editor .CodeMirror').CodeMirror.setValue(CBCourses[0].lessons.find(l=>l.id==='c-memory-1').solution);document.getElementById('check-lesson').click();true");
        waitFor("document.getElementById('boss-chest').open",180);
        assertEquals("Boss mastery missing","true",js("CodeBridgeAcademy.getProgress().completed.includes('c-memory-1')"));
        js("document.getElementById('boss-chest').close();true");
        assertEquals("External AI bridge must be absent","true",js("typeof BitNative==='undefined'"));
        js("CodeBridgeAcademy.navigate('home');true");
    }
    public void testProjectBuildIsolationAndKeyboard()throws Exception{
        getActivity();waitFor("typeof CBProjects==='object' && !document.documentElement.classList.contains('booting')",30);
        String first="#include <stdio.h>\nint main(){puts(\"FIRST\");}",second="#include <stdio.h>\nint main(){puts(\"SECOND\");}";
        js("CodeBridgeAcademy.navigate('code');project.buildScope='file';project.files=[{name:'one.c',content:"+JSONObject.quote(first)+"},{name:'two.c',content:"+JSONObject.quote(second)+"}];project.active='two.c';loading=true;editor.setValue(current().content);loading=false;select('two.c');execute('run');true");
        waitFor("document.getElementById('status').textContent==='Completed successfully'",150);
        assertTrue(js("document.getElementById('output').textContent").contains("SECOND"));
        assertFalse(js("document.getElementById('diagnostics').textContent").contains("duplicate symbol"));
        js("document.getElementById('back-editor').click();editor.focus();true");
        getActivity().runOnUiThread(()->{getActivity().getEditorForTesting().requestFocus();android.view.inputmethod.InputMethodManager ime=(android.view.inputmethod.InputMethodManager)getActivity().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);ime.showSoftInput(getActivity().getEditorForTesting(),android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);});
        waitFor("document.body.classList.contains('editor-typing') && getComputedStyle(document.getElementById('symbols')).display==='flex'",30);
        assertTrue(js("document.getElementById('symbols').scrollWidth>document.getElementById('symbols').clientWidth").contains("true"));
        js("editor.setValue('');CBEditor.insert('{');CBEditor.insert(';');true");assertTrue(js("editor.getValue()").contains("{;}"));
        getActivity().runOnUiThread(()->{android.view.inputmethod.InputMethodManager ime=(android.view.inputmethod.InputMethodManager)getActivity().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);ime.hideSoftInputFromWindow(getActivity().getEditorForTesting().getWindowToken(),0);});
    }
    public void testSourceExportAndSharing()throws Exception{
        for(String name:new String[]{"lesson.c","lesson.cpp","lesson.py","project.cbproj"}){
            android.content.Intent intent=MainActivity.createExportIntent(name);
            assertEquals(android.content.Intent.ACTION_CREATE_DOCUMENT,intent.getAction());
            assertEquals(name,intent.getStringExtra(android.content.Intent.EXTRA_TITLE));
            assertFalse("Source files must not use generic text/plain", "text/plain".equals(intent.getType()));
        }
        java.io.File dir=new java.io.File(getActivity().getCacheDir(),"shared-exports");dir.mkdirs();java.io.File file=new java.io.File(dir,"sharing.c");try(java.io.FileOutputStream out=new java.io.FileOutputStream(file)){out.write("int main(){return 0;}".getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        android.net.Uri uri=android.net.Uri.parse("content://com.codebridge.mobile.exports/sharing.c");
        assertEquals("text/x-csrc",getActivity().getContentResolver().getType(uri));
        try(android.database.Cursor cursor=getActivity().getContentResolver().query(uri,null,null,null,null)){assertNotNull(cursor);assertTrue(cursor.moveToFirst());assertEquals("sharing.c",cursor.getString(cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)));}
        try(java.io.InputStream in=getActivity().getContentResolver().openInputStream(uri)){assertNotNull(in);assertEquals('i',in.read());}
        try{getActivity().getContentResolver().openOutputStream(uri);fail("Share provider must be read only");}catch(java.io.FileNotFoundException expected){}
    }

}
