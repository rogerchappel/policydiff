# PolicyDiff Social Hooks

Grounded source: `README.md`, `examples/agent-policy-before.json`, `examples/agent-policy-after.json`, and `demo/review-agent-policy-change.sh`.

## Short posts

1. Policy diffs are often too noisy for review. PolicyDiff turns JSON/YAML changes into a risk summary focused on permission widening, removed guardrails, tool access, and config exposure.

2. New demo: `bash demo/review-agent-policy-change.sh` compares checked-in before/after agent policy fixtures and writes Markdown, JSON, and explained reports under `/tmp`.

3. Exit code `2` in PolicyDiff means the compare ran and found a critical change. That makes it useful as a review gate without hiding the report reviewers need.

## Video angle

Start with the two agent policy fixtures, run the demo script, then show the Markdown report and the explained report. The story: noisy policy edits become a short review queue.
