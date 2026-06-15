#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build

report_dir="${TMPDIR:-/tmp}/policydiff-demo"
mkdir -p "$report_dir"

set +e
node dist/src/cli.js compare examples/agent-policy-before.json examples/agent-policy-after.json --format markdown --output "$report_dir/agent-policy.md"
markdown_status=$?
node dist/src/cli.js compare examples/agent-policy-before.json examples/agent-policy-after.json --format json --output "$report_dir/agent-policy.json"
json_status=$?
set -e

for status in "$markdown_status" "$json_status"; do
  if [ "$status" -ne 0 ] && [ "$status" -ne 2 ]; then
    echo "policydiff compare failed unexpectedly with exit code $status" >&2
    exit "$status"
  fi
done

node dist/src/cli.js explain "$report_dir/agent-policy.json" --format markdown > "$report_dir/agent-policy-explained.md"

grep -Eq "permission|guardrail|critical|high|tool" "$report_dir/agent-policy.md"
grep -Eq "Summary|change" "$report_dir/agent-policy-explained.md"

echo "PolicyDiff demo reports written to $report_dir"
