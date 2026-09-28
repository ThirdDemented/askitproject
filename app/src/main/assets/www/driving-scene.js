/* Illustrated depth layers share the source's coordinate system. No canvas,
   random timers, location requests or game-state mutations live in this view. */
const DrivingScene=(()=>{
 function region(p){
  if(p.lon < -103 && p.lat < 39)return {key:'drive-desert',name:'HIGH DESERT'};
  if(p.lon < -113 && p.lat >= 42 || p.lon > -85 || p.lat > 46)return {key:'drive-forest',name:'WOODED HIGHWAY'};
  return {key:'drive',name:'OPEN COUNTRY'};
 }
 function mount(scene){
  if(scene.querySelector('.driving-world'))return;
  const world=document.createElement('div');world.className='driving-world';world.setAttribute('aria-hidden','true');
  world.innerHTML='<div class="sky-layer"><i></i></div><div class="scenery-layer scenery-left"><i></i><i></i></div><div class="scenery-layer scenery-right"><i></i><i></i></div><div class="traffic-layer"><img src="art/traffic-front.webp" alt=""></div>';
  scene.insertBefore(world,scene.querySelector('.road-motion'));
  const instruments=document.createElement('div');instruments.className='live-instruments';instruments.setAttribute('aria-hidden','true');
  instruments.innerHTML=`<svg viewBox="0 0 1536 1024"><g class="live-dial"><circle cx="389" cy="655" r="55"/><path d="M347 680l7-5m-13-24h9m2-29l8 5m29-22v9m29 8l-8 5m17 24h9m-10 29l-7-5"/><text x="389" y="635">FUEL</text><text x="351" y="681">E</text><text x="425" y="681">F</text><path class="live-fuel-needle" d="M389 655v-36"/><circle class="dial-hub" cx="389" cy="655" r="5"/></g><g class="live-dial"><circle cx="526" cy="655" r="59"/><path d="M481 683l7-5m-14-26h9m2-30l8 5m33-25v9m31 11l-8 5m18 25h10m-15 31l-7-5"/><text x="526" y="635">MPH</text><text class="live-speed" x="526" y="688">60</text><path class="live-speed-needle" d="M526 655v-39"/><circle class="dial-hub" cx="526" cy="655" r="5"/></g><g class="radio-display"><rect x="903" y="716" width="103" height="22"/><path d="M913 733v-8m8 8v-12m8 12v-5m8 5v-10m8 10v-7"/><text x="979" y="731">FM</text></g><g class="engine-lamp"><rect x="449" y="597" width="21" height="12"/></g></svg>`;
  scene.insertBefore(instruments,scene.querySelector('.dash-hotspot'));
 }
 function artwork(scene,key,src){
  if(!key.startsWith('drive'))return;
  mount(scene);scene.style.setProperty('--scenery-art',`url("${src}")`);
  scene.querySelectorAll('.road-motion img').forEach(i=>{if(i.getAttribute('src')!==src)i.src=src});
 }
 function update(scene,s){
  mount(scene);
  // Choosing an event stops forward travel; cloud/weather motion can continue.
  const stopped=!!s.currentEvent||s.ended||s.fuel<=0||s.condition<=0;
  scene.classList.toggle('travel-stopped',stopped);
  scene.classList.toggle('radio-playing',s.radioPlaying);
  scene.classList.toggle('engine-warning',s.condition<58);
  scene.classList.toggle('fuel-warning',s.fuel<26);
  scene.style.setProperty('--live-fuel-angle',(-125+Math.max(0,Math.min(100,s.fuel))*2.5)+'deg');
  scene.style.setProperty('--live-speed-angle',stopped?'-125deg':'0deg');
  scene.querySelector('.live-speed').textContent=stopped?'0':'60';
 }
 return {region,artwork,update};
})();
