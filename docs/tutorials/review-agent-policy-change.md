# Review an Agent Policy Change

This walkthrough uses the checked-in `examples/agent-policy-before.json` and `examples/agent-policy-after.json` fixtures to show how PolicyDiff summarizes risky policy drift for pull request review.

## Scenario

An agent policy changes between two revisions. The reviewer needs a concise summary of permission widening, removed guardrails, or newly exposed tool access before approving the change.

## Run the demo

```sh
npm install
bash demo/review-agent-policy-change.sh
```

The script builds the CLI, compares the before/after fixtures in Markdown and JSON formats, then runs `explain` against the JSON report.

Reports are written under `${TMPDIR:-/tmp}/policydiff-demo`:

- `agent-policy.md`
- `agent-policy.json`
- `agent-policy-explained.md`

## Use in review

Open the Markdown report first for a human-readable risk summary:

```sh
sed -n '1,160p' "${TMPDIR:-/tmp}/policydiff-demo/agent-policy.md"
```

Use the JSON report when a CI job or review bot needs structured evidence. The CLI may return exit code `2` when a critical change is detected; the demo treats that as an expected review signal rather than a runtime failure.

## Limitations

PolicyDiff is a deterministic reviewer assistant. It highlights likely-risky JSON/YAML changes, but the final approval decision still belongs to the team that owns the policy.
