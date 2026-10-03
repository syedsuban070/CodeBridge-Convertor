package com.codebridge.codebridge_native

import android.content.*
import android.os.*
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.*

class MainActivity : FlutterActivity(), ServiceConnection {
    private var remote: Messenger? = null
    private var sink: EventChannel.EventSink? = null
    private var pending: Bundle? = null
    private var bound = false
    private var running = false
    private val incoming = Messenger(Handler(Looper.getMainLooper()) { msg ->
        val b=msg.data
        if(b.getString("type")=="exit") running=false
        sink?.success(mapOf("type" to b.getString("type"), "text" to b.getString("text", ""), "code" to b.getInt("code")))
        true
    })
    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)
        EventChannel(engine.dartExecutor.binaryMessenger,"codebridge/events").setStreamHandler(object:EventChannel.StreamHandler {
            override fun onListen(arguments:Any?, events:EventChannel.EventSink){sink=events}
            override fun onCancel(arguments:Any?){sink=null}
        })
        MethodChannel(engine.dartExecutor.binaryMessenger,"codebridge/runtime").setMethodCallHandler { call,result ->
            when(call.method) {
                "run" -> {
                    if(running){result.error("busy","A program is already running",null);return@setMethodCallHandler}
                    val source=call.argument<String>("source") ?: ""
                    if(source.length>200000){result.error("size","Source limit is 200 KB",null);return@setMethodCallHandler}
                    pending=Bundle().apply {
                        putString("source",source);putString("language",call.argument<String>("language") ?: "python")
                        putString("stdin",call.argument<String>("stdin") ?: "");putString("mode",call.argument<String>("mode") ?: "run")
                    }
                    running=true
                    if(remote!=null)dispatch() else {
                        bound=bindService(Intent(this,RuntimeService::class.java),this,Context.BIND_AUTO_CREATE)
                        if(!bound){running=false;result.error("bind","Runtime could not start",null);return@setMethodCallHandler}
                    }
                    result.success(null)
                }
                "stop" -> {remote?.send(Message.obtain(null,2));result.success(null)}
                "clock" -> result.success(mapOf("elapsed" to SystemClock.elapsedRealtime(),"wall" to System.currentTimeMillis(),"boot" to android.provider.Settings.Global.getInt(contentResolver,"boot_count",0)))
                else -> result.notImplemented()
            }
        }
    }
    private fun dispatch(){val data=pending ?: return;pending=null;remote?.send(Message.obtain(null,1).apply {this.data=data;replyTo=incoming})}
    override fun onServiceConnected(name:ComponentName,binder:IBinder){remote=Messenger(binder);dispatch()}
    override fun onServiceDisconnected(name:ComponentName){remote=null;if(running){sink?.success(mapOf("type" to "exit","text" to "Runtime stopped or exceeded its limit.","code" to 137));running=false};if(bound){unbindService(this);bound=false}}
    override fun onDestroy(){if(bound){remote?.send(Message.obtain(null,2));unbindService(this);bound=false};super.onDestroy()}
}
