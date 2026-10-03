package com.codebridge.codebridge_native
import android.content.*
import android.os.*
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class RuntimeTest {
 @Test fun bundledRuntimesExecuteOffline(){
  val context=InstrumentationRegistry.getInstrumentation().targetContext
  val connected=CountDownLatch(1)
  var service:Messenger?=null
  val connection=object:ServiceConnection{
   override fun onServiceConnected(name:ComponentName,binder:IBinder){service=Messenger(binder);connected.countDown()}
   override fun onServiceDisconnected(name:ComponentName){service=null}
  }
  assertTrue(context.bindService(Intent(context,RuntimeService::class.java),connection,Context.BIND_AUTO_CREATE))
  try{
   assertTrue(connected.await(15,TimeUnit.SECONDS))
   fun execute(language:String,source:String,input:String,expected:String){
    val done=CountDownLatch(1);val out=StringBuilder();val err=StringBuilder();var code=-999
    val reply=Messenger(Handler(Looper.getMainLooper()){m->
     when(m.data.getString("type")){"stdout"->out.append(m.data.getString("text"));"stderr"->err.append(m.data.getString("text"));"exit"->{code=m.data.getInt("code");done.countDown()}}
     true
    })
    service!!.send(Message.obtain(null,1).apply{replyTo=reply;data=Bundle().apply{putString("source",source);putString("language",language);putString("stdin",input);putString("mode","run")}})
    assertTrue("Runtime timeout $language: $err",done.await(65,TimeUnit.SECONDS))
    assertEquals("Runtime $language failed: $err",0,code);assertEquals(expected,out.toString().trim())
   }
   execute("python","import sys\nassert sys.version_info[:2] == (3,12)\na=int(input())\nb=int(input())\nprint(a+b)","19\n23\n","42")
   execute("c","#include <stdio.h>\n#if __clang_major__ != 8\n#error Wrong clang\n#endif\nint main(void){int a,b;scanf(\"%d%d\",&a,&b);printf(\"%d\\n\",a+b);return 0;}","19 23\n","42")
   execute("cpp","#include <iostream>\n#include <optional>\n#include <vector>\nint main(){std::optional<int> x=42;std::vector<int> v{*x};try { throw v[0]; } catch (int result) { std::cout<<result<<std::endl; } return 0;}","","42")
  }finally{context.unbindService(connection)}
 }
}
