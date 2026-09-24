
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll('.screen,.center')];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const round25=n=>Math.round(n/25)*25;
const money=n=>{const value=Math.max(0,Math.round(n*100)/100);return '$'+value.toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2})};
const chance=p=>Math.random()<p;
const SAVE_KEY='lwh-rc1-save';
const LIFETIME_KEY='lwh-lifetime-v1';
let tripReturnScreen='roadScreen',tripView='current';
let currentScreen='titleScreen';
let installPrompt=null;


const cities=[
 {n:'Peoria, IL',lat:40.6936,lon:-89.5890},{n:'Chicago, IL',lat:41.8781,lon:-87.6298},{n:'St. Louis, MO',lat:38.6270,lon:-90.1994},{n:'Denver, CO',lat:39.7392,lon:-104.9903},{n:'Phoenix, AZ',lat:33.4484,lon:-112.0740},{n:'Seattle, WA',lat:47.6062,lon:-122.3321},{n:'Portland, OR',lat:45.5152,lon:-122.6784},{n:'Las Vegas, NV',lat:36.1699,lon:-115.1398},{n:'Albuquerque, NM',lat:35.0844,lon:-106.6504},{n:'Dallas, TX',lat:32.7767,lon:-96.7970},{n:'Houston, TX',lat:29.7604,lon:-95.3698},{n:'Austin, TX',lat:30.2672,lon:-97.7431},{n:'San Antonio, TX',lat:29.4241,lon:-98.4936},{n:'Oklahoma City, OK',lat:35.4676,lon:-97.5164},{n:'Tulsa, OK',lat:36.1540,lon:-95.9928},{n:'Kansas City, MO',lat:39.0997,lon:-94.5786},{n:'Omaha, NE',lat:41.2565,lon:-95.9345},{n:'Minneapolis, MN',lat:44.9778,lon:-93.2650},{n:'Milwaukee, WI',lat:43.0389,lon:-87.9065},{n:'Detroit, MI',lat:42.3314,lon:-83.0458},{n:'Cleveland, OH',lat:41.4993,lon:-81.6944},{n:'Columbus, OH',lat:39.9612,lon:-82.9988},{n:'Indianapolis, IN',lat:39.7684,lon:-86.1581},{n:'Louisville, KY',lat:38.2527,lon:-85.7585},{n:'Nashville, TN',lat:36.1627,lon:-86.7816},{n:'Memphis, TN',lat:35.1495,lon:-90.0490},{n:'Atlanta, GA',lat:33.7490,lon:-84.3880},{n:'Charlotte, NC',lat:35.2271,lon:-80.8431},{n:'Richmond, VA',lat:37.5407,lon:-77.4360},{n:'Washington, DC',lat:38.9072,lon:-77.0369},{n:'Philadelphia, PA',lat:39.9526,lon:-75.1652},{n:'New York, NY',lat:40.7128,lon:-74.0060},{n:'Boston, MA',lat:42.3601,lon:-71.0589},{n:'New Orleans, LA',lat:29.9511,lon:-90.0715},{n:'Jacksonville, FL',lat:30.3322,lon:-81.6557},{n:'Tampa, FL',lat:27.9506,lon:-82.4572},{n:'Miami, FL',lat:25.7617,lon:-80.1918},{n:'Salt Lake City, UT',lat:40.7608,lon:-111.8910},{n:'Boise, ID',lat:43.6150,lon:-116.2023},{n:'Billings, MT',lat:45.7833,lon:-108.5007},{n:'Fargo, ND',lat:46.8772,lon:-96.7898},{n:'Little Rock, AR',lat:34.7465,lon:-92.2896},{n:'Des Moines, IA',lat:41.5868,lon:-93.6250},{n:'Wichita, KS',lat:37.6872,lon:-97.3301},{n:'Amarillo, TX',lat:35.2220,lon:-101.8313},{n:'Flagstaff, AZ',lat:35.1983,lon:-111.6513},{n:'Sacramento, CA',lat:38.5816,lon:-121.4944},{n:'San Francisco, CA',lat:37.7749,lon:-122.4194}
];
const careers=[
 {id:'nurse',n:'TRAVEL NURSE',cash:2900,stip:2200,pay:480,skill:'medical',shifts:3,ot:2,d:'Good savings and strong relocation help.'},
 {id:'paramedic',n:'PARAMEDIC',cash:2100,stip:700,pay:310,skill:'medical',shifts:3,ot:2,d:'Moderate savings. Useful under pressure.'},
 {id:'engineer',n:'SOFTWARE ENGINEER',cash:4200,stip:4000,pay:620,skill:'tech',shifts:2,ot:1,d:'Big relocation package. Less useful under a hood.'},
 {id:'mechanic',n:'AUTO MECHANIC',cash:2400,stip:400,pay:340,skill:'repair',shifts:3,ot:2,d:'Spots bad cars and repairs them cheaper.'},
 {id:'teacher',n:'TEACHER',cash:1800,stip:500,pay:235,skill:'people',shifts:2,ot:1,d:'Some savings. Some patience.'},
 {id:'warehouse',n:'WAREHOUSE WORKER',cash:1400,stip:0,pay:210,skill:'grit',shifts:4,ot:2,d:'No stipend. Overtime is available.'},
 {id:'bartender',n:'BARTENDER',cash:1200,stip:0,pay:190,skill:'people',shifts:4,ot:1,d:'Low savings. Better at talking to strangers.'},
 {id:'sales',n:'SALES REP',cash:2600,stip:1800,pay:390,skill:'people',shifts:2,ot:1,d:'Good negotiation odds. Decent relocation help.'},
 {id:'unemployed',n:'BETWEEN JOBS',cash:850,stip:0,pay:120,skill:'grit',shifts:1,ot:0,d:'Lots of time. Very little money.'}
];
const reasons=[
 {id:'career',n:'NEW CAREER',days:7,bonus:350,hard:true,d:'A job is waiting. Miss the start date and the offer disappears.'},
 {id:'divorce',n:'DIVORCED / STARTING OVER',days:12,bonus:-600,hard:false,d:'You are leaving with what survived the lawyers.'},
 {id:'lease',n:'LEASE ENDED',days:6,bonus:0,hard:true,d:'The building sold. You need somewhere else to be.'},
 {id:'family',n:'FAMILY EMERGENCY',days:5,bonus:200,hard:true,d:'Someone needs you. Yesterday would have been better.'},
 {id:'partner',n:'FOLLOWING A PARTNER',days:10,bonus:450,hard:false,d:'They already moved. You are supposed to be next.'},
 {id:'inheritance',n:'INHERITANCE DEADLINE',days:8,bonus:800,hard:true,d:'There may be money at the other end. You must arrive in person.'},
 {id:'fresh',n:'JUST LEAVE',days:16,bonus:-150,hard:false,d:'No employer. No deadline except rent and your own tolerance.'}
];
const assetPool=[['TELEVISION',180],['GAME CONSOLE',220],['BICYCLE',130],['CORDLESS TOOLS',280],['OLD LAPTOP',170],['GUITAR',210],['COUCH',90],['DINING SET',110],['WATCH',145],['CAMERA',240],['SPARE PHONE',120],['LAWN EQUIPMENT',260],['VINYL COLLECTION',190],['SMALL APPLIANCES',125]];
const carPool=[
 {id:'comfort',y:1998,n:'Comfort V6',p:1450,mi:184221,rel:84,mpg:24,tank:18,cargo:9,s:'Dale',color:'#a8aa9c',issues:['slow coolant seep','rear window sticks'],ad:'Runs good. AC needs charged. 3.8L V6. Elderly owned. CASH ONLY.'},
 {id:'executive',y:2005,n:'Executive V8',p:1900,mi:212904,rel:78,mpg:20,tank:19,cargo:11,s:'Ron',color:'#c2c2c2',issues:['coolant staining near intake','air suspension compressor sounds tired'],ad:'Highway miles. Leather. Cold AC. Grandma car. No lowballs.'},
 {id:'sport25',y:2007,n:'Sport 2.5',p:1650,mi:168440,rel:61,mpg:27,tank:20,cargo:7,s:'Trevor',color:'#9ba2a8',issues:['CVT shudders when hot','front tire shoulder wear'],ad:'FAST reliable daily. New battery. Just drove to Chicago.'},
 {id:'family',y:1999,n:'Family LX',p:2300,mi:224501,rel:91,mpg:27,tank:18,cargo:7,s:'Marlene',color:'#b39b7f',issues:['small valve-cover seep','driver handle requires technique'],ad:'One owner. Has dents. Full maintenance folder.'},
 {id:'touring',y:2008,n:'Touring Six',p:1800,mi:137902,rel:49,mpg:23,tank:16,cargo:6,s:'Cody',color:'#5c6873',issues:['electric water pump weak','coolant warning was cleared'],ad:'MUST SELL. Runs perfect. Only needs coolant sensor.'},
 {id:'fleet',y:2004,n:'Fleet V8',p:1750,mi:196211,rel:82,mpg:19,tank:19,cargo:10,s:'Curtis',color:'#d0c7b1',issues:['power steering seep','blend door stuck warm'],ad:'Former county car NOT POLICE. V8. New tires. Will run forever.'},
 {id:'compact',y:2011,n:'City Compact',p:2200,mi:156880,rel:72,mpg:30,tank:12,cargo:6,s:'Brenda',color:'#566d84',issues:['motor mount vibration','rear bearing hum'],ad:'Good commuter. Great MPG. Son bought truck. Price firm-ish.'},
 {id:'highway',y:2003,n:'Highway V6',p:1300,mi:201331,rel:68,mpg:23,tank:17,cargo:8,s:'Mike',color:'#907b72',issues:['wheel hub sensor intermittent','fuel gauge optimistic'],ad:'Starts runs stops. Heat works. 200k mostly highway.'},
 {id:'commuter',y:2006,n:'Commuter EX',p:2600,mi:233104,rel:88,mpg:29,tank:17,cargo:7,s:'Keisha',color:'#9c9c99',issues:['AC clutch noisy','front rotors warped'],ad:'High miles, full service history. New alternator. Clean title.'},
 {id:'sportgt',y:2002,n:'Sport GT',p:1200,mi:191455,rel:64,mpg:22,tank:17,cargo:7,s:'Shawn',color:'#7d2f32',issues:['cooling fans only work on high','rear struts exhausted'],ad:'Strong V6. Small exhaust leak. NEED GONE.'}
];
const supplyDefs=[
 {id:'toolkit',n:'BASIC TOOLKIT',cost:48,d:'Improves roadside repair attempts.'},{id:'coolant',n:'COOLANT',cost:18,d:'Can save an overheating car.'},{id:'oil',n:'2 QT OIL',cost:17,d:'Buys time if the engine gets thirsty.'},{id:'food',n:'ROAD FOOD',cost:32,d:'Reduces hunger for several legs.'},{id:'charger',n:'PHONE CHARGER',cost:14,d:'Protects navigation during a phone event.'},{id:'atlas',n:'PAPER ROAD ATLAS',cost:12,d:'Helps when navigation fails.'},{id:'fixflat',n:'TIRE SEALANT',cost:13,d:'One desperate tire repair.'},{id:'blanket',n:'BLANKET',cost:22,d:'Makes sleeping in the car less miserable.'}
];
const legalGoods=[
 {id:'electronics',n:'USED ELECTRONICS',base:90,size:1,gray:false},{id:'tools',n:'POWER TOOLS',base:120,size:2,gray:false},{id:'records',n:'VINTAGE RECORDS',base:55,size:1,gray:false},{id:'camping',n:'CAMPING GEAR',base:80,size:2,gray:false},{id:'autoparts',n:'AUTO PARTS',base:135,size:2,gray:false},{id:'collectibles',n:'COLLECTIBLES',base:70,size:1,gray:false},{id:'bootlegs',n:'BOOTLEG CONCERT TEES',base:45,size:1,gray:true},{id:'mysteryelectronics',n:'UNLABELED ELECTRONICS',base:115,size:1,gray:true}
];
const undergroundGoods=[
 {id:'bluecaps',n:'BLUE CAPSULES',base:260,size:1},{id:'nightpowder',n:'NIGHT POWDER',base:420,size:1},{id:'redvials',n:'RED VIALS',base:190,size:1}
];

function blankTripStats(){return {startingCash:0,milesDriven:0,driveHours:0,gallonsUsed:0,totalSpent:0,totalEarned:0,fuelSpent:0,foodSpent:0,lodgingSpent:0,repairsSpent:0,carSpent:0,suppliesSpent:0,ticketsSpent:0,tradeSpent:0,tradeEarned:0,undergroundSpent:0,undergroundEarned:0,scratchSpent:0,scratchWon:0,debtTaken:0,negotiationSaved:0,possessionsSold:0,shiftsWorked:0,familyHelp:0,plasmaEarned:0,fuelStops:0,motelNights:0,carNights:0,policeStops:0,breakdowns:0,warningsIgnored:0,mealsSkipped:0,marketTrades:0,attractions:0,buyersGhosted:0,cargoConfiscated:0,peakHeat:0,stops:0,committed:false}}
function blankState(){return {version:4,onlineRoutes:true,departed:false,screen:'setupScreen',cityData:null,ending:null,age:31,career:null,reason:null,origin:0,dest:4,cash:0,debt:0,days:0,assets:[],limits:{shifts:0,ot:0,parents:1,plasma:2,scratch:2,loan:1,stipend:1},log:[],listings:[],carIndex:0,sellers:{},car:null,inventory:[],distance:0,totalMiles:1600,fuel:100,condition:100,fatigue:5,hunger:8,morale:70,day:1,hour:9,weather:'CLEAR',windshieldDamaged:false,radioStation:0,phone:100,usedEvents:[],recentFamilies:[],known:[],cargo:{},heat:0,underworldScore:0,undergroundUnlocked:false,marketVisits:0,currentMarket:null,lastMarketKey:'',currentEvent:null,routeSteps:[],routeStepIndex:0,routeDistanceSource:'estimate',ended:false,stats:blankTripStats()}}
let state=blankState();

