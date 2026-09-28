# Demo-feedback implementation progress

Release remains blocked. No version change or final build publication is authorized until all original and demo-feedback gates pass.

## Fuel corrections implemented

- Quotes now use the selected vehicle's tank capacity and a displayed fictional price per gallon instead of a flat price for every tank.
- Full and budget refills disclose actual cost, gallons, resulting percentage and estimated range before purchase. Cash-limited full refills are labeled PARTIAL REFILL, with a warning when range is insufficient for the planned next leg.
- Refills cannot charge for fuel beyond tank capacity. Zero-cash purchases are disabled; existing fuel is retained.
- The planned leg stays fixed while choosing fuel rather than rerolling its distance after every stop. Nonurgent fuel events have a distance cooldown, while genuinely insufficient range still warns.
- Running dry advances only as far as the remaining fuel supports and accounts for consumed gallons, elapsed driving time and mileage.
- Cash readouts preserve cents. Returning from trading to an unresolved fuel stop refreshes the quote against current cash.
- Controlled arithmetic checks cover all ten cars; browser tests exercise full/partial refills, the next leg, restart persistence and running dry.

## Journey overview and glass damage implemented

- The road interface now has a dedicated trip strip outside its scrolling controls, with named endpoints, current-position marker, completed miles, remaining miles and accessible progress values. It remains visible while road-event choices scroll in either orientation. Detailed-map interaction is still pending.
- A stone strike now immediately shows a glass fracture in the windshield. Ignoring it preserves damage through scene changes, rotation and save/reopen. It is drawn only over the windshield when the cockpit is visible.
- Players can pay for the original event repair or stop later for glass repair. The later repair costs $45 and 30 minutes, is disabled when unaffordable, records spending and clears the saved damage. Repaired glass stays clear after reopening.
- Automated spreading was not added; it was discussed as an optional idea rather than required behavior.
- Validation: 100 controlled fuel checks and 47 browser checks pass with 106 captures, a 1,528-mile successful run and a 486-mile failure, with no JavaScript exceptions. New damaged-windshield captures were manually inspected in portrait and landscape; the crack is confined to the glass and the overview stays visible while choices scroll. Android review of this revision remains pending.

## Still required

The driving environment, cockpit animation, regional scenery/warnings and traffic events are now implemented below. Complete signed Android visual review of this revision, live routing confirmation and the final evidence review before advancing the version or publishing. The previous REVIEW.md is historical and explicitly superseded.

## Cockpit interaction pass

- Added three original synthesized radio stations plus radio-off, with selection saved per journey. Reopening now resumes the road's selected music rather than incorrectly forcing title music.
- Added a short two-tone horn with repeat limiting, respecting global mute and without advancing game time or altering cash/distance.
- Added an instrument close-up, accessible from the DASH control and a dashboard tap target. It shows actual vehicle odometer plus journey mileage, trip miles, fuel/range, condition, and relevant low-fuel, service, fatigue and glass warnings. A clear return button closes it without losing the event.
- Controls remain accessible in portrait and landscape. The underlying dashboard art remains the existing shared cockpit; richer animated instruments and vehicle-specific interior families are not claimed complete.
- Prior fuel and glass/overview commits both passed the signed Android workflow. The latest cockpit revision still needs its Android run and final native visual review.
- Validation: 100 controlled fuel checks and 53 browser checks pass with 108 captures, both full journeys and no JavaScript exceptions. All seven effects, including the horn, produce unclipped signals. New dashboard captures were manually inspected in both orientations; the initial landscape layout hid lower readings, so it was replaced with a compact side-by-side layout and recaptured. Compact portrait road controls remain readable and scrollable.

## Geographic route map pass

- Added bundled public-domain Natural Earth geography. City setup now puts the U.S. map prominently beside the city controls in landscape and above them in portrait, with the life-planning illustration retained below the map. Map provenance is recorded in map-data.md.
- Optional preview draws the actual geometry returned by OSRM, with road mileage and driving duration. Offline/unavailable routes remain explicitly dashed endpoint estimates, never represented as road geometry. No map tiles, GPS or additional tracking providers are used.
- The always-visible trip overview opens a detailed map with a journey-position marker, remaining miles and estimated driving time. Stored road geometry survives reopening; road geography also informs nearby-market location. The marker estimates game progress rather than live position.
- City geocoding rejects street-number input and street/house results. The preview discloses the existing optional city/IP transmission to Photon and OSRM, and online mode can be disabled.
- Setup map and detailed map layout are included in the browser capture suite. Final Android visual review and live-service end-to-end confirmation remain part of the release gate.
- Validation: 100 controlled fuel checks and 60 browser checks pass with 112 captures and both complete journeys. New setup and detailed-map captures were manually inspected in both orientations; the short landscape setup map was reduced in height so the preview control stays visible. Controlled routing tests cover returned geometry, duration, position marker, persistence, online preview, offline labeling and rejection of street-number input. Synthetic route fixtures are test evidence, not claims of a real-world trip.

