# Alpha3 correctness repair loop

Owner request: test, find, fix, repeat. Work is limited to codex/chaos-phase1; main/build #104 and the delivered alpha2 APK remain unchanged. No merge or publication.

## Reproduced before editing

The independent alpha2 exploration again produced 8 passes and 10 failed expectations across 18 controlled checks. Sixty source-level road simulations had zero execution errors; these are NOT browser/phone playthroughs. Existing 66 engine/adapter/depth and 100 fuel checks passed. The new stricter 31 regression cases produced 7 passes and 24 failures against the old code.

## Implemented repairs, pending exact-source browser/native verification

- A2-REVIEW-01 and A2-EXP-04: explicit driving context for fatigue failure; voluntary rest action and a mandatory opportunity to choose free six-hour sleep before an exhausted driving leg. Refusing is still allowed and risky. Fuel stops cannot hide the opportunity. Parked repairs do not invent road crashes.
- A2-REVIEW-02: applicable failure checks precede arrival success. Floating-point tolerance is limited to 1e-10 days at the exact deadline boundary.
- A2-EXP-05: stable per-trip identity, ending save before lifetime finalization, and idempotent receipts stored atomically with lifetime totals. Failed lifetime writes remain retryable on reopening; corrupt records are preserved, not reset.
- A2-EXP-01: roadside cargo sales update the correct legal/underground income ledger once.
- A2-EXP-02: shortcuts shorten remaining route estimates instead of inventing driven miles; pending legs and future instruction mile positions are bounded to the adjusted route.
- A2-EXP-03: unavailable coolant/atlas actions are disabled and runtime-guarded. A retained old road-event handler cannot apply a second charge/reward. Failed story-entry storage can still be retried.
- A2-REVIEW-03: honest failed help is distinct from arranging professional help; later dialogue is accurate and gives no invented referral payment.
- A2-EXP-06: accepted replacement breakfast has breakfast's nutrition at the originally agreed meal price.
- A2-EXP-07: attraction fee is visible and obeys affordability.

## Local evidence

All 31 new regression cases passed on the repaired ordinary source. With unchanged prior tests, 97 engine/adapter/depth cases and 100 fuel checks passed. Syntax checks passed. Source functions are executed by a minimal DOM/audio test harness; no subjective sound/visual claims. Separate real-browser and signed-native regressions are added and must actually run before their status is reported as passed.

## Source transfer and release boundary

The existing hash-checked materializer applies the compact source recipe and commits ordinary files on the expansion branch before tests. All twelve target hashes were verified locally. ROADTEST correctly reports HOLD while the marker is present; it must later run on the materialized clean source. No credential or permission changes. Alpha3 uses versionCode 8 and versionName 1.2.0-alpha.3, never relabeling the old APK. The large meta/career/cascade scope and human phone/audio acceptance remain pending.
