# Google Play submission checklist

## Release identity

- Permanent package: `com.thirdemented.longwayhome.release2026`.
- Target API: 36. Minimum API: 26.
- Take the version and signed AAB from the final release and its SHA256SUMS.txt; do not upload an intermediate review artifact.
- Certificate fingerprint: see `signing-certificate.sha256`.
- Historical test certificate was exposed. The release uses a new private certificate. Old sideloaded beta installs require uninstall/reinstall and will lose local progress when uninstalled.

## Ready-to-use package contents

- STORE_LISTING.md: name, short and full description.
- icon-512.png and feature-graphic-1024x500.png.
- Actual game captures in portrait and landscape, including high-resolution store captures. No mockups are represented as gameplay.
- PRIVACY.md, DATA_SAFETY.md, CONTENT_RATING.md and APP_ACCESS.md.
- Release notes and separate QA evidence archive.

## Owner/account steps

The owner confirmed no upload and no Play App Signing enrollment yet. These actions require the owner's Play Console account and have not been represented as completed:

- Create the application under the permanent package and enroll in Play App Signing. Use the signed AAB; retain the private upload key securely. Do not use the historical beta key.
- Enter the publisher's real support email and other Console identity/contact fields.
- Provide a publicly reachable privacy policy URL. The repository's PRIVACY.md is public after the final branch is merged; a publisher-controlled policy webpage may be used instead.
- Review and submit Data safety declarations for the documented optional online routing flows.
- Complete IARC questionnaire based on actual fictional crime and simulated gambling content; use the assigned rating, not a guessed rating.
- Declare no ads and no login restriction. Select an appropriate non-child target audience.
- Upload the signed AAB to internal testing, resolve Play's pre-launch report, and complete any testing/verification requirements shown for this account.
- Submit production only after those account checks clear.

Prepared store assets and a GitHub release are not Google Play approval or a live store listing.
