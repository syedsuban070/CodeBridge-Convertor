package com.codebridge.mobile;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.provider.DocumentsContract;
import android.content.ClipData;
import android.graphics.Insets;
import android.view.WindowInsets;
import android.os.Build;
import java.io.File;
import java.io.FileOutputStream;
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
    private final TerminalBridge terminal=new TerminalBridge();
    private String pendingSave,pendingFilename;
    private boolean keyboardVisible=false;
    private static final String ORIGIN="https://codebridge.local/";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(13,20,35));
        root.setOnApplyWindowInsetsListener((view,insets)->{
            if(Build.VERSION.SDK_INT>=30){
                Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
                boolean visible=insets.isVisible(WindowInsets.Type.ime());
                int bottom=Math.max(bars.bottom,insets.getInsets(WindowInsets.Type.ime()).bottom);
                view.setPadding(bars.left,bars.top,bars.right,bottom);
                if(visible!=keyboardVisible){keyboardVisible=visible;if(editor!=null)editor.post(()->editor.evaluateJavascript("window.CBExperience?.nativeKeyboard("+visible+")",null));}
            }else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getStableInsetBottom());
            return insets;
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
                if("/__terminal/read".equals(request.getUrl().getPath()))return terminal.read(request.getUrl().getQueryParameter("token"));
                String path=request.getUrl().getPath();path=path==null||path.equals("/")?"index.html":path.substring(1);
                if(path.contains(".."))return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
                String mime=path.endsWith(".html")?"text/html":path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".wasm")?"application/wasm":path.endsWith(".json")?"application/json":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".woff2")?"font/woff2":path.endsWith(".ttf")?"font/ttf":path.endsWith(".wav")?"audio/wav":"application/octet-stream";
                Map<String,String> headers=new HashMap<>();
                headers.put("Cross-Origin-Opener-Policy","same-origin");headers.put("Cross-Origin-Embedder-Policy","require-corp");headers.put("Cross-Origin-Resource-Policy","same-origin");
                try{return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,getAssets().open(path));}
                catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",headers,new ByteArrayInputStream(new byte[0]));}
            }
        });
        editor.addJavascriptInterface(new Bridge(),"AndroidFiles");
        editor.addJavascriptInterface(terminal,"TerminalNative");
        new java.io.File(getFilesDir(),"bit-qwen-0.5b-q4.gguf").delete();
        root.addView(editor,new FrameLayout.LayoutParams(-1,-1));setContentView(root);editor.loadUrl(ORIGIN);
    }
    @Override protected void onDestroy(){terminal.close();editor.destroy();super.onDestroy();}
    @Override public void onBackPressed() {
        editor.evaluateJavascript("window.codebridgeBack ? window.codebridgeBack() : false", result -> {
            if (!"true".equals(result)) super.onBackPressed();
        });
    }
    public WebView getEditorForTesting(){return editor;}
    private void send(String function,String...args){StringBuilder js=new StringBuilder(function).append('(');for(int i=0;i<args.length;i++){if(i>0)js.append(',');js.append(JSONObject.quote(args[i]));}editor.evaluateJavascript(js.append(')').toString(),null);}
    private final class Bridge{
        private final String clockSession=java.util.UUID.randomUUID().toString();
        @JavascriptInterface public String clockSample(){
            long elapsed=android.os.SystemClock.elapsedRealtime();
            int boot=android.provider.Settings.Global.getInt(getContentResolver(),"boot_count",-1);
            return "{\"boot\":\""+(boot>=0?"android-"+boot:clockSession)+"\",\"elapsed\":"+elapsed+",\"wall\":"+System.currentTimeMillis()+"}";
        }

        @JavascriptInterface public void open(){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,OPEN);});}
        @JavascriptInterface public boolean isKeyboardVisible(){return keyboardVisible;}
        @JavascriptInterface public void save(String filename,String content){runOnUiThread(()->{
            if(content.length()>8000000){send("showStatus","File exceeds export limit");return;}
            if(pendingSave!=null){send("showStatus","Finish the current export first");return;}
            pendingSave=content;pendingFilename=safeExportName(filename);
            Intent i=createExportIntent(pendingFilename);startActivityForResult(i,SAVE);
        });}
        @JavascriptInterface public void share(String filename,String content){runOnUiThread(()->{
            try{
                if(content.length()>8000000)throw new IllegalArgumentException("File exceeds export limit");
                String name=safeExportName(filename);File dir=new File(getCacheDir(),"shared-exports");dir.mkdirs();
                File dest=new File(dir,name);try(FileOutputStream out=new FileOutputStream(dest)){out.write(content.getBytes(StandardCharsets.UTF_8));}
                Uri uri=new Uri.Builder().scheme("content").authority(getPackageName()+".exports").appendPath(name).build();
                Intent i=new Intent(Intent.ACTION_SEND);i.setType(exportMime(name));i.putExtra(Intent.EXTRA_STREAM,uri);i.setClipData(ClipData.newRawUri(name,uri));i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(i,"Share "+name));
            }catch(Exception e){send("showStatus","Share failed: "+e.getMessage());}
        });}

    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null){if(request==SAVE){pendingSave=null;pendingFilename=null;send("showStatus","Export cancelled · local project is still saved");}return;}Uri uri=data.getData();try{
        if(request==OPEN){try(InputStream input=getContentResolver().openInputStream(uri);ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int n;while((n=input.read(buffer))!=-1){if(bytes.size()+n>8000000)throw new IllegalArgumentException("File exceeds 8 MB import limit");bytes.write(buffer,0,n);}
            String name="imported.cpp";try(Cursor c=getContentResolver().query(uri,null,null,null,null)){if(c!=null&&c.moveToFirst()){int col=c.getColumnIndex(OpenableColumns.DISPLAY_NAME);if(col>=0)name=c.getString(col);}}
            send("loadDocument",name,bytes.toString("UTF-8"));
        }}else if(request==SAVE&&pendingSave!=null){try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(pendingSave.getBytes(StandardCharsets.UTF_8));}
                String exported=ensureExportExtension(uri,pendingFilename);send("showStatus","Exported "+exported);send("window.CBProjects?.onNativeExport",exported);pendingSave=null;pendingFilename=null;}
    }catch(Exception error){pendingSave=null;pendingFilename=null;send("showStatus","File error: "+error.getMessage());}}
    public static String exportMime(String name){
        String lower=name==null?"":name.toLowerCase(java.util.Locale.ROOT);
        if(lower.endsWith(".c")||lower.endsWith(".h"))return "text/x-csrc";
        if(lower.endsWith(".cpp")||lower.endsWith(".cc")||lower.endsWith(".cxx")||lower.endsWith(".hpp"))return "text/x-c++src";
        if(lower.endsWith(".py"))return "text/x-python";
        if(lower.endsWith(".json"))return "application/json";
        return "application/octet-stream";
    }
    private static String safeExportName(String filename){String name=filename==null?"main.cpp":filename.replace('\\','/');name=name.substring(name.lastIndexOf('/')+1);return name.matches("[a-zA-Z0-9._ -]{1,180}")&&!name.equals(".")&&!name.equals("..")?name:"main.cpp";}
    public static Intent createExportIntent(String filename){Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType(exportMime(filename));i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,safeExportName(filename));return i;}
    private String ensureExportExtension(Uri uri,String desired) throws java.io.IOException {
        String actual=desired;try(Cursor c=getContentResolver().query(uri,null,null,null,null)){if(c!=null&&c.moveToFirst()){int col=c.getColumnIndex(OpenableColumns.DISPLAY_NAME);if(col>=0)actual=c.getString(col);}}catch(Exception ignored){}
        String ext=desired.substring(desired.lastIndexOf('.')+1);if(actual!=null&&!actual.toLowerCase(java.util.Locale.ROOT).endsWith("."+ext.toLowerCase(java.util.Locale.ROOT))){
            String fixed=actual;if(fixed.endsWith(".txt")||fixed.endsWith(".bin"))fixed=fixed.substring(0,fixed.lastIndexOf('.'));if(!fixed.endsWith("."+ext))fixed+="."+ext;
            try{Uri renamed=DocumentsContract.renameDocument(getContentResolver(),uri,fixed);if(renamed!=null)return fixed;}catch(Exception ignored){}
            throw new java.io.IOException("Saved as "+actual+". Rename it to end in ."+ext+"; this provider refused the filename correction.");
        }return actual;
    }

}
