# Live routing and manual journey — September 27, 2026

Reviewed the game through its actual browser controls on a separate loopback origin, with no injected game state or synthetic route responses. The browser pointer interface became unreliable; the remainder used native button keyboard activation. This was a browser-control limitation, not a confirmed game click defect; the automated Chrome and Android UI checks exercise clicks separately.

## Finding and correction

The real Photon query `Champaign, IL, USA` returned businesses named Murphy USA and other businesses rather than the municipality. The game rejected these address results correctly but incorrectly told the player the city could not be found. Changed the query to the documented U.S. country filter and city/locality layers, without appending USA to the free text. The client additionally accepts only a city layer or a named settlement type and validates finite coordinate bounds. A regression fixture puts a U.S. business before the valid city and verifies the city wins.

Provider reference: https://github.com/komoot/photon/blob/master/docs/api-v1.md

The revised live city lookup returned Champaign, Illinois. The optional OSRM preview returned **134 road miles and approximately 2.6 driving hours to Chicago**. Beginning the life first showed the clearly approximate 149-mile estimate, then updated preparation to the 134-mile road route. The detailed map displayed the saved real road geometry and later the progress marker at 102 miles with 32 remaining. Nearby endpoint labels were separated vertically after the first visual check found an overlap; the position legend is explicitly a marker key.

## Complete journey through controls

- Software Engineer / Just Leave; claimed the $4,000 relocation allowance.
- Selected the 2011 City Compact, inspected it, test-drove it, and bought the $85 independent inspection. The inspection identified motor-mount vibration and rear-bearing hum.
- Negotiated the asking price from $2,200 to $2,125, then bought the car.
- Bought toolkit, road food, atlas and coolant for $110 total.
- Departed with 100% fuel and $5,730; switched to Night Signal, tested the horn and dashboard, and opened the detailed map.
- Reloaded and resumed: the 134-mile route, money, fuel, vehicle and radio selection remained intact.
- Drove 49 miles, reaching 86% fuel, and used coolant for the temperature event. At 102 miles, fuel was 72%; repaired the wiper linkage with the toolkit during heavy rain. The trip strip and map agreed on 32 remaining miles.
- Arrived in Chicago at **134 miles**. The final report showed **4.5 gallons used, $2,320 spent, $5,730 remaining, $75 negotiated off and 2.6 driving hours**. These figures reconcile: $2,125 car + $85 inspection + $110 supplies = $2,320; 134/30 MPG rounds to 4.5 gallons.
- Lifetime records showed exactly one successful run, 134 miles and the matching expenses/fuel.

The actual report screenshot is retained as `qa/manual-review/live-route-report.png` and included in the evidence package. This live-service/manual pass supplements the controlled full success/failure runs, edge-case regression suite, and signed Android verification. It does not claim GPS navigation, live traffic, hardware-speaker listening, or every-device coverage.
