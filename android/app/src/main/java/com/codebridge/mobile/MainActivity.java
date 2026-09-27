package com.codebridge.mobile;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final int OPEN=1, SAVE=2;
    private WebView editor;
    private String pendingSave;
    private static final String ORIGIN="https://codebridge.local/";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(13,20,35));
        root.setOnApplyWindowInsetsListener((view,insets)->{
            view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;
        });
        editor=new WebView(this);editor.setBackgroundColor(Color.rgb(13,20,35));
        editor.getSettings().setJavaScriptEnabled(true);
        editor.getSettings().setAllowFileAccess(false);editor.getSettings().setAllowContentAccess(false);
        editor.getSettings().setDomStorageEnabled(true);
        editor.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !request.getUrl().toString().startsWith(ORIGIN);}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                String url=request.getUrl().toString();
                if(!url.startsWith(ORIGIN))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",new HashMap<>(),new ByteArrayInputStream(new byte[0]));
                String path=request.getUrl().getPath();path=path==null||path.equals("/")?"index.html":path.substring(1);
                if(path.contains(".."))return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
                String mime=path.endsWith(".html")?"text/html":path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".wasm")?"application/wasm":path.endsWith(".json")?"application/json":"application/octet-stream";
                Map<String,String> headers=new HashMap<>();
                headers.put("Cross-Origin-Opener-Policy","same-origin");headers.put("Cross-Origin-Embedder-Policy","require-corp");headers.put("Cross-Origin-Resource-Policy","same-origin");
                try{return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,getAssets().open(path));}
                catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",headers,new ByteArrayInputStream(new byte[0]));}
            }
        });
        editor.addJavascriptInterface(new Bridge(),"AndroidFiles");
        root.addView(editor,new FrameLayout.LayoutParams(-1,-1));setContentView(root);editor.loadUrl(ORIGIN);
    }
    @Override public void onBackPressed() {
        editor.evaluateJavascript("window.codebridgeBack ? window.codebridgeBack() : false", result -> {
            if (!"true".equals(result)) super.onBackPressed();
        });
    }
    public WebView getEditorForTesting(){return editor;}
    private void send(String function,String...args){StringBuilder js=new StringBuilder(function).append('(');for(int i=0;i<args.length;i++){if(i>0)js.append(',');js.append(JSONObject.quote(args[i]));}editor.evaluateJavascript(js.append(')').toString(),null);}
    private final class Bridge{
        @JavascriptInterface public void open(){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,OPEN);});}
        @JavascriptInterface public void save(String filename,String content){runOnUiThread(()->{if(content.length()>8000000){send("showStatus","Project exceeds export limit");return;}pendingSave=content;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType("text/plain");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,filename.matches("[a-zA-Z0-9._-]{1,100}")?filename:"main.cpp");startActivityForResult(i,SAVE);});}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null)return;Uri uri=data.getData();try{
        if(request==OPEN){try(InputStream input=getContentResolver().openInputStream(uri);ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int n;while((n=input.read(buffer))!=-1){if(bytes.size()+n>8000000)throw new IllegalArgumentException("File exceeds 8 MB import limit");bytes.write(buffer,0,n);}
            String name="imported.cpp";try(Cursor c=getContentResolver().query(uri,null,null,null,null)){if(c!=null&&c.moveToFirst()){int col=c.getColumnIndex(OpenableColumns.DISPLAY_NAME);if(col>=0)name=c.getString(col);}}
            send("loadDocument",name,bytes.toString("UTF-8"));
        }}else if(request==SAVE&&pendingSave!=null){try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(pendingSave.getBytes(StandardCharsets.UTF_8));send("showStatus","File saved");}finally{pendingSave=null;}}
    }catch(Exception error){send("showStatus","File error: "+error.getMessage());}}
}
