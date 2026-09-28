#!/usr/bin/env bash
set -euo pipefail
PACKAGE=com.thirdemented.thelongwayhome
RUNNER="$PACKAGE.test/androidx.test.runner.AndroidJUnitRunner"

diagnostics() {
  echo '=== Android QA diagnostics ==='
  adb devices -l || true
  adb shell getprop sys.boot_completed || true
  adb shell pm list instrumentation || true
  adb shell dumpsys activity activities | tail -n 120 || true
  adb logcat -d -t 500 || true
}
trap diagnostics ERR

timeout 90s adb wait-for-device
for _ in {1..45}; do
  [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] && break
  sleep 2
done
[[ "$(adb shell getprop sys.boot_completed | tr -d '\r')" == "1" ]]

adb install -r app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb shell input keyevent 82 || true
adb shell pm list instrumentation | grep -F "$RUNNER"

timeout 180s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#screensAndRotation "$RUNNER" | tee android-smoke.log
grep -q 'OK (1 test)' android-smoke.log

adb shell am force-stop "$PACKAGE"
timeout 180s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#resumeAfterProcessStop "$RUNNER" | tee resume-smoke.log
grep -q 'OK (1 test)' resume-smoke.log

timeout 60s adb pull "/sdcard/Android/data/$PACKAGE/files/qa/." .
test "$(stat -c%s road-portrait.png)" -gt 30000
test "$(stat -c%s road-landscape.png)" -gt 30000
echo 'Signed release UI, native rotation and process restart checks passed'
