# Google Play Data Safety Draft — Version 1.0

This is a preparation sheet for the Play Console Data safety form.

## Collection / sharing
- Data collected by the app: **No**
- Data shared with third parties: **No personal/user data**
- Account creation: **No**
- Advertising ID: **No**
- Analytics SDK: **No**
- Crash-reporting SDK: **No**
- Payment SDK / in-app purchases: **No**

## Local storage
The game stores save progress and settings locally on the device. Local-only app data is not transmitted to the developer.

## Routing request
The app may send the latitude/longitude of the player's manually selected start and destination cities to a public OSRM routing endpoint to calculate road distance/directions. These are user-selected game locations, not device GPS or inferred precise location.

## Permissions
- INTERNET — used only for optional routing requests. The game has an offline estimate fallback.
- No location permission.
- No camera, microphone, contacts, storage/media, phone, SMS, or advertising permissions.

Re-check this declaration before every release if ads, analytics, account login, cloud save, purchases, or telemetry are added.
