/* Journey adapter: one snapshot contains the encounter AND every resource delta.
 * No DOM, storage, clock, or RNG globals. Preserves all unrelated v4 save fields.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./story-engine.js'), require('./story-scenes.js'));
  else root.LWHStoryBridge = factory(root.LWHStoryEngine, root.LWHStoryScenes);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E, scenes) {
  'use strict';
  const VERSION = 1, BACKUP_KEY = 'lwh-before-story-v4', clone = x => JSON.parse(JSON.stringify(x));
  const cents = x => Math.round(x * 100);
  const events = {diner: 'food', repair: 'tire', callback: 'story_callback', discovery: 'luck'};
  function validateJourney(j) {
    if (!j || j.version !== 4 || !j.car || !j.departed || j.ended) throw new Error('A current driving journey is required.');
    if (j.storyIntegrationVersion !== undefined && j.storyIntegrationVersion !== VERSION) throw new Error('Unsupported interaction save; your data has been kept.');
    if (!Number.isFinite(j.cash) || j.cash < 0 || !Number.isFinite(j.days) || !j.stats) throw new Error('Invalid journey resources.');
    if (j.story) { E.validate(j.story); if (j.story.trip.active) E.view(j.story, scenes); }
  }
  function resources(j, s) {
    const t = s.trip;
    t.cashCents = cents(j.cash); t.hunger = j.hunger; t.fatigue = j.fatigue; t.morale = j.morale;
    t.health = j.health ?? 100; t.career = j.career?.id || 'traveler';
    t.skills.repair = j.career?.skill === 'repair' || t.career === 'mechanic' ? 2 : 0;
    t.inventory = [...j.inventory]; t.experience = 2; t.distance = j.distance; t.location = j.storyLocation || t.location;
    t.vehicle = {...t.vehicle, id: j.car.id, name: j.car.n, condition: j.condition, purchaseKey: String(j.car.boughtPrice || 0),
      faults: [...(j.vehicleFaults || [])], temporaryRepairs: [...(j.temporaryRepairs || [])]};
    // The main journey owns the exact fractional deadline. Ceil prevents an
    // integer-minute scene snapshot from ending a trip early; outer checks agree.
    t.remainingMinutes = j.reason?.hard ? Math.ceil(j.days * 1440) : null;
    return s;
  }
  function project(j, before, after, category) {
    const next = clone(j), a = after.trip, b = before.trip;
    const spent = a.spentCents - b.spentCents, earned = (a.earnedCents || 0) - (b.earnedCents || 0), elapsed = a.minutes - b.minutes;
    if (spent < 0 || earned < 0 || elapsed < 0 || !Number.isSafeInteger(spent) || !Number.isSafeInteger(earned) || !Number.isSafeInteger(elapsed)) throw new Error('Invalid encounter transaction.');
    if (cents(j.cash) !== b.cashCents) throw new Error('Journey resources changed during this encounter. Reopen the saved journey.');
    next.cash = a.cashCents / 100;
    next.stats.totalEarned = Math.round(((next.stats.totalEarned || 0) + earned / 100) * 100) / 100;
    if (earned) next.stats.storyEarned = Math.round(((next.stats.storyEarned || 0) + earned / 100) * 100) / 100;
    next.stats.totalSpent = Math.round(((next.stats.totalSpent || 0) + spent / 100) * 100) / 100;
    if (spent) next.stats[category] = Math.round(((next.stats[category] || 0) + spent / 100) * 100) / 100;
    next.stats.stopMinutes = (next.stats.stopMinutes || 0) + elapsed;
    next.hour += elapsed / 60; next.days -= elapsed / 1440;
    while (next.hour >= 24) { next.hour -= 24; next.day++; }
    next.health = a.health; next.hunger = a.hunger; next.fatigue = a.fatigue; next.morale = a.morale;
    next.condition = a.vehicle.condition; next.inventory = [...a.inventory];
    next.vehicleFaults = [...a.vehicle.faults]; next.temporaryRepairs = [...a.vehicle.temporaryRepairs];
    next.story = after; next.storyIntegrationVersion = VERSION;
    return next;
  }
  function describe(story) { return E.view(story, scenes); }
  function addTranscript(j, entry) {
    j.storyTranscript = [...(j.storyTranscript || []), entry].slice(-80);
  }
  function narrate(j) {
    const v = describe(j.story);
    if (v) {
      j.roadNarrative = {tag: v.scene === 'diner' ? 'DINER' : 'ROADSIDE REPAIR', title: v.title, body: v.body};
      const lines = v.lines || [{speaker: 'SCENE', text: v.body}];
      for (const line of lines) addTranscript(j, line);
      j.scene = v.art;
    } else {
      const text = j.story.trip.lastResult?.text || 'You return to your journey.';
      j.currentEvent = null;
      j.roadNarrative = {tag: 'CONTINUE', title: 'BACK AT THE CAR.', body: text};
      j.log = [text, ...(j.log || [])].slice(0, 24);
    }
  }
  function begin(journey, kind, options = {}) {
    validateJourney(journey);
    if (!events[kind]) throw new Error('Unknown interaction.');
    if (journey.story?.trip.active) throw new Error('Finish the current stop first.');
    if (journey.currentEvent && journey.currentEvent !== events[kind]) throw new Error('Resolve the current road event before stopping here.');
    let before = journey.story ? E.migrate(journey.story) : E.create({seed: options.seed ?? E.hash(JSON.stringify(journey))});
    const source = options.location ? {...journey, storyLocation: options.location} : journey;
    before = resources(source, before);
    // The integration currently remembers this character's choices only. The
    // separate cross-run Meta Director/profile has not shipped in this slice.
    before.player.rememberChoices = false; before.player.actions = {};
    const after = E.begin(before, kind, scenes);
    let next = project(journey, before, after, kind === 'diner' ? 'foodSpent' : 'repairsSpent');
    if (!journey.currentEvent) {
      if (kind === 'diner') next.stats.stops = (next.stats.stops || 0) + 1;
      else if (kind === 'repair') next.stats.breakdowns = (next.stats.breakdowns || 0) + 1;
    }
    next.storyLocation = before.trip.location;
    next.currentEvent = events[kind]; next.storyTranscript = []; next.storyLastKind = kind;
    next.screen = 'roadScreen'; narrate(next);
    return next;
  }
  function choose(journey, token) {
    validateJourney(journey);
    const before = journey.story;
    if (!before?.trip.active) throw new Error('There is no active encounter.');
    const kind = before.trip.active.scene;
    const v = describe(before), action = v.choices.find(a => a.id === token.choiceId);
    const after = E.choose(before, token, scenes);
    const category = token.choiceId === 'buy_sealant' || token.choiceId === 'socket' ? 'suppliesSpent' : kind === 'diner' ? 'foodSpent' : 'repairsSpent';
    const next = project(journey, before, after, category);
    if (action) addTranscript(next, {speaker: 'YOU', text: action.label});
    narrate(next);
    return next;
  }
  function validateSaved(journey) {
    if (!journey?.story) return;
    if (journey.storyIntegrationVersion !== VERSION) throw new Error('Unsupported encounter save.');
    const story = E.migrate(journey.story);
    E.validate(story);
    if (story.trip.active) {
      const kind = journey.story.trip.active.scene;
      if (journey.currentEvent !== events[kind] || journey.ended) throw new Error('Encounter and road save disagree.');
      if (cents(journey.cash) !== journey.story.trip.cashCents) throw new Error('Encounter cash does not match the journey.');
      describe(story);
    }
  }
  function assertAutosaveSafe(current, raw) {
    if (raw === null) {
      if (current.story) throw new Error('The saved journey was removed. Start a new life explicitly to replace it.');
      return;
    }
    const stored = JSON.parse(raw);
    validateSaved(stored);
    if (stored?.story || current.story) {
      if (!stored?.story || !current.story || stored.story.trip.id !== current.story.trip.id || stored.story.revision !== current.story.revision) {
        throw new Error('Another window changed this encounter. Reopen the saved journey before continuing.');
      }
    }
  }
  function upgradeJourney(value) {
    const next = clone(value);
    if (next?.story) next.story = E.migrate(next.story);
    validateSaved(next); return next;
  }
  function callbackDue(j) {
    const q=j.story?.world.flags.partsJob;
    return !j.currentEvent && !j.ended && !!q && !q.callbackDone && ['repaired','referred','botched','honest'].includes(q.status) && j.distance >= q.dueAtMiles;
  }
  function discoveryEligible(j) {
    if (j.distance <= 60) return false;
    const key=String(j.car?.id)+':'+String(j.car?.boughtPrice||0);
    return !j.story?.world.flags.carSearches?.[key]?.claimed;
  }
  return Object.freeze({VERSION, BACKUP_KEY, begin, choose, describe, validateSaved, assertAutosaveSafe, upgradeJourney, callbackDue, discoveryEligible});
});
