/* The Long Way Home: isolated, deterministic interaction foundation.
 * Browser global + CommonJS; no dependencies, timers, network, or storage writes.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LWHStoryEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 1, CONTENT = 'phase1.2', JOURNAL_LIMIT = 256;
  const STORAGE_KEY = 'lwh-story-lab-v1'; // Never overwrite lwh-rc1-save.
  const copy = value => JSON.parse(JSON.stringify(value));
  const clamp = (n, low = 0, high = 100) => Math.max(low, Math.min(high, n));
  const integer = (value, name, min = 0) => {
    if (!Number.isSafeInteger(value) || value < min) throw new Error('Invalid ' + name);
    return value;
  };
  function hash(text) {
    let h = 2166136261;
    for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0 || 1;
  }
  function create(options = {}) {
    const seed = options.seed === undefined ? 1 : integer(options.seed, 'seed');
    const s = {
      schemaVersion: SCHEMA, contentVersion: CONTENT, revision: 0,
      rng: (seed >>> 0) || 1, sequence: 0, droppedJournalEntries: 0,
      trip: {
        id: String(options.runId || 'trip-' + (seed >>> 0)),
        cashCents: options.cashCents ?? 15000, spentCents: 0, earnedCents: 0, minutes: 0,
        remainingMinutes: options.remainingMinutes ?? null,
        health: options.health ?? 100, hunger: options.hunger ?? 65,
        fatigue: options.fatigue ?? 20, morale: options.morale ?? 70,
        career: options.career || 'traveler',
        skills: {repair: options.career === 'mechanic' ? 2 : 0},
        inventory: [...(options.inventory || [])],
        vehicle: {id: 'comfort', name: 'Comfort V6', condition: 75,
          faults: [], temporaryRepairs: [], ...(options.vehicle || {})},
        location: String(options.location || 'Roadside'), status: 'active',
        active: null, lastResult: null
      },
      // This world's relationships belong to this character, not a new life.
      world: {npcs: {}, flags: {}, visits: {}, deferred: []},
      player: {rememberChoices: true, runsStarted: 1, actions: {}, discoveries: []},
      journal: []
    };
    validate(s);
    return s;
  }
  function validate(s) {
    if (!s || s.schemaVersion !== SCHEMA) throw new Error('Unsupported story-save version; original data kept.');
    if (s.contentVersion !== CONTENT) throw new Error('Unsupported story content; original data kept.');
    integer(s.revision, 'revision'); integer(s.rng, 'random state', 1);
    if (s.rng > 0xffffffff) throw new Error('Invalid random state');
    integer(s.sequence, 'sequence'); integer(s.droppedJournalEntries, 'journal count');
    const t = s.trip;
    if (!t || typeof t.id !== 'string' || !['active', 'ended'].includes(t.status)) throw new Error('Invalid trip');
    integer(t.cashCents, 'cash'); integer(t.spentCents, 'spending'); integer(t.earnedCents ?? 0, 'earnings'); integer(t.minutes, 'time');
    if (t.remainingMinutes !== null && !Number.isSafeInteger(t.remainingMinutes)) throw new Error('Invalid deadline');
    for (const k of ['health', 'hunger', 'fatigue', 'morale']) {
      if (!Number.isFinite(t[k]) || t[k] < 0 || t[k] > 100) throw new Error('Invalid ' + k);
    }
    if (!t.skills || !Number.isFinite(t.skills.repair) || t.skills.repair < 0) throw new Error('Invalid skills');
    if (!Array.isArray(t.inventory) || t.inventory.some(x => typeof x !== 'string')) throw new Error('Invalid inventory');
    if (!t.vehicle || !Number.isFinite(t.vehicle.condition) || t.vehicle.condition < 0 || t.vehicle.condition > 100 ||
        !Array.isArray(t.vehicle.faults) || !Array.isArray(t.vehicle.temporaryRepairs)) throw new Error('Invalid vehicle');
    if (!s.world || !s.world.npcs || !s.world.flags || !s.world.visits || !Array.isArray(s.world.deferred)) throw new Error('Invalid world');
    if (!s.player || typeof s.player.rememberChoices !== 'boolean' || !s.player.actions || !Array.isArray(s.player.discoveries)) throw new Error('Invalid player memory');
    integer(s.player.runsStarted, 'run count');
    if (!Array.isArray(s.journal) || s.journal.length > JOURNAL_LIMIT) throw new Error('Invalid journal');
    if (t.active) {
      if (typeof t.active.id !== 'string' || typeof t.active.scene !== 'string' || typeof t.active.node !== 'string' || !t.active.data) throw new Error('Invalid interaction');
      integer(t.active.data.billCents ?? 0, 'reserved bill');
      if ((t.active.data.billCents || 0) > t.cashCents) throw new Error('Unfunded bill');
    }
    return s;
  }
  function record(s, type, details) {
    s.sequence++;
    s.journal.push({seq: s.sequence, run: s.trip.id, minute: s.trip.minutes, type, ...details});
    if (s.journal.length > JOURNAL_LIMIT) {
      s.droppedJournalEntries += s.journal.length - JOURNAL_LIMIT;
      s.journal.splice(0, s.journal.length - JOURNAL_LIMIT);
    }
  }
  function random(s) {
    let n = s.rng;
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    s.rng = n >>> 0;
    return s.rng / 4294967296;
  }
  function weighted(s, pool) {
    const total = pool.reduce((sum, x) => sum + x.weight, 0);
    if (!pool.length || !Number.isFinite(total) || total <= 0 || pool.some(x => !Number.isFinite(x.weight) || x.weight < 0)) throw new Error('Invalid outcome pool');
    let roll = random(s) * total;
    for (const item of pool) { roll -= item.weight; if (roll < 0) return item.id; }
    return pool[pool.length - 1].id;
  }
  function context(s) {
    return {
      random: () => random(s), weighted: pool => weighted(s, pool), clamp,
      has: item => s.trip.inventory.includes(item),
      earn: amount => { integer(amount, 'reward'); s.trip.cashCents += amount; s.trip.earnedCents = (s.trip.earnedCents || 0) + amount; },
      consume: item => {
        const i = s.trip.inventory.indexOf(item);
        if (i < 0) throw new Error('Missing item: ' + item);
        s.trip.inventory.splice(i, 1);
      },
      npc: (id, delta = 0) => {
        const n = s.world.npcs[id] || {meetings: 0, trust: 0};
        n.meetings++; n.trust = clamp(n.trust + delta, -100, 100);
        s.world.npcs[id] = n;
      },
      finish: text => {
        s.trip.lastResult = {scene: s.trip.active.scene, text};
        s.trip.active.node = 'done';
      }
    };
  }
  function definition(s, scenes) {
    const a = s.trip.active;
    if (!a || !scenes[a.scene]) throw new Error('No supported active interaction');
    return scenes[a.scene];
  }
  function available(s, action) {
    if (action.requires && !action.requires.every(id => s.trip.inventory.includes(id))) return false;
    return !action.when || action.when(s);
  }
  function quote(s, action) {
    const bill = s.trip.active?.data.billCents || 0;
    const cost = typeof action.costCents === 'function' ? action.costCents(s) : action.costCents || 0;
    const reserve = action.reserveCents || 0;
    integer(cost, 'choice cost'); integer(reserve, 'reservation');
    const funds = s.trip.cashCents - (action.settlesBill ? 0 : bill);
    return {cost, reserve, enabled: cost + reserve <= funds};
  }
  function view(s, scenes) {
    validate(s);
    if (!s.trip.active) return null;
    const d = definition(s, scenes), node = d.describe(s);
    const choices = d.choices(s).filter(a => available(s, a)).map(a => {
      const q = quote(s, a);
      return {id: a.id, label: a.label, minutes: a.minutes || 0,
        costCents: q.cost, reserveCents: q.reserve, enabled: q.enabled,
        reason: q.enabled ? '' : 'Not enough uncommitted cash.'};
    });
    if (!choices.length) throw new Error('Interaction has no choices: ' + s.trip.active.node);
    return {...node, scene: s.trip.active.scene, node: s.trip.active.node,
      interactionId: s.trip.active.id, revision: s.revision, choices};
  }
  function begin(state, scene, scenes) {
    validate(state);
    if (state.trip.status !== 'active' || state.trip.active) throw new Error('Finish the current interaction first');
    if (!scenes[scene]) throw new Error('Unknown scene: ' + scene);
    const s = copy(state);
    s.trip.active = {id: s.trip.id + ':' + (s.sequence + 1), scene, node: 'arrival', data: {billCents: 0}};
    s.trip.lastResult = null;
    const rngBefore = s.rng;
    scenes[scene].start(s, context(s));
    s.world.visits[scene] = (s.world.visits[scene] || 0) + 1;
    s.revision++;
    record(s, 'begin', {scene, rngBefore, rngAfter: s.rng});
    validate(s); view(s, scenes);
    return s;
  }
  function choose(state, token, scenes) {
    validate(state);
    if (!token || token.revision !== state.revision || token.interactionId !== state.trip.active?.id) throw new Error('Stale choice; nothing changed.');
    const d = definition(state, scenes);
    const action = d.choices(state).find(a => a.id === token.choiceId && available(state, a));
    if (!action) throw new Error('That choice is not available');
    const q = quote(state, action);
    if (!q.enabled) throw new Error('That choice is not affordable');
    const s = copy(state), before = copy(s.trip), rngBefore = s.rng;
    integer(action.minutes || 0, 'action duration');
    s.trip.cashCents -= q.cost; s.trip.spentCents += q.cost;
    if (action.settlesBill) s.trip.active.data.billCents = 0;
    if (q.reserve) s.trip.active.data.billCents += q.reserve;
    s.trip.minutes += action.minutes || 0;
    if (s.trip.remainingMinutes !== null) s.trip.remainingMinutes -= action.minutes || 0;
    action.apply(s, context(s));
    if (s.trip.active && d.afterAction) d.afterAction(s, {trip: before}, action, context(s));
    if (s.player.rememberChoices) {
      const key = before.active.scene + '.' + action.id;
      s.player.actions[key] = (s.player.actions[key] || 0) + 1;
    }
    if (s.trip.health <= 0 || (s.trip.remainingMinutes !== null && s.trip.remainingMinutes < 0)) {
      s.trip.status = 'ended';
      s.trip.lastResult = {scene: before.active.scene, text: s.trip.health <= 0 ? 'This trip ends here.' : 'The stop used the time you had left. You missed the deadline.'};
      s.trip.active = null;
    }
    s.revision++;
    record(s, 'choice', {scene: before.active.scene, from: before.active.node,
      to: s.trip.active?.node || s.trip.status, choice: action.id,
      costCents: q.cost, minutes: action.minutes || 0, rngBefore, rngAfter: s.rng});
    validate(s);
    if (s.trip.active) view(s, scenes);
    return s;
  }
  function newTrip(previous, options = {}) {
    validate(previous);
    const s = create(options);
    s.player = copy(previous.player);
    s.player.runsStarted++;
    return s;
  }
  function memory(state, enabled) {
    validate(state);
    const s = copy(state); s.player.rememberChoices = Boolean(enabled);
    if (!enabled) s.player.actions = {};
    s.revision++; record(s, 'memory-setting', {enabled: Boolean(enabled)});
    return s;
  }
  function serialize(s) { validate(s); return JSON.stringify(s); }
  function migrate(value) {
    const s = copy(value);
    if (s?.schemaVersion === 1 && s.contentVersion === 'phase1.1') {
      s.contentVersion = CONTENT; s.trip.earnedCents = s.trip.earnedCents || 0;
      // Old active diners finish using their original nodes and saved RNG.
    }
    validate(s); return s;
  }
  function deserialize(raw, scenes) {
    const s = migrate(JSON.parse(raw));
    if (s.trip.active) {
      if (!scenes) throw new Error('Scene definitions required to restore an interaction');
      view(s, scenes);
    }
    return s;
  }
  function importLegacy(raw) {
    const old = JSON.parse(raw);
    if (!old || old.version !== 4 || !old.car || !Number.isFinite(old.cash) || old.cash < 0) throw new Error('Expected a build-104 version-4 journey with a vehicle; original save kept.');
    const cashCents = Math.round(old.cash * 100);
    const s = create({seed: hash(raw), runId: 'import-' + hash(raw), cashCents,
      career: old.career?.id || 'traveler', inventory: old.inventory || [],
      hunger: clamp(old.hunger ?? 50), fatigue: clamp(old.fatigue ?? 20), morale: clamp(old.morale ?? 70),
      remainingMinutes: old.reason?.hard && Number.isFinite(old.days) ? Math.round(old.days * 1440) : null,
      vehicle: {id: old.car.id, name: old.car.n, condition: clamp(old.condition ?? 75)} });
    // Copy only: this prototype never rewrites or deletes the original key.
    s.trip.legacy = {version: old.version, distance: old.distance, totalMiles: old.totalMiles, departed: Boolean(old.departed)};
    if (old.ended) { s.trip.status = 'ended'; s.trip.lastResult = {text: 'This imported journey already ended. Start a new test trip.'}; }
    return s;
  }
  return Object.freeze({SCHEMA, CONTENT, STORAGE_KEY, JOURNAL_LIMIT, create, validate,
    begin, view, choose, newTrip, memory, serialize, deserialize, importLegacy, hash, migrate});
});
