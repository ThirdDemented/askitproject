package com.thelongwayhome.game;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private boolean smokeTriggered = false;

    public class OrientationBridge {
        @JavascriptInterface
        public void toggle() {
            runOnUiThread(() -> {
                int orientation = getResources().getConfiguration().orientation;
                if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                } else {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                }
            });
        }

        @JavascriptInterface
        public void autoRotate() {
            runOnUiThread(() -> setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR));
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        // Keep compositing accelerated for illustrated scenes and weather layers.
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.addJavascriptInterface(new OrientationBridge(), "AndroidOrientation");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (!smokeTriggered && getIntent().getBooleanExtra("smokeTest", false)) {
                    smokeTriggered = true;
                    String mode = getIntent().getStringExtra("smokeMode");
                    if (mode == null) mode = "road";

                    view.postDelayed(() -> view.evaluateJavascript(
                        "(()=>{const b=document.getElementById('newGameBtn');if(!b)return 'missing-button';b.click();" +
                        "document.querySelector('#careerGrid button:nth-child(3)')?.click();" +
                        "document.querySelector('#reasonGrid button')?.click();" +
                        "const s=document.getElementById('setupScreen');return s&&s.classList.contains('active')?'true':'false';})()",
                        value -> Log.i("LWH_SMOKE", clean(value))
                    ), 700);

                    view.postDelayed(() -> view.evaluateJavascript(
                        "(()=>{try{document.getElementById('beginLifeBtn')?.click();return 'started'}catch(e){return 'error:'+e.message}})()",
                        value -> Log.i("LWH_BEGIN_SMOKE", clean(value))
                    ), 1400);

                    final String smokeMode = mode;
                    view.postDelayed(() -> view.evaluateJavascript(
                        "(()=>{try{" +
                        "const p=document.getElementById('prepScreen');if(!p?.classList.contains('active'))return 'prep-not-active';" +
                        "document.getElementById('openMarketBtn')?.click();" +
                        "document.getElementById('visitSellerBtn')?.click();" +
                        "const s=document.getElementById('sellerScreen');return s?.classList.contains('active')?'true':'false';" +
                        "}catch(e){return 'error:'+e.message}})()",
                        value -> {
                            Log.i("LWH_SELLER_SMOKE", clean(value));
                            if ("seller".equals(smokeMode)) return;
                        }
                    ), 2600);

                    if (!"seller".equals(mode)) {
                        view.postDelayed(() -> view.evaluateJavascript(
                            "(()=>{try{" +
                            "document.getElementById('buyCarBtn')?.click();" +
                            "document.getElementById('departBtn')?.click();" +
                            "const r=document.getElementById('roadScreen');" +
                            "return r?.classList.contains('active')?'true':'false';" +
                            "}catch(e){return 'error:'+e.message}})()",
                            value -> Log.i("LWH_ROAD_SMOKE", clean(value))
                        ), 3800);

                        view.postDelayed(() -> view.evaluateJavascript(
                            "(()=>{try{" +
                            "document.getElementById('driveLegBtn')?.click();" +
                            "document.getElementById('tripLogRoadBtn')?.click();" +
                            "const t=document.getElementById('tripLogScreen');" +
                            "const odo=document.querySelector('.trip-odometer')?.textContent||'';" +
                            "const ok=t?.classList.contains('active')&&odo.includes('MI');" +
                            "document.getElementById('tripBackBtn')?.click();" +
                            "return ok?'true':'false';" +
                            "}catch(e){return 'error:'+e.message}})()",
                            value -> Log.i("LWH_TRIPLOG_SMOKE", clean(value))
                        ), 5200);
                    }
                }
                if (getIntent().getBooleanExtra("resumeTest", false)) {
                    view.postDelayed(() -> view.evaluateJavascript(
                        "document.getElementById('resumeBtn').click();document.getElementById('roadScreen').classList.contains('active')",
                        value -> Log.i("LWH_RESUME", clean(value))
                    ), 1000);
                }
                if (getIntent().getBooleanExtra("rotationTest", false)) {
                    view.postDelayed(() -> view.evaluateJavascript(
                        "window.rotationSave=localStorage.getItem('lwh-rc1-save');AndroidOrientation.toggle();'rotating'", null
                    ), 6500);
                    view.postDelayed(() -> view.evaluateJavascript(
                        "document.getElementById('roadScreen').classList.contains('active')&&window.rotationSave===localStorage.getItem('lwh-rc1-save')&&innerHeight>innerWidth",
                        value -> Log.i("LWH_ROTATION_PORTRAIT", clean(value))
                    ), 8500);
                    view.postDelayed(() -> view.evaluateJavascript("AndroidOrientation.toggle()", null), 9500);
                    view.postDelayed(() -> view.evaluateJavascript(
                        "document.getElementById('roadScreen').classList.contains('active')&&window.rotationSave===localStorage.getItem('lwh-rc1-save')&&innerWidth>innerHeight",
                        value -> Log.i("LWH_ROTATION_LANDSCAPE", clean(value))
                    ), 11500);
                }
            }
        });

        setContentView(webView);

        if (getIntent().getBooleanExtra("forceLandscape", false)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if (getIntent().getBooleanExtra("forcePortrait", false)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR);
        }

        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private String clean(String value) {
        return value == null ? "null" : value.replace("\"", "");
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript("window.LWHLifecycle?.pause()", null);
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript("window.LWHLifecycle?.resume()", null);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
