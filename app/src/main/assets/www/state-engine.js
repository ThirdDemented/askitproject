/*
 * The Long Way Home v1.2 state architecture.
 *
 * This module deliberately separates three memories:
 *   trip   - disposable state for the current journey
 *   world  - persistent fiction: people, places, careers, consequences
 *   player - cross-run behavior. The future Meta Director reads this layer.
 *
 * It is dependency-free so the existing v1.1 game can adopt it incrementally.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'lwh-v12-memory';
  const SCHEMA_VERSION = 1;

  const fresh = () => ({
    version: SCHEMA_VERSION,
    trip: {
      interaction: null,
      flags: {},
      counters: {},
      history: []
    },
    world: {
      npc: {},
      places: {},
      reputation: {},
      careers: {},
      flags: {}
    },
    player: {
      runsObserved: 0,
      actions: {},
      tendencies: {},
      metaAwareness: 0,
      history: []
    }
  });

  function merge(base, incoming) {
    if (!incoming || typeof incoming !== 'object') return base;
    for (const [key, value] of Object.entries(incoming)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        base[key] = merge(base[key] && typeof base[key] === 'object' ? base[key] : {}, value);
      } else {
        base[key] = value;
      }
    }
    return base;
  }

  function load() {
    const memory = fresh();
    try {
      const raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (raw) merge(memory, JSON.parse(raw));
    } catch (_) {}
    memory.version = SCHEMA_VERSION;
    return memory;
  }

  let memory = load();

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch (_) {}
    return memory;
  }

  function record(scope, type, detail = {}) {
    const bucket = memory[scope];
    if (!bucket) throw new Error('Unknown memory scope: ' + scope);
    const entry = { type, detail, at: Date.now() };
    if (!bucket.history) bucket.history = [];
    bucket.history.push(entry);
    bucket.history = bucket.history.slice(-250);
    save();
    return entry;
  }

  function countAction(action, amount = 1) {
    memory.player.actions[action] = (memory.player.actions[action] || 0) + amount;
    save();
    return memory.player.actions[action];
  }

  function setTripFlag(flag, value = true) {
    memory.trip.flags[flag] = value;
    save();
  }

  function setWorldFlag(flag, value = true) {
    memory.world.flags[flag] = value;
    save();
  }

  function rememberPlace(id, patch = {}) {
    memory.world.places[id] = Object.assign(memory.world.places[id] || { visits: 0 }, patch);
    save();
    return memory.world.places[id];
  }

  function visitPlace(id) {
    const place = rememberPlace(id);
    place.visits = (place.visits || 0) + 1;
    place.lastVisit = Date.now();
    record('player', 'visit-place', { id, visits: place.visits });
    return place;
  }

  function beginInteraction(spec) {
    if (!spec || !spec.id || !spec.kind) throw new Error('Interaction requires id and kind');
    memory.trip.interaction = {
      id: spec.id,
      kind: spec.kind,
      phase: 'arrive',
      startedAt: Date.now(),
      context: Object.assign({}, spec.context || {}),
      choices: [],
      complications: []
    };
    record('trip', 'interaction-begin', { id: spec.id, kind: spec.kind });
    return memory.trip.interaction;
  }

  function advanceInteraction(phase, detail = {}) {
    const current = memory.trip.interaction;
    if (!current) throw new Error('No active interaction');
    const allowed = {
      arrive: ['choose', 'exit'],
      choose: ['act', 'wait', 'exit'],
      act: ['wait', 'complication', 'consequence', 'exit'],
      wait: ['complication', 'consequence', 'exit'],
      complication: ['act', 'consequence', 'exit'],
      consequence: ['exit', 'choose'],
      exit: []
    };
    if (!(allowed[current.phase] || []).includes(phase)) {
      throw new Error('Invalid interaction transition: ' + current.phase + ' -> ' + phase);
    }
    current.phase = phase;
    current.updatedAt = Date.now();
    current.context = Object.assign(current.context || {}, detail);
    record('trip', 'interaction-phase', { id: current.id, phase, detail });
    return current;
  }

  function choose(choice, detail = {}) {
    const current = memory.trip.interaction;
    if (!current) throw new Error('No active interaction');
    current.choices.push({ choice, detail, at: Date.now() });
    countAction('choice:' + choice);
    record('trip', 'choice', { interaction: current.id, choice, detail });
    return current;
  }

  function complicate(id, detail = {}) {
    const current = memory.trip.interaction;
    if (!current) throw new Error('No active interaction');
    current.complications.push({ id, detail, at: Date.now() });
    record('trip', 'complication', { interaction: current.id, id, detail });
    return current;
  }

  function endInteraction(outcome = {}) {
    const current = memory.trip.interaction;
    if (!current) return null;
    const summary = Object.assign({}, current, { outcome, endedAt: Date.now() });
    record('trip', 'interaction-end', { id: current.id, outcome });
    memory.trip.interaction = null;
    save();
    return summary;
  }

  function resetTrip() {
    memory.trip = fresh().trip;
    memory.player.runsObserved = (memory.player.runsObserved || 0) + 1;
    record('player', 'new-run', { runsObserved: memory.player.runsObserved });
    save();
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(memory));
  }

  global.LWHMemory = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    snapshot,
    save,
    record,
    countAction,
    setTripFlag,
    setWorldFlag,
    rememberPlace,
    visitPlace,
    beginInteraction,
    advanceInteraction,
    choose,
    complicate,
    endInteraction,
    resetTrip
  };
})(window);
