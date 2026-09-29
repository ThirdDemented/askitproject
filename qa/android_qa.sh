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

# This test intentionally traverses multiple screens and performs native
# orientation changes. API 36 hosted emulators can take several minutes to
# settle during rotations, so give this comprehensive test a bounded 6-minute
# window within the bounded integrated Android QA stage.
timeout 360s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#screensAndRotation "$RUNNER" | tee android-smoke.log
grep -q 'OK (1 test)' android-smoke.log

adb shell am force-stop "$PACKAGE"
# The restart/persistence smoke test is narrower and should remain fast.
timeout 180s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#resumeAfterProcessStop "$RUNNER" | tee resume-smoke.log
grep -q 'OK (1 test)' resume-smoke.log

# Integrated encounters: real UI, native rotation, then process restart.
timeout 300s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#storyJourney "$RUNNER" | tee story-smoke.log
grep -q 'OK (1 test)' story-smoke.log
adb shell am force-stop "$PACKAGE"
timeout 180s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#storyResumeAfterProcessStop "$RUNNER" | tee story-resume-smoke.log
grep -q 'OK (1 test)' story-resume-smoke.log

timeout 240s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#storyDepth "$RUNNER" | tee depth-smoke.log
grep -q 'OK (1 test)' depth-smoke.log

timeout 180s adb shell am instrument -w -r -e class com.thelongwayhome.game.GameReleaseTest#correctnessRepairAndDeadline "$RUNNER" | tee correctness-smoke.log
grep -q 'OK (1 test)' correctness-smoke.log

timeout 60s adb pull "/sdcard/Android/data/$PACKAGE/files/qa/." .
test "$(stat -c%s road-portrait.png)" -gt 30000
test "$(stat -c%s road-landscape.png)" -gt 30000
test "$(stat -c%s diner-waiting-portrait.png)" -gt 30000
test "$(stat -c%s diner-waiting-landscape.png)" -gt 30000
test "$(stat -c%s tire-choice-portrait.png)" -gt 30000
echo 'Signed release UI, story interactions, native rotation and process restart checks passed' 