## Layered driving and traffic pass — September 27

- Added original high-desert and wooded-highway variants with the same cockpit and road perspective, plus an original transparent, unbranded oncoming sedan. The 30 retained sources have exact prompts and hashes; reconstruction now preserves sprite transparency. Region selection uses the game's existing route position, never GPS. These are broad stylized landscape families, not a photographic representation of individual roads.
- Split sky, left/right roadside, pavement, traffic and instruments into independent layers aligned to the source image under either orientation's crop. Clouds drift slowly; poles, fields and vegetation approach at different speeds from the road. Passing traffic stays on the oncoming side of the depicted two-lane road. No driving simulation or live traffic feed is claimed.
- Added live fuel and cruise-speed needles, an active radio display, a condition-triggered engine lamp and readable fuel/range, service and fatigue warnings. Fuel is never changed by animation. Cruise is a presentation of the game's existing 60-mph travel model; event decisions stop forward motion and show zero. All depth layers pause on backgrounding; reduced motion removes passing layers and retains the illustration.
- Added traffic-jam and non-graphic crash-closure events. Engine-off waiting takes the disclosed 45/90 minutes without consuming fuel. The signed alternative adds 18 future driving miles and 15 minutes; the body discloses the vehicle-specific future gallons. Detour mileage survives reopening, and the detailed map explains that its line remains the original planned route.
- Moved survival meters out of the landscape illustration after visual inspection found that they covered the newly active instruments. They remain in the scrolling controls, while the trip timeline stays fixed and the cockpit stays unobstructed.
- Validation: 100 controlled fuel checks and 74 browser assertions pass; 123 full-screen captures plus motion frames; a complete 1,528-mile success and 486-mile fuel failure; zero JavaScript exceptions. Visual inspection covered all three regional views in both orientations, oncoming traffic at two positions, warnings and traffic decisions. The pause test waits for the renderer to apply the pause before comparing frames. Signed Android verification of this revision is still required.

## Final review findings in progress

- The driving revision `d7908a0` passed workflow 36373308656, including private signature, API 36, UI controls, native rotation and process restart. Direct screenshot inspection nevertheless found a stale landscape frame on the rotated portrait setup screen. Added a native configuration-change surface refresh and per-capture horizontal-overflow assertions; the repaired Android screenshots must be reviewed before release.
- The real Champaign-to-Chicago city lookup exposed a Photon free-text suffix problem. Fixed city-only query filtering and provider-result validation; added a regression case with a business before the valid city. Nearby map endpoint labels no longer collide; the position marker has a separate explicit legend. The revised browser suite passes 75 assertions plus 100 fuel checks.
- Completed a real 134-mile route through the actual UI, including purchase, inspection, negotiation, supplies, cockpit controls, save/reopen, mechanical/weather decisions and final/lifetime reports. See LIVE_ROUTE_REVIEW.md and the retained report screenshot. These findings are not release approval; Android redraw repair and final evidence review remain open.

- Workflow 36374543428 (`4b3517f`) passed signed API 36 verification, native rotation and process restart. Opened all native captures: the rotated setup portrait now renders its complete portrait layout, with no stale landscape tile or blank lower frame. Screen bounds and scroll width agree with the portrait viewport.
- Reviewed every browser portrait/landscape contact sheet, all ten vehicle listings, compact/wide layouts, final reports, motion frames, traffic and store captures. Corrected a retained menu scroll position that cut off the title on returning in short landscape; new screens reset their inner scroll positions. Recaptured and inspected the repaired 800x360 title.
- Rain now dims/desaturates all synchronized road/scenery layers and adds a gray-blue overcast wash. Inspected the resulting heavy-rain capture. Corrected negative-zero full-tank pricing and explicitly states that an already-full tank needs no purchase; controlled tests cover this for every car.
- Latest local validation remains 100 controlled fuel cases, 75 browser assertions, 123 captures, completed success/failure journeys and zero runtime errors. The final small polish revision still needs signed Android verification before the release gates can be closed.
