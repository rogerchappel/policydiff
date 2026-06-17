# Video Brief: Review an Agent Policy Diff

## Angle

Start with a noisy before/after agent policy change and use PolicyDiff to turn
it into Markdown, JSON, and explained reports for pull request review.

## Grounded product facts

- PolicyDiff compares JSON and YAML files or directories.
- It highlights likely-risky changes such as permission widening, removed
  guardrails, tool access changes, and network or secret-adjacent exposure.
- It can emit text, Markdown, and JSON reports.
- Exit code `2` means the compare succeeded and found a critical change.
- The checked-in demo uses `examples/agent-policy-before.json` and
  `examples/agent-policy-after.json`.

## Demo flow

1. Open the two `examples/agent-policy-*.json` fixtures side by side.
2. Run `bash demo/review-agent-policy-change.sh`.
3. Show `${TMPDIR:-/tmp}/policydiff-demo/agent-policy.md`.
4. Show `${TMPDIR:-/tmp}/policydiff-demo/agent-policy-explained.md`.
5. Call out that PolicyDiff is a deterministic reviewer assistant, not a formal
   policy verifier.

## Short hooks

- "Policy diffs are easier to review when permission widening floats to the top."
- "Exit code 2 is not a crash; it is PolicyDiff saying a critical change needs review."
- "Markdown for humans, JSON for bots, same checked-in fixture."
