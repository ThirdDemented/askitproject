# Alpha2: deliver a real conversation and an earned road payoff

Owner-directed next pass, building on exact alpha1 source `b70002b14d50c897dff4dc33758e253b9bf56b94`. Main/build #104 stays untouched; PR #2 remains draft. This is not authorization to publish to Google Play.

## Experience changes

- Six authored overheard topics plus quiet visits, distinct counter/booth pools, recent-topic suppression, and specific follow-up answers. The game no longer treats asking a question as a substitute for hearing its answer.
- One complete optional Hal storyline: overhear/ask or meet through the server, learn his problem, offer help after lunch, pay for the meal, choose whether to follow through, inspect his car, then attempt a tool/skill-sensitive repair or arrange professional help. A successful repair pays $45 once. An honest failed attempt does not invent a wage. Reckless bluffing explicitly risks making Hal's problem worse.
- The outcome schedules a specific callback at least 90 actual driven miles later, when the player is not already in an urgent resource event. Repaired/referral/botched paths have different responses. Later rewards and reparations affect actual money/inventory and the Trip Computer exactly once. No callback is promised if the journey ends first.
- The kitchen draws an independent saved result: ordinary service, wrong order or power outage. Reading the placemat, talking or simply waiting does not reroll or suppress the same background event. Reading and listening to an optional sound cue consume no game time; actions show their game-time costs.
- Same-location greetings can remember a tip or completed favor. Other locations do not pretend to know this character without a reason. This is within-trip world memory, not the unimplemented cross-run meta layer.
- Under-seat discovery can be empty, mundane, a useful charger, occasional cash or an odd souvenir. The hidden result is saved before choosing. One claimed discovery per vehicle; repeated searches or reloads cannot print money.
- The 1/2/3%-condition tire entry regression is covered. Stopping does not inflict arbitrary engine damage, and repairing a tire does not magically heal the engine.

## Presentation

A stateful diner table view uses a window-free crop of the existing interior illustration plus a CSS table/meal interface. It is not new bespoke commissioned artwork. Food is absent while cooking, matches the selected meal when served, and becomes an empty plate after eating. Counter and booth presentation differ. Horn/dashboard/weather controls are hidden indoors; cash, trip report and rotation remain usable. Dialogue has speaker labels and original nonverbal speaker cues/replay. Text carries all meaning. Human listening and final visual approval are still required.

## Save and source integrity

Known alpha1 story saves explicitly migrate from `phase1.1` to `phase1.2`, preserving random state, money and the current node. Already-active old diners finish with their original rules; new visits use the enhanced content. Raw pre-upgrade alpha1 bytes are retained locally. Unknown versions fail closed. New story earnings are projected transactionally into the real journey.

As in the prior integration, larger-file edits are transferred through a one-shot hash-checked recipe. CI commits the resulting ordinary source only on `codex/chaos-phase1` before testing. A mismatch refuses to overwrite the source. The one-shot marker is removed. Source snapshots and the eventual candidate record exact source SHA/run/hash. No main changes, secret disclosures, merges or releases.

## Verification at commit preparation

Actual local result: 52 Node tests pass (30 original engine tests and 22 new depth tests), including 2,000 enhanced scene policies and 1,000 discovery samples. These are not complete road trips. Syntax checks pass. The existing 14 current adapter tests are adjusted for the intended independent-kitchen paths and truthful tire-condition behavior, but their combined CI result is not presumed here.

Local Chromium is blocked from localhost by environment policy; no attempt to bypass that restriction. The authorized GitHub workflow must run all engine/adapter/depth tests, original fuel checks, full-game browser regression, legacy lab browser tests, integrated journey checks, new experience checks, and signed Android tests. Native depth coverage includes the real conversation, rotation, meal payment, actual driving to a callback, and the 2%-condition tire case. No claim that these new browser/native stages have passed until the run completes.

## Still not a full release

Meta Director / Accept What You Did, cross-run rabbit holes, hidden-career progression, extensive motel/market/mechanic scenes, the large chaos library and final bespoke artwork remain future milestones. The original euphemistic underground-goods names are not changed in this pass. Owner approval of the exact candidate remains pending.
