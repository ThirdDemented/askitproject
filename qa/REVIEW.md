# Completion review including demo feedback — September 28, 2026 UTC

Candidate: `f93b7d116abcce6e83fa8bcba146c58e1c57e66d`. Canonical source digest: `f041af422a6bfae438ce87d5409f1b2370b5e244f1d7c4cffb05d81fae950b6c`. Version-only metadata is excluded from that digest. The authoritative publication decision remains `release-gates.json`.

**Review passed.** Final candidate workflow 36375175732 succeeded. All native portrait/landscape captures were opened and inspected, the repaired setup rotation remains correct, signatures and API 36 match, and its packaged source digest exactly matches the value above. The earlier repair was independently verified in workflow 36374543428. Version 1.1.0 may now be built and published through the gated workflow; no game-content change is permitted without renewed review.

## Current visual and gameplay evidence

- Opened all 123 browser captures, including full-size images and contact sheets. All core families, ten vehicle listings, long-form/choice details and reports were inspected in portrait and landscape. Additional compact/wide layouts and store-size captures were reviewed. No remaining overlap, missing art, blank frame or unreadable control was observed. Long choices scroll; the driving timeline stays fixed.
- Thirty original retained sources reconstruct lossless runtime art with exact prompts/hashes. New desert/forest cockpits and a transparent unbranded oncoming car preserve the approved visibly retro style. Three regional views were inspected in both orientations, with successive motion frames and two traffic positions. Sky, roadsides, pavement, gauges, radio and condition lights animate independently; pause and reduced-motion behavior are tested.
- `manual-review/driving-preview.webm` records the actual UI at 1280x720 after an ordinary purchase/departure/resume, without injected test state. It includes roughly 15 seconds of driving motion and passing traffic. This silent video demonstrates animation, not audio quality.
- Latest local results: 100 controlled fuel cases across ten cars, 75 browser assertions, 123 captures, zero runtime exceptions, a complete 1,528-mile successful run and a 486-mile fuel failure. Full runs use UI choices without state injection during the run; explicit fixtures separately cover rare events.
- Checks cover finite possessions, money preparation, inspection/test drive/three-attempt negotiation, supplies, survival/events, service affordability, trading/stock, underground/Heat, legacy saves, unresolved decisions, rotation, restart and exactly-once final/lifetime records. Fuel tests cover actual gallons/cents, partial/zero-cash/full purchases, warning range, no overfill, stop cooldown and precise running-dry distance/time. Glass damage persists until an affordable repair. Radio selection persists, horn is non-destructive, dashboard values use real state, and traffic detours do not charge fuel twice.
- Completed a manual live Champaign-to-Chicago journey: 134 road miles, negotiated purchase, supplies, cockpit controls, reload/resume, coolant/rain decisions, arrival and reports. Final totals: 4.5 gallons used, $2,320 spent, $5,730 remaining, $75 negotiated off. See LIVE_ROUTE_REVIEW.md and the retained report screenshot. Live city lookup exposed and fixed the provider-query suffix problem; fixtures additionally test business/foreign/address rejection, geometry/duration persistence and offline mode with no provider requests.
- Audio tests sample unclipped original music and all seven effects, including horn, plus mute persistence and lifecycle pause/resume. Manual UI play exercised radio/horn. This is signal/interaction testing, not a claimed hardware-speaker listening session; the Android emulator has audio output disabled.

## Findings corrected during this review

Moved survival meters out of the cockpit; separated close map labels and position legend; reset inner scroll positions when entering screens after the short-landscape title returned partially scrolled; applied overcast rain lighting to every moving layer; and replaced negative-zero/full-tank refill wording with an explicit no-purchase-needed message. Recaptured and inspected the repaired screens.

Direct native inspection caught a rotated setup screen retaining a stale landscape tile despite passing automation. Native configuration refresh fixed it: the replacement portrait capture fills the viewport with the correct map/form layout, and width metadata agrees. Workflows 36374543428 and 36375175732 verified signatures, API 36, native rotation and process-stop/reopen; both sets of native captures were inspected.

The inspected store kit includes actual game captures, icon/feature graphic and current listing/privacy/rating/app-access guidance. APK/AAB use the private certificate and permanent package `com.thirdemented.longwayhome.release2026`; no secrets are packaged. Play enrollment, real publisher fields and account-specific testing/submission remain owner steps, not claimed completed.

## Deliberate scope

Regional scenery is stylized, not exact roadside photography. The cockpit is shared across cars with accurate vehicle-specific values. Distinct interior families and progressively spreading cracks were discussed as possibilities and are not claimed implemented. Fictional detours change future distance/time while the map discloses that it retains the original road geometry. No GPS, live traffic feed or live-navigation accuracy is claimed.

---

# Historical pre-feedback commercial review

**Superseded by demo feedback. This is historical evidence for the pre-feedback candidate, not approval of the current game. See DEMO_FEEDBACK.md and the still-blocked release gates.**

