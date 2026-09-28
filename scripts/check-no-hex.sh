#!/bin/sh
# Fails if a colour hex literal appears outside packages/tokens.
# Excluded on purpose: DESIGN.md front matter (a resolved summary of the tokens) and
# design/ (the reference rendering the tokens were extracted from).
set -eu
cd "$(dirname "$0")/.."
hits=$(grep -rnE '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.css' \
  --include='*.html' --include='*.rs' --include='*.json' --include='*.mdx' --include='*.svg' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=target --exclude-dir=dist \
  --exclude-dir=tokens --exclude-dir=design --exclude-dir=.context --exclude-dir=.superpowers \
  --exclude-dir=__snapshots__ . || true)
if [ -n "$hits" ]; then
  echo "raw hex outside packages/tokens:" >&2
  echo "$hits" >&2
  exit 1
fi
echo "check:hex ok"
