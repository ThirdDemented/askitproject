/* End-to-end integration against actual index.html/game.js. Hooks exist only in
 * this test server, never in APK assets. No live routing requests are required. */
'use strict';
const {chromium}=require(process.env.LWH_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const web=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'results/story-journey');
const hooks=`window.QA={state:()=>state,blankState,blankTripStats,careers,reasons,carPool,triggerEvent,roadEvents,show,save,renderRoadHud,driveLeg,storyAudio:()=>storyRuntime.audioStatus(),audioNodes:()=>({audioCtx,master}),fixture:p=>{state={...blankState(),...p};ensureTripStats();}};`;
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(web,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(web+path.sep))throw Error('path');let body=fs.readFileSync(file);if(file.endsWith('/game.js'))body=body.toString().replace('boot();',hooks+'\nboot();');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.end(body);}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.LWH_CHROME?{executablePath:process.env.LWH_CHROME}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
 await page.route(/router\.project-osrm\.org|photon\.komoot\.io/,r=>r.abort());
 const ok=(name,value)=>{assert.ok(value,name);checks.push(name);};
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lwh-rc1-save')));
 const choose=id=>page.locator('[data-story-choice="'+id+'"]').click();
 const fixture=async(p={})=>page.evaluate(p=>{QA.fixture({departed:true,career:QA.careers.find(c=>c.id==='mechanic'),reason:QA.reasons.find(r=>r.id==='fresh'),car:{...QA.carPool.find(c=>c.id==='family'),boughtPrice:2000},cash:1000,days:12,distance:200,totalMiles:1600,fuel:95,condition:85,fatigue:20,hunger:70,morale:70,inventory:['toolkit','fixflat'],stats:QA.blankTripStats(),...p});QA.renderRoadHud();QA.show('roadScreen');},p);
 async function capture(name){await page.waitForFunction(()=>[...document.querySelectorAll('#roadScreen img')].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:path.join(out,name+'.png')});}
 try{
  await page.goto('http://127.0.0.1:'+server.address().port);await fixture();
  const original=await page.evaluate(()=>localStorage.getItem('lwh-rc1-save'));
  await page.click('#dinerStopBtn');await choose('enter');await choose('counter');await choose('breakfast');
  let s=await state();ok('natural road-stop button enters the integrated diner',s.story.trip.active.node==='waiting');
  ok('original journey retained as an untouched local backup',await page.evaluate(()=>localStorage.getItem('lwh-before-story-v4'))===original);
  ok('ordering reserves money without spending it twice',s.cash===1000&&s.story.trip.active.data.billCents===2200&&s.stats.foodSpent===0);
  ok('market and driving cannot bypass an unfinished stop',await page.locator('#marketStopBtn').isDisabled()&&await page.locator('#driveLegBtn').isHidden());
  const before=JSON.stringify(s);await page.waitForTimeout(400);
  ok('reading does not consume time or reroll the stop',JSON.stringify(await state())===before);
  await page.click('#storyTranscript summary');ok('readable transcript is present',await page.locator('.story-transcript-lines').innerText().then(t=>t.includes('YOU:')&&t.includes('griddle')));
  await capture('diner-waiting-portrait');
  for(const [w,h]of[[360,800],[844,390],[412,915],[1280,720]]){await page.setViewportSize({width:w,height:h});ok('integrated stop fits '+w+'x'+h,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await capture('diner-waiting-landscape');
  await page.reload();await page.click('#resumeBtn');
  ok('pending meal resumes with the same choice and random state',await page.evaluate(s=>JSON.stringify(QA.state().story)===JSON.stringify(s.story),s));
  await page.click('#tripLogRoadBtn');await page.click('#tripBackBtn');
  ok('Trip Computer returns to the unfinished encounter',await page.locator('[data-story-choice="placemat"]').isVisible());
  await choose('placemat');await choose('eat');await choose('pay');await choose('exit');s=await state();
  ok('meal affects actual road resources and ledger once',s.cash===978&&s.hunger===15&&s.stats.foodSpent===22&&s.stats.totalSpent===22&&s.stats.stopMinutes===26&&s.distance===200);
  await page.reload();await page.click('#resumeBtn');ok('paid meal stays paid on reload',(await state()).cash===978&&(await state()).story.trip.active===null);
  await page.click('#driveLegBtn');ok('road trip continues after encounter',(await state()).distance>200);
  // Natural food event still offers the original skip/supplies paths.
  await fixture();await page.evaluate(()=>QA.triggerEvent(QA.roadEvents.find(e=>e.id==='food')));await page.locator('#eventChoices button').filter({hasText:'ENTER DINER'}).click();
  ok('hunger event enters the same diner engine',(await state()).story.trip.active.scene==='diner');
  await choose('leave');await choose('exit');ok('declining the diner does not charge or feed the player',(await state()).cash===1000&&(await state()).hunger===70);
  // Native road tire event, skill and equipment gates, exact persisted outcome.
  await fixture({cash:0,inventory:[]});await page.evaluate(()=>QA.triggerEvent(QA.roadEvents.find(e=>e.id==='tire')));
  await page.locator('#eventChoices button').filter({hasText:'STOP NOW'}).click();await choose('inspect');
  ok('zero-budget driver can stop without an $85 entry charge',(await state()).cash===0);
  ok('no toolkit means no work option',await page.locator('[data-story-choice="tools"]').count()===0);
  await capture('tire-choices-portrait');const cause=(await state()).story.trip.active.data.cause;
  await page.reload();await page.click('#resumeBtn');ok('tire cause and choices survive reopening',(await state()).story.trip.active.data.cause===cause);
  await choose('walk');await choose('clerk_help');await choose('exit');s=await state();
  ok('zero-budget repair costs time and records a favor, not cash',s.cash===0&&s.stats.stopMinutes===170&&!s.vehicleFaults.includes('tire')&&s.story.world.flags.oweRoadsideFavor);
  await fixture();await page.evaluate(()=>QA.triggerEvent(QA.roadEvents.find(e=>e.id==='tire')));await page.locator('#eventChoices button').filter({hasText:'STOP NOW'}).click();await choose('inspect');
  ok('packed toolkit unlocks real repair action',await page.locator('[data-story-choice="tools"]').isVisible());
  await choose('tools');await choose('attempt');s=await state();ok('attempt spends real journey time and fatigue',s.stats.stopMinutes===35&&s.fatigue===25);
  if(s.story.trip.active.node==='complication')await choose('assistance');await choose('exit');
  ok('repair exits to the same mileage and clears the fault',(await state()).distance===200&&!(await state()).vehicleFaults.includes('tire'));
  // Storage failures do not consume the chosen action or overwrite original data.
  await fixture();await page.click('#dinerStopBtn');await choose('enter');await choose('counter');
  const stable=await state();await page.evaluate(()=>{window.savedSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='lwh-rc1-save')throw new DOMException('Storage full','QuotaExceededError');return window.savedSetItem.call(this,k,v);};});
  await choose('soup');ok('storage failure leaves in-memory and saved journey untouched',JSON.stringify(await state())===JSON.stringify(stable)&&await page.evaluate(s=>JSON.stringify(QA.state())===JSON.stringify(s),stable));
  ok('storage failure is visible',await page.locator('#storageWarning').isVisible());
  await page.evaluate(()=>{Storage.prototype.setItem=window.savedSetItem;});await choose('soup');
  // Original synthesized ambience has signal, no clipping, and respects lifecycle/mute.
  if(!await page.evaluate(()=>QA.audioNodes().audioCtx?.state==='running')){await page.click('#storySoundBtn');if(!await page.evaluate(()=>QA.audioNodes().audioCtx?.state==='running'))await page.click('#storySoundBtn');}
  await page.evaluate(()=>LWHLifecycle.resume());await page.waitForTimeout(250);
  ok('diner ambience starts in an audible waiting scene',await page.evaluate(()=>QA.storyAudio().playing));
  const peak=await page.evaluate(async()=>{const {audioCtx,master}=QA.audioNodes(),a=audioCtx.createAnalyser();a.fftSize=1024;master.connect(a);let p=0;for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,40));const d=new Float32Array(1024);a.getFloatTimeDomainData(d);p=Math.max(p,...d.map(Math.abs));}master.disconnect(a);return p;});
  ok('mixed audio produces a nonclipping signal',peak>.0001&&peak<.98);
  await page.evaluate(()=>LWHLifecycle.pause());ok('background pauses all story audio',await page.evaluate(()=>!QA.storyAudio().playing&&QA.storyAudio().sources===0));
  await page.evaluate(()=>LWHLifecycle.resume());await page.waitForTimeout(200);ok('foreground restores ambience',await page.evaluate(()=>QA.storyAudio().playing));
  await page.click('#storySoundBtn');ok('mute stops ambience while preserving text',await page.evaluate(()=>!QA.storyAudio().playing)&&await page.locator('#eventBody').innerText().then(t=>t.length>20));
  await choose('cancel');await choose('exit');ok('leaving the diner cleans up audio sources',await page.evaluate(()=>!QA.storyAudio().playing&&QA.storyAudio().sources===0));
  // Deadlines terminate through the game's existing ending/lifetime path.
  await fixture({days:1/1440,reason:{id:'career',hard:true}});await page.click('#dinerStopBtn');await choose('enter');
  ok('stop time can end a hard-deadline journey without trapping a choice',await page.locator('#endingScreen').isVisible()&&(await state()).ended);
  const ended=await state();await page.reload();await page.click('#resumeBtn');ok('ending survives reopening without double-finalizing',await page.locator('#endingScreen').isVisible()&&(await state()).stats.committed&&ended.stats.committed);
  // Unsupported encounter schemas must not be overwritten by resume's show/save.
  await fixture();await page.click('#dinerStopBtn');await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lwh-rc1-save'));s.storyIntegrationVersion=99;localStorage.setItem('lwh-rc1-save',JSON.stringify(s));});
  const invalid=await page.evaluate(()=>localStorage.getItem('lwh-rc1-save'));await page.reload();await page.click('#resumeBtn');
  ok('future encounter saves are rejected and retained',await page.evaluate(()=>localStorage.getItem('lwh-rc1-save'))===invalid);
  ok('no uncaught integration JavaScript errors',errors.length===0);
  const result={suite:'story-journey',passed:checks.length,checks,errors,audioPeak:peak};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
