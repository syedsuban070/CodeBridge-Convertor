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
        getActivity();waitFor("typeof execute==='function'",30);
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
        setCode("main.py","print(1 / 0)");
        js("CodeBridgeAcademy.navigate('code');BitAI.open();document.getElementById('bit-prompt').value='In Python, why does print(1/0) fail? Give a short explanation.';document.getElementById('bit-ask').click();true");
        waitFor("!BitAI.isBusy()",240);
        String answer=js("document.getElementById('bit-ai-result').textContent").toLowerCase();
        // Example code may legitimately print "Error:"; check the engine state, not generated prose.
        assertEquals("Native model did not complete: "+answer,"true",js("document.getElementById('bit-status').textContent.startsWith('Generated locally.')"));
        assertTrue("Empty AI response",answer.length()>30);
        assertTrue("No relevant AI answer: "+answer,answer.contains("zero")||answer.contains("division"));
        js("document.getElementById('bit-close').click();CodeBridgeAcademy.navigate('home');true");

    }
}