Review date: 2026-09-23. Reviewer: Codex, including direct visual inspection of the captured images and manual browser play. This records the scope actually tested; it is not a Google Play approval or a claim of coverage of every Android device.

## Reviewed game content

Game-content commit: `dd5cc47dae1d738597fc1e439d891f8eba97aaa0`.

Canonical source digest: `bad6f51c18c3939487e614d674eb1225170dd2546b9317f19b8bd8431065804a`. The digest includes main application source, decoded runtime artwork, retained-source manifest and reconstruction configuration; version-only metadata is excluded so the version can be advanced after this review.

The final illustration set contains 27 retained original PNGs with exact generation prompts and SHA-256 hashes. The art reconstruction builds lossless runtime images from these retained sources without calling an image generator. Ten fictional, unbranded vehicle designs replace manufacturer names and previous vehicle artwork. Historic model names occur only in save migration. Lighting varies between clear daytime, overcast, rain, practical interior light and night; sunset is used for the title and icon. Pixel clusters and stepped edges remain visibly retro.

## Visual review

All 102 browser captures were opened for visual inspection, including full-size source images and contact sheets. The core loop was reviewed at 390x844 and 844x390: title, setup, preparation, classifieds, seller, negotiation, supplies, driving, fuel, food, motel, mechanic, rest, police/Heat, trading, underground, Trip Computer, lifetime records, arrival and failure. Scrolled detail captures cover long forms, prices, negotiation offers and records. All ten vehicle listings were separately inspected in both orientations.

Additional title, seller, road and Trip Computer captures cover 360x800, 800x360 and 1280x720. Store captures show the actual interface at 1080x1920 and 1920x1080. The 512px icon and 1024x500 feature graphic were inspected separately. Long content scrolls inside its panel in landscape and naturally in portrait. No missing scene, overlapping text, obscured choice or placeholder car graphic was observed in the reviewed captures. Vehicle artwork uses a deliberate matte where necessary to preserve the complete body in landscape.

Findings corrected during review include clipped vehicle ends, asynchronous image swaps, Android transition frames captured too early, Android navigation-bar overlap, raw route instruction enums, steam placement and a weather caption that lagged behind its effects. Captures were repeated after the relevant fixes.

## Gameplay and persistence

`qa/game-qa.cjs` passed 35 assertions with 102 captured images and no JavaScript runtime exceptions. Its two complete journeys use real interface choices without state injection during the run: a 1,528-mile successful move (58 steps, $4,899 remaining, 73% vehicle condition) and a 486-mile failure from running out of fuel. Explicit state fixtures are used separately for scene coverage and targeted edge cases; those fixtures are not represented as completed playthroughs.

A separate manual browser journey from Peoria to Chicago used the live 167-mile road route. The reviewer claimed relocation funds, inspected and test-drove the Family LX, paid the mechanic, negotiated the purchase from $2,300 to $2,175, bought supplies, reloaded and resumed on the road, made road-event choices and reached Chicago. The final report showed 167 miles, $2,370 spent, $5,776 remaining and $125 negotiated off. Current and lifetime reports were checked through their controls.

Targeted assertions cover finite possession sales; preparation funds; inspection, test drive and the three-attempt negotiation cap; supplies; survival statistics and events; unaffordable lodging; legal/gray trading cash and stock; underground discovery, purchases, sales, Heat and profit; arbitrary U.S. city responses and persisted coordinates; rejection of foreign city results; online road mileage/instructions; offline mode making no provider requests; pending decisions across restart; old model-name migration preserving inventory, money, condition, distance and seller attempts; rotation preserving state; completed-report reopening and exactly-once lifetime totals.

## Motion and audio

Road motion was checked in three different rendered frames and during manual play. Scene/page transitions, gauges, buttons, idle lighting, motel/underground neon, weather and relevant steam effects were inspected alongside the scenes. Reduced-motion preferences disable animated layers; backgrounding pauses motion and audio.

Web Audio tests verify music starts after interaction, samples an audible unclipped signal, separately samples all six effects (UI, cash, car, bad event, police, win), checks suspend/resume on application lifecycle changes and confirms mute persists after reopening. This is signal and behavior verification; no claim of a separate hardware-speaker listening session is made.

## Android and distribution

Final signed Android review is pending. The authoritative final status is `qa/release-gates.json`; publication remains blocked while any gate is missing.

The permanent package is `com.thirdemented.longwayhome.release2026`, targeting API 36. The historical public beta certificate has been replaced with a private signing key. Its public fingerprint is stored in `signing-certificate.sha256`; no private signing material is included in the repository or evidence archive. Existing beta installs signed with the old certificate require uninstall/reinstall, which deletes local progress.

Play Store preparation includes actual gameplay screenshots, icon, feature graphic, listing copy, privacy documentation, Data safety guidance, content-rating guidance and app-access instructions. Play App Signing enrollment, publisher contact details, Console declarations, account-specific testing and store submission remain owner/account actions documented in `store/PLAY_CONSOLE_CHECKLIST.md`.
