package com.codebridge.mobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final int OPEN = 1;
    private static final int SAVE = 2;
    private WebView editor;
    private String pendingSave;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        editor = new WebView(this);
        editor.getSettings().setJavaScriptEnabled(true);
        editor.getSettings().setAllowFileAccess(false);
        editor.getSettings().setAllowContentAccess(false);
        editor.getSettings().setDomStorageEnabled(true);
        editor.setWebViewClient(new WebViewClient());
        editor.addJavascriptInterface(new Bridge(), "AndroidFiles");
        setContentView(editor);
        editor.loadUrl("file:///android_asset/index.html");
    }

    private void send(String function, String... args) {
        StringBuilder script = new StringBuilder(function).append('(');
        for (int i = 0; i < args.length; i++) {
            if (i > 0) script.append(',');
            script.append(JSONObject.quote(args[i]));
        }
        editor.evaluateJavascript(script.append(')').toString(), null);
    }

    private final class Bridge {
        @JavascriptInterface public void open() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(intent, OPEN);
            });
        }
        @JavascriptInterface public void save(String filename, String content) {
            runOnUiThread(() -> {
                pendingSave = content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.setType("text/plain");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.putExtra(Intent.EXTRA_TITLE, filename.matches("[a-zA-Z0-9._-]{1,64}") ? filename : "main.c");
                startActivityForResult(intent, SAVE);
            });
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            if (request == OPEN) {
                try (InputStream input = getContentResolver().openInputStream(uri);
                     ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (bytes.size() + count > 512_000) throw new IllegalArgumentException("File exceeds 500 KB limit");
                        bytes.write(buffer, 0, count);
                    }
                    String filename = uri.getLastPathSegment();
                    if (filename != null && filename.contains("/")) filename = filename.substring(filename.lastIndexOf('/') + 1);
                    send("loadDocument", filename == null ? "main.c" : filename, bytes.toString("UTF-8"));
                }
            } else if (request == SAVE && pendingSave != null) {
                try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                    output.write(pendingSave.getBytes(StandardCharsets.UTF_8));
                    send("showStatus", "Saved successfully");
                } finally { pendingSave = null; }
            }
        } catch (Exception error) { send("showStatus", "File error: " + error.getMessage()); }
    }

    @Override public void onBackPressed() {
        if (editor.canGoBack()) editor.goBack(); else super.onBackPressed();
    }
}
