#!/bin/sh
# Publish the built site from the app repo (~/indie/Checker/site) to the GitHub Pages repo
# (~/indie/habit-forever-site → github.com/Atabany/habit-forever-site). Builds and validates first.
#   sh _ops/publish.sh "commit message"
set -eu
SITE="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${HF_SITE_REPO:-$HOME/indie/habit-forever-site}"
MSG="${1:-Update site}"
python3 "$SITE/_ops/build.py"
python3 "$SITE/_ops/validate.py"
git -C "$DEST" pull --ff-only -q
# Normally the GitHub Action (.github/workflows/deploy-site.yml) does this on every push to main.
# Mirror everything except the Pages repo's own git and README (CNAME and verification files live in site/).
rsync -a --delete --exclude .git --exclude README.md --exclude __pycache__ --exclude .DS_Store "$SITE/" "$DEST/"
cd "$DEST"
git add -A
if git diff --cached --quiet; then echo "nothing to publish"; exit 0; fi
git commit -q -m "$MSG"
git push -q origin main
git log --oneline -1
