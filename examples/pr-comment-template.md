# PolicyDiff PR Comment Template

Use this template when attaching the Markdown output from
`demo/review-agent-policy-change.sh` to a pull request.

````md
## PolicyDiff Review

Command:

```sh
bash demo/review-agent-policy-change.sh
```

Reports:

- `${TMPDIR:-/tmp}/policydiff-demo/agent-policy.md`
- `${TMPDIR:-/tmp}/policydiff-demo/agent-policy.json`
- `${TMPDIR:-/tmp}/policydiff-demo/agent-policy-explained.md`

Reviewer notes:

- Check any `critical` or `high` findings first.
- Confirm whether permission widening is intentional.
- Confirm whether removed guardrails have a replacement control.
- Treat exit code `2` as a review signal when the report was produced.
````
