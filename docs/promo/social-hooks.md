# PolicyDiff Social Hooks

Grounded copy for public promotion. Use these with the checked-in fixtures and
demo script.

## Short hooks

- PolicyDiff turns JSON/YAML policy changes into a reviewer-ready risk summary.
- Demo arc: `read` becomes `read, exec`, approval flips off, and the report
  highlights the risky changes.
- The CLI can write JSON for automation and explain saved reports as Markdown.
- Critical detections intentionally use exit code `2`, so CI can distinguish
  risk from parser failure.

## Video prompt

Open `examples/agent-policy-before.json` and
`examples/agent-policy-after.json`, run
`bash demo/run-agent-policy-review.sh`, then show the saved report at
`/tmp/policydiff-agent-review.json`. The script compares temporary before/after
directories with matching basenames so the output focuses on field changes.
