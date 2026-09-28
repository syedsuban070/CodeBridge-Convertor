package com.codebridge.mobile;

import android.webkit.JavascriptInterface;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.UUID;
import org.json.JSONObject;

/** Line-input rendezvous. WebView's request worker may wait; its UI thread never does. */
public final class TerminalBridge {
    private static final class Session {
        final String token=UUID.randomUUID().toString();
        String line;
        boolean closed;
        synchronized String read() throws InterruptedException {
            while(line==null&&!closed)wait();
            if(line==null)return "{\"eof\":true}";
            String value=line;line=null;
            return "{\"text\":"+JSONObject.quote(value)+"}";
        }
        synchronized void send(String value,boolean eof){
            if(closed)return;
            if(eof)closed=true;else if(line==null)line=value;
            notifyAll();
        }
        synchronized void close(){closed=true;line=null;notifyAll();}
    }
    private volatile Session active;
    @JavascriptInterface public synchronized String begin(){
        if(active!=null)active.close();
        active=new Session();return active.token;
    }
    @JavascriptInterface public void submit(String token,String value,boolean eof){
        Session session=active;
        if(session!=null&&session.token.equals(token)&&value!=null&&value.length()<=16384)session.send(value,eof);
    }
    @JavascriptInterface public synchronized void cancel(String token){
        Session session=active;
        if(session!=null&&session.token.equals(token)){session.close();active=null;}
    }
    public synchronized void close(){if(active!=null)active.close();active=null;}
    public WebResourceResponse read(String token){
        String payload="{\"eof\":true}";
        Session session=active;
        if(session!=null&&session.token.equals(token)){
            try{payload=session.read();}catch(InterruptedException e){Thread.currentThread().interrupt();}
        }
        HashMap<String,String> headers=new HashMap<>();
        headers.put("Cache-Control","no-store");
        headers.put("Cross-Origin-Resource-Policy","same-origin");
        return new WebResourceResponse("application/json","UTF-8",200,"OK",headers,new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
