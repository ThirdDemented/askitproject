'use strict';
const {chromium}=require(process.env.LWH_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const web=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'results/story-depth');
const hooks=`window.QA={state:()=>state,blankState,blankTripStats,careers,reasons,carPool,roadEvents,triggerEvent,show,renderRoadHud,storyAudio:()=>storyRuntime.audioStatus(),fixture:p=>{state={...blankState(),...p};ensureTripStats();}};`;
const server=http.createServer((req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(web,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(web+path.sep))throw Error('path');let b=fs.readFileSync(file);if(file.endsWith('/game.js'))b=b.toString().replace('boot();',hooks+'\nboot();');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.end(b);}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.LWH_CHROME?{executablePath:process.env.LWH_CHROME}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
 await page.route(/router\.project-osrm\.org|photon\.komoot\.io/,r=>r.abort());
 const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS: '+name);};
 const s=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lwh-rc1-save')));
 const click=id=>page.locator('[data-story-choice="'+id+'"]').click();
 const body=()=>page.locator('#eventBody').innerText();
 async function kitchen(){if(await page.locator('[data-story-choice="correct_order"]').count())await click('correct_order');if(await page.locator('[data-story-choice="generator"]').count())await click('generator');}
 const fixture=async(p={})=>page.evaluate(p=>{localStorage.removeItem('lwh-rc1-save');QA.fixture({departed:true,career:QA.careers.find(c=>c.id==='mechanic'),reason:QA.reasons.find(r=>r.id==='fresh'),car:{...QA.carPool.find(c=>c.id==='family'),boughtPrice:2000},cash:1000,days:12,distance:200,totalMiles:1600,fuel:95,condition:85,fatigue:10,hunger:10,morale:70,inventory:['toolkit'],stats:QA.blankTripStats(),...p});QA.renderRoadHud();QA.show('roadScreen');},p);
 async function capture(name){await page.waitForFunction(()=>[...document.querySelectorAll('#roadScreen img')].every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:path.join(out,name+'.png')});}
 try{
  await page.goto('http://127.0.0.1:'+server.address().port);await fixture();
  await page.click('#dinerStopBtn');await click('enter');await click('counter');await click('breakfast');
  ok('waiting shows an empty setting, not breakfast',await page.locator('#storyPlaceView').getAttribute('data-table')==='empty');
  ok('horn and dashboard are not available inside the diner',await page.locator('#hornBtn').isHidden()&&await page.locator('#dashBtn').isHidden());
  const initial=await s();await page.waitForTimeout(350);ok('reading changes no saved resources or random outcome',JSON.stringify(await s())===JSON.stringify(initial));
  await capture('waiting-empty-table-portrait');
  await click('chat');ok('chat has an authored answer',/Passing through|remember you/.test(await body()));
  await click('ask_hal');await click('talk_car');ok('Hal answers the actual car question',/One click/.test(await body()));
  ok('question is not silently replaced by a meal',await page.locator('[data-story-choice="offer_help"]').isVisible());
  ok('choices precede auxiliary transcript controls',await page.evaluate(()=>!!(document.getElementById('eventChoices').compareDocumentPosition(document.getElementById('storyTranscript'))&Node.DOCUMENT_POSITION_FOLLOWING)));
  ok('available cash and reserved meal money remain visible indoors',/Cash \$1,?000\.00.*Meal reserved \$22\.00/.test(await page.locator('#storyStatus').innerText()));
  await capture('hal-answer-portrait');
  const answer=await s();await page.reload();await page.click('#resumeBtn');ok('answer and kitchen state survive reopening',JSON.stringify((await s()).story)===JSON.stringify(answer.story));
  for(const [width,height]of[[360,800],[844,390],[412,915],[1280,720]]){await page.setViewportSize({width,height});ok('dialogue fits '+width+'x'+height,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.setViewportSize({width:844,height:390});await capture('hal-answer-landscape');
  await click('offer_help');ok('help offer is explicit and optional',/Forty-five dollars/.test(await body()));
  await click('finish_talking');await kitchen();ok('the ordered breakfast is shown only when served',await page.locator('#storyPlaceView').getAttribute('data-table')==='breakfast');
  await click('eat');ok('eaten meal becomes an empty plate',await page.locator('#storyPlaceView').getAttribute('data-table')==='empty_plate');
  await click('pay');ok('payment opens the optional after-lunch choice',(await s()).cash===978&&await page.locator('[data-story-choice="changed_mind"]').isVisible());
  await click('outside');await click('inspect_hal');ok('toolkit unlocks an attempt on Hal’s car',await page.locator('[data-story-choice="help_repair"]').isVisible());
  await click('refer_shop');ok('professional referral displays what actually happened',/called the shop/.test(await body()));
  await click('leave_job');await click('exit');
  let j=await s();ok('favor persists without a fictitious wage',j.story.world.flags.partsJob.status==='referred'&&j.cash===978&&j.stats.totalEarned===0);
  // Controlled random stream avoids unrelated interrupts while actual driving
  // advances actual miles to the callback. This is not a fixture-free full run.
  await page.evaluate(()=>{Math.random=()=>.95;});
  for(let i=0;i<6&&(await s()).currentEvent!=='story_callback';i++)await page.click('#driveLegBtn');
  j=await s();ok('real driven miles trigger the earned callback',j.distance>=j.story.world.flags.partsJob.dueAtMiles&&j.currentEvent==='story_callback');
  ok('callback remembers the specific referral',/stayed until I had help/.test(await body()));
  await page.setViewportSize({width:390,height:844});await capture('hal-road-payoff-portrait');
  await click('accept_thanks');await click('exit');j=await s();ok('later reward is credited once to real cash and ledger',j.cash===993&&j.stats.totalEarned===15&&j.stats.storyEarned===15&&j.story.world.flags.partsJob.callbackDone);
  await page.reload();await page.click('#resumeBtn');ok('settled callback stays settled on reload',(await s()).cash===993&&!await page.evaluate(()=>LWHStoryBridge.callbackDue(QA.state())));
  // Actual UI regression for the acceptance-review failure, not just the reducer.
  await fixture({condition:2,cash:0,inventory:[]});await page.evaluate(()=>QA.triggerEvent(QA.roadEvents.find(e=>e.id==='tire')));
  await page.locator('#eventChoices button').filter({hasText:'STOP NOW'}).click();
  ok('2%-condition driver receives repair choices instead of an instant ending',!(await s()).ended&&(await s()).condition===2&&await page.locator('[data-story-choice="inspect"]').isVisible());
  await click('inspect');ok('unprepared driver is not given toolkit action',await page.locator('[data-story-choice="tools"]').count()===0);await capture('two-percent-repair-portrait');
  await click('wait_help');await click('exit');ok('help resolves the tire without pretending to repair the engine',(await s()).condition===2&&!(await s()).vehicleFaults.includes('tire'));
  // Natural old luck event now enters a saved, single-search discovery.
  await fixture();await page.evaluate(()=>QA.triggerEvent(QA.roadEvents.find(e=>e.id==='luck')));await page.locator('#eventChoices button').filter({hasText:'GRAB IT'}).click();
  const result=(await s()).story.trip.active.data.result;await click('search');await click('exit');const found=await s();
  ok('under-seat event uses the saved discovery pool',['nothing','receipt','charger','cash','key'].includes(result));
  ok('a searched vehicle is no longer eligible for repeated loot',await page.evaluate(()=>!QA.roadEvents.find(e=>e.id==='luck').eligible(QA.state())));
  await page.reload();await page.click('#resumeBtn');ok('discovery payout and search marker survive reload',(await s()).cash===found.cash&&await page.evaluate(()=>!LWHStoryBridge.discoveryEligible(QA.state())));
  // Compatibility with a genuine alpha1-layout interaction (legacy definition).
  await fixture();const legacyRaw=await page.evaluate(()=>{let t=LWHStoryEngine.create({seed:913,cashCents:100000});t=LWHStoryEngine.begin(t,'diner',LWHStoryScenes);for(const id of ['enter','counter','soup']){const v=LWHStoryEngine.view(t,LWHStoryScenes);t=LWHStoryEngine.choose(t,{interactionId:v.interactionId,revision:v.revision,choiceId:id},LWHStoryScenes);}t.contentVersion='phase1.1';delete t.trip.earnedCents;const j=QA.state();j.story=t;j.storyIntegrationVersion=1;j.currentEvent='food';const raw=JSON.stringify(j);localStorage.setItem('lwh-rc1-save',raw);return raw;});
  await page.reload();await page.click('#resumeBtn');ok('alpha1 pending meal upgrades without moving its node or charging',(await s()).story.contentVersion==='phase1.2'&&(await s()).story.trip.active.node==='waiting'&&(await s()).cash===1000);
  ok('pre-upgrade alpha1 bytes are retained',await page.evaluate(()=>localStorage.getItem('lwh-before-depth-alpha1'))===legacyRaw);
  await click('placemat');await click('eat');await click('pay');await click('exit');ok('legacy pending meal can finish under its original rules',(await s()).cash===988);
  await require('./repair-browser-cases.cjs')({page,fixture,s,click,kitchen,ok,capture});
  ok('no uncaught JavaScript errors',errors.length===0);
  const resultReport={suite:'story-depth-browser',passed:checks.length,checks,errors};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(resultReport,null,2));console.log(JSON.stringify(resultReport));
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({passed:checks.length,checks,errors,error:e.message},null,2));await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
