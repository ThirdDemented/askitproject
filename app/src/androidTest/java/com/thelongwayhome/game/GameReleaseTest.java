package com.thelongwayhome.game;

import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import static org.junit.Assert.*;

/** A separate instrumentation APK drives real release UI controls; no test code ships in the game. */
public class GameReleaseTest {
    private final Instrumentation instrumentation=InstrumentationRegistry.getInstrumentation();
    private MainActivity activity;
    private WebView web;

    private WebView findWeb(View view) {
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++){WebView found=findWeb(group.getChildAt(i));if(found!=null)return found;}}
        return null;
    }
    private void launch() throws Exception {
        Intent intent=new Intent(instrumentation.getTargetContext(),MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity=(MainActivity)instrumentation.startActivitySync(intent);
        instrumentation.runOnMainSync(()->web=findWeb(activity.findViewById(android.R.id.content)));
        assertNotNull(web);
        waitFor("!!document.getElementById('newGameBtn')", "game loaded");
    }
    private String js(String expression) throws Exception {
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        instrumentation.runOnMainSync(()->web.evaluateJavascript(expression,value->{result.set(value);done.countDown();}));
        assertTrue("WebView response",done.await(10,TimeUnit.SECONDS));return result.get();
    }
    private void waitFor(String condition,String label) throws Exception {
        long until=SystemClock.elapsedRealtime()+20000;
        while(SystemClock.elapsedRealtime()<until){if("true".equals(js(condition)))return;SystemClock.sleep(200);}
        fail("Timed out: "+label);
    }
    private void click(String id) throws Exception {
        waitFor("(()=>{const b=document.getElementById('"+id+"');return !!b&&!b.disabled})()",id+" enabled");
        js("document.getElementById('"+id+"').click()");
    }
    private void orient(boolean portrait) throws Exception {
        instrumentation.runOnMainSync(()->activity.setRequestedOrientation(portrait?ActivityInfo.SCREEN_ORIENTATION_PORTRAIT:ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        waitFor(portrait?"innerHeight>innerWidth":"innerWidth>innerHeight","orientation");SystemClock.sleep(300);
    }
    private void capture(String name) throws Exception {
        waitFor("[...document.querySelectorAll('.screen.active img')].every(i=>i.complete&&i.naturalWidth>0&&(!i.dataset.requestedSrc||i.getAttribute('src')===i.dataset.requestedSrc))","art loaded");
        // A DOM query can complete before the WebView compositor presents that screen.
        // Wait for finite scene/page transitions, then synchronize with visual state.
        waitFor("document.getAnimations().filter(a=>Number.isFinite(a.effect.getTiming().iterations)).every(a=>a.playState==='finished'||a.playState==='idle')","scene transition finished");
        CountDownLatch drawn=new CountDownLatch(1);
        instrumentation.runOnMainSync(()->web.postVisualStateCallback(SystemClock.uptimeMillis(),new WebView.VisualStateCallback(){
            @Override public void onComplete(long requestId){web.postInvalidateOnAnimation();web.postDelayed(drawn::countDown,750);}
        }));
        assertTrue("WebView frame presented",drawn.await(15,TimeUnit.SECONDS));
        instrumentation.waitForIdleSync();
        Bitmap bitmap=instrumentation.getUiAutomation().takeScreenshot();assertNotNull(bitmap);
        File directory=new File(instrumentation.getTargetContext().getExternalFilesDir(null),"qa");directory.mkdirs();
        try(FileOutputStream stream=new FileOutputStream(new File(directory,name+".png"))){assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG,100,stream));}
        try(FileOutputStream stream=new FileOutputStream(new File(directory,name+".json"))){stream.write(js("({screen:document.querySelector('.screen.active').id,width:innerWidth,height:innerHeight,images:[...document.querySelectorAll('.screen.active img')].map(i=>i.getAttribute('src'))})").getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        bitmap.recycle();
    }
    @Test public void screensAndRotation() throws Exception {
        launch();orient(true);capture("title-portrait");orient(false);capture("title-landscape");
        click("newGameBtn");
        js("document.querySelector('#careerGrid button:nth-child(3)').click();document.querySelector('#reasonGrid button').click()");
        capture("setup-landscape");orient(true);capture("setup-portrait");click("beginLifeBtn");
        waitFor("document.getElementById('prepScreen').classList.contains('active')","preparation");
        js("[...document.querySelectorAll('#prepActions button')].find(b=>b.textContent.includes('CLAIM RELOCATION'))?.click()");
        capture("prep-portrait");orient(false);capture("prep-landscape");click("openMarketBtn");capture("classifieds-landscape");
        orient(true);capture("classifieds-portrait");click("visitSellerBtn");capture("seller-portrait");orient(false);capture("seller-landscape");
        click("inspectBtn");click("testDriveBtn");click("mechanicCheckBtn");click("negotiateBtn");
        js("document.getElementById('offerButtons').scrollIntoView()");capture("negotiation-landscape");
        click("buyCarBtn");waitFor("document.getElementById('supplyScreen').classList.contains('active')","purchase");
        capture("supplies-landscape");orient(true);capture("supplies-portrait");click("departBtn");
        waitFor("document.getElementById('roadScreen').classList.contains('active')","departure");capture("road-portrait");orient(false);capture("road-landscape");
        click("driveLegBtn");click("tripLogRoadBtn");waitFor("document.querySelector('.trip-odometer').textContent.includes('MI')","Trip Computer");capture("trip-landscape");orient(true);capture("trip-portrait");click("tripBackBtn");
        // Compare the saved journey across both calls to the actual native rotate bridge.
        js("window.savedBeforeRotation=localStorage.getItem('lwh-rc1-save')");click("rotateRoadBtn");
        waitFor("innerWidth>innerHeight","rotate control to landscape");
        assertEquals("true",js("window.savedBeforeRotation===localStorage.getItem('lwh-rc1-save')"));capture("rotation-landscape");
        click("rotateRoadBtn");waitFor("innerHeight>innerWidth","rotate control to portrait");
        assertEquals("true",js("window.savedBeforeRotation===localStorage.getItem('lwh-rc1-save')"));capture("rotation-portrait");
        assertEquals("true",js("document.documentElement.scrollWidth<=innerWidth"));
    }
    @Test public void resumeAfterProcessStop() throws Exception {
        launch();orient(true);
        waitFor("!document.getElementById('resumeBtn').hidden","saved journey available");click("resumeBtn");
        waitFor("document.getElementById('roadScreen').classList.contains('active')","resume after process stop");capture("resume-portrait");
        click("tripLogRoadBtn");assertEquals("true",js("document.querySelector('.trip-odometer').textContent.includes('MI')"));
    }
}
