#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="/tmp/policydiff-demo"
REPORT_JSON="$OUT_DIR/policy-review.json"
REPORT_MD="$OUT_DIR/policy-review.md"

cd "$ROOT"
mkdir -p "$OUT_DIR"

npm run build

set +e
node dist/src/cli.js compare fixtures/before fixtures/after --format json --output "$REPORT_JSON"
status=$?
set -e

if [ "$status" -ne 0 ] && [ "$status" -ne 2 ]; then
  echo "policydiff compare failed with exit code $status" >&2
  exit "$status"
fi

node dist/src/cli.js explain "$REPORT_JSON" --format markdown --output "$REPORT_MD"
node -e "const fs=require('node:fs'); const report=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!report.summary || !Array.isArray(report.files) || !report.files.some((file) => Array.isArray(file.changes) && file.changes.length > 0)) process.exit(1);" "$REPORT_JSON"

echo "JSON report: $REPORT_JSON"
echo "Markdown explanation: $REPORT_MD"
echo "Compare exit code: $status"
