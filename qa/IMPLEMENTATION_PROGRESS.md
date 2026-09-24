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

## Still required

Implement and visually review the trip timeline, actual-road map with agreed privacy safeguards, persistent windshield damage, layered driving environment, cockpit controls and animations, regional scenery/warnings and traffic events. Then repeat full browser and signed Android review, update evidence and only then advance the version and publish. The previous REVIEW.md is historical and explicitly superseded.
