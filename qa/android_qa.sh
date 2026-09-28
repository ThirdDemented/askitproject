#!/usr/bin/env bash
set -euo pipefail
PACKAGE=com.thirdemented.longwayhome.release2026
RUNNER="$PACKAGE.test/androidx.test.runner.AndroidJUnitRunner"
adb wait-for-device
adb shell getprop sys.boot_completed | grep -q 1
adb install app/build/outputs/apk/release/app-release.apk
adb install app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb shell input keyevent 82 || true
adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#screensAndRotation "$RUNNER" | tee android-smoke.log
grep -q 'OK (1 test)' android-smoke.log
adb shell am force-stop "$PACKAGE"
adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#resumeAfterProcessStop "$RUNNER" | tee resume-smoke.log
grep -q 'OK (1 test)' resume-smoke.log
adb pull "/sdcard/Android/data/$PACKAGE/files/qa/." .
test "$(stat -c%s road-portrait.png)" -gt 30000
test "$(stat -c%s road-landscape.png)" -gt 30000
echo 'Signed release UI, native rotation and process restart checks passed'
