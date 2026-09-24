#!/usr/bin/env bash
set -euo pipefail

APK="app/build/outputs/apk/release/app-release.apk"

dismiss_system_dialogs() {
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  XML="$(adb shell cat /sdcard/window.xml 2>/dev/null | tr -d '\r' || true)"
  if echo "$XML" | grep -q "Quickstep isn"; then
    BOUNDS="$(echo "$XML" | grep -o 'text="Wait"[^>]*bounds="\[[0-9,]*\]\[[0-9,]*\]"' | grep -o 'bounds="[^"]*"' | head -1 | cut -d'"' -f2 || true)"
    if [ -n "$BOUNDS" ]; then
      read X1 Y1 X2 Y2 <<<"$(echo "$BOUNDS" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1 \2 \3 \4/')"
      adb shell input tap $(( (X1+X2)/2 )) $(( (Y1+Y2)/2 ))
      sleep 2
    else
      adb shell input keyevent 4 || true
      sleep 2
    fi
  fi
}

capture() {
  local name="$1"
  dismiss_system_dialogs
  adb exec-out screencap -p > "$name"
  test "$(stat -c%s "$name")" -gt 30000
}

adb wait-for-device
adb shell getprop sys.boot_completed | grep -q 1
adb install "$APK"

# Seller screen — landscape
adb logcat -c
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez smokeTest true --es smokeMode seller --ez forceLandscape true
sleep 7
adb logcat -d -s LWH_SMOKE:I LWH_SELLER_SMOKE:I '*:S' | tee seller-smoke.log
grep -q "LWH_SMOKE: true" seller-smoke.log
grep -q "LWH_SELLER_SMOKE: true" seller-smoke.log
capture seller-landscape.png

# Road screen — landscape
adb shell am force-stop com.thirdemented.longwayhome.release2026
adb logcat -c
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez smokeTest true --es smokeMode road --ez forceLandscape true
sleep 9
adb logcat -d -s LWH_ROAD_SMOKE:I LWH_TRIPLOG_SMOKE:I '*:S' | tee road-land-smoke.log
grep -q "LWH_ROAD_SMOKE: true" road-land-smoke.log
grep -q "LWH_TRIPLOG_SMOKE: true" road-land-smoke.log
capture road-landscape.png

# Road screen — portrait
adb shell am force-stop com.thirdemented.longwayhome.release2026
adb logcat -c
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez smokeTest true --es smokeMode road --ez forcePortrait true
sleep 9
adb logcat -d -s LWH_ROAD_SMOKE:I LWH_TRIPLOG_SMOKE:I '*:S' | tee road-port-smoke.log
grep -q "LWH_ROAD_SMOKE: true" road-port-smoke.log
grep -q "LWH_TRIPLOG_SMOKE: true" road-port-smoke.log
capture road-portrait.png

# Clean title — portrait
adb shell am force-stop com.thirdemented.longwayhome.release2026
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez forcePortrait true
sleep 5
capture title-portrait.png

# The actual release APK survives a process stop and resumes its saved road run.
adb shell am force-stop com.thirdemented.longwayhome.release2026
adb logcat -c
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez resumeTest true --ez forcePortrait true
sleep 4
adb logcat -d -s LWH_RESUME:I '*:S' | tee resume-smoke.log
grep -q 'LWH_RESUME: true' resume-smoke.log
capture resume-portrait.png

# Exercise the real native rotation bridge in both directions.
adb shell am force-stop com.thirdemented.longwayhome.release2026
adb logcat -c
adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez smokeTest true --ez rotationTest true --ez forceLandscape true || \
  adb shell am start -W -n com.thirdemented.longwayhome.release2026/com.thelongwayhome.game.MainActivity --ez smokeTest true --ez rotationTest true --ez forceLandscape true
sleep 14
adb logcat -d -s LWH_ROTATION_PORTRAIT:I LWH_ROTATION_LANDSCAPE:I '*:S' | tee rotation-smoke.log
grep -q 'LWH_ROTATION_PORTRAIT: true' rotation-smoke.log
grep -q 'LWH_ROTATION_LANDSCAPE: true' rotation-smoke.log
capture rotation-landscape.png