function ensureTripStats(){if(!state.stats)state.stats=blankTripStats();for(const [k,v] of Object.entries(blankTripStats()))if(state.stats[k]===undefined)state.stats[k]=v;return state.stats}
function blankLifetime(){return {runs:0,successes:0,failures:0,totalMiles:0,totalGallons:0,totalSpent:0,fuelSpent:0,repairsSpent:0,carsBought:0,negotiationSaved:0,motelNights:0,carNights:0,policeStops:0,arrests:0,scratchNet:0,tradingProfit:0,undergroundProfit:0,peakHeat:0,furthestFailure:0,bestCashFinish:0,totalDebt:0}}
function loadLifetime(){try{return {...blankLifetime(),...JSON.parse(localStorage.getItem(LIFETIME_KEY)||'{}')}}catch(e){return blankLifetime()}}
function saveLifetime(x){try{localStorage.setItem(LIFETIME_KEY,JSON.stringify(x))}catch(e){}}
function statSpend(amount,cat){amount=Math.max(0,Number(amount)||0);const s=ensureTripStats();s.totalSpent+=amount;if(cat&&s[cat]!==undefined)s[cat]+=amount}
function statEarn(amount,cat){amount=Math.max(0,Number(amount)||0);const s=ensureTripStats();s.totalEarned+=amount;if(cat&&s[cat]!==undefined)s[cat]+=amount}
function noteHeat(){const s=ensureTripStats();s.peakHeat=Math.max(s.peakHeat,state.heat||0)}
function finalizeLifetime(success,kicker=''){const s=ensureTripStats();if(s.committed)return;s.committed=true;const l=loadLifetime();l.runs++;if(success)l.successes++;else l.failures++;l.totalMiles+=s.milesDriven||state.distance||0;l.totalGallons+=s.gallonsUsed;l.totalSpent+=s.totalSpent;l.fuelSpent+=s.fuelSpent;l.repairsSpent+=s.repairsSpent;if(s.carSpent>0)l.carsBought++;l.negotiationSaved+=s.negotiationSaved;l.motelNights+=s.motelNights;l.carNights+=s.carNights;l.policeStops+=s.policeStops;if(String(kicker).includes('ARREST'))l.arrests++;l.scratchNet+=(s.scratchWon-s.scratchSpent);l.tradingProfit+=(s.tradeEarned-s.tradeSpent);l.undergroundProfit+=(s.undergroundEarned-s.undergroundSpent);l.peakHeat=Math.max(l.peakHeat,s.peakHeat);if(!success)l.furthestFailure=Math.max(l.furthestFailure,s.milesDriven||state.distance||0);if(success)l.bestCashFinish=Math.max(l.bestCashFinish,state.cash||0);l.totalDebt+=state.debt||0;saveLifetime(l)}


function save(){
 if(!state.career || !state.reason || currentScreen==='titleScreen')return;
 state.cityData={origin:cities[state.origin],dest:cities[state.dest]};
 state.screen=currentScreen==='tripLogScreen'?tripReturnScreen:currentScreen;
 if(state.departed && $('eventTitle').textContent)state.roadNarrative={tag:$('eventTag').textContent,title:$('eventTitle').textContent,body:$('eventBody').textContent};
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('resumeBtn').hidden=false}catch(e){showStorageWarning()}
}
function showStorageWarning(){let n=$('storageWarning');if(!n){n=document.createElement('div');n.id='storageWarning';n.className='notice bad';n.setAttribute('role','alert');document.body.appendChild(n)}n.textContent='Progress could not be saved. Free device storage before closing the game.'}

function clearSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){} $('resumeBtn').hidden=true}
function show(id){screens.forEach(s=>s.classList.remove('active'));$(id).classList.add('active');currentScreen=id;window.scrollTo(0,0);setTheme(id);updateScene();save()}
function addLog(t){state.log.unshift(t);state.log=state.log.slice(0,24)}
function hav(a,b){const R=3958.8,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function routeMiles(){const d=haversineObj(cities[state.origin],cities[state.dest]);return Math.max(90,Math.round(d*(d<300?1.18:1.13)))}
async function refineRouteMiles(){if(state.onlineRoutes===false)return;const run=state,a=cities[state.origin],b=cities[state.dest];try{const u=`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false&steps=true`;const r=await fetch(u,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)return;const j=await r.json(),route=j?.routes?.[0],m=route?.distance;if(state===run&&!state.departed&&Number.isFinite(m)&&m>1000){state.totalMiles=Math.round(m/1609.344);state.routeDistanceSource='live road route';let cum=0;state.routeSteps=[];for(const st of (route?.legs?.[0]?.steps||[])){cum+=Number(st.distance||0)/1609.344;const name=(st.name||'').trim(),type=st.maneuver?.type||'continue',modifier=st.maneuver?.modifier||'';if(name||type==='arrive')state.routeSteps.push({mile:cum,name:name||cities[state.dest].n,type,modifier})}addLog(`Live road routing updated the trip to ${state.totalMiles.toLocaleString()} miles.`);renderPrep();save()}}catch(e){/* offline fallback keeps approximate mileage */}}
function haversineObj(a,b){return hav(a,b)}
function interpolatePoint(){const a=cities[state.origin],b=cities[state.dest],p=clamp(state.distance/state.totalMiles,0,1);return {lat:a.lat+(b.lat-a.lat)*p,lon:a.lon+(b.lon-a.lon)*p}}
function nearestCity(){const p=interpolatePoint();let best=cities[0],bd=Infinity;for(const c of cities){const d=haversineObj(p,c);if(d<bd){bd=d;best=c}}return best}
function spendTime(days){state.days=Math.max(-2,state.days-days);for(const l of state.listings){if(!l.sold&&chance(days*.07))l.sold=true}}
function advance(hours){state.hour+=hours;state.days-=hours/24;while(state.hour>=24){state.hour-=24;state.day++}while(state.hour<0){state.hour+=24;state.day=Math.max(1,state.day-1)}}
function clockText(){let h=Math.floor(state.hour),m=Math.round((state.hour-h)*60/5)*5;if(m===60){h=(h+1)%24;m=0}const ap=h>=12?'PM':'AM';return `${h%12||12}:${String(m).padStart(2,'0')} ${ap}`}
function isNight(){return state.hour<6||state.hour>=19}
function cargoUsed(){let n=0;for(const [id,q] of Object.entries(state.cargo)){const g=[...legalGoods,...undergroundGoods].find(x=>x.id===id);n+=(g?.size||1)*q}return n}
function cargoCount(id){return state.cargo[id]||0}
function addCargo(id,q){state.cargo[id]=(state.cargo[id]||0)+q;if(state.cargo[id]<=0)delete state.cargo[id]}

/* audio */
let audioCtx=null,master=null,musicGain=null,sfxGain=null,musicTimer=null,musicStep=0,soundOn=true,currentTheme='title';
const note={C2:65.41,D2:73.42,E2:82.41,G2:98,A2:110,C3:130.81,D3:146.83,E3:164.81,G3:196,A3:220,C4:261.63,D4:293.66,E4:329.63,G4:392,A4:440,B4:493.88,C5:523.25,E5:659.25,G5:783.99};
const themes={title:{bpm:112,m:['E4',null,'G4','A4','B4','A4','G4','E4'],b:['E2','C2','G2','D2']},prep:{bpm:96,m:['C4','E4','G4',null,'A4','G4','E4','D4'],b:['C2','A2','E2','G2']},road:{bpm:132,m:['E4','G4','A4','B4','A4','G4','E4','D4'],b:['E2','G2','C2','D2']},end:{bpm:78,m:['E4','D4','C4',null,'G3',null,'C4',null],b:['C2','E2','G2','C2']}};
const radioStations=[{name:'HIGHWAY FM',theme:'road'},{name:'NIGHT SIGNAL',theme:'nightRadio'},{name:'EASY MILES',theme:'easyRadio'},{name:'RADIO OFF',theme:null}];
themes.nightRadio={bpm:90,m:['A3',null,'C4','E4',null,'D4','C4',null],b:['A2','E2','C2','G2']};
themes.easyRadio={bpm:106,m:['G3','C4',null,'E4','D4',null,'C4','G3'],b:['C2','G2','A2','G2']};
function activeMusicTheme(){return currentTheme==='road'?themes[radioStations[state.radioStation||0].theme]:themes[currentTheme]||themes.title}
function ensureAudio(){if(!soundOn)return null;if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;audioCtx=new AC();master=audioCtx.createGain();musicGain=audioCtx.createGain();sfxGain=audioCtx.createGain();master.gain.value=.55;musicGain.gain.value=.12;sfxGain.gain.value=.35;musicGain.connect(master);sfxGain.connect(master);master.connect(audioCtx.destination)}if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx}
function tone(freq,d=.08,type='square',vol=.06,when=0,target='sfx'){const ac=ensureAudio();if(!ac||!freq)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime+when);g.gain.setValueAtTime(.0001,ac.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),ac.currentTime+when+.006);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+when+d);o.connect(g);g.connect(target==='music'?musicGain:sfxGain);o.start(ac.currentTime+when);o.stop(ac.currentTime+when+d+.02)}
function noise(d=.08,v=.08){const ac=ensureAudio();if(!ac)return;const len=Math.max(1,Math.floor(ac.sampleRate*d)),buf=ac.createBuffer(1,len,ac.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<len;i++)arr[i]=(Math.random()*2-1)*(1-i/len);const s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;g.gain.value=v;s.connect(g);g.connect(sfxGain);s.start()}
function sfx(k){if(!soundOn)return;if(k==='ui')tone(note.C5,.04);if(k==='cash'){tone(note.C5,.05);tone(note.E5,.07,'square',.06,.06)}if(k==='car'){tone(note.E2,.09,'sawtooth',.08);tone(note.G2,.11,'square',.04,.06)}if(k==='bad'){noise(.08,.12);tone(note.C2,.18,'square',.08)}if(k==='cop'){tone(note.A4,.1);tone(note.E5,.1,'square',.06,.1);tone(note.A4,.1,'square',.06,.2);tone(note.E5,.1,'square',.06,.3)}if(k==='horn'){tone(349.23,.25,'sawtooth',.055);tone(440,.25,'sawtooth',.045)}if(k==='win'){[note.C4,note.E4,note.G4,note.C5].forEach((f,i)=>tone(f,.12,'square',.06,i*.08))}}
function musicTick(){if(!soundOn||!audioCtx)return;const t=activeMusicTheme();if(!t)return;const beat=60/t.bpm/2,m=t.m[musicStep%t.m.length],b=t.b[Math.floor(musicStep/2)%t.b.length];if(m)tone(note[m],beat*.7,'square',.035,0,'music');if(musicStep%2===0&&b)tone(note[b],beat*1.2,'triangle',.03,0,'music');musicStep++}
function startMusic(theme=currentTheme){currentTheme=theme;if(!soundOn||!ensureAudio())return;clearInterval(musicTimer);musicStep=0;musicTick();musicTimer=setInterval(musicTick,(60/(activeMusicTheme()?.bpm||110)/2)*1000)}
function setTheme(screen){const map={titleScreen:'title',setupScreen:'title',prepScreen:'prep',carMarketScreen:'prep',sellerScreen:'prep',supplyScreen:'prep',roadScreen:'road',tradeScreen:'road',endingScreen:'end'};const t=map[screen]||'prep';if(t!==currentTheme){currentTheme=t;if(audioCtx)startMusic(t)}}
function rotateAppView(){
  try{
    if(window.AndroidOrientation&&typeof window.AndroidOrientation.toggle==='function'){
      window.AndroidOrientation.toggle();
      return;
    }
  }catch(e){}
  alert('Rotate your phone to switch orientation.');
}
function toggleSound(){soundOn=!soundOn;try{localStorage.setItem('lwh-sound',String(soundOn))}catch(e){}$('soundBtn').textContent=soundOn?'♪ SOUND ON':'♪ SOUND OFF';if(soundOn){if(master)master.gain.value=.55;ensureAudio();startMusic(currentTheme)}else{clearInterval(musicTimer);musicTimer=null;if(master)master.gain.value=0}}

