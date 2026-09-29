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
        assertEquals(name+" has no horizontal overflow","true",js("document.documentElement.scrollWidth<=innerWidth+1"));
        Bitmap bitmap=instrumentation.getUiAutomation().takeScreenshot();assertNotNull(bitmap);
        File directory=new File(instrumentation.getTargetContext().getExternalFilesDir(null),"qa");directory.mkdirs();
        try(FileOutputStream stream=new FileOutputStream(new File(directory,name+".png"))){assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG,100,stream));}
        try(FileOutputStream stream=new FileOutputStream(new File(directory,name+".json"))){stream.write(js("({screen:document.querySelector('.screen.active').id,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,screenBounds:document.querySelector('.screen.active').getBoundingClientRect().toJSON(),images:[...document.querySelectorAll('.screen.active img')].map(i=>i.getAttribute('src'))})").getBytes(java.nio.charset.StandardCharsets.UTF_8));}
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
    private void storyChoice(String id) throws Exception {
        if("eat".equals(id)) {
            if("true".equals(js("!!document.querySelector('[data-story-choice=correct_order]')")))storyChoice("correct_order");
            if("true".equals(js("!!document.querySelector('[data-story-choice=generator]')")))storyChoice("generator");
        }
        waitFor("(()=>{const b=document.querySelector('[data-story-choice=\""+id+"\"]');return !!b&&!b.disabled})()", "story choice "+id);
        js("document.querySelector('[data-story-choice=\""+id+"\"]').click()");
    }
    /** The fixture is a COPY in the emulator only, never a production test hook. */
    @Test public void storyJourney() throws Exception {
        launch();orient(true);
        js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));if(!s||!s.car)throw Error('Base journey fixture missing');s.currentEvent=null;s.ended=false;s.ending=null;s.story=null;delete s.storyIntegrationVersion;s.storyTranscript=[];s.cash=1000;s.days=7;s.fatigue=20;s.hunger=70;s.condition=85;s.fuel=90;s.inventory=['toolkit','fixflat'];s.health=100;localStorage.setItem('lwh-rc1-save',JSON.stringify(s));})()");
        click("resumeBtn");click("dinerStopBtn");storyChoice("enter");storyChoice("counter");storyChoice("breakfast");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.cash===1000&&s.story.trip.active.data.billCents===2200})()"));
        capture("diner-waiting-portrait");
        js("window.stopBeforeRotation=localStorage.getItem('lwh-rc1-save')");click("rotateRoadBtn");waitFor("innerWidth>innerHeight","diner landscape");
        assertEquals("true",js("window.stopBeforeRotation===localStorage.getItem('lwh-rc1-save')"));capture("diner-waiting-landscape");
        storyChoice("placemat");storyChoice("eat");storyChoice("pay");storyChoice("exit");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.cash===978&&s.hunger===15&&!s.currentEvent&&!s.story.trip.active})()"));
        // Stage the emulator-only fixture AFTER the old Activity has paused.
        // Otherwise its legitimate onPause autosave would replace the fixture.
        String tireFixture=js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.currentEvent='tire';s.roadNarrative={tag:'MECHANICAL',title:'THUMP. THUMP. THUMP.',body:'A tire needs attention.'};return JSON.stringify(s);})()");
        launch();js("localStorage.setItem('lwh-rc1-save',"+tireFixture+")");click("resumeBtn");
        js("[...document.querySelectorAll('#eventChoices button')].find(b=>b.textContent==='STOP NOW').click()");
        storyChoice("inspect");
        assertEquals("true",js("!!document.querySelector('[data-story-choice=\"tools\"]')"));
        orient(true);capture("tire-choice-portrait");
        js("localStorage.setItem('lwh-qa-story-before-restart',localStorage.getItem('lwh-rc1-save'))");
    }
    @Test public void storyResumeAfterProcessStop() throws Exception {
        launch();click("resumeBtn");
        assertEquals("true",js("(()=>{const a=JSON.parse(localStorage.getItem('lwh-qa-story-before-restart'));const b=JSON.parse(localStorage.getItem('lwh-rc1-save'));return JSON.stringify(a.story)===JSON.stringify(b.story)&&a.cash===b.cash&&a.distance===b.distance})()"));
        storyChoice("assistance");storyChoice("exit");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.cash===893&&!s.currentEvent&&!s.vehicleFaults.includes('tire')})()"));
        js("window.milesBeforeStoryDrive=JSON.parse(localStorage.getItem('lwh-rc1-save')).distance");click("driveLegBtn");
        assertEquals("true",js("JSON.parse(localStorage.getItem('lwh-rc1-save')).distance>window.milesBeforeStoryDrive"));
        capture("story-return-portrait");
    }
    @Test public void storyDepth() throws Exception {
        launch();orient(true);
        js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.story=null;delete s.storyIntegrationVersion;s.storyTranscript=[];s.currentEvent=null;s.ended=false;s.ending=null;s.cash=1000;s.days=7;s.distance=200;s.totalMiles=1600;s.fatigue=10;s.hunger=10;s.condition=85;s.fuel=95;s.inventory=['toolkit'];s.health=100;localStorage.setItem('lwh-rc1-save',JSON.stringify(s));})()");
        click("resumeBtn");click("dinerStopBtn");storyChoice("enter");storyChoice("counter");storyChoice("breakfast");
        assertEquals("true",js("document.getElementById('storyPlaceView').dataset.table==='empty'&&getComputedStyle(document.getElementById('hornBtn').parentElement).display==='none'"));
        capture("depth-waiting-portrait");
        storyChoice("chat");storyChoice("ask_hal");storyChoice("talk_car");
        assertEquals("true",js("document.getElementById('eventBody').textContent.includes('One click')"));
        capture("depth-answer-portrait");
        js("window.depthSavedBeforeRotation=localStorage.getItem('lwh-rc1-save')");click("rotateRoadBtn");waitFor("innerWidth>innerHeight","depth landscape");
        assertEquals("true",js("window.depthSavedBeforeRotation===localStorage.getItem('lwh-rc1-save')"));capture("depth-answer-landscape");
        storyChoice("offer_help");storyChoice("finish_talking");storyChoice("eat");storyChoice("pay");
        assertEquals("true",js("JSON.parse(localStorage.getItem('lwh-rc1-save')).cash===978"));
        storyChoice("outside");storyChoice("inspect_hal");storyChoice("refer_shop");storyChoice("leave_job");storyChoice("exit");
        js("Math.random=()=>.95");
        for(int i=0;i<6&&!"true".equals(js("JSON.parse(localStorage.getItem('lwh-rc1-save')).currentEvent==='story_callback'"));i++)click("driveLegBtn");
        assertEquals("true",js("document.getElementById('eventBody').textContent.includes('stayed until I had help')"));
        capture("depth-road-callback-landscape");storyChoice("accept_thanks");storyChoice("exit");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.cash===993&&s.story.world.flags.partsJob.callbackDone})()"));
        launch();click("resumeBtn");assertEquals("true",js("JSON.parse(localStorage.getItem('lwh-rc1-save')).cash===993"));
        String lowFixture=js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.story=null;delete s.storyIntegrationVersion;s.storyTranscript=[];s.currentEvent='tire';s.condition=2;s.cash=0;s.inventory=[];s.roadNarrative={tag:'TIRE',title:'A FLAT TIRE',body:'Two-percent condition acceptance test.'};return JSON.stringify(s);})()");
        launch();js("localStorage.setItem('lwh-rc1-save',"+lowFixture+")");click("resumeBtn");
        js("[...document.querySelectorAll('#eventChoices button')].find(b=>b.textContent==='STOP NOW').click()");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return !s.ended&&s.condition===2&&!!document.querySelector('[data-story-choice=inspect]')})()"));
        storyChoice("inspect");orient(true);capture("depth-low-condition-portrait");storyChoice("wait_help");storyChoice("exit");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.condition===2&&!s.vehicleFaults.includes('tire')&&!s.ended})()"));
    }

    @Test public void correctnessRepairAndDeadline() throws Exception {
        launch();orient(true);
        String parked=js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.runId='qa-repair-'+Date.now();s.story=null;delete s.storyIntegrationVersion;s.storyTranscript=[];s.currentEvent='tire';s.ended=false;s.ending=null;s.stats.committed=false;s.cash=1000;s.days=7;s.distance=200;s.totalMiles=1600;s.fatigue=93;s.hunger=20;s.condition=80;s.fuel=95;s.inventory=['toolkit'];s.health=100;s.restRisk=null;s.pendingLegMiles=null;return JSON.stringify(s);})()");
        launch();js("localStorage.setItem('lwh-rc1-save',"+parked+")");click("resumeBtn");
        js("[...document.querySelectorAll('#eventChoices button')].find(b=>b.textContent==='STOP NOW').click()");
        storyChoice("inspect");storyChoice("tools");storyChoice("attempt");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return !s.ended&&s.distance===200&&s.fatigue===98})()"));
        capture("repair-parked-portrait");
        launch();click("resumeBtn");
        assertEquals("true",js("!JSON.parse(localStorage.getItem('lwh-rc1-save')).ended"));
        if("true".equals(js("!!document.querySelector('[data-story-choice=assistance]')")))storyChoice("assistance");
        storyChoice("exit");click("driveLegBtn");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.currentEvent==='restDecision'&&s.distance===200})()"));
        capture("rest-before-driving-portrait");
        js("[...document.querySelectorAll('#eventChoices button')].find(b=>b.textContent.startsWith('SLEEP IN CAR')).click()");
        assertEquals("true",js("JSON.parse(localStorage.getItem('lwh-rc1-save')).fatigue===28"));
        // Construct a valid one-minute deadline / ten-mile final-leg edge case.
        String late=js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.runId='qa-deadline-'+Date.now();s.story=null;delete s.storyIntegrationVersion;s.storyTranscript=[];s.currentEvent=null;s.ended=false;s.ending=null;s.stats.committed=false;s.reason={id:'career',hard:true};s.days=1/1440;s.distance=1590;s.totalMiles=1600;s.fuel=95;s.fatigue=10;s.condition=80;s.restRisk=null;s.pendingLegMiles=null;return JSON.stringify(s);})()");
        launch();js("localStorage.setItem('lwh-rc1-save',"+late+")");click("resumeBtn");js("Math.random=()=>.25");click("driveLegBtn");
        assertEquals("true",js("(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));return s.ending.kicker==='YOU MISSED THE DEADLINE'&&s.distance===1600&&s.days<0&&s.stats.committed})()"));
        String record=js("localStorage.getItem('lwh-lifetime-v1')");
        launch();click("resumeBtn");
        assertEquals(record,js("localStorage.getItem('lwh-lifetime-v1')"));
        capture("deadline-enforced-portrait");
    }

}
