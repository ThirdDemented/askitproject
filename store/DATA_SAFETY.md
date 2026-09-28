# Google Play Data Safety preparation

This sheet describes the current source. The owner must complete the Console form for the actual published app and review any provider or account changes before submission. Do not reuse the old blanket “no collection” answer: optional city/routing requests leave the device and providers log requests.

| Flow | Data and recipient | Purpose and control |
| --- | --- | --- |
| Local save | Progress, records and settings remain in WebView storage | Gameplay; clear app storage to erase |
| Custom city search | Entered city search text, IP address, HTTP metadata → Photon/komoot | App functionality; optional online routes switch |
| Road calculation | Selected cities' coordinates, IP address, HTTP metadata → public OSRM service | App functionality; optional online routes switch |
| Support | Only information the user chooses to submit outside the game | The selected support service's own policy |

Data collection: **Yes, through optional online functionality.** Disclose the search terms as in-app search history and request/network identifiers according to the current form's definitions. Selected city coordinates are fictional route inputs, not detected device GPS. Review whether any provider uses IP addresses to infer approximate location; the app itself does not. Do not claim ephemeral-only handling, since provider operational logs exist. Treat transfers conservatively as third-party sharing unless the owner has verified an applicable user-initiated transfer exemption.

Purpose: app functionality. Optional: yes, all players can disable online routes and play using built-in cities and estimated mileage. Encrypted in transit: HTTPS. No advertising, analytics, personalization or marketing. No account creation, account deletion requirement, Advertising ID, purchase SDK, device location permission, contacts, camera or microphone access. Local progress is not uploaded to the developer. Android system backup may operate under device settings.

This is a factual preparation record, not a submitted or approved Console declaration. Reference: [Google's Data safety definitions](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en). Provider logging references are in PRIVACY.md.
