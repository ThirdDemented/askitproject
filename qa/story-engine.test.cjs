'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/src/main/assets/www/story-engine.js');
const S = require('../app/src/main/assets/www/story-scenes.js');
const make = (extra = {}) => E.create({seed: E.hash('test'), ...extra});
const turn = (s, choiceId) => {
  const v = E.view(s, S);
  return E.choose(s, {choiceId, interactionId: v.interactionId, revision: v.revision}, S);
};
const path = (s, ids) => ids.reduce(turn, s);
const enterDiner = (extra = {}) => path(E.begin(make(extra), 'diner', S), ['enter', 'counter']);
const choices = s => E.view(s, S).choices;
const repairWork = (extra = {}) => path(E.begin(make({inventory: ['toolkit'], ...extra}), 'repair', S), ['inspect', 'tools']);
function findAt(node) {
  for (let i = 0; i < 1000; i++) {
    const s = path(enterDiner({seed: E.hash('diner-' + i)}), ['soup', 'wait']);
    if (s.trip.active.node === node) return s;
  }
  throw new Error('Unreachable diner node: ' + node);
}
function findComplication(kind) {
  for (let i = 0; i < 3000; i++) {
    const s = turn(repairWork({seed: E.hash('repair-' + i)}), 'attempt');
    if (s.trip.active.node === 'complication' && s.trip.active.data.complication === kind) return s;
  }
  throw new Error('Unreachable complication: ' + kind);
}
test('new state uses separate trip, world, player and a nonzero seed', () => {
  const s = make({seed: 0}); assert.equal(s.rng, 1); assert.ok(s.trip && s.world && s.player);
  assert.notEqual(E.STORAGE_KEY, 'lwh-rc1-save'); assert.equal(s.trip.active, null);
});
test('invalid cash, stats, and future schemas are rejected', () => {
  assert.throws(() => make({cashCents: -1})); assert.throws(() => make({cashCents: .5}));
  assert.throws(() => make({hunger: 101})); assert.throws(() => make({seed: NaN}));
  const s = make(); s.schemaVersion = 99; assert.throws(() => E.deserialize(JSON.stringify(s), S), /Unsupported/);
});
test('cannot overlap scenes or enter unknown scenes', () => {
  assert.throws(() => E.begin(make(), 'motel', S), /Unknown/);
  assert.throws(() => E.begin(E.begin(make(), 'diner', S), 'repair', S), /Finish/);
});
test('engine actions never mutate the input state', () => {
  const s = enterDiner(), original = JSON.stringify(s); turn(s, 'soup'); assert.equal(JSON.stringify(s), original);
});
test('reading a scene does not advance time, spend money, or roll an outcome', () => {
  const s = repairWork(), original = E.serialize(s); for (let i = 0; i < 50; i++) E.view(s, S);
  assert.equal(E.serialize(s), original);
});
test('same seed and actions give the same state and audit trail', () => {
  const go = () => path(E.begin(make(), 'repair', S), ['inspect', 'walk', 'clerk_help', 'exit']);
  assert.deepEqual(go(), go());
});
test('mid-interaction saves resume exactly, including future random outcomes', () => {
  const s = repairWork(); const restored = E.deserialize(E.serialize(s), S);
  assert.deepEqual(E.view(s, S), E.view(restored, S));
  assert.deepEqual(turn(s, 'attempt'), turn(restored, 'attempt'));
});
test('double clicks and stale tokens cannot repeat a financial transaction', () => {
  let s = path(enterDiner(), ['soup', 'placemat', 'eat']);
  const v = E.view(s, S), token = {choiceId: 'pay', revision: v.revision, interactionId: v.interactionId};
  s = E.choose(s, token, S); const original = E.serialize(s);
  assert.throws(() => E.choose(s, token, S), /Stale/); assert.equal(E.serialize(s), original);
});
test('unavailable, forged, and unaffordable choices change nothing', () => {
  const s = enterDiner({cashCents: 0}), original = E.serialize(s);
  assert.throws(() => turn(s, 'breakfast'), /affordable/); assert.throws(() => turn(s, 'free_money'), /available/);
  assert.equal(E.serialize(s), original);
});
test('a diner visit follows order, wait, eat, pay, and exit', () => {
  let s = turn(enterDiner(), 'breakfast');
  assert.equal(s.trip.cashCents, 15000); assert.equal(s.trip.active.data.billCents, 2200);
  s = path(s, ['placemat', 'eat']); assert.equal(s.trip.hunger, 10); assert.equal(s.trip.cashCents, 15000);
  s = path(s, ['tip', 'exit']); assert.equal(s.trip.cashCents, 12500); assert.equal(s.trip.spentCents, 2500);
  assert.equal(s.trip.active, null); assert.equal(s.trip.minutes, 26); assert.ok(s.world.flags.sawGiantSpoonAd);
});
test('ordering reserves exactly enough money and optional tips respect the budget', () => {
  let s = enterDiner({cashCents: 500}); assert.equal(choices(s).find(x => x.id === 'soup').enabled, false);
  s = path(s, ['coffee', 'placemat', 'eat']); assert.equal(choices(s).find(x => x.id === 'tip').enabled, false);
  s = turn(s, 'pay'); assert.equal(s.trip.cashCents, 0); assert.equal(s.trip.active.data.billCents, 0);
});
test('cancelling before serving does not charge or feed the player', () => {
  const s = path(enterDiner(), ['soup', 'cancel', 'exit']);
  assert.equal(s.trip.cashCents, 15000); assert.equal(s.trip.hunger, 65); assert.equal(s.trip.spentCents, 0);
});
test('waiting has a normal outcome and several optional interruptions', () => {
  for (const node of ['ready', 'outage', 'wrong', 'stranger']) assert.equal(findAt(node).trip.active.node, node);
});
test('outage discount, cancellation, and generator paths all resolve', () => {
  const s = findAt('outage');
  assert.equal(path(s, ['cold', 'eat', 'pay', 'exit']).trip.cashCents, 14200);
  assert.equal(path(s, ['cancel', 'exit']).trip.cashCents, 15000);
  assert.equal(path(s, ['generator', 'eat', 'pay', 'exit']).trip.cashCents, 13800);
});
test('wrong orders do not double charge, and strangers can be declined', () => {
  const s = findAt('wrong');
  for (const id of ['correct_order', 'accept_plate']) assert.equal(path(s, [id, 'eat', 'pay', 'exit']).trip.cashCents, 13800);
  const stranger = findAt('stranger');
  assert.ok(path(stranger, ['listen', 'eat', 'pay', 'exit']).world.flags.metLeon);
  assert.equal(path(stranger, ['decline', 'eat', 'pay', 'exit']).world.flags.metLeon, undefined);
});
test('toolkit creates a repair choice that otherwise does not exist', () => {
  const no = turn(E.begin(make(), 'repair', S), 'inspect');
  const yes = turn(E.begin(make({inventory: ['toolkit']}), 'repair', S), 'inspect');
  assert.equal(choices(no).some(x => x.id === 'tools'), false); assert.ok(choices(yes).some(x => x.id === 'tools'));
  assert.throws(() => turn(no, 'tools'), /available/);
});
test('mechanic skill and vehicle identity affect repair probability', () => {
  const ordinary = repairWork(), mechanic = repairWork({career: 'mechanic'});
  assert.ok(S.repair.repairChance(mechanic) > S.repair.repairChance(ordinary));
  const harder = repairWork({vehicle: {id: 'touring', name: 'Touring Six'}});
  assert.ok(S.repair.repairChance(harder) < S.repair.repairChance(ordinary));
});
test('the absurd tire cause is occasional and is saved instead of rerolled', () => {
  const causes = new Set(); let carrots = 0;
  for (let i = 0; i < 1000; i++) { const s = E.begin(make({seed: E.hash('cause-' + i)}), 'repair', S);
    causes.add(s.trip.active.data.cause); if (s.trip.active.data.cause === 'carrot') carrots++;
    assert.equal(E.deserialize(E.serialize(s), S).trip.active.data.cause, s.trip.active.data.cause);
  }
  assert.equal(causes.size, 4); assert.ok(carrots > 10 && carrots < 100, String(carrots));
});
test('each repair complication has a fallback that can resolve it', () => {
  for (const kind of ['socket', 'spare', 'lug', 'knuckle']) {
    const s = findComplication(kind), finished = path(s, ['wait_help', 'exit']);
    assert.equal(finished.trip.vehicle.faults.includes('tire'), false);
    assert.ok(finished.world.flags.oweRoadsideFavor);
  }
});
test('a missing socket can be bought and the repair retried, but not forever', () => {
  let s = findComplication('socket'); s = path(s, ['walk', 'socket', 'tools', 'attempt']);
  assert.equal(s.trip.active.data.attempts, 2); assert.equal(s.trip.cashCents, 13800);
  if (s.trip.active.node === 'complication') assert.equal(choices(s).some(x => x.id === 'retry'), false);
});
test('failed work can cause bounded health and fatigue costs', () => {
  const s = findComplication('knuckle'); assert.equal(s.trip.health, 95); assert.equal(s.trip.fatigue, 25);
});
test('consumable sealant is removed regardless of the repair outcome', () => {
  const s = path(E.begin(make({inventory: ['fixflat']}), 'repair', S), ['inspect', 'sealant']);
  assert.equal(s.trip.inventory.includes('fixflat'), false);
  if (s.trip.active.node === 'done') assert.ok(s.trip.vehicle.temporaryRepairs.includes('tire'));
});
test('zero cash and no tools still has an honest time-for-help route', () => {
  const s = path(E.begin(make({cashCents: 0}), 'repair', S), ['inspect', 'walk', 'clerk_help', 'exit']);
  assert.equal(s.trip.cashCents, 0); assert.equal(s.trip.vehicle.faults.includes('tire'), false);
  assert.equal(s.trip.minutes, 170);
});
test('long stops can miss a deadline rather than freezing the interaction', () => {
  const s = turn(E.begin(make({remainingMinutes: 30}), 'repair', S), 'wait_help');
  assert.equal(s.trip.status, 'ended'); assert.equal(s.trip.active, null); assert.match(s.trip.lastResult.text, /deadline/);
  assert.throws(() => E.begin(s, 'diner', S), /Finish/);
});
test('cross-run counters persist but character-specific world relationships reset', () => {
  const old = path(enterDiner(), ['soup', 'placemat', 'eat', 'tip', 'exit']);
  const next = E.newTrip(old, {seed: 52});
  assert.equal(next.player.actions['diner.tip'], 1); assert.deepEqual(next.world.npcs, {}); assert.equal(next.player.runsStarted, 2);
});
test('local memory opt-out clears choice counters and stops collecting new ones', () => {
  let s = E.memory(path(E.begin(make(), 'diner', S), ['leave', 'exit']), false);
  s = path(E.begin(s, 'diner', S), ['leave', 'exit']); assert.deepEqual(s.player.actions, {});
  assert.equal(E.deserialize(E.serialize(s), S).player.rememberChoices, false);
});
test('version-4 save import is deterministic and leaves the source untouched', () => {
  const raw = JSON.stringify({version: 4, cash: 123.45, car: {id: 'family', n: 'Family LX'}, condition: 63,
    career: {id: 'mechanic'}, inventory: ['toolkit'], reason: {hard: true}, days: 2, departed: true, distance: 123});
  const original = raw, s = E.importLegacy(raw);
  assert.equal(raw, original); assert.equal(s.trip.cashCents, 12345); assert.equal(s.trip.remainingMinutes, 2880);
  assert.equal(s.trip.skills.repair, 2); assert.deepEqual(s, E.importLegacy(raw));
  assert.throws(() => E.importLegacy('{broken')); assert.throws(() => E.importLegacy('{"version":99}'));
});
test('unknown restored nodes are rejected rather than silently reset', () => {
  const s = E.begin(make(), 'diner', S); s.trip.active.node = 'not-a-node';
  assert.throws(() => E.deserialize(JSON.stringify(s), S), /Unknown/);
});
test('journal is bounded and reports truncation instead of claiming a full history', () => {
  let s = make();
  for (let i = 0; i < 100; i++) s = path(E.begin(s, 'diner', S), ['leave', 'exit']);
  assert.equal(s.journal.length, E.JOURNAL_LIMIT); assert.equal(s.droppedJournalEntries, 44); assert.equal(s.sequence, 300);
});
test('2000 seeded playthroughs complete without negative cash or a choice dead end', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    let s = E.begin(make({seed: E.hash('simulation-' + i), cashCents: [0, 500, 5000, 15000][i % 4],
      inventory: i % 3 ? ['toolkit', 'fixflat'] : [], career: i % 2 ? 'mechanic' : 'traveler'}), i % 2 ? 'diner' : 'repair', S);
    let j = 0;
    for (; s.trip.active && j < 100; j++) {
      seen.add(s.trip.active.scene + '/' + s.trip.active.node);
      const all = choices(s).filter(a => a.enabled);
      assert.ok(all.length); const index = E.hash('policy-' + i + '-' + j) % all.length;
      s = turn(s, all[index].id); E.validate(s);
    }
    assert.ok(j < 100, 'Unresolved simulation ' + i); assert.ok(s.trip.cashCents >= 0);
  }
  for (const n of ['diner/waiting', 'diner/outage', 'diner/pay', 'repair/work', 'repair/complication', 'repair/store']) assert.ok(seen.has(n), n);
});
