# Agent Policy Review Demo

This demo compares two sanitized agent policy files and produces both JSON and
Markdown review artifacts.

## Run it

```bash
npm install
bash demo/agent-policy-review.sh
```

The script writes reports under:

```text
${TMPDIR:-/tmp}/policydiff-agent-policy-demo
```

## Scenario

The checked-in fixture starts with a reviewer agent allowed to use `read` and
`web_search`, with `exec` denied and `requireApproval` enabled. The after file
adds `exec` to the allowed tools and disables approval.

`policydiff` should flag:

- `permission.widened` for the tool access change.
- `guardrail.removed` for the approval change.

The compare command exits `2` when a critical change is present. The demo treats
that as the expected result and fails for any other exit code.

## Promotion angle

This is a compact PR-review story: compare sanitized before/after policy files,
save JSON for automation, save Markdown for humans, and explain the saved report
without exposing private policy data.
