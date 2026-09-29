'use strict';
// Policy-driven SCENE simulations. Not full road trips and not human play.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('../app/src/main/assets/www/story-engine.js');
const B=require('../app/src/main/assets/www/story-bridge.js');
const salt=process.argv[2]||'local', out=path.join(__dirname,'results/roadtest/personas.json');
const profiles=[
 {id:'prepared-mechanic',cash:200,tools:true,career:'mechanic',prefer:['chat','ask_hal','talk_car','offer_help','outside','inspect_hal','help_repair','tools','attempt']},
 {id:'cash-poor-unprepared',cash:0,tools:false,career:'warehouse',prefer:['leave','inspect','wait_help','clerk_help']},
 {id:'quiet-diner',cash:50,tools:false,career:'teacher',prefer:['booth','wait','decline','changed_mind','excuse']},
 {id:'curious-helper',cash:120,tools:true,career:'paramedic',prefer:['chat','ask_hal','talk_car','offer_help','outside','inspect_hal','refer_shop','listen_story']},
 {id:'reckless-experimenter',cash:75,tools:false,career:'bartender',random:true,prefer:[]},
 {id:'reload-checker',cash:200,tools:true,career:'mechanic',prefer:['chat','ask_hal','talk_car','offer_help','outside','inspect_hal','help_repair']}
];
const defaults=['enter','counter','soup','finish_talking','placemat','correct_order','generator','eat','pay','leave_job','exit','inspect','assistance','wait_help','leave','return'];
function fixture(p){return {version:4,departed:true,ended:false,cash:p.cash,days:10,day:1,hour:9,condition:75,fatigue:20,hunger:65,morale:70,health:100,
 inventory:p.tools?['toolkit','fixflat']:[],car:{id:'family',n:'Family LX',boughtPrice:1800},career:{id:p.career,skill:p.career==='mechanic'?'repair':'people'},reason:{hard:false},
 stats:{totalSpent:0,totalEarned:0,foodSpent:0,repairsSpent:0,stops:0,breakdowns:0},distance:200,totalMiles:1600,pendingLegMiles:50,fuel:90,log:[]};}
const report={suite:'roadtest-personas',scope:'fixture-driven scene policies; not full journeys',salt,checks:[],profiles:[],failures:[],errors:[]};
for(const p of profiles){let completed=0;const visited=new Set(),samples=[];
 for(let i=0;i<40;i++)for(const scene of ['diner','repair']){
  // Thirty fixed regression seeds, ten fresh reproducible seeds per source.
  const seed=E.hash((i<30?'fixed-v1':salt)+':'+p.id+':'+i+':'+scene),trace=[];let j;
  try{
   j=B.begin(fixture(p),scene,{seed});const visits={};let step=0;
   while(j.story.trip.active&&step++<140){const v=B.describe(j.story),options=v.choices.filter(c=>c.enabled);assert.ok(options.length,'No affordable exit/action');visited.add(v.node);
    const before=JSON.stringify(j);assert.deepEqual(B.describe(JSON.parse(before).story),v,'Reload changes presentation');assert.equal(JSON.stringify(j),before,'Reading mutates state');
    const key=v.scene+'/'+v.node;visits[key]=(visits[key]||0)+1;
    const order=visits[key]>3?defaults:[...p.prefer,...defaults];
    const id=p.random&&visits[key]<=3?options[E.hash(seed+':policy:'+step)%options.length].id:(order.find(id=>options.some(c=>c.id===id))||options[0].id);
    const token={choiceId:id,revision:v.revision,interactionId:v.interactionId};
    const next=B.choose(j,token),reloaded=B.choose(JSON.parse(before),token);assert.deepEqual(next,reloaded,'Reload rerolls the next result');
    trace.push({node:v.node,choice:id,body:v.body,cash:next.cash,minutes:next.stats.stopMinutes});j=next;B.validateSaved(j);
    assert.ok(j.cash>=0,'Negative cash');assert.equal(Math.round(j.cash*100),Math.round((p.cash-j.stats.totalSpent+j.stats.totalEarned)*100),'Ledger mismatch');
    assert.equal(j.distance,200,'Scene changed road miles');assert.equal(j.pendingLegMiles,50,'Scene destroyed pending leg');
   }
   assert.ok(step<140,'Policy did not resolve within bounded choices');completed++;
   if(samples.length<2)samples.push({seed,scene,trace});
  }catch(e){report.failures.push({id:'PERSONA-'+p.id+'-'+seed,profile:p.id,seed,scene,message:e.message,trace,state:j});}
 }
 report.profiles.push({id:p.id,completed,attempted:80,visited:[...visited],samples});
 if(completed===80)report.checks.push(p.id+': budgets, exits, preserved miles and deterministic resume');
}
report.passed=report.checks.length;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({profiles:report.profiles.map(({id,completed})=>({id,completed})),failures:report.failures.length,scope:report.scope}));
if(report.failures.length)process.exitCode=1;
