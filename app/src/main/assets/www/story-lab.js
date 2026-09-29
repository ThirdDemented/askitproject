/* Developer harness. Deliberately isolated from the main journey UI/save. */
(() => {
  'use strict';
  const E = LWHStoryEngine, scenes = LWHStoryScenes, $ = id => document.getElementById(id);
  const names = {comfort: 'Comfort V6', touring: 'Touring Six', fleet: 'Fleet V8'};
  const cash = cents => '$' + (cents / 100).toFixed(2);
  let state = null;
  function error(e) { $('error').textContent = e.message || String(e); $('error').hidden = false; }
  function commit(next) {
    // Persist the entire transaction before displaying its result.
    // A storage failure does not consume money, tools, or the next random roll.
    localStorage.setItem(E.STORAGE_KEY, E.serialize(next));
    state = next; $('error').hidden = true; render();
  }
  function render() {
    if (!state) {
      $('hub').hidden = false; $('scene').hidden = true;
      for (const id of ['diner', 'repair', 'memory']) $(id).disabled = true;
      return;
    }
    for (const id of ['diner', 'repair', 'memory']) $(id).disabled = false;
    const t = state.trip, bill = t.active?.data.billCents || 0;
    $('hud').replaceChildren();
    const values = ['Cash ' + cash(t.cashCents), 'Reserved ' + cash(bill), 'Time used ' + t.minutes + ' min',
      'Hunger ' + Math.round(t.hunger), 'Fatigue ' + Math.round(t.fatigue), 'Health ' + Math.round(t.health),
      'Tools: ' + (t.inventory.includes('toolkit') ? 'yes' : 'no'), 'Tire: ' + (t.vehicle.faults.includes('tire') ? 'FLAT' : t.vehicle.temporaryRepairs.includes('tire') ? 'PATCHED' : 'OK')];
    $('hud').replaceChildren();
    for (const value of values) { const el = document.createElement('span'); el.textContent = value; $('hud').append(el); }
    $('memory').checked = state.player.rememberChoices;
    $('trace').textContent = JSON.stringify({revision: state.revision, rng: state.rng, active: t.active, world: state.world,
      player: state.player, dropped: state.droppedJournalEntries, journal: state.journal.slice(-30)}, null, 2);
    const v = E.view(state, scenes);
    $('hub').hidden = Boolean(v); $('scene').hidden = !v;
    $('lastResult').textContent = t.lastResult?.text || 'Pick a place. Make choices. Interruptions are possible, not mandatory.';
    $('diner').disabled = $('repair').disabled = t.status !== 'active';
    if (!v) return;
    $('sceneLabel').textContent = v.scene === 'diner' ? 'THE DINER' : 'ROADSIDE REPAIR';
    $('stage').textContent = v.scene + ' / ' + v.node;
    $('title').textContent = v.title; $('body').textContent = v.body;
    $('art').src = 'art/' + v.art + '.webp'; $('art').alt = v.scene === 'diner' ? 'A meal inside a roadside diner' : 'A disabled car at the roadside';
    $('choices').replaceChildren();
    for (const choice of v.choices) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.choice = choice.id;
      b.disabled = !choice.enabled; b.textContent = choice.label;
      const details = [];
      if (choice.minutes) details.push(choice.minutes + ' game minutes');
      if (choice.costCents) details.push(cash(choice.costCents));
      if (choice.reserveCents) details.push(cash(choice.reserveCents) + ' reserved; pay after eating');
      if (!choice.enabled) details.push(choice.reason);
      if (details.length) { const small = document.createElement('small'); small.textContent = details.join(' · '); b.append(small); }
      b.onclick = () => {
        b.disabled = true;
        try { commit(E.choose(state, {interactionId: v.interactionId, revision: v.revision, choiceId: choice.id}, scenes)); $('title').focus({preventScroll: true}); }
        catch (e) { error(e); render(); }
      };
      $('choices').append(b);
    }
  }
  $('new').onclick = () => {
    if (state?.trip.active && !confirm('Replace this test trip? Your original game save is unaffected.')) return;
    try {
      const options = {seed: Number($('seed').value), cashCents: Math.round(Number($('cash').value) * 100),
        career: $('career').value, inventory: [$('toolkit').checked ? 'toolkit' : null, $('sealant').checked ? 'fixflat' : null].filter(Boolean),
        vehicle: {id: $('vehicle').value, name: names[$('vehicle').value], condition: 75}};
      commit(state ? E.newTrip(state, options) : E.create(options));
    } catch (e) { error(e); }
  };
  for (const id of ['diner', 'repair']) $(id).onclick = () => { try { commit(E.begin(state, id, scenes)); } catch (e) { error(e); } };
  $('memory').onchange = () => { try { commit(E.memory(state, $('memory').checked)); } catch (e) { error(e); render(); } };
  $('import').onclick = () => {
    if (state?.trip.active && !confirm('Replace this lab trip with a copy of your original journey?')) return;
    try {
      const raw = localStorage.getItem('lwh-rc1-save');
      if (!raw) throw new Error('No build #104 save in this browser. Use the test-trip controls instead.');
      commit(E.importLegacy(raw));
    } catch (e) { error(e); }
  };
  try {
    const raw = localStorage.getItem(E.STORAGE_KEY);
    if (raw) state = E.deserialize(raw, scenes);
    else commit(E.create({seed: 7531, inventory: ['toolkit']}));
  } catch (e) { state = null; error(e); }
  render();
})();
