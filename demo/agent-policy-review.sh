#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${TMPDIR:-/tmp}/policydiff-agent-policy-demo"
json_report="${out_dir}/agent-policy.json"
markdown_report="${out_dir}/agent-policy.md"
explain_report="${out_dir}/agent-policy-explained.md"

cd "$repo_root"
mkdir -p "$out_dir"

npm run build >/dev/null

set +e
node dist/src/cli.js compare \
  fixtures/before/agent-policy.json \
  fixtures/after/agent-policy.json \
  --format json \
  --output "$json_report"
status=$?
set -e

if [ "$status" -ne 2 ]; then
  printf 'expected critical policy widening exit code 2, got %s\n' "$status" >&2
  exit 1
fi

set +e
node dist/src/cli.js compare \
  fixtures/before/agent-policy.json \
  fixtures/after/agent-policy.json \
  --format markdown \
  --output "$markdown_report"
status=$?
set -e

if [ "$status" -ne 2 ]; then
  printf 'expected Markdown compare exit code 2, got %s\n' "$status" >&2
  exit 1
fi

node dist/src/cli.js explain "$json_report" --format markdown --output "$explain_report"

grep -Fq 'critical' "$json_report"
grep -Fq 'guardrail.removed' "$json_report"
grep -Fq 'permission.widened' "$json_report"
grep -Fq 'policydiff report' "$markdown_report"
grep -Fq 'Reviewer notes' "$explain_report"

printf 'Policydiff agent policy demo files:\n'
printf '  %s\n' "$json_report"
printf '  %s\n' "$markdown_report"
printf '  %s\n' "$explain_report"
