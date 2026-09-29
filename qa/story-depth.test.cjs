'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const E=require('../app/src/main/assets/www/story-engine.js'),S=require('../app/src/main/assets/www/story-scenes.js'),B=require('../app/src/main/assets/www/story-bridge.js');
const D=require('../app/src/main/assets/www/story-depth.js');
const fixture=(p={})=>({version:4,departed:true,ended:false,cash:1000,days:7,day:1,hour:9,condition:80,health:100,fatigue:15,hunger:70,morale:65,
 car:{id:'family',n:'Family LX',boughtPrice:2000},career:{id:'mechanic',skill:'repair'},reason:{id:'fresh',hard:false},inventory:['toolkit'],stats:{totalSpent:0,totalEarned:0,foodSpent:0,repairsSpent:0,stopMinutes:0},distance:200,totalMiles:1600,fuel:80,phone:90,pendingLegMiles:41,
 currentEvent:null,log:[],cargo:{tools:2},routeGeometry:[[-90,40],[-100,36]],...p});
const turn=(j,id)=>{const v=B.describe(j.story);return B.choose(j,{interactionId:v.interactionId,revision:v.revision,choiceId:id});};
const path=(j,ids)=>ids.reduce(turn,j);
const options=j=>B.describe(j.story).choices.filter(x=>x.enabled).map(x=>x.id);
function diner(seed=1,seat='counter',p={}){return path(B.begin(fixture(p),'diner',{seed:E.hash('depth'+seed),location:'Havana, IL'}),['enter',seat,'soup']);}
function find(predicate){for(let i=1;i<3000;i++){const j=diner(i);if(predicate(j))return j;}throw Error('state not reachable');}
function meal(j){
 if(['waiting','conversation','answer','story_answer','server_reply','help_offer'].includes(j.story.trip.active.node))j=turn(j,j.story.trip.active.node==='waiting'?'wait':'finish_talking');
 if(j.story.trip.active.node==='wrong')j=turn(j,'correct_order');
 if(j.story.trip.active.node==='outage')j=turn(j,'generator');
 return path(j,['eat','pay']);
}
function accepted(){let j=find(j=>j.story.trip.active.data.topic==='parts');return path(j,['engage','talk_car','offer_help']);}
function repairOutcome(wanted){
 for(let i=1;i<1500;i++){
  let j=diner(i);if(j.story.trip.active.data.topic!=='parts')continue;
  j=path(j,['engage','talk_car','offer_help']);j=meal(j);j=path(j,['outside','inspect_hal','help_repair']);
  if(j.story.trip.active.data.jobResult===wanted)return j;
 }throw Error('repair outcome unavailable');
}
test('new main journeys select depth2; normal state reads remain pure',()=>{
 const j=diner(),raw=JSON.stringify(j);assert.equal(j.story.trip.active.data.depth,2);
 for(let i=0;i<100;i++)B.describe(j.story);assert.equal(JSON.stringify(j),raw);
});
test('the low-condition STOP NOW regression is fixed at 1, 2 and 3 percent',()=>{
 for(const condition of [1,2,3]){const j=B.begin(fixture({condition,currentEvent:'tire'}),'repair');assert.equal(j.condition,condition);assert.equal(j.ended,false);assert.ok(options(j).includes('inspect'));const next=path(j,['inspect','assistance','exit']);assert.equal(next.condition,condition);assert.ok(!next.vehicleFaults.includes('tire'));}
});
test('asking a question displays its answer, not an arriving meal',()=>{
 let j=find(j=>j.story.trip.active.data.topic==='parts');j=path(j,['engage','talk_car']);
 const v=B.describe(j.story);assert.equal(v.node,'answer');assert.match(v.body,/One click/);assert.doesNotMatch(v.body,/Your soup and bread arrives/);assert.ok(options(j).includes('offer_help'));
 j=turn(j,'hear_more');assert.match(B.describe(j.story).body,/help my sister/);
});
test('listen to the rest displays authored continuation for every nonquiet topic',()=>{
 const seen=new Set();for(let i=1;i<=300;i++){let j=diner(i,i%2?'counter':'booth');if(j.story.trip.active.data.topic==='quiet')continue;
 const topic=j.story.trip.active.data.topic;seen.add(topic);j=path(j,['engage','listen_story']);assert.equal(j.story.trip.active.node,'story_answer');assert.ok(B.describe(j.story).body.includes(D.topics[topic].ending));}
 assert.equal(seen.size,6);
});
test('counter and booth offer different situated conversations',()=>{
 let different=0;for(let i=1;i<=300;i++){const a=diner(i,'counter'),b=diner(i,'booth');if(a.story.trip.active.data.topic!==b.story.trip.active.data.topic)different++;assert.equal(a.story.trip.active.data.kitchen.outcome,b.story.trip.active.data.kitchen.outcome);}
 assert.ok(different>150,String(different));
});
test('placemat and ordinary waiting share the same kitchen event at matched seeds',()=>{
 const seen=new Set();for(let i=1;i<=400;i++){
  const j=diner(i);const a=turn(j,'wait'),b=turn(j,'placemat');seen.add(a.story.trip.active.node);
  assert.equal(a.story.trip.active.node,b.story.trip.active.node);assert.equal(a.story.rng,b.story.rng);assert.equal(a.hour,b.hour);
 }assert.deepEqual([...seen].sort(),['outage','ready','wrong']);
});
test('a kitchen bell can arrive during dialogue without erasing the reply',()=>{
 let j=accepted();
 // Constructed threshold case; no wall-clock or reading-time dependence.
 j.story.trip.active.data.kitchen.elapsed=15;j.story.trip.active.data.kitchen.outcome='outage';
 const v=B.describe(j.story);assert.match(v.body,/Forty-five dollars/);assert.match(v.body,/lights go out/);
 j=turn(j,'finish_talking');assert.equal(j.story.trip.active.node,'outage');
});
test('pending response and kitchen event survive save/reopen without reroll',()=>{
 const j=path(find(j=>j.story.trip.active.data.topic==='parts'),['engage','talk_car']);
 const restored=B.upgradeJourney(JSON.parse(JSON.stringify(j)));assert.deepEqual(restored,j);assert.deepEqual(turn(j,'offer_help'),turn(restored,'offer_help'));
});
test('declining a conversation remains a complete ordinary lunch',()=>{
 const j=diner();const done=path(meal(j),['exit']);assert.equal(done.currentEvent,null);assert.equal(done.hunger,40);assert.equal(done.cash,988);assert.equal(done.story.world.flags.partsJob,undefined);
});
test('lunch payment leads to optional parking-lot followthrough, not a hidden forced job',()=>{
 let j=meal(accepted());assert.equal(j.story.trip.active.node,'after_meal');assert.equal(j.story.trip.active.data.billCents,0);assert.equal(j.stats.foodSpent,12);
 const declined=path(j,['changed_mind','exit']);assert.equal(declined.story.world.flags.partsJob.status,'declined');assert.equal(declined.cash,988);assert.equal(B.callbackDue(declined),false);
});
test('successful help pays exactly once and never repairs the player’s unrelated car',()=>{
 const j=repairOutcome('repaired');assert.equal(j.condition,80);assert.equal(j.cash,1033);assert.equal(j.stats.totalEarned,45);assert.equal(j.stats.storyEarned,45);
 assert.equal(j.stats.foodSpent,12);assert.equal(j.distance,200);assert.deepEqual(j.cargo,{tools:2});
 const v=B.describe(j.story);assert.throws(()=>B.choose(j,{choiceId:'help_repair',interactionId:v.interactionId,revision:v.revision-1}),/Stale/);
 const done=path(j,['leave_job','exit']);assert.equal(done.cash,1033);assert.equal(done.currentEvent,null);
});
test('the paid repair has a delayed one-time coolant payoff after actual miles',()=>{
 let j=path(repairOutcome('repaired'),['leave_job','exit']);assert.equal(B.callbackDue(j),false);
 j.distance=289;assert.equal(B.callbackDue(j),false);j.distance=300;assert.equal(B.callbackDue(j),true);
 j=B.begin(j,'callback');assert.match(B.describe(j.story).body,/Your fix held/);
 j=path(j,['accept_thanks','exit']);assert.ok(j.inventory.includes('coolant'));assert.equal(j.cash,1033);assert.equal(B.callbackDue(j),false);
 assert.throws(()=>B.begin(j,'callback'),/No earned callback/);
});
test('honest unprepared help and reckless bluff have distinct later responses',()=>{
 let a=meal(accepted());a=path(a,['outside','refer_shop','leave_job','exit']);a.distance=300;a=B.begin(a,'callback');assert.match(B.describe(a.story).body,/stayed until I had help/);a=path(a,['accept_thanks','exit']);assert.equal(a.cash,1003);
 let b=meal(accepted());b=path(b,['outside','inspect_hal','improvise','leave_job','exit']);b.distance=300;b=B.begin(b,'callback');assert.match(B.describe(b.story).body,/improvisation did not help/);
 assert.ok(options(b).includes('apologize'));assert.ok(!options(b).includes('accept_thanks'));b=path(b,['apologize','exit']);assert.equal(b.cash,988);
});
test('lack of equipment does not grant a toolkit repair option on Hal’s car',()=>{
 let j=meal(accepted());j=path(j,['outside','inspect_hal']);j.inventory=[];j.story.trip.inventory=[];
 assert.ok(!options(j).includes('help_repair'));assert.ok(options(j).includes('refer_shop'));
});
test('an honest failed repair has an escape without infinite retries or invented wages',()=>{
 const j=repairOutcome('attempted');assert.equal(j.cash,988);assert.equal(j.stats.totalEarned,0);
 assert.ok(!options(j).includes('help_repair'));const done=path(j,['refer_shop','leave_job','exit']);assert.equal(done.story.world.flags.partsJob.status,'referred');
});
test('repeat same-place greeting acknowledges a prior tip; other towns do not',()=>{
 let j=diner();j=turn(j,'wait');if(j.story.trip.active.node==='wrong')j=turn(j,'correct_order');if(j.story.trip.active.node==='outage')j=turn(j,'generator');j=path(j,['eat','tip','exit']);
 const repeat=turn(B.begin(j,'diner',{location:'Havana, IL'}),'enter');assert.match(B.describe(repeat.story).body,/Thanks again for the tip/);
 const other=turn(B.begin(j,'diner',{location:'Peoria, IL'}),'enter');assert.doesNotMatch(B.describe(other.story).body,/Thanks again for the tip|Welcome back/);
});
test('new greetings can mention the completed favor in its original place',()=>{
 let j=path(repairOutcome('repaired'),['leave_job','exit']);j=turn(B.begin(j,'diner',{location:'Havana, IL'}),'enter');assert.match(B.describe(j.story).body,/Hal made it out/);
});
test('loot includes empty, ordinary, useful, cash and rare findings; never repeated cash',()=>{
 const counts={};for(let i=1;i<=1000;i++){
  let j=B.begin(fixture(),'discovery',{seed:E.hash('loot'+i)});const result=j.story.trip.active.data.result;counts[result]=(counts[result]||0)+1;
  j=path(j,['search','exit']);const cash=j.cash,earned=j.stats.totalEarned;
  assert.equal(B.discoveryEligible(j),false);j=path(B.begin(j,'discovery'),['search','exit']);assert.equal(j.cash,cash);assert.equal(j.stats.totalEarned,earned);
 }
 assert.equal(Object.keys(counts).length,5);assert.ok(counts.nothing>450);assert.ok(counts.cash>80&&counts.cash<220);console.log('Loot distribution',counts);
});
test('leaving a discovery unsearched does not reroll the hidden item',()=>{
 let j=B.begin(fixture(),'discovery',{seed:9090});const result=j.story.trip.active.data.result;j=path(j,['leave','exit']);j=B.begin(j,'discovery',{seed:1});assert.equal(j.story.trip.active.data.result,result);
});
test('table state matches meal timing and what was ordered',()=>{
 let j=diner();assert.equal(B.describe(j.story).table,'empty');j=turn(j,'wait');if(j.story.trip.active.node==='wrong')j=turn(j,'correct_order');if(j.story.trip.active.node==='outage')j=turn(j,'generator');assert.equal(B.describe(j.story).table,'soup');j=turn(j,'eat');assert.equal(B.describe(j.story).table,'empty_plate');
});
test('alpha1 pending encounters migrate without changing their money, node or random state',()=>{
 const old=E.begin(E.create({seed:818}),'diner',S);old.contentVersion='phase1.1';delete old.trip.earnedCents;
 const raw=JSON.stringify(old),m=E.deserialize(raw,S);assert.equal(m.contentVersion,'phase1.2');assert.equal(m.trip.active.data.depth,undefined);assert.equal(m.rng,old.rng);assert.equal(m.trip.active.node,old.trip.active.node);assert.equal(JSON.stringify(old),raw);
 const future=JSON.parse(raw);future.contentVersion='phase9';assert.throws(()=>E.deserialize(JSON.stringify(future),S));
});
test('2000 fresh enhanced scene policies resolve with affordable exits and consistent ledgers',()=>{
 const seen=new Set();for(let seed=1;seed<=2000;seed++){
  let j=B.begin(fixture({cash:[0,5,22,1000][seed%4],inventory:seed%3?['toolkit']:[]}),seed%2?'diner':'repair',{seed:E.hash('run'+seed)}),count=0;
  while(j.story.trip.active&&count++<90){seen.add(j.story.trip.active.scene+'/'+j.story.trip.active.node);const offer=options(j);assert.ok(offer.length);j=turn(j,offer[E.hash(seed+':'+count)%offer.length]);B.validateSaved(j);assert.ok(j.cash>=0);assert.equal(j.distance,200);}
  assert.ok(count<90,'No infinite scene loop');assert.ok(Math.abs(j.cash-([0,5,22,1000][seed%4]-j.stats.totalSpent+j.stats.totalEarned))<.001);
 }
 assert.ok(seen.has('diner/conversation'));assert.ok(seen.has('diner/answer'));console.log('Enhanced nodes reached',seen.size);
});

// Retain independent alpha2 correctness regressions in every engine/ROADTEST run.
require('./repair-regression.test.cjs');
