# Agent Policy Review Demo

This demo uses the checked-in agent policy examples to show how PolicyDiff
turns config changes into a reviewer-oriented risk summary.

## Run the demo

```sh
bash demo/run-agent-policy-review.sh
```

The script builds the CLI, copies `examples/agent-policy-before.json` and
`examples/agent-policy-after.json` into temporary before/after directories with
the same basename, compares those directories, then saves and explains a JSON
report for the broader `fixtures/before` and `fixtures/after` directory
comparison.

PolicyDiff may exit with code `2` when a critical change is detected. The demo
script treats that as a successful detection path and only fails on CLI,
parsing, or script errors.

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
