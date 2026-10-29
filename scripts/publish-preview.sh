#!/bin/bash
# Publishes a noindex preview of the current branch to Cloudflare Pages, straight from
# this repo (no second repo; the source stays private).
#   ./scripts/publish-preview.sh            -> https://margaritaturealtor-preview.pages.dev/
# Needs: node + npx (wrangler runs through npx) and a Cloudflare login (`npx wrangler login`).
# If the login sees more than one Cloudflare account, set CLOUDFLARE_ACCOUNT_ID.
# Set PREVIEW_PROJECT=name to publish to another Pages project.
set -euo pipefail
cd "$(dirname "$0")/.."
# Guard first: a deploy replaces what is live, so only ever target a project named *-preview.
NAME="${PREVIEW_PROJECT:-margaritaturealtor-preview}"
case "$NAME" in *-preview) ;; *) echo "Refusing: $NAME is not a *-preview project" >&2; exit 1;; esac
WRANGLER=(npx --yes wrangler@4.112.0)
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
node src/build.mjs "$TMP/site" --preview
if ! "${WRANGLER[@]}" pages project list 2>/dev/null | grep -q "│ $NAME "; then
  "${WRANGLER[@]}" pages project create "$NAME" --production-branch main >/dev/null
fi
"${WRANGLER[@]}" pages deploy "$TMP/site" --project-name "$NAME" --branch main \
  --commit-hash "$(git rev-parse HEAD 2>/dev/null || echo local)" --commit-dirty=true >/dev/null
echo "Preview: https://$NAME.pages.dev/"
