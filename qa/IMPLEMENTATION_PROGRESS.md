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

Implement the actual-road map with agreed privacy safeguards and timeline interaction, layered driving environment, cockpit controls and animations, regional scenery/warnings and traffic events. Then repeat full browser and signed Android visual review, update evidence and only then advance the version and publish. The previous REVIEW.md is historical and explicitly superseded.
