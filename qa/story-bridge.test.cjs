'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const B = require('../app/src/main/assets/www/story-bridge.js');
const E = require('../app/src/main/assets/www/story-engine.js');
function fixture(p = {}) { return {version: 4, departed: true, ended: false, cash: 1000, days: 5, day: 2, hour: 23.8,
  condition: 80, fatigue: 15, hunger: 70, morale: 65, inventory: ['toolkit', 'fixflat'],
  car: {id:'family',n:'Family LX',mpg:27,tank:18,rel:91}, career: {id:'mechanic',skill:'repair'}, reason:{id:'career',hard:true},
  currentEvent:null, stats:{totalSpent:50,foodSpent:20,repairsSpent:30,stops:2,breakdowns:1},
  distance:121, totalMiles:777, pendingLegMiles:52, fuel:63.123, phone:72, debt:400,
  routeGeometry:[[-90,40],[-105,39]], routeStepIndex:4, routeSteps:[{name:'US 24',mile:130}],
  cityData:{origin:{n:'Custom, IL',lat:40,lon:-90},dest:{n:'Denver, CO',lat:39,lon:-105}},
  cargo:{electronics:2}, sellers:{family:{visits:1}}, limits:{stipend:0}, assets:[{n:'GUITAR',sold:true}],
  log:['before'], futureField:{must:'survive'}, ...p}; }
