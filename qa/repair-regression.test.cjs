'use strict';
// Independent alpha2 regressions. Real source functions, DOM/audio stand-ins.
const test=require('node:test'),assert=require('node:assert/strict');
const {environment,E,B}=require('./helpers/game-logic-harness.cjs');
function step(j,id){const v=B.describe(j.story);return B.choose(j,{choiceId:id,revision:v.revision,interactionId:v.interactionId});}
function path(j,ids){return ids.reduce(step,j);}
function job(seed=3780978406){
 const base=environment().snapshot();let j=path(B.begin(base,'diner',{seed}),['enter','counter','coffee','chat','ask_hal','talk_car','offer_help','finish_talking']);
 if(j.story.trip.active.node==='wrong')j=step(j,'correct_order');if(j.story.trip.active.node==='outage')j=step(j,'generator');
 return path(j,['eat','pay','outside','inspect_hal']);
}
function finalLeg(minutes=60){return environment({fixedRandom:.25,fixture:{distance:1590,totalMiles:1600,days:minutes/1440,reason:{id:'career',hard:true}}});}
for(const fatigue of [92,93,95])test(`A2-REVIEW-01: parked repair at fatigue ${fatigue} is not a driving crash`,()=>{
 const h=environment({seed:93738,fixture:{fatigue}});h.road('tire','STOP NOW');for(const id of ['inspect','tools','attempt'])h.choice(id);
 assert.equal(h.api.get().distance,200);assert.equal(h.api.get().fatigue,Math.min(100,fatigue+5));assert.equal(h.api.get().ended,false);
 const loaded=B.upgradeJourney(JSON.parse(h.storage.getItem('lwh-rc1-save')));h.api.set(loaded);assert.equal(h.api.checkFailure(),false);
});
test('A2-EXP-04: high fatigue always offers free sleep before any fuel/road roll',()=>{
 for(const fuel of [2,90])for(const fatigue of [82,90,98,100]){
  const h=environment({seed:22,fixture:{distance:400,fatigue,fuel,cash:0}});h.api.driveLeg();
  assert.equal(h.api.get().distance,400);assert.equal(h.api.get().currentEvent,'restDecision');assert.equal(h.api.get().ended,false);
  const b=h.$('eventChoices').children.find(b=>b.textContent.startsWith('SLEEP IN CAR'));assert(b&&!b.disabled);
  b.onclick();assert.equal(h.api.get().cash,0);assert.equal(h.api.get().fatigue,28);assert.equal(h.api.get().stats.carNights,1);
 }
});
test('A2-EXP-04: voluntary rest works before fatigue becomes critical',()=>{
 const h=environment({fixture:{fatigue:40}});assert.equal(typeof h.api.requestRest,'function');h.api.requestRest();
 assert.equal(h.api.get().currentEvent,'restDecision');assert.equal(h.api.get().distance,200);
});
test('A2-EXP-04: knowingly refusing rest permits risk, not an immediate parked crash',()=>{
 const h=environment({fixedRandom:.25,fixture:{fatigue:98,fuel:90}});h.api.driveLeg();
 const b=h.$('eventChoices').children.find(b=>b.textContent.startsWith('KEEP DRIVING'));b.onclick();
 assert.equal(h.api.get().ended,false);assert.equal(h.api.get().distance,200);
 h.api.driveLeg();assert(h.api.get().distance>200);assert.equal(h.api.get().ending.kicker,'YOU NODDED OFF');
});
test('A2-EXP-04: refueling does not erase or loop the one-leg rest decision',()=>{
 const h=environment({fixedRandom:.25,fixture:{fatigue:90,fuel:4}});h.api.driveLeg();h.$('eventChoices').children[1].onclick();
 h.api.driveLeg();assert.equal(h.api.get().currentEvent,'fuel');
 h.$('eventChoices').children.find(b=>b.textContent.startsWith('FILL TANK')).onclick();
 h.api.driveLeg();assert(h.api.get().distance>200);
 if(h.api.get().currentEvent)h.api.get().currentEvent=null;
 if(!h.api.get().ended){h.api.driveLeg();assert.equal(h.api.get().currentEvent,'restDecision');}
});
test('A2-EXP-04: sleep still consumes a hard deadline',()=>{
 const h=environment({fixture:{fatigue:90,days:1/24,reason:{hard:true}}});h.api.driveLeg();h.$('eventChoices').children[0].onclick();
 assert.equal(h.api.get().ending.kicker,'YOU MISSED THE DEADLINE');
});
for(const minutes of [1,12.7,60])test(`A2-REVIEW-02: final arrival respects ${minutes} remaining minutes`,()=>{
 const h=finalLeg(minutes);h.api.driveLeg();
 assert.equal(h.api.get().ending.kicker,minutes<12.7?'YOU MISSED THE DEADLINE':'YOU MADE IT');assert.equal(h.api.get().distance,1600);
});
test('A2-REVIEW-02: soft deadlines remain nonfatal',()=>{
 const h=finalLeg(1);h.api.get().reason.hard=false;h.api.driveLeg();assert.equal(h.api.get().ending.kicker,'YOU MADE IT');
});
test('A2-EXP-05: failed primary ending save does not finalize lifetime prematurely',()=>{
 const h=finalLeg();const raw=h.storage.getItem('lwh-rc1-save');h.failWrites('lwh-rc1-save');h.api.driveLeg();
 assert.equal(h.storage.getItem('lwh-rc1-save'),raw);assert.equal(h.api.loadLifetime().runs,0);
 h.failWrites(false);h.api.set(JSON.parse(raw));h.api.driveLeg();assert.equal(h.api.loadLifetime().runs,1);
});
test('A2-EXP-05: replaying pre-arrival bytes with a stable trip ID counts once',()=>{
 const h=finalLeg();const raw=h.storage.getItem('lwh-rc1-save'),id=h.api.get().runId;assert(id);
 h.api.driveLeg();assert.equal(h.api.loadLifetime().runs,1);h.storage.setItem('lwh-rc1-save',raw);h.api.set(JSON.parse(raw));h.api.driveLeg();
 assert.equal(h.api.loadLifetime().runs,1);assert.equal(h.api.loadLifetime().successes,1);assert.equal(h.api.get().runId,id);
});
test('A2-EXP-05: lifetime-write failure leaves an ended, retryable journey',()=>{
 const h=finalLeg();h.failWrites('lwh-lifetime-v1');h.api.driveLeg();
 const saved=JSON.parse(h.storage.getItem('lwh-rc1-save'));assert(saved.ended);assert.equal(saved.stats.committed,false);assert.equal(h.api.loadLifetime().runs,0);
 h.failWrites(false);h.api.set(saved);assert.equal(h.api.finalizeLifetime(true,'YOU MADE IT'),true);h.api.save();
 assert.equal(h.api.loadLifetime().runs,1);h.api.set(saved);h.api.finalizeLifetime(true,'YOU MADE IT');assert.equal(h.api.loadLifetime().runs,1);
});
test('A2-EXP-05: corrupt lifetime data is never silently replaced',()=>{
 const h=finalLeg();h.storage.setItem('lwh-lifetime-v1','{broken');h.api.driveLeg();
 assert.equal(h.storage.getItem('lwh-lifetime-v1'),'{broken');assert.equal(h.api.get().stats.committed,false);
});
test('A2-EXP-05: existing totals survive receipt migration and distinct trips count separately',()=>{
 const h=finalLeg();const lifetime=h.api.loadLifetime();lifetime.runs=3;lifetime.successes=2;lifetime.failures=1;delete lifetime.completedTrips;
 h.storage.setItem('lwh-lifetime-v1',JSON.stringify(lifetime));h.api.driveLeg();assert.equal(h.api.loadLifetime().runs,4);
 h.api.reset({distance:1590,totalMiles:1600});h.api.save();h.api.driveLeg();assert.equal(h.api.loadLifetime().runs,5);
});
for(const underground of [false,true])test(`A2-EXP-01: roadside ${underground?'underground':'legal'} sale reconciles trading ledger`,()=>{
 const h=environment({fixedRandom:.25,fixture:{cash:1000,cargo:{},distance:350}});
 const good={id:underground?'nightpowder':'tools',n:'TEST CARGO',size:1,buy:100,sell:150,supply:2,demand:2};
 h.api.tradeRow(good,underground).children[0].children[0].onclick();h.road('cargoScam','TAKE THE LOWER PRICE');
 const s=h.api.get(),prefix=underground?'underground':'trade';assert.equal(s.cash-1000,s.stats[prefix+'Earned']-s.stats[prefix+'Spent']);assert.equal(s.stats.totalEarned,s.stats[prefix+'Earned']);
});
for(const label of ['TAKE IT','USE PAPER ATLAS'])test(`A2-EXP-02: ${label} shortens remaining route, not odometer`,()=>{
 const h=environment({fixedRandom:.25,fixture:{distance:400,totalMiles:1000,inventory:['atlas']}}),before=h.snapshot();h.road('shortcut',label);const s=h.api.get();
 assert.equal(s.distance,before.distance);assert.equal(s.fuel,before.fuel);assert.equal(s.days,before.days);assert.equal(s.stats.gallonsUsed,0);assert(s.totalMiles<before.totalMiles);
});
test('A2-EXP-02: near-end shortcut cannot move beyond or instantly finish the route',()=>{
 const h=environment({fixedRandom:.25,fixture:{distance:400,totalMiles:405,pendingLegMiles:50}});h.road('shortcut','TAKE IT');
 assert.equal(h.api.get().distance,400);assert.equal(h.api.get().totalMiles,401);assert.equal(h.api.get().pendingLegMiles,1);assert.equal(h.api.get().ended,false);
});
test('A2-EXP-03: missing coolant is disabled and retained handler cannot cause damage',()=>{
 const h=environment({fixture:{condition:70,inventory:['toolkit']}});h.api.triggerEvent(h.api.roadEvents.find(e=>e.id==='heat'));
 const b=h.$('eventChoices').children.find(b=>b.textContent==='ADD COOLANT');assert(b.disabled);assert.match(b.title,/Requires coolant/);b.onclick();
 assert.equal(h.api.get().condition,70);assert.equal(h.api.get().currentEvent,'heat');
});
test('A2-EXP-03: coolant consumes once and stale event handlers cannot repeat a reward',()=>{
 const h=environment({fixture:{condition:70,inventory:['coolant']}});h.api.triggerEvent(h.api.roadEvents.find(e=>e.id==='heat'));
 const b=h.$('eventChoices').children.find(b=>b.textContent==='ADD COOLANT');assert.equal(b.disabled,false);b.onclick();b.onclick();
 assert.equal(h.api.get().condition,75);assert.equal(h.api.get().inventory.includes('coolant'),false);
});
test('a failed story-entry save can be retried from the same road choice',()=>{
 const h=environment();h.api.triggerEvent(h.api.roadEvents.find(e=>e.id==='tire'));const b=h.$('eventChoices').children.find(b=>b.textContent==='STOP NOW');
 h.failWrites('lwh-rc1-save');b.onclick();assert.equal(h.api.get().story,undefined);h.failWrites(false);b.onclick();assert.equal(h.api.get().story.trip.active.scene,'repair');
});
test('A2-REVIEW-03: honest unsuccessful help is remembered without false referral reward',()=>{
 let j=step(job(),'help_repair');assert.equal(j.story.world.flags.partsJob.status,'attempted');j=path(j,['honest_exit','exit']);
 assert.equal(j.story.world.flags.partsJob.status,'honest');const cash=j.cash;j.distance+=100;assert.equal(B.callbackDue(j),true);j=B.begin(j,'callback');
 const v=B.describe(j.story);assert.match(v.body,/I called a shop after you left/);assert(!v.body.includes('You stayed until I had help'));assert.equal(v.choices.some(c=>c.id==='accept_thanks'),false);
 j=path(j,['wave','exit']);assert.equal(j.cash,cash);assert.equal(B.callbackDue(j),false);
});
test('A2-REVIEW-03: actual professional referral retains its proper $15 callback',()=>{
 let j=path(job(),['refer_shop','leave_job','exit']);const cash=j.cash;j.distance+=100;j=B.begin(j,'callback');assert.match(B.describe(j.story).body,/You stayed until I had help/);
 j=path(j,['accept_thanks','exit']);assert.equal(j.cash,cash+15);
});
test('A2-EXP-06: accepting wrong breakfast gives breakfast relief at original agreed price',()=>{
 let j=path(B.begin(environment().snapshot(),'diner',{seed:1139853271}),['enter','counter','coffee','wait']);assert.equal(j.story.trip.active.node,'wrong');
 j=step(j,'accept_plate');assert.equal(j.story.trip.active.data.meal.id,'breakfast');assert.equal(j.story.trip.active.data.meal.relief,55);
 const hunger=j.hunger,cash=j.cash;j=path(j,['eat','pay','exit']);assert.equal(j.hunger,Math.max(0,hunger-55));assert.equal(j.cash,cash-5);
});
for(const cash of [3,8,100])test(`A2-EXP-07: attraction fee visible and affordable at $${cash}`,()=>{
 const h=environment({fixture:{cash}});h.api.triggerEvent(h.api.roadEvents.find(e=>e.id==='roadsideAttraction'));const b=h.$('eventChoices').children.find(b=>b.textContent.startsWith('GO SEE IT'));
 assert.match(b.textContent,/\$8/);assert.equal(b.disabled,cash<8);b.onclick();assert.equal(h.api.get().cash,cash<8?cash:cash-8);
 if(cash>=8){const now=h.api.get().cash;b.onclick();assert.equal(h.api.get().cash,now);assert.equal(h.api.get().stats.totalSpent,8);}
});
