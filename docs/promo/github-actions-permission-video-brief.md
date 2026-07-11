# Policydiff GitHub Actions Permission Video Brief

## Working Title

Catch the one-line workflow permission change reviewers miss.

## Demo Promise

Show `policydiff` comparing two GitHub Actions workflow files and surfacing
permission widening as reviewer-ready JSON and Markdown.

## 45-Second Outline

1. Show the before workflow with `contents: read` and `pull-requests: read`.
2. Show the after workflow with both permissions widened to `write`.
3. Run `bash examples/github-actions-permissions-demo.sh`.
4. Open the JSON report and point to `github.permission.write`.
5. Open the Markdown explanation as a pull-request-comment-ready summary.

## Grounded Claims

- `policydiff compare` accepts YAML files.
- JSON and Markdown output formats are supported.
- Widened GitHub Actions permissions are classified as permission-widening
  findings when the before and after inputs share the same relative path.
- Critical findings exit with code `2`; this demo accepts `0` or `2` so the
  script can continue to explanation output.