/* setup */
function initSelects(){for(const id of ['originSelect','destSelect'])$(id).replaceChildren();cities.forEach((c,i)=>{for(const id of ['originSelect','destSelect']){const o=document.createElement('option');o.value=i;o.textContent=c.n;$(id).appendChild(o)}});$('originSelect').value='0';$('destSelect').value='4'}
function renderSetupCards(){$('careerGrid').innerHTML='';for(const c of careers){const b=document.createElement('button');b.className='cardbtn'+(state.career?.id===c.id?' selected':'');b.type='button';b.innerHTML=`<span class="name">${c.n}</span><span class="sub">${c.d}<br>START ${money(c.cash)} • STIPEND ${money(c.stip)}</span>`;b.onclick=()=>{state.career=c;renderSetupCards();sfx('ui')};$('careerGrid').appendChild(b)}$('reasonGrid').innerHTML='';for(const r of reasons){const b=document.createElement('button');b.className='cardbtn'+(state.reason?.id===r.id?' selected':'');b.type='button';b.innerHTML=`<span class="name">${r.n}</span><span class="sub">${r.d}<br>${r.days} DAYS TO MOVE</span>`;b.onclick=()=>{state.reason=r;renderSetupCards();sfx('ui')};$('reasonGrid').appendChild(b)}}
function rollAssets(){const count=rnd(4,7);state.assets=[...assetPool].sort(()=>Math.random()-.5).slice(0,count).map(([n,v])=>({n,v:round25(v*(.72+Math.random()*.56)),sold:false}))}
function rollListings(){state.listings=[...carPool].sort(()=>Math.random()-.5).slice(0,rnd(7,10)).map(c=>({...c,sold:false}));state.carIndex=0}
function startNewLife(){clearSave();initSelects();$('originCustom').value='';$('destCustom').value='';state=blankState();$('ageRange').value=31;$('ageOut').textContent='31';$('originSelect').value='0';$('destSelect').value='4';renderSetupCards();show('setupScreen')}
async function resolveCustomCity(text){const q=(text||'').trim();if(!q)return null;try{const u='https://photon.komoot.io/api/?limit=8&q='+encodeURIComponent(q+', USA');const r=await fetch(u,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('geocoder unavailable');const j=await r.json();const feats=(j.features||[]);const hit=feats.find(x=>String(x.properties?.countrycode||'').toUpperCase()==='US');if(!hit?.geometry?.coordinates)return null;const [lon,lat]=hit.geometry.coordinates;const p=hit.properties||{};const label=[p.name||q,p.state].filter(Boolean).join(', ');return {n:label,lat:Number(lat),lon:Number(lon)}}catch(e){return null}}
async function beginLife(){if(!state.career||!state.reason){alert('Choose a career and a reason for moving.');return}const btn=$('beginLifeBtn');btn.disabled=true;const oldText=btn.textContent;btn.textContent='FINDING ROUTE…';try{state.age=Number($('ageRange').value);state.onlineRoutes=$('onlineRoutes').checked;let oi=Number($('originSelect').value),di=Number($('destSelect').value);const [oc,dc]=state.onlineRoutes?await Promise.all([resolveCustomCity($('originCustom').value),resolveCustomCity($('destCustom').value)]):[null,null];if(state.onlineRoutes&&$('originCustom').value.trim()&&!oc){alert('I could not find that starting city. Try “City, State”.');return}if(state.onlineRoutes&&$('destCustom').value.trim()&&!dc){alert('I could not find that destination. Try “City, State”.');return}if(oc){cities.push(oc);oi=cities.length-1}if(dc){cities.push(dc);di=cities.length-1}state.origin=oi;state.dest=di;if(cities[state.origin].n===cities[state.dest].n){alert('Choose a different destination.');return}state.totalMiles=routeMiles();state.cash=Math.max(250,state.career.cash+state.reason.bonus);ensureTripStats();state.stats.startingCash=state.cash;state.days=state.reason.days;state.limits={shifts:state.career.shifts,ot:state.career.ot,parents:1,plasma:2,scratch:2,loan:1,stipend:1};rollAssets();rollListings();state.log=[`You are ${state.age}, working as ${state.career.n.toLowerCase()}.`,`You need to get from ${cities[state.origin].n} to ${cities[state.dest].n}: about ${state.totalMiles.toLocaleString()} road miles.`];renderPrep();show('prepScreen');refineRouteMiles()}finally{btn.disabled=false;btn.textContent=oldText}}

/* prep economy */
function prepAction(id){if(id==='shift'){if(state.limits.shifts<=0||state.days<1)return;state.limits.shifts--;state.cash+=state.career.pay;statEarn(state.career.pay);state.stats.shiftsWorked++;spendTime(1);addLog(`Extra shift: +${money(state.career.pay)}.`)}if(id==='ot'){if(state.limits.ot<=0||state.days<1)return;state.limits.ot--;const g=Math.round(state.career.pay*1.55);state.cash+=g;statEarn(g);state.stats.shiftsWorked++;spendTime(1);addLog(`Overtime: +${money(g)}.`)}if(id==='parents'){if(state.limits.parents<=0)return;state.limits.parents--;const g=chance(.22)?0:rnd(150,900);if(g){state.cash+=g;state.debt+=Math.round(g*.25);statEarn(g);state.stats.familyHelp+=g;addLog(`Family helped with ${money(g)}.`)}else addLog('Family provided advice instead of money.')}if(id==='plasma'){if(state.limits.plasma<=0||state.days<.5)return;state.limits.plasma--;const g=rnd(50,85);state.cash+=g;statEarn(g);state.stats.plasmaEarned+=g;spendTime(.5);state.morale=clamp(state.morale-2);addLog(`Plasma: +${money(g)}.`)}if(id==='scratch'){if(state.limits.scratch<=0)return;state.limits.scratch--;const spend=Math.min(20,state.cash);state.cash-=spend;statSpend(spend,'scratchSpent');const r=Math.random();const win=r<.02?rnd(500,1800):r<.16?rnd(40,220):0;state.cash+=win;if(win)statEarn(win,'scratchWon');addLog(win?`Scratch-offs: spent ${money(spend)}, won ${money(win)}.`:`Scratch-offs: -${money(spend)}.`)}if(id==='loan'){if(state.limits.loan<=0)return;state.limits.loan--;state.cash+=500;statEarn(500);state.debt+=720;state.stats.debtTaken+=720;addLog('Payday loan: +$500 now, $720 debt later.')}if(id==='stipend'){if(state.limits.stipend<=0)return;state.limits.stipend--;if(state.career.stip>0){state.cash+=state.career.stip;statEarn(state.career.stip);addLog(`Relocation money: +${money(state.career.stip)}.`)}else addLog('Employer offers no relocation assistance.')}sfx('cash');renderPrep();save()}
function renderPrep(){$('prepRoute').textContent=`${cities[state.origin].n} → ${cities[state.dest].n}`;$('prepStats').innerHTML=`<div class="stat"><b>${money(state.cash)}</b><span>CASH</span></div><div class="stat"><b>${state.days.toFixed(1).replace('.0','')}</b><span>DAYS LEFT</span></div><div class="stat"><b>${money(state.debt)}</b><span>DEBT</span></div><div class="stat"><b>${state.totalMiles.toLocaleString()}</b><span>ROAD MILES</span></div>`;$('situationTitle').textContent=`${state.reason.n} • ${state.career.n}`;$('situationCopy').textContent=`${state.reason.d}\n\nEvery preparation day is one less day available for the road.`;$('stipendNote').hidden=!(state.career.stip>0&&state.limits.stipend>0);if(!$('stipendNote').hidden)$('stipendNote').textContent=`Your employer may provide ${money(state.career.stip)} in relocation money.`;$('assetList').innerHTML='';for(const a of state.assets){const row=document.createElement('div');row.className='asset-row';row.innerHTML=`<b>${a.n}</b><br><span>${a.sold?'SOLD':'Estimated value '+money(a.v)}</span>`;if(!a.sold){const mini=document.createElement('div');mini.className='mini-actions';const market=document.createElement('button');market.type='button';market.textContent='MARKETPLACE';market.onclick=()=>{if(state.days<.5)return;spendTime(.5);if(chance(.22)){state.stats.buyersGhosted++;addLog(`${a.n}: buyer ghosted you.`)}else{const g=round25(a.v*(.85+Math.random()*.3));a.sold=true;state.cash+=g;statEarn(g);state.stats.possessionsSold++;addLog(`${a.n} sold for ${money(g)}.`)}renderPrep()};const pawn=document.createElement('button');pawn.type='button';pawn.textContent='PAWN NOW';pawn.onclick=()=>{const g=round25(a.v*.55);a.sold=true;state.cash+=g;statEarn(g);state.stats.possessionsSold++;addLog(`${a.n} pawned for ${money(g)}.`);renderPrep()};mini.append(market,pawn);row.appendChild(mini)}$('assetList').appendChild(row)}const acts=[['WORK EXTRA SHIFT','shift',state.limits.shifts],['ASK FOR OVERTIME','ot',state.limits.ot],['ASK FAMILY','parents',state.limits.parents],['SELL PLASMA','plasma',state.limits.plasma],['BUY SCRATCH-OFFS','scratch',state.limits.scratch],['PAYDAY LOAN','loan',state.limits.loan],['CLAIM RELOCATION','stipend',state.limits.stipend]];$('prepActions').innerHTML='';for(const [n,k,left] of acts){const b=document.createElement('button');b.className='cardbtn';b.type='button';b.disabled=left<=0;b.innerHTML=`<span class="name">${n}</span><span class="sub">${left} use${left===1?'':'s'} left</span>`;b.onclick=()=>prepAction(k);$('prepActions').appendChild(b)}$('lifeLog').innerHTML=state.log.map(x=>`<div>${escapeHtml(x)}</div>`).join('')}

/* cars and negotiation */
function sellerState(c){if(!state.sellers[c.id])state.sellers[c.id]={ask:c.p,floor:round25(c.p*(.80+Math.random()*.10)),attempts:0,patience:rnd(2,4),accepted:false,dead:false,inspected:false,tested:false,mechanic:false,known:[],urgency:Math.random()};return state.sellers[c.id]}
function renderCarAd(){const c=state.listings[state.carIndex],s=sellerState(c),cond=c.rel>=85?'GOOD':c.rel>=70?'FAIR':'QUESTIONABLE';setArt('carMarketScreenArt','car-'+c.id);$('marketCash').textContent=`YOU HAVE ${money(state.cash)}`;$('carAd').innerHTML=`<div class="ad"><h3>${c.y} ${c.n.toUpperCase()}</h3><div class="listing-number">LISTING ${state.carIndex+1} / ${state.listings.length}</div><div class="price">${money(s.ask)}</div><div class="copy">“${c.ad}”</div><div class="meta">${c.mi.toLocaleString()} MILES • ${cond} • ${c.mpg} MPG • SELLER: ${c.s.toUpperCase()}${c.sold||s.dead?'<br><b>UNAVAILABLE</b>':''}</div></div>`;$('visitSellerBtn').disabled=c.sold||s.dead}
function openCarMarket(){state.carIndex=0;renderCarAd();show('carMarketScreen')}
function visitSeller(){const c=state.listings[state.carIndex],s=sellerState(c);state.car=c;$('sellerCash').textContent=`YOU HAVE ${money(state.cash)}`;$('sellerTitle').textContent=`${c.s.toUpperCase()} HAS THE CAR IN THE DRIVEWAY.`;$('sellerBody').textContent=`${c.y} ${c.n}\n${c.mi.toLocaleString()} miles\nAsking ${money(s.ask)}.`;$('sellerNotice').hidden=true;$('offerButtons').innerHTML='';renderSellerButtons();updateScene();show('sellerScreen')}
function renderSellerButtons(){const s=sellerState(state.car);$('negotiationLeft').textContent=`${Math.max(0,3-s.attempts)} attempts left`;$('negotiateBtn').disabled=s.attempts>=3||s.dead||s.accepted;$('inspectBtn').disabled=s.inspected;$('testDriveBtn').disabled=s.tested;$('mechanicCheckBtn').disabled=s.mechanic||state.cash<85;$('buyCarBtn').disabled=s.dead||state.cash<s.ask}
function sellerNotice(text,kind=''){const n=$('sellerNotice');n.hidden=false;n.className='notice '+kind;n.textContent=text}
function inspectCar(){const s=sellerState(state.car);if(s.inspected)return;s.inspected=true;const find=state.career.skill==='repair'||chance(.68);if(find&&!s.known.includes(state.car.issues[0]))s.known.push(state.car.issues[0]);sellerNotice(find?`YOU NOTICE: ${state.car.issues[0].toUpperCase()}.\n${state.car.s.toUpperCase()}: “Yeah, it’s been like that.”`:'Nothing obviously catastrophic jumps out. That is not the same as good.');renderSellerButtons()}
function testCar(){const s=sellerState(state.car);if(s.tested)return;s.tested=true;const find=state.car.rel<72||chance(.36);if(find&&!s.known.includes(state.car.issues[1]))s.known.push(state.car.issues[1]);sellerNotice(find?`ON THE TEST DRIVE: ${state.car.issues[1].toUpperCase()}.\nThe seller turns the radio up slightly.`:'It starts, accelerates, brakes and returns. At this price, that is a strong performance.');sfx('car');renderSellerButtons()}
function mechanicCheck(){const s=sellerState(state.car);if(s.mechanic||state.cash<85)return;state.cash-=85;statSpend(85,'repairsSpent');s.mechanic=true;s.known=[...state.car.issues];sellerNotice(`THE MECHANIC FOUND: ${state.car.issues.join(' AND ').toUpperCase()}.\n\n“Could make it. Could also ruin your week.”`,'good');$('sellerCash').textContent=`YOU HAVE ${money(state.cash)}`;renderSellerButtons()}
function showOffers(){
 const s=sellerState(state.car);if(s.attempts>=3||s.dead||s.accepted)return;
 $('offerButtons').innerHTML='';
 const rep=state.career.skill==='people'?0.012:0;
 const leverage=(s.known.length&&state.career.skill==='repair')?0.018:0;
 const bands=[{lo:.94,hi:.98,label:'REASONABLE'},{lo:.86,hi:.92,label:'AGGRESSIVE'},{lo:.76,hi:.84,label:'LOWBALL'}];
 for(const band of bands){
   const mult=band.lo+Math.random()*(band.hi-band.lo)-rep-leverage;
   const v=Math.max(500,round25(s.ask*mult));
   const b=document.createElement('button');b.className='choice';b.type='button';
   b.innerHTML=`OFFER ${money(v)}<small>${band.label}</small>`;
   b.onclick=()=>makeOffer(v,band.label);$('offerButtons').appendChild(b)
 }
}
function makeOffer(v,label){
 const s=sellerState(state.car);if(s.attempts>=3||s.dead||s.accepted)return;s.attempts++;
 const skillBonus=state.career.skill==='people'?35:0;
 const defectBonus=(s.known.length&&state.career.skill==='repair')?60:0;
 const effective=v+skillBonus+defectBonus;
 const closeness=clamp((effective-s.floor)/Math.max(1,s.ask-s.floor),0,1);
 const urgencyBonus=s.urgency*.24;
 const roundBonus=(s.attempts-1)*.10;
 const labelPenalty=label==='LOWBALL'?.22:label==='AGGRESSIVE'?.08:0;
 const acceptChance=clamp(.12+closeness*.58+urgencyBonus+roundBonus-labelPenalty,0.05,.92);
 const automatic=effective>=s.ask-25;
 if(automatic||chance(acceptChance)){
   s.ask=v;s.accepted=true;
   $('sellerBody').textContent=`${state.car.s}: “Alright. ${money(v)}. Cash.”`;
   sellerNotice('OFFER ACCEPTED.','good');$('offerButtons').innerHTML='';
 }else{
   s.patience-=label==='LOWBALL'?2:1;
   if(s.patience<=0){
     s.dead=true;$('sellerBody').textContent=`${state.car.s}: “Actually, forget it.”`;
     sellerNotice('SELLER ENDED THE DEAL.','bad');$('offerButtons').innerHTML='';
   }else{
     const movement=.18+Math.random()*.24+(s.urgency*.08);
     const counter=Math.max(s.floor,round25(s.ask-(s.ask-v)*movement));s.ask=counter;
     $('sellerBody').textContent=`${state.car.s}: “No. I can do ${money(counter)}.”`;
     if(s.attempts<3)showOffers();
     else{$('offerButtons').innerHTML='';sellerNotice('THAT WAS YOUR THIRD NEGOTIATION ATTEMPT. The current counter is final. Buy it or walk away.')}
   }
 }
 renderSellerButtons();
}
function buyCar(){const s=sellerState(state.car);if(state.car.boughtPrice||s.dead||state.cash<s.ask){sellerNotice(`You need ${money(s.ask)}. You have ${money(state.cash)}.`,'bad');return}state.cash-=s.ask;statSpend(s.ask,'carSpent');state.stats.negotiationSaved+=Math.max(0,state.car.p-s.ask);state.car={...state.car,boughtPrice:s.ask};state.known=[...s.known];state.condition=clamp(state.car.rel+rnd(-5,6),35,96);addLog(`Bought ${state.car.y} ${state.car.n} for ${money(s.ask)}.`);renderSupplies();show('supplyScreen')}

/* supplies */
function renderSupplies(){$('supplyCash').textContent=`YOU HAVE ${money(state.cash)}`;$('ownedCar').textContent=`${state.car.y} ${state.car.n}`;$('knownIssues').textContent=`Known defects: ${state.known.length?state.known.join(', '):'none discovered'}\nEstimated condition: ${Math.round(state.condition)}%\nCargo capacity: ${state.car.cargo} units.`;$('supplyGrid').innerHTML='';for(const s of supplyDefs){const owned=state.inventory.includes(s.id);const b=document.createElement('button');b.className='cardbtn';b.type='button';b.disabled=owned||state.cash<s.cost;b.innerHTML=`<span class="name">${owned?'✓ ':''}${s.n} — ${money(s.cost)}</span><span class="sub">${s.d}</span>`;b.onclick=()=>{state.cash-=s.cost;statSpend(s.cost,'suppliesSpent');state.inventory.push(s.id);sfx('cash');renderSupplies()};$('supplyGrid').appendChild(b)}$('inventoryView').innerHTML=state.inventory.length?state.inventory.map(id=>`<span class="chip">${supplyDefs.find(x=>x.id===id)?.n||id}</span>`).join(''):'<span class="chip">Nothing extra</span>'}
function hasItem(id){return state.inventory.includes(id)}function useItem(id){const i=state.inventory.indexOf(id);if(i<0)return false;state.inventory.splice(i,1);return true}
function depart(){if(state.departed)return;state.departed=true;ensureTripStats();state.distance=0;state.stats.milesDriven=0;state.stats.driveHours=0;state.stats.gallonsUsed=0;state.fuel=100;state.fatigue=4;state.hunger=8;state.morale=70;state.day=1;state.hour=9.5;state.weather='CLEAR';state.usedEvents=[];state.recentFamilies=[];state.currentEvent=null;state.ended=false;$('eventTag').textContent='DEPARTURE';$('eventTitle').textContent='YOU PULL ONTO THE HIGHWAY.';$('eventBody').textContent=`The ${state.car.n} settles into highway speed.\n\n${cities[state.dest].n} is about ${state.totalMiles.toLocaleString()} miles away. Everything you own is either in this car or behind you.`;$('eventChoices').innerHTML='';$('driveLegBtn').hidden=false;renderRoadHud();show('roadScreen');sfx('car')}

/* Fuel is priced per gallon; every quote uses the selected vehicle's tank and MPG. */
const FUEL_PRICE_PER_GALLON=4;
const fuelMoney=n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function fuelQuote(s,budget=Infinity){
 const missing=Math.max(0,s.car.tank*(100-clamp(s.fuel))/100);
 const fullCost=Math.ceil((missing*FUEL_PRICE_PER_GALLON-1e-9)*100)/100;
 const cost=Math.max(0,Math.min(fullCost,Math.floor(s.cash*100+1e-6)/100,budget));
 const gallons=Math.min(missing,cost/FUEL_PRICE_PER_GALLON);
 const level=clamp(s.fuel+gallons/s.car.tank*100);
 return {cost,fullCost,gallons,level,range:level/100*s.car.tank*s.car.mpg,full:cost>=fullCost};
}
function fuelStopDescription(s){
 const q=fuelQuote(s),leg=s.pendingLegMiles||Math.min(62,s.totalMiles-s.distance);
 return `Fuel: ${fuelMoney(FUEL_PRICE_PER_GALLON)} per gallon. Your ${s.car.tank}-gallon tank is ${Math.round(s.fuel)}% full. A full refill costs ${fuelMoney(q.fullCost)}. Cash available: ${fuelMoney(s.cash)}.\n\n${q.full?'You can fill the tank.':'PARTIAL REFILL ONLY — your cash will not fill the tank.'} ${fuelMoney(q.cost)} buys ${q.gallons.toFixed(2)} gallons, bringing you to ${Math.round(q.level)}% and about ${Math.floor(q.range)} miles of range.${q.range<leg?'\nWARNING: This will not cover the next '+leg+'-mile leg.':''}`;
}
function fuelChoiceLabel(s,label){
 if(label==='KEEP GOING')return label;
 const q=fuelQuote(s,label==='ADD $20'?20:Infinity);
 return `${label==='ADD $20'?'ADD FUEL':q.full?'FILL TANK':'PARTIAL REFILL'} — ${fuelMoney(q.cost)} · ${q.gallons.toFixed(2)} gal → ${Math.round(q.level)}% · ~${Math.floor(q.range)} mi`;
}
function purchaseFuel(s,budget=Infinity){
 const q=fuelQuote(s,budget);
 if(q.cost<=0)return 'No fuel purchased. Your cash and tank are unchanged.';
 s.cash=Math.round((s.cash-q.cost)*100)/100;s.fuel=q.level;
 statSpend(q.cost,'fuelSpent');s.stats.fuelStops++;s.lastFuelVisitMiles=s.distance;
 s.fuelStopDeclined=false;
 return `Bought ${q.gallons.toFixed(2)} gallons for ${fuelMoney(q.cost)}. Tank: ${Math.round(s.fuel)}%. Estimated range: ${Math.floor(q.range)} miles.${q.full?'':' This was a partial refill.'}`;
}

/* road events */
const roadEvents=[
 {id:'heat',family:'mechanical',tag:'MECHANICAL',eligible:s=>s.condition<80||s.car.issues.some(x=>/coolant|water pump|fan|intake/i.test(x)),title:'THE TEMPERATURE NEEDLE STARTS CLIMBING.',body:s=>s.known.some(x=>/coolant|water pump|fan|intake/i.test(x))?'That defect you knew about is becoming less theoretical.':'The gauge creeps past normal.',choices:[['PULL OVER',s=>{advance(.4);s.fatigue=clamp(s.fatigue-1);return'You stop before the gauge reaches red. The engine cools down.'}],['ADD COOLANT',s=>useItem('coolant')?(s.condition=clamp(s.condition+5),'Coolant buys you breathing room.'):(s.condition=clamp(s.condition-8),'You do not have coolant.')],['KEEP DRIVING',s=>{state.stats.warningsIgnored++;s.condition=clamp(s.condition-rnd(8,18));return'The engine stays hot. You keep moving anyway.'}]]},
 {id:'fuel',family:'stop',tag:'FUEL',eligible:s=>s.fuel<42&&s.distance-(s.lastFuelVisitMiles??-1000)>=60,title:'FUEL STOP.',body:s=>fuelStopDescription(s),choices:[['FILL TANK',s=>purchaseFuel(s)],['ADD $20',s=>purchaseFuel(s,20)],['KEEP GOING',()=> 'You pass the station. The gauge notices.']]},
 {id:'tire',family:'mechanical',tag:'MECHANICAL',eligible:s=>s.distance>80,title:'THUMP. THUMP. THUMP.',body:()=> 'The steering wheel starts vibrating. Something is wrong with a tire.',choices:[['STOP NOW',s=>useItem('fixflat')?'Tire sealant keeps you moving.':(s.cash=Math.max(0,s.cash-85),'The tire costs you $85.')],['KEEP GOING',s=>{state.stats.warningsIgnored++;s.condition=clamp(s.condition-10);return'The vibration becomes part of the soundtrack.'}]]},
 {id:'motel',family:'rest',tag:'REST',eligible:s=>s.fatigue>58||s.hour>19,title:'VACANCY.',body:()=> 'A roadside motel glows beside the highway.',choices:[['GET A ROOM',s=>{const c=78;s.cash-=c;statSpend(c,'lodgingSpent');state.stats.motelNights++;s.fatigue=10;s.morale=clamp(s.morale+7);advance(8);return`You spend ${money(c)} and sleep eight hours.`}],['SLEEP IN CAR',s=>{state.stats.carNights++;s.fatigue=28;s.morale=clamp(s.morale-(hasItem('blanket')?0:5));advance(6);return'Your spine files a formal complaint.'}],['KEEP DRIVING',s=>{s.fatigue=clamp(s.fatigue+14);return'Rest becomes Future You’s problem.'}]]},
 {id:'food',family:'stop',tag:'FOOD',eligible:s=>s.hunger>48,title:'YOU NEED FOOD.',body:()=> 'A diner and a gas station share the next exit.',choices:[['DINER — $22',s=>{statSpend(Math.min(22,s.cash),'foodSpent');s.cash=Math.max(0,s.cash-22);s.hunger=12;s.morale=clamp(s.morale+5);return'Hot food makes you feel human again.'}],['USE ROAD FOOD',s=>useItem('food')?(s.hunger=18,'You eat from your supplies.'):(statSpend(Math.min(9,s.cash),'foodSpent'),s.cash=Math.max(0,s.cash-9),s.hunger=30,'Gas-station food does the job.')],['SKIP IT',s=>{state.stats.mealsSkipped++;s.hunger=clamp(s.hunger+8);return'Hunger becomes a future problem.'}]]},
 {id:'cop',family:'law',tag:'LAW',eligible:s=>s.distance>120,title:'RED AND BLUE LIGHTS APPEAR IN THE MIRROR.',body:s=>s.heat>0?`A patrol car settles in behind you. Heat: ${Math.round(s.heat)}.`:'A patrol car settles in behind you.',choices:[['PULL OVER',s=>policeOutcome(s)],['SLOW DOWN AND WAIT',s=>chance(.65)?'The cruiser passes. You exhale.':policeOutcome(s)]]},
 {id:'repair',family:'repair',tag:'REPAIR',eligible:s=>s.condition<58,title:'REPAIR SHOP — NEXT EXIT.',body:()=> 'The sign says FOREIGN & DOMESTIC. Your car appears to be both.',choices:[['FULL REPAIR',s=>{const c=300;s.cash-=c;statSpend(c,'repairsSpent');s.condition=clamp(s.condition+rnd(22,36));return`You spend ${money(c)}. The car leaves with fewer noises.`}],['CHEAP FIX',s=>{const c=95;s.cash-=c;statSpend(c,'repairsSpent');s.condition=clamp(s.condition+rnd(8,17));return`You authorize the “get me there” repair for ${money(c)}.`}],['KEEP GOING',()=> 'You pass the shop. The car says nothing.']]},
 {id:'phone',family:'social',tag:'SOCIAL',eligible:s=>s.distance>180,title:'YOUR PHONE RINGS.',body:()=> pick(['Your mother asks whether the car is “one of those safe ones.”','Your dad asks how the engine sounds, then listens in silence.','A family group chat starts discussing your trip like a missing-person case.']),choices:[['ANSWER',s=>{s.morale=clamp(s.morale+5);return'The conversation is annoying and reassuring.'}],['IGNORE IT',()=> 'The notification remains. You keep driving.']]},
 {id:'deer',family:'hazard',tag:'HAZARD',eligible:s=>isNight()&&s.distance>100,title:'EYES FLASH IN THE HEADLIGHTS.',body:()=> 'A deer commits fully to a terrible idea.',choices:[['BRAKE HARD',s=>chance(.18)?(s.condition=clamp(s.condition-8),'You miss the deer and hit a pothole hard enough to move the dashboard.'):'ABS chatters. The deer disappears into the dark.'],['HOLD YOUR LINE',s=>chance(.22)?(s.condition=clamp(s.condition-28),'Impact. The hood is bent. The car is still running, somehow.'):'The deer clears the lane by inches.']]},
 {id:'shortcut',family:'navigation',tag:'NAVIGATION',eligible:s=>s.distance>250,title:'THE NAVIGATION APP OFFERS A SHORTCUT.',body:()=> 'It claims the alternate route saves 17 minutes and looks suspiciously like a county road.',choices:[['TAKE IT',s=>chance(.55)?(s.distance+=18,'The shortcut works. You will now trust technology too much.'):(s.condition=clamp(s.condition-5),advance(.8),'The shortcut turns to gravel, then mud, then regret.')],['STAY ON HIGHWAY',()=> 'You keep to the interstate.'],['USE PAPER ATLAS',s=>hasItem('atlas')?(s.distance+=10,'The atlas suggests a sane alternate route.'):'You remember that you did not buy the atlas.']]},
 {id:'jobcall',family:'social',tag:'DEADLINE',eligible:s=>s.reason.id==='career'&&s.distance>300,title:'YOUR NEW EMPLOYER CALLS.',body:()=> 'They want to confirm your start date. They sound cheerful because they are not the ones crossing the country.',choices:[['SAY YOU’RE ON TRACK',s=>{s.morale=clamp(s.morale+3);return'You sound much more confident than the dashboard justifies.'}],['ASK FOR ONE MORE DAY',s=>chance(.45)?(s.days+=1,'They agree. You gain one day.'):'They cannot move the date.']]},
 {id:'luck',family:'luck',tag:'LUCK',eligible:s=>s.distance>60,title:'YOU FIND SOMETHING UNDER THE SEAT.',body:()=> 'While reaching for a receipt, your hand hits something folded.',choices:[['GRAB IT',s=>{const c=rnd(12,85);s.cash+=c;return`Cash. ${money(c)}. The previous owner has sponsored part of your trip.`}],['CHECK THE WHOLE CAR',s=>{const c=rnd(20,120);s.cash+=c;advance(.3);return`You find ${money(c)}, two pens, and a receipt from 2021.`}]]},
 {id:'marketcontact',family:'social',tag:'ODD JOB',eligible:s=>s.distance>150&&!s.undergroundUnlocked&&s.underworldScore<2,title:'A STRANGER AT THE TRUCK STOP ASKS WHERE YOU’RE HEADED.',body:()=> '“You ever carry things for people?”',choices:[['ASK WHAT KIND OF THINGS',s=>{s.underworldScore++;return'The stranger gives you a first name and says to ask around at certain markets.'}],['NO THANKS',()=> 'You leave the conversation where it is.']]}
];

roadEvents.push(
 {id:'windshield',family:'mechanical',tag:'ROAD DAMAGE',eligible:s=>s.distance>90&&!s.windshieldDamaged,title:'CRACK.',body:()=> 'A stone snaps off a truck tire and puts a bright new star in the windshield.',choices:[['IGNORE IT',s=>{s.morale=clamp(s.morale-2);return'The crack becomes part of the scenery.'}],['REPAIR AT NEXT STOP — $45',s=>{s.cash-=45;s.windshieldDamaged=false;statSpend(45,'repairsSpent');return'The damaged glass is repaired. The windshield is clear again.'}]]},
 {id:'exhaust',family:'mechanical',tag:'MECHANICAL',eligible:s=>s.distance>120,title:'THE CAR SUDDENLY SOUNDS LIKE A TRACTOR.',body:()=> 'Something in the exhaust has stopped participating.',choices:[['WIRE IT UP',s=>hasItem('toolkit')?(s.condition=clamp(s.condition-1),'The toolkit and questionable confidence get it off the pavement.'):(s.condition=clamp(s.condition-5),'You improvise badly. It mostly works.')],['REPAIR — $110',s=>{s.cash=Math.max(0,s.cash-110);s.condition=clamp(s.condition+2);return'The muffler shop removes the soundtrack.'}],['LIVE WITH IT',s=>{s.morale=clamp(s.morale-3);return'You become the loudest thing on the interstate.'}]]},
 {id:'alternator',family:'mechanical',tag:'ELECTRICAL',eligible:s=>s.distance>250&&s.condition<82,title:'THE DASH LIGHTS DIM WHEN YOU BRAKE.',body:()=> 'The radio cuts out for half a second. Then comes back.',choices:[['FIND A PARTS STORE',s=>{const c=Math.min(s.cash,190);s.cash-=c;s.condition=clamp(s.condition+8);advance(1.2);return`You spend ${money(c)} and lose an hour changing an alternator.`}],['KEEP GOING',s=>{s.condition=clamp(s.condition-8);return'The battery light joins the conversation.'}]]},
 {id:'wipers',family:'weather',tag:'WEATHER',eligible:s=>s.weather.includes('RAIN'),title:'THE WIPERS STOP HALFWAY UP THE WINDSHIELD.',body:()=> 'Of course they do this now.',choices:[['PULL OVER',s=>{advance(.35);s.fatigue=clamp(s.fatigue-1);return'You wait for the worst rain to pass.'}],['TRY TO FIX THEM',s=>hasItem('toolkit')?'A loose linkage pops back into place.':'You move them by hand exactly once and learn nothing.'],['KEEP GOING SLOW',s=>{s.fatigue=clamp(s.fatigue+5);return'Every pair of headlights becomes an abstract painting.'}]]},
 {id:'construction',family:'navigation',tag:'DETOUR',eligible:s=>s.distance>100,title:'ROAD CLOSED AHEAD.',body:()=> 'Orange barrels funnel everyone toward a two-lane detour.',choices:[['TAKE DETOUR',s=>{state.totalMiles+=rnd(12,28);advance(.6);return'The trip gets longer. So does the line of brake lights.'}],['WAIT IT OUT',s=>{advance(1.1);s.fatigue=clamp(s.fatigue-2);return'You lose an hour but keep the planned route.'}]]},
 {id:'toll',family:'law',tag:'TOLL',eligible:s=>s.distance>100,title:'SURPRISE TOLL ROAD.',body:()=> 'The highway did not mention this until you were committed.',choices:[['PAY — $9',s=>{s.cash=Math.max(0,s.cash-9);return'Nine dollars buys permission to keep using the road you are already on.'}],['TAKE THE EXIT',s=>{state.totalMiles+=18;return'You save nine dollars and spend eighteen miles.'}]]},
 {id:'ac',family:'mechanical',tag:'COMFORT',eligible:s=>s.weather==='HOT',title:'THE AIR CONDITIONING GIVES UP.',body:()=> 'The vents are now moving hot air from one part of the car to another.',choices:[['BUY ICE — $6',s=>{s.cash=Math.max(0,s.cash-6);s.morale=clamp(s.morale+3);return'A bag of ice becomes climate control.'}],['KEEP GOING',s=>{s.fatigue=clamp(s.fatigue+7);s.morale=clamp(s.morale-5);return'The seat belt becomes a branding iron.'}]]},
 {id:'hail',family:'weather',tag:'WEATHER',eligible:s=>s.weather==='HEAVY RAIN'||s.weather==='WINDY',title:'HAIL STARTS HITTING THE ROOF.',body:()=> 'At first it sounds like gravel. Then it gets bigger.',choices:[['FIND COVER',s=>{advance(.5);return'You hide under a gas-station canopy with six other cars.'}],['KEEP MOVING',s=>{s.condition=clamp(s.condition-rnd(2,7));return'The hood gains several permanent memories.'}]]},
 {id:'stateLine',family:'milestone',tag:'MILESTONE',eligible:s=>s.distance>200,title:'WELCOME TO ANOTHER STATE.',body:()=> 'For a moment the trip feels measurable.',choices:[['STOP FOR A PHOTO',s=>{advance(.15);s.morale=clamp(s.morale+7);return'You document the fact that you are, technically, making progress.'}],['KEEP MOVING',s=>{s.morale=clamp(s.morale+3);return'The sign disappears in the mirror.'}]]},
 {id:'overlook',family:'rest',tag:'SCENIC',eligible:s=>s.distance>280&&s.morale<78,title:'SCENIC OVERLOOK — 1/4 MILE.',body:()=> 'The view looks expensive. The parking is free.',choices:[['STOP',s=>{advance(.25);s.morale=clamp(s.morale+12);s.fatigue=clamp(s.fatigue-3);return'For fifteen minutes, the move feels like a trip instead of an emergency.'}],['NOT TODAY',()=> 'You watch the overlook disappear behind a guardrail.']]},
 {id:'trucker',family:'social',tag:'ROADSIDE',eligible:s=>s.distance>220,title:'A TRUCKER AT THE COFFEE COUNTER NODS AT YOUR CAR.',body:()=> pick(['“Keep an eye on that weather west of here.”','“That route gets ugly after dark.”','“I had one of those. Transmission outlived the body.”']),choices:[['LISTEN',s=>{s.morale=clamp(s.morale+2);return'You get coffee, a route tip, and an unsolicited story about Wyoming.'}],['THANK HIM AND GO',()=> 'You head back to the car.']]},
 {id:'restarea',family:'rest',tag:'REST AREA',eligible:s=>s.fatigue>35,title:'REST AREA — NEXT RIGHT.',body:()=> 'Clean bathrooms are not guaranteed. Stopping is free.',choices:[['TAKE 20 MINUTES',s=>{advance(.33);s.fatigue=clamp(s.fatigue-10);return'You stretch, wash your face, and become marginally safer.'}],['KEEP DRIVING',()=> 'You keep the cruise control set.']]},
 {id:'vending',family:'stop',tag:'VENDING',eligible:s=>s.hunger>25,title:'THE REST-AREA VENDING MACHINE HAS DINNER.',body:()=> 'A spiral of snacks rotates behind scratched glass.',choices:[['BUY SOMETHING — $4',s=>{s.cash=Math.max(0,s.cash-4);s.hunger=clamp(s.hunger-12);return'Your meal has a shelf life measured in presidential administrations.'}],['SAVE THE MONEY',()=> 'You decide hunger builds character.']]},
 {id:'festival',family:'navigation',tag:'SMALL TOWN',eligible:s=>s.distance>300,title:'THE MAIN ROAD IS BLOCKED BY A PARADE.',body:()=> 'There are tractors, folding chairs, and absolutely no urgency.',choices:[['WATCH FOR A WHILE',s=>{advance(.65);s.morale=clamp(s.morale+9);return'You eat something fried and forget the deadline for thirty minutes.'}],['FIND A WAY AROUND',s=>{state.totalMiles+=9;return'You learn several residential streets no tourist has ever needed.'}]]},
 {id:'roadsideAttraction',family:'luck',tag:'ROADSIDE',eligible:s=>s.distance>250,title:'WORLD’S LARGEST SOMETHING — NEXT EXIT.',body:()=> 'The billboard refuses to specify what the something is.',choices:[['GO SEE IT',s=>{advance(.4);s.cash=Math.max(0,s.cash-8);s.morale=clamp(s.morale+10);return'It is larger than expected and somehow less impressive.'}],['ABSOLUTELY NOT',()=> 'You will never know. This may haunt you.']]},
 {id:'extext',family:'social',tag:'SOCIAL',eligible:s=>s.reason.id==='divorce'&&s.distance>180,title:'YOUR EX TEXTS: “YOU MAKE IT YET?”',body:()=> 'There are several ways to answer this incorrectly.',choices:[['“WORKING ON IT.”',s=>{s.morale=clamp(s.morale+1);return'The typing bubbles appear. Then disappear.'}],['DON’T ANSWER',s=>{s.morale=clamp(s.morale+2);return'The phone goes face down in the cup holder.'}]]},
 {id:'refund',family:'luck',tag:'MONEY',eligible:s=>s.distance>200,title:'A DEPOSIT HITS YOUR ACCOUNT.',body:()=> pick(['Your old utility company finally returned the deposit.','Your landlord remembered the security deposit existed.','A forgotten reimbursement finally cleared.']),choices:[['CHECK BALANCE',s=>{const c=rnd(45,210);s.cash+=c;return`Unexpected money: +${money(c)}.`}]]},
 {id:'cargoOffer',family:'trade',tag:'OPPORTUNITY',eligible:s=>s.distance>300&&cargoUsed()<s.car.cargo,title:'A GUY AT THE FUEL PUMP WANTS SOMETHING MOVED ONE TOWN OVER.',body:()=> 'The item is legal, bulky, and wrapped in more tape than seems necessary.',choices:[['TAKE THE JOB',s=>{const c=rnd(80,180);s.cash+=c;advance(.45);return`You make ${money(c)} for being temporarily useful.`}],['PASS',()=> 'You decide the trunk already contains enough uncertainty.']]},
 {id:'cargoScam',family:'trade',tag:'MARKET',eligible:s=>cargoUsed()>0&&s.distance>300,title:'A BUYER CHANGES THE DEAL IN THE PARKING LOT.',body:()=> 'The price is suddenly lower than the messages suggested.',choices:[['TAKE THE LOWER PRICE',s=>{const ids=Object.keys(s.cargo);if(!ids.length)return'You have nothing to sell.';const id=pick(ids);const g=[...legalGoods,...undergroundGoods].find(x=>x.id===id);addCargo(id,-1);const c=Math.round((g?.base||50)*.7);s.cash+=c;return`You unload one unit for ${money(c)} and leave annoyed.`}],['WALK AWAY',s=>{s.morale=clamp(s.morale+2);return'You put it back in the trunk. No deal.'}]]},
 {id:'battery',family:'mechanical',tag:'ELECTRICAL',eligible:s=>s.distance>250&&s.condition<78,title:'CLICK. CLICK. CLICK.',body:()=> 'After a fuel stop, the starter has opinions.',choices:[['ASK FOR A JUMP',s=>{advance(.25);return'A stranger with jumper cables saves the next twenty minutes of your life.'}],['BUY A BATTERY — $145',s=>{const c=Math.min(145,s.cash);s.cash-=c;s.condition=clamp(s.condition+6);return`You spend ${money(c)} on a new battery.`}]]}
);

function policeOutcome(s){sfx('cop');ensureTripStats();state.stats.policeStops++;if(s.heat>0&&chance(Math.min(.7,.15+s.heat/120))){const illegalIds=undergroundGoods.map(g=>g.id);let lost=0;for(const id of illegalIds){lost+=cargoCount(id);delete s.cargo[id]}s.heat=clamp(s.heat+10);if(lost&&chance(.18+s.heat/150)){endGame('ARRESTED','THE JOURNEY WILL NOT CONTINUE.',`Underground cargo was discovered during a traffic stop.\nVehicle impounded.\nCash remaining: ${money(s.cash)}.`);return'The stop becomes much more serious.'}statSpend(Math.min(600,s.cash),'ticketsSpent');state.stats.cargoConfiscated+=lost;s.cash=Math.max(0,s.cash-600);return`Your underground cargo is confiscated. Legal costs: $600.`}return chance(.55)?(statSpend(Math.min(120,s.cash),'ticketsSpent'),s.cash=Math.max(0,s.cash-120),'You leave with a $120 ticket.'):'You get a warning and a lecture.'}
function chooseEvent(){const forcedId=state.fuel<26&&state.distance-(state.lastFuelVisitMiles??-1000)>=60?'fuel':state.fatigue>82?'motel':state.hunger>76?'food':state.condition<36?'repair':null;if(forcedId){const forced=roadEvents.find(e=>e.id===forcedId&&e.eligible(state));if(forced)return forced}let pool=roadEvents.filter(e=>e.eligible(state)&&!state.usedEvents.includes(e.id));if(!pool.length){state.usedEvents=[];pool=roadEvents.filter(e=>e.eligible(state))}const filtered=pool.filter(e=>!state.recentFamilies.includes(e.family));return pick(filtered.length?filtered:pool)}
function triggerEvent(forced=null,restoring=false){const e=forced||chooseEvent();if(!e){showQuiet();return}state.currentEvent=e.id;if(e.id==='windshield')state.windshieldDamaged=true;if(!restoring){state.usedEvents.push(e.id);state.recentFamilies.push(e.family);state.recentFamilies=state.recentFamilies.slice(-3);state.stats.stops+=['stop','rest','repair'].includes(e.family)?1:0;state.stats.breakdowns+=e.family==='mechanical'?1:0;}setRoadScene(eventScene(e));$('eventTag').textContent=e.tag;$('eventTitle').textContent=e.title;$('eventBody').textContent=restoring&&state.roadNarrative&&e.id!=='fuel'?state.roadNarrative.body:(typeof e.body==='function'?e.body(state):e.body);$('eventChoices').innerHTML='';$('driveLegBtn').hidden=true;if(e.family==='mechanical'||e.family==='hazard')sfx('bad');for(const [label,resolver] of e.choices){const b=document.createElement('button');b.className='choice';b.type='button';const cost=choiceCost(e,label);b.textContent=e.id==='fuel'?fuelChoiceLabel(state,label):cost&&!/\$/.test(label)?label+' — '+money(cost):label;b.disabled=cost>state.cash||(e.id==='fuel'&&label!=='KEEP GOING'&&cost<=0);b.onclick=()=>{if(cost>state.cash)return;resolveEvent(resolver,label)};$('eventChoices').appendChild(b)}renderRoadHud();save()}
function resolveEvent(resolver,label=''){const event=roadEvents.find(e=>e.id===state.currentEvent),before=state.cash,spent=state.stats.totalSpent,earned=state.stats.totalEarned;const out=resolver(state);if(event?.id==='fuel'){state.lastFuelVisitMiles=state.distance;if(label==='KEEP GOING')state.fuelStopDeclined=true;}const expense=Math.max(0,before-state.cash-(state.stats.totalSpent-spent)),income=Math.max(0,state.cash-before-(state.stats.totalEarned-earned));if(expense)statSpend(expense,event?.family==='mechanical'?'repairsSpent':event?.id==='vending'||event?.id==='ac'?'foodSpent':undefined);if(income)statEarn(income);state.stats.milesDriven=Math.min(state.totalMiles,state.distance);if(event?.id==='roadsideAttraction'&&state.cash<before)state.stats.attractions++;if(state.ended)return;$('eventTag').textContent='CONTINUE';$('eventTitle').textContent='YOU CONTINUE.';$('eventBody').textContent=out;$('eventChoices').innerHTML='';$('driveLegBtn').hidden=false;state.currentEvent=null;state.condition=clamp(state.condition);state.fatigue=clamp(state.fatigue);state.hunger=clamp(state.hunger);state.morale=clamp(state.morale);if(!checkFailure()&&state.distance>=state.totalMiles)endGame('YOU MADE IT',`WELCOME TO ${cities[state.dest].n.toUpperCase()}.`,successSummary());renderRoadHud();save()}
function showQuiet(){state.currentEvent=null;setRoadScene('drive');$('eventTag').textContent='ROAD';$('eventTitle').textContent='THE ROAD KEEPS GOING.';$('eventBody').textContent=pick(['Nothing goes wrong for fifty miles.','The radio fades between stations while the landscape rolls by.','For a while, the trip is almost peaceful.','The highway opens up and the car seems content enough.']);$('eventChoices').innerHTML='';$('driveLegBtn').hidden=false}
function driveLeg(){if(state.ended||state.currentEvent)return;setRoadScene('drive');const miles=state.pendingLegMiles??Math.min(rnd(38,62),state.totalMiles-state.distance);state.pendingLegMiles=miles;const fullRange=state.car.mpg*state.car.tank;const fuelNeed=(miles/fullRange)*100;if(state.fuel<=fuelNeed+9&&!state.fuelStopDeclined){const fuelEvent=roadEvents.find(e=>e.id==='fuel');triggerEvent(fuelEvent);return}if(state.fuel<fuelNeed){const gallons=state.fuel/100*state.car.tank,remaining=gallons*state.car.mpg;ensureTripStats();state.distance+=remaining;state.stats.milesDriven=state.distance;state.stats.gallonsUsed+=gallons;state.stats.driveHours+=remaining/60;advance(remaining/60);state.fuel=0;state.pendingLegMiles=null;renderRoadHud();checkFailure();save();return;}state.pendingLegMiles=null;state.fuelStopDeclined=false;const hours=miles/60+Math.random()*.18;state.distance+=miles;ensureTripStats();state.stats.milesDriven=state.distance;state.stats.driveHours+=hours;state.stats.gallonsUsed+=miles/Math.max(1,state.car.mpg);advance(hours);state.fuel=clamp(state.fuel-fuelNeed);state.fatigue=clamp(state.fatigue+rnd(4,8));state.hunger=clamp(state.hunger+rnd(3,7));state.phone=clamp(state.phone-rnd(2,5));state.condition=clamp(state.condition-rnd(0,2)-(state.car.rel<65&&chance(.3)?2:0));state.morale=clamp(state.morale-rnd(0,2));state.heat=clamp(state.heat-rnd(1,3));noteHeat();if(chance(.22))state.weather=pick(['CLEAR','OVERCAST','LIGHT RAIN','HEAVY RAIN','WINDY','HOT','COOL','FOG']);if(state.distance>=state.totalMiles){endGame('YOU MADE IT',`WELCOME TO ${cities[state.dest].n.toUpperCase()}.`,successSummary());return}if(checkFailure())return;if(chance(.8))triggerEvent();else showQuiet();renderRoadHud();save()}
function checkFailure(){if(state.fuel<=0){endGame('STRANDED','YOU RAN OUT OF FUEL.',`You made it ${Math.round(state.distance)} miles. The gauge had been telling the truth.`);return true}if(state.condition<=0){endGame('THE CAR IS DONE',`${state.car.n.toUpperCase()} WILL NOT CONTINUE.`,failureSummary());return true}if(state.fatigue>=98){endGame('YOU NODDED OFF','THE ROAD BLURRED FOR ONE SECOND TOO LONG.',`The journey ends ${Math.max(0,state.totalMiles-Math.round(state.distance))} miles from ${cities[state.dest].n}.`);return true}if(state.reason.hard&&state.days<0){endGame('YOU MISSED THE DEADLINE','THE REASON FOR THE TRIP EXPIRED BEFORE YOU ARRIVED.',`You are still ${Math.max(0,state.totalMiles-Math.round(state.distance))} miles from ${cities[state.dest].n}.`);return true}return false}
function failureSummary(){const known=state.known.length?`You knew about ${state.known.join(' and ')} before leaving.`:'You never found the worst problem before it mattered.';return `${known}\nCash remaining: ${money(state.cash)}\nDistance traveled: ${Math.round(state.distance)} miles.`}
function successSummary(){return `Cash remaining: ${money(state.cash)}\nDebt waiting for you: ${money(state.debt)}\nVehicle condition: ${Math.round(state.condition)}%\nHeat: ${Math.round(state.heat)}\n\nAgainst several reasonable objections, the journey worked.`}
function updateRouteInstruction(){
 let text='Continue toward '+cities[state.dest].n+'.';
 if(state.routeSteps?.length){
  const step=state.routeSteps.find(x=>x.mile>state.distance)||state.routeSteps[state.routeSteps.length-1];
  if(step){
   const road=step.name||cities[state.dest].n,modifier=(step.modifier||'').replace('uturn','around');
   const actions={turn:'Turn '+modifier+' onto ',depart:'Head '+modifier+' on ',merge:'Merge onto ','on ramp':'Take the ramp to ','off ramp':'Take the exit to ',fork:'Keep '+modifier+' toward ',roundabout:'Follow the roundabout toward ',rotary:'Follow the roundabout toward ',arrive:'Arrive at '};
   text=(actions[step.type]||'Continue on ')+road;
   text=text.replace(/\s+/g,' ').trim()+' • about '+Math.max(0,Math.round(step.mile-state.distance))+' mi';
  }
 }
 $('routeInstruction').textContent='ROUTE: '+text;
}
function renderCockpit(){
 const station=radioStations[state.radioStation||0];$('radioStationLabel').textContent=station.name;
 $('radioBtn').setAttribute('aria-label','Change radio station, currently '+station.name+(soundOn?'':', sound muted'));
 if($('dashDialog').open)renderDashboard();
}
function renderDashboard(){
 $('dashTitle').textContent=(state.car?.n||'VEHICLE').toUpperCase()+' / DASH';
 $('dashOdometer').textContent=Math.round((state.car?.mi||0)+state.distance).toLocaleString()+' MI';
 $('dashTrip').textContent=Math.round(state.distance).toLocaleString()+' MI';
 $('dashFuel').textContent=Math.round(state.fuel)+'% / ~'+Math.floor(state.fuel/100*state.car.tank*state.car.mpg)+' MI';
 $('dashCondition').textContent=Math.round(state.condition)+'%';
 const warnings=[];if(state.fuel<26)warnings.push('LOW FUEL');if(state.condition<58)warnings.push('SERVICE ENGINE');if(state.fatigue>70)warnings.push('REST NEEDED');if(state.windshieldDamaged)warnings.push('GLASS DAMAGE');
 $('dashWarnings').replaceChildren();for(const label of warnings.length?warnings:['NO ACTIVE WARNINGS']){const light=document.createElement('span');light.textContent=label;if(!warnings.length)light.className='clear';$('dashWarnings').appendChild(light)}
 $('dashRadio').textContent='RADIO: '+radioStations[state.radioStation||0].name+(soundOn?'':' · SOUND MUTED');
}
$('radioBtn').onclick=()=>{state.radioStation=((state.radioStation||0)+1)%radioStations.length;renderCockpit();if(soundOn)startMusic(currentTheme);$('cockpitNotice').textContent=radioStations[state.radioStation].name+(soundOn?'':' — sound is muted');save()};
let lastHornAt=-Infinity;
$('hornBtn').onclick=()=>{if(performance.now()-lastHornAt<450)return;lastHornAt=performance.now();sfx('horn');$('cockpitNotice').textContent=soundOn?'A short honk.':'Sound is muted.'};
$('dashBtn').onclick=()=>{renderDashboard();$('dashDialog').showModal();$('dashDialog').scrollTop=0};$('dashHotspot').onclick=$('dashBtn').onclick;
function renderTripTimeline(){
 const done=Math.max(0,Math.min(state.distance,state.totalMiles)),left=Math.max(0,state.totalMiles-done),percent=Math.max(0,Math.min(100,done/Math.max(1,state.totalMiles)*100));
 $('tripStart').textContent=cities[state.origin].n;$('tripDestination').textContent=cities[state.dest].n;
 $('tripCovered').textContent=Math.round(done).toLocaleString()+' MI TRAVELED';$('tripRemaining').textContent=Math.ceil(left).toLocaleString()+' MI TO GO';
 $('tripMarker').style.left=percent+'%';$('tripTrack').setAttribute('aria-valuenow',String(Math.round(percent)));$('tripTrack').setAttribute('aria-valuetext',Math.round(done)+' of '+Math.round(state.totalMiles)+' miles completed');
}
$('glassRepairBtn').onclick=()=>{
 if(!state.windshieldDamaged||state.currentEvent||state.cash<45)return;
 state.cash-=45;statSpend(45,'repairsSpent');state.windshieldDamaged=false;state.stats.stops++;advance(.5);
 setRoadScene('mechanic');$('eventTag').textContent='GLASS REPAIR';$('eventTitle').textContent='A CLEAR VIEW AGAIN.';$('eventBody').textContent='The windshield is repaired. Cost: $45. Time: 30 minutes.';renderRoadHud();save();
};
function renderRoadHud(){updateRoadEffects();renderCockpit();renderTripTimeline();$('glassRepairBtn').hidden=!state.windshieldDamaged||!!state.currentEvent;$('glassRepairBtn').disabled=state.cash<45;$('roadDay').textContent=`DAY ${state.day} • ${clockText()}`;$('roadRoute').textContent=`${cities[state.origin].n} → ${cities[state.dest].n}`;$('fuelOut').textContent=Math.round(state.fuel)+'%';$('conditionOut').textContent=Math.round(state.condition)+'%';$('cashOut').textContent=money(state.cash);$('tripProgress').style.width=Math.min(100,state.distance/state.totalMiles*100)+'%';$('fatigueOut').textContent=Math.round(state.fatigue);$('hungerOut').textContent=Math.round(state.hunger);$('moraleOut').textContent=Math.round(state.morale);$('fatigueBar').style.width=state.fatigue+'%';$('hungerBar').style.width=state.hunger+'%';$('moraleBar').style.width=state.morale+'%';$('roadInventory').innerHTML=state.inventory.length?state.inventory.map(id=>`<span class="chip">${supplyDefs.find(x=>x.id===id)?.n||id}</span>`).join(''):'<span class="chip">No supplies</span>';updateRouteInstruction()}

/* trading */
function marketSeed(){return Math.abs(hashString(`${nearestCity().n}|${state.day}|${Math.floor(state.distance/100)}`))}
function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function buildMarket(){const loc=nearestCity(),key=`${loc.n}-${state.day}-${Math.floor(state.distance/100)}`;if(state.currentMarket&&state.lastMarketKey===key)return;const r=seeded(marketSeed()),goods=[...legalGoods].sort(()=>r()-.5).slice(0,5).map(g=>({...g,buy:round25(g.base*(.65+r()*.75)),sell:round25(g.base*(.65+r()*.9)),supply:1+Math.floor(r()*4),demand:1+Math.floor(r()*4)}));const underground=[...undergroundGoods].map(g=>({...g,buy:round25(g.base*(.65+r()*.65)),sell:round25(g.base*(.85+r()*1.15)),supply:1+Math.floor(r()*3),demand:1+Math.floor(r()*3)}));state.currentMarket={loc:loc.n,goods,underground};state.lastMarketKey=key;state.marketVisits++}
function renderTrade(){setArt('tradeScreenArt',state.undergroundUnlocked?'underground':'trade');buildMarket();const mkt=state.currentMarket;$('tradeLocation').textContent=`NEAR ${mkt.loc.toUpperCase()}`;$('tradeCash').textContent=money(state.cash);$('cargoUsed').textContent=`${cargoUsed()} / ${state.car.cargo}`;$('tradeList').innerHTML='';for(const g of mkt.goods){$('tradeList').appendChild(tradeRow(g,false))}$('undergroundPanel').hidden=!state.undergroundUnlocked;if(state.undergroundUnlocked){$('heatBar').style.width=state.heat+'%';$('heatOut').textContent=Math.round(state.heat);$('undergroundList').innerHTML='';for(const g of mkt.underground){$('undergroundList').appendChild(tradeRow(g,true))}}renderContact();save()}
function tradeRow(g,underground){const row=document.createElement('div');row.className='market-row';row.innerHTML=`<div class="market-price"><b>${g.n}</b><span>YOU OWN ${cargoCount(g.id)}</span></div><span>Buy ${money(g.buy)} • Sell ${money(g.sell)} • Supply ${g.supply} • Demand ${g.demand}</span>`;const mini=document.createElement('div');mini.className='mini-actions';const buy=document.createElement('button');buy.type='button';buy.textContent='BUY 1';buy.disabled=g.supply<=0||state.cash<g.buy||cargoUsed()+g.size>state.car.cargo;buy.onclick=()=>{state.cash-=g.buy;statSpend(g.buy,underground?'undergroundSpent':'tradeSpent');state.stats.marketTrades++;g.supply--;addCargo(g.id,1);if(g.gray){state.underworldScore++;state.heat=clamp(state.heat+2);noteHeat()}if(underground){state.heat=clamp(state.heat+rnd(7,13));noteHeat();state.underworldScore+=2}sfx('cash');renderTrade()};const sell=document.createElement('button');sell.type='button';sell.textContent='SELL 1';sell.disabled=g.demand<=0||cargoCount(g.id)<=0;sell.onclick=()=>{state.cash+=g.sell;statEarn(g.sell,underground?'undergroundEarned':'tradeEarned');state.stats.marketTrades++;g.demand--;addCargo(g.id,-1);if(g.gray)state.underworldScore++;if(underground)state.heat=clamp(state.heat+rnd(5,10));noteHeat();sfx('cash');renderTrade()};mini.append(buy,sell);row.appendChild(mini);return row}
function renderContact(){const p=$('contactPanel');p.hidden=true;p.innerHTML='';if(state.undergroundUnlocked)return;if(state.underworldScore>=2){p.hidden=false;p.innerHTML='<b>THE SAME FIRST NAME KEEPS COMING UP.</b><br>A contact offers to show you another market.';const b=document.createElement('button');b.className='btn2';b.type='button';b.textContent='ASK ABOUT WORK';b.onclick=()=>{state.undergroundUnlocked=true;state.heat=clamp(state.heat+5);addLog('You found the underground market.');renderTrade()};p.appendChild(b)}else if(state.marketVisits>=2&&chance(.35)){p.hidden=false;p.innerHTML='A stranger notices you checking prices and asks where you are headed.';const b=document.createElement('button');b.className='btn2';b.type='button';b.textContent='KEEP TALKING';b.onclick=()=>{state.underworldScore++;p.hidden=true;save()};p.appendChild(b)}}


/* trip computer + lifetime records */
function fmt1(n){return Number(n||0).toLocaleString(undefined,{maximumFractionDigits:1})}
function signedMoney(n){n=Math.round(Number(n)||0);return (n<0?'−':n>0?'+':'')+'$'+Math.abs(n).toLocaleString()}
function ledgerRow(label,value){return '<div>'+label+'</div><div class="v">'+value+'</div>'}
function questionableAchievements(){
 const s=ensureTripStats(),a=[];
 if(s.scratchSpent>s.scratchWon)a.push(['FINANCIAL GENIUS',`Lost ${money(s.scratchSpent-s.scratchWon)} on scratch-offs.`]);
 if(s.warningsIgnored>=3)a.push(['CHECK ENGINE MEANS CHECK LATER',`Ignored ${s.warningsIgnored} mechanical warnings.`]);
 if(s.carNights>=2)a.push(['HOME IS WHERE YOU PARK IT',`Slept in the car ${s.carNights} nights.`]);
 if(s.negotiationSaved>=300)a.push(['NEGOTIATOR',`Talked ${money(s.negotiationSaved)} off asking prices.`]);
 if(state.fuel<=5&&state.distance>0)a.push(['GAS LIGHT ENTHUSIAST','Reached the current point of the trip on fumes.']);
 if((s.tradeEarned-s.tradeSpent)>=750)a.push(['THIS WAS SUPPOSED TO BE A MOVE',`Legal/gray trading profit: ${money(s.tradeEarned-s.tradeSpent)}.`]);
 if((s.undergroundEarned-s.undergroundSpent)>=750)a.push(['SIDE HUSTLE GOT COMPLICATED',`Underground profit: ${money(s.undergroundEarned-s.undergroundSpent)}. Peak heat: ${Math.round(s.peakHeat)}.`]);
 if(s.buyersGhosted>=2)a.push(['MARKETPLACE VETERAN',`${s.buyersGhosted} buyers ghosted you before departure.`]);
 if(s.policeStops>=2)a.push(['FAMILIAR FACE',`Stopped by police ${s.policeStops} times.`]);
 if(!a.length)a.push(['STILL TECHNICALLY RESPONSIBLE','No especially questionable milestone has been unlocked yet. Keep driving.']);
 return a;
}
function renderTripCurrent(){
 const s=ensureTripStats(),remain=Math.max(0,state.totalMiles-(state.distance||0)),tradeProfit=s.tradeEarned-s.tradeSpent,ugProfit=s.undergroundEarned-s.undergroundSpent;
 $('tripLogRoute').textContent=(state.car?cities[state.origin]?.n+' → '+cities[state.dest]?.n:'CURRENT RUN');
 $('tripSummaryHero').innerHTML=`<div class="trip-odometer"><small>TRIP ODOMETER</small>${Math.round(s.milesDriven||state.distance||0).toLocaleString()} MI</div><div class="trip-route-line">${escapeHtml(cities[state.origin]?.n||'START')} → ${escapeHtml(cities[state.dest]?.n||'DESTINATION')} • ${Math.round(remain).toLocaleString()} MI REMAINING</div><div class="trip-grid"><div class="trip-card"><b>${fmt1(s.gallonsUsed)} gal</b><span>FUEL USED</span></div><div class="trip-card"><b>${money(s.totalSpent)}</b><span>TOTAL SPENT</span></div><div class="trip-card"><b>${money(state.cash)}</b><span>CASH NOW</span></div><div class="trip-card"><b>${fmt1(s.driveHours)} hr</b><span>DRIVING TIME</span></div></div>`;
 $('tripDetail').innerHTML=`
 <div class="trip-section"><h3>MONEY</h3><div class="trip-ledger">
 ${ledgerRow('Starting cash',money(s.startingCash))}
 ${ledgerRow('Earned / received',money(s.totalEarned))}
 ${ledgerRow('Total spent',money(s.totalSpent))}
 ${ledgerRow('Vehicle purchase',money(s.carSpent))}
 ${ledgerRow('Fuel',money(s.fuelSpent))}
 ${ledgerRow('Repairs / inspections',money(s.repairsSpent))}
 ${ledgerRow('Food',money(s.foodSpent))}
 ${ledgerRow('Motels',money(s.lodgingSpent))}
 ${ledgerRow('Supplies',money(s.suppliesSpent))}
 ${ledgerRow('Tickets / legal',money(s.ticketsSpent))}
 ${ledgerRow('Negotiation savings',money(s.negotiationSaved))}
 ${ledgerRow('Legal/gray trading P&L',signedMoney(tradeProfit))}
 ${ledgerRow('Underground P&L',signedMoney(ugProfit))}
 ${ledgerRow('Scratch-off P&L',signedMoney(s.scratchWon-s.scratchSpent))}
 ${ledgerRow('Debt waiting',money(state.debt))}
 </div></div>
 <div class="trip-section"><h3>VEHICLE & ROAD</h3><div class="trip-ledger">
 ${ledgerRow('Miles driven',Math.round(s.milesDriven||0).toLocaleString()+' mi')}
 ${ledgerRow('Fuel burned',fmt1(s.gallonsUsed)+' gal')}
 ${ledgerRow('Fuel stops',s.fuelStops)}
 ${ledgerRow('Current condition',Math.round(state.condition)+'%')}
 ${ledgerRow('Mechanical warnings ignored',s.warningsIgnored)}
 ${ledgerRow('Police stops',s.policeStops)}
 ${ledgerRow('Peak heat',Math.round(s.peakHeat))}
 ${ledgerRow('Market trades',s.marketTrades)}
 </div></div>
 <div class="trip-section"><h3>LIFE ON THE ROAD</h3><div class="trip-ledger">
 ${ledgerRow('Extra / OT shifts',s.shiftsWorked)}
 ${ledgerRow('Possessions sold',s.possessionsSold)}
 ${ledgerRow('Family help',money(s.familyHelp))}
 ${ledgerRow('Motel nights',s.motelNights)}
 ${ledgerRow('Nights in the car',s.carNights)}
 ${ledgerRow('Meals skipped',s.mealsSkipped)}
 ${ledgerRow('Marketplace ghosts',s.buyersGhosted)}
 </div></div>
 <div class="trip-section"><h3>QUESTIONABLE ACHIEVEMENTS</h3>${questionableAchievements().map(x=>`<div class="achievement"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`;
}
function renderTripLifetime(){
 const l=loadLifetime();
 $('tripLogRoute').textContent='LIFETIME RECORD';
 $('tripSummaryHero').innerHTML=`<div class="trip-odometer"><small>LIFETIME ODOMETER</small>${Math.round(l.totalMiles).toLocaleString()} MI</div><div class="trip-route-line">${l.runs} RUNS • ${l.successes} ARRIVALS • ${l.failures} FAILED JOURNEYS</div><div class="trip-grid"><div class="trip-card"><b>${fmt1(l.totalGallons)} gal</b><span>FUEL BURNED</span></div><div class="trip-card"><b>${money(l.totalSpent)}</b><span>MONEY SPENT</span></div><div class="trip-card"><b>${l.carsBought}</b><span>CARS BOUGHT</span></div><div class="trip-card"><b>${money(l.negotiationSaved)}</b><span>NEGOTIATED OFF</span></div></div>`;
 $('tripDetail').innerHTML=`<div class="trip-section"><h3>CAREER TOTALS</h3><div class="trip-ledger">
 ${ledgerRow('Successful moves',l.successes)}
 ${ledgerRow('Failed moves',l.failures)}
 ${ledgerRow('Total miles',Math.round(l.totalMiles).toLocaleString()+' mi')}
 ${ledgerRow('Fuel burned',fmt1(l.totalGallons)+' gal')}
 ${ledgerRow('Fuel spending',money(l.fuelSpent))}
 ${ledgerRow('Repair spending',money(l.repairsSpent))}
 ${ledgerRow('Motel nights',l.motelNights)}
 ${ledgerRow('Nights in car',l.carNights)}
 ${ledgerRow('Police stops',l.policeStops)}
 ${ledgerRow('Arrests',l.arrests)}
 ${ledgerRow('Scratch-off net',signedMoney(l.scratchNet))}
 ${ledgerRow('Trading profit',signedMoney(l.tradingProfit))}
 ${ledgerRow('Underground profit',signedMoney(l.undergroundProfit))}
 ${ledgerRow('Highest heat',Math.round(l.peakHeat))}
 ${ledgerRow('Furthest failed run',Math.round(l.furthestFailure).toLocaleString()+' mi')}
 ${ledgerRow('Best arrival cash',money(l.bestCashFinish))}
 ${ledgerRow('Debt accumulated',money(l.totalDebt))}
 </div></div>`;
}
function renderTripLog(){ensureTripStats();$('currentTripTab').classList.toggle('active',tripView==='current');$('lifetimeTab').classList.toggle('active',tripView==='lifetime');if(tripView==='lifetime')renderTripLifetime();else renderTripCurrent()}
function openTripLog(view='current',returnTo=currentScreen){tripReturnScreen=returnTo;tripView=view;renderTripLog();show('tripLogScreen')}
function closeTripLog(){if(tripReturnScreen==='endingScreen'){show('endingScreen');return}if(tripReturnScreen==='titleScreen'){show('titleScreen');return}if(tripReturnScreen==='roadScreen'){renderRoadHud();show('roadScreen');return}show(tripReturnScreen||'roadScreen')}

/* endings */
function endGame(kicker,title,body){if(state.ended)return;state.ending={kicker,title,body};state.ended=true;ensureTripStats();state.stats.milesDriven=Math.max(state.stats.milesDriven,state.distance||0);finalizeLifetime(kicker==='YOU MADE IT',kicker);$('endKicker').textContent=kicker;$('endTitle').textContent=title;$('endBody').textContent=body;updateScene();show('endingScreen');sfx(kicker==='YOU MADE IT'?'win':'bad')}

function escapeHtml(s){return String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}

/* bindings */
$('ageRange').oninput=e=>{$('ageOut').textContent=e.target.value;state.age=Number(e.target.value)};
$('newGameBtn').onclick=()=>{startNewLife();try{ensureAudio();startMusic('title')}catch(e){}};$('resumeBtn').onclick=()=>{resume();try{ensureAudio();startMusic(currentTheme)}catch(e){}};$('soundBtn').onclick=toggleSound;$('lifetimeBtn').onclick=()=>openTripLog('lifetime','titleScreen');$('tripLogRoadBtn').onclick=()=>openTripLog('current','roadScreen');$('endTripReportBtn').onclick=()=>openTripLog('current','endingScreen');$('tripBackBtn').onclick=closeTripLog;$('currentTripTab').onclick=()=>{tripView='current';renderTripLog()};$('lifetimeTab').onclick=()=>{tripView='lifetime';renderTripLog()};$('rotateTitleBtn').onclick=rotateAppView;$('rotateRoadBtn').onclick=rotateAppView;
$('randomRouteBtn').onclick=()=>{let a=rnd(0,cities.length-1),b=rnd(0,cities.length-1);while(b===a)b=rnd(0,cities.length-1);$('originSelect').value=a;$('destSelect').value=b};$('beginLifeBtn').onclick=beginLife;
$('openMarketBtn').onclick=openCarMarket;$('prevCarBtn').onclick=()=>{state.carIndex=(state.carIndex+state.listings.length-1)%state.listings.length;renderCarAd()};$('nextCarBtn').onclick=()=>{state.carIndex=(state.carIndex+1)%state.listings.length;renderCarAd()};$('visitSellerBtn').onclick=visitSeller;$('backPrepBtn').onclick=()=>{renderPrep();show('prepScreen')};
$('inspectBtn').onclick=inspectCar;$('testDriveBtn').onclick=testCar;$('mechanicCheckBtn').onclick=mechanicCheck;$('negotiateBtn').onclick=showOffers;$('buyCarBtn').onclick=buyCar;$('walkAwayBtn').onclick=()=>{renderCarAd();show('carMarketScreen')};
$('departBtn').onclick=depart;$('prepAgainBtn').onclick=()=>{renderPrep();show('prepScreen')};$('driveLegBtn').onclick=driveLeg;$('marketStopBtn').onclick=()=>{ensureTripStats();state.stats.stops++;renderTrade();show('tradeScreen')};$('leaveMarketBtn').onclick=()=>{if(state.currentEvent==='fuel')triggerEvent(roadEvents.find(e=>e.id==='fuel'),true);renderRoadHud();show('roadScreen')};$('againBtn').onclick=startNewLife;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false});$('installBtn').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();try{await installPrompt.userChoice}catch(e){}installPrompt=null;$('installBtn').hidden=true};
document.addEventListener('pointerdown',()=>{if(soundOn)ensureAudio()});
document.addEventListener('click',()=>queueMicrotask(save));
window.addEventListener('pagehide',save);
window.LWHLifecycle={pause:()=>{save();document.body.classList.add('paused');clearInterval(musicTimer);musicTimer=null;audioCtx?.suspend()},resume:()=>{document.body.classList.remove('paused');if(soundOn&&audioCtx)audioCtx.resume().then(()=>startMusic(currentTheme))}};
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('paused',document.hidden);if(document.hidden){save();clearInterval(musicTimer);musicTimer=null;audioCtx?.suspend()}else if(soundOn&&audioCtx){audioCtx.resume().then(()=>startMusic(currentTheme))}});



/* Illustrated scenes. Each key is backed by an original production asset. */
function setArt(id,key){const img=$(id);if(!img)return;const src='art/'+key+'.webp';img.dataset.requestedSrc=src;const apply=()=>{if(img.dataset.requestedSrc!==src)return;img.src=src;img.alt=sceneAlt[key]||('Illustrated '+key.replaceAll('-',' ')+' scene');img.closest('.scene')?.setAttribute('data-scene',key);};if(img.getAttribute('src')===src){apply();return;}const next=new Image();next.src=src;next.decode().then(apply).catch(()=>{/* Keep the last valid illustration if loading fails. */})}
const sceneAlt={drive:'The highway through a detailed sedan cockpit.',gas:'A rural fuel station under an overcast sky.',diner:'A hot meal in a roadside diner.',motel:'Neon lights at a roadside motor court.',mechanic:'Tools and an open service bay in a repair shop.',rest:'A quiet interstate picnic shelter.',breakdown:'Steam rises from an engine at the roadside.',arrival:'Moving boxes at a welcoming new home.',failure:'A warning triangle and suitcase on a dark highway.',trade:'Secondhand goods at a small-town market.',underground:'An anonymous barter meeting behind a pawn shop.'};
const eventScenes={fuel:'gas',food:'diner',motel:'motel',repair:'mechanic',restarea:'rest',vending:'rest',overlook:'rest',trucker:'diner',marketcontact:'gas',cargoOffer:'gas',cargoScam:'trade',hail:'gas',battery:'breakdown',heat:'breakdown',tire:'breakdown',alternator:'breakdown',exhaust:'breakdown',windshield:'drive'};
function eventScene(e){return eventScenes[e.id]||'drive'}
function setRoadScene(key){state.scene=key;setArt('roadArt',key);$('sceneCaption').textContent=key==='drive'?'ON THE ROAD / '+state.weather:key.toUpperCase()+' / '+clockText();updateRoadEffects()}
function updateRoadEffects(){const scene=$('roadArt')?.closest('.scene');if(!scene)return;$('windshieldCrack').toggleAttribute('hidden',!state.windshieldDamaged||state.scene!=='drive');if(state.scene==='drive')$('sceneCaption').textContent='ON THE ROAD / '+state.weather;scene.classList.toggle('weather-rain',state.scene==='drive'&&state.weather.includes('RAIN'));scene.classList.toggle('weather-fog',state.scene==='drive'&&state.weather==='FOG');scene.classList.toggle('night',state.scene==='drive'&&isNight());$('fuelNeedle').style.transform='rotate('+(-65+state.fuel*1.3)+'deg)'}
function placeRoadMeters(){const landscape=matchMedia('(orientation:landscape) and (min-width:700px)').matches;const meters=document.querySelector('.compact-road-panel');const column=document.querySelector(landscape?'.road-art-scene':'.road-control-column');if(landscape)column.append(meters);else column.insertBefore(meters,document.querySelector('.road-event'));}
function alignRoadMotion(){const img=$('roadArt'),scene=img.closest('.scene');if(!img.naturalWidth||!scene.clientWidth)return;const scale=Math.max(scene.clientWidth/img.naturalWidth,scene.clientHeight/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;for(const [key,value] of Object.entries({'w':w,'h':h,'x':(scene.clientWidth-w)/2,'y':(scene.clientHeight-h)/2}))scene.style.setProperty('--art-'+key,value+'px');}
$('roadArt').addEventListener('load',alignRoadMotion);
window.addEventListener('resize',()=>{placeRoadMeters();alignRoadMotion()});
function updateScene(){
 placeRoadMeters();
 if(currentScreen==='sellerScreen'&&state.car)setArt('sellerScreenArt','car-'+state.car.id);
 if(currentScreen==='roadScreen')setRoadScene(state.scene||'drive');
 if(currentScreen==='roadScreen')requestAnimationFrame(alignRoadMotion);
 if(currentScreen==='tradeScreen')setArt('tradeScreenArt',state.undergroundUnlocked?'underground':'trade');
 if(currentScreen==='endingScreen')setArt('endingScreenArt',state.ending?.kicker==='YOU MADE IT'?'arrival':'failure');
}
function choiceCost(e,label){if(e.id==='fuel')return label==='KEEP GOING'?0:fuelQuote(state,label==='ADD $20'?20:Infinity).cost;const fixed={motel:{'GET A ROOM':78},food:{'DINER — $22':22,'USE ROAD FOOD':hasItem('food')?0:9},repair:{'FULL REPAIR':300,'CHEAP FIX':95},tire:{'STOP NOW':hasItem('fixflat')?0:85},alternator:{'FIND A PARTS STORE':190}};return fixed[e.id]?.[label]??Number(label.match(/\$(\d+)/)?.[1]||0)}
function restoreSavedCities(){
 if(!state.cityData)return;
 for(const side of ['origin','dest']){
  const city=state.cityData[side];
  if(!city||!Number.isFinite(city.lat)||!Number.isFinite(city.lon))throw new Error('Saved city coordinates are missing.');
  let index=cities.findIndex(c=>c.n===city.n&&c.lat===city.lat&&c.lon===city.lon);
  if(index<0){cities.push(city);index=cities.length-1;}
  state[side]=index;
 }
}
// Keep earlier journeys intact when moving to the fictional vehicle roster.
const legacyCars=[{"oldId":"buick","id":"comfort","oldName":"Buick LeSabre Custom","name":"Comfort V6"},{"oldId":"lincoln","id":"executive","oldName":"Lincoln Town Car Signature","name":"Executive V8"},{"oldId":"altima","id":"sport25","oldName":"Nissan Altima 2.5 S","name":"Sport 2.5"},{"oldId":"camry","id":"family","oldName":"Toyota Camry LE","name":"Family LX"},{"oldId":"bmw","id":"touring","oldName":"BMW 328i","name":"Touring Six"},{"oldId":"crownvic","id":"fleet","oldName":"Ford Crown Victoria LX","name":"Fleet V8"},{"oldId":"focus","id":"compact","oldName":"Ford Focus SE","name":"City Compact"},{"oldId":"impala","id":"highway","oldName":"Chevrolet Impala LS","name":"Highway V6"},{"oldId":"accord","id":"commuter","oldName":"Honda Accord LX","name":"Commuter EX"},{"oldId":"pontiac","id":"sportgt","oldName":"Pontiac Grand Prix GT","name":"Sport GT"}];
function migrateSavedVehicles(){
 const text=value=>typeof value==='string'?legacyCars.reduce((out,c)=>out.split(c.oldName).join(c.name).split(c.oldName.toUpperCase()).join(c.name.toUpperCase()),value).replaceAll('Fix-a-Flat','Tire sealant').replaceAll('FIX-A-FLAT','TIRE SEALANT'):value;
 const car=value=>{if(!value)return value;const legacy=legacyCars.find(c=>c.oldId===value.id);const current=carPool.find(c=>c.id===(legacy?.id||value.id));return current?{...value,id:current.id,n:current.n,ad:current.ad}:value;};
 state.car=car(state.car);state.listings=state.listings.map(car);
 for(const c of legacyCars){if(state.sellers[c.oldId]){state.sellers[c.id]=state.sellers[c.oldId];delete state.sellers[c.oldId];}}
 state.log=state.log.map(text);
 for(const key of ['ending','roadNarrative'])if(state[key])for(const field of Object.keys(state[key]))state[key][field]=text(state[key][field]);
 state.version=4;
}
function resume(){
 try{
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!saved)return;
  state={...blankState(),...saved};ensureTripStats();migrateSavedVehicles();
  restoreSavedCities();
  if(!cities[state.origin]||!cities[state.dest]){throw new Error('This older save is missing its custom city coordinates.');}
  if(state.ended&&state.ending){$('endKicker').textContent=state.ending.kicker;$('endTitle').textContent=state.ending.title;$('endBody').textContent=state.ending.body;show('endingScreen');return;}
  if(state.ended){show('titleScreen');return;}
  if(state.departed||state.car?.boughtPrice&&state.distance>0){state.departed=true;if(state.currentEvent){triggerEvent(roadEvents.find(e=>e.id===state.currentEvent),true)}else{const n=state.roadNarrative;if(n){$('eventTag').textContent=n.tag;$('eventTitle').textContent=n.title;$('eventBody').textContent=n.body}else showQuiet();$('eventChoices').innerHTML='';$('driveLegBtn').hidden=false;}renderRoadHud();show('roadScreen');return;}
  if(state.car?.boughtPrice){renderSupplies();show('supplyScreen');return;}
  if(state.screen==='sellerScreen'&&state.car){visitSeller();return;}
  if(state.screen==='carMarketScreen'&&state.listings.length){renderCarAd();show('carMarketScreen');return;}
  if(state.career&&state.reason&&state.assets.length){renderPrep();show('prepScreen');return;}
  renderSetupCards();show('setupScreen');
 }catch(e){alert('Could not resume this save: '+e.message+' Your saved data has been kept.');}
}

function applyOnlinePreference(){const enabled=$('onlineRoutes').checked;for(const id of ['originCustom','destCustom'])$(id).disabled=!enabled;try{localStorage.setItem('lwh-online',String(enabled))}catch(e){}}
$('onlineRoutes').onchange=applyOnlinePreference;
$('aboutBtn').onclick=()=>{$('aboutDialog').showModal();$('aboutDialog').scrollTop=0;};
function boot(){try{$('onlineRoutes').checked=localStorage.getItem('lwh-online')!=='false'}catch(e){}applyOnlinePreference();try{soundOn=localStorage.getItem('lwh-sound')!=='false'}catch(e){}$('soundBtn').textContent=soundOn?'♪ SOUND ON':'♪ SOUND OFF';initSelects();renderSetupCards();try{if(localStorage.getItem(SAVE_KEY))$('resumeBtn').hidden=false}catch(e){}}
boot();
})();
