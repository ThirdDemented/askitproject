/* Controlled fuel arithmetic across the complete vehicle roster. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app/src/main/assets/www/game.js','utf8');
const start=source.indexOf('/* Fuel is priced per gallon;');
const end=source.indexOf('/* road events */',start);
const sandbox={clamp:n=>Math.max(0,Math.min(100,n)),statSpend:(amount)=>sandbox.spent+=amount,spent:0};
vm.createContext(sandbox);
vm.runInContext(source.slice(start,end)+';this.quote=fuelQuote;this.buy=purchaseFuel;this.description=fuelStopDescription;this.label=fuelChoiceLabel;',sandbox);
const cars=[...source.matchAll(/mpg:(\d+),tank:(\d+)/g)].map(m=>({mpg:+m[1],tank:+m[2]}));
assert.equal(cars.length,10);
let checks=0;
for(const car of cars){
 for(const level of [0,10,25,41,85,99.99,100]){
  const s={car,fuel:level,cash:1000,distance:200,totalMiles:1200,stats:{fuelStops:0}};
  const q=sandbox.quote(s);const oldCash=s.cash;sandbox.buy(s);
  assert(Math.abs(s.fuel-100)<1e-8);assert(Math.abs(oldCash-s.cash-q.cost)<1e-8);
  assert(q.gallons<=car.tank+1e-8);assert.equal(q.full,true);checks++;
 }
 const s={car,fuel:0,cash:5,distance:100,totalMiles:1000,pendingLegMiles:62,stats:{fuelStops:0}};
 const q=sandbox.quote(s);assert.equal(q.cost,5);assert.equal(q.gallons,1.25);
 assert.equal(q.full,false);assert(sandbox.description(s).includes('WARNING'));
 assert(sandbox.label(s,'FILL TANK').startsWith('PARTIAL REFILL'));
 sandbox.buy(s);assert.equal(s.cash,0);assert.equal(s.stats.fuelStops,1);
 assert(Math.abs(s.fuel/100*car.tank-1.25)<1e-8);checks++;
 const near={car,fuel:98,cash:100,distance:0,totalMiles:100,stats:{fuelStops:0}};
 const capped=sandbox.quote(near,20);assert(capped.cost<20);sandbox.buy(near,20);assert.equal(near.fuel,100);checks++;
 const empty={car,fuel:12,cash:0,distance:0,totalMiles:100,stats:{fuelStops:0}};
 sandbox.buy(empty);assert.equal(empty.fuel,12);assert.equal(empty.stats.fuelStops,0);checks++;
}
console.log(`${checks} controlled fuel checks passed across ${cars.length} cars`);
