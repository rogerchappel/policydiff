# Examples

Run a quick agent-policy review:

```bash
policydiff compare examples/agent-policy-before.json examples/agent-policy-after.json --format markdown
```

Save and explain JSON for a pull request comment:

```bash
policydiff compare fixtures/before fixtures/after --format json --output diff.json
policydiff explain diff.json --format markdown
```
