#!/bin/bash
# Writes right-sized WebP copies of the site photos into assets/img/w/, named
# <photo>-<width>.webp. The build serves them through <picture> (JPEG stays the
# fallback) and skips any it cannot find, so this is an optimisation, never a
# requirement. Run it after adding or replacing a photo.
# Needs: cwebp (libwebp) and macOS sips. Without cwebp it says so and exits 0.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v cwebp >/dev/null || { echo "cwebp not found: skipping WebP (the site falls back to JPEG)."; exit 0; }
command -v sips >/dev/null || { echo "sips (macOS) not found: skipping WebP."; exit 0; }
OUT=assets/img/w; mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# source  name  widths...
make() {
  local src="assets/img/$1" name="$2"; shift 2
  local srcw; srcw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  for w in "$@"; do
    [ "$w" -gt "$srcw" ] && w=$srcw
    sips --resampleWidth "$w" "$src" --out "$TMP/r.jpg" >/dev/null
    cwebp -quiet -q 72 -m 6 "$TMP/r.jpg" -o "$OUT/$name-$w.webp"
  done
}
make margarita-cuesta-portrait-1200.jpg margarita-cuesta-portrait 480 720 960
make margarita-cuesta-seated-1200.jpg margarita-cuesta-seated 480 720 960
for f in assets/img/listing-*.jpg; do b=$(basename "$f" .jpg); make "$b.jpg" "$b" 640 960; done
make sold-304-spring-st-kitchen.jpg sold-304-spring-st-kitchen 680
ls -la "$OUT" | awk 'NR>1{printf "%7d  %s\n", $5, $9}'
