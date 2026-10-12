#!/bin/bash
# Regenerates assets/img/og-margarita-cuesta.jpg (1200x630 share card) and
# assets/apple-touch-icon.png from the HTML templates beside this script.
# Needs Google Chrome; set CHROME to its binary if it is not in the default place.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || true)"
[ -n "$CHROME" ] || { echo "Chrome not found; set CHROME=/path/to/chrome" >&2; exit 1; }
TMP="$(mktemp -d)"
shot() { perl -e 'alarm 60; exec @ARGV' "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size="$2" --virtual-time-budget=4000 --screenshot="$3" "file://$PWD/scripts/$1" >/dev/null 2>&1; }
shot og.html 1200,630 "$TMP/og.png"
shot icon.html 180,180 "$TMP/icon.png"
sips -s format jpeg -s formatOptions 85 "$TMP/og.png" --out assets/img/og-margarita-cuesta.jpg >/dev/null
cp "$TMP/icon.png" assets/apple-touch-icon.png
rm -rf "$TMP"; echo "Images written."
