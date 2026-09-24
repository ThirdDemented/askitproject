# The Long Way Home

A road-life survival game for Android, with illustrated automotive pixel art, finite preparation resources, used-car negotiations, road events, trading, local saves and lifetime records.

## Build and verify

The permanent application ID is `com.thirdemented.longwayhome.release2026`. Minimum Android API is 26; compile and target API are 36. The build uses JDK 17, Gradle 8.13 and the Android SDK 36 toolchain.

1. Install Python dependencies with `python -m pip install -r requirements-art.txt`.
2. Run `python scripts/rebuild_art.py` and `python scripts/launcher.py` to reconstruct artwork from retained, hashed originals.
3. Run `npm ci`, `npx playwright install chromium`, `npm run validate`, and `npm test`.
4. For a signed release, provide `LWH_KEYSTORE` (absolute path to the private PKCS12 file) and `LWH_KEY_PASSWORD` through the environment. The alias is `upload`. Run `gradle :app:assembleRelease :app:bundleRelease`. Never place credentials in source or command arguments.
5. On an API 36 emulator, run `bash qa/android_qa.sh`. Inspect all portrait and landscape captures, then complete the evidence in `qa/release-gates.json`.

The workflow produces review artifacts on branch pushes. Publishing requires a manual dispatch with `publish=true`, a successful build, and every recorded release gate matching the reviewed source. An ordinary push cannot publish a release. APK and AAB signatures are verified against `signing-certificate.sha256`.

## Artwork and QA

`art-source/manifest.json` retains generation prompts and source hashes. Every build recreates the same runtime images; it does not regenerate creative artwork. See `ART_DIRECTION.md`. QA injects test access only into the local test server response; production JavaScript does not expose test state.

The browser suite includes complete successful and failed UI playthroughs and separate explicit fixtures for each screen family. Fixture screenshots are labeled as such; they are not presented as playthrough evidence. Native Android checks run the signed APK, exercise process restart and rotation, and capture the actual WebView.

## Network and privacy

Built-in routes work with offline distance estimates. Online city search and road directions use Photon and OSRM over HTTPS, with timeouts and a distance fallback. They can be disabled in life setup. The game does not use device GPS. Provider availability is external and not guaranteed. See `PRIVACY.md` and the in-game privacy/credits dialog.

## Signing transition and Play submission

The historical test signing key was publicly tracked. Commercial builds use a new private certificate; the package ID is unchanged. Old sideloaded test installs cannot be updated in place with the new certificate. Do not reuse the historical key. The new key is held in encrypted repository secrets and a private, encrypted local backup outside this repository.

The owner confirmed the app has not been uploaded to Play or enrolled in Play App Signing. Store materials are prepared in `store/`; Play Console enrollment, the owner's support contact, content declarations and any account testing requirements remain owner/account submission steps. A GitHub release does not mean Google Play approval.
