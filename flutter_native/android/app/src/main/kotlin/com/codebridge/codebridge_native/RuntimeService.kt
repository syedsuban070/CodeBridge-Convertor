package com.codebridge.codebridge_native

import android.app.Service
import android.content.Intent
import android.os.*
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import java.io.File
import java.util.zip.ZipInputStream

class RuntimeService:Service(){
    private var client:Messenger?=null
    @Volatile private var busy=false
    private val handler=Handler(Looper.getMainLooper())
    @Volatile private var childPid=0
    fun child(pid:Int){childPid=pid}
    private val deadline=Runnable { terminate() }
    private fun terminate(){
        val pid=childPid
        if(pid>0)try{android.system.Os.kill(-pid,android.system.OsConstants.SIGKILL)}catch(_:Exception){}
        android.os.Process.killProcess(android.os.Process.myPid())
    }
    private val messenger=Messenger(Handler(Looper.getMainLooper()){m ->
        if(m.what==2){terminate();return@Handler true}
        if(m.what==1 && !busy){
            busy=true;client=m.replyTo;val b=m.data
            handler.postDelayed(deadline,60000)
            Thread {
                var code=1
                try{
                    if(!Python.isStarted())Python.start(AndroidPlatform(this))
                    val abi=if(Build.SUPPORTED_ABIS.contains("arm64-v8a")) "arm64-v8a" else "x86_64"
                    val root=File(filesDir,"toolchain-$abi")
                    val marker=File(root,".complete")
                    if(!marker.exists() || marker.readText()!="4"){
                        output("Preparing bundled compiler…\n","status")
                        root.mkdirs()
                        ZipInputStream(assets.open("toolchain-$abi.zip")).use { zip ->
                            var entry=zip.nextEntry
                            while(entry!=null){
                                val file=File(root,entry.name)
                                require(file.canonicalPath.startsWith(root.canonicalPath+File.separator))
                                if(entry.isDirectory)file.mkdirs() else {file.parentFile!!.mkdirs();file.outputStream().use {zip.copyTo(it)}}
                                zip.closeEntry();entry=zip.nextEntry
                            }
                        }
                        marker.writeText("4")
                    }
                    code=Python.getInstance().getModule("runner").callAttr("execute",b.getString("source"),b.getString("language"),b.getString("stdin"),applicationInfo.nativeLibraryDir,filesDir.absolutePath,abi,b.getString("mode"),this).toInt()
                }catch(e:Throwable){output(e.toString()+"\n","stderr")}
                handler.removeCallbacks(deadline)
                send("exit","",code);busy=false
            }.start()
        };true
    })
    fun output(text:String,kind:String){send(kind,text,0)}
    private fun send(kind:String,text:String,code:Int){try{client?.send(Message.obtain(null,1).apply {data=Bundle().apply {putString("type",kind);putString("text",text);putInt("code",code)}})}catch(_:RemoteException){}}
    override fun onBind(intent:Intent):IBinder=messenger.binder
}
