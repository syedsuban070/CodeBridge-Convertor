package com.codebridge.mobile;
import android.app.Activity;
import android.app.ActivityManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;
public final class BitBridge {
    static { System.loadLibrary("bit"); }
    private static native byte[] generateNative(String path,byte[] prompt,int tokens);
    private static native void cancelNative();
    private static native void resetNative();
    private final Activity activity; private final WebView web;
    private final ExecutorService executor=Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy=new AtomicBoolean(false),cancelled=new AtomicBoolean(false);
    private volatile boolean closed=false;
    BitBridge(Activity activity,WebView web){this.activity=activity;this.web=web;}
    private void report(int id,String state,String text){activity.runOnUiThread(()->{if(!closed)web.evaluateJavascript("window.onBitNative&&window.onBitNative("+id+","+JSONObject.quote(state)+","+JSONObject.quote(text)+")",null);});}
    @JavascriptInterface public boolean available(){return true;}
    @JavascriptInterface public void ask(int id,String prompt){
        if(closed||prompt==null||prompt.length()>12000){report(id,"error","Request exceeds the local model's input limit.");return;}
        if(!busy.compareAndSet(false,true)){report(id,"error","Bit is still finishing the previous request. Wait a moment.");return;}
        cancelled.set(false);resetNative();
        executor.execute(()->{try{
            ActivityManager.MemoryInfo memory=new ActivityManager.MemoryInfo();((ActivityManager)activity.getSystemService(Activity.ACTIVITY_SERVICE)).getMemoryInfo(memory);
            if(memory.lowMemory||memory.availMem<650L*1024*1024)throw new IOException("Not enough free memory. Close other apps and try again.");
            report(id,"status","Preparing Qwen coding model on this device…");
            File model=new File(activity.getFilesDir(),"bit-qwen-0.5b-q4.gguf");
            if(!model.exists()||model.length()!=491400064L){
                File temp=new File(activity.getFilesDir(),"bit-model.tmp");
                try(InputStream in=activity.getAssets().open("models/bit.gguf");OutputStream out=new FileOutputStream(temp)){byte[] buffer=new byte[1024*1024];int n;while((n=in.read(buffer))!=-1){if(cancelled.get())throw new IOException("Cancelled.");out.write(buffer,0,n);}}
                if(temp.length()!=491400064L||!temp.renameTo(model))throw new IOException("Cannot prepare model. Free at least 600 MB of storage.");
            }
            if(cancelled.get())throw new IOException("Cancelled.");
            report(id,"status","Thinking offline… This may take a minute on slower phones.");
            String result=new String(generateNative(model.getAbsolutePath(),prompt.getBytes(StandardCharsets.UTF_8),224),StandardCharsets.UTF_8);
            if(cancelled.get())report(id,"error","Cancelled.");else report(id,result.startsWith("ERROR:")?"error":"done",result);
        }catch(Exception error){report(id,"error",error.getMessage()==null?"Local inference failed.":error.getMessage());}finally{busy.set(false);}});
    }
    @JavascriptInterface public void cancel(){cancelled.set(true);cancelNative();}
    public void close(){closed=true;cancel();executor.shutdown();}
}
