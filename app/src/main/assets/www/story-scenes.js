/* Authored scene definitions. Only action handlers mutate a draft state.
 * Describe/choices never draw randomness: reading or reloading cannot reroll.
 */
(function (root, factory) {
  const scenes = factory();
  if (typeof module === 'object' && module.exports) module.exports = scenes;
  else root.LWHStoryScenes = scenes;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const data = s => s.trip.active.data;
  const go = (id, label, node, extra = {}) => ({id, label, ...extra,
    apply: extra.apply || (s => { s.trip.active.node = node; })});
  const end = (id, label, text, extra = {}) => go(id, label, 'done', {...extra,
    apply: (s, c) => { if (extra.effect) extra.effect(s, c); c.finish(typeof text === 'function' ? text(s) : text); }});
  const exit = () => [go('exit', 'Finish this stop', null, {apply: s => { s.trip.active = null; }})];
  function describe(s, entries, art) {
    if (s.trip.active.node === 'done') return {title: 'THE STOP IS OVER.', body: s.trip.lastResult.text, art};
    const entry = entries[s.trip.active.node];
    if (!entry) throw new Error('Unknown scene node: ' + s.trip.active.node);
    const [title, body] = typeof entry === 'function' ? entry(s) : entry;
    return {title, body, art, ...(art === 'diner' && s.trip.active.node === 'waiting' ? {lines: waitingLines(s)} : {})};
  }
  const mealOptions = [
    {id: 'soup', label: 'Soup and bread', price: 1200, relief: 30},
    {id: 'breakfast', label: 'All-day breakfast', price: 2200, relief: 55},
    {id: 'coffee', label: 'Coffee and toast', price: 500, relief: 14}
  ];
  function waitChoice(id, label, talk) {
    return go(id, label, 'ready', {minutes: 12, apply: (s, c) => {
      if (talk) c.npc('diner.marnie', 2);
      const result = c.weighted([
        {id: 'ready', weight: talk ? 65 : 75},
        {id: 'outage', weight: 8},
        {id: 'wrong', weight: 10},
        {id: 'stranger', weight: talk ? 17 : 7}
      ]);
      data(s).interruption = result;
      s.trip.active.node = result;
    }});
  }
  function waitingLines(s) {
    const lines = [{speaker: 'SOUND', text: '[Dishes clatter. The griddle hisses. A chair scrapes.]'},
      {speaker: 'MARNIE', text: '“Order is in. Make yourself comfortable.”'}];
    if (data(s).overheard === 'parts') lines.push({speaker: 'NEXT BOOTH', text: '“I told him it was a parts car.”'}, {speaker: 'OTHER MAN', text: '“Then why did he drive it here?”'});
    else if (data(s).overheard === 'boat') lines.push({speaker: 'MAN AT THE COUNTER', text: '“Technically, anything is a boat once.”'});
    else lines.push({speaker: 'SCENE', text: 'The other conversations remain somebody else’s business.'});
    lines.push({speaker: 'SCENE', text: 'You can engage or simply wait. Reading takes no game time.'});
    return lines;
  }
  const diner = {
    start(s, c) { Object.assign(data(s), {billCents: 0, meal: null, interruption: null, eaten: false,
      overheard: c.weighted([{id: 'parts', weight: 35}, {id: 'boat', weight: 25}, {id: 'quiet', weight: 40}])}); },
    describe(s) { return describe(s, {
      arrival: ['THE DINER IS OPEN.', 'A neon sign promises hot food. The smaller sign says the first sign is not a promise. You can stop, or keep your money and leave.'],
      seat: ['WHERE ARE YOU SITTING?', 'Marnie waves you toward the counter. There is also a booth with a permanent impression of someone else’s ass.'],
      menu: ['ORDER SOMETHING.', 'Prices are shown before you commit. The meal money is set aside now; you pay after eating.'],
      waiting: s => ['THE KITCHEN HAS YOUR ORDER.', waitingLines(s).map(x => x.speaker + ': ' + x.text).join('\n\n')],
      conversation: s => ['THE NEXT BOOTH NOTICES YOU.', data(s).overheard === 'parts'
        ? 'MAN: “Sold him a parts car.”\n\nOTHER MAN: “He drove it here.”\n\nMAN: “Apparently he needed all the parts at once.”\n\nMARNIE: “Your food is almost ready. Do not buy a car before lunch.”'
        : 'LEON: “It was advertised as a houseboat.”\n\nYOU: “Was it a boat?”\n\nLEON: “The seller preferred not to get caught up in labels.”\n\n[The griddle keeps sizzling.]'],
      ready: s => ['FOOD, AT LAST.', 'Your ' + data(s).meal.label.toLowerCase() + ' arrives. The plate is warm. For once, this seems intentional.'],
      wrong: ['THIS IS NOT YOUR BREAKFAST.', 'Marnie has delivered the neighboring booth’s order. It looks perfectly edible. The neighboring booth looks offended.'],
      outage: ['THE LIGHTS GO OUT.', 'The cook says the generator will take a while. Marnie offers your food cold for four dollars less, or a cancellation.'],
      stranger: ['A STRANGER ROTATES ON HIS STOOL.', '“You heading far?” His jacket says LEON. The smaller patch says ASK ME ABOUT MY BOAT. There is no boat in sight.'],
      pay: s => ['THE BILL ARRIVES.', 'You ate your ' + data(s).meal.label.toLowerCase() + '. Marnie slides the bill over. Your reserved meal money covers it.']
    }, 'diner'); },
    choices(s) {
      switch (s.trip.active.node) {
        case 'arrival': return [go('enter', 'Go inside', 'seat', {minutes: 2}), end('leave', 'Keep driving', 'You leave before the coffee can establish a relationship.')];
        case 'seat': return [go('counter', 'Take a seat at the counter', 'menu', {apply: (s, c) => { data(s).seat = 'counter'; c.npc('diner.marnie'); s.trip.active.node = 'menu'; }}), go('booth', 'Take the booth', 'menu', {apply: (s, c) => { data(s).seat = 'booth'; c.npc('diner.marnie'); s.trip.active.node = 'menu'; }})];
        case 'menu': return [...mealOptions.map(meal => go(meal.id, meal.label, 'waiting', {reserveCents: meal.price,
          apply: s => { data(s).meal = {...meal}; s.trip.active.node = 'waiting'; }})), end('leave', 'Leave without ordering', 'You decide not to eat here.')];
        case 'waiting': return [waitChoice('wait', 'Mind your business and wait for food', false),
          go('engage', 'Ask the next booth about what you overheard', 'conversation', {minutes: 3, when: s => ['parts','boat'].includes(data(s).overheard)}),
          waitChoice('chat', 'Chat with Marnie', true),
          go('placemat', 'Read the local attractions placemat', 'ready', {minutes: 12, apply: s => { s.world.flags.sawGiantSpoonAd = true; data(s).interruption = 'placemat'; s.trip.active.node = 'ready'; }}),
          end('cancel', 'Cancel the order and leave', 'The order is cancelled before serving. No charge.', {effect: s => { data(s).billCents = 0; }})];
        case 'conversation': return [go('talk_car', 'Ask what happened before the car stopped', 'ready', {minutes: 12, when: s => data(s).overheard === 'parts' && s.trip.skills.repair > 0, apply: (s, c) => { c.npc('diner.parts-owner', 2); s.world.flags.partsOwnerMet = true; s.trip.active.node = 'ready'; }}),
          go('listen_story', 'Listen to the rest while your food cooks', 'ready', {minutes: 12, apply: (s, c) => { c.npc(data(s).overheard === 'boat' ? 'leon' : 'diner.parts-owner', 1); s.trip.active.node = 'ready'; }}),
          go('excuse', 'Excuse yourself and return to your meal', 'ready', {minutes: 12})];
        case 'wrong': return [go('correct_order', 'Wait for your own order', 'ready', {minutes: 10}), go('accept_plate', 'Keep the plate; pay the original price', 'ready', {apply: s => { data(s).meal = {...data(s).meal, label: 'accidental breakfast'}; s.trip.active.node = 'ready'; }})];
        case 'outage': return [go('cold', 'Take it cold — $4 off', 'ready', {apply: s => { data(s).billCents = Math.max(0, data(s).billCents - 400); s.trip.active.node = 'ready'; }}), go('generator', 'Wait for the generator', 'ready', {minutes: 25}), end('cancel', 'Cancel and leave without paying', 'No food, no bill. You return to the car.', {effect: s => { data(s).billCents = 0; }})];
        case 'stranger': return [go('listen', 'Ask about Leon’s road stories', 'ready', {minutes: 5, apply: (s, c) => { c.npc('leon', 2); s.world.flags.metLeon = true; s.trip.active.node = 'ready'; }}), go('decline', 'Politely return to your coffee', 'ready')];
        case 'ready': return [go('eat', 'Eat your meal', 'pay', {minutes: 10, apply: (s, c) => { s.trip.hunger = c.clamp(s.trip.hunger - data(s).meal.relief); s.trip.morale = c.clamp(s.trip.morale + 4); data(s).eaten = true; s.trip.active.node = 'pay'; }})];
        case 'pay': return [end('pay', 'Pay the bill', 'Fed, paid up, and back at the car.', {costCents: s => data(s).billCents, settlesBill: true, minutes: 2}),
          end('tip', 'Pay the bill and leave a $3 tip', 'Marnie thanks you. It is a small thing, but it was your choice.', {costCents: s => data(s).billCents + 300, settlesBill: true, minutes: 2, effect: (s, c) => c.npc('diner.marnie', 3)})];
        case 'done': return exit();
        default: throw new Error('Unknown diner node');
      }
    }
  };
  const vehicleBias = {comfort: .04, executive: -.02, sport25: -.05, family: .06, touring: -.10, fleet: .02, compact: .02, highway: -.02, commuter: .05, sportgt: -.04};
  function repairChance(s) {
    return Math.max(.2, Math.min(.93, .66 + s.trip.skills.repair * .10 + (vehicleBias[s.trip.vehicle.id] || 0) - s.trip.fatigue * .0015 - (100 - s.trip.vehicle.condition) * .001));
  }
  function repaired(s, c, temporary = false) {
    s.trip.vehicle.faults = s.trip.vehicle.faults.filter(x => x !== 'tire');
    s.trip.vehicle.condition = c.clamp(s.trip.vehicle.condition + 3);
    if (temporary && !s.trip.vehicle.temporaryRepairs.includes('tire')) s.trip.vehicle.temporaryRepairs.push('tire');
    if (!temporary) s.trip.vehicle.temporaryRepairs = s.trip.vehicle.temporaryRepairs.filter(x => x !== 'tire');
  }
  function assistance() {
    return end('assistance', 'Call roadside assistance', 'The tire is repaired. The receipt is considerably less cheerful.', {costCents: 8500, minutes: 90, effect: (s, c) => repaired(s, c)});
  }
  function help() {
    return end('wait_help', 'Stay parked and wait for help', 'Leon stops with a usable spare and the right equipment. You lose two hours, not the trip. You owe him a favor.', {minutes: 120, effect: (s, c) => { c.npc('leon', 2); s.world.flags.oweRoadsideFavor = true; repaired(s, c); }});
  }
  function sealant() {
    return go('sealant', 'Use your tire sealant — one use', 'complication', {requires: ['fixflat'], minutes: 15, apply: (s, c) => {
      c.consume('fixflat'); data(s).attempts++;
      if (c.random() < .82) { repaired(s, c, true); c.finish('The sealant holds for now. This is a temporary patch, not a new tire.'); }
      else { data(s).complication = 'sealant_failed'; s.trip.active.node = 'complication'; }
    }});
  }
  const causeText = {nail: 'A roofing nail. Somewhere, a roof is having a better trip than you.', glass: 'A piece of glass. The road has been drinking.', screw: 'An impressive screw, installed by nobody you hired.', carrot: 'A baby carrot. It is lodged in your tire. You inspect it again. Still a baby carrot.'};
  const complicationText = {
    socket: 'The toolkit has eight sockets. None of them is the one you need. A general store is within walking distance.',
    spare: 'Your spare tire is also flat. It has been quietly waiting for this opportunity.',
    lug: 'One lug refuses to cooperate. You still have your tools, but another attempt will cost time and effort.',
    knuckle: 'You scrape your knuckles and drop the tool. The tire remains committed to being flat. Health -5.',
    sealant_failed: 'The sealant does not hold. The can is empty. You need another plan.'
  };
  const repair = {
    start(s, c) {
      Object.assign(data(s), {attempts: 0, complication: null, cause: c.weighted([{id: 'nail', weight: 50}, {id: 'glass', weight: 25}, {id: 'screw', weight: 20}, {id: 'carrot', weight: 5}])});
      if (!s.trip.vehicle.faults.includes('tire')) { s.trip.vehicle.faults.push('tire'); s.trip.vehicle.condition = c.clamp(s.trip.vehicle.condition - 3); }
    },
    describe(s) { return describe(s, {
      arrival: ['THUMP. THUMP. THUMP.', s.trip.vehicle.name + ' has a flat tire. You are parked off the road. You decide what to do next.'],
      diagnosis: ['YOU FOUND THE PROBLEM.', causeText[data(s).cause] + '\n\n' + (s.trip.inventory.includes('toolkit') ? 'The toolkit you packed makes a repair attempt available.' : 'You did not pack a toolkit. Walking for supplies or waiting for help are still options.')],
      work: ['TOOLS OUT. CONFIDENCE VARIABLE.', 'Attempting the repair will use thirty minutes and add some fatigue. Your skill, this vehicle, and its condition affect the result. No outcome is rolled until you commit.'],
      complication: ['THE REPAIR HAS DEVELOPED A SUBPLOT.', complicationText[data(s).complication]],
      store: ['A GENERAL STORE WITH A GAS PUMP.', 'You leave the car parked and walk here. The clerk has supplies, a phone, and opinions about your vehicle. You do not have to buy anything.']
    }, 'breakdown'); },
    choices(s) {
      const d = data(s);
      switch (s.trip.active.node) {
        case 'arrival': return [go('inspect', 'Get out and inspect the tire', 'diagnosis', {minutes: 5}), assistance(), help()];
        case 'diagnosis': return [go('tools', 'Get the toolkit and attempt a repair', 'work', {requires: ['toolkit'], when: s => data(s).attempts < 2 && !['socket', 'spare'].includes(data(s).complication)}), sealant(), go('walk', 'Walk to the general store', 'store', {minutes: 45}), assistance(), help()];
        case 'work': return [go('attempt', 'Commit to the repair attempt', 'complication', {minutes: 30, requires: ['toolkit'], apply: (s, c) => {
          const probability = repairChance(s); data(s).attempts++;
          s.trip.fatigue = c.clamp(s.trip.fatigue + 5);
          data(s).lastChance = probability;
          if (c.random() < probability) { repaired(s, c); c.finish('The repair works. You pack the tools and return to the road. Nothing else has to go wrong.'); }
          else {
            const heavy = ['executive', 'fleet'].includes(s.trip.vehicle.id);
            data(s).complication = c.weighted([{id: 'socket', weight: 25}, {id: 'spare', weight: heavy ? 35 : 20}, {id: 'lug', weight: 40}, {id: 'knuckle', weight: 15}]);
            if (data(s).complication === 'knuckle') s.trip.health = c.clamp(s.trip.health - 5);
            s.trip.active.node = 'complication';
          }
        }}), go('reconsider', 'Put the tools away and reconsider', 'diagnosis')];
        case 'complication': return [go('retry', 'Try once more with your tools', 'work', {requires: ['toolkit'], when: s => data(s).attempts < 2 && ['lug', 'knuckle'].includes(data(s).complication)}), sealant(), go('walk', 'Walk to the store for another plan', 'store', {minutes: 45}), assistance(), help()];
        case 'store': return [go('socket', 'Buy the missing socket and return', 'diagnosis', {costCents: 1200, minutes: 45, requires: ['toolkit'], when: s => data(s).complication === 'socket' && data(s).attempts < 2, apply: s => { data(s).complication = null; s.trip.active.node = 'diagnosis'; }}),
          go('buy_sealant', 'Buy tire sealant and return', 'diagnosis', {costCents: 1300, minutes: 45, when: s => !s.trip.inventory.includes('fixflat'), apply: s => { s.trip.inventory.push('fixflat'); s.trip.active.node = 'diagnosis'; }}),
          end('clerk_help', 'Ask the clerk to arrange help', 'The clerk calls Leon. He gives you a ride back and helps with the tire. The favor is remembered; your wallet survives.', {minutes: 120, effect: (s, c) => { c.npc('store.clerk', 1); c.npc('leon', 2); s.world.flags.oweRoadsideFavor = true; repaired(s, c); }}),
          go('return', 'Walk back without buying anything', 'diagnosis', {minutes: 45})];
        case 'done': return exit();
        default: throw new Error('Unknown repair node');
      }
    },
    repairChance
  };
  return Object.freeze({diner, repair});
});
