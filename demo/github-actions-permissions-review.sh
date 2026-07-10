#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/policydiff-actions-permissions"
REPORT_MD="${OUT_DIR}/github-actions-permissions.md"
REPORT_JSON="${OUT_DIR}/github-actions-permissions.json"

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

cd "${ROOT}"
npm run build >/dev/null

node dist/src/cli.js compare \
  fixtures/before/github-workflow.yml \
  fixtures/after/github-workflow.yml \
  --format markdown \
  --output "${REPORT_MD}"

node dist/src/cli.js compare \
  fixtures/before/github-workflow.yml \
  fixtures/after/github-workflow.yml \
  --format json \
  --output "${REPORT_JSON}"

grep -q 'github.permission.write' "${REPORT_MD}"
grep -q '"highestSeverity": "high"' "${REPORT_JSON}"

printf 'GitHub Actions permission report: %s\n' "${REPORT_MD}"
printf 'Machine-readable evidence: %s\n' "${REPORT_JSON}"
