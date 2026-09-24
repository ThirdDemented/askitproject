# The Long Way Home — commercial completion candidate

This candidate replaces the game’s remaining placeholder scenes with a coherent illustrated automotive pixel-art set, gives every market car its own illustration, and rebuilds the portrait and landscape interfaces for readable controls.

The game now preserves custom-city routes and unresolved decisions on resume, keeps the final trip report available after reopening, accounts for previously omitted road transactions, prevents unaffordable food/lodging/repair purchases, and resolves the low-fuel loop when a player declines a station. Visible scene motion, weather, steam, neon, gauges and transitions respect reduced-motion preferences. Audio pauses when the app leaves the foreground.

The package ID remains `com.thirdemented.longwayhome.release2026` and the Android target remains API 36. The first commercial release uses a fresh private signing key because the old test key was public. Existing test APKs cannot be updated in place with this new certificate; keep any test progress needed before uninstalling a test build.

Publication remains blocked until the full release-gate evidence is complete. This document does not assert that a candidate has passed those gates.
