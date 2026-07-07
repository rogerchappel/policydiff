# Agent Policy Review Demo

This demo uses checked-in sanitized agent policy examples to show how PolicyDiff
turns config changes into a reviewer-oriented risk summary.

## Run the demo

```sh
bash demo/agent-policy-review.sh
```

The script builds the CLI, compares `fixtures/before/agent-policy.json` and
`fixtures/after/agent-policy.json`, and writes reports under:

```text
${TMPDIR:-/tmp}/policydiff-agent-policy-demo
```

For an alternate walkthrough based on the `examples/` fixtures, run:

```sh
bash demo/run-agent-policy-review.sh
```

That script copies `examples/agent-policy-before.json` and
`examples/agent-policy-after.json` into temporary before/after directories with
the same basename, compares those directories, then saves and explains a JSON
report for the broader `fixtures/before` and `fixtures/after` directory
comparison.

## Scenario

The checked-in policy fixture starts with a reviewer agent allowed to use `read`
and `web_search`, with `exec` denied and `requireApproval` enabled. The after
file adds `exec` to the allowed tools and disables approval.

`policydiff` should flag:

- `permission.widened` for the tool access change.
- `guardrail.removed` for the approval change.

The compare command exits `2` when a critical change is present. The demo treats
that as the expected result and fails for any other exit code.

## Manual commands

```sh
npm run build
tmp="$(mktemp -d)"
mkdir -p "$tmp/before" "$tmp/after"
cp examples/agent-policy-before.json "$tmp/before/agent-policy.json"
cp examples/agent-policy-after.json "$tmp/after/agent-policy.json"
node dist/src/cli.js compare "$tmp/before" "$tmp/after" --format markdown
node dist/src/cli.js compare fixtures/before fixtures/after --format json --output /tmp/policydiff-agent-review.json
node dist/src/cli.js explain /tmp/policydiff-agent-review.json --format markdown
```

## What to show in a recording

- The before file allows only `read` and keeps `requireApproval` enabled.
- The after file adds `exec` and disables `requireApproval`.
- The markdown output labels likely risk areas for review.
- The saved JSON path supports PR comments or downstream automation.

## Promotion angle

This is a compact PR-review story: compare sanitized before/after policy files,
save JSON for automation, save Markdown for humans, and explain the saved report
without exposing private policy data.
