#!/usr/bin/env bash
set -euo pipefail

ART_DIR="app/src/main/assets/www/art"
SRC_DIR="art_b64"
mkdir -p "$ART_DIR"

cat "$SRC_DIR"/drive-landscape.*.b64 | tr -d '\n\r ' | base64 --decode > "$ART_DIR/drive-landscape.webp"
cat "$SRC_DIR"/drive-portrait.*.b64 | tr -d '\n\r ' | base64 --decode > "$ART_DIR/drive-portrait.webp"

test "$(stat -c%s "$ART_DIR/drive-landscape.webp")" -gt 20000
test "$(stat -c%s "$ART_DIR/drive-portrait.webp")" -gt 20000

file "$ART_DIR/drive-landscape.webp" | grep -q "Web/P image"
file "$ART_DIR/drive-portrait.webp" | grep -q "Web/P image"

echo "Rebuilt high-detail cockpit artwork:"
file "$ART_DIR/drive-landscape.webp"
file "$ART_DIR/drive-portrait.webp"
