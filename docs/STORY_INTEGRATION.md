# Integrated encounters — 1.2.0-alpha.1 owner-playtest candidate

## Scope and baseline

This supersedes the standalone-only status in CHAOS_PHASE1.md. Build #104 at `a9cf1ff44d8fa2cf60cc6871dda386150408ace3` remains untouched on main. Work continues exclusively on `codex/chaos-phase1` / draft PR #2. No merge, release publication, or Play Store submission is authorized by this change.

The existing food event now enters the diner, and the tire event's STOP NOW choice enters the repair interaction. A road-screen diner-stop button also permits a voluntary visit when no event is unresolved. The skip-food, road-food and ignore-tire choices are retained. Markets/driving cannot bypass a pending interactive stop.

## Integration guarantees

- One journey snapshot contains the story state and all applied deltas. Prices use integer cents inside the engine and convert once to the existing money ledger.
- Ordering reserves meal money; payment spends it. Food/repair/supply categories update once. Time advances the actual day/hour/deadline, not just a test counter. Trip Computer shows interactive-stop minutes.
- Inventory, skills, conditions, health, and repair faults flow back to the journey. Driving distance, planned legs, fuel, custom routes, cargo, debts, and other unrelated fields are preserved.
- Original version-4 fields remain intact. New fields are explicitly versioned. The first integration write retains a local pre-story backup. Unsupported/corrupt story saves are rejected without deletion. Storage failure leaves the prior action unapplied.
- Pending choices, RNG and the optional conversation are restored, not rerolled. A retained stale button cannot charge twice.
- Encounter journal/relationships belong to this character. Cross-run personality inference and the Meta Director are NOT part of this candidate.

## Diner presentation

Original synthesized griddle noise, dish clatter, a serving bell and muffled nonverbal voices accompany readable text. Optional overheard parts-car/boat conversations can be engaged or ignored. A transcript records the stop. A sound control is available during the interaction; audio stops on mute, background, scene exit and pagehide. Reading and rotation never consume game time. This is initial sound design, not a claim that the owner approved the mix.

## Source and audit

One ChatGPT implementation session; no separately identifiable parallel agents. The integration is transferred as an exact hash-checked recipe for the larger existing source files, plus ordinary new JavaScript/test files. The workflow materializes and commits the normal source files ONLY to the expansion branch, removes the one-shot marker, and then tests/builds that exact source revision. A changed base or unexpected target hash fails closed. Future development edits the ordinary source, not the historical recipe.

The candidate records the exact source commit, workflow run and APK/AAB hashes. The old visual/release gates are marked pending; old evidence is not represented as review of these new scenes.

## Actual verification at commit preparation

PASS locally: 43 Node tests (30 foundation + 13 journey-adapter), including 2,000 engine scene simulations and 1,000 adapter scene journeys. These are NOT complete road trips. The existing 100 controlled fuel checks pass. JavaScript syntax and Bash syntax pass.

NOT VERIFIED locally: browser rendering. Chromium rejected the localhost page with ERR_BLOCKED_BY_ADMINISTRATOR; that restriction was not bypassed. Dedicated CI must run the original full-game browser regression, the prototype tests, and the new integration suite (payments, resume, layouts, zero-budget repair, storage failures, audio lifecycle, deadlines and save preservation).

NOT YET VERIFIED at commit preparation: signed Android candidate, native rotation/restart of the integrated stops, visual inspection, owner phone test. CI builds only after browser success and only uploads the phone candidate after native checks. Do not claim those stages passed until the actual run says so.

## Explicit remaining expansion work

The large chaos library, hidden careers/progression, meta presence, deep rabbit holes, motel/market expansion and new bespoke artwork remain future work. The repetitive under-seat cash discovery is still a separate backlog item. This is the integrated diner/tire vertical slice, not the whole proposed expansion. Owner approval of the exact final phone build remains required before any store submission.
