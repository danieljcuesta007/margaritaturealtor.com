#!/bin/bash
# Publishes a noindex preview of the current branch to GitHub Pages, in a
# separate PUBLIC repo that contains only built pages (the source stays private).
#   ./scripts/publish-preview.sh            -> https://<owner>.github.io/margaritacuesta-preview/
# Needs: node, git, gh (logged in). Set PREVIEW_REPO=owner/name to use another repo.
set -euo pipefail
cd "$(dirname "$0")/.."
# Guard first: this force-pushes, so only ever target a repo named *-preview.
if [ -n "${PREVIEW_REPO:-}" ]; then REPO="$PREVIEW_REPO"; else REPO="$(gh api user -q .login)/margaritacuesta-preview"; fi
NAME="${REPO#*/}"
case "$NAME" in *-preview) ;; *) echo "Refusing: $REPO is not a *-preview repo" >&2; exit 1;; esac
OWNER="${REPO%%/*}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
node src/build.mjs "$TMP/site" --preview --base="/$NAME"
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --description "Preview of margaritacuesta.com (built pages only, not indexed)" >/dev/null
fi
cd "$TMP/site"
git init -q -b main
git add -A
git commit -q -m "Preview build of $(git -C "$OLDPWD" rev-parse --short HEAD 2>/dev/null || echo local)"
git push -q --force "https://github.com/$REPO.git" main
gh api "repos/$REPO/pages" >/dev/null 2>&1 || gh api -X POST "repos/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null
echo "Preview: https://$OWNER.github.io/$NAME/"