function turn(j,id) { const v=B.describe(j.story); return B.choose(j,{choiceId:id,interactionId:v.interactionId,revision:v.revision}); }
function path(j,ids) { return ids.reduce(turn,j); }
function diner(j=fixture()) { return path(B.begin(j,'diner',{seed:E.hash('diner')}), ['enter','counter']); }
test('bridge leaves the original snapshot and every unrelated field intact',()=>{
  const j=fixture(), original=JSON.stringify(j), next=path(diner(j),['breakfast','placemat','eat','pay','exit']);
  assert.equal(JSON.stringify(j),original);
  for(const key of ['distance','totalMiles','pendingLegMiles','fuel','phone','debt','routeGeometry','routeStepIndex','routeSteps','cityData','cargo','sellers','limits','assets','futureField']) assert.deepEqual(next[key],j[key],key);
});
test('meal reserve, charge, stats, time and midnight carry exactly once',()=>{
  let j=diner(); j=turn(j,'breakfast'); assert.equal(j.cash,1000); assert.equal(j.story.trip.active.data.billCents,2200);
  j=path(j,['placemat','eat']); assert.equal(j.hunger,15); assert.equal(j.cash,1000);
  j=path(j,['pay','exit']); assert.equal(j.cash,978); assert.equal(j.stats.totalSpent,72); assert.equal(j.stats.foodSpent,42);
  assert.equal(j.stats.repairsSpent,30); assert.equal(j.stats.stopMinutes,26); assert.equal(j.stats.stops,3);
  assert.ok(Math.abs(j.days-(5-26/1440))<1e-12); assert.equal(j.day,3); assert.ok(Math.abs(j.hour-(23.8+26/60-24))<1e-12);
  assert.equal(j.currentEvent,null); assert.equal(j.story.trip.active,null);
});
test('natural diner/tire events do not double-count their existing stop/breakdown',()=>{
  assert.equal(B.begin(fixture({currentEvent:'food'}),'diner').stats.stops,2);
  assert.equal(B.begin(fixture({currentEvent:'tire'}),'repair').stats.breakdowns,1);
});
test('ongoing fuel event cannot be hijacked by a stop',()=>{
  assert.throws(()=>B.begin(fixture({currentEvent:'fuel'}),'diner'),/Resolve/);
});
test('saved meal and next outcome survive exact round trip serialization',()=>{
  const j=turn(diner(),'breakfast'), restored=JSON.parse(JSON.stringify(j));B.validateSaved(restored);
  assert.deepEqual(turn(restored,'wait'),turn(j,'wait'));
});
test('stale choices cannot pay twice or undo a consequence',()=>{
  let j=path(diner(),['soup','placemat','eat']); const v=B.describe(j.story);
  const token={choiceId:'pay',interactionId:v.interactionId,revision:v.revision};j=B.choose(j,token);
  assert.throws(()=>B.choose(j,token),/Stale/);assert.equal(j.cash,988);
});
test('unknown schemas and inconsistent encounter/cash are rejected, not discarded',()=>{
  const j=diner();j.storyIntegrationVersion=99;assert.throws(()=>B.validateSaved(j));
  j.storyIntegrationVersion=1;j.currentEvent='cop';assert.throws(()=>B.validateSaved(j));
  j.currentEvent='food';j.cash=0;assert.throws(()=>B.validateSaved(j));
});
test('repair carries real consumables and honest help costs back to the road',()=>{
  let j=B.begin(fixture(),'repair',{seed:951});assert.ok(j.vehicleFaults.includes('tire'));assert.equal(j.condition,77);
  j=path(j,['inspect','sealant']);assert.ok(!j.inventory.includes('fixflat'));
  if(j.story.trip.active.node!=='done') j=turn(j,'assistance');
  j=turn(j,'exit');assert.ok(!j.vehicleFaults.includes('tire'));assert.equal(j.currentEvent,null);
  const help=path(B.begin(fixture({cash:0,inventory:[]}),'repair'),['wait_help','exit']);
  assert.equal(help.cash,0);assert.equal(help.stats.stopMinutes,120);assert.ok(help.story.world.flags.oweRoadsideFavor);
});
test('paid repair charges repair ledger once',()=>{
  const j=path(B.begin(fixture(),'repair'),['assistance','exit']);
  assert.equal(j.cash,915);assert.equal(j.stats.repairsSpent,115);assert.equal(j.stats.totalSpent,135);
});
test('a new stop re-syncs road resources without losing this character’s relationships',()=>{
  let j=path(diner(),['soup','placemat','eat','tip','exit']);const npc=j.story.world.npcs['diner.marnie'];
  j.cash-=100;j.hunger=85;j.distance+=50;j.days-=1;
  j=B.begin(j,'diner');assert.equal(j.story.trip.cashCents,88500);assert.equal(j.story.trip.hunger,85);
  assert.deepEqual(j.story.world.npcs['diner.marnie'],npc);
});
test('hard deadlines are spent by choices, not by reading or rounding',()=>{
  let j=B.begin(fixture({days:.5/1440}),'diner');assert.equal(j.story.trip.status,'active');
  const before=JSON.stringify(j);for(let i=0;i<100;i++)B.describe(j.story);assert.equal(JSON.stringify(j),before);
  j=turn(j,'enter');assert.ok(j.days<0);assert.equal(j.story.trip.status,'ended');assert.equal(j.currentEvent,null);
});
test('conversation is readable, optional, remembered in this trip only',()=>{
  let j;
  for(let seed=1;seed<100;seed++){j=path(B.begin(fixture(),'diner',{seed:E.hash('voice'+seed)}),['enter','counter','coffee']);if(B.describe(j.story).choices.some(c=>c.id==='engage'))break;}
  assert.ok(j.storyTranscript.some(l=>l.speaker!=='SCENE'&&l.speaker!=='YOU'));
  const listened=path(j,['engage','listen_story','eat','pay','exit']);
  const ignored=path(j,['placemat','eat','pay','exit']);
  assert.equal(listened.cash,ignored.cash);assert.equal(listened.hunger,ignored.hunger);
  assert.deepEqual(listened.story.player.actions,{});assert.ok(listened.storyTranscript.some(l=>l.speaker==='YOU'));
});
test('1000 roundtrip scene journeys retain road mileage and nonnegative cash',()=>{
  for(let seed=1;seed<=1000;seed++){
    const kind=seed%2?'diner':'repair', original=fixture({cash:[0,5,22,1000][seed%4],inventory:seed%3?['toolkit','fixflat']:[]});
    let j=B.begin(original,kind,{seed:E.hash('journey'+seed)}),steps=0;
    while(j.story.trip.active&&steps++<100){const v=B.describe(j.story),offers=v.choices.filter(c=>c.enabled);assert.ok(offers.length);
      const id=offers[E.hash(seed+':'+steps)%offers.length].id;j=turn(j,id);B.validateSaved(j);assert.ok(j.cash>=0);assert.equal(j.distance,original.distance);}
    assert.ok(steps<100);assert.equal(j.pendingLegMiles,original.pendingLegMiles);
  }
});

test('autosave cannot overwrite future, corrupt, removed, or concurrently changed encounters',()=>{
  const j=diner(), original=JSON.stringify(j);
  assert.doesNotThrow(()=>B.assertAutosaveSafe(j,original));
  const changed=JSON.parse(original);changed.storyIntegrationVersion=99;
  assert.throws(()=>B.assertAutosaveSafe(j,JSON.stringify(changed)),/Unsupported/);
  changed.storyIntegrationVersion=1;changed.story.revision++;
  assert.throws(()=>B.assertAutosaveSafe(j,JSON.stringify(changed)),/Another window/);
  assert.throws(()=>B.assertAutosaveSafe(j,'{broken'));
  assert.throws(()=>B.assertAutosaveSafe(j,null),/removed/);
  assert.throws(()=>B.assertAutosaveSafe(fixture(),original),/Another window/);
  assert.doesNotThrow(()=>B.assertAutosaveSafe(fixture(),null));
  assert.equal(JSON.stringify(j),original);
});
