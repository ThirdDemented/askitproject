'use strict';
// Review only. All shipped game assets remain exactly at b70002b. Test fixture
// access is injected solely by this local test server, never in packaged assets.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const out=path.resolve(__dirname,'results/alpha1-independent');fs.mkdirSync(out,{recursive:true});
const E=require(path.join(root,'story-engine.js')), S=require(path.join(root,'story-scenes.js'));
const R={apk:'1.2.0-alpha.1',apkSha256:'bca6ac2018682440e59b0f7dc076074fccdc8c1bf3b71ade0c2ec2537c8ea1db',source:'b70002b14d50c897dff4dc33758e253b9bf56b94',checks:[],observations:[],walkthroughs:[],screens:[],errors:[],limits:['Browser playback is not a fresh native Android test or human listening assessment.','Fixtures used for specified edge cases; complete UI run separately labeled.','Successful evidence collection is not design or store approval.']};
const check=(name,pass,detail='')=>{R.checks.push({name,pass:Boolean(pass),detail});console.log((pass?'PASS':'FAIL')+': '+name);};
const observe=(name,detail)=>R.observations.push({name,detail});
const persist=()=>fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(R,null,2));
const expected={'game.js':'eb43f4fd5faadf27d0c6778c831e9d72dc2d3ec610f208e32b197cee4aad6522','index.html':'84a5cbe749524faa44be90e11ce4871fdb9691a6343086d07b0ea49d9d3b8926','story-scenes.js':'948c948c1b5299b2ed32bff1a5fd925df154edb59fe576fc9cf9f5a26252b18d','story-engine.js':'2ad2a89418dae35c6f7d2f3d583bdb9a37c7d3ade49247bb56f9482c9399ffc5','story-runtime.js':'9532e2795d04374fefa2c8f479bf011a2bfc48ac82ec04bff137cf4e26a3e124','story-bridge.js':'cc3d76ae5fef0c5d39fa2416f9e182237ad7167d4cb7edc15660876734eaef78','story-audio.js':'5f510f97e454a06732655ed5225902a93a8d584c75eae4575c1895be47a94278','story-integration.css':'a2c917405d3375e38ab8011cab5c8e223721f96ce737ceb927b4dea26307d3a8'};
for(const [name,hash]of Object.entries(expected)){const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');if(actual!==hash){check('Packaged bytes match '+name,false,actual);persist();throw Error('Wrong game source');}}
check('Critical game assets match the supplied APK byte for byte',true);
const turn=(s,id)=>{const v=E.view(s,S);return E.choose(s,{choiceId:id,revision:v.revision,interactionId:v.interactionId},S);};
const sequence=(s,ids)=>ids.reduce(turn,s);
const meal=(seed,seat='counter')=>sequence(E.begin(E.create({seed:E.hash(seed),career:'mechanic',inventory:['toolkit']}),'diner',S),['enter',seat,'soup']);
const pools={overheard:{},wait:{},chat:{},placemat:{},repair:{}};
let seatDifferent=0;
for(let i=0;i<1000;i++){
 const a=meal('review-'+i),b=meal('review-'+i,'booth');
 for(const s of[a]){const key=s.trip.active.data.overheard;pools.overheard[key]=(pools.overheard[key]||0)+1;}
 for(const id of['wait','chat','placemat']){const next=turn(a,id),key=next.trip.active.node;pools[id][key]=(pools[id][key]||0)+1;}
 const av=E.view(turn(a,'wait'),S),bv=E.view(turn(b,'wait'),S);if(JSON.stringify(av)!==JSON.stringify(bv))seatDifferent++;
 let r=E.begin(E.create({seed:E.hash('repair-'+i),inventory:['toolkit']}),'repair',S);r=sequence(r,['inspect','tools','attempt']);
 const rk=r.trip.active.node==='done'?'repaired':r.trip.active.data.complication;pools.repair[rk]=(pools.repair[rk]||0)+1;
}
observe('Seeded variety sample',pools);observe('Counter versus booth outcome differences in 1000 identical-seed pairs',seatDifferent);
let parts;
for(let i=0;i<100;i++){parts=meal('parts-'+i);if(parts.trip.active.data.overheard==='parts')break;}
const conversation=turn(parts,'engage');
const follow=turn(conversation,'talk_car'),listen=turn(conversation,'listen_story');
observe('Ask what happened before car stopped',{before:E.view(conversation,S),after:E.view(follow,S),flags:follow.world.flags});
observe('Listen to rest of story',{before:E.view(conversation,S).body,after:E.view(listen,S).body});
let repeat=sequence(parts,['placemat','eat','tip','exit']);repeat=E.begin(repeat,'diner',S);
observe('Return after tipping Marnie',{npc:repeat.world.npcs['diner.marnie'],arrival:E.view(repeat,S).body,seat:E.view(turn(repeat,'enter'),S).body});
const whole=['game.js','story-scenes.js','story-bridge.js','story-runtime.js'].map(n=>fs.readFileSync(path.join(root,n),'utf8')).join('\n');
observe('Payoff references in production code',Object.fromEntries(['partsOwnerMet','metLeon','oweRoadsideFavor','sawGiantSpoonAd','temporaryRepairs'].map(x=>[x,(whole.match(new RegExp(x,'g'))||[]).length])));
persist();
const hooks=`window.REVIEW={state:()=>state,blankState,blankTripStats,careers,reasons,carPool,roadEvents,triggerEvent,show,save,renderRoadHud,chooseEvent,audio:()=>storyRuntime.audioStatus(),fixture:p=>{state={...blankState(),...p};ensureTripStats();}};`;
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))throw Error('Invalid path');let body=fs.readFileSync(file);if(file.endsWith('/game.js'))body=body.toString().replace('boot();',hooks+'\nboot();');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.end(body);}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>R.errors.push(e.message));page.on('dialog',d=>d.dismiss());
 await page.route(/router\.project-osrm\.org|photon\.komoot\.io/,r=>r.abort());
 const url='http://127.0.0.1:'+server.address().port;
 const st=()=>page.evaluate(()=>JSON.parse(JSON.stringify(REVIEW.state())));
 const click=id=>page.locator('[data-story-choice="'+id+'"]').click();
 const capture=async(name)=>{await page.waitForTimeout(250);await page.screenshot({path:path.join(out,name+'.png')});R.screens.push(name+'.png');};
 const text=()=>page.locator('#eventBody').innerText();
 const fixture=async(p={})=>page.evaluate(p=>{localStorage.removeItem('lwh-rc1-save');REVIEW.fixture({departed:true,career:REVIEW.careers.find(c=>c.id==='mechanic'),reason:REVIEW.reasons.find(r=>r.id==='fresh'),car:{...REVIEW.carPool.find(c=>c.id==='family'),boughtPrice:2000},cash:1000,days:12,distance:200,totalMiles:1600,fuel:95,condition:85,fatigue:20,hunger:70,morale:70,inventory:['toolkit','fixflat'],stats:REVIEW.blankTripStats(),...p});REVIEW.renderRoadHud();REVIEW.show('roadScreen');},p);
 async function caseOf(name,fn){try{await fn();}catch(e){R.errors.push(name+': '+e.message);check(name,false,e.message);await capture('failed-'+R.errors.length).catch(()=>{});}persist();}
 try{
  await page.goto(url);
  await caseOf('Complete journey via normal UI controls, no resource fixtures',async()=>{
   await page.click('#newGameBtn');await page.locator('#careerGrid button').filter({hasText:'SOFTWARE ENGINEER'}).click();await page.locator('#reasonGrid button').filter({hasText:'JUST LEAVE'}).click();await page.uncheck('#onlineRoutes');await page.click('#beginLifeBtn');
   await page.locator('#prepActions button').filter({hasText:'CLAIM RELOCATION'}).click();await page.click('#openMarketBtn');await page.click('#visitSellerBtn');await page.click('#inspectBtn');await page.click('#testDriveBtn');await page.click('#buyCarBtn');
   await page.locator('#supplyGrid button').filter({hasText:'BASIC TOOLKIT'}).click();await page.locator('#supplyGrid button').filter({hasText:'TIRE SEALANT'}).click();await page.click('#departBtn');
   const journey={kind:'Normal UI from new life through ending',start:await st(),actions:[]};
   await page.click('#dinerStopBtn');for(const id of['enter','booth','breakfast','placemat','eat','pay','exit'])await click(id);
   for(let n=0;n<500;n++){
    const s=await st();if(s.ended){journey.ending=s.ending;journey.finish=s;break;}
    if(s.story?.trip.active){const options=await page.locator('[data-story-choice]:enabled').evaluateAll(bs=>bs.map(b=>b.dataset.storyChoice));const priorities=['enter','counter','breakfast','soup','coffee','placemat','eat','pay','exit','assistance','wait_help'];const id=priorities.find(x=>options.includes(x))||options[0];if(!id)throw Error('No story choice');journey.actions.push({mile:s.distance,scene:s.story.trip.active.node,id});await click(id);}
    else if(s.currentEvent){const options=await page.locator('#eventChoices button:enabled').allTextContents();const priorities=['FILL TANK','GET A ROOM','ENTER DINER','FULL REPAIR','STOP NOW','PULL OVER','REST','KEEP GOING','DECLINE','PASS','NO THANKS'];const label=priorities.map(p=>options.find(x=>x.startsWith(p))).find(Boolean)||options[0];if(!label)throw Error('No road choice for '+s.currentEvent);journey.actions.push({mile:s.distance,event:s.currentEvent,label});await page.locator('#eventChoices button:enabled').filter({hasText:label}).first().click();}
    else {journey.actions.push({mile:s.distance,drive:true});await page.click('#driveLegBtn');}
   }
   R.walkthroughs.push(journey);check('Normal UI run reaches an ending without a dead-end menu',Boolean(journey.ending),journey.ending?.kicker||'No ending within 500 actions');await capture('normal-journey-ending');
  });
  await caseOf('Conversation-focused diner visit',async()=>{
   let s;
   for(let i=0;i<30;i++){await fixture({cash:1000+i});await page.click('#dinerStopBtn');for(const id of['enter','counter','soup'])await click(id);s=await st();if(s.story.trip.active.data.overheard==='parts')break;}
   await capture('diner-waiting-portrait');await click('engage');const before=await text();await capture('diner-conversation-portrait');await click('talk_car');
   observe('Real UI mechanic question response',{before,after:await text(),state:(await st()).story.world});await capture('diner-question-result');
   const exact=JSON.stringify((await st()).story);await page.reload();await page.click('#resumeBtn');check('Question/result survives reopening without reroll',JSON.stringify((await st()).story)===exact);
   for(const id of['eat','pay','exit'])await click(id);const paid=await st();check('Soup costs exactly $12 in actual journey',paid.cash===s.cash-12,{before:s.cash,after:paid.cash});
   await page.click('#dinerStopBtn');await click('enter');observe('Repeat visit dialogue after prior conversation',await text());
   await page.setViewportSize({width:844,height:390});await capture('repeat-diner-landscape');check('Landscape has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  });
  await caseOf('No-money no-tools tire recovery',async()=>{
   await page.setViewportSize({width:390,height:844});await fixture({cash:0,inventory:[]});await page.evaluate(()=>REVIEW.triggerEvent(REVIEW.roadEvents.find(e=>e.id==='tire')));await page.locator('#eventChoices button').filter({hasText:'STOP NOW'}).click();await click('inspect');
   check('No tools means no tools choice',await page.locator('[data-story-choice="tools"]').count()===0);await capture('repair-no-tools');await click('walk');await capture('repair-store');const store=await text();await click('clerk_help');await capture('repair-rescue');await click('exit');const s=await st();check('Zero-money repair returns to road with real time cost',s.cash===0&&!s.currentEvent&&!s.vehicleFaults.includes('tire')&&s.stats.stopMinutes===170);observe('Rescue story',{store,result:s.roadNarrative.body,flags:s.story.world.flags});
  });
  await caseOf('Nearly destroyed car can inspect tire without instant ending',async()=>{
   await fixture({condition:2});await page.evaluate(()=>REVIEW.triggerEvent(REVIEW.roadEvents.find(e=>e.id==='tire')));await page.locator('#eventChoices button').filter({hasText:'STOP NOW'}).click();const s=await st();check('Stopping to inspect does not destroy a 2%-condition vehicle before repair options',!s.ended,{ended:s.ended,condition:s.condition,ending:s.ending});await capture('low-condition-stop');
  });
  await caseOf('Quiet scenes and game time',async()=>{
   await fixture();await page.click('#dinerStopBtn');for(const id of['enter','counter','soup'])await click(id);const before=await st(),body=await text();await page.waitForTimeout(6000);check('Reading and listening do not consume game minutes',JSON.stringify((await st()).story)===JSON.stringify(before.story));observe('Waiting scene after six real seconds',{unchangedText:body===await text(),audio:await page.evaluate(()=>REVIEW.audio()),body});
   await page.click('#storyTranscript summary');await capture('diner-transcript');
  });
  await caseOf('Under-seat reward sampling from actual road event handler',async()=>{
   await fixture();const event=await page.evaluate(()=>REVIEW.roadEvents.find(e=>/seat|envelope/i.test(e.title+' '+String(e.body)))?.id);if(!event)throw Error('No underseat event');
   const rewards=[];for(let i=0;i<20;i++){await fixture({cash:1000});await page.evaluate(id=>REVIEW.triggerEvent(REVIEW.roadEvents.find(e=>e.id===id)),event);await page.locator('#eventChoices button:enabled').first().click();rewards.push({cashGain:(await st()).cash-1000,text:await text()});}
   observe('Under-seat event reward sample (forced encounters, not spawn frequency)',{event,rewards});
  });
  observe('Road event catalogue',await page.evaluate(()=>REVIEW.roadEvents.map(e=>({id:e.id,title:e.title,choices:e.choices.map(c=>c[0])}))));
 }finally{persist();await browser.close();server.close();}
 R.summary={passed:R.checks.filter(x=>x.pass).length,failed:R.checks.filter(x=>!x.pass).length,errorCount:R.errors.length,designApproval:'NOT GRANTED: independent review findings require assessment'};persist();
 console.log(JSON.stringify({summary:R.summary,observations:R.observations,checks:R.checks},null,2));
 if(R.summary.failed||R.errors.length)process.exitCode=1;
})().catch(e=>{R.errors.push(String(e.stack||e));persist();console.error(e);server.close();process.exitCode=1;});
