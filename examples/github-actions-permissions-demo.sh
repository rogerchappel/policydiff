#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/policydiff-github-actions-demo"
BEFORE_DIR="$OUT_DIR/before"
AFTER_DIR="$OUT_DIR/after"

rm -rf "$OUT_DIR"
mkdir -p "$BEFORE_DIR/.github/workflows" "$AFTER_DIR/.github/workflows"
cd "$ROOT_DIR"

cp examples/github-actions-permissions-before.yml "$BEFORE_DIR/.github/workflows/ci.yml"
cp examples/github-actions-permissions-after.yml "$AFTER_DIR/.github/workflows/ci.yml"

npm run build

set +e
node dist/src/cli.js compare \
  "$BEFORE_DIR" \
  "$AFTER_DIR" \
  --format json \
  --output "$OUT_DIR/report.json"
compare_code=$?
set -e

if [ "$compare_code" -ne 0 ] && [ "$compare_code" -ne 2 ]; then
  exit "$compare_code"
fi

node dist/src/cli.js explain "$OUT_DIR/report.json" --format markdown --output "$OUT_DIR/explanation.md"

grep -q '"highestSeverity": "high"' "$OUT_DIR/report.json"
grep -q 'github.permission.write' "$OUT_DIR/report.json"
grep -q 'contents' "$OUT_DIR/explanation.md"

echo "JSON report: $OUT_DIR/report.json"
echo "Markdown explanation: $OUT_DIR/explanation.md"
