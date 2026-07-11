# Review GitHub Actions Permission Changes

This tutorial uses two checked-in workflow fixtures to show how `policydiff`
flags widened GitHub Actions permissions.

## Run the Demo

```sh
npm install
bash examples/github-actions-permissions-demo.sh
```

The script stages these fixtures under the same temporary workflow path and
compares the two directories:

- `examples/github-actions-permissions-before.yml`
- `examples/github-actions-permissions-after.yml`

It writes a JSON report and a Markdown explanation under
`${TMPDIR:-/tmp}/policydiff-github-actions-demo`.

## What to Look For

The `after` workflow widens:

- `contents: read` to `contents: write`
- `pull-requests: read` to `pull-requests: write`

`policydiff` reports those as `github.permission.write` findings so a reviewer
can focus on the permission change instead of the full workflow text.

## Safety Notes

`policydiff` is a reviewer assistant, not a formal verifier. Use the report to
decide where to inspect first, then review the workflow and repository context
before approving the change.
