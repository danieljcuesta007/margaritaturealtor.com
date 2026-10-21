#!/bin/bash
# Writes right-sized WebP copies of every photo in assets/img/ into assets/img/w/,
# named <photo>-<width>.webp, plus sources.json (which JPEG each set came from and
# its sha256). The build serves them through <picture> with the JPEG as fallback and
# skips any set whose JPEG has changed since, so this is an optimisation, never a
# requirement. Run it after adding, replacing or removing a photo.
# Needs: cwebp (libwebp), macOS sips and shasum. Without cwebp it says so and exits 0.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v cwebp >/dev/null || { echo "cwebp not found: skipping WebP (the site falls back to JPEG)."; exit 0; }
command -v sips >/dev/null || { echo "sips (macOS) not found: skipping WebP."; exit 0; }
OUT=assets/img/w
rm -rf "$OUT"; mkdir -p "$OUT"          # rebuilt from scratch: removed photos leave nothing behind
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
dim() { sips -g "$2" "$1" | awk -v k="$2" '$1==k":"{print $2}'; }
manifest="{"
for src in assets/img/*.jpg; do
  file=$(basename "$src"); name=${file%.jpg}
  case "$name" in og-*) continue;; esac                 # the share card is never shown on a page
  [ -n "$(ls "$OUT/${name%-*}"-*.webp 2>/dev/null)" ] && [[ "$name" =~ -(640|1200)$ ]] && continue
  if [[ "$name" =~ -(640)$ ]]; then continue; fi        # the -640 copy is a smaller duplicate of -1200
  name=${name%-1200}
  w=$(dim "$src" pixelWidth); h=$(dim "$src" pixelHeight)
  if [ "$h" -gt "$w" ]; then widths="480 720 960 1200"; else widths="320 640 960"; fi
  for n in $widths; do
    [ "$n" -gt "$w" ] && n=$w
    [ -f "$OUT/$name-$n.webp" ] && continue
    sips --resampleWidth "$n" "$src" --out "$TMP/r.jpg" >/dev/null
    cwebp -quiet -q 72 -m 6 "$TMP/r.jpg" -o "$OUT/$name-$n.webp"
  done
  sha=$(shasum -a 256 "$src" | awk '{print $1}')
  manifest="$manifest\n  \"$name\": { \"file\": \"$file\", \"sha256\": \"$sha\" },"
done
printf '%b\n}\n' "${manifest%,}" > "$OUT/sources.json"
ls -la "$OUT" | awk 'NR>3{printf "%7d  %s\n", $5, $9}'
