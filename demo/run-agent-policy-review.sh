#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run build

DEMO_ROOT="$(mktemp -d)"
trap 'rm -rf "$DEMO_ROOT"' EXIT
mkdir -p "$DEMO_ROOT/before" "$DEMO_ROOT/after"
cp examples/agent-policy-before.json "$DEMO_ROOT/before/agent-policy.json"
cp examples/agent-policy-after.json "$DEMO_ROOT/after/agent-policy.json"

echo "== PolicyDiff markdown review =="
code=0
node dist/src/cli.js compare "$DEMO_ROOT/before" "$DEMO_ROOT/after" --format markdown || code=$?
if [ "$code" != "0" ] && [ "$code" != "2" ]; then
  exit "$code"
fi

echo
echo "== PolicyDiff saved JSON + explanation =="
code=0
node dist/src/cli.js compare fixtures/before fixtures/after --format json --output /tmp/policydiff-agent-review.json || code=$?
if [ "$code" != "0" ] && [ "$code" != "2" ]; then
  exit "$code"
fi

node dist/src/cli.js explain /tmp/policydiff-agent-review.json --format markdown
echo
echo "Wrote /tmp/policydiff-agent-review.json"
