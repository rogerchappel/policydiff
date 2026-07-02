# PolicyDiff Social Hooks

Grounded source: `README.md`, `examples/agent-policy-before.json`,
`examples/agent-policy-after.json`, `demo/run-agent-policy-review.sh`, and
`demo/review-agent-policy-change.sh`.

## Short hooks

- PolicyDiff turns JSON/YAML policy changes into a reviewer-ready risk summary.
- Demo arc: `read` becomes `read, exec`, approval flips off, and the report
  highlights the risky changes.
- The CLI can write JSON for automation and explain saved reports as Markdown.
- Critical detections intentionally use exit code `2`, so CI can distinguish
  risk from parser failure.

## Short posts

1. Policy diffs are often too noisy for review. PolicyDiff turns JSON/YAML changes into a risk summary focused on permission widening, removed guardrails, tool access, and config exposure.

2. New demo: `bash demo/review-agent-policy-change.sh` compares checked-in before/after agent policy fixtures and writes Markdown, JSON, and explained reports under `/tmp`.

3. Exit code `2` in PolicyDiff means the compare ran and found a critical change. That makes it useful as a review gate without hiding the report reviewers need.

## Video angle

Open `examples/agent-policy-before.json` and
`examples/agent-policy-after.json`, run
`bash demo/run-agent-policy-review.sh`, then show the saved report at
`/tmp/policydiff-agent-review.json`. The script compares temporary before/after
directories with matching basenames so the output focuses on field changes.

Start with the two agent policy fixtures, run the demo script, then show the Markdown report and the explained report. The story: noisy policy edits become a short review queue.
