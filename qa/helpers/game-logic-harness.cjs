'use strict';
// Offline execution of source functions with presentation/audio/OS stand-ins.
// This is not a browser or physical-device test and makes no layout/audio claims.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const web=process.env.LWH_SOURCE_DIR || path.resolve(__dirname,'../../app/src/main/assets/www');
const source=fs.readFileSync(path.join(web,'game.js'),'utf8');
const E=require(path.join(web,'story-engine.js')), B=require(path.join(web,'story-bridge.js'));
function part(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);if(i<0||j<0)throw Error('Missing boundary '+a);return source.slice(i,j);}
const segments=[
 part('const pick=','const SAVE_KEY='),
 "const SAVE_KEY='lwh-rc1-save',LIFETIME_KEY='lwh-lifetime-v1';let currentScreen='roadScreen',tripReturnScreen='roadScreen',storyRuntime=null,roadChoiceEpoch=0;",
 part('const cities=[','function save(){'),part('function save(){','function show(id)'),
 part('function addLog(t)','/* audio */'),part('function hasItem(id)','function depart(){'),
 part('/* Fuel is priced per gallon;','function updateRouteInstruction(){'),
 part('/* trading */','/* trip computer + lifetime records */'),
 part('function endGame(kicker,title,body)','/* bindings */'),
 part('function choiceCost(e,label)','function restoreSavedCities(){')
];
const actual=segments.join('\n');
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(){}};this.dataset={};this.hidden=false;this.disabled=false;this._text='';this.scrollTop=0;this.attrs={};this.classList={toggle(){},add(){},remove(){},contains(){return false}};}
 set textContent(t){this._text=String(t);this.children=[]}get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('')}
 set innerHTML(t){this._text=String(t);this.children=[]}get innerHTML(){return this._text}
 append(...els){for(const e of els){this.children.push(e);e.parentElement=this}}appendChild(e){this.append(e);return e}
 replaceChildren(...els){this._text='';this.children=[];this.append(...els)}
 before(){}after(){}closest(){return null}setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]||null}remove(){}addEventListener(){}toggleAttribute(){}
}
function environment({seed=987134,fixedRandom=null,fixture={}}={}){
 let rand=seed>>>0;
 const math=Object.create(Math);math.random=()=>{if(fixedRandom!==null)return fixedRandom;rand=(Math.imul(rand,1664525)+1013904223)>>>0;return rand/4294967296};
 const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 $('roadArt').parentElement=new Element('figure');
 const stored=new Map();let failWrites=false;
 const storage={getItem:k=>stored.has(k)?stored.get(k):null,setItem(k,v){if(failWrites===true||failWrites===k)throw Error('Simulated quota failure: '+k);stored.set(k,String(v))},removeItem:k=>stored.delete(k)};
 let ids=0;const noop=()=>{};const ctx={crypto:{randomUUID:()=>`test-trip-${seed}-${++ids}`},console,Math:math,JSON,Date,Number,String,Object,Array,Infinity,localStorage:storage,document:{getElementById:$,createElement:tag=>new Element(tag),createTextNode:text=>({textContent:String(text)}),body:new Element(),hidden:false},$: $,LWHStoryBridge:B,LWHStoryEngine:E,
 LWHStoryAudio:()=>({update:noop,stop:noop,say:noop,status:()=>({playing:false,sources:0})}),LWHStoryPlaceView:()=>({render:noop}),
 renderRoadHud:noop,sfx:noop,setArt:noop,updateScene:noop,setRoadScene:key=>{ctx.api.get().scene=key},eventScene:e=>e.id,
 JourneyMap:{valid:()=>false},fetch:()=>{throw Error('Network prohibited in offline review')},setTimeout:noop,clearTimeout:noop,setInterval:noop,clearInterval:noop,alert:noop};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(web,'story-runtime.js'),'utf8'),ctx,{filename:'source/story-runtime.js'});
 const exports=`
 function show(id){currentScreen=id;save();}
 globalThis.api={get:()=>state,reset:patch=>{state={...blankState(),departed:true,career:{...careers[3]},reason:{...reasons.find(x=>x.id==='fresh')},car:{...carPool.find(x=>x.id==='family'),boughtPrice:2300},cash:1000,days:12,distance:200,totalMiles:1600,fuel:90,condition:80,fatigue:10,hunger:60,morale:70,health:100,phone:90,inventory:['toolkit'],...patch};ensureTripStats();currentScreen='roadScreen';},
 set:next=>{state=next},carPool,careers,reasons,roadEvents,advance,driveLeg,checkFailure,resolveEvent,triggerEvent,showQuiet,chooseEvent,choiceCost,
 requestRest:typeof requestRest==='function'?requestRest:null,save,clearSave,finalizeLifetime,loadLifetime,endGame,tradeRow,buildMarket,renderTrade,policeOutcome,cargoCount,hasItem,useItem,
 initStory:()=>{storyRuntime=LWHStoryRuntime({getState:()=>state,setState:x=>{state=x},saveKey:SAVE_KEY,cityData:()=>({origin:cities[state.origin],dest:cities[state.dest]}),screen:()=>currentScreen,location:()=> 'Peoria, IL',audio:()=>({soundOn:false}),normalMusicGain:.12,setScene:setRoadScene,renderHud:renderRoadHud,checkFailure,toggleSound:()=>{},warn:showStoryWarning,clearWarning:()=>{}});return storyRuntime;},
 story:()=>storyRuntime,screen:()=>currentScreen};`;
 vm.runInContext(actual+'\n'+exports,ctx,{filename:'source-game-segments.js'});
 const api=ctx.api;api.reset(fixture);api.save();api.initStory();
 return {api,ctx,$,storage,failWrites:value=>{failWrites=value},elements,E,B,
  snapshot:()=>JSON.parse(JSON.stringify(api.get())),
  choice(id){const b=$('eventChoices').children.find(x=>x.dataset.storyChoice===id);if(!b)throw Error('No story button '+id);if(b.disabled)throw Error('Disabled '+id);b.onclick();api.save();},
  road(id,label){api.triggerEvent(api.roadEvents.find(x=>x.id===id));const b=$('eventChoices').children.find(x=>x.textContent.startsWith(label));if(!b)throw Error('No road button '+label);if(b.disabled)throw Error('Disabled '+label);b.onclick();api.save();}
 };
}
module.exports={environment,E,B,web};
