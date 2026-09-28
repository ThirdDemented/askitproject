# The Long Way Home — commercial completion candidate

This candidate replaces the game’s remaining placeholder scenes with a coherent illustrated automotive pixel-art set, gives every market car its own illustration, and rebuilds the portrait and landscape interfaces for readable controls.

The game now preserves custom-city routes and unresolved decisions on resume, keeps the final trip report available after reopening, accounts for previously omitted road transactions, prevents unaffordable food/lodging/repair purchases, and resolves the low-fuel loop when a player declines a station. Visible scene motion, weather, steam, neon, gauges and transitions respect reduced-motion preferences. Audio pauses when the app leaves the foreground.

Driving now has separately moving sky, roadside scenery and pavement, three regional landscape families, occasional illustrated oncoming traffic, active fuel/cruise instruments and condition warnings. The radio has three original stations plus off, alongside a horn and readable dashboard close-up. Windshield damage remains visible until repaired.

An always-visible trip strip opens the journey map. City setup includes a U.S. map, optional real-road preview and city-only search, with explicit privacy and offline-estimate disclosures. Fuel stops disclose the actual affordable gallons, cost, resulting tank level and range, clearly labeling partial refills. Traffic jams and road closures offer waiting or a signed detour with stated time and fuel implications.

The package ID remains `com.thirdemented.longwayhome.release2026` and the Android target remains API 36. The first commercial release uses a fresh private signing key because the old test key was public. Existing test APKs cannot be updated in place with this new certificate; keep any test progress needed before uninstalling a test build.

Publication remains blocked until the full release-gate evidence is complete. This document does not assert that a candidate has passed those gates.
