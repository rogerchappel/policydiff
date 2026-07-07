# Examples

Run a quick agent-policy review:

```bash
tmp="$(mktemp -d)"
mkdir -p "$tmp/before" "$tmp/after"
cp examples/agent-policy-before.json "$tmp/before/agent-policy.json"
cp examples/agent-policy-after.json "$tmp/after/agent-policy.json"
policydiff compare "$tmp/before" "$tmp/after" --format markdown
```

Save and explain JSON for a pull request comment:

```bash
policydiff compare fixtures/before fixtures/after --format json --output diff.json
policydiff explain diff.json --format markdown
```

Runnable demo:

```bash
bash demo/run-agent-policy-review.sh
```

See [Agent Policy Review Demo](../docs/tutorials/agent-policy-review.md) for a
recording-ready walkthrough grounded in these fixtures.
