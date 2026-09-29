# The Long Way Home — Phase 1: interaction foundation

## Baseline and release boundary

Source baseline: `a9cf1ff44d8fa2cf60cc6871dda386150408ace3`, successful Android build #104, personally played by the owner. Expansion branch: `codex/chaos-phase1`. Do not modify `main`, signing, the Android application ID, the original save, or existing release artifacts as part of this phase. No Play Store submission without owner approval of that exact future build.

This commit is an **isolated, playable scene lab and reusable engine**, not an integrated v1.2 Android release. The existing journey and `game.js` remain unchanged. The lab is `app/src/main/assets/www/story-lab.html`. Serve the `www` folder and open that page. Its buttons deliberately provide manual entry to the two scenes; it does not yet replace natural encounters on the highway.

## Implemented

- Dependency-free state reducer shared by browser and Node. Trip resources, character/world relationships, and cross-run player counters are separate.
- Integer-cents payments, meal reservations, inventory requirements, explicit game-time costs, and deadline failure.
- Seeded PRNG state saved with each interaction. Reading a scene consumes no time or randomness. Reloading cannot reroll an unresolved result.
- Atomic action snapshots; revision/interaction tokens reject stale and repeated actions. Persist-before-display in the lab. A failed storage write leaves the prior action/state intact.
- Versioned save validation; unsupported or corrupt saves are rejected without automatic deletion. Copy-only import of the fields needed from a version-4/#104 journey. **This import is not a full production save migration or write-back adapter.**
- A bounded, local 256-entry action journal records scene, choice, time, price, and RNG before/after. Truncation is counted, not hidden. No network telemetry. The journal is not a permanent roster of AI agents.
- Local cross-run choice counters have an opt-out that clears them. They describe in-game choices only, not a person's real-world character. A new character resets world relationships; meta-aware cross-run NPC behavior is deliberately not implemented.
- Diner: arrival, counter/booth, order, wait/chat/read, optional wrong-order/outage/stranger interruptions, eat, pay/tip, leave. Usually the wait is ordinary. No real-time waiting is required.
- Tire repair: inspect a persisted cause; toolkit-gated work; success weighted by career skill, vehicle, fatigue, and condition; specific tire complications; one-use sealant; walk to a general-store subscene; paid assistance or time-for-help fallback. The baby carrot is a 5% cause, not a mandatory opening joke. Retry is bounded. Leon uses one NPC identity within a trip.
- Original diner and breakdown illustrations are reused. No new art or claimed art polish in this commit.

## Evidence and audit

Implemented in one ChatGPT coding session at the owner's instruction to begin Phase 1. No separately identifiable parallel agents were invoked. Local source extracted from the #104 APK matched the repository `game.js` Git blob SHA `2da23a5197cc999149ba4fce4ee33baf97102506`.

Local verification: `node --test qa/story-engine.test.cjs` passed **30 tests**, including **2,000 seeded scene playthroughs**. These are scene simulations, not 2,000 full road trips. All three new browser JavaScript files passed `node --check`.

Local browser verification was attempted but the environment's Chromium policy blocked the localhost test page (`ERR_BLOCKED_BY_ADMINISTRATOR`). It did not validate the UI. `qa/story-browser.cjs` and the dedicated GitHub workflow perform the actual browser checks and collect screenshots in CI. Treat those checks as pending until their run succeeds. No Android build, device test, audio test, or owner playtest of this expansion has passed yet.

## Next integration gate

1. Expose a narrow, explicit adapter from the existing IIFE game state; do not scrape the DOM or rewrite saves indirectly.
2. Replace the food/tire encounter entry points with this engine while retaining existing cheap/no-stop choices.
3. Apply cents/time/condition/inventory deltas exactly once to the journey and Trip Computer. Preserve current-event resume, pending road legs, deadline failures, audio lifecycle, and rotation.
4. Preserve all original version-4 save fields with migration fixtures, including custom routes, endings, and trading data. Add rollback/backup and error tests before in-place migration.
5. Require browser regressions for both the base game and interactions, then signed Android/API-36 QA. Mark previous reviewed source/visual gates stale after integration; never relabel old evidence as the new source.
6. Generate a clearly labeled new candidate APK and obtain the owner's hands-on approval.

## Captured design decisions / backlog, not implemented

Four pillars: grounded journey, contextual cascades, living social world, progressively revealed absurd meta relationship. Rich scenes precede meta narration. Player choices always remain real: a joke must not silently select an option, erase a save, or block a legitimate new game. App closure is not proof of intentional outcome avoidance.

Expansion targets remain content goals, not completed work: larger interaction/cascade library, hidden careers with badges and progression, vehicle-specific subsystem complications, motel/mechanic/market scenes, river-fording homage, three deep rabbit holes, and a Meta Director. The exact content and balancing scope must be earned by playtests; never promise an experience can mathematically never repeat.

The recurring under-seat cash encounter is still in the original game. Source inspection found random cash amounts but always a cash reward when that event is selected. Replacing it with an optional weighted discovery pool remains an explicit integration task; this commit does not claim it is fixed.
