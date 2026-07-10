# GitHub Actions Permission Review Hooks

## Short posts

1. A workflow permission change from `read` to `write` is easy to miss in a big
   pull request. `policydiff` turns that YAML diff into a reviewer-ready risk
   line.

2. The smallest useful config review demo: compare two GitHub Actions workflow
   files and highlight `contents: read` becoming `contents: write`.

3. Agent safety reviews need concrete evidence. `policydiff` can save Markdown
   and JSON reports for the same permission-widening fixture.

## Demo angle

Run:

```sh
bash demo/github-actions-permissions-review.sh
```

The script compares `fixtures/before/github-workflow.yml` and
`fixtures/after/github-workflow.yml`, then checks that the report includes the
`github.permission.write` rule.

## Best clip

Show the before/after `permissions` block, run the script, then open the
Markdown report where `contents` and `pull-requests` are both marked high
severity.
